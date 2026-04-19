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
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-6">
        <button onClick={() => setActiveTab('import')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'import'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}>
          Import
        </button>
        <button onClick={() => setActiveTab('history')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}>
          History
        </button>
      </div>

      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Import Type
            </label>
            <div className="flex gap-3">
              {(['clinic', 'doctor', 'treatment'] as const).map(type => (
                <button key={type}
                  onClick={() => setImportType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    importType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}s
                </button>
              ))}
            </div>
          </div>

          {/* Required columns hint */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
              Required columns for {importType} import:
            </p>
            <div className="flex flex-wrap gap-2">
              {importType === 'clinic' && ['name', 'city', 'state', 'address', 'phone', 'zip', 'country', 'website', 'email', 'machines', 'specialties', 'insurances', 'description'].map(col => (
                <span key={col} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded font-mono">{col}</span>
              ))}
              {importType === 'doctor' && ['name', 'clinic_slug', 'credential', 'title', 'specialties', 'bio', 'first_name', 'last_name'].map(col => (
                <span key={col} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded font-mono">{col}</span>
              ))}
              {importType === 'treatment' && ['name', 'slug', 'full_name', 'description', 'fda_approved', 'conditions', 'session_duration'].map(col => (
                <span key={col} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded font-mono">{col}</span>
              ))}
            </div>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload CSV
            </label>
            <input type="file" accept=".csv" onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                file:text-sm file:font-medium file:bg-blue-600 file:text-white
                hover:file:bg-blue-700 dark:file:bg-blue-700 dark:hover:file:bg-blue-800" />
          </div>

          {/* Preview */}
          {preview && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preview (first 5 rows)
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      {Object.keys(preview[0]).map(key => (
                        <th key={key} className="text-left px-3 py-2 font-medium text-gray-500 dark:text-gray-400">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, ri) => (
                      <tr key={ri} className="border-b border-gray-100 dark:border-gray-800">
                        {Object.values(row).map((val, vi) => (
                          <td key={vi} className="px-3 py-2 text-gray-600 dark:text-gray-400 truncate max-w-xs">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button onClick={handleImport} disabled={!file || uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium
              hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
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
            <p className="text-sm text-gray-500 dark:text-gray-400">No import history yet.</p>
          ) : (
            <div className="space-y-3">
              {batches.map(batch => (
                <div key={batch.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                      {batch.type.charAt(0).toUpperCase() + batch.type.slice(1)} Import
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {batch.filename} · {new Date(batch.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      batch.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      batch.status === 'processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      batch.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>{batch.status}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
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
