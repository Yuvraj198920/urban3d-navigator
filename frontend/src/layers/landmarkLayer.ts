import { TextLayer } from '@deck.gl/layers';

export interface Landmark {
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  category: 'culture' | 'transport' | 'nature' | 'market';
}

/** Key Bolzano landmarks — curated for spatial context in the 3D scene. */
export const BOLZANO_LANDMARKS: Landmark[] = [
  { name: 'Bolzano Cathedral', coordinates: [11.3525, 46.4988], category: 'culture' },
  { name: 'Piazza Walther', coordinates: [11.3531, 46.4979], category: 'culture' },
  { name: 'Piazza Erbe', coordinates: [11.3526, 46.4994], category: 'market' },
  { name: 'South Tyrol Museum\nof Archaeology', coordinates: [11.3532, 46.4992], category: 'culture' },
  { name: 'Museion', coordinates: [11.3464, 46.4968], category: 'culture' },
  { name: 'Bolzano Station', coordinates: [11.3572, 46.4929], category: 'transport' },
  { name: 'Castel Roncolo', coordinates: [11.3316, 46.5161], category: 'culture' },
  { name: 'Talvera Promenade', coordinates: [11.3465, 46.5015], category: 'nature' },
  { name: 'Gries', coordinates: [11.3378, 46.4963], category: 'culture' },
];

/** Short ASCII prefix per category (deck.gl TextLayer uses a WebGL font atlas
 *  that cannot render emoji — use plain text tags instead). */
const CATEGORY_TAG: Record<Landmark['category'], string> = {
  culture: '[*]',
  transport: '[T]',
  nature: '[~]',
  market: '[M]',
};

/**
 * TextLayer rendering city landmark labels as billboarded text with
 * a white background pill — visible at zoom ≥ 12 and above.
 */
export function createLandmarkLayer(data: Landmark[] = BOLZANO_LANDMARKS) {
  return new TextLayer<Landmark>({
    id: 'landmarks',
    data,
    getPosition: (d) => d.coordinates,
    getText: (d) => `${CATEGORY_TAG[d.category]} ${d.name}`,
    getSize: 13,
    getColor: [20, 20, 20, 240],
    getBackgroundColor: [255, 255, 255, 210],
    background: true,
    backgroundPadding: [5, 3, 5, 3],
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '600',
    billboard: true,
    getPixelOffset: [0, -24],
    pickable: false, // labels are decorative, no click handling needed
    sizeScale: 1,
    sizeMinPixels: 10,
    sizeMaxPixels: 16,
  });
}
