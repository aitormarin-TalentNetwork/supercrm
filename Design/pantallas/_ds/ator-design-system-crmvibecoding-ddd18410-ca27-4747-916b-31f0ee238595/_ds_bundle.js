/* @ds-bundle: {"format":3,"namespace":"DesignSystem_ddd184","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"StatusBadge","sourcePath":"components/core/StatusBadge.jsx"},{"name":"KanbanColumn","sourcePath":"components/data/KanbanColumn.jsx"},{"name":"Pagination","sourcePath":"components/data/Pagination.jsx"},{"name":"Table","sourcePath":"components/data/Table.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"ProgressBar","sourcePath":"components/feedback/ProgressBar.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"Breadcrumb","sourcePath":"components/navigation/Breadcrumb.jsx"},{"name":"SidebarNav","sourcePath":"components/navigation/SidebarNav.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"6c08f0cbcc72","components/core/Badge.jsx":"54d07f25b8a3","components/core/Button.jsx":"e5fa633aecd2","components/core/Card.jsx":"29d43c3e851f","components/core/IconButton.jsx":"e0483ad7c796","components/core/StatusBadge.jsx":"6d714ca57567","components/data/KanbanColumn.jsx":"3fd4dfc040ad","components/data/Pagination.jsx":"7576d1710cb7","components/data/Table.jsx":"5fe4775d15d9","components/feedback/Dialog.jsx":"67ec0d933c8b","components/feedback/EmptyState.jsx":"04664174ba7d","components/feedback/ProgressBar.jsx":"d7a1cd415f48","components/feedback/Toast.jsx":"70a6fc0b869b","components/feedback/Tooltip.jsx":"b5a344568574","components/forms/Checkbox.jsx":"779635ab25e1","components/forms/Input.jsx":"00d7ca16513d","components/forms/Radio.jsx":"4c6d4c31c4eb","components/forms/Select.jsx":"3f765b6e6f88","components/forms/Switch.jsx":"431ca3a0752d","components/forms/Textarea.jsx":"d0740b58a883","components/navigation/Breadcrumb.jsx":"11863e82a8ce","components/navigation/SidebarNav.jsx":"825c534edbe8","components/navigation/Tabs.jsx":"e167700c8a17"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DesignSystem_ddd184 = window.DesignSystem_ddd184 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TINTS = [{
  bg: '#EFF4FF',
  fg: '#1D4ED8'
}, {
  bg: '#ECFDF5',
  fg: '#0F766E'
}, {
  bg: '#EEF2FF',
  fg: '#4F46E5'
}, {
  bg: '#FEF3C7',
  fg: '#B45309'
}, {
  bg: '#FFF1F2',
  fg: '#BE123C'
}, {
  bg: '#F1F5F9',
  fg: '#475569'
}];
function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function pick(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = h * 31 + name.charCodeAt(i) >>> 0;
  return TINTS[h % TINTS.length];
}

/**
 * Avatar — iniciales con color derivado del nombre, o imagen.
 */
