interface AvatarProps {
  size?: number;
  src?: string;
  alt?: string;
  name?: string | null;
}

export function Avatar({ size = 36, src = "/avatar.jpg", alt = "User avatar", name }: AvatarProps) {
  const initials = name
    ? name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
    : null;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        overflow: "hidden",
        background: "var(--color-fill-weak)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {initials ? (
        <span style={{
          fontSize: Math.round(size * 0.38),
          fontFamily: "var(--font-family-body)",
          fontWeight: 500,
          color: "var(--color-text-strong)",
          lineHeight: 1,
          userSelect: "none",
        }}>
          {initials}
        </span>
      ) : (
        <img
          src={src}
          alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}
    </div>
  );
}