import type React from 'react';

/**
 * Attribution footer – displayed bottom-centre of the map canvas.
 *
 * Credits:
 *   © OpenStreetMap contributors  (building + road geometry via OSMnx)
 *   OpenFreeMap                   (basemap tiles)
 *   Overture Maps Foundation      (POI & address data, when used)
 */
export default function Attribution() {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(4px)',
    borderRadius: 4,
    padding: '3px 8px',
    fontSize: 11,
    color: '#333',
    pointerEvents: 'auto',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    zIndex: 1000,
  };

  const linkStyle: React.CSSProperties = {
    color: '#1a6496',
    textDecoration: 'none',
  };

  const separatorStyle: React.CSSProperties = {
    color: '#aaa',
  };

  return (
    <div style={containerStyle}>
      {/* OpenStreetMap */}
      <span>
        ©{' '}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
        >
          OpenStreetMap
        </a>{' '}
        contributors
      </span>

      <span style={separatorStyle}>|</span>

      {/* Basemap tiles */}
      <span>
        Tiles ©{' '}
        <a
          href="https://openfreemap.org"
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
        >
          OpenFreeMap
        </a>
      </span>

      <span style={separatorStyle}>|</span>

      {/* Overture Maps */}
      <span>
        <a
          href="https://overturemaps.org"
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
        >
          Overture Maps Foundation
        </a>
      </span>
    </div>
  );
}