function Avatar({
  name = '',
  src,
  size = 'md',
  style,
  ...rest
}) {
  const sizes = {
    xs: 22,
    sm: 28,
    md: 36,
    lg: 48
  };
  const dim = sizes[size] || sizes.md;
  const fs = Math.round(dim * 0.4);
  const t = pick(name);
  return /*#__PURE__*/React.createElement("span", _extends({
    title: name || undefined,
    style: {
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
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials(name));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Badge — etiqueta semántica corta (feedback genérico).
 * Para estados de CRM usa StatusBadge.
 */
function Badge({
  variant = 'neutral',
  dot = false,
  children,
  style,
  ...rest
}) {
  const palette = {
    neutral: {
      bg: 'var(--color-neutral-100)',
      fg: 'var(--color-neutral-600)'
    },
    primary: {
      bg: 'var(--color-primary-subtle)',
      fg: 'var(--color-primary-hover)'
    },
    success: {
      bg: 'var(--color-success-subtle)',
      fg: '#15803D'
    },
    warning: {
      bg: 'var(--color-warning-subtle)',
      fg: '#B45309'
    },
    error: {
      bg: 'var(--color-error-subtle)',
      fg: '#B91C1C'
    },
    info: {
      bg: 'var(--color-info-subtle)',
      fg: '#0369A1'
    }
  };
  const p = palette[variant] || palette.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '3px 9px',
      fontFamily: 'var(--font-sans)',
      fontSize: 11,
      fontWeight: 600,
      lineHeight: 1.4,
      borderRadius: 'var(--radius-pill)',
      background: p.bg,
      color: p.fg,
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: p.fg
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — acción principal del sistema. Un solo `primary` por vista.
 */
function Button({
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
    sm: {
      h: 36,
      px: 12,
      fs: 13
    },
    md: {
      h: 44,
      px: 16,
      fs: 14
    },
    lg: {
      h: 52,
      px: 20,
      fs: 16
    }
  };
  const s = sizes[size] || sizes.md;
  const palette = {
    primary: {
      bg: 'var(--color-primary)',
      bgHover: 'var(--color-primary-hover)',
      bgActive: 'var(--color-primary-active)',
      color: 'var(--color-on-primary)',
      border: 'transparent'
    },
    secondary: {
      bg: 'var(--color-surface)',
      bgHover: 'var(--color-neutral-100)',
      bgActive: 'var(--color-neutral-200)',
      color: 'var(--color-text)',
      border: 'var(--color-border-strong)'
    },
    ghost: {
      bg: 'transparent',
      bgHover: 'var(--color-primary-subtle)',
      bgActive: 'var(--color-primary-subtle)',
      color: 'var(--color-primary)',
      border: 'transparent'
    },
    danger: {
      bg: 'var(--color-error)',
      bgHover: '#B91C1C',
      bgActive: '#991B1B',
      color: '#FFFFFF',
      border: 'transparent'
    }
  };
  const p = palette[variant] || palette.primary;
  const bg = disabled ? p.bg : active ? p.bgActive : hover ? p.bgHover : p.bg;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    style: {
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
      ...style
    }
  }, rest), leftIcon, children, rightIcon);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Card — superficie contenedora. Elevación e1 por defecto.
 */
function Card({
  elevation = 'e1',
  padding = 'md',
  interactive = false,
  children,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const pads = {
    none: 0,
    sm: 'var(--space-4)',
    md: 'var(--space-6)',
    lg: 'var(--space-8)'
  };
  const shadows = {
    none: 'none',
    e1: 'var(--shadow-e1)',
    e2: 'var(--shadow-e2)',
    e3: 'var(--shadow-e3)'
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: interactive && hover ? 'var(--shadow-e2)' : shadows[elevation],
      padding: pads[padding] != null ? pads[padding] : pads.md,
      cursor: interactive ? 'pointer' : 'default',
      transition: 'box-shadow .15s ease, border-color .15s ease',
      borderColor: interactive && hover ? 'var(--color-border-strong)' : 'var(--color-border)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * IconButton — botón cuadrado solo-icono. Requiere `aria-label`.
 */
function IconButton({
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
  const sizes = {
    sm: 32,
    md: 40,
    lg: 44
  };
  const dim = sizes[size] || sizes.md;
  const palette = {
    ghost: {
      bg: 'transparent',
      bgHover: 'var(--color-neutral-100)',
      color: 'var(--color-text-secondary)',
      border: 'transparent'
    },
    outline: {
      bg: 'var(--color-surface)',
      bgHover: 'var(--color-neutral-100)',
      color: 'var(--color-text-secondary)',
      border: 'var(--color-border-strong)'
    },
    primary: {
      bg: 'var(--color-primary)',
      bgHover: 'var(--color-primary-hover)',
      color: 'var(--color-on-primary)',
      border: 'transparent'
    }
  };
  const p = palette[variant] || palette.ghost;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": ariaLabel,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
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
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/StatusBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const MAPS = {
  pipeline: {
    nuevo: {
      label: 'Nuevo',
      bg: '#F1F5F9',
      fg: '#475569',
      dot: '#64748B'
    },
    contactado: {
      label: 'Contactado',
      bg: '#ECFEFF',
      fg: '#0E7490',
      dot: '#0891B2'
    },
    propuesta: {
      label: 'Propuesta',
      bg: '#EEF2FF',
      fg: '#4F46E5',
      dot: '#6366F1'
    },
    negociacion: {
      label: 'Negociación',
      bg: '#FEF3C7',
      fg: '#B45309',
      dot: '#D97706'
    },
    ganado: {
      label: 'Ganado',
      bg: '#DCFCE7',
      fg: '#15803D',
      dot: '#16A34A'
    },
    perdido: {
      label: 'Perdido',
      bg: '#FEE2E2',
      fg: '#B91C1C',
      dot: '#DC2626'
    }
  },
  quote: {
    borrador: {
      label: 'Borrador',
      bg: '#F1F5F9',
      fg: '#475569',
      dot: '#64748B'
    },
    enviado: {
      label: 'Enviado',
      bg: '#E0F2FE',
      fg: '#0369A1',
      dot: '#0284C7'
    },
    aceptado: {
      label: 'Aceptado',
      bg: '#DCFCE7',
      fg: '#15803D',
      dot: '#16A34A'
    },
    rechazado: {
      label: 'Rechazado',
      bg: '#FEE2E2',
      fg: '#B91C1C',
      dot: '#DC2626'
    },
    vencido: {
      label: 'Vencido',
      bg: '#FEF3C7',
      fg: '#B45309',
      dot: '#D97706'
    }
  },
  task: {
    pendiente: {
      label: 'Pendiente',
      bg: '#F1F5F9',
      fg: '#475569',
      dot: '#64748B'
    },
    encurso: {
      label: 'En curso',
      bg: '#EFF4FF',
      fg: '#1D4ED8',
      dot: '#2563EB'
    },
    hecha: {
      label: 'Hecha',
      bg: '#DCFCE7',
      fg: '#15803D',
      dot: '#16A34A'
    },
    vencida: {
      label: 'Vencida',
      bg: '#FEE2E2',
      fg: '#B91C1C',
      dot: '#DC2626'
    }
  },
  risk: {
    low: {
      label: 'Riesgo bajo',
      bg: '#DCFCE7',
      fg: '#15803D',
      dot: '#16A34A'
    },
    medium: {
      label: 'Riesgo medio',
      bg: '#FEF3C7',
      fg: '#B45309',
      dot: '#D97706'
    },
    high: {
      label: 'Riesgo alto',
      bg: '#FEE2E2',
      fg: '#B91C1C',
      dot: '#DC2626'
    }
  }
};

/**
 * StatusBadge — chip de estado del CRM. Mapea (kind, value) a color y etiqueta
 * según los tokens de pipeline / presupuesto / tarea / riesgo.
 */
function StatusBadge({
  kind,
  value,
  label,
  dot = true,
  style,
  ...rest
}) {
  const m = MAPS[kind] && MAPS[kind][value] || {
    label: value,
    bg: 'var(--color-neutral-100)',
    fg: 'var(--color-neutral-600)',
    dot: 'var(--color-neutral-500)'
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      padding: '3px 10px',
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      fontWeight: 600,
      lineHeight: 1.4,
      borderRadius: 'var(--radius-pill)',
      background: m.bg,
      color: m.fg,
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: m.dot,
      flex: 'none'
    }
  }), label || m.label);
}
Object.assign(__ds_scope, { StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/data/KanbanColumn.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const STAGE_COLORS = {
  nuevo: 'var(--pipeline-nuevo)',
  contactado: 'var(--pipeline-contactado)',
  propuesta: 'var(--pipeline-propuesta)',
  negociacion: 'var(--pipeline-negociacion)',
  ganado: 'var(--pipeline-ganado)',
  perdido: 'var(--pipeline-perdido)'
};

/**
 * KanbanColumn — columna del tablero de pipeline. Encabezado con color de etapa,
 * conteo y total; las tarjetas van como children.
 */
function KanbanColumn({
  stage,
  title,
  count,
  total,
  children,
  style,
  ...rest
}) {
  const color = STAGE_COLORS[stage] || 'var(--color-neutral-500)';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      width: 280,
      flex: 'none',
      background: 'var(--color-neutral-50)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      fontFamily: 'var(--font-sans)',
      maxHeight: '100%',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '12px 14px',
      borderBottom: '1px solid var(--color-border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: color,
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--color-text)'
    }
  }, title), count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--color-text-muted)',
      background: 'var(--color-neutral-200)',
      borderRadius: 'var(--radius-pill)',
      padding: '1px 7px'
    }
  }, count), total != null && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--color-text-secondary)'
    }
  }, total)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: 10,
      overflowY: 'auto'
    }
  }, children));
}
Object.assign(__ds_scope, { KanbanColumn });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/KanbanColumn.jsx", error: String((e && e.message) || e) }); }

