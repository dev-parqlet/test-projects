"use client";

export default function CoinExplosion() {
  const pts = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    const dist = 36 + (i % 3) * 14;
    const size = i % 3 === 0 ? 7 : i % 3 === 1 ? 5 : 3;
    const color = i % 2 === 0 ? "#C7E51F" : i % 3 === 1 ? "#E9F5A5" : "#ffffff";
    return { tx: Math.cos(angle) * dist, ty: Math.sin(angle) * dist, size, color, delay: i * 18 };
  });
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2" style={{ zIndex: 30 }}>
      {/* Particles */}
      {pts.map((p, i) => (
        <span key={i} className="absolute rounded-full" style={{
          width: p.size, height: p.size,
          background: p.color,
          marginLeft: -p.size / 2, marginTop: -p.size / 2,
          animation: `particleFly 0.7s ease-out ${p.delay}ms forwards`,
          ["--tx" as string]: `${p.tx}px`,
          ["--ty" as string]: `${p.ty}px`,
        }} />
      ))}
    </div>
  );
}
