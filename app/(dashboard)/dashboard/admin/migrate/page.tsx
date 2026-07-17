'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DatabaseIcon, Upload, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { dataService } from '@/lib/services/dataService';

const TABLE_MAP: Record<string, string> = {
  users: 'profiles',
  groups: 'groups',
  modules: 'modules',
  templates: 'templates',
  catalogs: 'catalogs',
  drafts: 'drafts',
  exerciseFolders: 'exercise_folders',
  exercises: 'exercises',
  exerciseAssignments: 'exercise_assignments',
  appTexts: 'app_texts',
};

const TABLE_LABELS: Record<string, string> = {
  users: 'Usuarios',
  groups: 'Grupos',
  modules: 'Módulos',
  templates: 'Plantillas',
  catalogs: 'Catálogos',
  drafts: 'Borradores',
  exerciseFolders: 'Carpetas de casos',
  exercises: 'Casos',
  exerciseAssignments: 'Asignaciones',
  appTexts: 'Textos app',
};

interface TableStatus {
  name: string;
  localCount: number;
  status: 'pending' | 'migrating' | 'done' | 'error';
  migratedCount: number;
  error?: string;
}

const FIELD_MAPS: Record<string, Record<string, string>> = {
  profiles: {
    id: 'id',
    userId: 'id',
    email: 'email',
    name: 'name',
    fullName: 'name',
    role: 'role',
    documentType: 'document_type',
    documentNumber: 'document_number',
    canCreateUsers: 'can_create_users',
    avatarUrl: 'avatar_url',
  },
  groups: {
    id: 'id',
    name: 'name',
    description: 'description',
    teacherId: 'teacher_id',
    moduleId: 'module_id',
    members: 'members',
    startDate: 'start_date',
    endDate: 'end_date',
    createdAt: 'created_at',
  },
  modules: {
    id: 'id',
    title: 'title',
    description: 'description',
    teacherId: 'teacher_id',
    groupIds: 'group_ids',
    sections: 'sections',
    status: 'status',
    createdAt: 'created_at',
  },
  templates: {
    id: 'id',
    moduleId: 'module_id',
    title: 'title',
    description: 'description',
    pdfUrl: 'pdf_url',
    schema: 'schema',
    status: 'status',
    createdAt: 'created_at',
  },
  catalogs: {
    id: 'id',
    name: 'name',
    type: 'type',
    items: 'items',
    createdAt: 'created_at',
  },
  drafts: {
    documentId: 'document_id',
    moduleId: 'module_id',
    groupId: 'group_id',
    userId: 'user_id',
    content: 'content',
    status: 'status',
    isSynced: 'is_synced',
    lastUpdated: 'last_updated',
  },
  exercise_folders: {
    id: 'id',
    name: 'name',
    description: 'description',
  },
  exercises: {
    id: 'id',
    folderId: 'folder_id',
    title: 'title',
    description: 'description',
    content: 'content',
  },
  exercise_assignments: {
    id: 'id',
    caseId: 'case_id',
    studentId: 'student_id',
    groupId: 'group_id',
    assignedBy: 'assigned_by',
    assignedAt: 'assigned_at',
    status: 'status',
    createdAt: 'created_at',
  },
  app_texts: {
    id: 'id',
    value: 'value',
  },
};

function mapRecord(table: string, record: any): any {
  const fieldMap = FIELD_MAPS[table];
  if (!fieldMap) return { ...record };

  const mapped: any = {};
  const seen = new Set<string>();

  for (const [oldKey, newKey] of Object.entries(fieldMap)) {
    if (record[oldKey] !== undefined && !seen.has(newKey)) {
      mapped[newKey] = record[oldKey];
      seen.add(newKey);
    }
  }

  return mapped;
}

