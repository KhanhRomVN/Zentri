# DFD Auto-Layout

## Tổng quan

Tính năng **Auto-Layout** tự động sắp xếp các node trong sơ đồ DFD (Data Flow Diagram) mà không cần định nghĩa tọa độ thủ công trong file JSON.

## Cách hoạt động

### Thuật toán: ELK (Eclipse Layout Kernel)

- **Process nodes** (tiến trình): Được sắp xếp ở **giữa** sơ đồ
- **Entity nodes** (thực thể bên ngoài): Được sắp xếp ở **bên trái** (các nguồn dữ liệu)
- **Store nodes** (kho dữ liệu): Được sắp xếp ở **bên phải** hoặc xung quanh (các đích dữ liệu)

### Cấu hình thuật toán

```typescript
{
  'elk.algorithm': 'layered',           // Sắp xếp theo lớp
  'elk.direction': 'RIGHT',             // Hướng luồng từ trái sang phải
  'elk.spacing.nodeNode': '80',         // Khoảng cách giữa các node
  'elk.layered.spacing.nodeNodeBetweenLayers': '120', // Khoảng cách giữa các lớp
  'elk.spacing.edgeNode': '40',         // Khoảng cách edge-node
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
}
```

## Cách sử dụng

### 1. Tạo file JSON không có tọa độ

Chỉ cần định nghĩa `w`, `h` (cho entity/store) hoặc `r` (cho process), **không cần** `x`, `y`, `cx`, `cy`:

```json
{
  "meta": {
    "modelName": "Hệ thống Thanh toán",
    "rootLevel": "root"
  },
  "levels": {
    "root": {
      "nodes": [
        {
          "id": "ncc",
          "type": "entity",
          "label": "Nhà cung cấp",
          "w": 130,
          "h": 66
        },
        {
          "id": "p1",
          "type": "process",
          "code": "1.0",
          "label": "Xử lý thanh toán",
          "r": 85
        },
        {
          "id": "d1",
          "type": "store",
          "code": "D1",
          "label": "Hóa đơn",
          "w": 160,
          "h": 52
        }
      ],
      "flows": [
        { "id": "f1", "from": "ncc", "to": "p1", "label": "Hóa đơn" },
        { "id": "f2", "from": "p1", "to": "d1", "label": "Lưu trữ" }
      ]
    }
  }
}
```

### 2. Auto-layout tự động kích hoạt

Khi file JSON **không có** tọa độ (`x`, `y`, `cx`, `cy` undefined), hệ thống sẽ:

1. Phát hiện cần auto-layout
2. Hiển thị loading indicator: "Đang tự động sắp xếp sơ đồ..."
3. Chạy thuật toán ELK
4. Render sơ đồ với tọa độ đã được tính toán

### 3. Giữ lại tọa độ thủ công (tùy chọn)

Nếu muốn giữ layout thủ công, chỉ cần định nghĩa đầy đủ tọa độ:

```json
{
  "id": "p1",
  "type": "process",
  "cx": 400,
  "cy": 300,
  "r": 85
}
```

Hệ thống sẽ **bỏ qua** auto-layout và dùng tọa độ trong JSON.

## Quy tắc sắp xếp chi tiết

### Partition Strategy

Auto-layout chia các node thành 3 **partitions** (lớp):

| Partition | Node Type    | Vị trí   | Điều kiện                 |
| --------- | ------------ | -------- | ------------------------- |
| 0         | Entity/Store | Bên trái | Là nguồn dữ liệu (source) |
| 1         | Process      | Giữa     | Luôn ở giữa               |
| 2         | Entity/Store | Bên phải | Là đích dữ liệu (target)  |

### Thuật toán phân lớp

```typescript
function getNodePartition(node: DfdNode, flows: DfdFlow[]): number {
  if (node.type === 'process') return 1; // Luôn ở giữa

  const isSource = flows.some((f) => f.from === node.id);
  const isTarget = flows.some((f) => f.to === node.id);

  if (node.type === 'entity') {
    // Entity thường ở bên trái (sources)
    return isSource && !isTarget ? 0 : 2;
  }

  // Store thường ở bên phải (targets)
  return isTarget && !isSource ? 2 : 0;
}
```

