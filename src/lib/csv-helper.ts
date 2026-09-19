/**
 * CSV Helper Utilities for Socilift Plus SaaS
 * Supports proper RFC 4180 parsing, UTF-8 BOM encoding for Excel, and template generation.
 */

export interface CSVColumn<T = any> {
  key: keyof T | string;
  label: string;
  format?: (value: any, row: T) => string | number | null | undefined;
}

/**
 * Escapes a single CSV cell value according to RFC 4180 standards.
 */
export function escapeCSVCell(value: any): string {
  if (value === null || value === undefined) return '';
  let str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Exports data to a downloadable CSV file with UTF-8 BOM.
 */
export function exportToCSV<T extends Record<string, any>>(
  filename: string,
  columns: CSVColumn<T>[],
  data: T[]
) {
  const headerLine = columns.map(col => escapeCSVCell(col.label)).join(',');
  
  const dataLines = data.map(row => {
    return columns.map(col => {
      const rawVal = row[col.key as string];
      const val = col.format ? col.format(rawVal, row) : rawVal;
      return escapeCSVCell(val);
    }).join(',');
  });

  const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Robust CSV parser supporting quotes, commas, and multiline values.
 */
export function parseCSV(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  let cleanText = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return { headers: [], rows: [] };

  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some(c => c.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].map(h => h.trim());
  const rows: Record<string, string>[] = [];

  for (let r = 1; r < lines.length; r++) {
    const rowObj: Record<string, string> = {};
    const rowData = lines[r];
    headers.forEach((h, colIndex) => {
      rowObj[h] = rowData[colIndex] || '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Downloads a ready-to-use CSV template for bulk content uploads.
 */
export function downloadContentCSVTemplate() {
  const headers = [
    'Judul Konten',
    'Platform',
    'Format',
    'Pilar Konten',
    'Funnel',
    'Hook',
    'Visual Hook',
    'Naskah / Script',
    'Visual Body',
    'CTA',
    'Visual CTA',
    'Caption',
    'Tanggal Jadwal',
    'Status'
  ];

  const sampleRows = [
    [
      '3 Kesalahan Fatal Pemula Saat Bikin Hook',
      'TikTok',
      'Video',
      'Edukasi & Tutorial',
      'TOFU (Top of Funnel)',
      'Jangan pernah mulai video kamu kayak gini kalau ga mau sepi penonton!',
      'Wajah ekspresi serius sambil zoom in kamera',
      '1. Jangan sapaan basi halo gais. 2. Langsung sebut masalah utama. 3. Beri payoff jelas.',
      'B-roll screen recording timeline CapCut',
      'Ketik "HOOK" di komen untuk dapet cheat sheet gratis',
      'Animasi jemari mengetik di kolom komentar',
      'Simpan video ini buat referensi kamu ngonten besok! #tipscreator #kontenviral',
      new Date(Date.now() + 86400000).toISOString().split('T')[0],
      'ideation'
    ],
    [
      'Carousel 5 Template Headline High-Converting',
      'IG',
      'Carousel',
      'Edukasi & Tutorial',
      'MOFU (Middle of Funnel)',
      '5 Formula Headline yang terbukti naikin click rate 300%',
      'Cover carousel bold warna kontras',
      'Slide 1: Problem. Slide 2: Template #1. Slide 3: Template #2. Slide 4: Studi kasus. Slide 5: Checklist.',
      'Tampilan slide infografis bersih',
      'Save postingan ini biar ga lupa!',
      'Ikon bookmark instagram berkedip',
      'Geser ke kiri sampai tuntas! Jangan lupa share ke teman sesama creator 👉',
      new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      'scripting'
    ]
  ];

  const headerLine = headers.map(escapeCSVCell).join(',');
  const dataLines = sampleRows.map(row => row.map(escapeCSVCell).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'template_import_konten_socilift.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
