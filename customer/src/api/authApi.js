import { request } from './apiClient';

export async function loginGuest(credentials) {
  return request("/client/session", {
    method: "POST",
    body: credentials
  });
}

export async function loginCustomer(documentNumber, otp = "123456") {
  const result = await request("/customer/session", {
    method: "POST",
    body: { documentNumber, otp }
  });
  return result?.data || result;
}

export async function getGuestProfile() {
  return request("/client/profile", {}, true);
}
