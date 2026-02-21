# Frontend Implementation Guide

## Project Structure

```
urban3d-navigator/
├── public/
│   └── data/                    # GeoJSON files (copied from ETL output)
│       └── bolzano_italy/
│           ├── buildings.geojson
│           ├── roads.geojson
│           └── metadata.json
├── src/
│   ├── components/
│   │   ├── Map3D.tsx           # Main deck.gl map component
│   │   ├── Controls.tsx        # Camera and layer controls
│   │   ├── InfoPanel.tsx       # Building/POI info display
│   │   └── LayerToggle.tsx     # Show/hide layers
│   ├── layers/
│   │   ├── buildingLayer.ts    # Building extrusion layer config
│   │   ├── roadLayer.ts        # Road network layer config
│   │   └── poiLayer.ts         # POI markers layer (Phase 2)
│   ├── hooks/
│   │   ├── useMapData.ts       # Data fetching hook
│   │   ├── useViewState.ts     # Camera state management
│   │   └── useLayerFilters.ts  # Filter state
│   ├── store/
│   │   └── mapStore.ts         # Zustand global state
│   ├── utils/
│   │   ├── colorSchemes.ts     # Height-based coloring
│   │   └── constants.ts        # Config constants
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   ├── App.tsx                 # Root component
│   └── main.tsx                # Entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Core Dependencies

### package.json

```json
{
  "name": "urban3d-navigator",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "deck.gl": "^9.0.0",
    "@deck.gl/react": "^9.0.0",
    "@deck.gl/layers": "^9.0.0",
    "@deck.gl/geo-layers": "^9.0.0",
    "maplibre-gl": "^4.1.0",
    "react-map-gl": "^7.1.0",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.28.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.4.2",
    "vite": "^5.2.0",
    "vitest": "^1.4.0",
    "@testing-library/react": "^14.2.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.5"
  }
}
```

---

## TypeScript Types

### src/types/index.ts

```typescript
// GeoJSON Feature types
export interface BuildingProperties {
  height: number;
  height_source: 'osm' | 'overture' | 'levels' | 'default';
  building_type: string;
  name?: string;
}

export interface RoadProperties {
  highway: string;
  road_class: 'major' | 'minor' | 'path' | 'other';
  name?: string;
  line_width: number;
}

export interface BuildingFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: BuildingProperties;
}

export interface RoadFeature {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: number[][];
  };
  properties: RoadProperties;
}

// Metadata from ETL pipeline
export interface CityMetadata {
  city: string;
  generated_at: string;
  bounds: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
  center: {
    lon: number;
    lat: number;
  };
  stats: {
    buildings_count: number;
    roads_count: number;
    avg_building_height: number;
    max_building_height: number;
  };
  files: {
    buildings: string;
    roads: string;
  };
}

// View state for deck.gl camera
export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
  transitionDuration?: number;
}

// Layer visibility state
export interface LayerVisibility {
  buildings: boolean;
  roads: boolean;
  pois: boolean;
}

// Filter state
export interface BuildingFilters {
  minHeight: number;
  maxHeight: number;
  buildingTypes: string[];
}
```

---

## State Management

### src/store/mapStore.ts

```typescript
import { create } from 'zustand';
import type { ViewState, LayerVisibility, BuildingFilters, CityMetadata } from '../types';

interface MapState {
  // Data
  metadata: CityMetadata | null;
  buildingsData: any; // GeoJSON FeatureCollection
  roadsData: any;
  
  // View state
  viewState: ViewState;
  
  // UI state
  layerVisibility: LayerVisibility;
  buildingFilters: BuildingFilters;
  selectedBuilding: any | null;
  
  // Actions
  setMetadata: (metadata: CityMetadata) => void;
  setBuildingsData: (data: any) => void;
  setRoadsData: (data: any) => void;
  setViewState: (viewState: Partial<ViewState>) => void;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  setFilters: (filters: Partial<BuildingFilters>) => void;
  selectBuilding: (building: any) => void;
}

