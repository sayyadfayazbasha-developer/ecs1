import { EmergencyCall } from '@/data/sampleData';

// ─── CSV Export ───────────────────────────────────────────────

function escapeCsvValue(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function exportCallsToCSV(
  calls: EmergencyCall[],
  stats: {
    totalCalls: number;
    criticalCalls: number;
    highCalls: number;
    mediumCalls: number;
    lowCalls: number;
    avgSentiment: number;
  },
  filename = 'emergency_calls_report'
) {
  const headers = ['ID', 'Transcript', 'Urgency', 'Sentiment', 'Sentiment Score', 'Topics', 'Timestamp'];
  const rows = calls.map((c) => [
    c.id,
    escapeCsvValue(c.text),
    c.urgency,
    c.sentiment,
    c.sentimentScore.toFixed(2),
    escapeCsvValue(c.topics.join('; ')),
    c.timestamp.toISOString(),
  ]);

  // Summary section
  const summary = [
    [],
    ['--- SUMMARY ---'],
    ['Total Calls', stats.totalCalls.toString()],
    ['Critical', stats.criticalCalls.toString()],
    ['High', stats.highCalls.toString()],
    ['Medium', stats.mediumCalls.toString()],
    ['Low', stats.lowCalls.toString()],
    ['Avg Sentiment', stats.avgSentiment.toFixed(4)],
  ];

  const csv = [headers, ...rows, ...summary].map((r) => r.join(',')).join('\n');
  downloadBlob(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

// ─── PDF Export (pure HTML→print) ─────────────────────────────

export function exportCallsToPDF(
  calls: EmergencyCall[],
  stats: {
    totalCalls: number;
    criticalCalls: number;
    highCalls: number;
    mediumCalls: number;
    lowCalls: number;
    avgSentiment: number;
    negativeCalls: number;
    neutralCalls: number;
    positiveCalls: number;
  },
  filename = 'emergency_calls_report'
) {
  const urgencyColor: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${filename}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; padding: 40px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 12px; margin-bottom: 24px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
    .stat-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; }
    .stat-value { font-size: 26px; font-weight: 700; }
    .stat-label { font-size: 11px; color: #64748b; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
    th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
    td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    tr:nth-child(even) { background: #fafafa; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; color: #fff; }
    .topics { color: #64748b; font-size: 10px; }
    h2 { font-size: 15px; margin-top: 28px; margin-bottom: 8px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>Emergency Call Analytics Report</h1>
  <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · ${stats.totalCalls} calls analyzed</div>

  <div class="stats-grid">
    <div class="stat-card"><div class="stat-value">${stats.totalCalls}</div><div class="stat-label">Total Calls</div></div>
    <div class="stat-card"><div class="stat-value" style="color:${urgencyColor.critical}">${stats.criticalCalls}</div><div class="stat-label">Critical</div></div>
    <div class="stat-card"><div class="stat-value" style="color:${urgencyColor.high}">${stats.highCalls}</div><div class="stat-label">High Urgency</div></div>
    <div class="stat-card"><div class="stat-value">${stats.avgSentiment.toFixed(2)}</div><div class="stat-label">Avg Sentiment</div></div>
  </div>

  <h2>Urgency Breakdown</h2>
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-value" style="color:${urgencyColor.critical}">${stats.criticalCalls}</div><div class="stat-label">Critical</div></div>
    <div class="stat-card"><div class="stat-value" style="color:${urgencyColor.high}">${stats.highCalls}</div><div class="stat-label">High</div></div>
    <div class="stat-card"><div class="stat-value" style="color:${urgencyColor.medium}">${stats.mediumCalls}</div><div class="stat-label">Medium</div></div>
    <div class="stat-card"><div class="stat-value" style="color:${urgencyColor.low}">${stats.lowCalls}</div><div class="stat-label">Low</div></div>
  </div>

  <h2>Sentiment Distribution</h2>
  <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr);">
    <div class="stat-card"><div class="stat-value" style="color:#ef4444">${stats.negativeCalls}</div><div class="stat-label">Negative</div></div>
    <div class="stat-card"><div class="stat-value" style="color:#64748b">${stats.neutralCalls}</div><div class="stat-label">Neutral</div></div>
    <div class="stat-card"><div class="stat-value" style="color:#22c55e">${stats.positiveCalls}</div><div class="stat-label">Positive</div></div>
  </div>

  <h2>Call Details</h2>
  <table>
    <thead><tr><th>#</th><th>Transcript</th><th>Urgency</th><th>Sentiment</th><th>Score</th><th>Topics</th></tr></thead>
    <tbody>
      ${calls
        .map(
          (c, i) => `<tr>
        <td>${i + 1}</td>
        <td>${c.text}</td>
        <td><span class="badge" style="background:${urgencyColor[c.urgency]}">${c.urgency}</span></td>
        <td>${c.sentiment}</td>
        <td>${c.sentimentScore.toFixed(2)}</td>
        <td class="topics">${c.topics.join(', ')}</td>
      </tr>`
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 400);
  }
}

// ─── Helper ───────────────────────────────────────────────────

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
