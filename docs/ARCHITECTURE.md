# Public architecture / Arquitectura publica

## Boundary / Frontera

The repository is a static, read-only demonstration. It does not import, package, or call the private BotOS runtime.

El repositorio es una demostracion estatica y de solo lectura. No importa, empaqueta ni invoca el runtime privado de BotOS.

```text
PRIVATE LOCAL SYSTEM                    PUBLIC REPOSITORY

Quantitative engine                    Reused visual shell
Execution connectors        X          Synthetic adapter
Operational databases       X          Fictional JSON dataset
Strategy parameters         X          Generic demo identities
Runtime state               X          Browser-only UI state
```

The `X` boundary is intentional: there is no code path, build step, symbolic link, API request, or data export connecting both sides.

La frontera `X` es intencional: no existe ruta de codigo, paso de build, enlace simbolico, peticion API ni exportacion de datos que conecte ambos lados.

## Components / Componentes

### `index.html`

Public entry point derived from the layout conventions of the existing local dashboard. Production controls and private data bindings are absent.

Punto de entrada publico derivado de las convenciones visuales del dashboard local existente. No contiene controles de produccion ni enlaces a datos privados.

### `js/app.js`

Loads one local JSON file, applies deterministic display scenarios, renders charts, and manages language and tab state. Its only `fetch` target is a repository-relative demo file.

Carga un unico JSON local, aplica escenarios visuales deterministas, renderiza graficos y gestiona idioma y pestanas. Su unico destino `fetch` es un archivo demo relativo al repositorio.

### `data/demo_portfolio.json`

Auditable synthetic source of truth. Every model identifier starts with `DEMO-`, every market starts with `SYN-`, and the dataset declares `kind: synthetic`.

Fuente de verdad sintetica y auditable. Cada identificador de modelo empieza por `DEMO-`, cada mercado por `SYN-` y el dataset declara `kind: synthetic`.

### `tools/validate_public_release.py`

Fail-closed publication gate. It rejects common secret formats, personal filesystem paths, operational file types, private strategy identifiers, remote runtime calls, and malformed demo data.

Gate de publicacion cerrado por defecto. Rechaza formatos comunes de secretos, rutas personales, tipos de archivo operativos, identificadores de estrategias privadas, llamadas remotas de runtime y datos demo mal formados.

## Deployment / Despliegue

GitHub Actions validates the repository before the Pages workflow uploads the static artifact. The deployment requires no repository secret and grants only the Pages permissions required by the official GitHub actions.

GitHub Actions valida el repositorio antes de que el workflow de Pages publique el artefacto estatico. El despliegue no requiere secretos y concede unicamente los permisos necesarios para las acciones oficiales de GitHub Pages.