export const useMapStore = create<MapState>((set) => ({
  // Initial state
  metadata: null,
  buildingsData: null,
  roadsData: null,
  viewState: {
    longitude: 11.35,
    latitude: 46.50,
    zoom: 15,
    pitch: 45,
    bearing: 0,
  },
  layerVisibility: {
    buildings: true,
    roads: true,
    pois: false,
  },
  buildingFilters: {
    minHeight: 0,
    maxHeight: 300,
    buildingTypes: [],
  },
  selectedBuilding: null,
  
  // Actions
  setMetadata: (metadata) => set({ metadata }),
  setBuildingsData: (data) => set({ buildingsData: data }),
  setRoadsData: (data) => set({ roadsData: data }),
  setViewState: (viewState) => set((state) => ({
    viewState: { ...state.viewState, ...viewState }
  })),
  toggleLayer: (layer) => set((state) => ({
    layerVisibility: {
      ...state.layerVisibility,
      [layer]: !state.layerVisibility[layer]
    }
  })),
  setFilters: (filters) => set((state) => ({
    buildingFilters: { ...state.buildingFilters, ...filters }
  })),
  selectBuilding: (building) => set({ selectedBuilding: building }),
}));
```

---

## Data Fetching

### src/hooks/useMapData.ts

```typescript
import { useQuery } from '@tanstack/react-query';
import type { CityMetadata } from '../types';

const DATA_BASE_URL = '/data'; // Served from public/ folder

export function useMapData(citySlug: string) {
  // Fetch metadata
  const { data: metadata, isLoading: metadataLoading } = useQuery({
    queryKey: ['metadata', citySlug],
    queryFn: async (): Promise<CityMetadata> => {
      const response = await fetch(`${DATA_BASE_URL}/${citySlug}/metadata.json`);
      if (!response.ok) throw new Error('Failed to fetch metadata');
      return response.json();
    },
  });

  // Fetch buildings
  const { data: buildings, isLoading: buildingsLoading } = useQuery({
    queryKey: ['buildings', citySlug],
    queryFn: async () => {
      const response = await fetch(`${DATA_BASE_URL}/${citySlug}/buildings.geojson`);
      if (!response.ok) throw new Error('Failed to fetch buildings');
      return response.json();
    },
    enabled: !!metadata, // Only fetch after metadata loads
  });

  // Fetch roads
  const { data: roads, isLoading: roadsLoading } = useQuery({
    queryKey: ['roads', citySlug],
    queryFn: async () => {
      const response = await fetch(`${DATA_BASE_URL}/${citySlug}/roads.geojson`);
      if (!response.ok) throw new Error('Failed to fetch roads');
      return response.json();
    },
    enabled: !!metadata,
  });

  return {
    metadata,
    buildings,
    roads,
    isLoading: metadataLoading || buildingsLoading || roadsLoading,
  };
}
```

---

## Layer Configurations

### src/layers/buildingLayer.ts

```typescript
import { GeoJsonLayer } from '@deck.gl/layers';
import type { BuildingFeature, BuildingFilters } from '../types';

export function createBuildingLayers(
  data: any,
  filters: BuildingFilters,
  onSelect: (building: any) => void
): GeoJsonLayer[] {
  // Split data: known-height buildings get solid fill, default-height get wireframe only
  // This is visually honest — solid default boxes at 9m create a misleading uniform cityscape
  const knownData = {
    ...data,
    features: data.features.filter(
      (f: BuildingFeature) => f.properties.height_source !== 'default'
    ),
  };
  const defaultData = {
    ...data,
    features: data.features.filter(
      (f: BuildingFeature) => f.properties.height_source === 'default'
    ),
  };

  const shared = {
    extruded: true,
    getElevation: (d: BuildingFeature) => d.properties.height,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 200, 0, 200] as [number, number, number, number],
    onClick: (info: any) => { if (info.object) onSelect(info.object); },
    getFilterValue: (d: BuildingFeature) => [d.properties.height],
    filterRange: [[filters.minHeight, filters.maxHeight]] as [number, number][],
    extensions: [],
    updateTriggers: { getFilterValue: [filters] },
  };

  return [
    // Known-height buildings: solid fill with height-based color
    new GeoJsonLayer({
      id: 'buildings-known',
      data: knownData,
      filled: true,
      wireframe: false,
      getFillColor: (d: BuildingFeature) =>
        heightToColor(d.properties.height, d.properties.height_source),
      getLineColor: [60, 60, 60],
      lineWidthMinPixels: 1,
      ...shared,
    }),
    // Default-height buildings: wireframe only, near-transparent fill
    new GeoJsonLayer({
      id: 'buildings-default',
      data: defaultData,
      filled: true,
      wireframe: true,
      getFillColor: [120, 120, 120, 40],
      getLineColor: [100, 100, 100, 160],
      lineWidthMinPixels: 1,
      ...shared,
    }),
  ];
}

