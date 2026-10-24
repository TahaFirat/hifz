// In the native iOS app there is no backend server. The web app's `/api/lesson` route handler
// is a pure `GET(request)` function that queries public HTTPS Qur'an APIs and merges local
// Turkish corpus data, so we run it in-process and route `/api/*` fetches directly to it.
import { GET as lessonGET } from '@/app/api/lesson/route';

// --- Polyfills for older iOS WebKit (iOS 15/16) ---
if (typeof (Response as unknown as { json?: unknown }).json !== 'function') {
  (Response as unknown as { json: (data: unknown, init?: ResponseInit) => Response }).json = (data, init = {}) => {
    const headers = new Headers(init.headers);
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
    return new Response(JSON.stringify(data), { ...init, headers });
  };
}
if (typeof (AbortSignal as unknown as { timeout?: unknown }).timeout !== 'function') {
  (AbortSignal as unknown as { timeout: (ms: number) => AbortSignal }).timeout = (ms) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(new DOMException('TimeoutError', 'TimeoutError')), ms);
    return controller.signal;
  };
}

const nativeFetch = window.fetch.bind(window);

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const url = new URL(raw, window.location.href);
  if (url.origin === window.location.origin && url.pathname.startsWith('/api/')) {
    if (init?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (url.pathname === '/api/lesson') {
      return lessonGET(new Request(url.href, init));
    }
    if (url.pathname === '/api/enrich') {
      return Response.json({ available: false });
    }
    return new Response(JSON.stringify({ error: 'Bu özellik uygulamada kullanılamıyor.' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }
  return nativeFetch(input, init);
};
