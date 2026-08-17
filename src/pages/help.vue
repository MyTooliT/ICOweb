<script setup lang="ts">
import {getAPILink} from '@/api/icoapi.ts';
import Button from 'primevue/button';
import ToggleSwitch from 'primevue/toggleswitch';
import {computed, onMounted, ref} from 'vue';

const version = __APP_VERSION__
const versionManifest = ref<VersionManifest>()
const includeSystemInfo = ref(true)

const downloadLogsLink = computed(
  () => `${getAPILink()}/logs/all?include_system_info=${includeSystemInfo.value}`
)

onMounted(async () => {
  versionManifest.value = await window.electronAPI?.getVersionManifest()
})
</script>

<template>
  <div
    class="flex flex-col w-full justify-center items-center gap-4 h-stretch"
  >
    <h1 class="text-4xl text-primary">ICOdaq</h1>
    <h2>Graphical User Interface for Sensory Tool Holder System by MyTooliT</h2>
    <p class="text-center">
      Technische Universität Wien <br />
      Institute of Production Engineering and Photonic Technologies
    </p>
    <p>Version: {{ version }}</p>
    <div
      v-if="versionManifest"
      class="flex flex-col items-center gap-y-1 text-sm"
    >
      <h3 class="text-surface-500 uppercase tracking-wide">Components</h3>
      <p
        v-for="[name, component] in [
          ['ICOdaq', versionManifest.app],
          ['ICOapi', versionManifest.icoapi],
          ['ICOweb', versionManifest.icoweb],
        ] as [string, ComponentVersion][]"
        :key="name"
      >
        <span class="font-medium">{{ name }}</span> {{ component.describe }}
      </p>
    </div>
    <p>
      Report a bug:
      <a
        class="underline underline-offset-2"
        href="mailto:icosupport@ift.at?subject=ICOdaq bug report&body=Please think about your developers and attach log files, thank you! With that and a brief description of the issue we will make sure to get back to you ASAP. You may delete this line (after attaching log files, of course)">
        ICOsupport@ift.at
      </a>
    </p>
    <p class="font-bold">
      Please report bugs with log files attached.
    </p>
    <div class="flex flex-row items-center">
      <ToggleSwitch
        v-model="includeSystemInfo"
        input-id="include-system-info" />
      <label
        for="include-system-info"
        class="ml-3">Include System Information</label>
      <i
        v-tooltip.top="{
          value: 'Adds a system_info.json file to the download with your OS version, CPU/memory/disk stats, hostname, and the installed versions of ICOdaq\'s components.\n\nThis helps us reproduce environment-specific bugs (e.g. issues tied to a particular Windows version or low disk space). It is only collected when you download logs, never stored or tracked automatically.'
        }"
        class="pi pi-info-circle ml-2" />
    </div>
    <Button
      label="Download Logs"
      as="a"
      outlined
      icon="pi pi-download"
      link
      :href="downloadLogsLink"
    />
  </div>
</template>