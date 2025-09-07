'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import usePlacesAutocomplete, { getGeocode } from 'use-places-autocomplete';
import { useMaps } from '@/components/providers/maps-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Loader2, Navigation, Check } from 'lucide-react';
import { SearchRequest, SearchResponse } from '@/types';

const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters').toUpperCase(),
  zipCode: z.string().min(5, 'ZIP code must be at least 5 digits'),
  county: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface EnhancedAddressSearchProps {
  onSearchResults: (results: SearchResponse, address?: string) => void;
  onSearchError: (error: string) => void;
}

export function EnhancedAddressSearch({ onSearchResults, onSearchError }: EnhancedAddressSearchProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearched, setLastSearched] = useState<string>('');
  const [useAutocomplete, setUseAutocomplete] = useState(false); // Default to false until maps load
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { isLoaded: mapsLoaded, loadError } = useMaps();

  // Only enable autocomplete if maps are loaded
  const enableAutocomplete = mapsLoaded && useAutocomplete && !loadError;

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      types: ['address'],
      componentRestrictions: { country: 'us' },
    },
    debounce: 300,
    initOnMount: false, // Don't initialize until we explicitly enable it
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue: setFormValue,
    watch,
    reset,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      county: '',
    },
  });

  // Debug logging to see form values
  const formValues = watch();
  console.log('Form values:', formValues);

  const handlePlaceSelect = useCallback(async (description: string) => {
    setValue(description, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address: description });
      if (results.length > 0) {
        const result = results[0];
        
        // Parse address components
        const components = result.address_components;
        
        const getComponent = (types: string[], shortName = false) => {
          const component = components.find((comp: any) => 
            types.some(type => comp.types.includes(type))
          );
          return component ? (shortName ? component.short_name : component.long_name) : '';
        };

        const streetNumber = getComponent(['street_number']);
        const route = getComponent(['route']);
        const street = `${streetNumber} ${route}`.trim();

        setFormValue('street', street);
        setFormValue('city', getComponent(['locality', 'sublocality']));
        setFormValue('state', getComponent(['administrative_area_level_1'], true));
        setFormValue('zipCode', getComponent(['postal_code']));
        setFormValue('county', getComponent(['administrative_area_level_2']));
      }
    } catch (error) {
      console.error('Error parsing address:', error);
      onSearchError('Failed to parse selected address');
    }
  }, [setValue, clearSuggestions, setFormValue, onSearchError]);

  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      onSearchError('Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get address
          const response = await fetch('/api/geocode/reverse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.address) {
              const address = data.address;
              setFormValue('street', address.street || '');
              setFormValue('city', address.city || '');
              setFormValue('state', address.state || '');
              setFormValue('zipCode', address.zipCode || '');
              setFormValue('county', address.county || '');
              setValue(data.formatted || '', false);
            }
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          onSearchError('Failed to get address from location');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        onSearchError('Failed to get current location');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, [setFormValue, setValue, onSearchError]);

  const onSubmit = async (data: AddressFormData) => {
    setIsSearching(true);
    
    try {
      const searchRequest: SearchRequest = {
        address: data,
        permitTypes: [],
        includeNeighboringJurisdictions: false,
      };

      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (result.success && result.data) {
        const addressString = `${data.street}, ${data.city}, ${data.state} ${data.zipCode}`;
        setLastSearched(addressString);
        onSearchResults(result.data, addressString);
      } else {
        onSearchError(result.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        onSearchError('Search timed out after 2 minutes. Government websites may be slow - please try again.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        onSearchError('Network connection error. Please check your internet connection and try again.');
      } else {
        onSearchError('Network error occurred. Please try again.');
      }
    } finally {
      setIsSearching(false);
    }
  };


  const toggleAutocomplete = () => {
    if (!mapsLoaded) {
      onSearchError('Google Maps is not available. Using manual address entry.');
      return;
    }
    setUseAutocomplete(!useAutocomplete);
    if (useAutocomplete) {
      clearSuggestions();
      setValue('', false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-blue-600" />
          Find Permit Information
        </h2>
        <p className="text-gray-600 mt-2">
          Enter a property address to discover local permit requirements, fees, and application procedures.
        </p>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleAutocomplete}
              className={`flex items-center gap-2 text-sm ${
                mapsLoaded ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 cursor-not-allowed'
              }`}
              disabled={!mapsLoaded}
            >
              {useAutocomplete && mapsLoaded && ready && <Check className="h-4 w-4" />}
              Google Autocomplete {!mapsLoaded && '(Not Available)'}
            </button>
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Navigation className="h-4 w-4 mr-2" />
            )}
            Current Location
          </Button>
        </div>
      </div>

      <form key="address-search-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
        <div className="grid grid-cols-1 gap-4">
          {enableAutocomplete && ready ? (
            <div className="relative">
              <label htmlFor="autocomplete" className="block text-sm font-medium text-gray-700 mb-1">
                Search Address
              </label>
              <Input
                id="autocomplete"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Start typing an address..."
                className="w-full"
                autoComplete="off"
              />
              
              {status === 'OK' && data.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {data.map((suggestion) => (
                    <button
                      key={suggestion.place_id}
                      type="button"
                      onClick={() => handlePlaceSelect(suggestion.description)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    >
                      <div className="font-medium">{suggestion.structured_formatting?.main_text}</div>
                      <div className="text-sm text-gray-600">
                        {suggestion.structured_formatting?.secondary_text}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <Input
                id="street"
                {...register('street')}
                placeholder="123 Peachtree Street"
                className="w-full"
                autoComplete="off"
              />
              {errors.street && (
                <p className="text-red-600 text-sm mt-1">{errors.street.message}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <Input
                id="city"
                {...register('city')}
                placeholder="Atlanta"
                className="w-full"
                autoComplete="off"
              />
              {errors.city && (
                <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <Input
                id="state"
                {...register('state')}
                placeholder="GA"
                maxLength={2}
                className="w-full uppercase"
                autoComplete="off"
              />
              {errors.state && (
                <p className="text-red-600 text-sm mt-1">{errors.state.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code
              </label>
              <Input
                id="zipCode"
                {...register('zipCode')}
                placeholder="30303"
                className="w-full"
                autoComplete="off"
              />
              {errors.zipCode && (
                <p className="text-red-600 text-sm mt-1">{errors.zipCode.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-1">
                County (Optional)
              </label>
              <Input
                id="county"
                {...register('county')}
                placeholder="Fulton"
                className="w-full"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            className="text-gray-600 hover:text-gray-800"
          >
            Clear Form
          </Button>
          
          <Button
            type="submit"
            disabled={isSearching || (enableAutocomplete && !ready)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search Permits
              </>
            )}
          </Button>
        </div>
      </form>

      {lastSearched && !isSearching && (
        <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
          <p className="text-green-700 text-sm">
            Last searched: <span className="font-medium">{lastSearched}</span>
          </p>
        </div>
      )}

      {isSearching && (
        <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-center">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-3" />
            <div>
              <p className="text-blue-800 font-medium">Searching for permit information...</p>
              <p className="text-blue-600 text-sm mt-1">
                This may take up to 2 minutes as we discover and analyze local government websites.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}