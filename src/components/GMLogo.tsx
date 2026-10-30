import React from 'react';

interface GMLogoProps {
  className?: string;
  size?: number;
}

export const GMLogo: React.FC<GMLogoProps> = ({ className = "w-9 h-9", size }) => {
  return (
    <img 
      src="/assets/aistudio/GM_Logo-ai_f89efb6e.png" 
      alt="GreenMart GM Logo" 
      className={`object-contain ${className}`}
      style={size ? { width: size, height: size } : undefined}
      loading="eager"
    />
  );
};
