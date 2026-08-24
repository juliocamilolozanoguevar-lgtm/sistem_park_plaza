import { request } from './apiClient';

export async function getMenu(area) {
  return request(`/client/menu/${area}`, {}, true);
}

export async function createOrder(payload) {
  return request("/client/orders", {
    method: "POST",
    body: payload
  }, true);
}

export async function getOrders() {
  return request("/client/orders", {}, true);
}

export async function getOrder(id) {
  return request(`/client/orders/${id}`, {}, true);
}
