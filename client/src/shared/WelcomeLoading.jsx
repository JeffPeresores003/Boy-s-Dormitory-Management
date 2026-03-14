// Animated Welcome Admin loading component
import React from 'react';

const WelcomeLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <svg viewBox="0 0 900 200" style={{ width: '80vw', height: '30vh', display: 'block' }}>
      <defs>
        <linearGradient id="welcomeGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#26c6da" />
          <stop offset="20%" stopColor="#aed581" />
          <stop offset="40%" stopColor="#ffd600" />
          <stop offset="60%" stopColor="#ff9800" />
          <stop offset="80%" stopColor="#ff4081" />
          <stop offset="100%" stopColor="#29b6f6" />
        </linearGradient>
      </defs>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="Pacifico, cursive"
        fontSize="120"
        fill="url(#welcomeGradient)"
        className="welcome-svg-animation"
      >
        Welcome Admin
      </text>
    </svg>
  </div>
);

export default WelcomeLoading;
