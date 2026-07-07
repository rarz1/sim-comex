function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
}

function mapKeys(obj: any, transform: (k: string) => string): any {
  if (Array.isArray(obj)) return obj;
  if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [transform(k), v])
    );
  }
  return obj;
}

function toCamelObj(o: any) { return mapKeys(o, toCamelCase); }
function toSnakeObj(o: any) { return mapKeys(o, toSnakeCase); }

export class DataService {
  private baseUrl = '/api/data';

  async getAll<T>(table: string, filters?: Record<string, string>): Promise<T[]> {
    const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
    const res = await fetch(`${this.baseUrl}/${table}${params}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return (json.data ?? []).map(toCamelObj);
  }

  async getById<T>(table: string, id: string): Promise<T | null> {
    const res = await fetch(`${this.baseUrl}/${table}?id=${id}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data ? toCamelObj(json.data) : null;
  }

  async save<T>(table: string, data: Record<string, any>): Promise<T> {
    const res = await fetch(`${this.baseUrl}/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSnakeObj(data)),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data ? toCamelObj(json.data) : (null as T);
  }

  async delete(table: string, id: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/${table}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return true;
  }
}

export const dataService = new DataService();
