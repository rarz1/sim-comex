import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateDocumentProgress(template: any, draftContent: Record<string, any> | undefined) {
  if (!draftContent || !template || !template.schema) return 0;
  const sections = template.schema.sections || [];
  const totalFields = sections.reduce((acc: number, section: any) => acc + (section.fields?.length || 0), 0);
  if (totalFields === 0) return 0;

  // Count only fields that are actually in the schema and have a value
  const schemaFieldIds = new Set(sections.flatMap((s: any) => s.fields?.map((f: any) => f.id) || []));
  const filledFields = Object.keys(draftContent).filter(id => {
    if (!schemaFieldIds.has(id)) return false;
    const val = draftContent[id];
    return val !== "" && val !== null && val !== undefined;
  }).length;

  return Math.round((filledFields / totalFields) * 100);
}
