import React from 'react';
import pkg from '../../package.json';

export default function Header() {
  return (
    <header>
      Toronto <span>Green Map</span>
      <span style={{ fontSize: '0.65em', fontWeight: 'normal', opacity: 0.5, marginLeft: '0.5em', letterSpacing: '0.02em' }}>
        v{pkg.version}
      </span>
    </header>
  );
}
