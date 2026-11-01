import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

if (typeof window !== 'undefined') {
  window.Pusher = Pusher;
}

const isHttps =
  import.meta.env.VITE_REVERB_SCHEME === 'https' ||
  (typeof window !== 'undefined' && window.location.protocol === 'https:');
const host = import.meta.env.VITE_REVERB_HOST || (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
const port = parseInt(import.meta.env.VITE_REVERB_PORT || (isHttps ? '443' : '8080'), 10);
const scheme = isHttps ? 'https' : (import.meta.env.VITE_REVERB_SCHEME || 'http');
const key = import.meta.env.VITE_REVERB_APP_KEY || 'sahabat-sos-app-key';
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const echo = new Echo({
  broadcaster: 'reverb',
  key: key,
  wsHost: host,
  wsPort: port,
  wssPort: port,
  forceTLS: isHttps,
  enabledTransports: isHttps ? ['wss', 'ws'] : ['ws', 'wss'],
  authEndpoint: `${apiUrl.replace(/\/+$/, '')}/broadcasting/auth`,
  auth: {
    headers: {
      get Authorization() {
        const token =
          localStorage.getItem('admin_access_token') ||
          localStorage.getItem('auth_token') ||
          localStorage.getItem('token') ||
          sessionStorage.getItem('token');
        return token ? `Bearer ${token}` : '';
      },
      Accept: 'application/json',
    },
  },
});

export default echo;
