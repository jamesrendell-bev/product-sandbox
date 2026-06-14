# BirdsEyeView Product Sandbox

One login, one place to open and test the latest BirdsEyeView products. A thin
shell hosts each product; the products themselves are self-contained apps.

Live (once deployed): **https://birdseyeview1.gitlab.io/product-sandbox/**

## What's in here

```
shell/             The sandbox shell: login, left rail, dashboard. Serves at the site root.
apps/
  natcat/          Property NatCat Pricing  (Vite/React). Runs on stub curves; live via CERA® API.
  contingency/     Contingency Weather      (Vite/React). Weather data needs an API backend (see below).
  converter/       EDM & CEDE Converter     (static, fully client-side, no backend).
design-system/     The full BirdsEyeView design system: tokens, components, guidelines, assets.
DATA_SCIENCE_GUIDE.md   Where the data science team plugs in real curves and APIs.
.gitlab-ci.yml     Builds everything to GitLab Pages under /product-sandbox/.
```

## How it deploys

`.gitlab-ci.yml` builds the shell at the root and each app at a subpath
(`/natcat`, `/contingency`, `/converter`), then publishes to GitLab Pages. Push
to the default branch and the pipeline does the rest. The shell embeds each app
by its subpath, so it reads as one product.

## Running locally

Each app is a standard build. From its folder:

```bash
npm install
npm run dev
```

Ports: shell 5190, NatCat 5173, Contingency 5180. The converter is static, serve
it with any static server (`python3 -m http.server`).

## The one backend dependency

Everything is static **except Contingency's weather data**. It calls `/api/...`
for geocoding, ground-station (Meteostat) history and CERA triage. Locally those
routes run in-process via a Vite plugin (`apps/contingency/server/`). On GitLab
Pages there is no server, so that data is inert until you point the app at one.

The route handlers in `apps/contingency/server/routes/` are the reference
implementation. Host them on an internal server, then build the shell/Contingency
with `VITE_API_BASE=https://your-server` and the weather triage comes alive.
Everything else (shell, NatCat, converter) works on Pages with no backend.

## Design system

`design-system/` is the full BirdsEyeView design system for engineers to reuse:
colour and type tokens (`tokens/`), reusable components (`components/`, `ui_kits/`),
the written guidelines (`readme.md`, `guidelines/`) and brand assets. The apps
already follow it; new work should pull from here.

## Data science

See `DATA_SCIENCE_GUIDE.md` for exactly where to insert real vulnerability curves
and connect the CERA® / NatCat API.