export default function MigratePage() {
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [status, setStatus] = useState<'idle' | 'reading' | 'ready' | 'migrating' | 'done'>('idle');
  const [log, setLog] = useState<string[]>([]);


  const readIndexedDB = async () => {
    setStatus('reading');
    setTables([]);
    setLog([]);

    const dbRequest = indexedDB.open('SimComexDB');
    dbRequest.onerror = () => {
      setLog(prev => [...prev, '❌ No se pudo abrir IndexedDB. ¿Existen datos locales?']);
      setStatus('idle');
    };

    dbRequest.onsuccess = async () => {
      const db = dbRequest.result;
      const statusList: TableStatus[] = [];
      const storeNames = Array.from(db.objectStoreNames);

      if (storeNames.length === 0) {
        setLog(prev => [...prev, '⚠️ No hay tablas en IndexedDB. No hay datos para migrar.']);
        setStatus('idle');
        return;
      }

      for (const storeName of storeNames) {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const allRecords = await new Promise<any[]>((resolve, reject) => {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });

        statusList.push({
          name: storeName,
          localCount: allRecords.length,
          status: 'pending',
          migratedCount: 0,
        });
      }

      db.close();
      setTables(statusList);
      setStatus('ready');
      setLog(prev => [...prev, `✅ Leídas ${statusList.length} tablas con ${statusList.reduce((a, t) => a + t.localCount, 0)} registros totales.`]);
    };
  };

  const migrateAll = async () => {
    setStatus('migrating');

    const dbRequest = indexedDB.open('SimComexDB');
    dbRequest.onsuccess = async () => {
      const db = dbRequest.result;

      for (let ti = 0; ti < tables.length; ti++) {
        const t = tables[ti];
        if (t.localCount === 0) {
          setTables(prev => prev.map((x, i) => i === ti ? { ...x, status: 'done' } : x));
          continue;
        }

        setTables(prev => prev.map((x, i) => i === ti ? { ...x, status: 'migrating' } : x));
        setLog(prev => [...prev, `⏳ Migrando ${TABLE_LABELS[t.name] || t.name} (${t.localCount} registros)...`]);

        const targetTable = TABLE_MAP[t.name] || t.name;
        const tx = db.transaction(t.name, 'readonly');
        const store = tx.objectStore(t.name);
        const allRecords = await new Promise<any[]>((resolve, reject) => {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });

        let migrated = 0;
        let errors = 0;

        for (const record of allRecords) {
          try {
            if (t.name === 'users') {
              const userRecord: any = {
                id: record.userId || record.id,
                email: record.email,
                name: record.name || record.fullName || 'Usuario',
                role: record.role || 'student',
              };
              if (record.documentType || record.document_number) userRecord.document_type = record.documentType || record.document_number;
              if (record.documentNumber || record.document_number) userRecord.document_number = record.documentNumber || record.document_number;
              if (record.canCreateUsers || record.can_create_users) userRecord.can_create_users = true;
              await dataService.save('profiles', userRecord);
            } else {
              const payload = mapRecord(targetTable, record);
              if (Object.keys(payload).length === 0) continue;
              if (!payload.id) payload.id = crypto.randomUUID();
              try {
                JSON.stringify(payload);
              } catch {
                errors++;
                continue;
              }
              await dataService.save(targetTable, payload);
            }
            migrated++;
          } catch (e: any) {
            errors++;
            console.error(`Failed to migrate ${t.name} record [${JSON.stringify(record).slice(0, 200)}]:`, e?.message || e);
          }
        }

        setTables(prev => prev.map((x, i) => i === ti ? {
          ...x,
          status: errors > 0 ? 'error' : 'done',
          migratedCount: migrated,
          error: errors > 0 ? `${errors} errores` : undefined,
        } : x));
        setLog(prev => [...prev, `  → ${migrated} migrados${errors > 0 ? `, ${errors} errores` : ''}`]);
      }

      db.close();
      setStatus('done');
      setLog(prev => [...prev, '✅ Migración completada. Revisa los datos en Supabase.']);
    };

    dbRequest.onerror = () => {
      setLog(prev => [...prev, '❌ Error al abrir IndexedDB durante migración.']);
    };
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="w-6 h-6 text-primary" />
          Migrar datos locales → Supabase
        </h1>
        <p className="text-muted-foreground mt-1">
          Transfiere los datos existentes en IndexedDB (navegador) a Supabase para que estén disponibles en producción.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Leer datos locales</CardTitle>
          <CardDescription>
            Escanea IndexedDB en busca de datos del sistema anterior.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={readIndexedDB}
            disabled={status === 'reading' || status === 'migrating'}
            className="w-full"
          >
            {status === 'reading' ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Leyendo...</>
            ) : (
              <><DatabaseIcon className="w-4 h-4 mr-2" /> Leer datos del navegador</>
            )}
          </Button>
        </CardContent>
      </Card>

      {tables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>2. Tablas encontradas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="border rounded-lg divide-y">
              {tables.map((t, i) => (
                <div key={t.name} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    {t.status === 'migrating' && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                    {t.status === 'done' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                    {t.status === 'error' && <AlertCircle className="w-3 h-3 text-amber-500" />}
                    {t.status === 'pending' && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                    <span className="font-medium">{TABLE_LABELS[t.name] || t.name}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={t.localCount > 0 ? 'default' : 'secondary'}>
                      {t.localCount} registros
                    </Badge>
                    {t.migratedCount > 0 && (
                      <Badge variant="outline" className="text-green-600">
                        → {t.migratedCount}
                      </Badge>
                    )}
                    {t.error && <span className="text-xs text-red-500">{t.error}</span>}
                  </div>
                </div>
              ))}
            </div>

            {status === 'ready' && (
              <Button onClick={migrateAll} className="w-full" size="lg">
                <Upload className="w-4 h-4 mr-2" />
                Migrar {tables.reduce((a, t) => a + t.localCount, 0)} registros a Supabase
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {log.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Registro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 font-mono text-xs space-y-1 max-h-64 overflow-y-auto">
              {log.map((line, i) => (
                <div key={i}>{line || '\u00a0'}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