// components/data/Pagination.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Pagination — navegación de páginas compacta.
 */
function Pagination({
  page = 1,
  totalPages = 1,
  onChange,
  style,
  ...rest
}) {
  const go = p => {
    if (p >= 1 && p <= totalPages && onChange) onChange(p);
  };
  const pages = [];
  const range = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || i >= page - range && i <= page + range) pages.push(i);else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  const btn = (content, opts = {}) => {
    const {
      active,
      disabled,
      onClick,
      label
    } = opts;
    return /*#__PURE__*/React.createElement("button", {
      key: label,
      onClick: onClick,
      disabled: disabled,
      "aria-label": typeof content === 'string' ? undefined : label,
      style: {
        minWidth: 34,
        height: 34,
        padding: '0 8px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: 600,
        color: active ? 'var(--color-on-primary)' : 'var(--color-text-secondary)',
        background: active ? 'var(--color-primary)' : 'transparent',
        border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1
      }
    }, content);
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, rest), btn('‹', {
    disabled: page <= 1,
    onClick: () => go(page - 1),
    label: 'prev'
  }), pages.map((p, i) => p === '…' ? /*#__PURE__*/React.createElement("span", {
    key: 'e' + i,
    style: {
      color: 'var(--color-neutral-400)',
      padding: '0 2px'
    }
  }, "\u2026") : btn(p, {
    active: p === page,
    onClick: () => go(p),
    label: 'p' + p
  })), btn('›', {
    disabled: page >= totalPages,
    onClick: () => go(page + 1),
    label: 'next'
  }));
}
Object.assign(__ds_scope, { Pagination });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Pagination.jsx", error: String((e && e.message) || e) }); }

