import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MappingService {
  private apiKey: string;
  private baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // In a real app, get these from config
    this.apiKey = this.configService.get<string>('MAPPING_API_KEY');
    this.baseUrl = '[https://api.mapbox.com](https://api.mapbox.com)'; // Example for Mapbox
  }

  /**
   * Returns an array of indices representing the optimized order.
   * e.g., for addresses [A, B, C], could return [0, 2, 1] meaning A -> C -> B.
   */
  async getOptimizedRoute(addresses: string[]): Promise<number[]> {
    // This is a placeholder for a real VRP (Vehicle Routing Problem) solver call.
    // Real implementation would call Mapbox Optimization API or Google Maps Directions API.
    console.log('Optimizing route for addresses:', addresses);
    
    // For demonstration, we'll just reverse the order.
    // A real implementation would be a complex API call.
    /*
    const coordinates = await Promise.all(addresses.map(addr => this.geocode(addr)));
    const endpoint = `${this.baseUrl}/optimized-trips/v1/mapbox/driving/${coordinates.join(';')}?access_token=${this.apiKey}&roundtrip=false&source=first`;
    const response = await firstValueFrom(this.httpService.get(endpoint));
    return response.data.trips[0].legs.map(leg => leg.source.waypoint_index); // Simplified example
    */

    // Placeholder logic:
    const indices = addresses.map((_, i) => i);
    return indices.reverse(); 
  }

  // Placeholder for geocoding an address to coordinates
  async geocode(address: string): Promise<string> {
    // const endpoint = `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${this.apiKey}`;
    // const response = await firstValueFrom(this.httpService.get(endpoint));
    // const [lon, lat] = response.data.features[0].center;
    // return `${lon},${lat}`;
    return "0,0"; // Placeholder
  }
} 