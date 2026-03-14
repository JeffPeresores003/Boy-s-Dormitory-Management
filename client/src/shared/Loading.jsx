// Shared loading spinner component
import React from 'react';

const Loading = ({ text = 'Signing in' }) => (
  <div className="flex flex-row items-center justify-center py-6">
    <span className="text-lg text-primary-700 font-semibold">{text}</span>
    <span className="ml-2 flex">
      <span className="dot-animation">.</span>
      <span className="dot-animation" style={{ animationDelay: '0.2s' }}>. </span>
      <span className="dot-animation" style={{ animationDelay: '0.4s' }}>. </span>
    </span>
  </div>
);

export default Loading;