// components/data/Table.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Table — tabla de datos densa. `columns` describe cabeceras y celdas.
 */
function Table({
  columns = [],
  rows = [],
  rowKey = 'id',
  onRowClick,
  dense = false,
  style,
  ...rest
}) {
  const [hovered, setHovered] = React.useState(null);
  const padY = dense ? 8 : 12;
  const align = a => a === 'right' ? 'flex-end' : a === 'center' ? 'center' : 'flex-start';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      background: 'var(--color-surface)',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: `9px 16px`,
      background: 'var(--color-neutral-50)',
      borderBottom: '1px solid var(--color-border)'
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.key,
    style: {
      flex: c.width || 1,
      minWidth: 0,
      display: 'flex',
      justifyContent: align(c.align),
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '.04em',
      textTransform: 'uppercase',
      color: 'var(--color-text-muted)'
    }
  }, c.header))), rows.map((row, i) => {
    const key = row[rowKey] != null ? row[rowKey] : i;
    return /*#__PURE__*/React.createElement("div", {
      key: key,
      onClick: onRowClick ? () => onRowClick(row) : undefined,
      onMouseEnter: () => setHovered(key),
      onMouseLeave: () => setHovered(null),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: `${padY}px 16px`,
        minHeight: 44,
        borderBottom: i < rows.length - 1 ? '1px solid var(--color-neutral-100)' : 'none',
        background: hovered === key ? 'var(--color-neutral-100)' : 'transparent',
        cursor: onRowClick ? 'pointer' : 'default',
        transition: 'background .12s ease',
        fontSize: 14,
        color: 'var(--color-text)'
      }
    }, columns.map(c => /*#__PURE__*/React.createElement("div", {
      key: c.key,
      style: {
        flex: c.width || 1,
        minWidth: 0,
        display: 'flex',
        justifyContent: align(c.align),
        alignItems: 'center',
        fontFamily: c.mono ? 'var(--font-mono)' : 'inherit',
        fontSize: c.mono ? 13 : 14,
        color: c.muted ? 'var(--color-text-secondary)' : 'inherit',
        overflow: 'hidden'
      }
    }, c.render ? c.render(row[c.key], row) : row[c.key])));
  }));
}
Object.assign(__ds_scope, { Table });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Table.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
/**
 * Dialog — modal centrado con overlay. Controlado por `open`.
 */
