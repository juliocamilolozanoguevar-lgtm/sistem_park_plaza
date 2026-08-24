// eventsApi.js
import { request } from './apiClient';

export async function getEvents() {
  return request("/api/customer/events", {}, true);
}

export async function acceptEventQuotation(eventId, paymentData) {
  return request(`/api/customer/events/${eventId}/accept`, {
    method: "POST",
    body: paymentData
  }, true);
}
