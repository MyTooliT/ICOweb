<script setup lang="ts">
/* eslint-disable max-len */
import {getAPILink, getCloudFiles, refreshTridentAuth, uploadFile} from '@/api/icoapi.ts';
import { deleteMeasurementFile } from '@/api/icoapi.ts';
import { MeasurementFileDetails } from '@/client';
import NamedInput from '@/components/elements/forms/NamedInput.vue';
import TextBlock from '@/components/elements/misc/TextBlock.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { useMeasurementStore } from '@/stores/measurementStore/measurementStore.ts';
import { MeterItem } from '@/utils/dataModels.ts';
import { formatFileSize } from '@/utils/helper.ts';
import { useLoadingHandler } from '@/utils/useLoadingHandler.ts';
import { format } from 'date-fns';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import MeterGroup from 'primevue/metergroup';
import {
  computed, ref
} from 'vue';
import { useRouter } from 'vue-router';
import {useDisable} from '@/utils/useDisable.ts';

const { pageEnabled, featureEnabled } = useDisable()
const router = useRouter();
const mStore = useMeasurementStore()

const { loading: filesLoading, call: loadFiles } = useLoadingHandler(mStore.getFiles)
const { loading: deletionLoading, call: deleteFile } = useLoadingHandler(deleteMeasurementFile)
const { loading: authLoading, call: refreshAuth } = useLoadingHandler(refreshTridentAuth)
const { loading: uploadLoading, call: upload } = useLoadingHandler(uploadFile)
const uploadedFile = ref<string>('')

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
              Connected
            </InputGroupAddon>
            <Button
              label="Refresh"
              icon="pi pi-sync"
              outlined
              :loading="authLoading"
              @click="async () => {
                await refreshAuth()
                await getCloudFiles()
              }"
            />
          </InputGroup>
        </NamedInput>
      </div>
      <DataTable
        v-if="mStore.measurementFiles.length > 0"
        :value="mStore.measurementFiles"
        size="small"
        removable-sort
        sort-field="created"
        :sort-order="-1"
      >
        <Column
          field="name"
          header="Name"
          sortable />
        <Column
          field="created"
          header="Creation"
          sortable>
          <template #body="{ data }: { data: MeasurementFileDetails }">
            {{ format(new Date(data.created), 'dd.MM.yyyy, HH:mm:ss') }}
          </template>
        </Column>
        <Column
          field="size"
          header="File Size"
          sortable>
          <template #body="{ data }: { data: MeasurementFileDetails }">
            {{ formatFileSize(data.size) }}
          </template>
        </Column>
        <Column
          header="Actions"
        >
          <template #body="{ data }: { data: MeasurementFileDetails }">
            <div class="flex flex-row gap-2">
              <Button
                v-if="featureEnabled('Cloud')"
                v-tooltip.top="{
                  value: data.cloud.upload_timestamp ? `Uploaded on: \n ${format(new Date(data.cloud.upload_timestamp), 'dd.MM.yyyy, HH:mm')}` : 'Upload to Data space'
                }"
                class="min-w-[24ch]"
                :disabled="data.cloud.is_uploaded"
                :label="data.cloud.is_uploaded? 'Uploaded' : 'Data space Upload'"
                :icon="data.cloud.is_uploaded ? 'pi pi-check' : 'pi pi-cloud-upload'"
                size="small"
                rounded
                aria-label="Upload to Cloud"
                :loading="uploadLoading && uploadedFile === data.name"
                @click="async () => {
                  uploadedFile = data.name
                  await upload(data.name)
                  await loadFiles()
                  uploadedFile = ''
                }"
              />
              <Button
                v-if="pageEnabled('Analyze')"
                v-tooltip.top="'Analyze'"
                icon="pi pi-search-plus"
                as="a"
                size="small"
                rounded
                aria-label="Analyze File"
                outlined
                @click.prevent="router.push(`/analyze?file=${data.name}`)"
              />
              <Button
                v-tooltip.top="'Download'"
                icon="pi pi-download"
                as="a"
                download
                :href="`${getAPILink()}/files/${data.name}`"
                size="small"
                rounded
                aria-label="Download"
                outlined
              />
              <Button
                v-tooltip.top="'Delete Locally'"
                icon="pi pi-times"
                severity="danger"
                size="small"
                rounded
                aria-label="Download"
                outlined
                :loading="deletionLoading"
                @click="async () => {
                  await deleteFile(data.name)
                  await loadFiles()
                }"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </DefaultLayout>
</template>

<style scoped>

</style>