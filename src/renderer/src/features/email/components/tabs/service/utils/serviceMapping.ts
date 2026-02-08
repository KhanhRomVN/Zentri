import { SERVICE_PROVIDERS, ServiceProviderConfig } from './servicePresets';

export type { ServiceProviderConfig as ServiceMapping };

export const POPULAR_SERVICES = SERVICE_PROVIDERS;

/**
 * Tìm service mapping dựa trên URL
 */
export function findServiceByUrl(url: string): ServiceProviderConfig | null {
  if (!url) return null;

  try {
    const hostname = new URL(url).hostname.toLowerCase();

    // Tìm kiếm trong SERVICE_PROVIDERS
    for (const service of Object.values(SERVICE_PROVIDERS)) {
      const serviceHostname = new URL(service.websiteUrl).hostname.toLowerCase();

      // So sánh hostname (bỏ qua www.)
      const cleanHostname = hostname.replace(/^www\./, '');
      const cleanServiceHostname = serviceHostname.replace(/^www\./, '');

      if (cleanHostname === cleanServiceHostname || cleanHostname.includes(cleanServiceHostname)) {
        return service;
      }
    }
  } catch (error) {
    // console.error('Invalid URL:', url);
  }

  return null;
}

/**
 * Lấy suggestions cho tags dựa trên URL
 */
export function getTagSuggestions(url: string): string[] {
  const service = findServiceByUrl(url);
  return service?.defaultTags || [];
}

/**
 * Lấy suggestions cho categories dựa trên URL
 */
export function getCategorySuggestions(url: string): string[] {
  const service = findServiceByUrl(url);
  return service?.defaultCategories || [];
}
