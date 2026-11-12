<script setup lang="ts">
import DefaultLayout from '@base/layout/DefaultLayout.vue';
import {getAPILink, getConfigBackup, restoreConfigBackup} from '@/api/icoapi.ts';
import {onMounted, ref} from 'vue';
import {ConfigFile, ConfigFileBackup, ConfigFileInfoHeader, ConfigResponse} from '@/client';
import {
  DataTable,
  Column,
  Button,
  Tag
} from 'primevue';
import {format} from 'date-fns';
import {useLoadingHandler} from '@/utils/useLoadingHandler.ts';
import ContentCard from '@/components/misc/ContentCard.vue';
import {useMessageBus} from '@/message';

const m = useMessageBus()

const backup = ref<ConfigResponse|undefined>()
const { loading: backupLoading, call: getBackup } = useLoadingHandler(async () => {
  backup.value = await getConfigBackup()
})

// Backup that is being restored (`<config file>/<backup file>`)
const restoring = ref<string | null>(null)
async function restore(filename: string, backupFilename: string) {
  restoring.value = `${filename}/${backupFilename}`
  try {
    await restoreConfigBackup({
      filename: filename,
      backup_filename: backupFilename,
    })
    m.success('Configuration Restored', `${backupFilename} is now the active configuration.`)
    await getBackup()
  } catch {
    // The API layer already shows the error
  } finally {
    restoring.value = null
  }
}

function formatDate(date: string): string {
  return format(new Date(date), 'dd.MM.yyyy, HH:mm:ss')
}

function assembleConfigMessage(header: ConfigFileInfoHeader) {
  return `${header.config_name} V${header.config_version} from date ${formatDate(header.config_date)} activated successfully.`
}

/*
 * Upload of a new configuration file, per config file: select (or drop) a
 * file, then upload it
 */
const selectedFiles = ref<Record<string, File | undefined>>({})
const uploading = ref<string | null>(null)
const dragOver = ref<string | null>(null)
const fileInputs = new Map<string, HTMLInputElement>()

function setFileInput(name: string, element: unknown) {
  if (element) fileInputs.set(name, element as HTMLInputElement)
  else fileInputs.delete(name)
}

function selectFile(configFile: ConfigFile, files: FileList | null | undefined) {
  selectedFiles.value[configFile.filename] = files?.[0]
}

function onDrop(configFile: ConfigFile, event: DragEvent) {
  dragOver.value = null
  selectFile(configFile, event.dataTransfer?.files)
}

function clearSelection(configFile: ConfigFile) {
  selectedFiles.value[configFile.filename] = undefined
  const input = fileInputs.get(configFile.filename)
  if (input) input.value = ''
}

async function upload(configFile: ConfigFile) {
  const file = selectedFiles.value[configFile.filename]
  if (!file) return
  uploading.value = configFile.filename
  try {
    const body = new FormData()
    body.append('file', file)
    const response = await fetch(`${getAPILink()}/config/${configFile.endpoint}`, {
      method: 'POST',
      body
    })
    const text = await response.text()
    if (!response.ok) {
      let detail = text || response.statusText
      try {
        detail = JSON.parse(text).detail ?? detail
      } catch {
        // Keep the plain text
      }
      m.error('Configuration Upload Failed', typeof detail === 'string' ? detail : JSON.stringify(detail))
      return
    }
    m.success('Configuration Uploaded', assembleConfigMessage(JSON.parse(text) as ConfigFileInfoHeader))
    clearSelection(configFile)
    await getBackup()
  } catch(e: any) {
    m.error('Configuration Upload Failed', e?.message ?? 'The file could not be uploaded.')
  } finally {
    uploading.value = null
  }
}

// The reload button of a card reloads all configuration files, but only the
// clicked one shows the loading state
const reloading = ref<string | null>(null)
async function reload(configFile: ConfigFile) {
  reloading.value = configFile.filename
  await getBackup()
  reloading.value = null
}

// Backups are folded away by default
const expandedBackups = ref<Record<string, boolean>>({})

onMounted(async() => await getBackup())
</script>

