// publicApi.js - LEGACY_TEMPORAL stub
import { request } from './apiClient';

export async function getCatalog() {
  return request("/public/catalog");
}
