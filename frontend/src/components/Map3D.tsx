import { useCallback, useMemo, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { FlyToInterpolator } from 'deck.gl';
import type { PickingInfo } from 'deck.gl';
import { Map } from 'react-map-gl/maplibre';
import type { MapLibreEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useBuildingsData, useRoadsData } from '../hooks/useMapData';
import { useMapStore } from '../store/mapStore';
import { createBuildingSolidLayer, createBuildingWireframeLayer } from '../layers/buildingLayer';
import { createRoadLayer } from '../layers/roadLayer';
import { AWS_TERRAIN_TILES_URL, BASEMAP_STYLE_URL, INITIAL_VIEW_STATE } from '../utils/constants';
import type { HoverInfo } from '../types';

import Tooltip from './Tooltip';

export default function Map3D() {
  // flyTarget drives camera transitions — updating it with a FlyToInterpolator
  // triggers deck.gl to animate from the current internal viewport to the target.
  const [flyTarget, setFlyTarget] = useState<object>({ ...INITIAL_VIEW_STATE });

  const { data: buildings, isLoading: loadingBuildings } = useBuildingsData();
  const { data: roads, isLoading: loadingRoads } = useRoadsData();

  const showBuildings = useMapStore((s) => s.showBuildings);
  const showRoads = useMapStore((s) => s.showRoads);
  const showWireframe = useMapStore((s) => s.showWireframe);
  const setHoverInfo = useMapStore((s) => s.setHoverInfo);
  const hoverInfo = useMapStore((s) => s.hoverInfo);
  const setSelectedBuilding = useMapStore((s) => s.setSelectedBuilding);

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

  /** Fly to a clicked building and mark it selected. Clicking empty space clears. */
  const handleClick = useCallback(
    (info: PickingInfo) => {
      if (!info.object || !info.coordinate) {
        setSelectedBuilding(null);
        return;
      }
      const [longitude, latitude] = info.coordinate as [number, number];
      setSelectedBuilding(info.object);
      setFlyTarget({
        longitude,
        latitude,
        zoom: 16.5,
        pitch: 60,
        bearing: 0,
        transitionInterpolator: new FlyToInterpolator({ speed: 1.5 }),
        transitionDuration: 'auto',
      });
    },
    [setSelectedBuilding],
  );

  /**
   * On map load, inject the AWS raster-DEM source and enable MapLibre terrain.
   * Bolzano sits in an Alpine valley — terrain exaggeration makes this
   * immediately readable as a real place, not a flat grid.
   */
  const handleMapLoad = useCallback((evt: MapLibreEvent) => {
    const map = evt.target;
    if (!map.getSource('terrain-dem')) {
      map.addSource('terrain-dem', {
        type: 'raster-dem',
        tiles: [AWS_TERRAIN_TILES_URL],
        tileSize: 256,
        encoding: 'terrarium',
        maxzoom: 15,
      });
    }
    map.setTerrain({ source: 'terrain-dem', exaggeration: 1.2 });
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <DeckGL
        initialViewState={flyTarget}
        layers={layers}
        controller={{ dragRotate: true, touchRotate: true, pitchRange: [0, 85] }}
        onClick={handleClick}
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
          onLoad={handleMapLoad}
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
