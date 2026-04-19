# Database Schema Zentri

### Bảng `emails`

Lưu trữ thông tin chính của thực thể Email.

| Column                  | Type     | Constraints               | Description                                                                    |
| :---------------------- | :------- | :------------------------ | :----------------------------------------------------------------------------- | --- |
| `id`                    | TEXT     | PRIMARY KEY               | Định danh duy nhất (UUID)                                                      |
| `email`                 | TEXT     | NOT NULL                  | Địa chỉ email                                                                  |
| `password`              | TEXT     |                           | Mật khẩu của email                                                             |
| `status`                | TEXT     | DEFAULT 'active'          | Trạng thái (active, banned)                                                    |
| `phone_number`          | TEXT     |                           | Số điện thoại liên kết (Tùy chọn)                                              |
| `recovery_email`        | TEXT     |                           | Email khôi phục (Tùy chọn)                                                     |
| `totp_secret_key`       | TEXT     |                           | Mã bí mật 2FA/TOTP (Tùy chọn)                                                  |
| `backup_codes`          | TEXT     |                           | Mã dự phòng (Tùy chọn)                                                         |     |
| `scheduled_deletion_at` | DATETIME |                           | Ngày dự kiến xóa vĩnh viễn (cho Soft Delete)                                   |     |
| `profile_folder_id`     | TEXT     |                           | ID của thư mục profile Chrome tương ứng                                        |
| `last_used_at`          | DATETIME |                           | Lần cuối sử dụng email này với tool                                            |
| `created_at`            | DATETIME | DEFAULT CURRENT_TIMESTAMP | Ngày thêm vào tool                                                             |
| `updated_at`            | DATETIME | DEFAULT CURRENT_TIMESTAMP | Ngày cập nhật gần nhất (bao gồm cả các thay đổi ở các bảng liên kết liên quan) |

### Bảng `services`

Lưu trữ thông tin các dịch vụ thường dùng.

| Column        | Type     | Constraints               | Description                |
| :------------ | :------- | :------------------------ | :------------------------- |
| `id`          | TEXT     | PRIMARY KEY               | Định danh duy nhất         |
| `name`        | TEXT     | NOT NULL                  | Tên dịch vụ                |
| `url`         | TEXT     |                           | URL của dịch vụ (Tùy chọn) |
| `tags`        | TEXT     |                           | Nhãn phân loại (Tùy chọn)  |
| `category`    | TEXT     |                           | Hạng mục (Tùy chọn)        |
| `description` | TEXT     |                           | Mô tả dịch vụ              |
| `created_at`  | DATETIME | DEFAULT CURRENT_TIMESTAMP | Ngày tạo                   |
| `updated_at`  | DATETIME | DEFAULT CURRENT_TIMESTAMP | Ngày cập nhật gần nhất     |

### Bảng `service_emails`

Liên kết giữa Email và Dịch vụ.

| Column       | Type     | Constraints               | Description                         |
| :----------- | :------- | :------------------------ | :---------------------------------- |
| `id`         | TEXT     | PRIMARY KEY               | Định danh duy nhất                  |
| `email_id`   | TEXT     | REFERENCES emails(id)     | Liên kết với bảng emails            |
| `service_id` | TEXT     | REFERENCES services(id)   | Liên kết với bảng services          |
| `password`   | TEXT     |                           | Mật khẩu dùng riêng cho dịch vụ này |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Ngày tạo                            |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Ngày cập nhật gần nhất              |

### Bảng `service_secrets`

Lưu trữ các thông tin bí mật bổ sung cho mỗi dịch vụ của email.

| Column             | Type     | Constraints                   | Description            |
| :----------------- | :------- | :---------------------------- | :--------------------- |
| `id`               | TEXT     | PRIMARY KEY                   | Định danh duy nhất     |
| `service_email_id` | TEXT     | REFERENCES service_emails(id) | Liên kết với dịch vụ   |
| `secret_name`      | TEXT     | NOT NULL                      | Tên của thông tin mật  |
| `secret_value`     | TEXT     |                               | Giá trị bí mật         |
| `created_at`       | DATETIME | DEFAULT CURRENT_TIMESTAMP     | Ngày tạo               |
| `updated_at`       | DATETIME | DEFAULT CURRENT_TIMESTAMP     | Ngày cập nhật gần nhất |

---

### Bảng `sessions` (Tạm thời vô hiệu hóa ở UI)

Lưu trữ lịch sử các phiên làm việc.

| Column       | Type     | Constraints           | Description                        |
| :----------- | :------- | :-------------------- | :--------------------------------- |
| `id`         | TEXT     | PRIMARY KEY           |                                    |
| `account_id` | TEXT     | REFERENCES emails(id) | Liên kết với email                 |
| `user_agent` | TEXT     |                       | User Agent được sử dụng            |
| `proxy_id`   | TEXT     |                       | ID của Proxy được sử dụng          |
| `started_at` | DATETIME |                       | Thời gian bắt đầu                  |
| `ended_at`   | DATETIME |                       | Thời gian kết thúc                 |
| `status`     | TEXT     |                       | Trạng thái phiên (success, failed) |

### Bảng `agents` (Tạm thời vô hiệu hóa ở UI)

Lưu trữ cấu hình các script hoặc bot.

| Column        | Type | Constraints | Description                 |
| :------------ | :--- | :---------- | :-------------------------- |
| `id`          | TEXT | PRIMARY KEY |                             |
| `name`        | TEXT |             | Tên Agent                   |
| `config_json` | TEXT |             | Lưu config dạng JSON string |
