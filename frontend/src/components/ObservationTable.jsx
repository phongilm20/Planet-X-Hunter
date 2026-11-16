import React from 'react';
import { ExternalLink, Download, AlertCircle } from 'lucide-react';

export default function ObservationTable({
  observations = [],
  status = 'success',
  errorMessage = null,
  onDownloadCSV,
}) {
  if (status === 'error') {
    return (
      <div className="p-4 border border-obs-red/40 bg-obs-red/10 rounded text-xs text-obs-red flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold">Unable to fetch SPHEREx observations</div>
          <div className="text-[11px] text-obs-muted mt-0.5">{errorMessage || 'Service unreachable.'}</div>
        </div>
      </div>
    );
  }

  if (observations.length === 0) {
    return (
      <div className="p-4 border border-obs-border bg-obs-raised/40 rounded text-xs text-obs-muted">
        <div className="font-medium text-obs-text mb-1">No SPHEREx Observations Found</div>
        <p className="text-[11px] leading-relaxed">
          NASA has not yet released public Quick-Release data covering this exact sky coordinate.
          SPHEREx sweeps the entire celestial sphere every ~6 months; additional fields are published regularly via IRSA.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-obs-text uppercase tracking-wider">
          SPHEREx Pointings ({observations.length})
        </span>
        <button
          onClick={onDownloadCSV}
          title="Download observation list as CSV"
          className="text-[11px] text-obs-accent hover:underline flex items-center gap-1 font-mono"
        >
          <Download className="w-3 h-3" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="border border-obs-border rounded overflow-hidden max-h-56 overflow-y-auto no-scrollbar">
        <table className="w-full text-left border-collapse text-[11px] font-mono">
          <thead className="bg-obs-raised text-obs-muted border-b border-obs-border sticky top-0">
            <tr>
              <th className="py-1.5 px-2.5 font-medium">Date (UTC)</th>
              <th className="py-1.5 px-2.5 font-medium">Band</th>
              <th className="py-1.5 px-2.5 font-medium text-right">IRSA Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-obs-border/50 text-obs-text/90">
            {observations.slice(0, 100).map((obs, idx) => (
              <tr key={idx} className="hover:bg-obs-surface/80 transition-colors">
                <td className="py-1.5 px-2.5 whitespace-nowrap">{obs.dateStr}</td>
                <td className="py-1.5 px-2.5 text-obs-accent whitespace-nowrap">
                  {obs.bandMicron.toFixed(2)} µm
                </td>
                <td className="py-1.5 px-2.5 text-right whitespace-nowrap">
                  <a
                    href={obs.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-obs-accent hover:underline"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {observations.length > 100 && (
        <div className="text-[10px] text-obs-muted">
          Showing newest 100 of {observations.length} observations
        </div>
      )}
    </div>
  );
}
