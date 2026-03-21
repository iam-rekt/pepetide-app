export function getStoredAdminKey() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const adminKey = localStorage.getItem('adminKey')?.trim();
    return adminKey || null;
  } catch {
    return null;
  }
}

export function clearStoredAdminKey() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem('adminKey');
  } catch {
    // Ignore storage failures and keep the rest of the UI functional.
  }
}

export function getAdminHeaders(): HeadersInit | undefined {
  const adminKey = getStoredAdminKey();
  return adminKey ? { 'x-admin-key': adminKey } : undefined;
}

export async function validateStoredAdminKey() {
  const adminHeaders = getAdminHeaders();

  if (!adminHeaders) {
    return false;
  }

  try {
    const response = await fetch('/api/admin/status', {
      headers: adminHeaders
    });

    if (!response.ok) {
      clearStoredAdminKey();
      return false;
    }

    const data = await response.json();

    if (data.isAdmin) {
      return true;
    }

    clearStoredAdminKey();
    return false;
  } catch {
    return false;
  }
}
