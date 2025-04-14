# ICOclient Application

A frontend/client developed in conjunction with the corresponding [ICOapi](https://git.ift.tuwien.ac.at/lab/ift/icotronic/icoapi) backend.
It is designed to be run in any form of modern browser.

**Design / Wireframes**: [Miro Board](https://miro.com/app/board/uXjVK7Kb3lE=/?share_link_id=832192510379)

**Languages**: [Vue](https://vuejs.org/), [TypeScript](https://www.typescriptlang.org/), (HTML/CSS)

**Design Framework**: [PrimeVue](https://primevue.org/), [TailwindCSS](https://tailwindcss.com/)

**Bundler**: [Vite](https://vite.dev/)

# Installation

This repository can be setup manually for Windows and Linux or using the installation script for Linux.

> As this is a Node/NPM project it is required that you have an up-to-date [Node.js + NPM](https://nodejs.org/en/download/prebuilt-installer) installation.

## Manual Installation (Development)

As with any other NPM project, after cloning the repository and ensuring a valid Node installation, run:

``npm install``

## Service Installation (Linux)

For Linux, there is an installation script which sets the directory for the actual installation, the directory for the 
systemd service and the used systemd service name as well as the Node version. The (sensible) defaults are:

```
SERVICE_NAME="icoclient"
INSTALL_DIR="/etc/icoclient"
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

### Enable/Disable Settings

To make the application configurable, pages and features can be enabled and disabled separately. By default, all pages
are shown and no features are enabled - the ``.env`` file can override that.

```
VITE_APPLICATION_DISABLE_PAGES="Config,Analyze"
VITE_APPLICATION_ENABLE_FEATURES="Cloud,Meta"
```

``VITE_APPLICATION_DISABLE_PAGES`` takes the names of the pages to be disabled, which hides them from the menu.
``VITE_APPLICATION_ENABLE_FEATURES`` takes predefined tags to enable.
- ``Cloud`` enables the usage of the Trident API data storage
- ``Meta`` enables the addition of metadata for measurements

### Branding Settings

To add branding to the client, a logo with corresponding ALT text can be set.

```
VITE_APPLICATION_EXTRA_LOGO="cirp.png"
VITE_APPLICATION_EXTRA_LOGO_ALT="CIRP"
```

The logo file must be placed in the ``public/extra`` folder and will be displayed above the IFT logo in the menu.

## Type Generation

This repository is based on typescript and relies heavily on the ``openapi-ts`` package to generate type declarations
in ``src/client`` from the backend directly. To update the type declarations, **ensure the API is running** and run:

``
npm run generate-client
``

### Metadata Parsing

To support the usage of arbitrary metadata when creating measurements, a configuration system has been set up. This
system starts as en Excel file in which all metadata fields are defined. This file is then parsed into a YAML file, from
which it can be used further.

This repository holds the ``.xlsx`` master file and the script to generate the ``.yaml`` file from it. Run the parser with:

``
npm run generate-config
``

This script expects the Excel file to be in the project root and places the parsed YAML file into ``public/config``.

After you have parsed the Excel file, run the ``generate_metadata.py`` file in the ``icoapi`` repository to create the 
backend types for the API. Finally, you can run the openAPI command from above to get the types from the backend.

> This may seem convoluted, but this way the metadata settings are stored in the client project (xlsx, yaml) where they 
> semantically belong, but the types still all come from the openAPI specification from the backend to provide consistency.

