import { request } from './apiClient';

export async function getConsumptions() {
  return request("/client/consumptions", {}, true);
}
