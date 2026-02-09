// This file is now cleaned to remove hardcoded defaults.
// Services are loaded from custom_providers.json
export interface ServiceProviderConfig {
  id: string;
  name: string;
  websiteUrl: string;
  defaultTags: string[];
  defaultCategories: string[];
  commonFields?: {
    label: string;
    key: string;
    type: 'string' | 'array' | 'object';
    itemType?: 'string' | 'object'; // For array items
    children?: any[]; // For object fields or array of objects. Using any[] to avoid circular reference issues in TS for now, but logically it's the same structure.
    required?: boolean;
    placeholder?: string;
  }[];
}

export const SERVICE_PROVIDERS: Record<string, ServiceProviderConfig> = {};

export const POPULAR_SERVICE_PROVIDERS = Object.values(SERVICE_PROVIDERS);
export const POPULAR_SERVICE_NAMES = POPULAR_SERVICE_PROVIDERS.map((p) => p.name);

// Flattening some common categories for suggestions
export const POPULAR_CATEGORIES = [
  'Social Media',
  'Email',
  'Development',
  'Productivity',
  'Entertainment',
  'Shopping',
  'Finance',
  'Education',
  'Other',
];
