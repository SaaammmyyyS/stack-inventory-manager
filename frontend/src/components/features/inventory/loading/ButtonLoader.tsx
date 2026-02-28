import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonLoaderProps {
  size?: number;
  className?: string;
}

const ButtonLoader: React.FC<ButtonLoaderProps> = ({ size = 14, className = "" }) => {
  return (
    <Loader2 
      className={`animate-spin ${className}`}
      size={size}
    />
  );
};

export default ButtonLoader;
