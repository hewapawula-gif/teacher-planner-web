export default function AppIcon() {
  return (
    <div style={{
      width: "100vw", height: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#1a1a1a"
    }}>
      <svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Dark tile background gradient */}
          <linearGradient id="tileBg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2a2a2a" />
            <stop offset="100%" stopColor="#0d0d0d" />
          </linearGradient>

          {/* Metallic blue gradient for "SL" */}
          <linearGradient id="metalSL" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a8d4f5" />
            <stop offset="20%" stopColor="#6aaee8" />
            <stop offset="50%" stopColor="#2e7fc2" />
            <stop offset="75%" stopColor="#1a5c99" />
            <stop offset="100%" stopColor="#0d3d6b" />
          </linearGradient>

          {/* Metallic blue gradient for "TEACHER" */}
          <linearGradient id="metalTeacher" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8ec8f0" />
            <stop offset="30%" stopColor="#4a9ad4" />
            <stop offset="60%" stopColor="#1e6aaa" />
            <stop offset="100%" stopColor="#0a3a6e" />
          </linearGradient>

          {/* Highlight shimmer for SL */}
          <linearGradient id="shimmer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="40%" stopColor="white" stopOpacity="0.05" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>

          {/* Drop shadow filter */}
          <filter id="textShadow" x="-10%" y="-10%" width="130%" height="140%">
            <feDropShadow dx="3" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.7" />
          </filter>

          {/* Outer glow for SL */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Tile clip */}
          <clipPath id="tileClip">
            <rect width="512" height="512" rx="90" ry="90" />
          </clipPath>
        </defs>

        {/* ── Tile background ── */}
        <rect width="512" height="512" rx="90" ry="90" fill="url(#tileBg)" />

        {/* Subtle inner border highlight */}
        <rect x="2" y="2" width="508" height="508" rx="89" ry="89"
          fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.08" />

        {/* ── Four coloured squares (left side) ── */}
        {/* Green */}
        <rect x="62" y="148" width="52" height="52" rx="8" fill="#4CAF50" />
        <rect x="62" y="148" width="52" height="22" rx="8" fill="white" fillOpacity="0.18" />

        {/* Red */}
        <rect x="62" y="212" width="52" height="52" rx="8" fill="#E53935" />
        <rect x="62" y="212" width="52" height="22" rx="8" fill="white" fillOpacity="0.18" />

        {/* Yellow */}
        <rect x="62" y="276" width="52" height="52" rx="8" fill="#FDD835" />
        <rect x="62" y="276" width="52" height="22" rx="8" fill="white" fillOpacity="0.18" />

        {/* Gray */}
        <rect x="62" y="340" width="52" height="52" rx="8" fill="#757575" />
        <rect x="62" y="340" width="52" height="22" rx="8" fill="white" fillOpacity="0.18" />

        {/* ── "SL" lettering ── */}
        <text
          x="148" y="330"
          fontFamily="'Arial Black', 'Impact', sans-serif"
          fontWeight="900"
          fontSize="230"
          fill="url(#metalSL)"
          filter="url(#textShadow)"
          letterSpacing="-8"
        >
          SL
        </text>

        {/* Shimmer overlay on SL */}
        <text
          x="148" y="330"
          fontFamily="'Arial Black', 'Impact', sans-serif"
          fontWeight="900"
          fontSize="230"
          fill="url(#shimmer)"
          letterSpacing="-8"
          opacity="0.6"
        >
          SL
        </text>

        {/* ── "TEACHER" lettering ── */}
        <text
          x="148" y="415"
          fontFamily="'Arial Black', 'Impact', sans-serif"
          fontWeight="900"
          fontSize="88"
          fill="url(#metalTeacher)"
          filter="url(#textShadow)"
          letterSpacing="6"
        >
          TEACHER
        </text>

        {/* Shimmer on TEACHER */}
        <text
          x="148" y="415"
          fontFamily="'Arial Black', 'Impact', sans-serif"
          fontWeight="900"
          fontSize="88"
          fill="url(#shimmer)"
          letterSpacing="6"
          opacity="0.5"
        >
          TEACHER
        </text>

        {/* ── Subtle vignette overlay ── */}
        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="60%" stopColor="black" stopOpacity="0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.55" />
        </radialGradient>
        <rect width="512" height="512" rx="90" ry="90" fill="url(#vignette)" />
      </svg>
    </div>
  );
}
