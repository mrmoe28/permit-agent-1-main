import { Client, PlaceInputType } from '@googlemaps/google-maps-services-js';
import { Address } from '@/types';

const client = new Client({});

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: Address;
  formatted: string;
  types: string[];
  website?: string;
  phone?: string;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

export class PlacesService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Google Places API key not configured');
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    try {
      const response = await client.placeDetails({
        params: {
          place_id: placeId,
          fields: [
            'place_id',
            'name',
            'formatted_address',
            'address_components',
            'geometry',
            'types',
            'website',
            'formatted_phone_number'
          ],
          key: this.apiKey,
        },
      });

      const result = response.data.result;
      if (!result) {
        return null;
      }

      const components = result.address_components || [];
      
      const address: Address = {
        street: this.getComponent(components, ['street_number', 'route']),
        city: this.getComponent(components, ['locality', 'sublocality']),
        state: this.getComponent(components, ['administrative_area_level_1'], true),
        zipCode: this.getComponent(components, ['postal_code']),
        county: this.getComponent(components, ['administrative_area_level_2']),
        latitude: result.geometry?.location?.lat,
        longitude: result.geometry?.location?.lng,
      };

      return {
        placeId: result.place_id || placeId,
        name: result.name || '',
        address,
        formatted: result.formatted_address || '',
        types: result.types || [],
        website: result.website,
        phone: result.formatted_phone_number,
      };
    } catch (error) {
      console.error('Place details error:', error);
      throw new Error('Failed to get place details');
    }
  }

  async searchPlaces(
    query: string,
    location?: { lat: number; lng: number },
    radius = 50000
  ): Promise<PlaceSuggestion[]> {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    try {
      const params: Record<string, unknown> = {
        input: query,
        inputtype: PlaceInputType.textQuery,
        key: this.apiKey,
        fields: ['place_id', 'name', 'formatted_address', 'types'],
      };

      if (location) {
        params.locationbias = `circle:${radius}@${location.lat},${location.lng}`;
      }

      const response = await client.findPlaceFromText({ params } as any);

      return response.data.candidates.map(candidate => ({
        placeId: candidate.place_id || '',
        description: candidate.formatted_address || candidate.name || '',
        mainText: candidate.name || '',
        secondaryText: candidate.formatted_address || '',
        types: candidate.types || [],
      }));
    } catch (error) {
      console.error('Places search error:', error);
      throw new Error('Failed to search places');
    }
  }

  async getGovernmentOffices(address: Address): Promise<PlaceSuggestion[]> {
    const searchTerms = [
      `${address.city} city hall`,
      `${address.city} building department`,
      `${address.city} planning department`,
      `${address.county} county building department`,
      `${address.county} county planning`,
    ].filter(term => !term.includes('undefined') && !term.includes('null'));

    const allResults: PlaceSuggestion[] = [];

    for (const term of searchTerms) {
      try {
        const results = await this.searchPlaces(term, {
          lat: address.latitude || 0,
          lng: address.longitude || 0,
        });
        allResults.push(...results);
      } catch (error) {
        console.warn(`Failed to search for: ${term}`, error);
      }
    }

    // Remove duplicates by place ID
    const uniqueResults = allResults.reduce((acc, current) => {
      const exists = acc.find(item => item.placeId === current.placeId);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, [] as PlaceSuggestion[]);

    return uniqueResults.slice(0, 10); // Limit results
  }

  private getComponent(
    components: Array<{ types: string[]; short_name: string; long_name: string }>,
    types: string[],
    shortName = false
  ): string {
    for (const component of components) {
      for (const type of types) {
        if (component.types.includes(type)) {
          return shortName ? component.short_name : component.long_name;
        }
      }
    }
    return '';
  }
}

export const placesService = new PlacesService();