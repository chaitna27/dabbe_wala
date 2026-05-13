export const STUDENT_GEO_KEY = "dabbeStudentGeo";

export function readStudentGeo() {
  try {
    const raw = sessionStorage.getItem(STUDENT_GEO_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!Number.isFinite(o.lat) || !Number.isFinite(o.lng)) return null;
    return { lat: o.lat, lng: o.lng };
  } catch {
    return null;
  }
}

export function writeStudentGeo(lat, lng) {
  sessionStorage.setItem(
    STUDENT_GEO_KEY,
    JSON.stringify({ lat, lng, savedAt: Date.now() }),
  );
}
