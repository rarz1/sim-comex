export class DataService {
  private baseUrl = '/api/data';

  async getAll<T>(table: string, filters?: Record<string, string>): Promise<T[]> {
    const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
    const res = await fetch(`${this.baseUrl}/${table}${params}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data ?? [];
  }

  async getById<T>(table: string, id: string): Promise<T | null> {
    const res = await fetch(`${this.baseUrl}/${table}?id=${id}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data ?? null;
  }

  async save<T>(table: string, data: Record<string, any>): Promise<T> {
    const res = await fetch(`${this.baseUrl}/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data as T;
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
