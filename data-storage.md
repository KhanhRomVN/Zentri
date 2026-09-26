# Thiết kế Hệ thống Lưu trữ Zentri (Cục bộ)

Tài liệu này mô tả toàn bộ kiến trúc lưu trữ dữ liệu của **Zentri Account Manager**. Hệ thống sử dụng mô hình kết hợp: một cơ sở dữ liệu SQLite trung tâm cho metadata và các thư mục profile riêng biệt chứa dữ liệu nhạy cảm hoặc gắn liền với phiên trình duyệt.

---

## Mục lục

1. [Tổng quan Kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Cấu trúc Thư mục](#2-cấu-trúc-thư-mục)
3. [Cơ sở dữ liệu Trung tâm (zentri.db)](#3-cơ-sở-dữ-liệu-trung-tâm-zentridb)
4. [Dữ liệu Per-Profile](#4-dữ-liệu-per-profile)
   - 4.1 [passwords.db](#41-passwordsdb)
   - 4.2 [fp-ip-history.db](#42-fp-ip-historydb)
5. [Nguyên tắc Quản lý Profile](#5-nguyên-tắc-quản-lý-profile)
6. [Quy ước Đặt tên & Định danh](#6-quy-ước-đặt-tên--định-danh)
7. [Kế hoạch Migration](#7-kế-hoạch-migration)
8. [Lưu ý Bảo mật & Hiệu năng](#8-lưu-y-bảo-mật--hiệu-năng)

---

## 1. Tổng quan Kiến trúc

Zentri tách biệt rõ ràng giữa **metadata** (thông tin tài khoản, proxy, service, workflow) và **session data** (cookie, password autofill, fingerprint history). Lý do:

- **Metadata** cần truy vấn nhanh, liên kết chéo giữa các bảng → SQLite đơn file (`zentri.db`).
- **Session data** gắn liền với từng profile trình duyệt, cần cô lập để tránh rò rỉ chéo giữa các tài khoản → SQLite per-profile trong thư mục riêng.
- **Portability**: Người dùng có thể backup/xóa một profile bằng cách thao tác trên thư mục mà không ảnh hưởng đến CSDL chính.

---

## 2. Cấu trúc Thư mục

Khi người dùng chọn một thư mục lưu trữ (ví dụ: `D:/ZentriData/`), cấu trúc bên trong sẽ như sau:

```text
[.zentri]/
├── zentri.db                          # CSDL trung tâm (metadata)
└── profiles/
    └── [profile_email]/               # Thư mục profile theo email
        ├── passwords.db               # Mật khẩu & thông tin đăng nhập
        └── fp-ip-history.db           # Lịch sử fingerprint + IP theo domain
```

> **Ghi chú:** `[profile_email]` là email gốc của tài khoản (đã được sanitize để an toàn làm tên folder). Xem thêm tại [Mục 6](#6-quy-ước-đặt-tên--định-danh).

---

## 3. Cơ sở dữ liệu Trung tâm (zentri.db)

File `zentri.db` (hoặc `zentri.sql` tùy cấu hình khởi tạo) chứa toàn bộ metadata của hệ thống. Được quản lý bởi `DbManager` (`src/main/core/database.ts`).

### Các bảng chính

| Bảng             | Mô tả                                                                                      | Tham chiếu Schema                                        |
| ---------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| `emails`         | Thông tin định danh, bảo mật cốt lõi (email, password, TOTP, backup codes, tags, category) | [database-schema.md §emails](database-schema.md)         |
| `proxies`        | Hạ tầng mạng: host, port, protocol, geo, ISP, trạng thái, ngày hết hạn                     | [database-schema.md §proxies](database-schema.md)        |
| `proxy_history`  | Nhật ký sử dụng proxy theo tài khoản và target site                                        | [database-schema.md §proxy_history](database-schema.md)  |
| `services`       | Thư viện dịch vụ/nền tảng (Google, GitHub, Facebook...) kèm custom metadata fields         | [database-schema.md §services](database-schema.md)       |
| `service_emails` | Liên kết N-N giữa tài khoản email và dịch vụ                                               | [database-schema.md §service_emails](database-schema.md) |
| `fingerprints`   | Cấu hình dấu vân tay trình duyệt (UA, WebGL, Canvas...)                                    | [database-schema.md §fingerprints](database-schema.md)   |
| `workflows`      | Workflow automation: nodes, connections, lịch sử chạy, tỷ lệ thành công                    | [database-schema.md §workflows](database-schema.md)      |

> Chi tiết đầy đủ từng cột, kiểu dữ liệu và ràng buộc: xem [database-schema.md](database-schema.md).

### Vị trí file

- Nếu người dùng chọn thư mục: `<thư_mục_được_chọn>/zentri.sql`
- Mặc định (không chọn): `<app.getPath('userData')>/zentri.sql`
- Thư mục `profiles/` luôn nằm **cùng cấp** với file `zentri.db/zentri.sql`.

---

## 4. Dữ liệu Per-Profile

Mỗi tài khoản có một thư mục riêng dưới `profiles/[profile_email]/`. Bên trong chứa các file SQLite độc lập, **không** nằm trong `zentri.db`.

### 4.1 passwords.db

**Mục đích:** Lưu trữ thông tin đăng nhập (username/password) phục vụ autofill qua browser extension. Tách riêng khỏi CSDL chính để giảm rủi ro lộ mật khẩu khi backup/sharing metadata.

**Schema:**

```sql
CREATE TABLE IF NOT EXISTS passwords (
  id         TEXT PRIMARY KEY,
  url        TEXT NOT NULL,
  username   TEXT,
  password   TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Đặc điểm:**

- File chỉ được tạo khi có thao tác lưu password đầu tiên.
- Browser extension đọc trực tiếp file này để điền form đăng nhập.
- Không chứa TOTP hay backup codes (các trường đó nằm trong bảng `emails` của `zentri.db`).

**Mã nguồn tham chiếu:** `src/main/core/events/account/profile.ts` — hàm `getPasswordsDbPath()`, `ensurePasswordsTable()`.

### 4.2 fp-ip-history.db

**Mục đích:** Theo dõi lịch sử fingerprint trình duyệt và public IP theo từng domain. Giúp phát hiện khi nào một profile bị "lộ" fingerprint mới hoặc đổi IP bất thường.

**Schema:**

```sql
CREATE TABLE IF NOT EXISTS site_fingerprint_history (
  id                      TEXT PRIMARY KEY,
  domain                  TEXT NOT NULL,
  fingerprint_hash        TEXT NOT NULL,
  fingerprint_config_json TEXT,
  public_ip               TEXT NOT NULL,
  ip_info_json            TEXT,
  is_proxy                INTEGER DEFAULT 0,
  started_at              DATETIME NOT NULL,
  ended_at                DATETIME,
  created_at              DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sfh_domain_active
  ON site_fingerprint_history(domain, ended_at);
```

**Logic hoạt động:**

1. Mỗi lần navigate đến domain mới → thu thập fingerprint config (từ app config hoặc real browser qua CDP) + fetch public IP (ipify.org).
2. So sánh `fingerprint_config_json` + `public_ip` với bản ghi đang active (`ended_at IS NULL`).
3. Nếu **khác** → đóng bản ghi cũ (set `ended_at`) + tạo bản ghi mới.
4. Nếu **giống** → no-op.

**Thông tin bổ sung:** `ip_info_json` chứa dữ liệu từ ip-api.com (country, region, city, ISP, AS, timezone).

**Mã nguồn tham chiếu:** `src/main/core/events/browser/site-history.ts`.

---

## 5. Nguyên tắc Quản lý Profile

| Nguyên tắc               | Mô tả                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| **Định danh bằng email** | Không dùng UUID/random ID cho tên folder. Dùng `[email]` để dễ backup, tìm kiếm thủ công.     |
| **Tự động rename**       | Khi người dùng đổi email trong ứng dụng → hệ thống `fs.rename()` folder tương ứng để đồng bộ. |
| **Tạo tự động**          | Folder profile và các file `.db` bên trong được tạo lazy (khi cần), không pre-create.         |
| **Dọn dẹp cache**        | Renderer chịu trách nhiệm xóa cache/temp files sau mỗi phiên nếu được cấu hình.               |
| **Cô lập hoàn toàn**     | Không có shared state giữa các profile folder. Mỗi profile là một unit độc lập.               |

---

## 6. Quy ước Đặt tên & Định danh

- **Tên folder profile:** Email gốc, đã sanitize (loại bỏ ký tự không an toàn cho filesystem: `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`).
- **Ví dụ:** `user@example.com` → folder `user@example.com`
- **Không phân biệt hoa/thường** trên Windows/macOS → tránh tạo hai folder chỉ khác case.
- **Path construction:** Luôn dùng `path.join(path.dirname(dbManager.dbPath), 'profiles', email)` — không hardcode đường dẫn.

---

## 7. Kế hoạch Migration

Áp dụng cho bản cập nhật chuyển từ cấu trúc cũ (folder đặt tên bằng UUID/ID) sang cấu trúc mới:

| Bước | Nội dung                                                                    | Trạng thái     |
| ---- | --------------------------------------------------------------------------- | -------------- |
| 1    | Quét toàn bộ folder profile cũ trong `profiles/`                            | Chưa thực hiện |
| 2    | Map UUID → email từ `zentri.db` (bảng `emails`)                             | Chưa thực hiện |
| 3    | Rename folder từ UUID sang `[email]`                                        | Chưa thực hiện |
| 4    | Di chuyển `passwords.db` và `fp-ip-history.db` vào folder mới (nếu chưa có) | Chưa thực hiện |
| 5    | Verify integrity sau migration (so sánh row count trước/sau)                | Chưa thực hiện |

> **Cảnh báo:** Migration cần chạy offline (không mở browser profile đồng thời). Nên backup toàn bộ thư mục `.zentri/` trước khi thực hiện.

---

## 8. Lưu ý Bảo mật & Hiệu năng

### Bảo mật

- `passwords.db` chứa plaintext password → **không share/commit** file này.
- `fp-ip-history.db` chứa lịch sử IP thực tế → có thể dùng để correlate identity nếu bị lộ.
- `zentri.db` chứa TOTP secrets, backup codes → encrypt at rest nếu triển khai production.
- Không log nội dung DB ra console; chỉ log path và operation status.

### Hiệu năng

- `zentri.db`: Đánh index trên các cột thường query (`email`, `service_id`, `proxy_id`).
- `fp-ip-history.db`: Index `(domain, ended_at)` để query bản ghi active nhanh.
- Tránh mở nhiều connection SQLite đồng thời vào cùng một file → dùng pool hoặc serialize access.
- Cleanup `ended_at` entries cũ định kỳ để giữ file nhỏ gọn.

### Tương thích

- SQLite version ≥ 3.35.0 (hỗ trợ `JSON`, `STRICT` tables nếu cần nâng cấp schema).
- Node.js `better-sqlite3` hoặc `sqlite3` async wrapper — hiện tại dùng `sqlite3` (async callback-based).
