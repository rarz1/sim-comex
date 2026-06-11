'use client';

import { useState } from 'react';
import { db } from '@/lib/db/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, DatabaseIcon, CheckCircle2, AlertCircle, Loader2, Upload, FileJson } from 'lucide-react';

interface TableSummary {
  name: string;
  count: number;
  status: 'idle' | 'loading' | 'done' | 'error';
}

interface BackupData {
  exportedAt: string;
  version: string;
  tables: Record<string, any[]>;
}

const TABLE_LABELS: Record<string, string> = {
  users: 'Usuarios',
  groups: 'Grupos',
  modules: 'Módulos',
  templates: 'Plantillas',
  catalogs: 'Catálogos',
  drafts: 'Borradores',
  exerciseFolders: 'Carpetas de ejercicios',
  exercises: 'Ejercicios',
  exerciseAssignments: 'Asignaciones',
  appTexts: 'Textos de la app',
};

export default function ExportPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [summary, setSummary] = useState<TableSummary[]>([]);
  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [importLog, setImportLog] = useState<string[]>([]);

  const runExport = async () => {
    setStatus('loading');
    setSummary([]);
    setBackupData(null);

    const tables: Record<string, any[]> = {};
    const summaryList: TableSummary[] = [];

    try {
      const tableReaders: Array<{ name: string; reader: () => Promise<any[]> }> = [
        { name: 'users', reader: () => db.users.toArray() },
        { name: 'groups', reader: () => db.groups.toArray() },
        { name: 'modules', reader: () => db.modules.toArray() },
        { name: 'templates', reader: () => db.templates.toArray() },
        { name: 'catalogs', reader: () => db.catalogs.toArray() },
        { name: 'drafts', reader: () => db.drafts.toArray() },
        { name: 'exerciseFolders', reader: () => db.exerciseFolders.toArray() },
        { name: 'exercises', reader: () => db.exercises.toArray() },
        { name: 'exerciseAssignments', reader: () => db.exerciseAssignments.toArray() },
        { name: 'appTexts', reader: () => db.appTexts.toArray() },
      ];

      for (const { name, reader } of tableReaders) {
        setSummary(prev => [
          ...prev,
          { name, count: 0, status: 'loading' },
        ]);
        try {
          const data = await reader();
          tables[name] = data;
          setSummary(prev =>
            prev.map(t => t.name === name ? { name, count: data.length, status: 'done' } : t)
          );
        } catch (e) {
          tables[name] = [];
          setSummary(prev =>
            prev.map(t => t.name === name ? { name, count: 0, status: 'error' } : t)
          );
        }
        summaryList.push({ name, count: tables[name].length, status: 'done' });
      }

      const backup: BackupData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        tables,
      };

      setBackupData(backup);
      setStatus('done');
    } catch (e) {
      setStatus('error');
    }
  };

  const downloadBackup = () => {
    if (!backupData) return;
    const json = JSON.stringify(backupData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sim-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    setImportLog([]);

    try {
      const text = await file.text();
      const backup: BackupData = JSON.parse(text);

      const log: string[] = [];
      log.push(`📦 Archivo: ${file.name}`);
      log.push(`📅 Exportado el: ${new Date(backup.exportedAt).toLocaleString('es')}`);
      log.push('');

      const importers: Array<{ name: string; importer: (data: any[]) => Promise<void> }> = [
        { name: 'users', importer: async (d) => { await db.users.bulkPut(d); } },
        { name: 'groups', importer: async (d) => { await db.groups.bulkPut(d); } },
        { name: 'modules', importer: async (d) => { await db.modules.bulkPut(d); } },
        { name: 'templates', importer: async (d) => { await db.templates.bulkPut(d); } },
        { name: 'catalogs', importer: async (d) => { await db.catalogs.bulkPut(d); } },
        { name: 'drafts', importer: async (d) => { await db.drafts.bulkPut(d as any); } },
        { name: 'exerciseFolders', importer: async (d) => { await db.exerciseFolders.bulkPut(d); } },
        { name: 'exercises', importer: async (d) => { await db.exercises.bulkPut(d); } },
        { name: 'exerciseAssignments', importer: async (d) => { await db.exerciseAssignments.bulkPut(d); } },
        { name: 'appTexts', importer: async (d) => { await db.appTexts.bulkPut(d); } },
      ];

      for (const { name, importer } of importers) {
        const data = backup.tables[name];
        if (!data || data.length === 0) {
          log.push(`⬜ ${TABLE_LABELS[name] || name}: vacío, omitido`);
          continue;
        }
        try {
          await importer(data);
          log.push(`✅ ${TABLE_LABELS[name] || name}: ${data.length} registros importados`);
        } catch (err: any) {
          log.push(`❌ ${TABLE_LABELS[name] || name}: error — ${err?.message || 'desconocido'}`);
        }
      }

      setImportLog(log);
      setImportStatus('done');
    } catch (err: any) {
      setImportLog([`❌ Error al leer el archivo: ${err?.message}`]);
      setImportStatus('error');
    }

    // Reset file input
    e.target.value = '';
  };

  const totalRecords = backupData
    ? Object.values(backupData.tables).reduce((acc, arr) => acc + arr.length, 0)
    : 0;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DatabaseIcon className="w-6 h-6 text-primary" />
          Exportar / Importar datos
        </h1>
        <p className="text-muted-foreground mt-1">
          Genera un backup completo de todos los datos locales (IndexedDB) para migrar a producción o a otro dispositivo.
        </p>
      </div>

      {/* Export Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exportar backup
          </CardTitle>
          <CardDescription>
            Lee todas las tablas del navegador y descarga un archivo <code>.json</code> con todos los datos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={runExport}
            disabled={status === 'loading'}
            className="w-full"
          >
            {status === 'loading' ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Leyendo datos...</>
            ) : (
              <><DatabaseIcon className="w-4 h-4 mr-2" /> Leer datos del navegador</>
            )}
          </Button>

          {/* Table summary */}
          {summary.length > 0 && (
            <div className="border rounded-lg divide-y">
              {summary.map((t) => (
                <div key={t.name} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    {t.status === 'loading' && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                    {t.status === 'done' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                    {t.status === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
                    <span className="font-medium">{TABLE_LABELS[t.name] || t.name}</span>
                    <span className="text-muted-foreground text-xs">({t.name})</span>
                  </span>
                  <Badge variant={t.count > 0 ? 'default' : 'secondary'}>
                    {t.count} registros
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Download button */}
          {status === 'done' && backupData && (
            <div className="space-y-2">
              <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 text-sm text-green-800 dark:text-green-300">
                ✅ Backup listo — <strong>{totalRecords}</strong> registros totales en{' '}
                {Object.keys(backupData.tables).length} tablas.
              </div>
              <Button onClick={downloadBackup} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Descargar <code className="ml-1">sim-backup-{new Date().toISOString().slice(0, 10)}.json</code>
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 p-3 text-sm text-red-700">
              ❌ Error al leer los datos. Revisa la consola del navegador.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar backup
          </CardTitle>
          <CardDescription>
            Carga un archivo <code>.json</code> generado por esta misma herramienta para restaurar datos en el navegador actual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label
            htmlFor="import-file"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors"
          >
            <FileJson className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              {importStatus === 'loading' ? 'Importando...' : 'Click para seleccionar sim-backup-*.json'}
            </span>
            <input
              id="import-file"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
              disabled={importStatus === 'loading'}
            />
          </label>

          {importLog.length > 0 && (
            <div className={`rounded-lg border p-3 font-mono text-xs space-y-1 ${
              importStatus === 'error' ? 'bg-red-50 dark:bg-red-950 border-red-200' :
              importStatus === 'done' ? 'bg-green-50 dark:bg-green-950 border-green-200' :
              'bg-muted'
            }`}>
              {importLog.map((line, i) => (
                <div key={i}>{line || '\u00a0'}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info box */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
        <CardContent className="pt-4">
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-1">ℹ️ ¿Cómo usar esto?</p>
          <ol className="text-sm text-amber-700 dark:text-amber-400 space-y-1 list-decimal list-inside">
            <li>Haz click en "Leer datos del navegador" en el dispositivo <strong>origen</strong>.</li>
            <li>Descarga el archivo <code>.json</code>.</li>
            <li>Abre la app en el dispositivo <strong>destino</strong> (o nuevo Supabase).</li>
            <li>Usa "Importar backup" y selecciona el archivo.</li>
            <li>Los datos quedan disponibles localmente en ese navegador.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
