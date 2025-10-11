/**
 * 微信小程序环境的 URL Polyfill
 * 不依赖任何浏览器 API（如 document.createElement）
 * 专门为 Directus SDK 在小程序环境中使用而设计
 */

/**
 * URLSearchParams polyfill for WeChat Mini Program
 */
export class MiniURLSearchParams implements URLSearchParams {
  private params: Map<string, string[]>;

  constructor(init?: string | URLSearchParams | Record<string, string> | string[][]) {
    this.params = new Map();

    if (!init) {
      return;
    }

    if (typeof init === "string") {
      this._fromString(init);
    } else if (init instanceof MiniURLSearchParams) {
      init.forEach((value, key) => {
        this.append(key, value);
      });
    } else if (Array.isArray(init)) {
      init.forEach(([key, value]) => {
        this.append(key, value);
      });
    } else if (typeof init === "object") {
      Object.entries(init).forEach(([key, value]) => {
        this.append(key, value);
      });
    }
  }

  private _fromString(search: string) {
    const queryString = search.startsWith("?") ? search.substring(1) : search;
    if (!queryString) return;

    queryString.split("&").forEach((pair) => {
      const [key, value] = pair.split("=");
      if (key) {
        this.append(
          decodeURIComponent(key),
          value ? decodeURIComponent(value) : ""
        );
      }
    });
  }

  append(name: string, value: string): void {
    const values = this.params.get(name) || [];
    values.push(String(value));
    this.params.set(name, values);
  }

  delete(name: string): void {
    this.params.delete(name);
  }

  get(name: string): string | null {
    const values = this.params.get(name);
    return values && values.length > 0 ? values[0] : null;
  }

  getAll(name: string): string[] {
    return this.params.get(name) || [];
  }

  has(name: string): boolean {
    return this.params.has(name);
  }

  set(name: string, value: string): void {
    this.params.set(name, [String(value)]);
  }

  sort(): void {
    const sorted = new Map([...this.params.entries()].sort());
    this.params = sorted;
  }

  forEach(callback: (value: string, key: string, parent: URLSearchParams) => void): void {
    this.params.forEach((values, key) => {
      values.forEach((value) => {
        callback(value, key, this as any);
      });
    });
  }

  keys(): IterableIterator<string> {
    const keys: string[] = [];
    this.params.forEach((values, key) => {
      values.forEach(() => keys.push(key));
    });
    return keys[Symbol.iterator]();
  }

  values(): IterableIterator<string> {
    const values: string[] = [];
    this.params.forEach((vals) => {
      values.push(...vals);
    });
    return values[Symbol.iterator]();
  }

  entries(): IterableIterator<[string, string]> {
    const entries: [string, string][] = [];
    this.params.forEach((values, key) => {
      values.forEach((value) => {
        entries.push([key, value]);
      });
    });
    return entries[Symbol.iterator]();
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }

  toString(): string {
    const pairs: string[] = [];
    this.params.forEach((values, key) => {
      values.forEach((value) => {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      });
    });
    return pairs.join("&");
  }

  get size(): number {
    let count = 0;
    this.params.forEach((values) => {
      count += values.length;
    });
    return count;
  }
}

export class MiniURL implements URL {
  href: string;
  origin: string;
  protocol: string;
  username: string = "";
  password: string = "";
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  searchParams: URLSearchParams;
  hash: string;

  constructor(url: string, base?: string | URL) {
    // 如果提供了 base，需要处理相对路径
    if (base) {
      const baseStr = typeof base === "string" ? base : base.href;
      url = this._resolveUrl(url, baseStr);
    }

    // 解析 URL
    const parsed = this._parseUrl(url);

    this.href = parsed.href;
    this.origin = parsed.origin;
    this.protocol = parsed.protocol;
    this.host = parsed.host;
    this.hostname = parsed.hostname;
    this.port = parsed.port;
    this.pathname = parsed.pathname;
    this.search = parsed.search;
    this.hash = parsed.hash;

    // 创建 searchParams
    this.searchParams = new MiniURLSearchParams(this.search);
  }

  private _resolveUrl(url: string, base: string): string {
    // 如果是绝对 URL，直接返回
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    // 移除 base 的末尾斜杠
    base = base.replace(/\/$/, "");

    // 如果 url 以 / 开头，使用 base 的 origin
    if (url.startsWith("/")) {
      const match = base.match(/^(https?:\/\/[^\/]+)/);
      return match ? match[1] + url : url;
    }

    // 相对路径
    return base + "/" + url;
  }

  private _parseUrl(url: string): {
    href: string;
    origin: string;
    protocol: string;
    host: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    hash: string;
  } {
    // 匹配 URL 的各个部分
    const match = url.match(
      /^(https?:)\/\/([^:\/\?#]+)(:(\d+))?(\/[^\?#]*)?(\?[^#]*)?(#.*)?$/i
    );

    if (!match) {
      // 如果不是完整的 URL，可能是相对路径
      return {
        href: url,
        origin: "",
        protocol: "",
        host: "",
        hostname: "",
        port: "",
        pathname: url.split("?")[0].split("#")[0] || "/",
        search: url.includes("?") ? "?" + url.split("?")[1].split("#")[0] : "",
        hash: url.includes("#") ? "#" + url.split("#")[1] : "",
      };
    }

    const protocol = match[1];
    const hostname = match[2];
    const port = match[4] || "";
    const pathname = match[5] || "/";
    const search = match[6] || "";
    const hash = match[7] || "";

    const host = port ? `${hostname}:${port}` : hostname;
    const origin = `${protocol}//${host}`;

    return {
      href: url,
      origin,
      protocol,
      host,
      hostname,
      port,
      pathname,
      search,
      hash,
    };
  }

  toString(): string {
    return this.href;
  }

  toJSON(): string {
    return this.href;
  }
}

// ============================================
// 自动注入到全局对象（当这个模块被导入时立即执行）
// ============================================
if (typeof globalThis !== "undefined") {
  if (!globalThis.URL) (globalThis as any).URL = MiniURL;
  if (!globalThis.URLSearchParams) (globalThis as any).URLSearchParams = MiniURLSearchParams;
}

// @ts-ignore - 微信小程序环境
if (typeof global !== "undefined") {
  // @ts-ignore
  if (!global.URL) global.URL = MiniURL;
  // @ts-ignore
  if (!global.URLSearchParams) global.URLSearchParams = MiniURLSearchParams;
}

// @ts-ignore - 浏览器环境
if (typeof window !== "undefined") {
  // @ts-ignore
  if (!window.URL) window.URL = MiniURL;
  // @ts-ignore
  if (!window.URLSearchParams) window.URLSearchParams = MiniURLSearchParams;
}
// ============================================
