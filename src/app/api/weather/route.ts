import { NextRequest, NextResponse } from "next/server";
import {
  fetchNormalizedWeather,
  DEFAULT_NER_LOCATION,
  NER_LOCATIONS,
} from "@/lib/services/weather.service";
import { WeatherApiResponse } from "@/types/weather";

export async function GET(request: NextRequest): Promise<NextResponse<WeatherApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);

    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");
    const locParam = searchParams.get("loc");

    let lat = DEFAULT_NER_LOCATION.latitude;
    let lon = DEFAULT_NER_LOCATION.longitude;
    let locationName = DEFAULT_NER_LOCATION.name;

    // Check if preset location name was passed (e.g. loc=gangtok or loc=tawang)
    if (locParam && NER_LOCATIONS[locParam.toLowerCase()]) {
      const preset = NER_LOCATIONS[locParam.toLowerCase()];
      lat = preset.latitude;
      lon = preset.longitude;
      locationName = preset.name;
    } else if (latParam && lonParam) {
      const parsedLat = parseFloat(latParam);
      const parsedLon = parseFloat(lonParam);

      if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
        lat = parsedLat;
        lon = parsedLon;
        locationName = searchParams.get("name") || `Coordinates (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
      }
    }

    const weatherData = await fetchNormalizedWeather(lat, lon, locationName);

    return NextResponse.json(
      {
        success: true,
        data: weatherData,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error: unknown) {
    console.error("[API /api/weather] Handler error:", error);
    return NextResponse.json(
      {
        success: false,
        data: fetchNormalizedWeather() as unknown as import("@/types/weather").NormalizedWeatherResponse,
        error: "Failed to process weather request",
      },
      { status: 500 }
    );
  }
}
