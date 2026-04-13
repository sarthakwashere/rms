const TOKEN_KEY = 'rms_token';
const USER_KEY = 'rms_user';
export function setSession(session) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(session));
}
export function getSession() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
export function getUser() {
  const session = getSession();
  if (!session) return null;
  return {
    display_name: session.name || session.email,
    role: session.role,
    email: session.email
  };
}
export function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(TOKEN_KEY) || '';
}
export function isAuthenticated() {
  return Boolean(getToken());
}
export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
