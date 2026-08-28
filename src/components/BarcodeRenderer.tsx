import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { QRCodeSVG } from 'qrcode.react';

interface BarcodeRendererProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'UPC' | 'QR';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  format = 'CODE128',
  width = 1.8,
  height = 50,
  displayValue = true,
  fontSize = 13,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (format === 'QR') return;
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format: format === 'EAN13' && value.length === 13 ? 'EAN13' : 'CODE128',
        width,
        height,
        displayValue,
        fontSize,
        font: 'monospace',
        textAlign: 'center',
        textPosition: 'bottom',
        textMargin: 3,
        background: 'transparent',
        lineColor: '#0f172a',
        margin: 4,
      });
    } catch (err) {
      console.warn('JsBarcode render fallback:', err);
      // fallback to CODE128 if specific format fails
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue,
          fontSize,
          margin: 4,
        });
      } catch (e) {
        console.error('Failed to render barcode:', e);
      }
    }
  }, [value, format, width, height, displayValue, fontSize]);

  if (format === 'QR') {
    return (
      <div className={`inline-flex flex-col items-center justify-center p-2 bg-white rounded-lg ${className}`}>
        <QRCodeSVG value={value} size={Math.max(height, 80)} level="M" />
        {displayValue && (
          <span className="text-[11px] font-mono font-medium text-slate-700 mt-1">{value}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex justify-center items-center overflow-x-auto bg-white rounded p-1 ${className}`}>
      <svg ref={svgRef} className="max-w-full" />
    </div>
  );
};
