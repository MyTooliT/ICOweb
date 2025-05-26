<script setup lang="ts">
/* eslint-disable max-len */
import { getCloudFiles, refreshTridentAuth } from '@/api/icoapi.ts';
import NamedInput from '@/components/elements/forms/NamedInput.vue';
import TextBlock from '@/components/elements/misc/TextBlock.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { useMeasurementStore } from '@/stores/measurementStore/measurementStore.ts';
import { MeterItem } from '@/utils/dataModels.ts';
import { useLoadingHandler } from '@/utils/useLoadingHandler.ts';
import Button from 'primevue/button';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import MeterGroup from 'primevue/metergroup';
import { computed } from 'vue';
import {useDisable} from '@/utils/useDisable.ts';
import FileTable from '@/components/elements/tables/FileTable.vue';
import {useGeneralStore} from '@/stores/generalStore/generalStore.ts';
import {useToast} from 'primevue/usetoast';

const ts = useToast()
const { featureEnabled } = useDisable()
const mStore = useMeasurementStore()
const gStore = useGeneralStore()

const { loading: filesLoading, call: loadFiles } = useLoadingHandler(mStore.getFiles)
const { loading: authLoading, call: refreshAuth, error: authError, errorMessage } = useLoadingHandler(refreshTridentAuth)

const meterItems = computed<MeterItem[]>(() => {
  if(!mStore.driveCapacity.total || !mStore.driveCapacity.available) return []
  return [
    {
      label: `Available: ${mStore.driveCapacity.available.toFixed(2)} GB`,
      value: (mStore.driveCapacity.available / mStore.driveCapacity.total) * 100,
      color: 'green',
      icon: ''
    },
    {
      label: `Used: ${(mStore.driveCapacity.total - mStore.driveCapacity.available).toFixed(2)} GB`,
      value: ((mStore.driveCapacity.total - mStore.driveCapacity.available) / mStore.driveCapacity.total * 100),
      color: 'red',
      icon: ''
    }
  ]
})
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
          v-if="featureEnabled('Cloud')"
          title="Data Space Connection"
          class="ml-auto"
        >
          <InputGroup>
            <InputGroupAddon>
              <span :class="authError || !gStore.systemState.cloud_ready ? 'text-red-500' : ''">
                {{ authError || !gStore.systemState.cloud_ready ? 'Disconnected' : 'Connected' }}
              </span>
            </InputGroupAddon>
            <Button
              :severity="authError || !gStore.systemState.cloud_ready ? 'danger' : 'primary'"
              label="Refresh"
              icon="pi pi-sync"
              outlined
              :loading="authLoading"
              @click="async () => {
                try {
                  await refreshAuth()
                  await getCloudFiles()
                } catch(e: any) {
                  ts.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: errorMessage,
                    life: 5000,
                    group: 'default'
                  })
                }
              }"
            />
          </InputGroup>
        </NamedInput>
      </div>
      <FileTable
        :auth-error="authError || !gStore.systemState.cloud_ready"
        @needs-refresh="loadFiles"
      />
    </div>
  </DefaultLayout>
</template>

<style scoped>

</style>