<template>
  <DefaultLayout>
    <div class="flex flex-col gap-3">
      <ContentCard
        v-if="!backup"
        title="Configuration"
        class="max-w-md mx-auto mt-[15vh]"
      >
        <p class="text-sm ico-muted mb-3">
          {{ backupLoading ? 'Loading configuration...' : 'The configuration could not be loaded.' }}
        </p>
        <Button
          label="Reload"
          icon="pi pi-sync"
          size="small"
          outlined
          :loading="backupLoading"
          @click="getBackup"
        />
      </ContentCard>
      <template v-else>
        <ContentCard
          v-for="configFile in backup.files"
          :key="configFile.filename"
          :title="configFile.name"
          :subtitle="configFile.description"
          flush
        >
          <template #actions>
            <Button
              v-tooltip.left="'Reload the configuration from the API'"
              label="Reload"
              icon="pi pi-sync"
              size="small"
              outlined
              :loading="backupLoading && reloading === configFile.filename"
              :disabled="backupLoading"
              @click="reload(configFile)"
            />
          </template>
          <template #title>
            <Tag
              :value="configFile.filename"
              severity="secondary"
              class="!font-mono !font-normal"
            />
          </template>

          <!-- Active configuration -->
          <dl
            v-if="configFile.info_header"
            class="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 px-4 py-3 text-sm"
          >
            <div class="min-w-0">
              <dt class="text-xs ico-muted">
                Active configuration
              </dt>
              <dd class="font-medium [overflow-wrap:anywhere]">
                {{ configFile.info_header.config_name }}
              </dd>
            </div>
            <div>
              <dt class="text-xs ico-muted">
                Version
              </dt>
              <dd class="font-medium">
                {{ configFile.info_header.config_version }}
              </dd>
            </div>
            <div>
              <dt class="text-xs ico-muted">
                Date
              </dt>
              <dd class="font-medium">
                {{ formatDate(configFile.info_header.config_date) }}
              </dd>
            </div>
            <div class="min-w-0">
              <dt class="text-xs ico-muted">
                Schema
              </dt>
              <dd class="font-medium [overflow-wrap:anywhere]">
                {{ configFile.info_header.schema_name }}
                {{ configFile.info_header.schema_version }}
              </dd>
            </div>
          </dl>
          <dl
            v-else
            class="px-4 py-3 text-sm"
          >
            <dt class="text-xs ico-muted">
              Active file from
            </dt>
            <dd class="font-medium">
              {{ formatDate(configFile.timestamp) }}
            </dd>
          </dl>

          <!-- Upload of a new configuration -->
          <div
            class="flex flex-row flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5
              border-t ico-divider text-sm transition-colors"
            :class="{ 'bg-primary/10': dragOver === configFile.filename }"
            @dragover.prevent="dragOver = configFile.filename"
            @dragleave="dragOver = null"
            @drop.prevent="onDrop(configFile, $event)"
          >
            <span class="ico-muted shrink-0">New configuration</span>
            <input
              :ref="(element) => setFileInput(configFile.filename, element)"
              type="file"
              class="hidden"
              @change="selectFile(configFile, ($event.target as HTMLInputElement).files)"
            >
            <Button
              label="Select File"
              icon="pi pi-plus"
              size="small"
              outlined
              :disabled="uploading === configFile.filename"
              @click="fileInputs.get(configFile.filename)?.click()"
            />
            <span
              v-if="selectedFiles[configFile.filename]"
              class="flex flex-row items-center gap-1 min-w-0"
            >
              <span class="font-mono truncate">
                {{ selectedFiles[configFile.filename]?.name }}
              </span>
              <Button
                icon="pi pi-times"
                size="small"
                text
                rounded
                severity="secondary"
                aria-label="Clear selection"
                :disabled="uploading === configFile.filename"
                @click="clearSelection(configFile)"
              />
            </span>
            <span
              v-else
              class="ico-muted"
            >
              or drop a file here
            </span>
            <Button
              label="Upload"
              icon="pi pi-upload"
              size="small"
              outlined
              class="ml-auto"
              :disabled="!selectedFiles[configFile.filename]"
              :loading="uploading === configFile.filename"
              @click="upload(configFile)"
            />
          </div>

          <!-- Backups -->
          <button
            type="button"
            class="flex flex-row items-center gap-2 w-full px-4 py-2.5 border-t
              ico-divider text-sm text-left cursor-pointer hover:bg-surface-container-low"
            :aria-expanded="!!expandedBackups[configFile.filename]"
            @click="expandedBackups[configFile.filename] = !expandedBackups[configFile.filename]"
          >
            <i
              class="pi text-xs ico-muted"
              :class="expandedBackups[configFile.filename] ? 'pi-chevron-down' : 'pi-chevron-right'"
            />
            Backups
            <Tag
              :value="configFile.backup.length"
              severity="secondary"
            />
          </button>
          <div
            v-if="expandedBackups[configFile.filename]"
            class="border-t ico-divider"
          >
            <DataTable
              v-if="configFile.backup.length > 0"
              :value="configFile.backup"
              size="small"
              paginator
              :rows="5"
            >
              <Column
                header="Name"
                field="info_header.config_name"
              />
              <Column header="Date">
                <template #body="{ data }: { data: ConfigFileBackup }">
                  {{ formatDate(data.info_header ? data.info_header.config_date : data.timestamp) }}
                </template>
              </Column>
              <Column
                header="Version"
                field="info_header.config_version"
              />
              <Column header="Schema">
                <template #body="{ data }: { data: ConfigFileBackup }">
                  <span v-if="data.info_header">
                    {{ data.info_header.schema_name }} {{ data.info_header.schema_version }}
                  </span>
                </template>
              </Column>
              <Column class="w-0">
                <template #body="{ data }: { data: ConfigFileBackup }">
                  <Button
                    label="Restore"
                    icon="pi pi-replay"
                    size="small"
                    outlined
                    rounded
                    :loading="restoring === `${configFile.filename}/${data.filename}`"
                    :disabled="restoring !== null"
                    @click="restore(configFile.filename, data.filename)"
                  />
                </template>
              </Column>
            </DataTable>
            <p
              v-else
              class="px-4 py-2.5 text-sm ico-muted"
            >
              No backups yet. Uploading or restoring a configuration moves the
              previously active file here.
            </p>
          </div>
        </ContentCard>
      </template>
    </div>
  </DefaultLayout>
</template>
