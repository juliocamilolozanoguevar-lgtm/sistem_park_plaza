// consumptionsApi.js - Endpoint confirmado
import { request } from './apiClient';

export async function getConsumptions() {
  return request("/api/client/consumptions", {}, true);
}
