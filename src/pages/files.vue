<script setup lang="ts">
/* eslint-disable max-len */
import { refreshTridentAuth } from '@/api/icoapi.ts';
import NamedInput from '@/components/inputs/NamedInput.vue';
import TextBlock from '@/components/misc/TextBlock.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { useMeasurementStore } from '@/stores/measurementStore/measurementStore.ts';
import { MeterItem } from '@/utils/dataModels.ts';
import { useLoadingHandler } from '@/utils/useLoadingHandler.ts';
import Button from 'primevue/button';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import MeterGroup from 'primevue/metergroup';
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

const meterItems = computed<MeterItem[]>(() => {
  if(!mStore.driveCapacity.total || !mStore.driveCapacity.available) return []
  return [
    {
      label: `Available: ${mStore.driveCapacity.available.toFixed(2)} GiB`,
      value: (mStore.driveCapacity.available / mStore.driveCapacity.total) * 100,
      color: 'green',
      icon: ''
    },
    {
      label: `Used: ${(mStore.driveCapacity.total - mStore.driveCapacity.available).toFixed(2)} GiB`,
      value: ((mStore.driveCapacity.total - mStore.driveCapacity.available) / mStore.driveCapacity.total * 100),
      color: 'red',
      icon: ''
    }
  ]
})

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
    <TextBlock
      heading="Measurement Files"
      :subheading="`All files found under ${mStore.measurementDirectory}`"
      button-text="Load Files"
      button-icon-class="pi pi-sync"
      :button-loading="filesLoading"
      @button-click="loadFiles"
    />
    <div class="flex flex-col gap-3">
      <div class="flex flex-row gap-3 flex-wrap">
        <NamedInput title="Drive Capacity">
          <InputGroup>
            <MeterGroup :value="meterItems" />
          </InputGroup>
        </NamedInput>
        <NamedInput
          v-if="gStore.systemState.cloud.enabled"
          title="Dataspace Connection"
          class="ml-auto"
        >
          <InputGroup>
            <InputGroupAddon>
              <span :class="authError || !gStore.systemState.cloud.healthy ? 'text-red-500' : ''">
                {{ authError || !gStore.systemState.cloud.healthy ? 'Disconnected' : 'Connected' }}
              </span>
            </InputGroupAddon>
            <Button
              v-tooltip.top="{
                value: 'Refresh the Dataspace connection'
              }"
              :severity="authError || !gStore.systemState.cloud.healthy ? 'danger' : 'primary'"
              label="Refresh"
              icon="pi pi-sync"
              outlined
              :loading="authLoading"
              @click="async () => {
                try {
                  await refreshAuth()
                  await loadFiles()
                } catch(e: any) {
                  m.error('Error refreshing Dataspace connection', errorMessage || e.message)
                }
              }"
            />
            <Button
              v-if="gStore.systemState.cloud.manage_url"
              v-tooltip.top="{
                value: 'Open the Dataspace asset management platform'
              }"
              label="Manage Assets"
              icon="pi pi-external-link"
              icon-pos="right"
              severity="primary"
              as="a"
              outlined
              :href="gStore.systemState.cloud.manage_url"
              target="_blank"
              rel="noopener norefferer"
            />
            <Button
              v-if="gStore.systemState.cloud.manage_url"
              v-tooltip.top="{
                value: 'Copy the asset management URL to clipboard'
              }"
              icon="pi pi-copy"
              severity="primary"
              outlined
              @click="copyLinkToClipboard(gStore.systemState.cloud.manage_url)"
            />
          </InputGroup>
        </NamedInput>
      </div>
      <FileTable
        :cloud="gStore.systemState.cloud"
        @needs-refresh="loadFiles"
      />
    </div>
  </DefaultLayout>
</template>

<style scoped>

</style>