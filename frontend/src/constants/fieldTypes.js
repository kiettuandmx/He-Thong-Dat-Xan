export const FIELD_TYPES = Object.freeze({
  FOOTBALL: 'Football',
  BADMINTON: 'Badminton',
  PICKLEBALL: 'Pickleball',
});

export const FIELD_TYPE_OPTIONS = [
  { value: FIELD_TYPES.FOOTBALL, label: 'Bóng đá' },
  { value: FIELD_TYPES.BADMINTON, label: 'Cầu lông' },
  { value: FIELD_TYPES.PICKLEBALL, label: 'Pickleball' },
];

const TYPE_ALIAS_MAP = new Map([
  ['football', FIELD_TYPES.FOOTBALL],
  ['bóng đá', FIELD_TYPES.FOOTBALL],
  ['bong da', FIELD_TYPES.FOOTBALL],
  ['badminton', FIELD_TYPES.BADMINTON],
  ['cầu lông', FIELD_TYPES.BADMINTON],
  ['cau long', FIELD_TYPES.BADMINTON],
  ['pickleball', FIELD_TYPES.PICKLEBALL],
]);

export const normalizeFieldType = (value) => {
  if (!value) return '';

  const rawValue = String(value).trim();
  return TYPE_ALIAS_MAP.get(rawValue.toLowerCase()) || rawValue;
};

export const isFieldType = (value, expectedType) =>
  normalizeFieldType(value) === expectedType;

export const getFieldTypeLabel = (value) => {
  const normalizedType = normalizeFieldType(value);
  const matchedOption = FIELD_TYPE_OPTIONS.find(
    (option) => option.value === normalizedType
  );

  return matchedOption?.label || value || 'Khác';
};

export const getFieldTypeBadgeConfig = (value) => {
  const normalizedType = normalizeFieldType(value);

  if (normalizedType === FIELD_TYPES.FOOTBALL) {
    return {
      label: getFieldTypeLabel(normalizedType),
      color: 'badge-football',
      icon: 'bi-patch-check-fill',
    };
  }

  if (normalizedType === FIELD_TYPES.BADMINTON) {
    return {
      label: getFieldTypeLabel(normalizedType),
      color: 'badge-badminton',
      icon: 'bi-lightning-fill',
    };
  }

  if (normalizedType === FIELD_TYPES.PICKLEBALL) {
    return {
      label: getFieldTypeLabel(normalizedType),
      color: 'badge-pickleball',
      icon: 'bi-star-fill',
    };
  }

  return {
    label: getFieldTypeLabel(value),
    color: 'badge-default',
    icon: 'bi-dribbble',
  };
};
