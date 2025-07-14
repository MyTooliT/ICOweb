<script setup lang="ts">
import Image from 'primevue/image';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import {decode} from '@/components/elements/charts/staticChartHelper.ts';
import mime from 'mime';
import {Accordion, AccordionContent, AccordionHeader, AccordionPanel} from 'primevue';
import {JsonViewer} from 'vue3-json-viewer';
import {ParsedMetadata} from '@/client';
import {Sensor} from '@/stores/hardwareStore/classes/Sensor.ts';
import 'vue3-json-viewer/dist/vue3-json-viewer.css';
import {capitalize} from 'vue';

const props = defineProps<{
  parsedMetadata: ParsedMetadata
}>()

const sensorColumns = Object.keys(props.parsedMetadata.sensors[0]).map((key: string) => {
  return {
    field: key,
    header: key
  }
})
</script>

<template>
  <Accordion class="border rounded-md mt-3 [margin-bottom:40px]">
    <AccordionPanel
      v-if="parsedMetadata?.acceleration"
      value="0">
      <AccordionHeader>
        Metadata
      </AccordionHeader>
      <AccordionContent>
        <JsonViewer
          :value="parsedMetadata?.acceleration.attributes"
          :expand-depth="10"
          :preview-mode="true"
          theme="light"
         
        />
      </AccordionContent>
    </AccordionPanel>
    <AccordionPanel
      v-if="parsedMetadata?.pictures && Object.keys(parsedMetadata?.pictures).length > 0"
      value="1"
    >
      <AccordionHeader>
        Pictures
      </AccordionHeader>
      <AccordionContent>
        <div class="grid grid-cols-3 gap-3">
          <div
            v-for="[picture_param, content] in Object.entries(parsedMetadata.pictures)"
            :key="picture_param"
            class="flex flex-col items-center border rounded">
            <h4 class="font-semibold m-3">{{ picture_param.split('_').map(s => capitalize(s)).join(' ') }}</h4>
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
      </AccordionContent>
    </AccordionPanel>
    <AccordionPanel
      v-if="parsedMetadata?.sensors && parsedMetadata.sensors.length > 0"
      value="2"
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