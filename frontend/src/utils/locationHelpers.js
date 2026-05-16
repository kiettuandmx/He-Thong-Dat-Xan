export const formatLocationParts = (...parts) =>
  parts
    .flat()
    .map((part) => (part == null ? '' : String(part).trim()))
    .filter((part) => part && part.toLowerCase() !== 'null' && part.toLowerCase() !== 'undefined')
    .join(', ');

export const getReadableDistrict = (location = null) =>
  formatLocationParts(location?.district) || '';
