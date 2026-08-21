# 💎 Zentri Database Schema

Tài liệu cấu trúc dữ liệu hệ thống Zentri. Thiết kế tối ưu cho hiệu năng và khả năng mở rộng.

---

### 📧 Bảng `emails`

_Lưu trữ thông tin định danh và bảo mật cốt lõi của tài khoản Email._

- **`id`** [TEXT] `PRIMARY KEY`
  - Định danh duy nhất (UUID).
- **`email`** [TEXT] `NOT NULL`
  - Địa chỉ email chính.
- **`password`** [TEXT]
  - Mật khẩu truy cập.
- **`phone_number`** [TEXT]
  - Số điện thoại liên kết (Tùy chọn).
- **`recovery_email`** [TEXT]
  - Email khôi phục dự phòng.
- **`totp`** [TEXT]
  - Mã bí mật 2FA/TOTP phục vụ tự động hóa.
- **`backup_codes`** [TEXT]
  - Danh sách mã dự phòng.
- **`inbox_cache`** [TEXT]
  - Cache nội dung inbox (JSON).
- **`created_at`** | **`updated_at`** [DATETIME]
  - Dấu thời gian hệ thống.

---

### 🌐 Bảng `proxies`

_Hệ thống quản lý hạ tầng mạng và định danh IP._

- **`id`** [TEXT] `PRIMARY KEY`
  - Định danh duy nhất (UUID).
- **`protocol`** [TEXT]
  - Giao thức (`http`, `socks5`).
- **`host`** | **`port`** [TEXT|INT]
  - Thông tin kết nối mạng.
- **`username`** | **`password`** [TEXT]
  - Thông tin xác thực proxy.
- **`ip_version`** [INT]
  - Phiên bản IP (`4` hoặc `6`).
- **`proxy_type`** [TEXT]
  - Phân loại sở hữu (`private`, `shared`).
- **`source_type`** [TEXT]
  - Loại node (`datacenter`, `residential`, `mobile`).
- **`rotation_type`** [TEXT]
  - Cơ chế IP (`static`, `rotating`).
- **`pricing_type`** [TEXT]
  - Hình thức thanh toán (`time`, `bandwidth`).
- **`country`** | **`city`** | **`isp`** [TEXT]
  - Thông tin địa lý và nhà mạng.
- **`expired_at`** [DATETIME]
  - Timestamp ngày hết hạn chính xác.
- **`last_checked_at`** [DATETIME]
  - Lần cuối kiểm tra sức khỏe (Healthy Check).
- **`purchase_url`** [TEXT]
  - Đường dẫn gia hạn hoặc mua mới.
- **`status`** [TEXT] `DEFAULT 'active'`
  - Trạng thái quản lý (`active`, `expired`, `disabled`, `error`).
- **`created_at`** | **`updated_at`** [DATETIME]
  - Dấu thời gian hệ thống.

---

### 📜 Bảng `proxy_history`

_Nhật ký sử dụng Proxy để tránh xung đột và cảnh báo bảo mật._

- **`id`** [TEXT] `PRIMARY KEY`
  - Định danh bản ghi.
- **`proxy_id`** [TEXT] `REFERENCES proxies(id)`
  - Proxy được sử dụng.
- **`email_id`** [TEXT] `REFERENCES emails(id)`
  - Tài khoản email thực hiện kết nối.
- **`target_site`** [TEXT]
  - Tên miền/Website mục tiêu (Domain).
- **`used_at`** [DATETIME] `DEFAULT CURRENT_TIMESTAMP`
  - Thời điểm bắt đầu phiên làm việc.

---

### 🛠️ Bảng `services`

_Thư viện các dịch vụ và nền tảng hỗ trợ._

- **`id`** [TEXT] `PRIMARY KEY`
- **`name`** [TEXT] `NOT NULL`
  - Tên hiển thị của dịch vụ.
- **`description`** [TEXT]
  - Mô tả chi tiết.
- **`url`** [TEXT]
  - Link gốc của nền tảng.
- **`category`** | **`tags`** [TEXT]
  - Phân loại và nhãn tìm kiếm (JSON).
- **`metadata`** [TEXT]
  - ObjectData chứa các custom field định nghĩa cấu trúc dữ liệu cho dịch vụ (JSON).
  - Mỗi field gồm: `name` (tên field), `type` (`string`, `array`, `json`, `number`), `feature` (tùy chọn: `encryption`, `totp`, `backup_codes`, `url` — xác định chức năng UI đặc biệt).
- **`auth_method`** [TEXT]
  - Mảng string chứa toàn bộ phương thức xác thực được hỗ trợ (JSON).
  - Ví dụ: `["google_oauth"]`, `["basic_auth"]`, `["github_oauth"]`.

---

### 🔗 Bảng `service_emails`

_Mối liên kết giữa Tài khoản và Dịch vụ cụ thể._

- **`id`** [TEXT] `PRIMARY KEY`
- **`email_id`** [TEXT] `REFERENCES emails(id)`
- **`service_id`** [TEXT] `REFERENCES services(id)`

### 👤 Bảng `fingerprints`

_Lưu trữ cấu hình dấu vân tay trình duyệt._

- **`id`** [TEXT] `PRIMARY KEY`
- **`name`** [TEXT]
  - Tên cấu hình.
- **`description`** [TEXT]
  - Mô tả.
- **`config_json`** [TEXT]
  - Toàn bộ tham số kỹ thuật (UA, WebGL, Canvas, v.v.) dạng JSON.

---

### 🔄 Bảng `workflows`

_Lưu trữ các workflow automation cho các tác vụ tự động._

- **`id`** [TEXT] `PRIMARY KEY`
  - Định danh duy nhất (UUID).
- **`name`** [TEXT] `NOT NULL`
  - Tên workflow.
- **`description`** [TEXT]
  - Mô tả chi tiết workflow.
- **`platform`** [TEXT] `NOT NULL`
  - Nền tảng thực thi (`website`, `mobile`).
- **`status`** [TEXT] `DEFAULT 'draft'`
  - Trạng thái workflow (`active`, `paused`, `draft`, `archived`).
- **`tags`** [TEXT]
  - Danh sách tags (JSON array).
- **`owner_name`** [TEXT]
  - Tên người tạo.
- **`owner_initials`** [TEXT]
  - Chữ cái viết tắt.
- **`nodes`** [TEXT] `NOT NULL`
  - Danh sách nodes trong workflow (JSON array).
- **`connections`** [TEXT] `NOT NULL`
  - Danh sách connections giữa các nodes (JSON array).
- **`success_rate`** [REAL] `DEFAULT 0`
  - Tỷ lệ thành công (0-100).
- **`last_run_status`** [TEXT] `DEFAULT 'none'`
  - Trạng thái lần chạy cuối (`passed`, `failed`, `none`).
- **`last_run_time`** [DATETIME]
  - Thời điểm chạy cuối cùng.
- **`history`** [TEXT]
  - Lịch sử chạy workflow (JSON array).
- **`created_at`** | **`updated_at`** [DATETIME]
  - Dấu thời gian hệ thống.
