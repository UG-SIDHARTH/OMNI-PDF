// Centralized API Client with Session Persistence & Error Handling

function getSessionId() {
  let id = localStorage.getItem('omnipdf_session_id');
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('omnipdf_session_id', id);
  }
  return id;
}

export async function apiFetch(endpoint, options = {}) {
  const sessionId = getSessionId();
  
  const headers = {
    'x-session-id': sessionId,
    ...(options.headers || {})
  };

  // Don't set Content-Type for FormData uploads (browser handles boundary)
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(endpoint, {
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