function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 480
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(15,23,42,.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      maxWidth: width,
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-e3)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-6)'
    }
  }, title && /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 20,
      fontWeight: 700,
      color: 'var(--color-text)'
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '8px 0 0',
      fontSize: 14,
      lineHeight: 1.55,
      color: 'var(--color-text-secondary)'
    }
  }, description), children && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: title || description ? 'var(--space-5)' : 0
    }
  }, children)), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 'var(--space-3)',
      padding: 'var(--space-4) var(--space-6)',
      borderTop: '1px solid var(--color-border)',
      background: 'var(--color-neutral-50)'
    }
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * EmptyState — estado vacío con icono, título, descripción y acción.
 */
function EmptyState({
  icon,
  title,
  description,
  action,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      padding: 'var(--space-12) var(--space-6)',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 'var(--radius-lg)',
      background: 'var(--color-primary-subtle)',
      color: 'var(--color-primary)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 'var(--space-4)'
    }
  }, icon), title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--color-text)'
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '6px 0 0',
      fontSize: 14,
      lineHeight: 1.55,
      color: 'var(--color-text-muted)',
      maxWidth: 320
    }
  }, description), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-5)'
    }
  }, action));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ProgressBar — barra de progreso. `variant` o `color` explícito.
 */
function ProgressBar({
  value = 0,
  variant = 'primary',
  color,
  label,
  showValue = false,
  style,
  ...rest
}) {
  const v = Math.max(0, Math.min(100, value));
  const colors = {
    primary: 'var(--color-primary)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)'
  };
  const fill = color || colors[variant] || colors.primary;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, rest), (label || showValue) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 6,
      fontSize: 12.5
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-text-secondary)',
      fontWeight: 500
    }
  }, label), showValue && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-text-muted)',
      fontFamily: 'var(--font-mono)'
    }
  }, v, "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--color-neutral-200)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: v + '%',
      height: '100%',
      borderRadius: 'var(--radius-pill)',
      background: fill,
      transition: 'width .3s ease'
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Toast — notificación efímera (presentacional).
 */
function Toast({
  variant = 'info',
  title,
  message,
  onClose,
  style,
  ...rest
}) {
  const palette = {
    success: {
      fg: 'var(--color-success)',
      bg: 'var(--color-success-subtle)',
      icon: 'M20 6 9 17l-5-5'
    },
    warning: {
      fg: 'var(--color-warning)',
      bg: 'var(--color-warning-subtle)',
      icon: 'M12 9v4m0 4h.01'
    },
    error: {
      fg: 'var(--color-error)',
      bg: 'var(--color-error-subtle)',
      icon: 'M18 6 6 18M6 6l12 12'
    },
    info: {
      fg: 'var(--color-info)',
      bg: 'var(--color-info-subtle)',
      icon: 'M12 16v-4m0-4h.01'
    }
  };
  const p = palette[variant] || palette.info;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      width: 360,
      maxWidth: '100%',
      padding: '12px 14px',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-e2)',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      flex: 'none',
      borderRadius: 'var(--radius-md)',
      background: p.bg,
      color: p.fg,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: p.icon
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--color-text)'
    }
  }, title), message && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      lineHeight: 1.5,
      color: 'var(--color-text-secondary)',
      marginTop: title ? 2 : 0
    }
  }, message)), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Cerrar",
    style: {
      flex: 'none',
      border: 'none',
      background: 'transparent',
      color: 'var(--color-neutral-400)',
      cursor: 'pointer',
      padding: 2,
      lineHeight: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  }))));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
