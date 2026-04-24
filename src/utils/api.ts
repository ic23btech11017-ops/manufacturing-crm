type ErrorPayload = {
  error?: string;
  message?: string;
};

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const body = payload as ErrorPayload;

    if (typeof body.error === 'string' && body.error.trim()) {
      return body.error;
    }

    if (typeof body.message === 'string' && body.message.trim()) {
      return body.message;
    }
  }

  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  return fallback;
}

export async function fetchJsonArray<T>(input: string, init?: RequestInit): Promise<T[]> {
  const response = await fetch(input, init);
  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, `Request failed with status ${response.status}`));
  }

  return Array.isArray(payload) ? (payload as T[]) : [];
}

export async function getResponseError(response: Response, fallback: string) {
  const payload = await parseResponseBody(response);
  return extractErrorMessage(payload, fallback);
}
