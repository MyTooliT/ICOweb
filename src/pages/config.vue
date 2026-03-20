<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import TextBlock from '@/components/misc/TextBlock.vue';
import {getAPILink, getConfigBackup, restoreConfigBackup} from '@/api/icoapi.ts';
import {onMounted, ref} from 'vue';
import {ConfigFileBackup, ConfigFileInfoHeader, ConfigResponse} from '@/client';
import {
  DataTable,
  Column,
  Card,
  Button,
  Panel,
  Fieldset,
  useToast,
  FileUploadUploadEvent, FileUploadErrorEvent
} from 'primevue';
import {format} from 'date-fns';
import {useLoadingHandler} from '@/utils/useLoadingHandler.ts';
import AnnotatedDisplay from '@/components/displayable/AnnotatedDisplay.vue';
import CustomFileUpload from '@/components/forms/CustomFileUpload.vue';

const toast = useToast()

const backup = ref<ConfigResponse|undefined>()
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
              <CustomFileUpload 
                :url="`${getAPILink()}/config/${configFile.endpoint}`"
                :max-file-size="1000000"
                :file-limit="1"
                @success="(e: FileUploadUploadEvent) => toast.add({
                  severity: 'success',
                  summary: 'Configuration Uploaded',
                  life: 15000,
                  group: 'default' ,
                  detail: assembleConfigMessage((JSON.parse(e.xhr.response) as ConfigFileInfoHeader)),
                })"
                @error="(e: FileUploadErrorEvent) => toast.add({
                  severity: 'error',
                  summary: 'Upload Error',
                  detail: JSON.parse(e.xhr.response).detail,
                  life: 15000,
                  group: 'default'
                })"
              />
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