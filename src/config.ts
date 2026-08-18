export const isNativeApp = 
  !!(window as any).Capacitor?.isNative || 
  window.location.protocol === 'file:' || 
  window.location.protocol.startsWith('capacitor') || 
  window.location.protocol.startsWith('ionic') || 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1';

const CLOUD_URL = 'ais-pre-fo3owuqjpczzsi5hj5eyh3-348785349910.asia-southeast1.run.app';

export const BACKEND_URL = isNativeApp 
  ? `https://${CLOUD_URL}`
  : '';

export const BACKEND_WS_URL = isNativeApp
  ? `wss://${CLOUD_URL}`
  : (window.location.protocol === 'https:' ? `wss://${window.location.host}` : `ws://${window.location.host}`);

export const getApiUrl = (path: string) => {
  return `${BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
