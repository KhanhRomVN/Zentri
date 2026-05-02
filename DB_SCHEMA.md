# 💎 Zentri Database Schema

Tài liệu cấu trúc dữ liệu hệ thống Zentri. Thiết kế tối ưu cho hiệu năng và khả năng mở rộng.

---

### 📧 Bảng `emails`
*Lưu trữ thông tin định danh và bảo mật cốt lõi của tài khoản Email.*

- **`id`** [TEXT] `PRIMARY KEY`
  - Định danh duy nhất (UUID).
- **`email`** [TEXT] `NOT NULL`
  - Địa chỉ email chính.
- **`password`** [TEXT]
  - Mật khẩu truy cập.
- **`status`** [TEXT] `DEFAULT 'active'`
  - Trạng thái vận hành (`active`, `banned`).
- **`phone_number`** [TEXT]
  - Số điện thoại liên kết (Tùy chọn).
- **`recovery_email`** [TEXT]
  - Email khôi phục dự phòng.
- **`totp_secret_key`** [TEXT]
  - Mã bí mật 2FA/TOTP phục vụ tự động hóa.
- **`backup_codes`** [TEXT]
  - Danh sách mã dự phòng.
- **`profile_folder_id`** [TEXT]
  - ID định danh thư mục profile browser.
- **`scheduled_deletion_at`** [DATETIME]
  - Thời gian dự kiến xóa vĩnh viễn (Soft Delete).
- **`last_used_at`** [DATETIME]
  - Ghi nhận lần cuối khởi chạy.
- **`created_at`** | **`updated_at`** [DATETIME]
  - Dấu thời gian hệ thống.

---

### 🌐 Bảng `proxies`
*Hệ thống quản lý hạ tầng mạng và định danh IP.*

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
*Nhật ký sử dụng Proxy để tránh xung đột và cảnh báo bảo mật.*

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
*Thư viện các dịch vụ và nền tảng hỗ trợ.*

- **`id`** [TEXT] `PRIMARY KEY`
- **`name`** [TEXT] `NOT NULL`
  - Tên hiển thị của dịch vụ.
- **`url`** [TEXT]
  - Link gốc của nền tảng.
- **`category`** | **`tags`** [TEXT]
  - Phân loại và nhãn tìm kiếm (JSON).
- **`description`** [TEXT]
  - Mô tả chi tiết.

---

### 🔗 Bảng `service_emails`
*Mối liên kết giữa Tài khoản và Dịch vụ cụ thể.*

- **`id`** [TEXT] `PRIMARY KEY`
- **`email_id`** [TEXT] `REFERENCES emails(id)`
- **`service_id`** [TEXT] `REFERENCES services(id)`
- **`username`** | **`password`** [TEXT]
  - Thông tin đăng nhập riêng biệt cho dịch vụ này.
- **`notes`** [TEXT]
  - Ghi chú riêng cho tài khoản tại dịch vụ này.
- **`metadata`** [TEXT]
  - Dữ liệu cấu hình bổ sung (JSON).

---

### 🔑 Bảng `service_emails_secrets`
*Kho lưu trữ bí mật (Secret Vault) cho từng dịch vụ.*

- **`id`** [TEXT] `PRIMARY KEY`
- **`service_email_id`** [TEXT] `REFERENCES service_emails(id)`
- **`secret_name`** [TEXT] `NOT NULL`
  - Tên loại bí mật (ví dụ: `App Password`, `Recovery Code`).
- **`secret_value`** [TEXT]
  - Nội dung bí mật.
- **`secret_type`** [TEXT] `DEFAULT 'password'`
  - Định dạng (`password`, `totp`, `text`).

---

### 👤 Bảng `fingerprints`
*Lưu trữ cấu hình dấu vân tay trình duyệt.*

- **`id`** [TEXT] `PRIMARY KEY`
- **`name`** [TEXT]
  - Tên cấu hình.
- **`description`** [TEXT]
  - Mô tả.
- **`config_json`** [TEXT]
  - Toàn bộ tham số kỹ thuật (UA, WebGL, Canvas, v.v.) dạng JSON.

---

### 🚀 Bảng `sessions` & `agents`
*Hệ thống nhật ký và cấu hình tự động hóa (Hiện đang tạm ẩn).*

- **Sessions**: Lưu trữ lịch sử `started_at`, `ended_at`, `user_agent`, `proxy_id`.
- **Agents**: Lưu trữ `name` và `config_json` cho các kịch bản bot.
