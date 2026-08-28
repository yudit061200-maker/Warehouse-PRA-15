import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InventoryItem, Transaction } from '../types';
import { formatRupiah, formatDateTime } from './formatters';

// Export Inventory to Excel
export function exportInventoryToExcel(items: InventoryItem[], filename = 'Laporan_Inventory_Gudang') {
  const rows = items.map((item, index) => {
    const status = item.quantity === 0 ? 'HABIS (Out of Stock)' : item.quantity <= item.minStock ? 'STOK MINIMUM (Low Stock)' : 'AMAN (In Stock)';
    const totalValuation = item.quantity * item.unitPrice;

    return {
      No: index + 1,
      'Item Code': item.sku,
      Barcode: item.barcode,
      'Nama Barang': item.name,
      Kategori: item.category,
      'Jumlah Stok': item.quantity,
      'Stok Minimum': item.minStock,
      Satuan: item.unit,
      'Harga Satuan (IDR)': item.unitPrice,
      'Total Nilai Aset (IDR)': totalValuation,
      'Lokasi Rak': item.location,
      Supplier: item.supplier || '-',
      Status: status,
      'Update Terakhir': formatDateTime(item.lastUpdated),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Inventory');

  // Auto column width
  const maxColLengths = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.max(key.length, 12),
  }));
  worksheet['!cols'] = maxColLengths;

  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// Export Transactions to Excel
export function exportTransactionsToExcel(transactions: Transaction[], filename = 'Riwayat_Transaksi_Gudang') {
  const rows = transactions.map((tx, index) => ({
    No: index + 1,
    Waktu: formatDateTime(tx.timestamp),
    'No Referensi / PO': tx.referenceNumber,
    'Tipe Transaksi': tx.type === 'IN' ? 'Pemasukan (IN)' : tx.type === 'OUT' ? 'Pengeluaran (OUT)' : 'Penyesuaian (ADJUST)',
    'Item Code': tx.itemSku,
    'Nama Barang': tx.itemName,
    Jumlah: tx.quantity,
    'Stok Sebelumnya': tx.previousStock,
    'Stok Sesudah': tx.newStock,
    'Mitra / Tujuan': tx.partner,
    Operator: tx.operator,
    Catatan: tx.notes || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Transaksi');

  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// Export Inventory to Professional PDF
export function exportInventoryToPDF(items: InventoryItem[], title = 'Laporan Status Stok & Nilai Inventaris') {
  const doc = new jsPDF('landscape', 'mm', 'a4');

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('GUDANGPRO - SISTEM MANAJEMEN INVENTORY PERGUDANGAN', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dicetak pada: ${formatDateTime(new Date().toISOString())} | Dokumen Resmi Pergudangan`, 14, 18);

  // Report Summary Box
  const totalItems = items.length;
  const totalStock = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalValuation = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const lowStockCount = items.filter((i) => i.quantity <= i.minStock).length;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 28, 269, 18, 2, 2, 'FD');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${title.toUpperCase()}`, 18, 35);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Total Item: ${totalItems} | Total Unit Fisik: ${totalStock} | Total Valuasi Aset: ${formatRupiah(totalValuation)} | Perlu Restock: ${lowStockCount} Item`,
    18,
    41
  );

  // Table
  const tableData = items.map((item, index) => [
    index + 1,
    item.sku,
    item.barcode,
    item.name,
    item.category,
    `${item.quantity} ${item.unit}`,
    `${item.minStock} ${item.unit}`,
    item.location,
    formatRupiah(item.unitPrice),
    formatRupiah(item.quantity * item.unitPrice),
    item.quantity === 0 ? 'HABIS' : item.quantity <= item.minStock ? 'MENIPIS' : 'AMAN',
  ]);

  autoTable(doc, {
    startY: 50,
    head: [[
      'No',
      'Item Code',
      'Barcode',
      'Nama Barang',
      'Kategori',
      'Stok',
      'Min',
      'Lokasi Rak',
      'Harga Satuan',
      'Total Nilai',
      'Status',
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 28 },
      3: { cellWidth: 50 },
      4: { cellWidth: 32 },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 24 },
      8: { cellWidth: 26, halign: 'right' },
      9: { cellWidth: 28, halign: 'right' },
      10: { cellWidth: 18, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 10) {
        const val = data.cell.raw;
        if (val === 'HABIS') {
          data.cell.styles.textColor = [220, 38, 38]; // Red
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'MENIPIS') {
          data.cell.styles.textColor = [217, 119, 6]; // Amber
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [22, 101, 52]; // Green
        }
      }
    },
  });

  // Footer Signatures
  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  if (finalY < 165) {
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.text('Dibuat Oleh,', 30, finalY + 15);
    doc.text('( Staf Administrasi Gudang )', 20, finalY + 30);

    doc.text('Disetujui & Diverifikasi Oleh,', 220, finalY + 15);
    doc.text('( Kepala Logistik & Gudang )', 215, finalY + 30);
  }

  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// Export Transactions to PDF
export function exportTransactionsToPDF(transactions: Transaction[], title = 'Laporan Mutasi & Transaksi Stok Gudang') {
  const doc = new jsPDF('landscape', 'mm', 'a4');

  // Header Banner
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('GUDANGPRO - LAPORAN MUTASI ARUS BARANG', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Waktu Cetak: ${formatDateTime(new Date().toISOString())} | Dokumen Audit Logistik`, 14, 18);

  const tableData = transactions.map((tx, index) => [
    index + 1,
    formatDateTime(tx.timestamp),
    tx.referenceNumber,
    tx.type === 'IN' ? 'MASUK (IN)' : tx.type === 'OUT' ? 'KELUAR (OUT)' : 'PENYESUAIAN',
    tx.itemSku,
    tx.itemName,
    tx.quantity,
    `${tx.previousStock} -> ${tx.newStock}`,
    tx.partner,
    tx.operator,
    tx.notes || '-',
  ]);

  autoTable(doc, {
    startY: 32,
    head: [[
      'No',
      'Waktu',
      'No Referensi',
      'Jenis',
      'Item Code',
      'Nama Barang',
      'Jumlah',
      'Perubahan Stok',
      'Mitra / Tujuan',
      'Operator',
      'Keterangan',
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 26 },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 24 },
      5: { cellWidth: 46 },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 24, halign: 'center' },
      8: { cellWidth: 32 },
      9: { cellWidth: 22 },
      10: { cellWidth: 30 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const val = data.cell.raw;
        if (val === 'MASUK (IN)') {
          data.cell.styles.textColor = [22, 101, 52]; // Green
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'KELUAR (OUT)') {
          data.cell.styles.textColor = [220, 38, 38]; // Red
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
