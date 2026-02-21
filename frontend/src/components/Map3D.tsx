import { useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useViewState } from '../hooks/useViewState';
import { useBuildingsData, useRoadsData } from '../hooks/useMapData';
import { useMapStore } from '../store/mapStore';
import { createBuildingSolidLayer, createBuildingWireframeLayer } from '../layers/buildingLayer';
import { createRoadLayer } from '../layers/roadLayer';
import { BASEMAP_STYLE_URL } from '../utils/constants';
import type { HoverInfo } from '../types';

import Tooltip from './Tooltip';

export default function Map3D() {
  const { viewState, onViewStateChange } = useViewState();
  const { data: buildings, isLoading: loadingBuildings } = useBuildingsData();
  const { data: roads, isLoading: loadingRoads } = useRoadsData();

  const showBuildings = useMapStore((s) => s.showBuildings);
  const showRoads = useMapStore((s) => s.showRoads);
  const showWireframe = useMapStore((s) => s.showWireframe);
  const setHoverInfo = useMapStore((s) => s.setHoverInfo);
  const hoverInfo = useMapStore((s) => s.hoverInfo);

  const layers = useMemo(() => {
    const result = [];
    if (showBuildings) {
      const solid = createBuildingSolidLayer(buildings ?? null);
      if (solid) result.push(solid);
    }
    if (showWireframe) {
      const wire = createBuildingWireframeLayer(buildings ?? null);
      if (wire) result.push(wire);
    }
    if (showRoads) {
      const road = createRoadLayer(roads ?? null);
      if (road) result.push(road);
    }
    return result;
  }, [buildings, roads, showBuildings, showRoads, showWireframe]);

  const isLoading = loadingBuildings || loadingRoads;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        layers={layers}
        controller={{ dragRotate: true, touchRotate: true }}
        onHover={(info: HoverInfo) => {
          if (info.object) {
            setHoverInfo(info);
          } else {
            setHoverInfo(null);
          }
        }}
        getTooltip={undefined}
      >
        <Map
          mapStyle={BASEMAP_STYLE_URL}
          attributionControl={true}
        />
      </DeckGL>

      {hoverInfo && <Tooltip info={hoverInfo} />}

      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '16px 32px',
            borderRadius: 8,
            fontSize: 16,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Loading 3D map data…
        </div>
      )}
    </div>
  );
}
