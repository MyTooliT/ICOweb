/// <reference types="vite/client" />
/// <reference types="chart.js" />

declare const __APP_VERSION__: string
declare module 'primevue/toasteventbus'

// Exposed by the Electron wrapper's preload script (src/preload.ts in the
// icodaq root repo). Undefined when running ICOweb standalone (e.g. `npm run
// dev` outside Electron), since there is no preload context in that case.
interface ComponentVersion {
  commit: string
  describe: string
}
interface VersionManifest {
  generatedAt: string
  app: ComponentVersion
  icoapi: ComponentVersion
  icoweb: ComponentVersion
}
interface Window {
  electronAPI?: {
    getVersionManifest: () => Promise<VersionManifest | undefined>
  }
}