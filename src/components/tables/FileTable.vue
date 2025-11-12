<script setup lang="ts">
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Button from 'primevue/button';
import { formatFileSize } from '@/utils/helper.ts';
import { format } from 'date-fns';
import {useMeasurementStore} from '@/stores/measurementStore/measurementStore.ts';
import {useDisable} from '@/utils/useDisable.ts';
import {useLoadingHandler} from '@/utils/useLoadingHandler.ts';
import {deleteMeasurementFile, uploadFile} from '@/api/icoapi.ts';
import {ref} from 'vue';
import {useRouter} from 'vue-router';
import {getAPILink} from '@/api/icoapi.ts';
import DownloadButton from '@/components/buttons/DownloadButton.vue';
import {Feature, MeasurementFileDetails} from '@/client';
const mStore = useMeasurementStore()
const router = useRouter()
const { pageEnabled } = useDisable()
const { loading: deletionLoading, call: deleteFile } = useLoadingHandler(deleteMeasurementFile)
const { loading: uploadLoading, call: upload } = useLoadingHandler(uploadFile)
const uploadedFile = ref<string>('')

const disableTooltip = ref<boolean>(false)
defineProps<{
  cloud: Feature
}>()
const emits = defineEmits<{
  (event: 'needs-refresh'): void,
}>()
</script>

<template>
  <DataTable
    v-if="mStore.measurementFiles.length > 0"
    :value="mStore.measurementFiles"
    size="small"
    removable-sort
    sort-field="created"
    :sort-order="-1"
    :paginator="true"
    :rows="10"
  >
    <Column
      field="name"
      header="Name"
      :sortable="true"
    />
    <Column
      field="created"
      header="Creation"
      :sortable="true">
      <template #body="{ data }: { data: MeasurementFileDetails }">
        {{ format(new Date(data.created), 'dd.MM.yyyy, HH:mm:ss') }}
      </template>
    </Column>
    <Column
      field="size"
      header="File Size"
      :sortable="true">
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
            v-if="cloud.enabled && cloud.healthy"
            v-tooltip.top="{
              value: data.cloud.upload_timestamp ? `Uploaded on: \n ${format(new Date(data.cloud.upload_timestamp), 'dd.MM.yyyy, HH:mm')}` : 'Upload to Data space'
            }"
            class="min-w-[15ch]"
            :disabled="data.cloud.is_uploaded"
            :label="data.cloud.is_uploaded? 'Uploaded' : 'Upload'"
            :icon="data.cloud.is_uploaded ? 'pi pi-check' : 'pi pi-cloud-upload'"
            size="small"
            rounded
            aria-label="Upload to Cloud"
            :loading="uploadLoading && uploadedFile === data.name"
            @click="async () => {
              uploadedFile = data.name
              await upload(data.name)
              emits('needs-refresh')
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
          <DownloadButton
            :link="`${getAPILink()}/files/${data.name}`"
            compact />
          <Button
            v-tooltip.top="{
              value: 'Delete Locally',
              disabled: disableTooltip
            }"
            icon="pi pi-times"
            severity="danger"
            size="small"
            rounded
            aria-label="Download"
            outlined
            :loading="deletionLoading"
            @click="async () => {
              disableTooltip = true
              await deleteFile(data.name)
              disableTooltip = false
              emits('needs-refresh')
            }"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>