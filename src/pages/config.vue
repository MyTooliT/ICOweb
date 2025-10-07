<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import TextBlock from '@/components/misc/TextBlock.vue';
import {getAPILink, getConfigBackup, restoreConfigBackup} from '@/api/icoapi.ts';
import {onMounted, ref} from 'vue';
import {ConfigFileBackup, ConfigResponse} from '@/client';
import {DataTable, Column, Card, FileUpload, Button, Panel, Fieldset} from 'primevue';
import {format} from 'date-fns';
import {useLoadingHandler} from '@/utils/useLoadingHandler.ts';

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
            <Fieldset legend="Currently Active Configuration">
              <div
                v-if="configFile.info_header"
                class="flex flex-row gap-3 justify-between">
                <div>
                  <div>Schema Name:</div>
                  <div class="font-bold">
                    {{ configFile.info_header.schema_name }}
                  </div>
                </div>
                <div>
                  <div>Schema Version:</div>
                  <div class="font-bold">
                    {{ configFile.info_header.schema_version }}
                  </div>
                </div>
                <div>
                  <div>Configuration Name:</div>
                  <div class="font-bold">
                    {{ configFile.info_header.config_name }}
                  </div>
                </div>
                <div>
                  <div>Configuration Date:</div>
                  <div class="font-bold">
                    {{ format(new Date(configFile.info_header.config_date), 'dd.MM.yyyy, HH:mm:ss') }}
                  </div>
                </div>
              </div>
              <p v-else>
                <span class="font-bold">Current File: </span>{{ format(new Date(configFile.timestamp), 'dd.MM.yyyy, HH:mm:ss') }}
              </p>
            </Fieldset>
            <FileUpload
              name="file"
              :preview-width="0"
              choose-label="Select New File"
              :url="`${getAPILink()}/config/${configFile.endpoint}`"
              :max-file-size="1000000"
              @before-upload="uploading = true"
              @upload="uploading = false">
              <template #empty>
                <div class="mt-4">
                  <span>Drag and drop files to here to upload.</span>
                </div>
              </template>
            </FileUpload>
            <Panel
              header="Backup Files"
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