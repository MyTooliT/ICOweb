# ICOweb Application

A frontend/client developed in conjunction with the corresponding [ICOapi](https://git.ift.tuwien.ac.at/lab/ift/icotronic/icoapi) backend.
It is designed to be run in any form of modern browser.

**Design / Wireframes**: [Miro Board](https://miro.com/app/board/uXjVK7Kb3lE=/?share_link_id=832192510379)

**Languages**: [Vue](https://vuejs.org/), [TypeScript](https://www.typescriptlang.org/), (HTML/CSS)

**Design Framework**: [PrimeVue](https://primevue.org/), [TailwindCSS](https://tailwindcss.com/)

**Bundler**: [Vite](https://vite.dev/)

# Installation

This repository can be setup manually for Windows and Linux or using the installation script for Linux.

## Prerequisites

- Node.js / NPM, from the official [NodeJS Website](https://nodejs.org/en/download)

## Manual Installation (Development)

As with any other NPM project, after cloning the repository and ensuring a valid Node installation, run:

``npm install``

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

```
VITE_APPLICATION_PORT=8081
```

``VITE_APPLICATION_PORT`` defines on what port the client is served at.

``VITE_APPLICATION_DEFAULT_HOLDER`` sets the default holder configuration.

## Type Generation

This repository is based on typescript and relies heavily on the ``openapi-ts`` package to generate type declarations
in ``src/client`` from the backend directly. To update the type declarations, **ensure the API is running** and run:

```
npm run generate-client
```

## Metadata

To support the usage of arbitrary metadata when creating measurements, a configuration system has been set up. This
system starts as an Excel file in which all metadata fields are defined. This file is then parsed into a YAML file, from
which it can be used further.

This repository holds the ``metadata.xlsx`` master file and the script to generate the ``.yaml`` file and the typescript type 
declarations from it. Run the parser with:

``
npm run generate-config
``

This script expects the Excel file to be in the project root and places the parsed YAML file into ``public/config``.

The ``.yaml`` file will then be used by the client itself to generate the UI elements.

The [metadata file](metadata.xlsx) has the following sheets:

### fields

This is where all available fields need to be entered, no matter in which profile they appear or not.

- id: must be unique
- label: displayed name of the field
- datatype: determines the UI element for the field
  - text: simple text input
  - dropdown: select/dropdown **not editable** --> see **lists sheet**
  - text_suggestions: text input, but with on-type suggestions --> see **lists sheet**
  - float: number input with 4 decimal places (komma, not dot notation!)
  - int: integer number input
  - boolean: renders a checkbox
  - file: currently only renders the CustomFileUpload component which is only for images
  - text_box: renders a resizable textbox
- unit: is displayed next to the field label and stored alongside the entered value
  - see the Quantity Datatype in the [generate types](src/client/types.gen.ts)
- type: determines how the field is handled
  - default: empty (or prefilled if default values are given) field
  - implementation: suggests that this field will be computed, but **that computation must be handled manually**
  - range: currently not respected; intended for fields which get set as a range between bounds (e.g. for cutting along a sloped line)

### categories

These are the categories that split the fields into different sections when rendered in the client. They only consist of:

- id: unique identifier
- display_name: displayed name as a section heading

### lists

This is the **lists sheet** mentioned for _dropdown_ and _text_suggestion_ fields.

Every column has an ID from a field which's type is dropdown or text_suggestions as a header in the first row (case 
sensitive) and then lists available options.

These options are rendered as-is (and not via a key-value lookup for e.g. localization) and can be any text. 

> Example: the column with the header _workpiece_material_ contains options rendered for the text-suggestion field with the title _Workpiece Material_ **whereever** it is used.

### info

This sheet is for any arbitrary information relevant to the setup. Currently it only holds the version.

**Increment this** whenever you change something as it will be used to provide the structure for analysis programs.

### _pre__ and _post__

All other sheets will contain the prefixes _pre__ and _post__ with the rest of the sheet name **equal for any pair**.

This controls the profiles that can be selected in the application.

Everything in the _pre__ sheet will be displayed on the measurement page while everything in the _post__ sheet will be 
in the modal that pops up after the measurement. Their structure is:

- id: unique identifier --> **needs to be equal between the _pre__ and _post__ sheet**
- display_name: how the profile is displayed --> **needs to be equal between the _pre__ and _post__ sheet**
- field_id: ID from the ``fields`` sheet
  - determines which fields are displayed in the profile
  - needs to match the field's ID exactly
- required: Whether the field is required or optional
  - required: marked with a * in the field label, also blocks measurement if not filled
  - optional: displayed, but not validated beyond basic type validation (text, integer, etc.)
  - hidden: same as not including it in the profile
- category: under what section the field is displayed
  - the script aggregates the fields per category - no need to enter them in the correct order
  - needs to match an ID from the ``categories`` sheet
- default: default value for the field if required
  - for dropdown/text_suggestion: needs to match an option from the relevant ``lists`` column
- description: currently unused; could be used for a popover/tooltip easily

### Guide

Edit the [metadata.xlsx](metadata.xlsx) and make all the required adjustments. Then run:

``npm run generate-config``

to parse the file into ``public/config/metadata.yaml`` and ``types/metadata.d.ts``. 

The ``metadata.yaml`` file is required for the metadata system to work. **Commit it.**

The typescript declaration is only for development.

# Sensors and Configurations ("Holders")

A layer of abstraction over simply using channels and needing to know which kind of data to expect has been implemented.

The client will fetch the available sensors and configurations from the API, which holds the information in a ``sensors.yaml`` file.

# Run

To run the client locally, use:

``npm run start``

**Note**: The browser must have CORS disabled. When using Chrome, run with the flags

``--disable-web-security --user-data-dir="<Some Writable Folder>"`` to achieve this.

# Planned Features

This is the list of features to be implemented.

## Concerning "Analyze" Tab

- [x] **Create Analyze Tab**: Separate tab where files can be loaded in and analyzed
- [x] **Graph: Window selection**: Make a window selection for zooming in
- [ ] **Graph: Better crosshair for point inspection**
- [ ] **Graph: FFT**: Make FFT available for dataset
- [ ] **Dataloss**: Display dataloss in analyze tab
    - [ ] Make "intelligent fill" (fills lost values with past values) create a new file
- [x] **Performance**: Large file sizes?
    - [x] Loading indicator
- [x] **Scales**: Make the graph scales represent the holder's actual unit and range

Notes on crosshair and window selection: Both are enabled by the plugin [chartjs-plugin-crosshair](https://chartjs-plugin-crosshair.netlify.app/)
and would be perfectly suitable. However, when using the plugin, upon zooming the datasets disappear. This seems to be connected
to the ``type: linear`` property in the chart options, as without this, it works - but with an unformated scale.

## Concerning "Measure" Tab

- [x] **Graph: Zoom only X**
- [x] ~~**Graph**: Fixed time shows whole timeframe at once with fixed number of points~~ Keep the scrolling behavior
- [x] **Acquisition Time**: Determine best way to set acquisition time
    - Note: according to JG, just seconds input is fine.
- [x] **Performance**: Maximum length of acquisition?
    - Note: a single axis measurement of 400MB was possible, so no worries there.
- [x] **Scales**: Make the graph scales represent the holder's actual unit and range


## Concerning General Features

- [x] **Dataloss**: make dataloss visible in measurement tab
- [x] **Renaming**: For security reasons, make ``rename`` into prompt (no accidental renames of other STHs)
- [x] **Export/Import config**: Put all relevant settings into config file and make it importable/exportable
- [x] **Storage**: Check storage capacity and warn accordingly

## Concerning "Config" Tab

- [x] **Tool Holder**: Split into default and custom holder templates
    - [x] Make default holders hardcoded 
    - [ ] Make default holders with picture
    - [ ] **Sketches**: Create and show informational sketches

# Feature Request List

This list is a loose collection of feedback given by people involved in the STH project.

## Concerning Sensor Data

- [ ] **Raw data option**: create the option to look at the raw data without any conversion to @g_0 or scaling to sensor range
- [x] **Reference Voltage**: Use first channel reference voltage for all channels
- [ ] **Linear transformation**: Create option to assign a linear transformation per sensor to a holder

## Concerning General Features

- [ ] **Hardware**: Firmware update of STH / STU via GUI
- [x] **Metadata**: Add ability to add metadata to STU / STH.
    - e.g. Machine, part, machine data, trial number, ...
    - make this available in the measurement tab
- [ ] **MQTT**: Provide interface so a certain MQTT topic can be subscribed to and added to the measurement stream data

## Concerning "Measure" Tab

- [ ] **KPIs**: Add support for more KPIs (IFT value is considered a KPI)
- [ ] **Rule Engine**: Create rule engine rules in GUI and export them
- [ ] **Threshold**: Add ability to set threshold and get 0/1 if passed