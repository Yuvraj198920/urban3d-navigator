import type React from 'react';
import { useMapStore } from '../store/mapStore';
import { useMetadata } from '../hooks/useMapData';
import type { BuildingProperties } from '../types';

export default function Controls() {
  const showBuildings = useMapStore((s) => s.showBuildings);
  const toggleBuildings = useMapStore((s) => s.toggleBuildings);
  const showRoads = useMapStore((s) => s.showRoads);
  const toggleRoads = useMapStore((s) => s.toggleRoads);
  const showWireframe = useMapStore((s) => s.showWireframe);
  const toggleWireframe = useMapStore((s) => s.toggleWireframe);
  const showLandmarks = useMapStore((s) => s.showLandmarks);
  const toggleLandmarks = useMapStore((s) => s.toggleLandmarks);
  const selectedBuilding = useMapStore((s) => s.selectedBuilding);
  const setSelectedBuilding = useMapStore((s) => s.setSelectedBuilding);
  const { data: metadata } = useMetadata();

  const bp = selectedBuilding?.properties as BuildingProperties | undefined;

  return (
    <div style={panelStyle}>
      <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>
        🏙️ Urban3D Navigator
      </h3>

      <label style={labelStyle}>
        <input type="checkbox" checked={showBuildings} onChange={toggleBuildings} />
        Buildings
      </label>

      <label style={labelStyle}>
        <input type="checkbox" checked={showWireframe} onChange={toggleWireframe} />
        Wireframe
      </label>

      <label style={labelStyle}>
        <input type="checkbox" checked={showRoads} onChange={toggleRoads} />
        Roads
      </label>

      <label style={labelStyle}>
        <input type="checkbox" checked={showLandmarks} onChange={toggleLandmarks} />
        Landmarks
      </label>

      {metadata && (
        <div style={{ marginTop: 12, fontSize: 11, opacity: 0.8, lineHeight: 1.6 }}>
          <div>Buildings: {metadata.stats.buildings_count.toLocaleString()}</div>
          <div>Roads: {metadata.stats.roads_count.toLocaleString()}</div>
          <div>Known heights: {metadata.stats.pct_known_height.toFixed(0)}%</div>
          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>
            Generated: {new Date(metadata.generated_at).toLocaleDateString()}
          </div>
        </div>
      )}

      {bp && (
        <div style={selectedPanelStyle}>
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 12 }}>📍 Selected Building</div>
          <div style={{ fontSize: 11, lineHeight: 1.7 }}>
            {bp.name && <div>🏷️ {bp.name}</div>}
            <div>📐 {bp.height != null ? `${bp.height.toFixed(1)} m tall` : 'Height unknown'}</div>
            <div>
              {bp.height_source === 'osm' && '✅ OSM height'}
              {bp.height_source === 'levels' && '📊 From floor count'}
              {bp.height_source === 'default' && '⚠️ Default estimate'}
              {bp.height_source === 'overture' && '🗺️ Overture height'}
            </div>
            {bp.building_type && <div>🏗️ {bp.building_type}</div>}
          </div>
          <button onClick={() => setSelectedBuilding(null)} style={clearBtnStyle}>
            ✕ Clear
          </button>
        </div>
      )}
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  left: 16,
  background: 'rgba(255, 255, 255, 0.92)',
  backdropFilter: 'blur(8px)',
  borderRadius: 10,
  padding: '14px 18px',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 13,
  boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
  zIndex: 5,
  minWidth: 180,
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 4,
  cursor: 'pointer',
};

const selectedPanelStyle: React.CSSProperties = {
  marginTop: 12,
  paddingTop: 10,
  borderTop: '1px solid rgba(0,0,0,0.1)',
  fontSize: 11,
  lineHeight: 1.6,
};

const clearBtnStyle: React.CSSProperties = {
  marginTop: 8,
  padding: '3px 10px',
  fontSize: 11,
  border: '1px solid #ccc',
  borderRadius: 4,
  background: 'transparent',
  cursor: 'pointer',
  width: '100%',
};
