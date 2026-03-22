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
import {useToast} from 'primevue/usetoast';

const toast = useToast()
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
  return status === 'up_to_date' || status === 'updating';
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
                await upload(data.name);
                toast.add({
                  severity: 'success',
                  summary: 'Uploaded File',
                  detail: data.name,
                  life: 1500,
                  group: 'default'
                })
                break;
              case 'outdated':
                await updateFile(
                  data.name,
                  data.cloud.id
                )
                toast.add({
                  severity: 'success',
                  summary: 'Updated File',
                  detail: data.name,
                  life: 1500,
                  group: 'default'
                })
                break;
              default:
                toast.add({
                  severity: 'error',
                  summary: 'Tried updating an up-to-date file',
                  detail: data.name,
                  life: 1500,
                  group: 'default'
                })
                break;
              }
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