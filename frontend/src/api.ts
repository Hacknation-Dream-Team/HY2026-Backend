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

  async updateHomeAddress(data: any, token?: string) {
    const jwt = token || localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/users/me/home-address`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Update home address failed');
    return res.json();
  },



  async getRoutes() {
    const res = await fetch(`${API_BASE}/routes`);
    if (!res.ok) throw new Error('Fetching routes failed');
    return res.json();
  },

  async createRoute(data: any) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/routes`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Create route failed: ' + txt);
    }
    return res.json();
  },

  async getOrganizations() {
    const res = await fetch(`${API_BASE}/organizations`);
    if (!res.ok) throw new Error('Fetching organizations failed');
    return res.json();
  },

  async createAdvertisement(data: any) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/advertisements`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Create ad failed: ' + txt);
    }
    return res.json();
  },

  async getAdvertisements() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/advertisements`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Fetching ads failed');
    return res.json();
  },

  async createMatch(data: any) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/matches`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Create match failed: ' + txt);
    }
    return res.json();
  },

  async createRideRequest(data: any) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/riderequests`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Create ride request failed: ' + txt);
    }
    return res.json();
  },

  async getRideRequests() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/riderequests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Fetching requests failed');
    return res.json();
  },

  async searchMatches(params: any) {
    const token = localStorage.getItem('token');
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/matches?${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },
  
  async getMyMatches() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/matches/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Fetching my matches failed');
    return res.json();
  },

  async getCars() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/cars`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Fetching cars failed');
    return res.json();
  },

  async getCarModels() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/cars/models`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Fetching car models failed');
    return res.json();
  },

  async addCar(data: any) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/cars`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Adding car failed: ' + txt);
    }
    return res.json();
  }
};
