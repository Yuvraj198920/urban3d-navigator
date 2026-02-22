/**
 * POI layer — ScatterplotLayer coloured by amenity category.
 *
 * Each feature is a GeoJSON Point (centroid of the OSM node/polygon).
 * Radius is fixed at 10 m so dots are always legible without overwhelming
 * the building view. radiusMinPixels keeps them visible when zoomed out.
 */
import { ScatterplotLayer } from '@deck.gl/layers';
import type { GeoJsonFeatureCollection, PoiProperties } from '../types';
import { POI_CATEGORY_COLORS } from '../utils/constants';

const DEFAULT_COLOR: [number, number, number, number] = [140, 140, 140, 230];

export function createPoiLayer(
  pois: GeoJsonFeatureCollection<PoiProperties> | null,
): ScatterplotLayer | null {
  if (!pois || pois.features.length === 0) return null;

  return new ScatterplotLayer({
    id: 'pois',
    data: pois.features,
    pickable: true,
    stroked: true,
    filled: true,
    radiusUnits: 'meters',
    radiusScale: 1,
    radiusMinPixels: 4,
    radiusMaxPixels: 18,
    lineWidthMinPixels: 1,
    getPosition: (f) => {
      const coords = (f as GeoJSON.Feature<GeoJSON.Point>).geometry.coordinates;
      return [coords[0], coords[1], 0];
    },
    getRadius: () => 10,
    getFillColor: (f) => {
      const cat = (f.properties as PoiProperties).category;
      return POI_CATEGORY_COLORS[cat] ?? DEFAULT_COLOR;
    },
    getLineColor: [255, 255, 255, 180],
    getLineWidth: 1,
  });
}
