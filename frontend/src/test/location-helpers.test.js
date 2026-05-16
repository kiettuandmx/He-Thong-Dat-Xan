import { describe, expect, it } from 'vitest';
import { formatLocationParts } from '../utils/locationHelpers';

describe('formatLocationParts', () => {
  it('bỏ qua giá trị null và giữ lại các phần địa chỉ hợp lệ', () => {
    expect(formatLocationParts('23 Thành Thái', null, 'TP. Hồ Chí Minh')).toBe(
      '23 Thành Thái, TP. Hồ Chí Minh'
    );
  });

  it('giữ đủ địa chỉ khi có quận', () => {
    expect(formatLocationParts('Số 1 Lý Thường Kiệt', 'Quận 10')).toBe(
      'Số 1 Lý Thường Kiệt, Quận 10'
    );
  });
});
