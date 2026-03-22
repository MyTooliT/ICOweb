<script setup lang="ts">
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Button from 'primevue/button';
import { formatFileSize } from '@/utils/helper.ts';
import { format } from 'date-fns';
import {useMeasurementStore} from '@/stores/measurementStore/measurementStore.ts';
import {useDisable} from '@/utils/useDisable.ts';
import {useLoadingHandler} from '@/utils/useLoadingHandler.ts';
import {deleteMeasurementFile, updateFile, uploadFile} from '@/api/icoapi.ts';
import {ref} from 'vue';
import {useRouter} from 'vue-router';
import {getAPILink} from '@/api/icoapi.ts';
import DownloadButton from '@/components/buttons/DownloadButton.vue';
import {Feature, FileCloudDetails, FileCloudStatus, MeasurementFileDetails} from '@/client';
import {useMessageBus} from '@/message';

const m = useMessageBus()
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

function isDisabled(status: FileCloudStatus): boolean {
  return [
    'updating',
    'up_to_date',
    'error',
    'created'
  ].includes(status)
}

function getLabel(status: FileCloudStatus): string {
  switch (status) {
    case 'up_to_date':
      return 'Uploaded'
    case 'not_uploaded':
      return 'Upload'
    case 'outdated':
      return 'Update'
    case 'updating':
      return 'Updating'
    case 'error':
      return 'Error'
    case 'created':
      return 'Created'
    default:
      return 'Upload'
  }
}

function getIcon(status: FileCloudStatus): string {
  switch (status) {
    case 'up_to_date':
      return 'pi pi-check'
    case 'not_uploaded':
      return 'pi pi-cloud-upload'
    case 'outdated':
      return 'pi pi-sync'
    case 'updating':
      return 'pi pi-spinner pi-spin'
    case 'error':
      return 'pi pi-exclamation-triangle'
    case 'created':
      return 'pi pi-spinner pi-spin'
    default:
      return 'Upload'
  }
}

function getTooltip(details: FileCloudDetails): string {
  switch (details.status) {
    case 'up_to_date':
      if(!details.upload_timestamp) return 'Uploaded'
      return `Up-to-date version from ${format(new Date(details.upload_timestamp), 'dd.MM.yyyy, HH:mm')}.`
    case 'not_uploaded':
      return 'Upload file to Dataspace'
    case 'outdated':
      if(!details.upload_timestamp) return 'Out of date. Upload to Dataspace to update.'
      return `Out-of-date Dataspace version: \n${format(new Date(details.upload_timestamp), 'dd.MM.yyyy, HH:mm')}. \n\nYou have made changes to the file. Upload to Dataspace to update.`
    case 'updating':
      return 'The update was uploaded to the Dataspace and is currently being processed.\n\nYou may close this page and come back later to check the status.'
    case 'error':
      return 'The file has multiple matched entries on the Dataspace. This is not allowed.\n\nPlease check your Dataspace or contact support.'
    case 'created':
      return 'The file has been created on the Dataspace and is currently being processed.\n\nYou may close this page and come back later to check the status.'
    default:
      return 'Upload'
  }
}

function getSeverity(status: FileCloudStatus): string {
  switch (status) {
    case 'up_to_date':
      return 'primary'
    case 'not_uploaded':
      return 'primary'
    case 'outdated':
      return 'warn'
    case 'updating':
      return 'primary'
    case 'error':
      return 'danger'
    case 'created':
      return 'primary'
    default:
      return 'primary'
  }
}
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
              value: getTooltip(data.cloud)
            }"
            class="min-w-[15ch]"
            :disabled="isDisabled(data.cloud.status)"
            :label="getLabel(data.cloud.status)"
            :icon="getIcon(data.cloud.status)"
            :severity="getSeverity(data.cloud.status)"
            size="small"
            rounded
            :loading="uploadLoading && uploadedFile === data.name"
            @click="async () => {
              uploadedFile = data.name
              switch (data.cloud.status) {
              case 'not_uploaded':
                upload(data.name)
                  .then(async () => {
                    await mStore.getFiles()
                    m.success('File Uploaded', data.name)
                  })
                  .catch((e: Error) => m.error(e.name, e.message))
                break;
              case 'outdated':
                updateFile(data.name, data.cloud.id)
                  .then(async () => {
                    await mStore.getFiles()
                    m.success('File Update Sent', data.name)
                  })
                  .catch((e: Error) => m.error(e.name, e.message))
                break;
              default:
                break;
              }
              emits('needs-refresh')
              uploadedFile = ''
            }"
          />
          <Button
            v-if="pageEnabled('Analyze')"
            v-tooltip.top="'Analyze\n\nAnalyze the file and edit metadata and embedded elements.'"
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
            compact
            tooltip="Download

            Download the local file from the measurement folder to a different location."
          />
          <Button
            v-tooltip.top="{
              value: 'Delete Locally\n\nThis will not delete the file on the Dataspace. To do so, use the asset management platform.',
              disabled: disableTooltip
            }"
            icon="pi pi-times"
            severity="danger"
            size="small"
            rounded
            aria-label="Delete"
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