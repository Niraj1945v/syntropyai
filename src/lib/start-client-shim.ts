// Client shim for @tanstack/react-start when building client SPA for static hosting (Netlify, etc.)

export function useServerFn<T extends (...args: unknown[]) => unknown>(fn: T): T {
  return fn;
}

export function createServerFn() {
  return {
    validator(_v: unknown) {
      return this;
    },
    inputValidator(_v: unknown) {
      return this;
    },
    middleware(_m: unknown) {
      return this;
    },
    handler<R>(fn: (args: unknown) => Promise<R> | R) {
      const callable = async (args?: unknown) => {
        return fn(args || {});
      };
      return callable;
    },
  };
}

export function createStart() {
  return {};
}

export function createCsrfMiddleware() {
  return {};
}

export function createMiddleware() {
  return {
    middleware: () => ({
      server: () => ({}),
      client: () => ({}),
    }),
  };
}

export async function useSession() {
  return {
    data: {},
    update: async () => {},
    clear: async () => {},
  };
}
