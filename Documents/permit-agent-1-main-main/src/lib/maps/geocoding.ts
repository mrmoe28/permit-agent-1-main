import { Client } from '@googlemaps/google-maps-services-js';
import { Address } from '@/types';

const client = new Client({});

export interface GeocodeResult {
  address: Address;
  placeId: string;
  types: string[];
  formatted: string;
}

export interface ReverseGeocodeResult {
  address: Address;
  formatted: string;
}

export class GeocodingService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Google Maps API key not configured');
    }
  }

  async geocodeAddress(addressString: string): Promise<GeocodeResult | null> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await client.geocode({
        params: {
          address: addressString,
          key: this.apiKey,
        },
      });

      if (response.data.results.length === 0) {
        return null;
      }

      const result = response.data.results[0];
      const components = result.address_components;

      // Extract address components
      const address: Address = {
        street: this.getComponent(components, ['street_number', 'route']),
        city: this.getComponent(components, ['locality', 'sublocality']),
        state: this.getComponent(components, ['administrative_area_level_1'], true),
        zipCode: this.getComponent(components, ['postal_code']),
        county: this.getComponent(components, ['administrative_area_level_2']),
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
      };

      return {
        address,
        placeId: result.place_id,
        types: result.types,
        formatted: result.formatted_address,
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to geocode address');
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await client.reverseGeocode({
        params: {
          latlng: [lat, lng],
          key: this.apiKey,
        },
      });

      if (response.data.results.length === 0) {
        return null;
      }

      const result = response.data.results[0];
      const components = result.address_components;

      const address: Address = {
        street: this.getComponent(components, ['street_number', 'route']),
        city: this.getComponent(components, ['locality', 'sublocality']),
        state: this.getComponent(components, ['administrative_area_level_1'], true),
        zipCode: this.getComponent(components, ['postal_code']),
        county: this.getComponent(components, ['administrative_area_level_2']),
        latitude: lat,
        longitude: lng,
      };

      return {
        address,
        formatted: result.formatted_address,
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw new Error('Failed to reverse geocode coordinates');
    }
  }

  async validateAddress(address: Address): Promise<GeocodeResult | null> {
    const addressString = this.formatAddressString(address);
    return this.geocodeAddress(addressString);
  }

  private getComponent(
    components: unknown[],
    types: string[],
    shortName = false
  ): string {
    for (const component of components) {
      const comp = component as any;
      for (const type of types) {
        if (comp.types?.includes(type)) {
          return shortName ? comp.short_name : comp.long_name;
        }
      }
    }
    return '';
  }

  private formatAddressString(address: Address): string {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode
    ].filter(Boolean);
    
    return parts.join(', ');
  }
}

export const geocodingService = new GeocodingService();