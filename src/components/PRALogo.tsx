import React from 'react';

interface PRALogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const PRALogo: React.FC<PRALogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = false,
}) => {
  const sizeMap = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-10 w-auto',
    xl: 'h-12 w-auto',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 500 230"
        className={`${sizeMap[size]} shrink-0 drop-shadow-xs select-none`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="PRA Logo"
      >
        {/* Outer Red Pill Container */}
        <rect
          x="12"
          y="12"
          width="476"
          height="206"
          rx="103"
          fill="#242528"
          stroke="#E52329"
          strokeWidth="24"
        />
        {/* Yellow PRA Text */}
        <text
          x="250"
          y="128"
          dominantBaseline="central"
          textAnchor="middle"
          fill="#FFE600"
          fontSize="144"
          fontWeight="900"
          fontFamily="'Arial Black', Impact, 'Segoe UI Black', system-ui, sans-serif"
          letterSpacing="-2"
        >
          PRA
        </text>
      </svg>

      {showSubtitle && (
        <div className="flex flex-col min-w-0 text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-white text-sm tracking-tight">
              PRA
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white tracking-wide uppercase">
              Warehouse
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium truncate">
            Inventory & QR System
          </span>
        </div>
      )}
    </div>
  );
};
