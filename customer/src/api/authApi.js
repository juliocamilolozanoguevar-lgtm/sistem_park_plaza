import { request } from './apiClient';

// TODO: implementar autenticación de cliente externo cuando FASE 0A confirme el contrato definitivo del backend principal.

export async function loginGuest(credentials) {
  return request("/client/session", {
    method: "POST",
    body: credentials
  });
}
