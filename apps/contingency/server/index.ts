import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

import { ceraTriage } from "./routes/cera";
import { meteostatGeocode, meteostatGeosearch, meteostatStations, meteostatDaily } from "./routes/meteostat";

export type Env = Record<string, string>;

export interface ApiCtx {
  env: Env;
  url: URL;
  query: URLSearchParams;
  body: any;
}

export type Handler = (ctx: ApiCtx) => Promise<{ status?: number; json: any }>;

// method + path → handler. Paths are exact (query stripped before match).
type Route = { method: string; path: string; handler: Handler };

const routes: Route[] = [
  { method: "GET", path: "/api/health", handler: async () => ({ json: { ok: true } }) },
  { method: "POST", path: "/api/cera/triage", handler: ceraTriage },
  { method: "GET", path: "/api/meteostat/geocode", handler: meteostatGeocode },
  { method: "GET", path: "/api/meteostat/geosearch", handler: meteostatGeosearch },
  { method: "GET", path: "/api/meteostat/stations", handler: meteostatStations },
  { method: "GET", path: "/api/meteostat/daily", handler: meteostatDaily },
];

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(body);
}

async function readBody(req: IncomingMessage): Promise<any> {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (!chunks.length) return undefined;
  const raw = Buffer.concat(chunks).toString("utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function apiPlugin(env: Env): Plugin {
  return {
    name: "bev-contingency-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || "";
        if (!rawUrl.startsWith("/api/")) return next();

        const url = new URL(rawUrl, "http://localhost");
        const route = routes.find(
          (r) => r.method === req.method && r.path === url.pathname,
        );
        if (!route) return sendJson(res, 404, { error: `no route ${req.method} ${url.pathname}` });

        try {
          const body = await readBody(req);
          const result = await route.handler({ env, url, query: url.searchParams, body });
          sendJson(res, result.status ?? 200, result.json);
        } catch (err: any) {
          // eslint-disable-next-line no-console
          console.error(`[api] ${url.pathname} failed:`, err?.message ?? err);
          sendJson(res, 500, { error: String(err?.message ?? err) });
        }
      });
    },
  };
}
