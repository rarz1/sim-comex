function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
}

function mapKeys(obj: any, transform: (k: string) => string): any {
  if (Array.isArray(obj)) {
    return obj.map(item => mapKeys(item, transform));
  }
  if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [transform(k), mapKeys(v, transform)])
    );
  }
  return obj;
}

function toCamelObj(o: any) { return mapKeys(o, toCamelCase); }
function toSnakeObj(o: any) { return mapKeys(o, toSnakeCase); }

export class DataService {
  private baseUrl = '/api/data';

  private async handleResponse(res: Response): Promise<any> {
    if (!res.ok) {
      const text = await res.text();
      let msg = text;
      try { const j = JSON.parse(text); msg = j.error || j.message || text; } catch {}
      throw new Error(msg || `HTTP ${res.status}`);
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      let json: any;
      try {
        json = await res.json();
      } catch (parseErr: any) {
        throw new Error(`Respuesta inválida del servidor (HTTP ${res.status}): ${parseErr.message}`);
      }
      if (json.error) throw new Error(json.error);
      return json;
    }
    const raw = await res.text();
    throw new Error(`Respuesta inesperada del servidor (HTTP ${res.status}): ${raw.slice(0, 200)}`);
  }

  async getAll<T>(table: string, filters?: Record<string, string>): Promise<T[]> {
    const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
    const res = await fetch(`${this.baseUrl}/${table}${params}`);
    const json = await this.handleResponse(res);
    return (json.data ?? []).map(toCamelObj);
  }

  async getById<T>(table: string, id: string): Promise<T | null> {
    const res = await fetch(`${this.baseUrl}/${table}?id=${id}`);
    const json = await this.handleResponse(res);
    return json.data ? toCamelObj(json.data) : null;
  }

  async save<T>(table: string, data: Record<string, any>): Promise<T> {
    const res = await fetch(`${this.baseUrl}/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSnakeObj(data)),
    });
    const json = await this.handleResponse(res);
    return json.data ? toCamelObj(json.data) : (null as T);
  }

  async delete(table: string, id: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/${table}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await this.handleResponse(res);
    return true;
  }
}

export const dataService = new DataService();