// Height-based color gradient
function heightToColor(height: number, heightSource: string): [number, number, number, number] {
  // Unknown-height buildings: near-transparent fill, border visible in Controls
  if (heightSource === 'default') return [120, 120, 120, 40];
  // Gradient: Blue (low) → Green (mid) → Red (high)
  const normalized = Math.min(height / 100, 1); // Normalize to 0-1 (100m = high)
  
  if (normalized < 0.33) {
    // Blue → Cyan
    const t = normalized / 0.33;
    return [
      Math.floor(70 + t * 30),   // R: 70 → 100
      Math.floor(130 + t * 70),  // G: 130 → 200
      Math.floor(180 + t * 20),  // B: 180 → 200
      200
    ];
  } else if (normalized < 0.66) {
    // Cyan → Yellow
    const t = (normalized - 0.33) / 0.33;
    return [
      Math.floor(100 + t * 155), // R: 100 → 255
      Math.floor(200 + t * 55),  // G: 200 → 255
      Math.floor(200 - t * 200), // B: 200 → 0
      200
    ];
  } else {
    // Yellow → Red
    const t = (normalized - 0.66) / 0.34;
    return [
      255,                       // R: 255
      Math.floor(255 - t * 100), // G: 255 → 155
      0,                         // B: 0
      200
    ];
  }
}
```

### src/layers/roadLayer.ts

```typescript
import { GeoJsonLayer } from '@deck.gl/layers';
import type { RoadFeature } from '../types';

