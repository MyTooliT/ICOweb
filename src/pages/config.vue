<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import TextBlock from '@/components/misc/TextBlock.vue';
import {getAPILink, getConfigBackup, restoreConfigBackup} from '@/api/icoapi.ts';
import {onMounted, ref} from 'vue';
import {ConfigFileBackup, ConfigFileInfoHeader, ConfigResponse} from '@/client';
import {DataTable, Column, Card, FileUpload, Button, Panel, Fieldset, Badge, useToast} from 'primevue';
import {format} from 'date-fns';
import {useLoadingHandler} from '@/utils/useLoadingHandler.ts';
import AnnotatedDisplay from '@/components/displayable/AnnotatedDisplay.vue';

const toast = useToast()

const backup = ref<ConfigResponse|undefined>()
const uploading = ref<boolean>(false)
const { loading: backupLoading, call: getBackup } = useLoadingHandler(async () => {
  backup.value = await getConfigBackup()
})
const { loading: restoreLoading, call: restore } = useLoadingHandler(async (filename: string, backup_filename: string) => {
  await restoreConfigBackup({
    filename: filename,
    backup_filename: backup_filename,
  })
  await getBackup()
})

function assembleConfigMessage(header: ConfigFileInfoHeader) {
  return `${header.config_name} V${header.config_version} from date ${format(new Date(header.config_date), 'dd.MM.yyyy, HH:mm:ss')} activated successfully.`
}

onMounted(async() => await getBackup())
</script>

<template>
  <DefaultLayout>
    <TextBlock
      heading="Configuration"
      subheading="Upload and restore configuration files for sensors, metadata and environment variables."
      :button="true"
      button-text="Reload Configuration"
      button-icon-class="pi pi-sync"
      :button-loading="backupLoading"
      @button-click="async () => await getBackup()"
    />
    <div
      v-if="backup"
      class="flex flex-col gap-3">
      <Card
        v-for="configFile in backup.files"
        :key="configFile.filename"
      >
        <template #title>
          <h2> {{ configFile.name }} </h2>
        </template>
        <template #subtitle>
          <h3> {{ configFile.description }} </h3>
        </template>
        <template #content>
          <div class="flex flex-col gap-3">
            <Fieldset
              legend="Currently Active Configuration"
              :pt="{
                root: {
                  class: '!border-gray-400'
                }
              }">
              <div
                v-if="configFile.info_header"
                class="flex flex-row gap-3 justify-between p-3">
                <AnnotatedDisplay
                  :content="configFile.info_header.config_name"
                  annotation="Configuration Name:" />
                <AnnotatedDisplay
                  :content="format(new Date(configFile.info_header.config_date), 'dd.MM.yyyy, HH:mm:ss')"
                  annotation="Configuration Date:" />
                <AnnotatedDisplay
                  :content="configFile.info_header.config_version"
                  annotation="Configuration Version:" />
                <AnnotatedDisplay
                  :content="`${configFile.info_header.schema_name} / ${configFile.info_header.schema_version}`"
                  annotation="File Schema:" />
              </div>
              <p v-else>
                <span class="font-bold">Current File: </span>{{ format(new Date(configFile.timestamp), 'dd.MM.yyyy, HH:mm:ss') }}
              </p>
            </Fieldset>
            <Fieldset legend="Upload New Configuration">
              <FileUpload
                name="file"
                :preview-width="0"
                choose-label="Select New File"
                :url="`${getAPILink()}/config/${configFile.endpoint}`"
                :max-file-size="1000000"
                :file-limit="1"
                :pt="{
                  content: {
                    class: '!hidden'
                  },
                  root: {
                    class: '!border-0'
                  },
                  header: {
                    class: '!p-3'
                  }
                }"
                class="border-0"
                @before-upload="uploading = true"
                @error="e => {
                  uploading = false;
                  toast.add({ severity: 'error', summary: 'Upload Error', detail: JSON.parse(e.xhr.response).detail, life: 15000, group: 'default' })
                }"
                @upload="e => {
                  uploading = false
                  toast.add({
                    severity: 'success',
                    summary: 'Configuration Uploaded',
                    life: 15000,
                    group: 'default' ,
                    detail: assembleConfigMessage((JSON.parse(e.xhr.response) as ConfigFileInfoHeader)),
                  })
                }">
                <template #header="{ uploadCallback, chooseCallback, files, uploadedFiles }">
                  <div class="flex flex-row gap-3 w-full">
                    <Button
                      label="Select File"
                      icon="pi pi-plus"
                      @click="chooseCallback"
                    />
                    <div
                      v-if="uploadedFiles.length < files.length"
                      class="flex flex-col justify-center">
                      <div
                        v-for="file in files"
                        :key="file.name">
                        Selected File: <span class="font-bold">{{ file.name }}</span>
                        <Badge
                          value="Awaiting Upload"
                          severity="warn"
                          class="ml-1" />
                      </div>
                    </div>
                    <Button
                      label="Upload"
                      icon="pi pi-upload"
                      :disabled="!files || files.length === 0"
                      @click="uploadCallback"
                    />
                  </div>
                </template>
                <template #content="{ messages }">
                  <div v-if="messages && messages.length > 0">
                    <p
                      v-for="message in messages"
                      :key="message">
                      {{ message }}
                    </p>
                  </div>
                  <div v-else />
                </template>
              </FileUpload>
            </Fieldset>
            <Panel
              header="Configuration File Backups"
              toggleable
              collapsed
            >
              <DataTable
                :value="configFile.backup"
                paginator
                :rows="5"
              >
                <Column
                  header="Configuration Name"
                  field="info_header.config_name"
                />
                <Column
                  header="Configuration Date"
                >
                  <template #body="{ data }: { data: ConfigFileBackup }">
                    {{ data.info_header
                      ? format(new Date(data.info_header.config_date), 'dd.MM.yyyy, HH:mm:ss')
                      : format(new Date(data.timestamp), 'dd.MM.yyyy, HH:mm:ss')
                    }}
                  </template>
                </Column>
                <Column
                  header="Configuration Version"
                  field="info_header.config_version"
                />
                <Column
                  header="File Schema"
                >
                  <template #body="{ data }: { data: ConfigFileBackup }">
                    <span v-if="data.info_header">
                      {{ data.info_header.schema_name }} <br>{{ data.info_header.schema_version }}
                    </span>
                  </template>
                </Column>
                <Column
                  header="Actions"
                >
                  <template #body="{ data }: { data: ConfigFileBackup }">
                    <Button
                      label="Restore"
                      variant="outlined"
                      rounded
                      :loading="restoreLoading"
                      @click="restore(configFile.filename, data.filename)"
                    />
                  </template>
                </Column>
              </DataTable>
            </Panel>
          </div>
        </template>
      </Card>
    </div>
  </DefaultLayout>
</template>