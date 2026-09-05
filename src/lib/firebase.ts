// Firebase app + Google Analytics (GA4) — events show up in the Firebase Analytics dashboard.
// The SDK is loaded lazily (dynamic import) and warmed up only once the browser is idle,
// so it never competes with the initial radio-browsing bandwidth/parse budget.
import type { Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let analytics: Analytics | null = null;
let initPromise: Promise<Analytics | null> | null = null;

function initAnalytics(): Promise<Analytics | null> {
  if (!firebaseConfig.apiKey || !firebaseConfig.measurementId) return Promise.resolve(null);
  if (!initPromise) {
    initPromise = Promise.all([
      import('firebase/app'),
      import('firebase/analytics'),
    ]).then(async ([{ initializeApp }, { getAnalytics, isSupported }]) => {
      const supported = await isSupported();
      if (!supported) return null;
      const app = initializeApp(firebaseConfig);
      analytics = getAnalytics(app);
      return analytics;
    });
  }
  return initPromise;
}

export function logAnalyticsEvent(name: string, params?: Record<string, unknown>) {
  initAnalytics().then(async (a) => {
    if (a) {
      const { logEvent } = await import('firebase/analytics');
      logEvent(a, name, params);
    }
  });
}

function runWhenIdle(fn: () => void) {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(fn, { timeout: 4000 });
  } else {
    setTimeout(fn, 2000);
  }
}

// Warm up Analytics once the browser is idle, well after first paint/interactivity.
runWhenIdle(() => { initAnalytics(); });
