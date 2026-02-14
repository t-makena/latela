// ============= Export Utilities =============

/**
 * Convert an array of objects to CSV string
 */
export const arrayToCSV = (data: Record<string, unknown>[], headers?: string[]): string => {
  if (data.length === 0) return '';

  const keys = headers || Object.keys(data[0]);
  const headerRow = keys.join(',');
  
  const rows = data.map(row =>
    keys.map(key => {
      const value = row[key];
      const stringValue = value === null || value === undefined ? '' : String(value);
      // Escape commas and quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',')
  );

  return [headerRow, ...rows].join('\n');
};

/**
 * Trigger a file download in the browser
 */
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Download data as CSV
 */
export const downloadCSV = (data: Record<string, unknown>[], filename: string, headers?: string[]) => {
  const csv = arrayToCSV(data, headers);
  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
};

/**
 * Download data as Excel (TSV with .xls extension for basic compatibility)
 */
export const downloadExcel = (data: Record<string, unknown>[], filename: string, headers?: string[]) => {
  if (data.length === 0) return;
  
  const keys = headers || Object.keys(data[0]);
  const headerRow = keys.join('\t');
  
  const rows = data.map(row =>
    keys.map(key => {
      const value = row[key];
      return value === null || value === undefined ? '' : String(value);
    }).join('\t')
  );

  const tsv = [headerRow, ...rows].join('\n');
  downloadFile(tsv, `${filename}.xls`, 'application/vnd.ms-excel');
};

/**
 * Open data in Google Sheets via CSV import URL
 */
export const openInGoogleSheets = (data: Record<string, unknown>[], headers?: string[]) => {
  const csv = arrayToCSV(data, headers);
  const encoded = encodeURIComponent(csv);
  // Use a data URI approach: create a temporary CSV, then open Google Sheets import
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  // Open Google Sheets with a blank sheet - user can then paste/import
  // Since direct CSV import via URL requires a hosted file, we download CSV and open Sheets
  downloadFile(csv, 'latela-export.csv', 'text/csv;charset=utf-8;');
  window.open('https://sheets.google.com/create', '_blank');
};

/**
 * Format transaction data for export
 */
export const formatTransactionsForExport = (transactions: Array<{
  transaction_date: string;
  description: string | null;
  parent_category_name: string | null;
  subcategory_name: string | null;
  amount: number;
  balance: number | null;
  type: string;
}>) => {
  return transactions.map(t => ({
    Date: t.transaction_date,
    Description: t.description || '',
    Category: t.parent_category_name || 'Uncategorised',
    Subcategory: t.subcategory_name || '',
    Amount: t.amount.toFixed(2),
    Balance: t.balance?.toFixed(2) || '',
    Type: t.type,
  }));
};

/**
 * Format budget items for export
 */
export const formatBudgetItemsForExport = (
  items: Array<{ name: string; frequency: string; amount: number }>,
  calculateMonthly: (item: { name: string; frequency: string; amount: number }) => number
) => {
  return items.map(item => ({
    Name: item.name,
    Frequency: item.frequency,
    'Budgeted Amount': item.amount.toFixed(2),
    'Monthly Equivalent': calculateMonthly(item).toFixed(2),
  }));
};

/**
 * Format goals for export
 */
export const formatGoalsForExport = (goals: Array<{
  name: string;
  monthlyAllocation: number;
  amountSaved: number;
  target: number;
  timeline: string;
  progress: number;
}>) => {
  return goals.map(g => ({
    Name: g.name,
    'Monthly Allocation': g.monthlyAllocation.toFixed(2),
    'Amount Saved': g.amountSaved.toFixed(2),
    Target: g.target.toFixed(2),
    Timeline: g.timeline,
    'Progress %': g.progress,
  }));
};
