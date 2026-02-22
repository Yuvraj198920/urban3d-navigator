import { create } from 'zustand';
import type { MapStoreState, ViewState, GeoJsonFeature, BuildingProperties, PoiProperties, HoverInfo } from '../types';
import { INITIAL_VIEW_STATE } from '../utils/constants';

export const useMapStore = create<MapStoreState>((set) => ({
  // ── View state ──────────────────────────────────────────────────────
  viewState: { ...INITIAL_VIEW_STATE } as ViewState,
  setViewState: (vs: Partial<ViewState>) =>
    set((state) => ({ viewState: { ...state.viewState, ...vs } })),

  // ── Layer visibility toggles ────────────────────────────────────────
  showBuildings: true,
  toggleBuildings: () => set((s) => ({ showBuildings: !s.showBuildings })),

  showRoads: true,
  toggleRoads: () => set((s) => ({ showRoads: !s.showRoads })),

  showWireframe: false,
  toggleWireframe: () => set((s) => ({ showWireframe: !s.showWireframe })),

  showLandmarks: true,
  toggleLandmarks: () => set((s) => ({ showLandmarks: !s.showLandmarks })),

  // ── Height range filter ──────────────────────────────────────────────
  heightRange: [0, 300],
  setHeightRange: (range: [number, number]) => set({ heightRange: range }),

  // ── Colour mode ─────────────────────────────────────────────────────
  colourMode: 'height' as const,
  setColourMode: (mode: 'height' | 'type') => set({ colourMode: mode }),

  // ── Performance overlay ──────────────────────────────────────────────
  showPerfOverlay: false,
  togglePerfOverlay: () => set((s) => ({ showPerfOverlay: !s.showPerfOverlay })),

  // ── Selection / hover ───────────────────────────────────────────────
  selectedBuilding: null,
  setSelectedBuilding: (b: GeoJsonFeature<BuildingProperties> | null) =>
    set({ selectedBuilding: b }),

  showPois: true,
  togglePois: () => set((s) => ({ showPois: !s.showPois })),

  selectedPoi: null,
  setSelectedPoi: (p: GeoJsonFeature<PoiProperties> | null) => set({ selectedPoi: p }),

  hoverInfo: null,
  setHoverInfo: (info: HoverInfo | null) => set({ hoverInfo: info }),
}));
