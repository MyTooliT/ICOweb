<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import Button from 'primevue/button';
import ToggleSwitch from 'primevue/toggleswitch';
import TextBlock from '@/components/misc/TextBlock.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { LogListResponse } from '@/client';
import {useLoadingHandler} from '@/utils/useLoadingHandler.ts';
import {getAPILink, getLogs} from '@/api/icoapi.ts';
import LogTable from '@/components/tables/LogTable.vue';
import {formatFileSize} from '../utils/helper.ts';

const logs = ref<LogListResponse|undefined>()
const { loading, call } = useLoadingHandler(getLogs)
const includeSystemInfo = ref(true)

const downloadLogsLink = computed(
  () => `${getAPILink()}/logs/all?include_system_info=${includeSystemInfo.value}`
)

onMounted(async() => {
  logs.value = await call()
})
</script>

<template>
  <DefaultLayout>
    <TextBlock
      heading="ICOdaq Log Viewer"
      subheading="Inspect backend logs, stream live updates, or download the full file."
      button-text="Reload Logs"
      button-icon-class="pi pi-sync"
      :button-loading="loading"
      @button-click="call"
    />
    <LogTable
      v-if="logs"
      :logs="logs" />
    <div
      v-if="logs"
      class="my-3">
      <p class="flex items-start gap-3 ">
        <span class="font-semibold">Log file path:</span>
        <span>{{ logs.directory }}</span>
      </p>
      <p class="flex items-start gap-3 ">
        <span class="font-semibold">Log file size:</span>
        <span>{{ formatFileSize(logs.max_bytes) }}</span>
      </p>
      <p class="flex items-start gap-3 ">
        <span class="font-semibold">Log file backups:</span>
        <span>{{ logs.backup_count }}</span>
      </p>
    </div>
    <div class="flex flex-row items-center mb-3">
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
    <div>
      <Button
        label="Download All"
        as="a"
        :href="downloadLogsLink"
      />
    </div>
  </DefaultLayout>
</template>