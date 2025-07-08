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
      <AccordionHeader class="!bg-transparent">
        Metadata
      </AccordionHeader>
      <AccordionContent
        class="!bg-transparent"
        style="--p-accordion-content-background: transparent;"
      >
        <JsonViewer
          :value="parsedMetadata?.acceleration.attributes"
          :expand-depth="10"
          :preview-mode="true"
          theme="light"
          class="!bg-transparent"
        />
      </AccordionContent>
    </AccordionPanel>
    <AccordionPanel
      v-if="parsedMetadata?.pictures && Object.keys(parsedMetadata?.pictures).length > 0"
      value="1"
    >
      <AccordionHeader class="!bg-transparent">
        Pictures
      </AccordionHeader>
      <AccordionContent
        style="--p-accordion-content-background: transparent;"
      >
        <div class="grid grid-cols-3 gap-3">
          <div
            v-for="[name, content] in Object.entries(parsedMetadata?.pictures)"
            :key="name"
            class="flex flex-col items-center border rounded">
            <Image
              :src="decode(content)"
              :alt="name"
              preview
            />
            <Button
              :label="`${name}.${mime.getExtension(content.split(':')[1].split(';')[0])}`"
              :href="decode(content)"
              icon="pi pi-download"
              :download="`${name}.${mime.getExtension(content.split(':')[1].split(';')[0])}`"
              link
              as="a"
              class="w-fit"
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionPanel>
    <AccordionPanel
      v-if="parsedMetadata?.sensors && parsedMetadata.sensors.length > 0"
      value="2"
      class="!bg-transparent"
    >
      <AccordionHeader class="!bg-transparent">
        Sensor Data
      </AccordionHeader>
      <AccordionContent style="--p-accordion-content-background: transparent;">
        <DataTable
          :value="parsedMetadata.sensors"
          style="
            --p-datatable-header-cell-background: transparent;
            --p-datatable-row-background: transparent;"
        >
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