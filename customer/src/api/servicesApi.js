import { request } from './apiClient';

function unwrap(result) {
  return result?.data ?? result;
}

export async function createServiceReservation(payload) {
  return unwrap(await request("/customer/service-reservations", {
    method: "POST",
    body: payload
  }, true));
}

export async function getCustomerServiceReservations() {
  return unwrap(await request("/customer/service-reservations", {}, true));
}

export async function payCustomerServiceReservation(id, payload) {
  return unwrap(await request(`/customer/service-reservations/${id}/payments`, {
    method: "POST",
    body: payload
  }, true));
}