/**
 * Tooltip — etiqueta flotante al pasar el ratón / foco.
 */
function Tooltip({
  content,
  placement = 'top',
  children
}) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: 8
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: 8
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginRight: 8
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: 8
    }
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex'
    },
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false),
    onFocus: () => setShow(true),
    onBlur: () => setShow(false)
  }, children, show && /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: 'absolute',
      zIndex: 900,
      ...pos[placement],
      background: 'var(--color-neutral-900)',
      color: '#fff',
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      fontWeight: 500,
      lineHeight: 1.3,
      padding: '6px 9px',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-e2)',
      whiteSpace: 'nowrap',
      pointerEvents: 'none'
    }
  }, content));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Checkbox — casilla controlada con label opcional.
 */
function Checkbox({
  checked = false,
  onChange,
  label,
  disabled = false,
  id,
  style,
  ...rest
}) {
  const autoId = React.useId ? React.useId() : 'cb';
  const fieldId = id || autoId;
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'var(--color-text)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: 20,
      height: 20,
      flex: 'none',
      borderRadius: 'var(--radius-sm)',
      border: `1.5px solid ${checked ? 'var(--color-primary)' : 'var(--color-border-strong)'}`,
      background: checked ? 'var(--color-primary)' : 'var(--color-surface)',
      transition: 'background .15s ease, border-color .15s ease',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: fieldId,
    type: "checkbox",
    checked: checked,
    disabled: disabled,
    onChange: onChange,
    style: {
      position: 'absolute',
      opacity: 0,
      width: '100%',
      height: '100%',
      margin: 0,
      cursor: 'inherit'
    }
  }, rest)), checked && /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#fff",
    strokeWidth: "3",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "20 6 9 17 4 12"
  }))), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Input — campo de texto con label, hint y estado de error.
 */
function Input({
  label,
  hint,
  error,
  leftIcon,
  size = 'md',
  type = 'text',
  disabled = false,
  required = false,
  id,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useId ? React.useId() : 'in';
  const fieldId = id || autoId;
  const heights = {
    sm: 36,
    md: 44
  };
  const h = heights[size] || heights.md;
  const borderColor = error ? 'var(--color-error)' : focus ? 'var(--color-primary)' : 'var(--color-border)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      display: 'block',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--color-text-secondary)',
      marginBottom: 6
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-error)'
    }
  }, " *")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    }
  }, leftIcon && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 12,
      display: 'inline-flex',
      color: 'var(--color-neutral-400)',
      pointerEvents: 'none'
    }
  }, leftIcon), /*#__PURE__*/React.createElement("input", _extends({
    id: fieldId,
    type: type,
    disabled: disabled,
    "aria-invalid": !!error,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: '100%',
      height: h,
      padding: leftIcon ? '0 12px 0 38px' : '0 12px',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'var(--color-text)',
      background: disabled ? 'var(--color-neutral-100)' : 'var(--color-surface)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      outline: 'none',
      boxShadow: focus && !error ? 'var(--focus-ring)' : 'none',
      transition: 'border-color .15s ease, box-shadow .15s ease',
      boxSizing: 'border-box'
    }
  }, rest))), (error || hint) && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      marginTop: 6,
      color: error ? 'var(--color-error)' : 'var(--color-text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Radio — opción única controlada con label opcional.
 */
