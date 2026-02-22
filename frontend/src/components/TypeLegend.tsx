import type React from 'react';
import { useMapStore } from '../store/mapStore';
import { BUILDING_TYPE_CATEGORIES } from '../utils/constants';

/**
 * Categorical legend shown when the map is in "colour by type" mode.
 * Renders a swatch + label row for each building-use category.
 */
export default function TypeLegend() {
  const colourMode = useMapStore((s) => s.colourMode);

  // Only render in type-colour mode
  if (colourMode !== 'type') return null;

  return (
    <div style={wrapperStyle}>
      <div style={titleStyle}>Building type</div>
      {BUILDING_TYPE_CATEGORIES.map(({ label, color: [r, g, b, a] }) => (
        <div key={label} style={rowStyle}>
          <span
            style={{
              ...swatchStyle,
              background: `rgba(${r},${g},${b},${(a / 255).toFixed(2)})`,
            }}
          />
          <span style={labelStyle}>{label}</span>
        </div>
      ))}
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 32,
  right: 16,
  background: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(8px)',
  borderRadius: 10,
  padding: '10px 14px',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 11,
  boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
  zIndex: 5,
  minWidth: 130,
};

const titleStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 11,
  marginBottom: 8,
  textAlign: 'center',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  marginBottom: 5,
};

const swatchStyle: React.CSSProperties = {
  width: 14,
  height: 14,
  borderRadius: 3,
  flexShrink: 0,
  border: '1px solid rgba(0,0,0,0.12)',
};

const labelStyle: React.CSSProperties = {
  color: '#333',
  lineHeight: 1,
};
