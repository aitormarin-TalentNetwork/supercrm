import React from 'react';

/**
 * Button — acción principal del sistema. Un solo `primary` por vista.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  disabled = false,
  fullWidth = false,
  type = 'button',
  children,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);

  const sizes = {
    sm: { h: 36, px: 12, fs: 13 },
    md: { h: 44, px: 16, fs: 14 },
    lg: { h: 52, px: 20, fs: 16 },
  };
  const s = sizes[size] || sizes.md;

  const palette = {
    primary: {
      bg: 'var(--color-primary)',
      bgHover: 'var(--color-primary-hover)',
      bgActive: 'var(--color-primary-active)',
      color: 'var(--color-on-primary)',
      border: 'transparent',
    },
    secondary: {
      bg: 'var(--color-surface)',
      bgHover: 'var(--color-neutral-100)',
      bgActive: 'var(--color-neutral-200)',
      color: 'var(--color-text)',
      border: 'var(--color-border-strong)',
    },
    ghost: {
      bg: 'transparent',
      bgHover: 'var(--color-primary-subtle)',
      bgActive: 'var(--color-primary-subtle)',
      color: 'var(--color-primary)',
      border: 'transparent',
    },
    danger: {
      bg: 'var(--color-error)',
      bgHover: '#B91C1C',
      bgActive: '#991B1B',
      color: '#FFFFFF',
      border: 'transparent',
    },
  };
  const p = palette[variant] || palette.primary;
  const bg = disabled ? p.bg : active ? p.bgActive : hover ? p.bgHover : p.bg;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: s.h,
        minHeight: s.h,
        padding: `0 ${s.px}px`,
        fontFamily: 'var(--font-sans)',
        fontSize: s.fs,
        fontWeight: 600,
        lineHeight: 1,
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${p.border}`,
        background: bg,
        color: p.color,
        width: fullWidth ? '100%' : 'auto',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background .15s ease, border-color .15s ease',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
