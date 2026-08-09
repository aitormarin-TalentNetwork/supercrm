const TINTS = [
  { bg: "#EFF4FF", fg: "#1D4ED8" },
  { bg: "#ECFDF5", fg: "#0F766E" },
  { bg: "#EEF2FF", fg: "#4F46E5" },
  { bg: "#FEF3C7", fg: "#B45309" },
  { bg: "#FFF1F2", fg: "#BE123C" },
  { bg: "#F1F5F9", fg: "#475569" },
];

const SIZES = { xs: 22, sm: 28, md: 36, lg: 48 } as const;

interface AvatarProps {
  name?: string;
  size?: keyof typeof SIZES;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function pick(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}

export function Avatar({ name = "", size = "md" }: AvatarProps) {
  const dim = SIZES[size];
  const tint = pick(name);
  return (
    <span
      title={name || undefined}
      className="inline-flex flex-none items-center justify-center rounded-full font-sans font-semibold"
      style={{
        width: dim,
        height: dim,
        fontSize: Math.round(dim * 0.4),
        background: tint.bg,
        color: tint.fg,
      }}
    >
      {initials(name)}
    </span>
  );
}
