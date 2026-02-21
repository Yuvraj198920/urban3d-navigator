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
export const METADATA_URL = `${DATA_BASE_URL}/metadata.json`;

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

// ─── Road widths by classification ───────────────────────────────────
export const ROAD_WIDTH_SCALE: Record<string, number> = {
  motorway: 6,
  trunk: 5,
  primary: 4,
  secondary: 3,
  tertiary: 2,
  residential: 1.5,
  service: 1,
  other: 0.8,
};

// ─── Layer IDs ───────────────────────────────────────────────────────
export const LAYER_IDS = {
  BUILDINGS_SOLID: 'buildings-solid',
  BUILDINGS_WIREFRAME: 'buildings-wireframe',
  ROADS: 'roads-path',
} as const;
