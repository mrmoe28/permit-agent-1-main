import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { geocodingService } from '@/lib/maps/geocoding';
import { ApiResponse } from '@/types';

const reverseGeocodeSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const { lat, lng } = reverseGeocodeSchema.parse(body);
    
    // Perform reverse geocoding
    const result = await geocodingService.reverseGeocode(lat, lng);
    
    if (!result) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Could not reverse geocode the provided coordinates',
        timestamp: new Date(),
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<typeof result>>({
      success: true,
      data: result,
      timestamp: new Date(),
    });

  } catch (error) {
    console.error('Reverse geocoding API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: `Invalid coordinates: ${error.errors.map(e => e.message).join(', ')}`,
        timestamp: new Date(),
      }, { status: 400 });
    }

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error during reverse geocoding',
      timestamp: new Date(),
    }, { status: 500 });
  }
}