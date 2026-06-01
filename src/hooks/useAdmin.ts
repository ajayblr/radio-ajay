import { useState, useCallback } from 'react';

const ADMIN_EMAIL = 'blr.ajaykumar@gmail.com';
// SHA-256 of 'Iamadministratorno1'
const ADMIN_HASH  = 'b429c79e8d94f928b40271f62abbfe8c626531923b72ec817d8b73e46d7fabb3';
const SESSION_KEY = 'radio_admin';

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useAdmin() {
  const [isAdmin, setIsAdmin]   = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoginLoading(true);
    setLoginError('');
    const hash = await sha256(password);
    const ok = email.trim().toLowerCase() === ADMIN_EMAIL && hash === ADMIN_HASH;
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setIsAdmin(true);
    } else {
      setLoginError('Invalid email or password.');
    }
    setLoginLoading(false);
    return ok;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAdmin(false);
  }, []);

  return { isAdmin, login, logout, loginError, loginLoading };
}
