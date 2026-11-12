<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import Button from 'primevue/button';
import ToggleSwitch from 'primevue/toggleswitch';
import DefaultLayout from '@base/layout/DefaultLayout.vue';
import { LogListResponse } from '@/client';
import {useLoadingHandler} from '@/utils/useLoadingHandler.ts';
import {getAPILink, getLogs} from '@/api/icoapi.ts';
import ContentCard from '@/components/misc/ContentCard.vue';
import LogTable from '@/components/tables/LogTable.vue';
import {formatFileSize} from '../utils/helper.ts';

const logs = ref<LogListResponse|undefined>()
const { loading, call } = useLoadingHandler(getLogs)
const includeSystemInfo = ref(true)

const downloadLogsLink = computed(
  () => `${getAPILink()}/logs/all?include_system_info=${includeSystemInfo.value}`
)

async function reload() {
  logs.value = await call()
}

onMounted(reload)
</script>

<template>
  <DefaultLayout>
    <ContentCard
      title="Logs"
      subtitle="Log files of the ICOapi backend. Expand a file to view its content."
      flush
    >
      <template #actions>
        <label
          for="include-system-info"
          class="flex flex-row items-center gap-2 text-sm"
        >
          <ToggleSwitch
            v-model="includeSystemInfo"
            input-id="include-system-info" />
          Include system information
          <i
            v-tooltip.top="{
              value: 'Adds a system_info.json file to the download with your OS version, CPU/memory/disk stats, hostname, and the installed versions of ICOdaq\'s components.\n\nThis helps us reproduce environment-specific bugs (e.g. issues tied to a particular Windows version or low disk space). It is only collected when you download logs, never stored or tracked automatically.'
            }"
            class="pi pi-info-circle ico-muted" />
        </label>
        <Button
          label="Download All"
          icon="pi pi-download"
          size="small"
          as="a"
          :href="downloadLogsLink"
        />
        <Button
          label="Reload"
          icon="pi pi-sync"
          size="small"
          outlined
          :loading="loading"
          @click="reload"
        />
      </template>
      <LogTable
        v-if="logs"
        :logs="logs" />
      <p
        v-else
        class="px-4 py-3 text-sm ico-muted"
      >
        {{ loading ? 'Loading logs...' : 'No logs loaded.' }}
      </p>
      <template
        v-if="logs"
        #footer
      >
        <dl class="flex flex-row flex-wrap gap-x-6 gap-y-1">
          <div class="flex flex-row gap-1.5 min-w-0">
            <dt>Directory</dt>
            <dd class="font-mono text-[var(--p-content-color)] [overflow-wrap:anywhere]">
              {{ logs.directory }}
            </dd>
          </div>
          <div class="flex flex-row gap-1.5">
            <dt>Max. file size</dt>
            <dd class="text-[var(--p-content-color)]">
              {{ formatFileSize(logs.max_bytes) }}
            </dd>
          </div>
          <div class="flex flex-row gap-1.5">
            <dt>Backups</dt>
            <dd class="text-[var(--p-content-color)]">
              {{ logs.backup_count }}
            </dd>
          </div>
        </dl>
      </template>
    </ContentCard>
  </DefaultLayout>
</template>
