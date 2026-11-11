const BASE_URL = 'https://www.themealdb.com/api/json/v1/1/';

async function apiRequest(endpoint, signal = null) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, { signal });
    
    if (!response.ok) {
      const error = new Error(`Error en el servidor: ${response.status} ${response.statusText}`);
      error.status = response.status;
      error.type = 'server_unavailable';
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err; 
    }
    if (!navigator.onLine || err.message.includes('Failed to fetch') || err.name === 'TypeError') {
      const connError = new Error('No se pudo establecer conexión con el servidor.');
      connError.type = 'offline';
      throw connError;
    }
    throw err;
  }
}

const API = {
  searchByName: async (name, signal) => apiRequest(`search.php?s=${encodeURIComponent(name)}`, signal),
  lookupById: async (id, signal) => apiRequest(`lookup.php?i=${encodeURIComponent(id)}`, signal),
  getRandom: async (signal) => apiRequest(`random.php`, signal),
  getCategories: async (signal) => apiRequest(`categories.php`, signal),
  listAreas: async (signal) => apiRequest(`list.php?a=list`, signal),
  listIngredients: async (signal) => apiRequest(`list.php?i=list`, signal),
  filterByCategory: async (category, signal) => apiRequest(`filter.php?c=${encodeURIComponent(category)}`, signal),
  filterByArea: async (area, signal) => apiRequest(`filter.php?a=${encodeURIComponent(area)}`, signal),
  filterByIngredient: async (ingredient, signal) => apiRequest(`filter.php?i=${encodeURIComponent(ingredient)}`, signal)
};

window.API = API;