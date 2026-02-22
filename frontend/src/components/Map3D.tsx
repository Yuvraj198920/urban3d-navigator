import { useCallback, useMemo, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { FlyToInterpolator } from 'deck.gl';
import type { PickingInfo } from 'deck.gl';
import { Map } from 'react-map-gl/maplibre';
import type { Map as MaplibreMap, MapLibreEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useBuildingsData, useRoadsData, usePoisData } from '../hooks/useMapData';
import { useMapStore } from '../store/mapStore';
import { createBuildingSolidLayer, createBuildingWireframeLayer } from '../layers/buildingLayer';
import { createRoadLayer } from '../layers/roadLayer';
import { createLandmarkLayer } from '../layers/landmarkLayer';
import { createPoiLayer } from '../layers/poiLayer';
import { AWS_TERRAIN_TILES_URL, BASEMAP_STYLE_URL, INITIAL_VIEW_STATE } from '../utils/constants';
import type { HoverInfo } from '../types';

import Tooltip from './Tooltip';

export default function Map3D() {
  const [flyTarget, setFlyTarget] = useState<object>({ ...INITIAL_VIEW_STATE });

  const { data: buildings, isLoading: loadingBuildings } = useBuildingsData();
  const { data: roads, isLoading: loadingRoads } = useRoadsData();
  const { data: pois } = usePoisData();

  const showBuildings = useMapStore((s) => s.showBuildings);
  const showRoads = useMapStore((s) => s.showRoads);
  const showWireframe = useMapStore((s) => s.showWireframe);
  const showLandmarks = useMapStore((s) => s.showLandmarks);
  const showPois = useMapStore((s) => s.showPois);
  const heightRange = useMapStore((s) => s.heightRange);
  const colourMode = useMapStore((s) => s.colourMode);
  const setHoverInfo = useMapStore((s) => s.setHoverInfo);
  const hoverInfo = useMapStore((s) => s.hoverInfo);
  const setSelectedBuilding = useMapStore((s) => s.setSelectedBuilding);
  const setSelectedPoi = useMapStore((s) => s.setSelectedPoi);

  const layers = useMemo(() => {
    const result = [];
    if (showBuildings) {
      const solid = createBuildingSolidLayer(buildings ?? null, heightRange, colourMode);
      if (solid) result.push(solid);
    }
    if (showWireframe) {
      const wire = createBuildingWireframeLayer(buildings ?? null, heightRange);
      if (wire) result.push(wire);
    }
    if (showRoads) {
      const road = createRoadLayer(roads ?? null);
      if (road) result.push(road);
    }
    if (showPois) {
      const poi = createPoiLayer(pois ?? null);
      if (poi) result.push(poi);
    }
    if (showLandmarks) {
      result.push(createLandmarkLayer());
    }
    return result;
  }, [buildings, roads, pois, showBuildings, showRoads, showWireframe, showLandmarks, showPois, heightRange, colourMode]);

  const isLoading = loadingBuildings || loadingRoads;

  /** Fly to a clicked building and mark it selected. POI clicks open the detail panel. Clicking empty space clears selections. */
  const handleClick = useCallback(
    (info: PickingInfo) => {
      if (!info.object || !info.coordinate) {
        setSelectedBuilding(null);
        setSelectedPoi(null);
        return;
      }
      // POI click
      if (info.layer && info.layer.id === 'pois') {
        setSelectedPoi(info.object);
        setSelectedBuilding(null);
        return;
      }
      // Building click — fly to it
      const [longitude, latitude] = info.coordinate as [number, number];
      setSelectedBuilding(info.object);
      setSelectedPoi(null);
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
    [setSelectedBuilding, setSelectedPoi],
  );

  /**
   * Hide the basemap's own building layers so deck.gl's height-coloured
   * buildings are the sole 3-D representation. Called on load and on
   * every styledata event to survive style reloads.
   */
  const hideBasemapBuildings = useCallback((map: MaplibreMap) => {
    for (const layerId of ['building', 'building-3d']) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    }
  }, []);

  /**
   * On map load, inject the AWS raster-DEM source, enable MapLibre terrain,
   * and hide the basemap's own building layers so deck.gl's height-coloured
   * buildings are the sole 3-D representation.
   * The liberty style's building layers are defined in the style JSON itself,
   * so they are always present at load time — no need to re-hide on styledata.
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
    hideBasemapBuildings(map);
  }, [hideBasemapBuildings]);

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
