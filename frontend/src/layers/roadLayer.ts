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
 * Classes come from the ETL pipeline: major | minor | other | path
 */
function roadClassToColor(roadClass: string): [number, number, number, number] {
  switch (roadClass) {
    case 'major':
      return [230, 100, 100, 220];
    case 'minor':
      return [230, 150, 80, 200];
    case 'other':
      return [180, 210, 100, 180];
    case 'path':
      return [140, 180, 140, 160];
    default:
      return [150, 150, 150, 120];
  }
}
