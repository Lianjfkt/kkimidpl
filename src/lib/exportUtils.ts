import * as XLSX from 'xlsx';

export interface ExportTableOptions {
  fileName: string;
  sheetName?: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
  colWidths?: number[];
  delimiter?: string;
}

/**
 * Sanitizes file name by removing characters forbidden in standard OS file systems
 */
export function sanitizeFileName(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '_').trim();
}

/**
 * Safely triggers browser file download by attaching anchor to DOM
 */
export function triggerBrowserDownload(blob: Blob, fullFileName: string): void {
  if (typeof window === 'undefined') return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', sanitizeFileName(fullFileName));
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Cleanup with delay to ensure download initiates reliably across browsers
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 300);
}

/**
 * Formats a single CSV field following RFC 4180 standards
 */
function formatCsvField(val: string | number | boolean | null | undefined, delimiter: string): string {
  if (val === null || val === undefined) {
    return '';
  }
  const str = String(val);
  // If field contains delimiter, double quote, or newlines, enclose in quotes and escape quotes
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports tabular data to standard RFC-4180 CSV with UTF-8 Byte Order Mark (BOM)
 * UTF-8 BOM ensures Microsoft Excel on Windows/macOS correctly detects UTF-8 characters without mojibake.
 */
export function exportToCSV({
  fileName,
  headers,
  rows,
  delimiter = ',',
}: Omit<ExportTableOptions, 'sheetName' | 'colWidths'>): void {
  const headerLine = headers.map((h) => formatCsvField(h, delimiter)).join(delimiter);
  const dataLines = rows.map((row) =>
    row.map((cell) => formatCsvField(cell, delimiter)).join(delimiter)
  );

  // Prepend UTF-8 BOM (\uFEFF)
  const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const finalName = fileName.toLowerCase().endsWith('.csv') ? fileName : `${fileName}.csv`;

  triggerBrowserDownload(blob, finalName);
}

/**
 * Exports tabular data to native Microsoft Excel (.xlsx) workbook with auto-fitted column widths
 */
export function exportToExcel({
  fileName,
  sheetName = 'Data',
  headers,
  rows,
  colWidths,
}: ExportTableOptions): void {
  const wb = XLSX.utils.book_new();

  // Create sheet from array of arrays
  const aoa = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Calculate dynamic column widths if not explicitly provided
  if (!colWidths || colWidths.length === 0) {
    colWidths = headers.map((header, colIdx) => {
      let maxLen = header.length;
      for (const row of rows) {
        const cell = row[colIdx];
        if (cell !== null && cell !== undefined) {
          const strLen = String(cell).length;
          if (strLen > maxLen) maxLen = strLen;
        }
      }
      // Bound between 12 and 50 characters
      return Math.min(Math.max(maxLen + 3, 12), 50);
    });
  }

  ws['!cols'] = colWidths.map((wch) => ({ wch }));

  const cleanSheetName = sheetName.replace(/[/\\?*[\]]/g, '').slice(0, 31) || 'Data';
  XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const finalName = fileName.toLowerCase().endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  triggerBrowserDownload(blob, finalName);
}

/**
 * Unified exporter providing dual format dispatch
 */
export function exportTableData(
  options: ExportTableOptions & { format: 'xlsx' | 'csv' }
): void {
  if (options.format === 'xlsx') {
    exportToExcel(options);
  } else {
    exportToCSV(options);
  }
}

