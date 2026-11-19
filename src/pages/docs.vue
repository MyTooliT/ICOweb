<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';

// The handbook is a static site (built from `docs/` in the ICOdaq repository):
// - in the ICOdaq app the main process serves the bundled copy
//   (`window.electronAPI.getDocsUrl`),
// - in a browser it is looked for next to ICOweb under `<base>docs/`.
// `docs.json` identifies a real handbook; a missing page would otherwise look
// like a normal answer, because the web server falls back to index.html.
//
// The handbook has a flavour for one STU and one for several STUs. This page
// tells it which one applies to the connected backend (see docs/.vitepress/theme/variant.ts).
const store = useGeneralStore()
const url = ref<string>()
const loading = ref(true)
const frame = ref<HTMLIFrameElement>()

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

function sendVariant() {
  // Unknown while the API is not reachable: the handbook keeps its last flavour
  if (!store.systemState.reachable) return
  frame.value?.contentWindow?.postMessage(
    { type: 'icodaq-docs-variant', multiStu: store.systemState.multiUnit },
    '*'
  )
}

watch(() => store.systemState.multiUnit, sendVariant)

onMounted(async () => {
  // Know the flavour before the handbook is shown, so it does not flicker
  const [found] = await Promise.all([locateHandbook(), store.systemState.checkState()])
  url.value = found
  loading.value = false
})
</script>

<template>
  <!-- The bottom bar is 39px high and overlays the page -->
  <iframe
    v-if="url"
    ref="frame"
    :src="url"
    title="ICOdaq Handbook"
    data-test="docs-frame"
    class="block w-full border-0"
    @load="sendVariant"
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
