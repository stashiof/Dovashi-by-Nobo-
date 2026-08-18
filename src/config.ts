export const isNativeApp = !!(window as any).Capacitor?.isNative;

export const BACKEND_URL = isNativeApp 
  ? ((import.meta as any).env?.VITE_BACKEND_HOST 
      ? `https://${(import.meta as any).env.VITE_BACKEND_HOST}` 
      : 'https://ais-pre-fo3owuqjpczzsi5hj5eyh3-348785349910.asia-southeast1.run.app')
  : '';

export const BACKEND_WS_URL = isNativeApp
  ? ((import.meta as any).env?.VITE_BACKEND_HOST 
      ? `wss://${(import.meta as any).env.VITE_BACKEND_HOST}` 
      : 'wss://ais-pre-fo3owuqjpczzsi5hj5eyh3-348785349910.asia-southeast1.run.app')
  : (window.location.protocol === 'https:' ? `wss://${window.location.host}` : `ws://${window.location.host}`);

export const getApiUrl = (path: string) => {
  return `${BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
