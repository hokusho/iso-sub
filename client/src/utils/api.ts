/**
 * Utilitário central de rotas de API para Web e Desktop (Tauri / Electron)
 */

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return 'http://127.0.0.1:4000';

  // Quando rodando dentro do Tauri / Desktop ou executável compilado
  const isDesktop = 
    window.location.protocol === 'tauri:' ||
    window.location.protocol === 'asset:' ||
    window.location.protocol === 'file:' ||
    window.location.hostname === 'tauri.localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'localhost' && window.location.port !== '5173' ||
    Boolean((window as any).__TAURI_INTERNALS__);

  return isDesktop ? 'http://127.0.0.1:4000' : '';
}

export function apiEndpoint(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const base = getApiBaseUrl();
  const clean = url.startsWith('/') ? url : `/${url}`;
  return `${base}${clean}`;
}
