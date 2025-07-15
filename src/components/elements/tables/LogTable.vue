<script setup lang="ts">
import { ref, nextTick } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ProgressSpinner from 'primevue/progressspinner';
import { LogFileMeta, LogListResponse } from '@/client';
import {getAPILink, getLog} from '@/api/icoapi.ts';
import {formatFileSize} from '../../../utils/helper.ts';
import DownloadButton from '@/components/elements/buttons/DownloadButton.vue';

const loadingList = ref(false);
const expandedRows = ref<LogFileMeta[]>([]);
const logContents = ref<Record<string, string>>({});
const loadingLog = ref<Record<string, boolean>>({});
const logArea = ref<HTMLElement>();

defineProps<{
  logs: LogListResponse
}>()

async function onRowExpand(e: { data: LogFileMeta }) {
  const file = e.data.name;
  loadingLog.value[file] = true;

  try {
    const result = await getLog(file)
    logContents.value[file] = result.content
  } finally {
    loadingLog.value[file] = false;
    await nextTick();
    if(logArea.value) {
      logArea.value.scrollTop = logArea.value.scrollHeight
    }
  }
}

function onRowCollapse(e: { data: LogFileMeta }) {
  const file = e.data.name;
  delete logContents.value[file]
}

const formatTimestamp = (ts: string): string => {
  const date = new Date(ts);
  return new Intl.DateTimeFormat('default', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};
</script>


<template>
  <DataTable
    v-if="logs"
    v-model:expanded-rows="expandedRows"
    :value="logs?.files"
    data-key="name"
    responsive-layout="scroll"
    :loading="loadingList"
    row-expansion
    @row-expand="onRowExpand"
    @row-collapse="onRowCollapse"
  >
    <Column
      expander
      class="w-12" />
    <Column
      field="name"
      header="Filename" />
    <Column
      header="Size">
      <template #body="{ data }: { data: LogFileMeta }">
        {{ formatFileSize(data.size) }}
      </template>
    </Column>
    <Column
      header="Timeframe">
      <template
        #body="{ data }: { data: LogFileMeta }">
        <span v-if="data.first_timestamp && data.last_timestamp">
          {{ formatTimestamp(data.first_timestamp) }} - {{ formatTimestamp(data.last_timestamp) }}
        </span>
      </template>
    </Column>
    <Column
      header="Actions">
      <template
        #body="{ data }: { data: LogFileMeta }">
        <DownloadButton
          compact
          :link="`${getAPILink()}/logs/download/${data.name}`" />
      </template>
    </Column>
    <template #expansion="slotProps">
      <div class="p-4 bg-gray-900 rounded">
        <div
          v-if="loadingLog[slotProps.data.name]"
          class="flex items-center justify-center h-80">
          <ProgressSpinner />
        </div>
        <pre
          v-else
          ref="logArea"
          class="text-green-200 text-xs max-h-80 overflow-auto font-mono p-2 bg-black border rounded w-full"
        >{{ logContents[slotProps.data.name] }}</pre>
      </div>
    </template>
  </DataTable>
</template>
