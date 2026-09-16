# BotOS — Public Synthetic Demo

[![Public demo](https://img.shields.io/badge/demo-synthetic%20data-42d6a4)](https://rubengp02.github.io/BotOS/)
[![CI](https://github.com/rubengp02/BotOS/actions/workflows/ci.yml/badge.svg)](https://github.com/rubengp02/BotOS/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-4f8cff.svg)](LICENSE)

> **Demo pública:** Por motivos de estricta privacidad, seguridad y protección de la propiedad intelectual, **los datos reales de operación no se comparten bajo ningún concepto**. Todos los nombres, mercados, eventos, métricas y resultados mostrados en este repositorio son 100% **datos sintéticos ficticios**. No contiene estrategias, parámetros, credenciales, operaciones ni evidencia de trading reales.

**[Abrir la demo](https://rubengp02.github.io/BotOS/)** · [English](#english)

## Espanol

BotOS es una demostracion de portfolio sobre la ingenieria de un sistema de supervision para estrategias cuantitativas. Esta edicion publica reutiliza el lenguaje visual y la estructura del dashboard local, pero sustituye deliberadamente el motor privado y todas las integraciones operativas por datos sinteticos deterministas.

El objetivo es mostrar capacidades de ingenieria de software —arquitectura, modelado de estados, visualizacion, trazabilidad, controles de riesgo y automatizacion de calidad— sin publicar propiedad intelectual cuantitativa ni datos sensibles.

### Que se puede probar

- Dashboard responsive en espanol e ingles.
- Escenarios deterministas de base, estres y recuperacion.
- Pipeline visual desde exploracion hasta monitorizacion.
- Portfolio sintetico, curva ilustrativa y matriz de correlacion ficticia.
- Registro de decisiones y controles de auditoria de la edicion publica.
- Validacion automatica contra secretos, rutas personales y artefactos operativos.

### Limites de seguridad

La demo publica **no** incluye:

- codigo, presets, nombres o parametros de estrategias reales;
- credenciales, tokens, correos, claves de API o rutas personales;
- bases de datos, XML de optimizacion, logs o estados del runtime local;
- resultados reales, backtests, operaciones, cuentas o evidencia de MetaTrader;
- conexion a brokers, MetaTrader, bridges locales o endpoints privados;
- capacidad para enviar ordenes o modificar el sistema local.

El sistema privado y esta demo son dos productos aislados. La web es estatica y funciona exclusivamente con [`data/demo_portfolio.json`](data/demo_portfolio.json).

### Ejecutar localmente

Requiere Python 3.12 o posterior:

```powershell
python -m http.server 8000
```

Abre `http://localhost:8000`. El servidor solo entrega los archivos estaticos de esta carpeta.

### Validacion

```powershell
python tools/validate_public_release.py
python -m unittest discover -s tests -v
```

El validador comprueba el contrato sintetico, extensiones prohibidas, patrones de secretos, rutas locales, referencias a estrategias privadas y destinos de red no permitidos.

### Arquitectura

```text
GitHub Pages
    |
    +-- index.html          Interfaz derivada del dashboard local
    +-- js/*.js             Logica de cliente y escenarios adaptados
    +-- data/*.json         Dataset publico, ficticio y auditable
    +-- tools/              Gate de seguridad de publicacion
    +-- tests/              Contratos reproducibles
```

La separacion completa entre la edicion publica y el runtime privado se documenta en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

### Tecnologias

- HTML5, JavaScript vanilla y CSS responsive.
- Chart.js para visualizaciones y Lucide para iconografia.
- Python 3.12 para validacion y pruebas sin dependencias de runtime.
- GitHub Actions y GitHub Pages para CI/CD estatico.

### Uso profesional

Este repositorio esta preparado como muestra tecnica personal. Expone decisiones de arquitectura, seguridad de publicacion, experiencia de usuario y calidad de entrega, no el contenido cuantitativo privado que sustenta el sistema local.

### Aviso

Software educativo y demostrativo. No constituye asesoramiento financiero ni representa resultados obtenidos en mercados reales.

---

## English

BotOS is a portfolio demonstration of an engineering system for supervising quantitative strategies. This public edition reuses the visual language and structure of the local dashboard while deliberately replacing the private engine and all operational integrations with deterministic synthetic data.

Its purpose is to demonstrate software-engineering capabilities —architecture, state modelling, visualization, traceability, risk controls, and quality automation— without publishing quantitative intellectual property or sensitive data.

### What you can explore

- Responsive dashboard in Spanish and English.
- Deterministic baseline, stress, and recovery scenarios.
- Visual pipeline from exploration to monitoring.
- Synthetic portfolio, illustrative curve, and fictional correlation matrix.
- Decision log and public-edition audit controls.
- Automated checks for secrets, personal paths, and operational artefacts.

### Security boundaries

The public demo does **not** include:

- real strategy code, presets, names, or parameters;
- credentials, tokens, email addresses, API keys, or personal paths;
- databases, optimization XML, logs, or local runtime state;
- real results, backtests, trades, accounts, or MetaTrader evidence;
- broker, MetaTrader, local bridge, or private endpoint connectivity;
- any ability to place orders or modify the local system.

The private system and this demo are isolated products. The website is static and runs exclusively on [`data/demo_portfolio.json`](data/demo_portfolio.json).

### Run locally

Python 3.12 or newer is recommended:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`. The server only serves the static files in this folder.

### Validation

```powershell
python tools/validate_public_release.py
python -m unittest discover -s tests -v
```

The validator checks the synthetic-data contract, forbidden extensions, secret patterns, local paths, private strategy references, and unauthorized network destinations.

### Architecture

```text
GitHub Pages
    |
    +-- index.html          UI derived from the local dashboard
    +-- js/app.js           Deterministic scenarios and adapter
    +-- data/*.json         Public, fictional, auditable dataset
    +-- tools/              Publication security gate
    +-- tests/              Reproducible contracts
```

The strict boundary between the public edition and the private runtime is documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

### Technology

- HTML5, vanilla JavaScript, and responsive CSS.
- Chart.js for visualizations and Lucide for iconography.
- Python 3.12 for dependency-free validation and tests.
- GitHub Actions and GitHub Pages for static CI/CD.

### Professional use

This repository is designed as a personal engineering portfolio. It presents architecture, publication security, product experience, and delivery quality—not the private quantitative content that powers the local system.

### Disclaimer

Educational demonstration software. It is not financial advice and does not represent results achieved in real markets.

## License

Released under the [MIT License](LICENSE).
