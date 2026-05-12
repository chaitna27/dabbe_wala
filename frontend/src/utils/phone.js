/** Normalize phone / WhatsApp numbers for India-focused links (avoids double +91). */
export function dialDigitsForLink(raw) {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.length >= 12 && d.startsWith("91")) return d;
  if (d.length === 10) return `91${d}`;
  if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
  return d;
}
