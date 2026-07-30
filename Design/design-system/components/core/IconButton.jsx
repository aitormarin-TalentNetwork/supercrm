import React from 'react';

/**
 * IconButton — botón cuadrado solo-icono. Requiere `aria-label`.
 */
export function IconButton({
  variant = 'ghost',
  size = 'md',
  disabled = false,
  children,
  onClick,
  'aria-label': ariaLabel,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const sizes = { sm: 32, md: 40, lg: 44 };
  const dim = sizes[size] || sizes.md;

  const palette = {
    ghost: { bg: 'transparent', bgHover: 'var(--color-neutral-100)', color: 'var(--color-text-secondary)', border: 'transparent' },
    outline: { bg: 'var(--color-surface)', bgHover: 'var(--color-neutral-100)', color: 'var(--color-text-secondary)', border: 'var(--color-border-strong)' },
    primary: { bg: 'var(--color-primary)', bgHover: 'var(--color-primary-hover)', color: 'var(--color-on-primary)', border: 'transparent' },
  };
  const p = palette[variant] || palette.ghost;

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: dim,
        height: dim,
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${p.border}`,
        background: disabled ? p.bg : hover ? p.bgHover : p.bg,
        color: p.color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background .15s ease',
        padding: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
