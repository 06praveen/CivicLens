export function AshokaChakra({ className = "h-20 w-20" }: { className?: string }) {
  const spokes = Array.from({ length: 24 });
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Official 24-Spoked Ashoka Chakra"
    >
      {/* Optional subtle white separation halo for contrast over tricolor wave */}
      <circle cx="50" cy="50" r="48" fill="#FFFFFF" fillOpacity="0.45" />

      {/* Outer Rim */}
      <circle cx="50" cy="50" r="46" fill="none" stroke="#000080" strokeWidth="3.2" />
      {/* Inner Rim */}
      <circle cx="50" cy="50" r="39" fill="none" stroke="#000080" strokeWidth="1.8" />
      
      {/* 24 Small Outer Dots/Arcs between spokes on outer rim */}
      {spokes.map((_, i) => (
        <circle
          key={`dot-${i}`}
          cx={50 + 42.5 * Math.cos((i * 15 * Math.PI) / 180)}
          cy={50 + 42.5 * Math.sin((i * 15 * Math.PI) / 180)}
          r="1.3"
          fill="#000080"
        />
      ))}

      {/* Central Hub */}
      <circle cx="50" cy="50" r="8.5" fill="#000080" />
      <circle cx="50" cy="50" r="3" fill="#FFFFFF" />

      {/* 24 Radial Spokes with Triangular Bases */}
      {spokes.map((_, i) => (
        <g key={`spoke-${i}`} transform={`rotate(${i * 15} 50 50)`}>
          <line x1="50" y1="50" x2="50" y2="11" stroke="#000080" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M 48.3 12.5 L 50 9.2 L 51.7 12.5 Z" fill="#000080" />
        </g>
      ))}
    </svg>
  );
}
