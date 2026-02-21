import { useMapStore } from '../store/mapStore';
import { useMetadata } from '../hooks/useMapData';

export default function Controls() {
  const showBuildings = useMapStore((s) => s.showBuildings);
  const toggleBuildings = useMapStore((s) => s.toggleBuildings);
  const showRoads = useMapStore((s) => s.showRoads);
  const toggleRoads = useMapStore((s) => s.toggleRoads);
  const showWireframe = useMapStore((s) => s.showWireframe);
  const toggleWireframe = useMapStore((s) => s.toggleWireframe);
  const { data: metadata } = useMetadata();

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

      {metadata && (
        <div style={{ marginTop: 12, fontSize: 11, opacity: 0.8, lineHeight: 1.6 }}>
          <div>🏢 {metadata.building_count.toLocaleString()} buildings</div>
          <div>🛣️ {metadata.road_count.toLocaleString()} roads</div>
          <div>📏 {metadata.pct_known_height.toFixed(0)}% known heights</div>
          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>
            Generated: {new Date(metadata.generated_at).toLocaleDateString()}
          </div>
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
