// Small presentation helpers for title-casing and postal code formatting
export const titleCase = (s) => {
  if (!s && s !== 0) return '';
  try {
    return String(s)
      .toLowerCase()
      .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1));
  } catch (e) {
    return String(s);
  }
};

// Normalize Canadian-style postal codes to 'A1A 1A1' when possible.
export const formatPostalCode = (p) => {
  if (!p && p !== 0) return '';
  const cleaned = String(p).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length === 6) return `${cleaned.slice(0,3)} ${cleaned.slice(3)}`;
  if (/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(String(p).toUpperCase())) {
    const noSpace = String(p).toUpperCase().replace(/\s+/g, '');
    return `${noSpace.slice(0,3)} ${noSpace.slice(3)}`;
  }
  return String(p);
};

export default { titleCase, formatPostalCode };