function Radio({
  checked = false,
  onChange,
  label,
  name,
  value,
  disabled = false,
  id,
  style,
  ...rest
}) {
  const autoId = React.useId ? React.useId() : 'rd';
  const fieldId = id || autoId;
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'var(--color-text)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: 20,
      height: 20,
      flex: 'none',
      borderRadius: '50%',
      border: `1.5px solid ${checked ? 'var(--color-primary)' : 'var(--color-border-strong)'}`,
      background: 'var(--color-surface)',
      transition: 'border-color .15s ease',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: fieldId,
    type: "radio",
    name: name,
    value: value,
    checked: checked,
    disabled: disabled,
    onChange: onChange,
    style: {
      position: 'absolute',
      opacity: 0,
      width: '100%',
      height: '100%',
      margin: 0,
      cursor: 'inherit'
    }
  }, rest)), checked && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: 'var(--color-primary)'
    }
  })), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Select — desplegable nativo estilizado (con caret).
 */
function Select({
  label,
  hint,
  error,
  size = 'md',
  disabled = false,
  required = false,
  children,
  id,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useId ? React.useId() : 'sel';
  const fieldId = id || autoId;
  const heights = {
    sm: 36,
    md: 44
  };
  const h = heights[size] || heights.md;
  const borderColor = error ? 'var(--color-error)' : focus ? 'var(--color-primary)' : 'var(--color-border)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      display: 'block',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--color-text-secondary)',
      marginBottom: 6
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-error)'
    }
  }, " *")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: fieldId,
    disabled: disabled,
    "aria-invalid": !!error,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: '100%',
      height: h,
      padding: '0 36px 0 12px',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'var(--color-text)',
      background: disabled ? 'var(--color-neutral-100)' : 'var(--color-surface)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      outline: 'none',
      boxShadow: focus && !error ? 'var(--focus-ring)' : 'none',
      transition: 'border-color .15s ease, box-shadow .15s ease',
      appearance: 'none',
      WebkitAppearance: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxSizing: 'border-box'
    }
  }, rest), children), /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      position: 'absolute',
      right: 12,
      top: '50%',
      transform: 'translateY(-50%)',
      color: 'var(--color-neutral-400)',
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "6 9 12 15 18 9"
  }))), (error || hint) && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      marginTop: 6,
      color: error ? 'var(--color-error)' : 'var(--color-text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Switch — interruptor on/off controlado.
 */
function Switch({
  checked = false,
  onChange,
  label,
  disabled = false,
  id,
  style,
  ...rest
}) {
  const autoId = React.useId ? React.useId() : 'sw';
  const fieldId = id || autoId;
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'var(--color-text)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: 40,
      height: 24,
      flex: 'none',
      borderRadius: 'var(--radius-pill)',
      background: checked ? 'var(--color-primary)' : 'var(--color-neutral-300)',
      transition: 'background .18s ease',
      display: 'inline-block'
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: fieldId,
    type: "checkbox",
    role: "switch",
    checked: checked,
    disabled: disabled,
    onChange: onChange,
    style: {
      position: 'absolute',
      opacity: 0,
      width: '100%',
      height: '100%',
      margin: 0,
      cursor: 'inherit'
    }
  }, rest)), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 2,
      left: checked ? 18 : 2,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: '#fff',
      boxShadow: '0 1px 2px rgba(15,23,42,.25)',
      transition: 'left .18s ease'
    }
  })), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Textarea — campo multilínea con label, hint y error.
 */
