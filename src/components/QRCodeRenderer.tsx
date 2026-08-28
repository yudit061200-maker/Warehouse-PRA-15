import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeRendererProps {
  value: string;
  size?: number;
  includeMargin?: boolean;
  level?: 'L' | 'M' | 'Q' | 'H';
  className?: string;
  displayValue?: boolean;
  title?: string;
}

export const QRCodeRenderer: React.FC<QRCodeRendererProps> = ({
  value,
  size = 110,
  includeMargin = true,
  level = 'M',
  className = '',
  displayValue = false,
  title,
}) => {
  if (!value) {
    return (
      <div className="flex items-center justify-center p-3 bg-slate-100 rounded-lg text-slate-400 text-xs font-mono">
        No QR Data
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center justify-center bg-white ${className}`}>
      <QRCodeSVG
        value={value}
        size={size}
        level={level}
        includeMargin={includeMargin}
        className="rounded"
      />
      {title && (
        <span className="text-[11px] font-bold text-slate-900 mt-1 max-w-[130px] truncate text-center block">
          {title}
        </span>
      )}
      {displayValue && (
        <span className="text-[10px] font-mono font-semibold text-slate-600 tracking-wider mt-0.5">
          {value}
        </span>
      )}
    </div>
  );
};
