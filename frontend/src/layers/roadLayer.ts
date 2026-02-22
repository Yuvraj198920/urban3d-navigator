import { GeoJsonLayer } from '@deck.gl/layers';
import type { GeoJsonFeatureCollection, RoadProperties } from '../types';
import { LAYER_IDS, ROAD_WIDTH_SCALE } from '../utils/constants';

/**
 * Road network layer – coloured paths by classification.
 */
export function createRoadLayer(
  data: GeoJsonFeatureCollection<RoadProperties> | null,
) {
  if (!data) return null;

  return new GeoJsonLayer({
    id: LAYER_IDS.ROADS,
    data: data as unknown as GeoJsonLayer['props']['data'],
    filled: false,
    stroked: true,
    getLineColor: (f: { properties: RoadProperties }) =>
      roadClassToColor(f.properties.road_class),
    getLineWidth: (f: { properties: RoadProperties }) =>
      ROAD_WIDTH_SCALE[f.properties.road_class] ?? ROAD_WIDTH_SCALE['other'],
    lineWidthUnits: 'meters',
    lineWidthMinPixels: 1,
    lineCapRounded: true,
    lineJointRounded: true,
    // pickable: false keeps road features off the GPU pick buffer — a meaningful
    // win with 14,256 line features.  Road class is visible via the colour alone.
    pickable: false,
  });
}

/**
 * Map road classification to an RGBA colour.
 */
function roadClassToColor(roadClass: string): [number, number, number, number] {
  switch (roadClass) {
    case 'motorway':
      return [230, 100, 100, 200];
    case 'trunk':
      return [230, 150, 80, 200];
    case 'primary':
      return [240, 200, 80, 200];
    case 'secondary':
      return [180, 210, 100, 200];
    case 'tertiary':
      return [140, 180, 140, 200];
    case 'residential':
      return [160, 170, 200, 180];
    case 'service':
      return [180, 180, 180, 150];
    default:
      return [150, 150, 150, 120];
  }
}