function Textarea({
  label,
  hint,
  error,
  rows = 4,
  disabled = false,
  required = false,
  id,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useId ? React.useId() : 'ta';
  const fieldId = id || autoId;
  const borderColor = error ? 'var(--color-error)' : focus ? 'var(--color-primary)' : 'var(--color-border)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      display: 'block',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--color-text-secondary)',
      marginBottom: 6
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-error)'
    }
  }, " *")), /*#__PURE__*/React.createElement("textarea", _extends({
    id: fieldId,
    rows: rows,
    disabled: disabled,
    "aria-invalid": !!error,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: '100%',
      padding: '10px 12px',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      lineHeight: 1.5,
      color: 'var(--color-text)',
      background: disabled ? 'var(--color-neutral-100)' : 'var(--color-surface)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      outline: 'none',
      resize: 'vertical',
      boxShadow: focus && !error ? 'var(--focus-ring)' : 'none',
      transition: 'border-color .15s ease, box-shadow .15s ease',
      boxSizing: 'border-box'
    }
  }, rest)), (error || hint) && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      marginTop: 6,
      color: error ? 'var(--color-error)' : 'var(--color-text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumb.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Breadcrumb — ruta de navegación.
 */
function Breadcrumb({
  items = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    "aria-label": "Ruta",
    style: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      ...style
    }
  }, rest), items.map((it, i) => {
    const last = i === items.length - 1;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, it.href && !last ? /*#__PURE__*/React.createElement("a", {
      href: it.href,
      style: {
        color: 'var(--color-text-muted)',
        textDecoration: 'none',
        fontWeight: 500
      }
    }, it.label) : /*#__PURE__*/React.createElement("span", {
      style: {
        color: last ? 'var(--color-text)' : 'var(--color-text-muted)',
        fontWeight: last ? 600 : 500
      }
    }, it.label), !last && /*#__PURE__*/React.createElement("svg", {
      width: "14",
      height: "14",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--color-neutral-400)",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("polyline", {
      points: "9 18 15 12 9 6"
    })));
  }));
}
Object.assign(__ds_scope, { Breadcrumb });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumb.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SidebarNav.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * SidebarNav — navegación lateral vertical (escritorio).
 */
function SidebarNav({
  items = [],
  value,
  onChange,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(null);
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, rest), items.map(it => {
    const active = it.value === value;
    const hovered = hover === it.value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      onClick: () => onChange && onChange(it.value),
      onMouseEnter: () => setHover(it.value),
      onMouseLeave: () => setHover(null),
      "aria-current": active ? 'page' : undefined,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        width: '100%',
        padding: '9px 12px',
        minHeight: 44,
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        background: active ? 'var(--color-primary-subtle)' : hovered ? 'var(--color-neutral-100)' : 'transparent',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background .12s ease, color .12s ease'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        flex: 'none',
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, it.icon), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, it.label), it.badge != null && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--color-on-primary)',
        background: 'var(--color-primary)',
        borderRadius: 'var(--radius-pill)',
        padding: '1px 7px',
        minWidth: 18,
        textAlign: 'center'
      }
    }, it.badge));
  }));
}
Object.assign(__ds_scope, { SidebarNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SidebarNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tabs — pestañas de navegación. Controlado por `value`.
 */
function Tabs({
  items = [],
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    style: {
      display: 'flex',
      gap: 4,
      borderBottom: '1px solid var(--color-border)',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, rest), items.map(it => {
    const active = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      role: "tab",
      "aria-selected": active,
      onClick: () => onChange && onChange(it.value),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '10px 14px',
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        fontWeight: 600,
        color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        background: 'transparent',
        border: 'none',
        borderBottom: `2px solid ${active ? 'var(--color-primary)' : 'transparent'}`,
        marginBottom: -1,
        cursor: 'pointer',
        transition: 'color .15s ease, border-color .15s ease'
      }
    }, it.icon, it.label, it.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        color: active ? 'var(--color-primary-hover)' : 'var(--color-text-muted)',
        background: active ? 'var(--color-primary-subtle)' : 'var(--color-neutral-100)',
        borderRadius: 'var(--radius-pill)',
        padding: '1px 7px'
      }
    }, it.count));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.KanbanColumn = __ds_scope.KanbanColumn;

__ds_ns.Pagination = __ds_scope.Pagination;

__ds_ns.Table = __ds_scope.Table;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Breadcrumb = __ds_scope.Breadcrumb;

__ds_ns.SidebarNav = __ds_scope.SidebarNav;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
