// ─── Environment Variables ────────────────────────────────────────────
export const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY as string;
export const DATA_BASE_URL = (import.meta.env.VITE_DATA_BASE_URL as string) ?? '/data/bolzano_italy';

// ─── Map Defaults ────────────────────────────────────────────────────
/** Bolzano, Italy – Alpine valley overview on load.
 *  Zoom 11.5 reveals the surrounding Dolomites; pitch 65 + bearing 0
 *  (facing north) makes the Alps rise dramatically behind the city. */
export const INITIAL_VIEW_STATE = {
  longitude: 11.3548,
  latitude: 46.47,
  zoom: 11.5,
  pitch: 65,
  bearing: 0,
  minZoom: 8,
  maxZoom: 20,
} as const;

// ─── Tile URLs ───────────────────────────────────────────────────────
// OpenFreeMap: free, no API key, no domain restrictions — works on localhost.
// MapTiler streets-v2 returns 403 on localhost due to key domain restrictions.
// Switch back to MapTiler once the key's allowed referrers include localhost.
export const BASEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
// MapTiler key still used for terrain DEM tiles (Sprint 3 feature).
export const TERRAIN_DEM_URL = `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_API_KEY}`;
// AWS Terrain Tiles — Terrarium encoding, free, no API key required.
// Used for MapLibre GL terrain (raster-dem source) to render Alpine topography.
export const AWS_TERRAIN_TILES_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

// ─── Data Endpoints ──────────────────────────────────────────────────
export const BUILDINGS_URL = `${DATA_BASE_URL}/buildings.geojson`;
export const ROADS_URL = `${DATA_BASE_URL}/roads.geojson`;
export const POIS_URL = `${DATA_BASE_URL}/pois.geojson`;
export const METADATA_URL = `${DATA_BASE_URL}/metadata.json`;

// ─── POI Category Colours ──────────────────────────────────────────────────────────
/** RGBA colour per POI category, matching the ETL classification. */
export const POI_CATEGORY_COLORS: Record<string, [number, number, number, number]> = {
  food:          [255, 140,   0, 230],  // amber
  healthcare:    [220,  50,  50, 230],  // red
  education:     [ 70, 130, 180, 230],  // steel blue
  finance:       [ 46, 139,  87, 230],  // sea green
  accommodation: [148, 103, 189, 230],  // purple
  culture:       [186,  85, 211, 230],  // medium orchid
  shopping:      [ 31, 119, 180, 230],  // blue
  other:         [140, 140, 140, 230],  // grey
};

/** Emoji label shown in the POI detail panel per category. */
export const POI_CATEGORY_EMOJI: Record<string, string> = {
  food:          '🍴',
  healthcare:    '🏥',
  education:     '🏫',
  finance:       '🏦',
  accommodation: '🏨',
  culture:       '🎭',
  shopping:      '🛍️',
  other:         '📍',
};

// ─── Height → Color Scale ────────────────────────────────────────────
/** Low buildings → cool blue, mid → green/yellow, tall → red */
export const HEIGHT_COLOR_SCALE: [number, [number, number, number, number]][] = [
  [0, [65, 182, 196, 220]],
  [10, [127, 205, 187, 220]],
  [20, [199, 233, 180, 220]],
  [40, [255, 255, 204, 220]],
  [60, [254, 178, 76, 220]],
  [100, [253, 141, 60, 220]],
  [150, [240, 59, 32, 220]],
  [300, [189, 0, 38, 220]],
];

// ─── Building Type → Color Map ───────────────────────────────────────
/** Semantic colours keyed by OSM building_type tag value. */
export const BUILDING_TYPE_COLORS: Record<string, [number, number, number, number]> = {
  // Residential — warm amber
  apartments:         [255, 160,  64, 220],
  residential:        [255, 160,  64, 220],
  house:              [255, 160,  64, 220],
  detached:           [255, 160,  64, 220],
  semidetached_house: [255, 160,  64, 220],
  dormitory:          [255, 160,  64, 220],
  villa:              [255, 160,  64, 220],
  // Commercial — vivid orange
  commercial:         [255, 107,  30, 220],
  retail:             [255, 107,  30, 220],
  supermarket:        [255, 107,  30, 220],
  hotel:              [255, 107,  30, 220],
  bank:               [255, 107,  30, 220],
  kiosk:              [255, 107,  30, 220],
  // Office — steel blue
  office:             [ 65, 120, 220, 220],
  // Industrial / utility — slate grey
  industrial:         [120, 120, 130, 220],
  warehouse:          [120, 120, 130, 220],
  shed:               [120, 120, 130, 220],
  garage:             [120, 120, 130, 220],
  garages:            [120, 120, 130, 220],
  service:            [120, 120, 130, 220],
  // Public / civic — teal
  school:             [ 32, 178, 170, 220],
  university:         [ 32, 178, 170, 220],
  hospital:           [ 32, 178, 170, 220],
  civic:              [ 32, 178, 170, 220],
  public:             [ 32, 178, 170, 220],
  government:         [ 32, 178, 170, 220],
  fire_station:       [ 32, 178, 170, 220],
  sports_centre:      [ 32, 178, 170, 220],
  kindergarten:       [ 32, 178, 170, 220],
  train_station:      [ 32, 178, 170, 220],
  transportation:     [ 32, 178, 170, 220],
  parking:            [ 32, 178, 170, 220],
  grandstand:         [ 32, 178, 170, 220],
  bleachers:          [ 32, 178, 170, 220],
  // Religious — gold
  church:             [255, 200,   0, 220],
  chapel:             [255, 200,   0, 220],
  cathedral:          [255, 200,   0, 220],
  convent:            [255, 200,   0, 220],
  // Agricultural — muted green
  farm:               [100, 180,  80, 220],
  farm_auxiliary:     [100, 180,  80, 220],
  greenhouse:         [100, 180,  80, 220],
  glasshouse:         [100, 180,  80, 220],
};

/** Fallback colour for "yes", null, or unrecognised types. */
export const BUILDING_TYPE_DEFAULT_COLOR: [number, number, number, number] = [150, 160, 170, 220];

/** Category rows shown in the type legend, in display order. */
export const BUILDING_TYPE_CATEGORIES: {
  label: string;
  color: [number, number, number, number];
}[] = [
  { label: 'Residential',  color: [255, 160,  64, 220] },
  { label: 'Commercial',   color: [255, 107,  30, 220] },
  { label: 'Office',       color: [ 65, 120, 220, 220] },
  { label: 'Industrial',   color: [120, 120, 130, 220] },
  { label: 'Public/Civic', color: [ 32, 178, 170, 220] },
  { label: 'Religious',    color: [255, 200,   0, 220] },
  { label: 'Agricultural', color: [100, 180,  80, 220] },
  { label: 'Other',        color: [150, 160, 170, 220] },
];

// ─── Road widths by classification ───────────────────────────────────
// Keys match the ETL pipeline road_class field: major | minor | other | path
export const ROAD_WIDTH_SCALE: Record<string, number> = {
  major: 6,
  minor: 3,
  other: 1.5,
  path: 1,
};

// ─── Layer IDs ───────────────────────────────────────────────────────
export const LAYER_IDS = {
  BUILDINGS_SOLID: 'buildings-solid',
  BUILDINGS_WIREFRAME: 'buildings-wireframe',
  ROADS: 'roads-path',
} as const;
