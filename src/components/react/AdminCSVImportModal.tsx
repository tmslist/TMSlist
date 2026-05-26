'use client';
import { useState, useRef, useCallback } from 'react';

type Step = 'upload' | 'map' | 'preview' | 'import';

const CLINIC_FIELDS = [
  'name', 'address', 'city', 'state', 'zip', 'phone', 'website',
  'email', 'description', 'lat', 'lng',
  'machines', 'specialties', 'insurances',
];

const REQUIRED_FIELDS = ['name', 'city', 'state'];

export default function AdminCSVImportModal({ onClose, onImport }: {
  onClose: () => void;
  onImport: (count: number) => void;
}) {
  const [step, setStep] = useState<Step>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [imported, setImported] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCSV = useCallback((text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    return lines.map(line => {
      const vals: string[] = [];
      let inQuote = false;
      let val = '';
      for (const ch of line) {
        if (ch === '"') inQuote = !inQuote;
        else if (ch === ',' && !inQuote) { vals.push(val.trim()); val = ''; }
        else val += ch;
      }
      vals.push(val.trim());
      return vals;
    });
  }, []);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setHeaders(parsed[0] || []);
      setRows(parsed.slice(1));
    };
    reader.readAsText(file);
  }, [parseCSV]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) handleFile(file);
  };

  const autoMap = () => {
    const map: Record<string, string> = {};
    headers.forEach((h, i) => {
      const key = h.toLowerCase().replace(/[^a-z]/g, '');
      const match = CLINIC_FIELDS.find(f => f.includes(key) || key.includes(f));
      if (match) map[i] = match;
    });
    setMapping(map);
  };

  const handleImport = async () => {
    setImporting(true);
    setError('');
    setProgress(0);
    try {
      const res = await fetch('/api/admin/clinics/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers, rows, mapping }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setImported(data.imported || rows.length);
      setProgress(100);
      setStep('import');
    } catch (err: any) {
      setError(err.message || 'Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const previewRows = rows.slice(0, 10);
  const mappedFields = Object.values(mapping);

  const renderStepIndicator = () => (
    <div className="flex px-6 pt-4 gap-2 shrink-0">
      {(['upload', 'map', 'preview', 'import'] as Step[]).map((s, i) => (
        <div
          key={s}
          className={`flex items-center gap-1.5 text-xs font-medium ${
            step === s ? 'text-[var(--ink)]' : 'text-[var(--muted)]'
          }`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
            step === s ? 'bg-[var(--ink)] text-white' : 'bg-[var(--paper2)] text-[var(--muted)]'
          }`}>
            {i + 1}
          </span>
          <span className="hidden sm:inline">{s.charAt(0).toUpperCase() + s.slice(1)}</span>
          {i < 3 && <span className="mx-1 text-[var(--line)] hidden sm:inline">›</span>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] shrink-0">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Import Clinics from CSV</h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--ink2)] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {renderStepIndicator()}

        {/* Content */}
        <div className="p-6 overflow-auto flex-1">

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div>
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                className="border-2 border-dashed border-[var(--line)] rounded-xl p-12 text-center hover:border-[rgba(10,22,40,0.2)] transition-colors cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                <svg className="w-10 h-10 text-[var(--line)] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-[var(--ink2)] mb-1 font-medium">Drag and drop your CSV file here</p>
                <p className="text-xs text-[var(--muted)]">or click to browse your files</p>
                <input ref={fileRef} type="file" accept=".csv" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }} className="hidden" />
              </div>
              <div className="mt-4 text-center">
                <a href="/api/admin/clinics/template" className="text-xs text-[var(--ink)] hover:underline font-medium">
                  Download CSV template
                </a>
              </div>
              {headers.length > 0 && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs text-emerald-700">
                    {rows.length} rows loaded — {headers.length} columns detected
                  </span>
                </div>
              )}
              <button
                onClick={() => headers.length && setStep('map')}
                disabled={!headers.length}
                className="mt-4 w-full px-4 py-2.5 bg-[var(--ink)] text-white rounded-lg font-medium hover:bg-[var(--ink)] disabled:opacity-50 transition-colors"
              >
                Next: Map Fields
              </button>
            </div>
          )}

          {/* Step 2: Field Mapping */}
          {step === 'map' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-[var(--ink2)]">Match your CSV columns to clinic fields</p>
                <button onClick={autoMap} className="text-xs text-[var(--ink)] hover:underline font-medium">
                  Auto-map columns
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-auto pr-2">
                {CLINIC_FIELDS.map(field => {
                  const currentColIdx = Object.entries(mapping).find(([, v]) => v === field)?.[0] ?? '';
                  return (
                    <div key={field} className="flex items-center gap-2">
                      <label className="text-xs font-medium text-[var(--ink2)] w-28 shrink-0 capitalize">
                        {field.replace(/_/g, ' ')}
                      </label>
                      <select
                        value={currentColIdx}
                        onChange={e => {
                          const newMap = { ...mapping };
                          Object.entries(newMap).forEach(([k, val]) => { if (val === field) delete newMap[k]; });
                          if (e.target.value) newMap[e.target.value] = field;
                          setMapping(newMap);
                        }}
                        className="flex-1 text-xs border border-[var(--line)] rounded px-2 py-1.5 focus:ring-2 focus:ring-[#1E2A3B] focus:border-[var(--ink2)] outline-none"
                      >
                        <option value="">— Skip —</option>
                        {headers.map((h, i) => (
                          <option key={i} value={i}>Col {i + 1}: {h}</option>
                        ))}
                      </select>
                      {REQUIRED_FIELDS.includes(field) && (
                        <span className="text-red-400 text-xs font-bold" title="Required">*</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => mappedFields.length > 0 && setStep('preview')}
                disabled={mappedFields.length === 0}
                className="mt-4 w-full px-4 py-2.5 bg-[var(--ink)] text-white rounded-lg font-medium hover:bg-[var(--ink)] disabled:opacity-50 transition-colors"
              >
                Next: Preview
              </button>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-[var(--ink2)]">
                  Review the first {previewRows.length} of {rows.length} rows
                </p>
                <button onClick={() => setStep('map')} className="text-xs text-[var(--ink)] hover:underline">
                  Edit mapping
                </button>
              </div>
              <div className="overflow-auto max-h-72 border border-[var(--line)] rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-[var(--paper2)] sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-[var(--muted)] font-semibold w-8">#</th>
                      {mappedFields.map(field => (
                        <th key={field} className="px-3 py-2 text-left text-[var(--muted)] font-semibold capitalize">
                          {field.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-t border-[var(--line)] hover:bg-[var(--paper2)]">
                        <td className="px-3 py-2 text-[var(--muted)]">{i + 1}</td>
                        {mappedFields.map(field => {
                          const colIdx = Object.entries(mapping).find(([, v]) => v === field)?.[0];
                          const val = colIdx !== undefined ? row[parseInt(colIdx)] || '' : '';
                          const isMissing = !val.trim() && REQUIRED_FIELDS.includes(field);
                          return (
                            <td key={field} className={`px-3 py-2 ${isMissing ? 'text-red-400 font-semibold' : 'text-[var(--ink2)]'}`}>
                              {val || <span className="text-red-300 italic">— missing</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{error}</div>
              )}
              <button
                onClick={handleImport}
                disabled={importing}
                className="mt-4 w-full px-4 py-2.5 bg-[var(--ink)] text-white rounded-lg font-medium hover:bg-[var(--ink)] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Importing {rows.length} Clinics...
                  </>
                ) : (
                  `Import ${rows.length} Clinics`
                )}
              </button>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'import' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--ink)] mb-1">Import Complete</h3>
              <p className="text-sm text-[var(--muted)] mb-2">{imported} clinics imported successfully.</p>
              <button
                onClick={() => { onImport(imported); onClose(); }}
                className="mt-4 px-6 py-2.5 bg-[var(--ink)] text-white rounded-lg font-medium hover:bg-[var(--ink)] transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}