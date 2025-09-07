'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { googleMapsLoader } from '@/lib/maps/loader';

interface MapsContextType {
  isLoaded: boolean;
  loadError: string | null;
}

const MapsContext = createContext<MapsContextType>({
  isLoaded: false,
  loadError: null,
});

export function useMaps() {
  const context = useContext(MapsContext);
  if (!context) {
    throw new Error('useMaps must be used within a MapsProvider');
  }
  return context;
}

interface MapsProviderProps {
  children: ReactNode;
}

export function MapsProvider({ children }: MapsProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setLoadError('Google Maps API key not configured');
      return;
    }

    async function loadMaps() {
      try {
        await googleMapsLoader.load({
          apiKey: apiKey!,
          libraries: ['places', 'geocoding'],
        });
        setIsLoaded(true);
        setLoadError(null);
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load Google Maps');
        setIsLoaded(false);
      }
    }

    loadMaps();
  }, []);

  return (
    <MapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </MapsContext.Provider>
  );
}