import { Content } from '@/types/database';

export function generateICS(brandName: string, contents: Content[]): string {
  const scheduled = contents.filter(c => c.scheduled_date);
  
  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Socilift Plus//Content Calendar//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Socilift - ${brandName || 'Content Schedule'}`,
  ];

  scheduled.forEach(c => {
    const dt = formatDate(c.scheduled_date!);
    const summary = `[${c.platform}] ${c.title}`.replace(/[\n\r,;]/g, ' ');
    const desc = `Platform: ${c.platform}\\nStatus: ${c.status}\\nFormat: ${c.format || '-'}\\nPilar: ${c.pillar || '-'}\\nHook: ${(c.hook || '-').replace(/\n/g, ' ')}\\nNaskah: ${(c.script || '-').replace(/\n/g, ' ')}`;
    
    lines.push(
      'BEGIN:VEVENT',
      `UID:${c.id}@socilift.saas`,
      `DTSTAMP:${formatDate(new Date().toISOString())}T000000Z`,
      `DTSTART;VALUE=DATE:${dt}`,
      `DTEND;VALUE=DATE:${dt}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc}`,
      `STATUS:${c.status === 'published' ? 'CONFIRMED' : 'TENTATIVE'}`,
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadCalendarICS(brandName: string, contents: Content[]) {
  const icsString = generateICS(brandName, contents);
  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(brandName || 'socilift').replace(/[^a-zA-Z0-9_-]/g, '_')}_kalender_konten.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
