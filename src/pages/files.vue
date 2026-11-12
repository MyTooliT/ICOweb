<script setup lang="ts">
/* eslint-disable max-len */
import { refreshTridentAuth } from '@/api/icoapi.ts';
import ContentCard from '@/components/misc/ContentCard.vue';
import DefaultLayout from '@base/layout/DefaultLayout.vue';
import { useMeasurementStore } from '@/stores/measurementStore/measurementStore.ts';
import { useLoadingHandler } from '@/utils/useLoadingHandler.ts';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { computed } from 'vue';
import FileTable from '@/components/tables/FileTable.vue';
import {useGeneralStore} from '@/stores/generalStore/generalStore.ts';
import {useMessageBus} from '@/message';

const m = useMessageBus()
const mStore = useMeasurementStore()
const gStore = useGeneralStore()

const { loading: filesLoading, call: loadFiles } = useLoadingHandler(mStore.getFiles)
const { loading: authLoading, call: refreshAuth, error: authError, errorMessage } = useLoadingHandler(async () => {
  await refreshTridentAuth()
  await gStore.systemState.checkState()
})

// Drive capacity in GiB, shown as a single bar of the used space
const capacity = computed(() => {
  const { total, available } = mStore.driveCapacity
  if(!total || available === undefined || available === null) return null
  const used = total - available
  return {
    total,
    available,
    usedPercent: Math.min(100, Math.max(0, used / total * 100))
  }
})

const cloudConnected = computed<boolean>(() =>
  !authError.value && gStore.systemState.cloud.healthy
)

async function refreshCloud() {
  // The loading handler catches errors and only sets `authError`
  await refreshAuth()
  if(authError.value) {
    m.error('Error refreshing Dataspace connection', errorMessage.value)
    return
  }
  await loadFiles()
}

function copyLinkToClipboard(link: string): void {
  if (!window.navigator.clipboard) {
    m.error('Clipboard not supported', 'Your browser does not support clipboard operations.')
    return
  }

  window.navigator.clipboard.writeText(link);
  m.info('Copied to clipboard', 'The Dataspace asset management URL has been copied to your clipboard.')
}
</script>

<template>
  <DefaultLayout>
    <ContentCard
      title="Measurement Files"
      :subtitle="mStore.measurementDirectory ? `Stored in ${mStore.measurementDirectory}` : ''"
      flush
    >
      <template #title>
        <Tag
          :value="`${mStore.measurementFiles.length} files`"
          severity="secondary"
        />
      </template>
      <template #actions>
        <Button
          label="Reload"
          icon="pi pi-sync"
          size="small"
          outlined
          :loading="filesLoading"
          @click="loadFiles"
        />
      </template>
      <div
        class="flex flex-row flex-wrap items-center gap-x-8 gap-y-2 px-4 py-2
          border-b ico-divider text-sm"
      >
        <div
          v-if="capacity"
          class="flex flex-row items-center gap-3 grow min-w-64 max-w-xl"
        >
          <span class="ico-muted shrink-0">Drive</span>
          <div
            class="grow h-2 rounded-full overflow-hidden bg-surface-container-highest"
            role="meter"
            aria-label="Used drive space"
            :aria-valuenow="Math.round(capacity.usedPercent)"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div
              class="h-full rounded-full"
              :class="capacity.usedPercent > 90 ? 'bg-error' : 'bg-primary'"
              :style="{ width: `${capacity.usedPercent}%` }"
            />
          </div>
          <span class="shrink-0 whitespace-nowrap">
            {{ capacity.available.toFixed(1) }} GiB free of
            {{ capacity.total.toFixed(1) }} GiB
          </span>
        </div>
        <div
          v-if="gStore.systemState.cloud.enabled"
          class="flex flex-row items-center gap-2 ml-auto"
        >
          <span class="ico-muted">Dataspace</span>
          <Tag
            :value="cloudConnected ? 'Connected' : 'Disconnected'"
            :severity="cloudConnected ? 'success' : 'danger'"
          />
          <Button
            v-tooltip.top="'Refresh the Dataspace connection'"
            icon="pi pi-sync"
            size="small"
            text
            rounded
            aria-label="Refresh the Dataspace connection"
            :severity="cloudConnected ? 'secondary' : 'danger'"
            :loading="authLoading"
            @click="refreshCloud"
          />
          <template v-if="gStore.systemState.cloud.manage_url">
            <Button
              v-tooltip.top="'Open the Dataspace asset management platform'"
              label="Manage Assets"
              icon="pi pi-external-link"
              icon-pos="right"
              size="small"
              text
              as="a"
              :href="gStore.systemState.cloud.manage_url"
              target="_blank"
              rel="noopener noreferrer"
            />
            <Button
              v-tooltip.top="'Copy the asset management URL to clipboard'"
              icon="pi pi-copy"
              size="small"
              text
              rounded
              aria-label="Copy the asset management URL"
              @click="copyLinkToClipboard(gStore.systemState.cloud.manage_url)"
            />
          </template>
        </div>
      </div>
      <FileTable
        :cloud="gStore.systemState.cloud"
        @needs-refresh="loadFiles"
      />
      <p
        v-if="mStore.measurementFiles.length === 0"
        class="px-4 py-3 text-sm ico-muted"
      >
        {{ filesLoading ? 'Loading files...' : 'No measurement files found.' }}
      </p>
    </ContentCard>
  </DefaultLayout>
</template>
