// ─── GeoJSON Base Types ──────────────────────────────────────────────
export interface GeoJsonFeature<P = Record<string, unknown>> {
  type: 'Feature';
  geometry: GeoJSON.Geometry;
  properties: P;
}

export interface GeoJsonFeatureCollection<P = Record<string, unknown>> {
  type: 'FeatureCollection';
  features: GeoJsonFeature<P>[];
}

// ─── Building Properties ─────────────────────────────────────────────
export type HeightSource = 'osm' | 'overture' | 'levels' | 'default';

export interface BuildingProperties {
  /** Final computed height in metres */
  height: number;
  /** Where the height value came from */
  height_source: HeightSource;
  /** OSM building type tag (e.g., "residential", "commercial") */
  building_type: string | null;
  /** Building name if available */
  name: string | null;
  /** Fill colour as [R, G, B, A] – computed at render time */
  fill_color?: [number, number, number, number];
}

// ─── POI Properties ──────────────────────────────────────────────────
export interface PoiProperties {
  /** Display name (empty string when unknown) */
  name: string;
  /** Broad display category: food | healthcare | education | finance | accommodation | culture | shopping | other */
  category: string;
  /** Raw OSM tag value, e.g. "restaurant" */
  amenity_tag: string;
}

// ─── Road Properties ─────────────────────────────────────────────────
export interface RoadProperties {
  /** Road name */
  name: string | null;
  /** Classification (motorway, primary, secondary, etc.) */
  road_class: string;
  /** Render width in metres */
  width: number;
}

// ─── Map View State ──────────────────────────────────────────────────
export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
  minZoom?: number;
  maxZoom?: number;
  transitionDuration?: number;
}

// ─── Pipeline Metadata ───────────────────────────────────────────────
export interface PipelineMetadata {
  city: string;
  generated_at: string;
  bounds: { west: number; south: number; east: number; north: number };
  center: { lon: number; lat: number };
  stats: {
    buildings_count: number;
    roads_count: number;
    avg_building_height: number;
    max_building_height: number;
    height_sources: Record<string, number>;
    pct_known_height: number;
  };
  data_sources: Record<string, string>;
  files: Record<string, string>;
}

// ─── Tooltip / Hover Info ────────────────────────────────────────────
export interface HoverInfo {
  x: number;
  y: number;
  object?: GeoJsonFeature<BuildingProperties | RoadProperties>;
  layer?: { id: string };
}

// ─── Map Store State ─────────────────────────────────────────────────
export interface MapStoreState {
  viewState: ViewState;
  setViewState: (vs: Partial<ViewState>) => void;

  showBuildings: boolean;
  toggleBuildings: () => void;

  showRoads: boolean;
  toggleRoads: () => void;

  showWireframe: boolean;
  toggleWireframe: () => void;

  showLandmarks: boolean;
  toggleLandmarks: () => void;

  /** [minHeight, maxHeight] filter applied to building layers (metres) */
  heightRange: [number, number];
  setHeightRange: (range: [number, number]) => void;

  /** Whether buildings are coloured by height gradient or by semantic type */
  colourMode: 'height' | 'type';
  setColourMode: (mode: 'height' | 'type') => void;

  /** Show the in-app FPS / frame-time performance overlay */
  showPerfOverlay: boolean;
  togglePerfOverlay: () => void;

  selectedBuilding: GeoJsonFeature<BuildingProperties> | null;
  setSelectedBuilding: (b: GeoJsonFeature<BuildingProperties> | null) => void;

  /** POI layer toggle */
  showPois: boolean;
  togglePois: () => void;

  /** Clicked POI for the detail panel */
  selectedPoi: GeoJsonFeature<PoiProperties> | null;
  setSelectedPoi: (p: GeoJsonFeature<PoiProperties> | null) => void;

  hoverInfo: HoverInfo | null;
  setHoverInfo: (info: HoverInfo | null) => void;
}
