/**
 * IndianWavingFlag — Smooth Large Diagonal Curved Tricolor Ribbon Background.
 * 
 * Visual Progression across Viewport:
 * - LEFT: Warm Saffron (#F5A13A) behind CivicLens branding.
 * - CENTER: Clean White (#FFFFFF) with gentle curved boundary for clear Ashoka Chakra visibility.
 * - RIGHT: Rich Indian Green (#159615) with soft blended transitions.
 */
export function IndianWavingFlag() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      <svg
        className="w-full h-full"
        preserveAspectRatio="none"
        viewBox="0 0 1440 160"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Warm Saffron Gradient (#F5A13A) */}
          <linearGradient id="saffronFlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F5A13A" />
            <stop offset="70%" stopColor="#FF9800" />
            <stop offset="100%" stopColor="#FFA726" />
          </linearGradient>

          {/* Rich Indian Green Gradient (#159615) */}
          <linearGradient id="greenFlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2E7D32" />
            <stop offset="50%" stopColor="#159615" />
            <stop offset="100%" stopColor="#1B5E20" />
          </linearGradient>

          {/* Soft blur filter for blended transitions between color zones */}
          <filter id="softBlend" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Base Background Fill (Pure White #FFFFFF in center) */}
        <rect width="1440" height="160" fill="#FFFFFF" />

        {/* 1. Saffron Section — Large Sweeping Curve from Top-Left across Left/Center */}
        <path
          d="
            M 0 0 
            L 750 0 
            C 620 45, 520 110, 360 120 
            C 240 128, 120 100, 0 115 
            Z
          "
          fill="url(#saffronFlow)"
        />

        {/* Soft Saffron-to-White blended edge */}
        <path
          d="
            M 0 0 
            L 780 0 
            C 650 50, 540 115, 380 125 
            C 260 132, 130 105, 0 120 
            Z
          "
          fill="url(#saffronFlow)"
          opacity="0.3"
          filter="url(#softBlend)"
        />

        {/* 2. Green Section — Large Sweeping Curve from Bottom-Right across Right/Center */}
        <path
          d="
            M 1440 160 
            L 680 160 
            C 800 115, 920 45, 1080 35 
            C 1200 28, 1325 55, 1440 40 
            Z
          "
          fill="url(#greenFlow)"
        />

        {/* Soft Green-to-White blended edge */}
        <path
          d="
            M 1440 160 
            L 650 160 
            C 770 110, 890 40, 1050 30 
            C 1180 22, 1310 50, 1440 35 
            Z
          "
          fill="url(#greenFlow)"
          opacity="0.3"
          filter="url(#softBlend)"
        />
      </svg>
    </div>
  );
}
