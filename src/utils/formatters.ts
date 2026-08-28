// Helper formatters for Indonesian warehouse standards

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatDateShort(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return isoString;
  }
}

export function generateItemCode(category: string, name?: string): string {
  const catPrefix = category
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase() || 'ITM';
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `GDG-${catPrefix}-${randomSuffix}`;
}

// Alias for compatibility
export const generateSKU = generateItemCode;

export function generateRandomBarcode(itemCode?: string): string {
  if (itemCode && itemCode.trim()) {
    return itemCode.trim().toUpperCase();
  }
  return generateItemCode('UMUM');
}
