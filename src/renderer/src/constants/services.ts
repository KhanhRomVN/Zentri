/**
 * Danh sách toàn bộ Service (Website/Nền tảng) có nhu cầu tạo nhiều tài khoản.
 *
 * Dùng chung type Service từ @/types/db (khớp với bảng `services` trong DB).
 * Mỗi service bao gồm:
 * - id: Định danh duy nhất (dạng slug).
 * - name: Tên hiển thị của dịch vụ.
 * - description: Mô tả ngắn gọn về nền tảng.
 * - url: Trang chủ / Link gốc của nền tảng.
 * - category: Phân loại chính.
 * - tags: Mảng từ khóa tìm kiếm / phân loại phụ.
 *
 * Cập nhật: 2026-06-21
 */

import type { Service } from '../types/db';

export type { Service };

export const SERVICES: Service[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    description:
      'Mạng xã hội lớn nhất thế giới, thuộc Meta. Dùng để chạy quảng cáo, quản lý page, group.',
    url: 'https://www.facebook.com',
    category: 'Social Media',
    tags: ['social', 'ads', 'meta', 'marketing'],
    auth_method: ['google_oauth', 'basic_auth'],
    metadata: {
      fields: [
        { name: 'name', type: 'string' },
        { name: 'username', type: 'string' },
        { name: 'password', type: 'string', feature: 'encryption' },
        { name: '2fa_secret', type: 'string', feature: 'totp' },
        { name: 'backup_codes', type: 'array', feature: 'backup_codes' },
        { name: 'profile_url', type: 'string', feature: 'url' },
      ],
    },
  },
] as const;

/**
 * Helper: Lấy service theo ID.
 */
export function getServiceById(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}

/**
 * Helper: Lọc services theo category.
 */
export function getServicesByCategory(category: string): Service[] {
  return SERVICES.filter((s) => s.category === category);
}

/**
 * Helper: Lọc services theo tag.
 */
export function getServicesByTag(tag: string): Service[] {
  return SERVICES.filter((s) => s.tags?.includes(tag));
}

/**
 * Helper: Lấy tất cả categories duy nhất.
 */
export function getAllCategories(): string[] {
  return [...new Set(SERVICES.map((s) => s.category).filter((c): c is string => c != null))];
}

/**
 * Helper: Lấy tất cả tags duy nhất.
 */
export function getAllTags(): string[] {
  return [...new Set(SERVICES.flatMap((s) => s.tags ?? []))];
}
