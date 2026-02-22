import { GeoJsonLayer } from '@deck.gl/layers';
import type { GeoJsonFeatureCollection, BuildingProperties } from '../types';
import {
  LAYER_IDS,
  HEIGHT_COLOR_SCALE,
  BUILDING_TYPE_COLORS,
  BUILDING_TYPE_DEFAULT_COLOR,
} from '../utils/constants';

/**
 * Map a building height to an RGBA colour using the HEIGHT_COLOR_SCALE.
 * Uses linear interpolation between the two nearest breakpoints.
 */
export function heightToColor(
  height: number,
  scale: typeof HEIGHT_COLOR_SCALE,
): [number, number, number, number] {
  if (height <= scale[0][0]) return scale[0][1];
  if (height >= scale[scale.length - 1][0]) return scale[scale.length - 1][1];

  for (let i = 0; i < scale.length - 1; i++) {
    const [h0, c0] = scale[i];
    const [h1, c1] = scale[i + 1];
    if (height >= h0 && height < h1) {
      const t = (height - h0) / (h1 - h0);
      return [
        Math.round(c0[0] + t * (c1[0] - c0[0])),
        Math.round(c0[1] + t * (c1[1] - c0[1])),
        Math.round(c0[2] + t * (c1[2] - c0[2])),
        Math.round(c0[3] + t * (c1[3] - c0[3])),
      ];
    }
  }
  return scale[scale.length - 1][1];
}

/**
 * Maps a building's OSM type tag to a semantic RGBA colour.
 * Types not listed in BUILDING_TYPE_COLORS fall back to a neutral grey.
 */
export function typeToColor(
  buildingType: string | null,
): [number, number, number, number] {
  if (!buildingType) return BUILDING_TYPE_DEFAULT_COLOR;
  return BUILDING_TYPE_COLORS[buildingType] ?? BUILDING_TYPE_DEFAULT_COLOR;
}

/**
 * Filters a feature collection to buildings within [minH, maxH] metres.
 * Pre-filtering on the JS side avoids shader complexity for our ~600 feature dataset.
 */
function filterByHeight(
  data: GeoJsonFeatureCollection<BuildingProperties>,
  [minH, maxH]: [number, number],
): GeoJsonFeatureCollection<BuildingProperties> {
  if (minH === 0 && maxH === 300) return data; // fast-path: no filter
  return {
    ...data,
    features: data.features.filter((f) => {
      const h = f.properties.height;
      if (h == null || isNaN(h)) return false; // skip null/NaN heights
      return h >= minH && h <= maxH;
    }),
  };
}

/**
 * Solid extruded building layer – coloured either by height gradient or
 * by semantic building type depending on `colourMode`.
 */
export function createBuildingSolidLayer(
  data: GeoJsonFeatureCollection<BuildingProperties> | null,
  heightRange: [number, number] = [0, 300],
  colourMode: 'height' | 'type' = 'height',
) {
  if (!data) return null;
  const filtered = filterByHeight(data, heightRange);

  return new GeoJsonLayer({
    id: LAYER_IDS.BUILDINGS_SOLID,
    data: filtered as unknown as GeoJsonLayer['props']['data'],
    extruded: true,
    filled: true,
    wireframe: false,
    getElevation: (f: { properties: BuildingProperties }) => f.properties.height,
    getFillColor: (f: { properties: BuildingProperties }) =>
      colourMode === 'type'
        ? typeToColor(f.properties.building_type)
        : heightToColor(f.properties.height, HEIGHT_COLOR_SCALE),
    getLineColor: [80, 80, 80, 100],
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 0, 120],
    material: {
      ambient: 0.3,
      diffuse: 0.8,
      shininess: 32,
      specularColor: [200, 200, 200],
    },
    updateTriggers: {
      getFillColor: [colourMode, HEIGHT_COLOR_SCALE],
      data: [heightRange],
    },
  });
}

/**
 * Wireframe building layer – transparent outlines for structural clarity.
 */
export function createBuildingWireframeLayer(
  data: GeoJsonFeatureCollection<BuildingProperties> | null,
  heightRange: [number, number] = [0, 300],
) {
  if (!data) return null;
  const filtered = filterByHeight(data, heightRange);

  return new GeoJsonLayer({
    id: LAYER_IDS.BUILDINGS_WIREFRAME,
    data: filtered as unknown as GeoJsonLayer['props']['data'],
    extruded: true,
    filled: false,
    wireframe: true,
    getElevation: (f: { properties: BuildingProperties }) => f.properties.height,
    getLineColor: [60, 60, 60, 180],
    lineWidthMinPixels: 1,
    pickable: false,
    updateTriggers: {
      data: [heightRange],
    },
  });
}
