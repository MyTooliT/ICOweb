<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Button from 'primevue/button';
import TextBlock from '@/components/misc/TextBlock.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { LogListResponse } from '@/client';
import {useLoadingHandler} from '@/utils/useLoadingHandler.ts';
import {getAPILink, getLogs} from '@/api/icoapi.ts';
import LogTable from '@/components/tables/LogTable.vue';
import {formatFileSize} from '../utils/helper.ts';

const logs = ref<LogListResponse|undefined>()
const { loading, call } = useLoadingHandler(getLogs)

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
    <div>
      <Button
        label="Download All"
        as="a"
        :href="`${getAPILink()}/logs/all`"
      />
    </div>
  </DefaultLayout>
</template>