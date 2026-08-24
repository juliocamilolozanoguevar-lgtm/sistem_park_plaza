import { request } from './apiClient';

export async function getHotel() {
  return request("/public/hotel");
}

export async function getRoomTypes() {
  return request("/public/room-types");
}

export async function getAvailableRooms(filters = {}) {
  const query = new URLSearchParams();
  if (filters.checkIn) query.append("checkIn", filters.checkIn);
  if (filters.checkOut) query.append("checkOut", filters.checkOut);
  
  const qs = query.toString();
  return request(`/public/rooms/available${qs ? '?' + qs : ''}`);
}

export async function createReservation(payload) {
  return request("/public/reservations", {
    method: "POST",
    body: payload
  });
}

export async function getReservation(code) {
  return request(`/public/reservations/${code}`);
}

export async function getServices() {
  return request("/public/services");
}

export async function getServiceAvailability(type, filters = {}) {
  const query = new URLSearchParams();
  if (filters.date) query.append("date", filters.date);
  if (filters.from) query.append("from", filters.from);

  const qs = query.toString();
  return request(`/public/services/${type}/availability${qs ? '?' + qs : ''}`);
}

export async function getServicePlans(type) {
  return request(`/public/services/${type}/plans`);
}

export async function getServiceExtras(type) {
  return request(`/public/services/${type}/extras`);
}
