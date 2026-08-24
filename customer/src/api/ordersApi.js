import { request } from './apiClient';

function customerScope() {
  try {
    return Boolean(JSON.parse(localStorage.getItem("pp_customer_client") || "null")?.customerScope);
  } catch {
    return false;
  }
}

function ordersBase() {
  return customerScope() ? "/customer/service-reservations" : "/client";
}

export async function getMenu(area) {
  return request(`${ordersBase()}/menu/${area}`, {}, true).then((result) => result?.data ?? result);
}

export async function createOrder(payload) {
  return request(`${ordersBase()}/orders`, {
    method: "POST",
    body: payload
  }, true).then((result) => result?.data ?? result);
}

export async function getOrders() {
  return request(`${ordersBase()}/orders`, {}, true).then((result) => result?.data ?? result);
}

export async function getOrder(id) {
  return request(`/client/orders/${id}`, {}, true);
}
