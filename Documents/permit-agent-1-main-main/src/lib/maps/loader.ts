'use client';

interface GoogleMapsLoaderOptions {
  apiKey: string;
  libraries?: string[];
  version?: string;
}

class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private loaded = false;
  private loading = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  public async load(options: GoogleMapsLoaderOptions): Promise<void> {
    if (this.loaded) {
      return Promise.resolve();
    }

    if (this.loading && this.loadPromise) {
      return this.loadPromise;
    }

    this.loading = true;
    this.loadPromise = this.loadGoogleMaps(options);

    try {
      await this.loadPromise;
      this.loaded = true;
    } catch (error) {
      this.loading = false;
      this.loadPromise = null;
      throw error;
    } finally {
      this.loading = false;
    }
  }

  private loadGoogleMaps(options: GoogleMapsLoaderOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Google Maps can only be loaded in browser environment'));
        return;
      }

      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      const { apiKey, libraries = ['places'], version = 'weekly' } = options;

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}&v=${version}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        if (window.google && window.google.maps) {
          resolve();
        } else {
          reject(new Error('Google Maps failed to load'));
        }
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Maps script'));
      };

      document.head.appendChild(script);

      // Set up global callback for initialization
      window.initGoogleMaps = () => {
        resolve();
      };
    });
  }

  public isLoaded(): boolean {
    return this.loaded && typeof window !== 'undefined' && window.google && window.google.maps;
  }
}

export const googleMapsLoader = GoogleMapsLoader.getInstance();

// Type declarations for Google Maps
declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}