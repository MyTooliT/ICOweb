# ICOgui Frontend

**Design / Wireframes**: [Miro Board](https://miro.com/app/board/uXjVK7Kb3lE=/?share_link_id=832192510379)

**Languages**: [Vue](https://vuejs.org/), [TypeScript](https://www.typescriptlang.org/)

**Design Framework**: [PrimeVue](https://primevue.org/)

**Summary**: Vue Typescript package without any SSR (Server-Side-Rendering) features and simple REST communication with backend.

## Development

For local development, one can either spawn the client (this repository) and the REST API (ico-back) separately or use 
the electron bundler. Within the ``.env`` file, the host and port for this communication can be set should there be any 
interference on the host machine regarding used/blocked ports.


### Running the electron bundle
To start the local development build using the bundled electron version, follow these steps:

1. Have [Python](https://www.python.org/downloads/) and [Node.js + NPM](https://nodejs.org/en/download/prebuilt-installer) installed
2. Pull the repository
3. Navigate a terminal into the root
4. Run `install_windows.bat` in **CMD, not PowerShell**
5. Run ``npm run start``

Note that the STDOUT from the python backend process will be output in this shell.

### Running Frontend and Backend separately

To spawn the processes separately, replace step 5 with:

5. ``npm run start-web`` 
6. ``npm run start-api`` in a different shell for the backend including the output.

## Structure

- `public` contains **only** assets that need to be reachable from the `index.html` entrypoint. This includes mostly fonts, and favicons.
- `src` is the main development source code folder
    - `api` contains all files concerning **data fetching**
    - `assets` contains static assets which are **not** needed in the entrypoint
    - `components` is for reusable Vue components that do not create a layout themselves
    - `layouts` contains Vue files that layout their children without any business logic
    - `pages` is the folder which holds files corresponding to routes
    - `router` contains the router
    - `stores` holds all the pinia store files and their surrounding data
    - `styles` is for CSS files
        - `material` holds the material design theme files
        - `tailwind` contains the in- and out-files of tailwind. Ignore.

## Development Tools

Any tools that will not neccessarily be installed / configured by installing the project are listed here.

- [eslint](https://eslint.vuejs.org/) for linting - make sure your IDE is configured to use it.