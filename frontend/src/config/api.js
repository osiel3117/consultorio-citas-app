const API_BASE = import.meta.env.VITE_API_URL;

if (!API_BASE) {
  throw new Error("VITE_API_URL no esta configurada");
}

export const API = `${API_BASE}/api`;
