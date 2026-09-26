# Zentri Database Schema

Tài liệu đặc tả cấu trúc cơ sở dữ liệu SQLite trung tâm (`zentri.db`) của **Zentri Account Manager**. Mọi bảng được tạo tự động bởi `DbManager` (`src/main/core/database.ts`) khi khởi tạo ứng dụng.

> **Lưu ý:** Tài liệu này chỉ bao gồm CSDL trung tâm. Các file SQLite per-profile (`passwords.db`, `fp-ip-history.db`) được mô tả riêng trong [data-storage.md](data-storage.md).

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Sơ đồ Quan hệ (ERD)](#2-sơ-đồ-quan-hệ-erd)
3. [Bảng `emails`](#3-bảng-emails)
4. [Bảng `proxies`](#4-bảng-proxies)
5. [Bảng `services`](#5-bảng-services)
6. [Bảng `service_emails`](#6-bảng-service_emails)
7. [Bảng `devices`](#7-bảng-devices)
8. [Bảng `workflows`](#8-bảng-workflows)
9. [Bảng `workflow_runs`](#9-bảng-workflow_runs)
10. [Bảng `workflow_logs`](#10-bảng-workflow_logs)
11. [Migration History](#11-migration-history)
12. [Index & Performance Notes](#12-index--performance-notes)
13. [Bảng Đã Xóa (Deprecated)](#13-bảng-đã-xóa-deprecated)

---

## 1. Tổng quan

| Thuộc tính | Giá trị |
|------------|---------|
| Engine | SQLite 3 |
| File | `zentri.db` hoặc `zentri.sql` (tùy cấu hình) |
| Foreign Keys | `PRAGMA foreign_keys = ON` |
| Primary Key | TEXT (UUID v4) cho tất cả bảng |
| Timestamp | `DATETIME DEFAULT CURRENT_TIMESTAMP` |
| Mã nguồn schema | `src/main/core/database.ts` — method `doInit()` + `applyMigrations()` |

---

## 2. Sơ đồ Quan hệ (ERD)

```
emails ──1:N── service_emails ──N:1── services

workflows ──1:N── workflow_runs ──1:N── workflow_logs

proxies   (standalone)
devices   (standalone)
```

---

## 3. Bảng `emails`

_Lưu trữ thông tin định danh và bảo mật cốt lõi của tài khoản email._

```sql
CREATE TABLE IF NOT EXISTS emails (
    id             TEXT PRIMARY KEY,
    email          TEXT NOT NULL,
    password       TEXT,
    phone_number   TEXT,
    recovery_email TEXT,
    totp           TEXT,
    backup_codes   TEXT,
    category       TEXT,
    tags           TEXT,
    inbox_cache    TEXT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | TEXT | PK | UUID v4 |
| `email` | TEXT | NOT NULL | Địa chỉ email chính |
| `password` | TEXT | nullable | Mật khẩu truy cập |
| `phone_number` | TEXT | nullable | Số điện thoại liên kết |
| `recovery_email` | TEXT | nullable | Email khôi phục dự phòng |
| `totp` | TEXT | nullable | Mã bí mật TOTP/2FA |
| `backup_codes` | TEXT | nullable | Danh sách mã dự phòng (JSON array) |
| `category` | TEXT | nullable | Phân loại (Personal, Work, Finance...) |
| `tags` | TEXT | nullable | Nhãn tùy chỉnh (JSON array) |
| `inbox_cache` | TEXT | nullable | Cache nội dung inbox (JSON) |
| `created_at` | DATETIME | DEFAULT NOW | Thời điểm tạo |
| `updated_at` | DATETIME | DEFAULT NOW | Thời điểm cập nhật cuối |

---

## 4. Bảng `proxies`

_Quản lý hạ tầng mạng, định danh IP và health metrics._

```sql
CREATE TABLE IF NOT EXISTS proxies (
    id              TEXT PRIMARY KEY,
    ip_version      INTEGER NOT NULL,
    proxy_type      TEXT NOT NULL,
    source_type     TEXT NOT NULL,
    rotation_type   TEXT NOT NULL,
    pricing_type    TEXT NOT NULL,
    protocol        TEXT,
    host            TEXT,
    port            INTEGER,
    username        TEXT,
    password        TEXT,
    country         TEXT,
    city            TEXT,
    isp             TEXT,
    duration_days   INTEGER,
    bandwidth_gb    REAL,
    price           NUMERIC,
    status          TEXT DEFAULT 'active',
    metadata        TEXT,
    expiration_date INTEGER,
    expired_at      DATETIME,
    last_checked_at DATETIME,
    purchase_url    TEXT,
    latency         INTEGER,
    success_rate    INTEGER,
    quota_total     TEXT,
    quota_used      REAL,
    last_seen_min   INTEGER,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | TEXT | PK | UUID v4 |
| `ip_version` | INTEGER | NOT NULL | Phiên bản IP (4 hoặc 6) |
| `proxy_type` | TEXT | NOT NULL | Phân loại sở hữu (`private`, `shared`) |
| `source_type` | TEXT | NOT NULL | Loại node (`datacenter`, `residential`, `mobile`) |
| `rotation_type` | TEXT | NOT NULL | Cơ chế IP (`static`, `rotating`) |
| `pricing_type` | TEXT | NOT NULL | Hình thức thanh toán (`time`, `bandwidth`) |
| `protocol` | TEXT | nullable | Giao thức (`http`, `socks5`) |
| `host` | TEXT | nullable | Host/IP proxy |
| `port` | INTEGER | nullable | Cổng kết nối |
| `username` | TEXT | nullable | Xác thực proxy |
| `password` | TEXT | nullable | Xác thực proxy |
| `country` | TEXT | nullable | Quốc gia |
| `city` | TEXT | nullable | Thành phố |
| `isp` | TEXT | nullable | Nhà mạng |
| `duration_days` | INTEGER | nullable | Thời hạn thuê (ngày) |
| `bandwidth_gb` | REAL | nullable | Băng thông (GB) |
| `price` | NUMERIC | nullable | Giá mua |
| `status` | TEXT | DEFAULT `'active'` | Trạng thái (`active`, `expired`, `disabled`, `error`) |
| `metadata` | TEXT | nullable | Dữ liệu mở rộng (JSON) |
| `expiration_date` | INTEGER | nullable | Legacy — timestamp ms ngày hết hạn |
| `expired_at` | DATETIME | nullable | Ngày hết hạn (migrated từ `expiration_date`) |
| `last_checked_at` | DATETIME | nullable | Lần cuối kiểm tra sức khỏe |
| `purchase_url` | TEXT | nullable | Link gia hạn/mua mới |
| `latency` | INTEGER | nullable | Độ trễ trung bình (ms) |
| `success_rate` | INTEGER | nullable | Tỷ lệ thành công (%) |
| `quota_total` | TEXT | nullable | Tổng quota băng thông |
| `quota_used` | REAL | nullable | Quota đã dùng |
| `last_seen_min` | INTEGER | nullable | Phút kể từ lần hoạt động cuối |
| `created_at` | DATETIME | DEFAULT NOW | Thời điểm tạo |
| `updated_at` | DATETIME | DEFAULT NOW | Thời điểm cập nhật cuối |

---

## 5. Bảng `services`

_Thư viện dịch vụ/nền tảng hỗ trợ (Google, GitHub, Facebook...)._

```sql
CREATE TABLE IF NOT EXISTS services (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    url         TEXT,
    tags        TEXT,
    category    TEXT,
    description TEXT,
    config_json TEXT,
    metadata    TEXT,
    auth_method TEXT,
    two_fa      TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | TEXT | PK | UUID v4 |
| `name` | TEXT | NOT NULL | Tên hiển thị dịch vụ |
| `url` | TEXT | nullable | URL gốc nền tảng |
| `tags` | TEXT | nullable | Nhãn tìm kiếm (JSON array) |
| `category` | TEXT | nullable | Phân loại |
| `description` | TEXT | nullable | Mô tả chi tiết |
| `config_json` | TEXT | nullable | Cấu hình dịch vụ (JSON) |
| `metadata` | TEXT | nullable | Custom fields định nghĩa cấu trúc dữ liệu (JSON). Mỗi field: `{name, type, feature?}` |
| `auth_method` | TEXT | nullable | Phương thức xác thực hỗ trợ (JSON array, vd: `["google_oauth"]`) |
| `two_fa` | TEXT | nullable | Cấu hình 2FA của service (JSON) |
| `created_at` | DATETIME | DEFAULT NOW | Thời điểm tạo |
| `updated_at` | DATETIME | DEFAULT NOW | Thời điểm cập nhật cuối |

---

## 6. Bảng `service_emails`

_Liên kết N-N giữa tài khoản email và dịch vụ, kèm metadata riêng._

```sql
CREATE TABLE IF NOT EXISTS service_emails (
    id         TEXT PRIMARY KEY,
    email_id   TEXT,
    service_id TEXT,
    metadata   TEXT,
    two_fa     TEXT,
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);
```

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | TEXT | PK | UUID v4 |
| `email_id` | TEXT | FK → emails(id), CASCADE | Tài khoản email |
| `service_id` | TEXT | FK → services(id), CASCADE | Dịch vụ liên kết |
| `metadata` | TEXT | nullable | Dữ liệu bổ sung cho liên kết này (JSON) |
| `two_fa` | TEXT | nullable | Cấu hình 2FA riêng cho liên kết (JSON) |

---

## 7. Bảng `devices`

_Quản lý thiết bị vật lý hoặc ảo._

```sql
CREATE TABLE IF NOT EXISTS devices (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    type          TEXT NOT NULL,
    is_virtual    INTEGER NOT NULL DEFAULT 0,
    platform      TEXT,
    os_version    TEXT,
    group_name    TEXT,
    tags          TEXT,
    status        TEXT DEFAULT 'online',
    ip_address    TEXT,
    mac_address   TEXT,
    battery       INTEGER,
    storage_total INTEGER,
    storage_used  INTEGER,
    ram_total     INTEGER,
    ram_used      INTEGER,
    cpu_usage     REAL,
    last_seen_at  DATETIME,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | TEXT | PK | UUID v4 |
| `name` | TEXT | NOT NULL | Tên thiết bị |
| `type` | TEXT | NOT NULL | Loại thiết bị |
| `is_virtual` | INTEGER | NOT NULL, DEFAULT 0 | 1 = máy ảo, 0 = vật lý |
| `platform` | TEXT | nullable | Nền tảng (Windows, macOS, Linux...) |
| `os_version` | TEXT | nullable | Phiên bản OS |
| `group_name` | TEXT | nullable | Nhóm thiết bị |
| `tags` | TEXT | nullable | Nhãn (JSON array) |
| `status` | TEXT | DEFAULT `'online'` | Trạng thái (`online`, `offline`, `maintenance`) |
| `ip_address` | TEXT | nullable | IP hiện tại |
| `mac_address` | TEXT | nullable | MAC address |
| `battery` | INTEGER | nullable | Mức pin (%) |
| `storage_total` | INTEGER | nullable | Tổng dung lượng (bytes) |
| `storage_used` | INTEGER | nullable | Dung lượng đã dùng (bytes) |
| `ram_total` | INTEGER | nullable | Tổng RAM (bytes) |
| `ram_used` | INTEGER | nullable | RAM đã dùng (bytes) |
| `cpu_usage` | REAL | nullable | CPU usage (%) |
| `last_seen_at` | DATETIME | nullable | Lần cuối online |
| `created_at` | DATETIME | DEFAULT NOW | Thời điểm tạo |
| `updated_at` | DATETIME | DEFAULT NOW | Thời điểm cập nhật cuối |

---

## 8. Bảng `workflows`

_Lưu trữ định nghĩa workflow automation._

```sql
CREATE TABLE IF NOT EXISTS workflows (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    platform    TEXT NOT NULL,
    description TEXT,
    nodes       TEXT NOT NULL,
    connections TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | TEXT | PK | UUID v4 |
| `name` | TEXT | NOT NULL | Tên workflow |
| `platform` | TEXT | NOT NULL | Nền tảng thực thi (`website`, `mobile`) |
| `description` | TEXT | nullable | Mô tả chi tiết |
| `nodes` | TEXT | NOT NULL | Danh sách nodes (JSON array) |
| `connections` | TEXT | NOT NULL | Danh sách connections giữa các nodes (JSON array) |
| `created_at` | DATETIME | DEFAULT NOW | Thời điểm tạo |
| `updated_at` | DATETIME | DEFAULT NOW | Thời điểm cập nhật cuối |

---

## 9. Bảng `workflow_runs`

_Lịch sử mỗi lần chạy workflow._

```sql
CREATE TABLE IF NOT EXISTS workflow_runs (
    id             TEXT PRIMARY KEY,
    workflow_id    TEXT NOT NULL,
    timestamp      DATETIME DEFAULT CURRENT_TIMESTAMP,
    status         TEXT NOT NULL,
    duration       INTEGER,
    method         TEXT NOT NULL,
    instance_count INTEGER,
    snapshot       TEXT NOT NULL,
    results        TEXT,
    error          TEXT,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow
    ON workflow_runs(workflow_id, timestamp DESC);
```

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | TEXT | PK | UUID v4 |
| `workflow_id` | TEXT | FK → workflows(id), CASCADE | Workflow được chạy |
| `timestamp` | DATETIME | DEFAULT NOW | Thời điểm bắt đầu |
| `status` | TEXT | NOT NULL | Trạng thái (`passed`, `failed`, `running`) |
| `duration` | INTEGER | nullable | Thời gian chạy (ms) |
| `method` | TEXT | NOT NULL | Phương thức thực thi |
| `instance_count` | INTEGER | nullable | Số instance song song |
| `snapshot` | TEXT | NOT NULL | Snapshot cấu hình lúc chạy (JSON) |
| `results` | TEXT | nullable | Kết quả chi tiết (JSON) |
| `error` | TEXT | nullable | Thông báo lỗi nếu failed |

---

## 10. Bảng `workflow_logs`

_Log chi tiết từng bước trong workflow run._

```sql
CREATE TABLE IF NOT EXISTS workflow_logs (
    id          TEXT PRIMARY KEY,
    run_id      TEXT NOT NULL,
    workflow_id TEXT NOT NULL,
    timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP,
    level       TEXT NOT NULL,
    message     TEXT NOT NULL,
    node_id     TEXT,
    instance_id TEXT,
    metadata    TEXT,
    FOREIGN KEY (run_id) REFERENCES workflow_runs(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workflow_logs_run
    ON workflow_logs(run_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_workflow
    ON workflow_logs(workflow_id, timestamp DESC);
```

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | TEXT | PK | UUID v4 |
| `run_id` | TEXT | FK → workflow_runs(id), CASCADE | Run chứa log này |
| `workflow_id` | TEXT | FK → workflows(id), CASCADE | Workflow tương ứng |
| `timestamp` | DATETIME | DEFAULT NOW | Thời điểm ghi log |
| `level` | TEXT | NOT NULL | Mức log (`info`, `warn`, `error`, `debug`) |
| `message` | TEXT | NOT NULL | Nội dung log |
| `node_id` | TEXT | nullable | Node phát sinh log |
| `instance_id` | TEXT | nullable | Instance phát sinh log |
| `metadata` | TEXT | nullable | Dữ liệu bổ sung (JSON) |

---

## 11. Migration History

Các migration được áp dụng tự động bởi `applyMigrations()` trong `database.ts`. Thứ tự áp dụng:

| # | Bảng | Thay đổi | Ghi chú |
|---|------|----------|---------|
| 1 | `emails` | ADD `inbox_cache` | Cache nội dung inbox |
| 2 | `emails` | ADD `phone_number`, `recovery_email`, `totp`, `backup_codes`, `category`, `tags` | Mở rộng thông tin tài khoản |
| 3 | `services` | ADD `description`, `metadata`, `auth_method`, `two_fa` | Mở rộng cấu hình dịch vụ |
| 4 | `service_emails` | ADD `metadata`, `two_fa` | Metadata riêng cho liên kết |
| 5 | — | DROP `service_emails_secrets`, `service_secrets` | Bảng cũ không còn dùng |
| 6 | `proxies` | ADD `expired_at`, `last_checked_at`, `purchase_url` | Refactor ngày hết hạn sang DATETIME |
| 7 | `proxies` | Migrate `expiration_date` → `expired_at` | Convert timestamp ms → datetime |
| 8 | `proxies` | ADD `latency`, `success_rate`, `quota_total`, `quota_used`, `last_seen_min` | Health metrics v3 |

> **Lưu ý:** Tất cả migration đều dùng `ALTER TABLE ADD COLUMN` hoặc `CREATE TABLE IF NOT EXISTS`, đảm bảo idempotent — chạy lại nhiều lần không gây lỗi.

---

## 12. Index & Performance Notes

### Index hiện có

| Index | Bảng | Cột | Mục đích |
|-------|------|-----|----------|
| `idx_workflow_runs_workflow` | `workflow_runs` | `(workflow_id, timestamp DESC)` | Query lịch sử chạy theo workflow, mới nhất trước |
| `idx_workflow_logs_run` | `workflow_logs` | `(run_id, timestamp)` | Query log theo run, sắp xếp thời gian |
| `idx_workflow_logs_workflow` | `workflow_logs` | `(workflow_id, timestamp DESC)` | Query log theo workflow, mới nhất trước |

### Khuyến nghị hiệu năng

- **Foreign Keys**: Luôn bật `PRAGMA foreign_keys = ON` để đảm bảo referential integrity.
- **CASCADE DELETE**: Xóa email/service/workflow sẽ tự động xóa các bản ghi con liên quan.
- **JSON columns**: Các cột `TEXT` chứa JSON (`tags`, `metadata`, `nodes`, `connections`, `config_json`, `results`, `snapshot`) nên được parse ở application layer, không query trực tiếp bằng SQL.
- **Timestamp queries**: Các index trên `timestamp DESC` hỗ trợ pagination hiệu quả cho lịch sử.
- **WAL mode**: Nên bật `PRAGMA journal_mode = WAL` cho concurrent read/write tốt hơn (chưa bật mặc định).

---

## 13. Bảng Đã Xóa (Deprecated)

Các bảng sau đã bị xóa khỏi schema vì không còn được sử dụng hoặc đã được thay thế bởi cơ chế khác:

| Bảng | Lý do xóa | Thay thế bởi |
|------|-----------|--------------|
| `proxy_history` | Nhật ký proxy-email-site không còn cần thiết; việc tracking fingerprint/IP đã chuyển sang per-profile | `fp-ip-history.db` (per-profile) |
| `proxy_health_history` | Lịch sử health check proxy không còn được query riêng biệt; metrics đã tích hợp trực tiếp vào bảng `proxies` | Cột `latency`, `success_rate`, `last_checked_at` trong `proxies` |
| `fingerprints` | Fingerprint không còn lưu tĩnh trong DB; chuyển sang dynamic generation từ IP data | `fingerprintGenerator.ts` (renderer) |
| `agents` | Bảng chưa bao giờ được sử dụng trong codebase | — |
| `sessions` | Forge session tracking không còn dùng; cookie-based session detection đọc trực tiếp từ Chrome profile | Cookie parsing trong `data.ts` |