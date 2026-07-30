import React from 'react';

const TINTS = [
  { bg: '#EFF4FF', fg: '#1D4ED8' },
  { bg: '#ECFDF5', fg: '#0F766E' },
  { bg: '#EEF2FF', fg: '#4F46E5' },
  { bg: '#FEF3C7', fg: '#B45309' },
  { bg: '#FFF1F2', fg: '#BE123C' },
  { bg: '#F1F5F9', fg: '#475569' },
];

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function pick(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}

/**
 * Avatar — iniciales con color derivado del nombre, o imagen.
 */
export function Avatar({ name = '', src, size = 'md', style, ...rest }) {
  const sizes = { xs: 22, sm: 28, md: 36, lg: 48 };
  const dim = sizes[size] || sizes.md;
  const fs = Math.round(dim * 0.4);
  const t = pick(name);
  return (
    <span
      title={name || undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: dim,
        height: dim,
        borderRadius: '50%',
        background: src ? 'var(--color-neutral-200)' : t.bg,
        color: t.fg,
        fontFamily: 'var(--font-sans)',
        fontSize: fs,
        fontWeight: 600,
        overflow: 'hidden',
        flex: 'none',
        ...style,
      }}
      {...rest}
    >
      {src ? (
        <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initials(name)
      )}
    </span>
  );
}
