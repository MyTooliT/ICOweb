<script setup lang="ts">
import { onMounted, ref } from 'vue';

// The handbook is a static site (built from `docs/` in the ICOdaq repository):
// - in the ICOdaq app the main process serves the bundled copy
//   (`window.electronAPI.getDocsUrl`),
// - in a browser it is looked for next to ICOweb under `<base>docs/`.
// `docs.json` identifies a real handbook; a missing page would otherwise look
// like a normal answer, because the web server falls back to index.html.
const url = ref<string>()
const loading = ref(true)

async function locateHandbook(): Promise<string | undefined> {
  const bundled = await window.electronAPI?.getDocsUrl?.()
  if (bundled) return bundled

  const base = `${import.meta.env.BASE_URL}docs/`
  try {
    const response = await fetch(`${base}docs.json`)
    const isJson = (response.headers.get('content-type') ?? '').includes('json')
    if (response.ok && isJson) return base
  } catch {
    // Not reachable: no handbook
  }
  return undefined
}

onMounted(async () => {
  url.value = await locateHandbook()
  loading.value = false
})
</script>

<template>
  <!-- The bottom bar is 39px high and overlays the page -->
  <iframe
    v-if="url"
    :src="url"
    title="ICOdaq Handbook"
    data-test="docs-frame"
    class="block w-full border-0"
    style="height: calc(100dvh - 39px)"
  />
  <div
    v-else-if="!loading"
    data-test="docs-missing"
    class="flex flex-col items-center justify-center gap-2 text-center p-8"
    style="height: calc(100dvh - 39px)"
  >
    <i class="pi pi-book text-4xl ico-muted" />
    <h2 class="text-xl">Handbook not available</h2>
    <p class="ico-muted max-w-xl">
      This installation does not include the ICOdaq handbook. Contact
      ICOsupport@ift.at or ask for a version with the handbook.
    </p>
  </div>
</template>