export function createRoadLayer(data: any) {
  return new GeoJsonLayer({
    id: 'roads',
    data,
    
    // Geometry
    filled: false,
    stroked: true,
    
    // Styling by road class
    getLineColor: (d: RoadFeature) => {
      const colors = {
        major: [255, 200, 100, 255],   // Orange
        minor: [200, 200, 200, 200],   // Light gray
        path: [150, 150, 150, 150],    // Dark gray
        other: [120, 120, 120, 120],   // Very dark gray
      };
      return colors[d.properties.road_class] || colors.other;
    },
    
    getLineWidth: (d: RoadFeature) => d.properties.line_width,
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 1,
    lineWidthMaxPixels: 5,
    
    // Interaction
    pickable: true,
    autoHighlight: true,
  });
}
```

---

## Main Map Component

### src/components/Map3D.tsx

```typescript
import React, { useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import { useMapStore } from '../store/mapStore';
import { createBuildingLayers } from '../layers/buildingLayer';
import { createRoadLayer } from '../layers/roadLayer';
import type { ViewState } from '../types';

const MAPLIBRE_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const TERRAIN_SOURCE = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

// Cinematic intro: slow orbit on first load, then hand control to user
function useCinematicIntro(setViewState: (vs: Partial<ViewState>) => void) {
  React.useEffect(() => {
    let frame = 0;
    const startBearing = 0;
    const duration = 5000; // ms
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setViewState({ bearing: startBearing + t * 60, pitch: 20 + t * 25 });
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []); // runs once on mount
}

export function Map3D() {
  const {
    viewState,
    setViewState,
    buildingsData,
    roadsData,
    layerVisibility,
    buildingFilters,
    selectBuilding,
  } = useMapStore();

  useCinematicIntro(setViewState);

  // Create layers
  const layers = useMemo(() => {
    const layerArray = [];

    if (roadsData && layerVisibility.roads) {
      layerArray.push(createRoadLayer(roadsData));
    }

    if (buildingsData && layerVisibility.buildings) {
      layerArray.push(
        ...createBuildingLayers(buildingsData, buildingFilters, selectBuilding)
      );
    }

    return layerArray;
  }, [buildingsData, roadsData, layerVisibility, buildingFilters, selectBuilding]);

  return (
    <DeckGL
      initialViewState={viewState}
      controller={true}
      onViewStateChange={({ viewState }) => setViewState(viewState)}
      layers={layers}
      // Landmark height annotation — trust anchor for data quality
      // Bolzano Cathedral: 65m spire, should appear visually as the tallest feature
      // Rendered via a TextLayer added to the layers array in production
      getTooltip={({ object }) => {
        if (object?.properties) {
          const props = object.properties;
          return {
            html: `
              <div style="padding: 8px; background: rgba(0,0,0,0.8); color: white; border-radius: 4px;">
                <strong>${props.name || 'Building'}</strong><br/>
                Height: ${props.height?.toFixed(1) || '?'}m
                  (${props.height_source === 'default' ? 'estimated' : props.height_source || 'unknown'})<br/>
                Type: ${props.building_type || 'Unknown'}
              </div>
            `,
          };
        }
        return null;
      }}
    >
      <Map
        mapLib={import('maplibre-gl')}
        mapStyle={MAPLIBRE_STYLE}
        styleDiffing={false}
        terrain={{ source: 'terrain-dem', exaggeration: 1.2 }}
        onLoad={(e) => {
          const map = e.target;
          // Add terrain DEM source — makes Bolzano valley + Alpine backdrop visible
          map.addSource('terrain-dem', {
            type: 'raster-dem',
            tiles: [TERRAIN_SOURCE],
            tileSize: 256,
            encoding: 'terrarium',
          });
        }}
      />
    </DeckGL>
  );
}
```

---

## Controls Component

### src/components/Controls.tsx

```typescript
import React from 'react';
import { useMapStore } from '../store/mapStore';

export function Controls() {
  const { viewState, setViewState, layerVisibility, toggleLayer, metadata } = useMapStore();

  const resetCamera = () => {
    if (metadata) {
      setViewState({
        longitude: metadata.center.lon,
        latitude: metadata.center.lat,
        zoom: 15,
        pitch: 45,
        bearing: 0,
        transitionDuration: 1000,
      });
    }
  };

  const togglePitch = () => {
    setViewState({
      pitch: viewState.pitch > 0 ? 0 : 45,
      transitionDuration: 500,
    });
  };

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 20,
      background: 'white',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      minWidth: '200px',
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
        Layers
      </h3>
      
      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>
        <input
          type="checkbox"
          checked={layerVisibility.buildings}
          onChange={() => toggleLayer('buildings')}
        />
        {' '}Buildings
      </label>
      
      <label style={{ display: 'block', marginBottom: '16px', fontSize: '13px' }}>
        <input
          type="checkbox"
          checked={layerVisibility.roads}
          onChange={() => toggleLayer('roads')}
        />
        {' '}Roads
      </label>

      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
        Camera
      </h3>
      
      <button
        onClick={resetCamera}
        style={{
          width: '100%',
          padding: '8px',
          marginBottom: '8px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          background: 'white',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        Reset View
      </button>
      
      <button
        onClick={togglePitch}
        style={{
          width: '100%',
          padding: '8px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          background: 'white',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        {viewState.pitch > 0 ? '2D View' : '3D View'}
      </button>

      {metadata && (
        <div style={{ marginTop: '16px', fontSize: '11px', color: '#666' }}>
          <strong>{metadata.city}</strong><br/>
          Buildings: {metadata.stats.buildings_count.toLocaleString()}<br/>
          Avg Height: {metadata.stats.avg_building_height.toFixed(1)}m
        </div>
      )}
    </div>
  );
}
```

---

## Main App

### src/App.tsx

```typescript
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Map3D } from './components/Map3D';
import { Controls } from './components/Controls';
import { useMapData } from './hooks/useMapData';
import { useMapStore } from './store/mapStore';

const queryClient = new QueryClient();

function MapApp() {
  const { metadata, buildings, roads, isLoading } = useMapData('bolzano_italy');
  const { setMetadata, setBuildingsData, setRoadsData, setViewState } = useMapStore();

  // Update store when data loads
  useEffect(() => {
    if (metadata) {
      setMetadata(metadata);
      setViewState({
        longitude: metadata.center.lon,
        latitude: metadata.center.lat,
      });
    }
  }, [metadata, setMetadata, setViewState]);

  useEffect(() => {
    if (buildings) setBuildingsData(buildings);
  }, [buildings, setBuildingsData]);

  useEffect(() => {
    if (roads) setRoadsData(roads);
  }, [roads, setRoadsData]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '18px',
      }}>
        Loading map data...
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Map3D />
      <Controls />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MapApp />
    </QueryClientProvider>
  );
}
```

---

## Build Configuration

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'maplibre-gl': 'maplibre-gl/dist/maplibre-gl.js',
    },
  },
  optimizeDeps: {
    include: ['maplibre-gl'],
  },
});
```

---

## Running the App

```bash
# Install dependencies
pnpm install

# Copy GeoJSON data from ETL output
cp -r ../python-pipeline/data/processed/bolzano_italy public/data/

# Start dev server
pnpm dev

# Open http://localhost:5173
```

---

## Performance Optimization Checklist

- [ ] Use `updateTriggers` to control when layers re-render
- [ ] Keep layer IDs consistent across renders (deck.gl auto-caches)
- [ ] Filter data on GPU (shader-based) not CPU (JavaScript)
- [ ] Load data once, store in Zustand, reference by ID
- [ ] Use `pickable: false` on non-interactive layers
- [ ] Enable `autoHighlight` only when needed
- [ ] Implement viewport culling for large datasets (Phase 2)

---

**Next Document**: `05-sprint-plan.md`

**Document Version**: 1.2  
**Last Updated**: February 21, 2026  
**Owner**: Frontend Developer