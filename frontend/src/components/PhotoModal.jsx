import React, { useEffect } from 'react';

export default function PhotoModal({ src, filename, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'photoModalFadeIn 0.2s ease',
      }}
    >
      <style>{`
        @keyframes photoModalFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
      <img
        src={src}
        alt={filename}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          objectFit: 'contain',
          borderRadius: 6,
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        }}
      />
      {filename && (
        <div
          style={{
            marginTop: 12,
            fontSize: 13,
            color: 'rgba(255,255,255,0.75)',
            userSelect: 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {filename}
        </div>
      )}
    </div>
  );
}
