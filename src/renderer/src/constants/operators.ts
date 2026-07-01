export type Operator = 
  | 'equals' 
  | 'not_equal' 
  | 'greater' 
  | 'less' 
  | 'contains' 
  | 'starts_with' 
  | 'ends_with';

export interface OperatorOption {
  value: Operator;
  label: string;
}

export const OPERATORS: OperatorOption[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equal', label: 'Not equal' },
  { value: 'greater', label: 'Greater than' },
  { value: 'less', label: 'Less than' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
];

export const OPERATOR_DESCRIPTIONS: Record<Operator, string> = {
  equals: 'So sánh giá trị bằng với giá trị tìm kiếm. Ví dụ: column = "value"',
  not_equal: 'So sánh giá trị khác với giá trị tìm kiếm. Ví dụ: column != "value"',
  greater: 'Lọc các bản ghi có giá trị lớn hơn giá trị tìm kiếm. Ví dụ: column > 100',
  less: 'Lọc các bản ghi có giá trị nhỏ hơn giá trị tìm kiếm. Ví dụ: column < 100',
  contains: 'Tìm các bản ghi chứa chuỗi tìm kiếm trong giá trị cột. Ví dụ: column LIKE "%value%"',
  starts_with: 'Tìm các bản ghi bắt đầu bằng chuỗi tìm kiếm. Ví dụ: column LIKE "value%"',
  ends_with: 'Tìm các bản ghi kết thúc bằng chuỗi tìm kiếm. Ví dụ: column LIKE "%value"',
};

export interface FilterCondition {
  id: string;
  column: string;
  operator: Operator;
  value: string;
}