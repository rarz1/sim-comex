import { dataService } from './dataService';
import { DocumentTemplate, FormField } from '@/types/form';
import { ValidationReport, ValidationDetail, FieldMatch } from '@/types/validation';
import { Draft } from '@/types';
import { Module } from '@/types/modules';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CrossDocumentMatch {
    docTitle: string;
    docId: string;
    fieldLabel: string;
    value: any;
    isCompatible: boolean;
}

export const validationService = {
    /**
     * Build a map of tags to values across all documents in a module for a user.
     * Scoped to a specific groupId to prevent mixed data from other groups.
     * Uses 'tagId' if available, otherwise falls back to label for backward compatibility
     */
    async getModuleDataMap(userId: string, moduleId: string, excludeDraftId?: number, groupId?: string): Promise<Record<string, FieldMatch[]>> {
        if (!UUID_RE.test(moduleId)) {
            console.warn(`⚠️ getModuleDataMap: moduleId "${moduleId}" is not a valid UUID, skipping`);
            return {};
        }
        console.log(`🔍 ValidationService: getting data for Module ${moduleId} User ${userId} Group ${groupId || 'ALL'}`);

        // 1. Fetch Module to identify ALL linked documents (Owned + Attached)
        let module: Module | null;
        try {
            module = await dataService.getById<Module>('modules', moduleId);
        } catch (e) {
            console.warn(`⚠️ getModuleDataMap: could not fetch module ${moduleId}:`, e);
            return {};
        }
        if (!module) {
            console.log("❌ Module not found");
            return {};
        }

        // 2. Owned Templates
        const ownedTemplates = await dataService.getAll<DocumentTemplate>('templates', { moduleId });

        // 3. Attached Templates (Reference) - RE-ENGINEERED: Must include attached docs for reports to work
        const attachedIds = new Set<string>();
        module.sections?.forEach(s => s.attachedDocumentIds?.forEach(id => attachedIds.add(id)));

        // Filter out those we already have
        const missingIds = Array.from(attachedIds).filter(id => !ownedTemplates.some(t => t.id === id));

        let additionalTemplates: DocumentTemplate[] = [];
        if (missingIds.length > 0) {
            const allTemplates = await dataService.getAll<DocumentTemplate>('templates');
            additionalTemplates = allTemplates.filter(t => missingIds.includes(t.id));
        }

        const templates = [...ownedTemplates, ...additionalTemplates];
        console.log(`📄 Templates found: ${templates.length} (Owned: ${ownedTemplates.length}, Attached: ${additionalTemplates.length})`);

        // 4. Fetch drafts for each template
        // Note: In DB, 'moduleId' column in drafts table actually stores the Template ID (legacy naming)
        const drafts: Draft[] = [];
        for (const template of templates) {
            let templateDrafts: Draft[] = [];
            if (groupId) {
                templateDrafts = await dataService.getAll<Draft>('drafts', { moduleId: template.id, userId, groupId });
                
                // Fallback: If no group-specific draft found, try to find ANY draft for this user and template
                if (templateDrafts.length === 0) {
                    console.log(`   ! No draft found for group ${groupId}, checking fallback...`);
                    templateDrafts = await dataService.getAll<Draft>('drafts', { moduleId: template.id, userId });
                }
            } else {
                templateDrafts = await dataService.getAll<Draft>('drafts', { moduleId: template.id, userId });
            }
            console.log(`   > Template ${template.id} (${template.title}): ${templateDrafts.length} drafts`);
            drafts.push(...templateDrafts);
        }

        console.log(`📝 Total Drafts Analyzed: ${drafts.length}`);

        const dataMap: Record<string, FieldMatch[]> = {};

        for (const draft of drafts) {
            if (excludeDraftId && draft.id === excludeDraftId) continue;

            // Correctly use 'moduleId' which stores the Template ID (legacy naming convention)
            const template = templates.find(t => t.id === draft.moduleId);
            if (!template) {
                console.warn(`⚠️ Draft ${draft.id} points to missing template ${draft.moduleId} (Instance ID: ${draft.documentId})`);
                continue;
            }

            console.log(`   > Processing Draft ${draft.id} for "${template.title}"`);

            // Map content keys (fieldId) to tags/labels
            for (const section of template.schema.sections) {
                for (const field of section.fields) {
                    const value = draft.content[field.id];
                    // Validamos si tiene valor y no es string vacío, o si es número (0 es válido)
                    if (value !== undefined && value !== '' && value !== null) {
                        // Prioridad: tagId > label
                        const key = field.tagId || field.label.trim().toLowerCase();

                        console.log(`     - Field: ${field.label} (${field.id}) | Tag: ${key} | Value: "${value}"`);

                        if (!dataMap[key]) dataMap[key] = [];

                        dataMap[key].push({
                            fieldId: field.id,
                            label: field.label,
                            value,
                            docTitle: template.title,
                            docId: template.id
                        });
                    }
                }
            }
        }

        console.log(`🔑 Keys found in DataMap: ${Object.keys(dataMap).join(', ')}`);

        return dataMap;
    },

    /**
     * Evaluates a field against data from other documents in the same module and group.
     */
    async evaluateField(field: FormField, value: any, userId: string, moduleId: string, currentDraftId?: number, groupId?: string): Promise<CrossDocumentMatch[]> {
        if (value === undefined || value === '' || value === null) return [];

        const moduleData = await this.getModuleDataMap(userId, moduleId, currentDraftId, groupId);
        // Usar tagId si existe, sino label
        const key = field.tagId || field.label.trim().toLowerCase();
        const matches = moduleData[key] || [];

        return matches.map(match => {
            const val1Normalized = String(match.value).toLowerCase().trim();
            const val2Normalized = String(value).toLowerCase().trim();

            let isCompatible = val1Normalized === val2Normalized;

            // Numeric normalization fallback (e.g., "05" vs "5")
            if (!isCompatible && !isNaN(Number(val1Normalized)) && !isNaN(Number(val2Normalized))) {
                isCompatible = Number(val1Normalized) === Number(val2Normalized);
            }

            return {
                docTitle: match.docTitle,
                docId: match.docId,
                fieldLabel: match.label,
                value: match.value,
                isCompatible
            };
        });
    },

    /**
     * Generates a full validation report for a student in a module and group
     */
    async generateStudentReport(userId: string, moduleId: string, groupId?: string): Promise<ValidationReport> {
        const dataMap = await this.getModuleDataMap(userId, moduleId, undefined, groupId);
        const details: ValidationDetail[] = [];

        let totalTags = 0;
        let matchedTags = 0;

        // Iterar sobre cada tag/key encontrada en los documentos
        for (const [key, matches] of Object.entries(dataMap)) {
            // Solo nos interesan los tags que aparecen en más de un documento para comparar
            // Ojo: Si un tag aparece solo una vez, no hay con qué comparar, ¿es consistencia 100% o N/A?
            // Asumiremos que validamos "consistencia" donde hay cruce de información.
            if (matches.length < 2) continue;

            totalTags++;

            // Verificar si todos los valores son iguales
            // Tomamos el primer valor como referencia
            const firstValue = String(matches[0].value).toLowerCase().trim();
            const isConsistent = matches.every(m => {
                const currentVal = String(m.value).toLowerCase().trim();
                if (currentVal === firstValue) return true;

                // Numeric normalization fallback
                if (!isNaN(Number(currentVal)) && !isNaN(Number(firstValue))) {
                    return Number(currentVal) === Number(firstValue);
                }
                return false;
            });

            if (isConsistent) {
                matchedTags++;
            }

            // Usamos el label del primer match como nombre legible si la key es un ID raro
            const tagName = matches[0].label;

            details.push({
                tagId: key,
                tagName: tagName,
                isConsistent,
                values: matches
            });
        }

        const score = totalTags > 0 ? Math.round((matchedTags / totalTags) * 100) : 0; // Si no hay coincidencias cruzadas, score 0 o 100? Asumo 0 por ahora si no hay nada que validar.

        return {
            studentId: userId,
            moduleId,
            totalTags,
            matchedTags,
            score,
            details,
            generatedAt: Date.now()
        };
    }
};