## Ví dụ thực tế

### Before (JSON với tọa độ thủ công)

```json
{
  "id": "p1-1",
  "type": "process",
  "cx": 380,
  "cy": 180,
  "r": 85
}
```

### After (JSON không có tọa độ)

```json
{
  "id": "p1-1",
  "type": "process",
  "r": 85
}
```

Tọa độ `cx`, `cy` sẽ được tính tự động bởi thuật toán ELK.

## Canvas Size

Canvas size cũng được tính tự động dựa trên kết quả layout:

```typescript
const padding = 100;
const canvasWidth = layoutedGraph.width + padding * 2;
const canvasHeight = layoutedGraph.height + padding * 2;
```

## Fallback mechanism

Nếu ELK layout thất bại (lỗi thuật toán), hệ thống sẽ:

1. Log error ra console
2. Fallback về tọa độ gốc trong JSON
3. Hiển thị sơ đồ với layout mặc định

## Performance

- Auto-layout chạy **bất đồng bộ** (async/await)
- Có loading state để tránh UI bị đóng băng
- Cache kết quả trong `layoutedLevel` state
- Chỉ re-calculate khi level thay đổi

## Tích hợp vào workflow

### Tạo file JSON mới

```bash
# Tạo file JSON mới với cấu trúc tối giản
touch src/renderer/src/features/dfd/constants/my-new-diagram.json
```

**Nội dung file:**

```json
{
  "meta": {
    "modelName": "My DFD",
    "rootLevel": "root"
  },
  "levels": {
    "root": {
      "code": "0",
      "title": "Mức 0",
      "canvas": { "w": 860, "h": 520 },
      "nodes": [
        { "id": "e1", "type": "entity", "label": "User", "w": 130, "h": 66 },
        { "id": "p1", "type": "process", "code": "1.0", "label": "Process", "r": 85 },
        { "id": "d1", "type": "store", "code": "D1", "label": "Database", "w": 160, "h": 52 }
      ],
      "flows": [
        { "id": "f1", "from": "e1", "to": "p1", "label": "Input" },
        { "id": "f2", "from": "p1", "to": "d1", "label": "Save" }
      ]
    }
  }
}
```

### Import vào useDfdData hook

```typescript
// src/renderer/src/features/dfd/hooks/useDfdData.ts
import myNewDiagram from '../constants/my-new-diagram.json';

export function useDfdModels(): DfdModel[] {
  return [
    xnBanhKeoAnGiang,
    thanhToanHoaDon,
    myNewDiagram, // <-- Thêm vào đây
  ] as DfdModel[];
}
```

Diagram sẽ tự động được render với auto-layout!

## Troubleshooting

### Layout không như mong muốn

- Kiểm tra lại cấu trúc flows (from/to)
- Điều chỉnh `w`, `h`, `r` của các node
- Thử đổi `elk.direction` từ 'RIGHT' sang 'DOWN'

### Loading spinner không biến mất

- Check console log xem có lỗi ELK không
- Kiểm tra tất cả node đều có `id` duy nhất
- Verify flows có `from`/`to` trỏ đến node tồn tại

### Node bị chồng lên nhau

- Tăng `elk.spacing.nodeNode` trong autoLayout.ts
- Tăng padding trong canvas size calculation
- Kiểm tra node dimensions (`w`, `h`, `r`)

## API Reference

### `autoLayoutDfd(level: DfdLevel): Promise<LayoutResult>`

Chạy thuật toán auto-layout cho một level.

**Returns:**

```typescript
{
  nodes: DfdNode[];        // Nodes với tọa độ đã được tính
  canvasWidth: number;     // Chiều rộng canvas được đề xuất
  canvasHeight: number;    // Chiều cao canvas được đề xuất
}
```

### `needsAutoLayout(level: DfdLevel): boolean`

Kiểm tra xem level có cần auto-layout hay không.

**Returns:** `true` nếu có bất kỳ node nào thiếu tọa độ.

## Tham khảo

- [ELK Documentation](https://eclipse.dev/elk/)
- [ELK Algorithm Options](https://eclipse.dev/elk/reference/algorithms.html)
- [React Flow Documentation](https://reactflow.dev/)
