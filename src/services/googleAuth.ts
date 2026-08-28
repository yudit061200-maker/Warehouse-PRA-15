import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account',
});

// In-flight promise locking to prevent concurrent popups / INTERNAL ASSERTION FAILED
let inFlightSignInPromise: Promise<{ user: User; accessToken: string } | null> | null = null;
// Cache the access token in memory
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!inFlightSignInPromise) {
        if (onAuthSuccess) {
          onAuthSuccess(user, cachedAccessToken || '');
        }
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export class AuthCancellationError extends Error {
  isCancelled = true;
  constructor(message: string) {
    super(message);
    this.name = 'AuthCancellationError';
  }
}

export function isUserCancelledAuth(error: any): boolean {
  if (!error) return false;
  if (error instanceof AuthCancellationError || error.isCancelled) return true;
  const code = error?.code || '';
  const msg = String(error?.message || '').toLowerCase();
  return (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    code === 'auth/user-cancelled' ||
    msg.includes('popup-closed-by-user') ||
    msg.includes('cancelled-popup-request')
  );
}

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  // If a popup sign in is already in progress, reuse the existing promise to prevent INTERNAL ASSERTION FAILED
  if (inFlightSignInPromise) {
    return inFlightSignInPromise;
  }

  inFlightSignInPromise = (async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Gagal mendapatkan token akses dari Google.');
      }

      cachedAccessToken = credential.accessToken;
      return { user: result.user, accessToken: cachedAccessToken };
    } catch (error: any) {
      const errorCode = error?.code || '';
      const errorMessage = String(error?.message || '');

      if (
        errorCode === 'auth/popup-closed-by-user' ||
        errorMessage.includes('popup-closed-by-user')
      ) {
        throw new AuthCancellationError(
          'Jendela login ditutup sebelum proses selesai. Silakan hubungkan kembali jika diperlukan.'
        );
      }

      if (
        errorCode === 'auth/cancelled-popup-request' ||
        errorMessage.includes('cancelled-popup-request')
      ) {
        throw new AuthCancellationError(
          'Permintaan login sebelumnya dibatalkan karena ada permintaan baru.'
        );
      }

      if (errorCode === 'auth/popup-blocked' || errorMessage.includes('popup-blocked')) {
        throw new Error(
          'Jendela login diblokir oleh browser. Harap izinkan pop-up untuk situs ini lalu coba lagi.'
        );
      }

      if (
        errorMessage.includes('INTERNAL ASSERTION FAILED') ||
        errorMessage.includes('Pending promise was never set')
      ) {
        throw new AuthCancellationError(
          'Sesi login sebelumnya terputus. Silakan klik tombol untuk mencoba lagi.'
        );
      }

      if (errorCode === 'auth/network-request-failed') {
        throw new Error(
          'Koneksi internet bermasalah. Pastikan perangkat Anda terhubung ke internet.'
        );
      }

      console.warn('Google Auth info:', error);
      throw error;
    } finally {
      inFlightSignInPromise = null;
    }
  })();

  return inFlightSignInPromise;
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logoutGoogle = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Error during sign out:', e);
  } finally {
    cachedAccessToken = null;
  }
};

