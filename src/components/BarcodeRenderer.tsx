import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface BarcodeRendererProps {
  value: string;
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}

// Seamless QR-based Renderer (replaces 1D Barcode exclusively with 2D QR Code)
export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  height = 80,
  displayValue = true,
  className = '',
}) => {
  if (!value) {
    return (
      <div className="p-2 bg-slate-100 rounded text-slate-400 text-xs font-mono">
        Kosong
      </div>
    );
  }

  const qrSize = Math.max(64, Math.min(height, 160));

  return (
    <div className={`inline-flex flex-col items-center justify-center p-1.5 bg-white rounded-lg ${className}`}>
      <QRCodeSVG value={value} size={qrSize} level="M" includeMargin={true} />
      {displayValue && (
        <span className="text-[10px] font-mono font-semibold text-slate-700 mt-1 tracking-wider">
          {value}
        </span>
      )}
    </div>
  );
};
