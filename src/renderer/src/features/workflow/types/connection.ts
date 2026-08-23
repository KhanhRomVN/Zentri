/**
 * Node connection type
 */
export interface NodeConnection {
  id: string;
  from: string;
  fromSide: 'out' | 'success' | 'error'; // out: sequential, success: conditional success, error: conditional error
  to: string;
  toSide: 'in';
  label?: string;
  color?: string;
  route?: 'loop';
  isError?: boolean; // true nếu 1 dot kết nối tới 2 node (invalid state)
}
