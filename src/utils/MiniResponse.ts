/**
 * 微信小程序兼容的 Response 类
 * 用于替代浏览器的 Response 对象
 */
export class MiniResponse implements Response {
  readonly body: ReadableStream<Uint8Array> | null = null;
  readonly bodyUsed: boolean = false;
  readonly headers: Headers;
  readonly ok: boolean;
  readonly redirected: boolean = false;
  readonly status: number;
  readonly statusText: string;
  readonly type: ResponseType = "basic";
  readonly url: string = "";

  private _bodyData: any;

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    this._bodyData = body;
    this.status = init?.status ?? 200;
    this.statusText = init?.statusText ?? "";
    this.ok = this.status >= 200 && this.status < 300;

    // 创建 Headers 对象（如果环境支持）
    if (typeof Headers !== "undefined") {
      this.headers = new Headers(init?.headers);
    } else {
      // 微信小程序环境中创建简单的 headers 对象
      this.headers = this._createSimpleHeaders(init?.headers);
    }
  }

  private _createSimpleHeaders(init?: HeadersInit): any {
    const headers: Record<string, string> = {};

    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => {
          headers[key.toLowerCase()] = value;
        });
      } else if (typeof init === "object") {
        Object.entries(init).forEach(([key, value]) => {
          headers[key.toLowerCase()] = value;
        });
      }
    }

    return {
      get: (name: string) => headers[name.toLowerCase()],
      has: (name: string) => name.toLowerCase() in headers,
      forEach: (callback: (value: string, key: string) => void) => {
        Object.entries(headers).forEach(([key, value]) => callback(value, key));
      },
    };
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    if (typeof ArrayBuffer !== "undefined" && this._bodyData instanceof ArrayBuffer) {
      return this._bodyData;
    }
    throw new Error("Response body is not an ArrayBuffer");
  }

  async blob(): Promise<Blob> {
    throw new Error("Blob is not supported in this environment");
  }

  async formData(): Promise<FormData> {
    throw new Error("FormData is not supported in this environment");
  }

  async json(): Promise<any> {
    if (typeof this._bodyData === "string") {
      return JSON.parse(this._bodyData);
    }
    if (typeof this._bodyData === "object") {
      return this._bodyData;
    }
    throw new Error("Response body is not valid JSON");
  }

  async text(): Promise<string> {
    if (typeof this._bodyData === "string") {
      return this._bodyData;
    }
    if (typeof this._bodyData === "object") {
      return JSON.stringify(this._bodyData);
    }
    return String(this._bodyData ?? "");
  }

  clone(): Response {
    return new MiniResponse(this._bodyData, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
    });
  }
}
