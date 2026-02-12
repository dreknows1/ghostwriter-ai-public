
import React from 'react';

export const Logo: React.FC<{ size?: number; className?: string }> = ({ size = 120, className = "" }) => (
  <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
    <img 
      src="https://storage.googleapis.com/msgsndr/TJwfY2jMwHepEZtkvXZV/media/69626d1ff13bc3911f4cc2db.png" 
      alt="Song Ghost logo" 
      className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(34,211,238,0.2)]"
    />
  </div>
);
