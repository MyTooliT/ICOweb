# ICOweb Application

A frontend/client developed in conjunction with the corresponding [ICOapi](https://git.ift.tuwien.ac.at/lab/ift/icotronic/icoapi) backend.
It is designed to be run in any form of modern browser.

**Design / Wireframes**: [Miro Board](https://miro.com/app/board/uXjVK7Kb3lE=/?share_link_id=832192510379)

**Languages**: [Vue](https://vuejs.org/), [TypeScript](https://www.typescriptlang.org/)

**Design Framework**: [PrimeVue](https://primevue.org/), [TailwindCSS](https://tailwindcss.com/)

**Bundler**: [Vite](https://vite.dev/)

# Installation

This repository can be setup manually for Windows and Linux or using the installation script for Linux.

## Prerequisites

- Node.js / NPM, from the official [NodeJS Website](https://nodejs.org/en/download)

## Manual Installation (Development)

After ensuring a valid Node installation, clone the repository (including its submodule) and install the dependencies:

```bash
git clone --recurse-submodules <repo-url>
npm install
```

The shared layout/navigation/theme layer lives in the [ICOClientBase](https://github.com/MyTooliT/ICOClientBase) git
submodule at ``src/base`` (import alias ``@base``). If you cloned without ``--recurse-submodules``, run
``git submodule update --init --recursive``. To update it: ``git submodule update --remote src/base``. When changing the
base, commit and push inside ``src/base`` first, then commit the new submodule pointer here.

## Service Installation (Linux)

For Linux, there is an installation script which sets the directory for the actual installation, the directory for the 
systemd service and the used systemd service name as well as the Node version. The (sensible) defaults are:

```
SERVICE_NAME="icoweb"
INSTALL_DIR="/etc/icoweb"
SERVICE_PATH="/etc/systemd/system"
NODE_VERSION="18.19.0"
FORCE_REINSTALL=false
```

After checking, run the script to install normally:

```sh
./install
```

Or, if you want to delete existing installations and do a clean reinstall, add the `--force` flag:

```sh
./install --force
```

# Configuration / Environment Variables

This application has two main forms of configuration: environment variables and auto-generated metadata types.

## Environment Variables

The application expects a `.env` file in the root directory. It handles the main configuration of the backend application.

> All variables containing `API_` indicate that there is a counterpart in the API side environment variables. This is to
> show that changes here most likely need to be propagated to the backend.

### Client/API Connection Settings

These settings determine all forms of client/API communication details.

The main REST API is versioned and does _NOT_ use SSL at the moment.

```
VITE_API_PROTOCOL=http
VITE_API_HOSTNAME="0.0.0.0"
VITE_API_PORT=33215
VITE_API_VERSION=v1
```

The WebSocket is for streaming data. It only requires a `VITE_API_WS_PROTOCOL` variable akin to `VITE_API_PROTOCOL`
which decided between SSL or not.

```
VITE_API_WS_PROTOCOL=ws
```

These values are only the **default** address. Users can connect to a different ICOapi at runtime via
"Change API" in the bottom bar (protocol, hostname, port). The override is stored in the browser's
`localStorage` (`icoweb.apiEndpoint`), the page reloads when it is applied, and "Reset to default" removes it. Both also clear all other persisted state (devices, measurements, ...), because another API is another machine.
An override takes the WebSocket protocol from its HTTP protocol (`http` → `ws`, `https` → `wss`).
Without `VITE_API_HOSTNAME`, the default is the origin the page is served from. The target ICOapi must allow
the origin of ICOweb (CORS), and a page served via `https` cannot talk to an `http` API.

#### Reaching `http` APIs from an `https` ICOweb (reverse proxy)

Browsers block `http`/`ws` requests from an `https` page. To serve ICOweb over `https` and still connect to many
plain-`http` ICOapi instances (e.g. development sessions in the local network), let the ICOweb server forward the
requests:

1. Build ICOweb with `VITE_API_PROXY_PREFIX=/proxy` (for the Docker image: in `docker.env`).
2. Configure your reverse proxy to forward `/proxy/<host>:<port>/...` to `http://<host>:<port>/...`, including
   WebSockets. [`Caddyfile.example`](Caddyfile.example) does this and restricts the allowed targets.

When the chosen API uses `http` (and is not the server of ICOweb itself), ICOweb then calls
`<icoweb-origin>/proxy/<host>:<port>/api/<version>` (and `ws://`/`wss://` for the WebSocket). The browser only talks to
the ICOweb host, so no CORS setup, certificate exception or mixed-content problem exists for the APIs, also from a plain
`http` page. `https` APIs connect directly as before. Note that:

A ready-to-run setup is in [`docker-compose.yml`](docker-compose.yml): it builds ICOweb (with the prefix) and a Caddy
using [`deploy/caddy/Caddyfile`](deploy/caddy/Caddyfile) from this repository. Set `ICOWEB_HOST` (address of the
server; the protocol decides: `http://128.130.104.56` is plain http without certificate, a bare IP gets https with
Caddy's own CA, a public domain gets Let's Encrypt) and optionally `ICOAPI_ALLOWED_HOSTS` (regular expression without
capturing groups of the allowed ICOapi hosts; default: private IPv4 ranges). Ports 80 and 443 are used.

- The proxy connects from the **server**. The ICOapi must be reachable from it (firewall, listening on a non-loopback
  address), and `localhost` means the server itself, not the user's computer.
- Restrict the targets the proxy may forward to (see the example), as it otherwise reaches everything the server can.

### Enable/Disable Settings

To make the application configurable, pages and features can be enabled and disabled separately. By default, all pages
are shown and no features are enabled - the ``.env`` file can override that.

```
VITE_APPLICATION_DISABLE_PAGES="Config,Analyze"
VITE_APPLICATION_ENABLE_FEATURES="ADC"
```

``VITE_APPLICATION_DISABLE_PAGES`` takes the names of the pages to be disabled, which hides them from the menu.
``VITE_APPLICATION_ENABLE_FEATURES`` takes predefined tags to enable.
- ``ADC`` enables changing the ADC settings

```
VITE_APPLICATION_PORT=8081
```

``VITE_APPLICATION_PORT`` defines on what port the client is served at.

```
VITE_APPLICATION_THEME="blue"
VITE_APPLICATION_THEME_EXTRALOGO="false"
```

``VITE_APPLICATION_THEME`` sets the theme of the application at build-time. 

``VITE_APPLICATION_THEME_EXTRALOGO`` controls whether a second log is present

## Type Generation

This repository is based on typescript and relies heavily on the ``openapi-ts`` package to generate type declarations
in ``src/client`` from the backend directly. To update the type declarations, **ensure the API is running** and run:

```
npm run generate-client
```

# Branding

The possibility to customize the client to your brand is currently implemented via the ``theme`` folder. It holds:
- ``logo.png`` as the main logo in the bottom left corner (default: IFT TU Wien logo)
- ``extra.png`` being the secondary logo on top of the main logo (default: transparent)

The theme classes (``.blue``, ``.darkblue``, ...) and matching PrimeVue palettes come from ICOClientBase
(``src/base/configuration/theme.css`` and ``theme.ts``).

## Theming

To customize the branding, you can replace the logos on build-time and set the proper environment variables:

``VITE_APPLICATION_THEME="<your-theme-name>"`` and ``VITE_APPLICATION_THEME_EXTRALOGO="true"``

``<your-theme-name>`` must be a CSS class name defined in ICOClientBase's `theme.css` and the matching object key in its `theme.ts`
(new themes are added in ICOClientBase).

# Run

To run the client locally, use:

``npm run start``

**Note**: The browser must have CORS disabled. When using Chrome, run with the flags

``--disable-web-security --user-data-dir="<Some Writable Folder>"`` to achieve this.

# Feature Requests

This is the list of requested features, in no particular order.

> This should be converted into issues.

## Concerning "Analyze" Tab

- [ ] **Graph: Better crosshair for point inspection**
- [ ] **Dataloss**: Display dataloss in analyze tab
    - [ ] Make "intelligent fill" (fills lost values with past values) create a new file

Notes on crosshair and window selection: Both are enabled by the plugin [chartjs-plugin-crosshair](https://chartjs-plugin-crosshair.netlify.app/)
and would be perfectly suitable. However, when using the plugin, upon zooming the datasets disappear. This seems to be connected
to the ``type: linear`` property in the chart options, as without this, it works - but with an unformated scale.

## Concerning "Config" Tab

- [ ] **Tool Holder**: Split into default and custom holder templates
    - [ ] Make default holders with picture
    - [ ] **Sketches**: Create and show informational sketches

## Concerning Sensor Data

- [ ] **Raw data option**: create the option to look at the raw data without any conversion

## Concerning General Features

- [ ] **Hardware**: Firmware update of STH / STU via GUI
- [ ] **MQTT**: Provide interface so a certain MQTT topic can be subscribed to and added to the measurement stream data
- [ ] Show battery charge on STH list refresh
- [ ] **KPIs**: Add support for more KPIs in Analyze and Measure

## Concerning "Measure" Tab

- [ ] **Threshold**: Add ability to set threshold and get 0/1 if passed