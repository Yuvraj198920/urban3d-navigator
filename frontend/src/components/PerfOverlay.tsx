import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { useMapStore } from '../store/mapStore';
import { useMetadata } from '../hooks/useMapData';

const ROLLING_WINDOW = 60; // frames to average over

/**
 * Floating FPS + frame-time overlay for performance benchmarking.
 * Uses a rolling 60-frame average so the reading is stable during orbits.
 * Hidden by default – toggle via the "Stats" checkbox in Controls.
 */
export default function PerfOverlay() {
  const showPerfOverlay = useMapStore((s) => s.showPerfOverlay);
  const { data: metadata } = useMetadata();

  const frameTimes = useRef<number[]>([]);
  const lastTs = useRef<number>(0);
  const rafId = useRef<number>(0);

  const [fps, setFps] = useState<number>(0);
  const [frameMs, setFrameMs] = useState<number>(0);

  useEffect(() => {
    if (!showPerfOverlay) {
      cancelAnimationFrame(rafId.current);
      return;
    }

    const tick = (ts: number) => {
      if (lastTs.current > 0) {
        const dt = ts - lastTs.current;
        frameTimes.current.push(dt);
        if (frameTimes.current.length > ROLLING_WINDOW) {
          frameTimes.current.shift();
        }
        const avg = frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length;
        setFrameMs(Math.round(avg * 10) / 10);
        setFps(Math.round(1000 / avg));
      }
      lastTs.current = ts;
      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [showPerfOverlay]);

  if (!showPerfOverlay) return null;

  const fpsColor =
    fps >= 50 ? '#4caf50' : fps >= 30 ? '#ff9800' : '#f44336';

  return (
    <div style={wrapperStyle}>
      <div style={titleStyle}>Performance</div>

      <div style={rowStyle}>
        <span style={labelStyle}>FPS</span>
        <span style={{ ...valueStyle, color: fpsColor }}>{fps}</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Frame</span>
        <span style={valueStyle}>{frameMs} ms</span>
      </div>

      <div style={dividerStyle} />

      <div style={rowStyle}>
        <span style={labelStyle}>Buildings</span>
        <span style={valueStyle}>
          {metadata ? metadata.stats.buildings_count.toLocaleString() : '—'}
        </span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Roads</span>
        <span style={valueStyle}>
          {metadata ? metadata.stats.roads_count.toLocaleString() : '—'}
        </span>
      </div>

      <div style={hintStyle}>60-frame rolling avg</div>
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 16,
  background: 'rgba(15, 15, 15, 0.88)',
  backdropFilter: 'blur(6px)',
  borderRadius: 8,
  padding: '10px 14px',
  fontFamily: 'monospace',
  fontSize: 12,
  color: '#e0e0e0',
  boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
  zIndex: 10,
  minWidth: 140,
};

const titleStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  opacity: 0.6,
  marginBottom: 8,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 4,
};

const labelStyle: React.CSSProperties = {
  opacity: 0.55,
};

const valueStyle: React.CSSProperties = {
  fontWeight: 600,
};

const dividerStyle: React.CSSProperties = {
  borderTop: '1px solid rgba(255,255,255,0.1)',
  margin: '6px 0',
};

const hintStyle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 9,
  opacity: 0.35,
  textAlign: 'center',
};
