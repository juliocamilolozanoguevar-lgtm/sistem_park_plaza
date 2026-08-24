import { request } from './apiClient';

export async function getEventSpaces() {
  return request("/client/events/spaces", {}, true);
}

export async function getEvents() {
  return request("/client/events", {}, true);
}

export async function getEvent(id) {
  return request(`/client/events/${id}`, {}, true);
}

export async function createEvent(payload) {
  return request("/client/events", {
    method: "POST",
    body: payload
  }, true);
}
