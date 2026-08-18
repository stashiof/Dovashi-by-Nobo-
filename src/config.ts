export const isNativeApp = 
  !!(window as any).Capacitor?.isNative || 
  window.location.protocol === 'file:' || 
  window.location.protocol.startsWith('capacitor') || 
  window.location.protocol.startsWith('ionic') || 
  (window.location.hostname === 'localhost' && window.location.port !== '3000') ||
  window.location.hostname === '';

export const CLOUD_URL = 'ais-pre-fo3owuqjpczzsi5hj5eyh3-348785349910.asia-southeast1.run.app';

export const BACKEND_URL = isNativeApp 
  ? `https://${CLOUD_URL}`
  : '';

export const getWebSocketUrl = (path: string = '/live') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (isNativeApp) {
    return `wss://${CLOUD_URL}${cleanPath}`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host || CLOUD_URL;
  return `${protocol}//${host}${cleanPath}`;
};

export const BACKEND_WS_URL = getWebSocketUrl('/live');

export const getApiUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (isNativeApp) {
    return `https://${CLOUD_URL}${cleanPath}`;
  }
  return cleanPath;
};
