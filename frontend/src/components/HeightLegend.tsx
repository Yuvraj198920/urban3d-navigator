import type React from 'react';
import { HEIGHT_COLOR_SCALE } from '../utils/constants';

/**
 * Vertical colour-scale legend explaining height → colour mapping.
 * Renders a gradient bar built from the HEIGHT_COLOR_SCALE breakpoints
 * with labelled tick marks at each stop.
 */
export default function HeightLegend() {
  // Build CSS gradient stops from the colour scale
  const totalRange = HEIGHT_COLOR_SCALE[HEIGHT_COLOR_SCALE.length - 1][0];
  const gradientStops = HEIGHT_COLOR_SCALE.map(([h, [r, g, b, a]]) => {
    const pct = ((h / totalRange) * 100).toFixed(1);
    return `rgba(${r},${g},${b},${(a / 255).toFixed(2)}) ${pct}%`;
  }).join(', ');

  return (
    <div style={wrapperStyle}>
      <div style={titleStyle}>Height (m)</div>
      <div style={rowStyle}>
        {/* Gradient bar */}
        <div style={{ ...barStyle, background: `linear-gradient(to top, ${gradientStops})` }} />
        {/* Tick labels */}
        <div style={ticksStyle}>
          {[...HEIGHT_COLOR_SCALE].reverse().map(([h]) => (
            <div key={h} style={tickStyle}>{h}</div>
          ))}
        </div>
      </div>
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
  padding: '10px 12px',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 11,
  boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
  zIndex: 5,
};

const titleStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 11,
  marginBottom: 6,
  textAlign: 'center',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: 6,
  alignItems: 'stretch',
};

const barStyle: React.CSSProperties = {
  width: 18,
  height: 140,
  borderRadius: 4,
  flexShrink: 0,
};

const ticksStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  height: 140,
};

const tickStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#444',
  lineHeight: 1,
};
