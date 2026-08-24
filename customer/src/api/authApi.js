import { request } from './apiClient';

// TODO: Endpoint de autenticación externa por confirmar.
// export async function loginExternalCustomer(credentials) {
//   // return request("/customer/session", { method: "POST", body: credentials });
// }

export async function loginGuest(credentials) {
  return request("/client/session", {
    method: "POST",
    body: credentials
  });
}
