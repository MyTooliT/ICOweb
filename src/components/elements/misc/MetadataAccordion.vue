<script setup lang="ts">
import Image from 'primevue/image';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import mime from 'mime';
import {Accordion, AccordionContent, AccordionHeader, AccordionPanel} from 'primevue';
import {ParsedMetadata} from '@/client';
import {Sensor} from '@/stores/hardwareStore/classes/Sensor.ts';
import 'vue3-json-viewer/dist/vue3-json-viewer.css';
import {capitalize, onMounted, ref, watch} from 'vue';
import {useYamlConfig} from '@/utils/useYamlConfig.ts';
import MetaForm from '@/components/elements/forms/meta/MetaForm.vue';
import {computeValidity, ProfileDefinition} from '@/utils/metadataConfig.ts';

const props = defineProps<{
  parsedMetadata: ParsedMetadata
}>()

const sensorColumns = props.parsedMetadata.sensors[0]
    ? Object.keys(props.parsedMetadata.sensors[0]).map((key: string) => {
      return {
        field: key,
        header: key
      }
    })
    : []

const { config, reload } = useYamlConfig()
const metadataProfile = ref<ProfileDefinition|undefined>()
const preMetadata = ref<Record<string,any>>({})
const preMetadataValidity = ref<boolean>(false)
const preMetadataEditable = ref<boolean>(false)
const postMetadata = ref<Record<string,any>>({})
const postMetadataValidity = ref<boolean>(false)
const postMetadataEditable = ref<boolean>(false)

onMounted(async () => {
  await reload()
})

watch(props, async () => {
  await reload()
  if(!config.value) return
  preMetadata.value = props.parsedMetadata.acceleration.attributes['pre_metadata'] as Record<string,any>
  metadataProfile.value = Object.values(config.value.profiles).find((p: ProfileDefinition) => p.id === preMetadata.value['profile'])
  if(metadataProfile.value) {
    preMetadataValidity.value = computeValidity(preMetadata, metadataProfile.value.pre)
  }
  postMetadata.value = props.parsedMetadata.acceleration.attributes['post_metadata'] as Record<string,any>
  metadataProfile.value = Object.values(config.value.profiles).find((p: ProfileDefinition) => p.id === postMetadata.value['profile'])
  if(metadataProfile.value) {
    postMetadataValidity.value = computeValidity(postMetadata, metadataProfile.value.pre)
  }
}, {
  deep: true,
  immediate: true
})
</script>

<template>
  <Accordion class="border rounded-md [margin-bottom:40px]">
    <AccordionPanel
      v-if="preMetadata"
      value="0">
      <AccordionHeader class="data-[p-active=true]:!border-b">
        Pre-Measurement Metadata
      </AccordionHeader>
      <AccordionContent>
        <MetaForm
          v-if="config && metadataProfile"
          v-model:state-object="preMetadata['parameters']"
          v-model:state-validity="preMetadataValidity"
          :disabled="!preMetadataEditable"
          :phase="metadataProfile.pre"
          class="pt-3"
        />
      </AccordionContent>
    </AccordionPanel>
    <AccordionPanel
      v-if="postMetadata && metadataProfile?.post"
      value="1">
      <AccordionHeader class="data-[p-active=true]:!border-b">
        Post-Measurement Metadata
      </AccordionHeader>
      <AccordionContent>
        <MetaForm
          v-if="config && metadataProfile"
          v-model:state-object="postMetadata['parameters']"
          v-model:state-validity="postMetadataValidity"
          :disabled="!postMetadataEditable"
          :phase="metadataProfile.post"
          class="pt-3"
        />
      </AccordionContent>
    </AccordionPanel>
    <AccordionPanel
      v-if="parsedMetadata?.pictures && Object.keys(parsedMetadata?.pictures).length > 0"
      value="2"
    >
      <AccordionHeader>
        Pictures
      </AccordionHeader>
      <AccordionContent>
        <div class="flex flex-wrap gap-3">
          <div
            v-for="[picture_param, content] in Object.entries(parsedMetadata.pictures)"
            :key="picture_param"
            class="border rounded">
            <h4 class="font-semibold m-3"> {{ picture_param.split('_').map(s => capitalize(s)).join(' ') }} </h4>
            <div class="grid grid-cols-3 gap-3 p-3">
              <div
                v-for="(picture, index) in content"
                :key="picture"
                class="flex flex-col items-center"
              >
                <Image
                  :src="picture"
                  :alt="`Image ${index} of ${picture_param}`"
                  preview
                />
                <Button
                  :label="`${picture_param}_${index}.${mime.getExtension(picture.split(':')[1].split(';')[0])}`"
                  :href="picture"
                  icon="pi pi-download"
                  :download="`${picture_param}_${index}.${mime.getExtension(picture.split(':')[1].split(';')[0])}`"
                  link
                  as="a"
                />
              </div>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionPanel>
    <AccordionPanel
      v-if="parsedMetadata?.sensors && parsedMetadata.sensors.length > 0"
      value="3"
    >
      <AccordionHeader>
        Sensor Data
      </AccordionHeader>
      <AccordionContent>
        <DataTable :value="parsedMetadata.sensors">
          <Column
            v-for="col of sensorColumns"
            :key="col.field"
            :field="col.field"
            :header="col.header"
          >
            <template #body="{ data }: { data: Sensor }">
              {{
                typeof data[col.field as keyof Sensor] === 'number'
                  ? Number(data[col.field as keyof Sensor]).toFixed(3)
                  : data[col.field as keyof Sensor]
              }}
            </template>
          </Column>
        </DataTable>
      </AccordionContent>
    </AccordionPanel>
  </Accordion>
</template>