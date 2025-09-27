function normalizeHeaders(headers?: HeadersInit): Record<string, string> | undefined {
  if (!headers) return undefined;
  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  if (Array.isArray(headers)) {
    return headers.reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }
  return headers as Record<string, string>;
}

function resolveBody(body: RequestInit['body']): UniApp.RequestOptions['data'] {
  if (!body) return undefined;
  if (typeof body === 'string') return body;
  if (typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer) return body;
  if (typeof Blob !== 'undefined' && body instanceof Blob) return body;
  return body as UniApp.RequestOptions['data'];
}

export function createUniFetch() {
  return async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.url;
    const method = init?.method ?? 'GET';
    const headers = normalizeHeaders(init?.headers);
    const body = resolveBody(init?.body);

    return new Promise<Response>((resolve, reject) => {
      uni.request({
        url,
        method: method as UniApp.RequestOptions['method'],
        header: headers,
        data: method === 'GET' ? undefined : body,
        success: (res) => {
          const responseBody =
            typeof res.data === 'string' || (typeof ArrayBuffer !== 'undefined' && res.data instanceof ArrayBuffer)
              ? res.data
              : JSON.stringify(res.data);

          resolve(
            new Response(responseBody, {
              status: res.statusCode,
              headers: res.header as HeadersInit
            })
          );
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  };
}
