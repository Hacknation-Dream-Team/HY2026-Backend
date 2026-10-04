const API_BASE = '/api';

async function handleResponse(res: Response, defaultMessage: string) {
  if (!res.ok) {
    const text = await res.text();
    let message = `${defaultMessage}: ${res.status}`;
    try {
      const json = JSON.parse(text);
      if (json.message) {
        message = json.message;
      } else if (json.errors) {
        message = Object.values(json.errors).flat().join('\n');
      }
    } catch {
      message += ` - ${text}`;
    }
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  async register(data: any) {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res, 'Registration failed');
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
    return handleResponse(res, 'Create route failed');
  },

  async deleteRoute(id: number | string) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/routes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok && res.status !== 204) {
      return handleResponse(res, 'Deleting route failed');
    }
    return true;
  },

  async getOrganizations() {
    const res = await fetch(`${API_BASE}/organizations`);
    return handleResponse(res, 'Fetching organizations failed');
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
    return handleResponse(res, 'Create ad failed');
  },

  async getAdvertisements() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/advertisements`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(res, 'Fetching ads failed');
  },

  async deleteAdvertisement(id: number | string) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/advertisements/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok && res.status !== 204) {
      return handleResponse(res, 'Deleting advertisement failed');
    }
    return true;
  },

  async updateAdvertisement(id: number | string, data: any) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/advertisements/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res, 'Update advertisement failed');
  },

  async getRouteById(id: number | string) {
    const res = await fetch(`${API_BASE}/routes/${id}`);
    if (!res.ok) throw new Error('Fetching route failed');
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
    return handleResponse(res, 'Create match failed');
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
    return handleResponse(res, 'Create ride request failed');
  },

  async deleteRideRequest(id: number | string) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/riderequests/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok && res.status !== 204) {
      return handleResponse(res, 'Deleting request failed');
    }
    return true;
  },

  async updateRideRequest(id: number | string, data: any) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/riderequests/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res, 'Update ride request failed');
  },

  async getRideRequests() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/riderequests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(res, 'Fetching requests failed');
  },

  async searchMatches(params: any) {
    const token = localStorage.getItem('token');
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/matches?${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(res, 'Search failed');
  },
  
  async getMyMatches() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/matches/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(res, 'Fetching my matches failed');
  },

  async getCars() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/cars`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(res, 'Fetching cars failed');
  },

  async getCarModels() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/cars/models`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(res, 'Fetching car models failed');
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
    return handleResponse(res, 'Adding car failed');
  }
};
