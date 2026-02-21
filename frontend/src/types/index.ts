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
  building_count: number;
  road_count: number;
  bbox: [number, number, number, number];
  height_source_breakdown: Record<HeightSource, number>;
  pct_known_height: number;
  crs: string;
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

  selectedBuilding: GeoJsonFeature<BuildingProperties> | null;
  setSelectedBuilding: (b: GeoJsonFeature<BuildingProperties> | null) => void;

  hoverInfo: HoverInfo | null;
  setHoverInfo: (info: HoverInfo | null) => void;
}
