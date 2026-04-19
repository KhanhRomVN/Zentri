# Thiết kế Hệ thống Lưu trữ Zentri (Cục bộ) - Focus Account Only

Tài liệu này mô tả cấu trúc lưu trữ dữ liệu tập trung cho Zentri Account Manager, chuyển từ lưu trữ phân tán sang một tệp JSON duy nhất cho Metadata và các thư mục Profile được đặt tên theo định danh người dùng.

## 1. Cấu trúc thư mục (Folder Structure)

Khi người dùng chọn một thư mục lưu trữ (ví dụ: `D:/ZentriData/`), cấu trúc bên trong sẽ như sau:

```text
[SELECTED FOLDER]/
├── zentri.db
└── profiles/
    └── [profile_folder_id]/
```

## 2. Đặc tả Cơ sở dữ liệu (Database)

Thay vì sử dụng tệp JSON duy nhất, Zentri sử dụng SQLite để đảm bảo hiệu năng và tính toàn vẹn dữ liệu khi quy mô lên đến hàng chục nghìn tài khoản.

Chi tiết cấu trúc các bảng tham chiếu tại: [DB_SCHEMA.md](file:///home/khanhromvn/Documents/Coding/Zentri%20-%20Account%20Manager/DB_SCHEMA.md)

## 3. Nguyên tắc quản lý Profile

- **Định danh Folder:** Không sử dụng ID ngẫu nhiên. Sử dụng `[website]/[email]` để dễ dàng backup hoặc can thiệp thủ công khi cần.
- **Tự động đổi tên:** Khi người dùng đổi Email/Username trong ứng dụng, hệ thống sẽ thực hiện `rename` folder tương ứng trên ổ đĩa để đảm bảo tính đồng bộ.
- **Tiết kiệm dung lượng:** Renderer sẽ chịu trách nhiệm dọn dẹp cache hoặc các file không cần thiết sau mỗi phiên làm việc nếu được cấu hình.

## 4. Kế hoạch Migration (Dành cho bản cập nhật tới)

2. **Di chuyển Profile:** Convert các folder cũ (đang dùng ID) sang cấu trúc `profiles/[website]/[email]`.
