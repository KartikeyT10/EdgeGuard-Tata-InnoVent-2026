import { initializeApp } from 'firebase/app';
import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export type AuthUser = {
  displayName: string;
  email: string;
  provider: 'firebase' | 'demo';
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);
const auth: Auth | null = hasFirebaseConfig ? getAuth(initializeApp(firebaseConfig)) : null;
const demoAuthKey = 'edgeguard-demo-auth-user';

const toAuthUser = (user: User): AuthUser => ({
  displayName: user.displayName || user.email?.split('@')[0] || 'Driver',
  email: user.email || '',
  provider: 'firebase',
});

const getDemoUser = (): AuthUser | null => {
  const raw = window.localStorage.getItem(demoAuthKey);
  return raw ? JSON.parse(raw) as AuthUser : null;
};

const setDemoUser = (user: AuthUser | null) => {
  if (user) {
    window.localStorage.setItem(demoAuthKey, JSON.stringify(user));
    return;
  }
  window.localStorage.removeItem(demoAuthKey);
};

export function watchAuthState(callback: (user: AuthUser | null) => void) {
  if (!auth) {
    callback(getDemoUser());
    const onStorage = (event: StorageEvent) => {
      if (event.key === demoAuthKey) callback(getDemoUser());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }

  return onAuthStateChanged(auth, (user) => callback(user ? toAuthUser(user) : null));
}

export async function signIn(email: string, password: string) {
  if (!auth) {
    const user: AuthUser = { displayName: email.split('@')[0] || 'Driver', email, provider: 'demo' };
    setDemoUser(user);
    return user;
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  return toAuthUser(credential.user);
}

export async function signUp(name: string, email: string, password: string) {
  if (!auth) {
    const user: AuthUser = { displayName: name || email.split('@')[0] || 'Driver', email, provider: 'demo' };
    setDemoUser(user);
    return user;
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() });
  return { ...toAuthUser(credential.user), displayName: name.trim() || toAuthUser(credential.user).displayName };
}

export async function logOut() {
  if (!auth) {
    setDemoUser(null);
    return;
  }
  await signOut(auth);
}

export const authMode = hasFirebaseConfig ? 'firebase' : 'demo';
