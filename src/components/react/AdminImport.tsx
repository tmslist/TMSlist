'use client';
import { useState, useCallback } from 'react';

interface ImportRow { row: number; field: string; message: string }

interface ImportResult {
  batchId: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportRow[];
  status: string;
}

interface AdminImportProps {
  initialBatches?: Array<{
    id: string;
    type: string;
    filename: string;
    totalRows: number;
    successCount: number;
    errorCount: number;
    status: string;
    createdAt: Date;
  }>;
}

export default function AdminImport({ initialBatches = [] }: AdminImportProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');
  const [importType, setImportType] = useState<'clinic' | 'doctor' | 'treatment'>('clinic');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown>[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [batches, setBatches] = useState(initialBatches);

  const parseCSV = useCallback((text: string): Record<string, unknown>[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      return headers.reduce((obj: Record<string, unknown>, h, i) => {
        obj[h] = values[i] || '';
        return obj;
      }, {});
    });
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      setPreview(rows.slice(0, 5));
    };
    reader.readAsText(f);
  }, [parseCSV]);

  const handleImport = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: importType, rows, filename: file.name }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        setBatches(prev => [{ id: data.batchId, type: importType, filename: file.name,
          totalRows: data.totalRows, successCount: data.successCount, errorCount: data.errorCount,
          status: data.status, createdAt: new Date() }, ...prev]);
      }
    } catch {
      setResult({ batchId: '', totalRows: 0, successCount: 0, errorCount: 1,
        errors: [{ row: 0, field: 'network', message: 'Network error' }], status: 'failed' });
    } finally {
      setUploading(false);
    }
  }, [file, importType, parseCSV]);

  return (
    <div>
      <div className="flex gap-4 border-b border-[var(--line)] dark:border-[var(--ink2)] mb-6">
        <button onClick={() => setActiveTab('import')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'import'
              ? 'border-[var(--ink)] text-[var(--ink)] dark:text-[var(--ink2)]'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--ink2)] dark:hover:text-[var(--line)]'
          }`}>
          Import
        </button>
        <button onClick={() => setActiveTab('history')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-[var(--ink)] text-[var(--ink)] dark:text-[var(--ink2)]'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--ink2)] dark:hover:text-[var(--line)]'
          }`}>
          History
        </button>
      </div>

      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] dark:text-[var(--line)] mb-2">
              Import Type
            </label>
            <div className="flex gap-3">
              {(['clinic', 'doctor', 'treatment'] as const).map(type => (
                <button key={type}
                  onClick={() => setImportType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    importType === type
                      ? 'bg-[var(--ink)] text-white'
                      : 'bg-[var(--paper2)] text-[var(--ink2)] dark:bg-[var(--ink2)] dark:text-[var(--line)] hover:bg-[var(--paper2)] dark:hover:bg-[var(--ink2)]'
                  }`}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}s
                </button>
              ))}
            </div>
          </div>

          {/* Required columns hint */}
          <div className="bg-[var(--paper2)] dark:bg-[var(--paper2)] border border-[var(--line)] dark:border-[var(--ink)] rounded-lg p-4">
            <p className="text-sm font-medium text-[var(--ink)] dark:text-[var(--muted)] mb-2">
              Required columns for {importType} import:
            </p>
            <div className="flex flex-wrap gap-2">
              {importType === 'clinic' && ['name', 'city', 'state', 'address', 'phone', 'zip', 'country', 'website', 'email', 'machines', 'specialties', 'insurances', 'description'].map(col => (
                <span key={col} className="text-xs px-2 py-1 bg-[rgba(10,22,40,0.1)] dark:bg-[var(--paper2)] text-[var(--ink)] dark:text-[var(--muted)] rounded font-mono">{col}</span>
              ))}
              {importType === 'doctor' && ['name', 'clinic_slug', 'credential', 'title', 'specialties', 'bio', 'first_name', 'last_name'].map(col => (
                <span key={col} className="text-xs px-2 py-1 bg-[rgba(10,22,40,0.1)] dark:bg-[var(--paper2)] text-[var(--ink)] dark:text-[var(--muted)] rounded font-mono">{col}</span>
              ))}
              {importType === 'treatment' && ['name', 'slug', 'full_name', 'description', 'fda_approved', 'conditions', 'session_duration'].map(col => (
                <span key={col} className="text-xs px-2 py-1 bg-[rgba(10,22,40,0.1)] dark:bg-[var(--paper2)] text-[var(--ink)] dark:text-[var(--muted)] rounded font-mono">{col}</span>
              ))}
            </div>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] dark:text-[var(--line)] mb-2">
              Upload CSV
            </label>
            <input type="file" accept=".csv" onChange={handleFileChange}
              className="block w-full text-sm text-[var(--muted)] dark:text-[var(--muted)]
                file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                file:text-sm file:font-medium file:bg-[var(--ink)] file:text-white
                hover:file:bg-[var(--ink)] dark:file:bg-[var(--ink)] dark:hover:file:bg-[var(--ink)]" />
          </div>

          {/* Preview */}
          {preview && (
            <div>
              <p className="text-sm font-medium text-[var(--ink2)] dark:text-[var(--line)] mb-2">
                Preview (first 5 rows)
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--line)] dark:border-[var(--ink2)]">
                      {Object.keys(preview[0]).map(key => (
                        <th key={key} className="text-left px-3 py-2 font-medium text-[var(--muted)] dark:text-[var(--muted)]">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, ri) => (
                      <tr key={ri} className="border-b border-[var(--line)] dark:border-[var(--ink2)]">
                        {Object.values(row).map((val, vi) => (
                          <td key={vi} className="px-3 py-2 text-[var(--ink2)] dark:text-[var(--muted)] truncate max-w-xs">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button onClick={handleImport} disabled={!file || uploading}
            className="px-6 py-2 bg-[var(--ink)] text-white rounded-lg text-sm font-medium
              hover:bg-[var(--ink)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {uploading ? 'Importing...' : 'Start Import'}
          </button>

          {/* Result */}
          {result && (
            <div className={`p-4 rounded-lg border ${
              result.errorCount === 0
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            }`}>
              <p className="font-medium text-sm mb-2">
                Import {result.status}: {result.successCount}/{result.totalRows} rows succeeded
              </p>
              {result.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="text-sm cursor-pointer text-amber-700 dark:text-amber-300">
                    {result.errors.length} errors - click to expand
                  </summary>
                  <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <div key={i} className="text-xs bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                        Row {e.row}: [{e.field}] {e.message}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          {batches.length === 0 ? (
            <p className="text-sm text-[var(--muted)] dark:text-[var(--muted)]">No import history yet.</p>
          ) : (
            <div className="space-y-3">
              {batches.map(batch => (
                <div key={batch.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-[var(--ink2)] border border-[var(--line)] dark:border-[var(--ink2)] rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-[var(--ink)] dark:text-white">
                      {batch.type.charAt(0).toUpperCase() + batch.type.slice(1)} Import
                    </p>
                    <p className="text-xs text-[var(--muted)] dark:text-[var(--muted)]">
                      {batch.filename} · {new Date(batch.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      batch.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      batch.status === 'processing' ? 'bg-[rgba(10,22,40,0.1)] text-[var(--ink)] dark:bg-[var(--paper2)] dark:text-[var(--muted)]' :
                      batch.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                      'bg-[var(--paper2)] text-[var(--ink2)] dark:bg-[var(--ink2)] dark:text-[var(--muted)]'
                    }`}>{batch.status}</span>
                    <span className="text-sm text-[var(--ink2)] dark:text-[var(--muted)]">
                      {batch.successCount}/{batch.totalRows} success
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
