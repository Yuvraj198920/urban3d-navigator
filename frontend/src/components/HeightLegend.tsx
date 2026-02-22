import type React from 'react';
import { HEIGHT_COLOR_SCALE } from '../utils/constants';
import { useMetadata } from '../hooks/useMapData';
import { useMapStore } from '../store/mapStore';
import { heightToColor } from '../layers/buildingLayer';

/**
 * Vertical colour-scale legend explaining height → colour mapping.
 * When building data is available the legend clips to the actual max
 * height so every colour band shown corresponds to a real building.
 */
export default function HeightLegend() {
  const colourMode = useMapStore((s) => s.colourMode);
  const { data: metadata } = useMetadata();

  // Hide when user switched to building-type colour mode
  if (colourMode !== 'height') return null;

  const actualMax = metadata?.stats.max_building_height ?? HEIGHT_COLOR_SCALE[HEIGHT_COLOR_SCALE.length - 1][0];

  // Keep only scale breakpoints at or below actualMax, then append actualMax itself
  const clipped = HEIGHT_COLOR_SCALE.filter(([h]) => h <= actualMax);
  // Add the actual max as the top stop if it isn't already a breakpoint
  if (clipped[clipped.length - 1][0] < actualMax) {
    clipped.push([actualMax, heightToColor(actualMax, HEIGHT_COLOR_SCALE)]);
  }

  // Build CSS gradient stops relative to the clipped range
  const gradientStops = clipped.map(([h, [r, g, b, a]]) => {
    const pct = ((h / actualMax) * 100).toFixed(1);
    return `rgba(${r},${g},${b},${(a / 255).toFixed(2)}) ${pct}%`;
  }).join(', ');

  return (
    <div style={wrapperStyle}>
      <div style={titleStyle}>Height (m)</div>
      <div style={rowStyle}>
        <div style={{ ...barStyle, background: `linear-gradient(to top, ${gradientStops})` }} />
        <div style={ticksStyle}>
          {[...clipped].reverse().map(([h]) => (
            <div key={h} style={tickStyle}>{Math.round(h)}</div>
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
