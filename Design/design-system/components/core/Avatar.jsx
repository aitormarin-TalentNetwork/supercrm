import React from 'react';

const TINTS = [
  { bg: '#EFF4FF', fg: '#1D4ED8' },
  { bg: '#ECFDF5', fg: '#0F766E' },
  { bg: '#EEF2FF', fg: '#4F46E5' },
  { bg: '#FEF3C7', fg: '#B45309' },
  { bg: '#FFF1F2', fg: '#BE123C' },
  { bg: '#F1F5F9', fg: '#475569' },
];

// MISMO algoritmo que lib/initials.ts. Los marcadores de abajo los usa
// e2e/00-initials-design-system.spec.ts para extraer este bloque y comprobar que
// las dos copias y el producto dan lo mismo. Si lo tocas, tocalo en los DOS
// ficheros. El marcador va SOLO en su linea: el extractor corta por lineas.
// >>> AIT-142 iniciales
const LETRA = /\p{L}/u;
function soloLetras(palabra) {
  return Array.from(palabra).filter((c) => LETRA.test(c)).join('');
}
function initials(name = '') {
  // Se filtra lo que NO es letra antes de elegir nada: antes, `[QA] Tester` daba
  // `[B` y `3M Espana` daba `3E`. `\p{L}` y no `[A-Za-z]` porque con el rango
  // ASCII `N. Perez` o `Angel` perderian su inicial — el arreglo introduciria un
  // defecto nuevo en la direccion contraria. `Array.from` y no indices: indexar
  // una cadena parte por la mitad los caracteres fuera del BMP.
  const parts = name.trim().split(/\s+/).map(soloLetras).filter(Boolean);
  if (!parts.length) return '?';
  const chars = (p) => Array.from(p);
  if (parts.length === 1) return chars(parts[0]).slice(0, 2).join('').toUpperCase();
  return (chars(parts[0])[0] + chars(parts[parts.length - 1])[0]).toUpperCase();
}
// <<< AIT-142 fin iniciales
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
