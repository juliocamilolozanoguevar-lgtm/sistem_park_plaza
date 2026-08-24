import { apiBaseUrl } from '../config/api';

/**
 * Wrapper central para peticiones HTTP.
 * Preparado para soportar bearer token, JSON y manejo de errores estandarizado.
 */
export async function request(path, options = {}, authenticated = false) {
  const headers = { "Content-Type": "application/json" };
  if (authenticated) {
    headers.Authorization = `Bearer ${localStorage.getItem("pp_customer_token")}`;
  }
  let response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { 
      ...options, 
      cache: "no-store", 
      headers, 
      body: options.body ? JSON.stringify(options.body) : undefined 
    });
  } catch {
    const error = new Error("No pudimos conectar con el hotel. Revisa tu conexión e intenta nuevamente.");
    error.status = 0;
    throw error;
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.message || "No pudimos completar la operación");
    error.status = response.status;
    throw error;
  }
  return data;
}
