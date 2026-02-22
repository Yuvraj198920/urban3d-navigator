import type React from 'react';
import { useMapStore } from '../store/mapStore';
import type { PoiProperties } from '../types';
import { POI_CATEGORY_EMOJI } from '../utils/constants';

/**
 * Floating panel shown on the right side when a POI is clicked.
 * Mirrors the style of the Controls panel on the left.
 */
export default function PoiPanel() {
  const selectedPoi = useMapStore((s) => s.selectedPoi);
  const setSelectedPoi = useMapStore((s) => s.setSelectedPoi);

  if (!selectedPoi) return null;

  const p = selectedPoi.properties as PoiProperties;
  const emoji = POI_CATEGORY_EMOJI[p.category] ?? '📌';
  const coords = (selectedPoi.geometry as GeoJSON.Point).coordinates;

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>{emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.name || '(unnamed)'}
          </div>
          <div style={{ fontSize: 11, opacity: 0.65, textTransform: 'capitalize' }}>
            {p.category} · {p.amenity_tag.replace(/_/g, ' ')}
          </div>
        </div>
      </div>

      <div style={rowsStyle}>
        <Row label="Category" value={p.category.charAt(0).toUpperCase() + p.category.slice(1)} />
        <Row label="Type" value={p.amenity_tag.replace(/_/g, ' ')} />
        {p.name && <Row label="Name" value={p.name} />}
        <Row
          label="Location"
          value={`${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}`}
        />
      </div>

      <button onClick={() => setSelectedPoi(null)} style={clearBtnStyle}>
        ✕ Close
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 6, fontSize: 11, marginBottom: 3 }}>
      <span style={{ opacity: 0.5, minWidth: 60 }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 16,
  background: 'rgba(255, 255, 255, 0.93)',
  backdropFilter: 'blur(8px)',
  borderRadius: 10,
  padding: '14px 16px',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 13,
  boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
  zIndex: 5,
  minWidth: 200,
  maxWidth: 260,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  marginBottom: 10,
  paddingBottom: 10,
  borderBottom: '1px solid rgba(0,0,0,0.08)',
};

const rowsStyle: React.CSSProperties = {
  lineHeight: 1.7,
  marginBottom: 10,
};

const clearBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '4px 0',
  fontSize: 11,
  border: '1px solid #ccc',
  borderRadius: 4,
  background: 'transparent',
  cursor: 'pointer',
};
