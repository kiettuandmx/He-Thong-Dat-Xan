const FIELD_TYPES = Object.freeze({
  FOOTBALL: 'Football',
  BADMINTON: 'Badminton',
  PICKLEBALL: 'Pickleball',
});

const FIELD_TYPE_VALUES = Object.values(FIELD_TYPES);

const TYPE_ALIAS_MAP = new Map([
  ['football', FIELD_TYPES.FOOTBALL],
  ['bóng đá', FIELD_TYPES.FOOTBALL],
  ['bong da', FIELD_TYPES.FOOTBALL],
  ['badminton', FIELD_TYPES.BADMINTON],
  ['cầu lông', FIELD_TYPES.BADMINTON],
  ['cau long', FIELD_TYPES.BADMINTON],
  ['pickleball', FIELD_TYPES.PICKLEBALL],
]);

const TYPE_VARIANTS = {
  [FIELD_TYPES.FOOTBALL]: ['Football', 'football', 'Bóng đá', 'bóng đá', 'Bong da', 'bong da'],
  [FIELD_TYPES.BADMINTON]: ['Badminton', 'badminton', 'Cầu lông', 'cầu lông', 'Cau long', 'cau long'],
  [FIELD_TYPES.PICKLEBALL]: ['Pickleball', 'pickleball'],
};

const normalizeFieldType = (value) => {
  if (!value) return '';

  const rawValue = String(value).trim();
  return TYPE_ALIAS_MAP.get(rawValue.toLowerCase()) || rawValue;
};

const isValidFieldType = (value) =>
  FIELD_TYPE_VALUES.includes(normalizeFieldType(value));

const getFieldTypeVariants = (value) => {
  const normalizedType = normalizeFieldType(value);
  return TYPE_VARIANTS[normalizedType] || [];
};

module.exports = {
  FIELD_TYPES,
  FIELD_TYPE_VALUES,
  getFieldTypeVariants,
  isValidFieldType,
  normalizeFieldType,
};
