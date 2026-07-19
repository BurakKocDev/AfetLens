export const dynamic = "force-dynamic";

type UsgsFeature = {
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    time: number;
    updated: number;
    url: string;
    status: string;
  };
  geometry: {
    coordinates: [number, number, number];
  };
};

export async function GET() {
  const params = new URLSearchParams({
    format: "geojson",
    starttime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    minlatitude: "34.5",
    maxlatitude: "43.0",
    minlongitude: "24.0",
    maxlongitude: "46.5",
    orderby: "time",
    limit: "600",
  });

  try {
    const response = await fetch(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`,
      {
        headers: { Accept: "application/geo+json" },
      },
    );

    if (!response.ok) {
      throw new Error(`USGS responded with ${response.status}`);
    }

    const payload = (await response.json()) as {
      metadata: { generated: number; count: number };
      features: UsgsFeature[];
    };

    const earthquakes = payload.features.map((feature) => ({
      id: feature.id,
      magnitude: feature.properties.mag ?? 0,
      location: feature.properties.place ?? "Konum bilgisi yok",
      occurredAt: new Date(feature.properties.time).toISOString(),
      updatedAt: new Date(feature.properties.updated).toISOString(),
      longitude: feature.geometry.coordinates[0],
      latitude: feature.geometry.coordinates[1],
      depthKm: feature.geometry.coordinates[2],
      sourceUrl: feature.properties.url,
      status: feature.properties.status,
      source: "USGS",
    }));

    return Response.json({
      earthquakes,
      generatedAt: new Date(payload.metadata.generated).toISOString(),
      source: "USGS Earthquake Catalog",
      isFallback: false,
    });
  } catch {
    return Response.json(
      {
        message: "Canlı deprem akışına şu anda ulaşılamıyor.",
      },
      { status: 503 },
    );
  }
}
