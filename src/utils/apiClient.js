// Centralized API Client with Session Persistence, Error Handling & Desktop/Web Protocol Resolution

function getSessionId() {
  let id = localStorage.getItem('omnipdf_session_id');
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('omnipdf_session_id', id);
  }
  return id;
}

export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    // 1. Explicitly exposed Electron desktop server URL
    if (window.omniDesktop?.serverUrl) {
      return window.omniDesktop.serverUrl;
    }
    // 2. Desktop file:// protocol or Capacitor webview
    if (window.location.protocol === 'file:' || window.location.origin === 'null') {
      return 'http://127.0.0.1:8092';
    }
  }
  return '';
}

export async function apiFetch(endpoint, options = {}) {
  const sessionId = getSessionId();
  const baseUrl = getApiBaseUrl();
  const fullUrl = endpoint.startsWith('http') 
    ? endpoint 
    : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = {
    'x-session-id': sessionId,
    ...(options.headers || {})
  };

  // Don't set Content-Type for FormData uploads (browser handles boundary)
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers,
    credentials: 'include'
  });

  const returnedSessionId = response.headers.get('x-session-id');
  if (returnedSessionId) {
    localStorage.setItem('omnipdf_session_id', returnedSessionId);
  }

  return response;
}

export async function downloadFile(fileId, filename = 'document.pdf') {
  try {
    const res = await apiFetch(`/api/download/${fileId}`);
    if (!res.ok) {
      throw new Error('Download link expired or file not found.');
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch (err) {
    console.error('Download error:', err);
    alert('Failed to download file: ' + err.message);
  }
}
