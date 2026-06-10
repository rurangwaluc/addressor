export function normalizeRwandaPhone(phone: string) {
  const digits = phone.replace(/[^0-9]/g, "");

  if (digits.startsWith("250") && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `250${digits.slice(1)}`;
  }

  if (digits.startsWith("7") && digits.length === 9) {
    return `250${digits}`;
  }

  return digits;
}