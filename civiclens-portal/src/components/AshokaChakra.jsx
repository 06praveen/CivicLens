export default function AshokaChakra({ size = 100, color = '#0a1e4d', className = '' }) {
  const spokes = Array.from({ length: 24 })
  const radius = size / 2
  const spokeLength = radius - 6

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Ashoka Chakra"
      className={className}
    >
      <circle
        cx={radius}
        cy={radius}
        r={radius - 3}
        fill="none"
        stroke={color}
        strokeWidth="3"
      />
      {spokes.map((_, i) => {
        const angle = (i * 360) / spokes.length
        return (
          <line
            key={i}
            x1={radius}
            y1={radius}
            x2={radius}
            y2={radius - spokeLength}
            stroke={color}
            strokeWidth="2"
            transform={`rotate(${angle} ${radius} ${radius})`}
          />
        )
      })}
      <circle cx={radius} cy={radius} r={radius / 10} fill={color} />
    </svg>
  )
}
