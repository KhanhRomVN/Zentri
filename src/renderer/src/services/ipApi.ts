import type { IpApiResponse } from '../types/ip-api';

/**
 * Fetch IP information from https://ip-api.com/json
 * Returns the full IpApiResponse object.
 */
export async function fetchIpInfo(): Promise<IpApiResponse> {
  const res = await fetch('http://ip-api.com/json');
  if (!res.ok) {
    throw new Error(`IP API unavailable (HTTP ${res.status})`);
  }
  const data: IpApiResponse = await res.json();
  if (data.status !== 'success') {
    throw new Error(`IP API returned status: ${data.status}`);
  }
  return data;
}