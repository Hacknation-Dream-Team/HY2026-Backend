const API_BASE = '/api';

export const api = {
  async register(data: any) {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Registration failed: ${res.status} - ${text}`);
    }
    return res.json();
  },

  async login(data: any) {
    const res = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  async createRoute(data: any, token: string) {
    const res = await fetch(`${API_BASE}/routes`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Route creation failed');
    return res.json();
  },

  async getRoutes() {
    const res = await fetch(`${API_BASE}/routes`);
    if (!res.ok) throw new Error('Fetching routes failed');
    return res.json();
  }
};
