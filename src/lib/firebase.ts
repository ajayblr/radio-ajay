// Firebase app + Google Analytics (GA4) — events show up in the Firebase Analytics dashboard.
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, logEvent as fbLogEvent, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let initPromise: Promise<Analytics | null> | null = null;

function initAnalytics(): Promise<Analytics | null> {
  if (!firebaseConfig.apiKey || !firebaseConfig.measurementId) return Promise.resolve(null);
  if (!initPromise) {
    initPromise = isSupported().then((supported) => {
      if (!supported) return null;
      app = initializeApp(firebaseConfig);
      analytics = getAnalytics(app);
      return analytics;
    });
  }
  return initPromise;
}

export function logAnalyticsEvent(name: string, params?: Record<string, unknown>) {
  initAnalytics().then((a) => {
    if (a) fbLogEvent(a, name, params);
  });
}

// Kick off initialization as soon as the module loads.
initAnalytics();
