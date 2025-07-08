<script setup lang="ts">
import StaticChart from '@/components/elements/charts/StaticChart.vue';
import TextBlock from '@/components/elements/misc/TextBlock.vue';
import FileSelectionModal from '@/components/elements/modals/FileSelectionModal.vue';
import SplitLayout from '@/layouts/SplitLayout.vue';
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel, ProgressBar } from 'primevue';
import { useGeneralStore } from '@/stores/generalStore/generalStore.ts';
import {ChartData} from 'chart.js';
import {
  ChartBoundaries,
  DisplayableMeasurement,
  computeChartDataAndBoundaries,
  findNextClosestSmaller,
  fetchFileReader,
  consumeFileReader,
  decode
} from '@/components/elements/charts/staticChartHelper.ts';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {ParsedMetadata} from '@/client';
import { JsonViewer } from 'vue3-json-viewer';
import 'vue3-json-viewer/dist/vue3-json-viewer.css';
import Image from 'primevue/image';
import Button from 'primevue/button';
import mime from 'mime'

const route = useRoute();
const router = useRouter();
const store = useGeneralStore();

const chartData = ref<ChartData<'line'>>({
  datasets: [{
    data: [],
    label: '',
  }]
})

const chartBoundaries = ref<ChartBoundaries>({
  xmin: 0,
  xmax: 10,
  ymin: 0,
  ymax: 10,
})

const fetchingProgress = ref<number>(0)
const parsedData = ref<DisplayableMeasurement|undefined>(undefined)
const parsedMetadata = ref<ParsedMetadata | undefined>(undefined)

const routerWatcher = async () => {
  if(route.query['file']) {
    const fileName = route.query['file'].toString();
    store.lastFileQuery = fileName;
    store.fileSelectionModalVisible = false;
    const reader = await fetchFileReader(fileName)
    parsedData.value = await consumeFileReader(reader, fetchingProgress, parsedMetadata, fileName)
    computeChartDataAndBoundaries(parsedData.value, chartData, chartBoundaries)
  } else {
    store.fileSelectionModalVisible = true;
  }
}

function handleZoom(start: number, end: number): void {
  if(!parsedData.value) {return}
  const startIndex = findNextClosestSmaller(parsedData.value.timestamp, start)
  const endIndex = findNextClosestSmaller(parsedData.value.timestamp, end)
  computeChartDataAndBoundaries(parsedData.value, chartData, chartBoundaries , startIndex, endIndex)
}

watch(() => route.query['file'], routerWatcher, { immediate: true });
</script>

<template>
  <SplitLayout
    v-if="chartData.datasets[0] && chartData.datasets[0].data.length > 0"
    class="h-stretch">
    <TextBlock
      :heading="route.query['file']?.toString() ?? 'Analyze Measurement'"
      subheading="Analyze data from existing measurements."
      :button="true"
      button-text="Select File"
      button-icon-class="pi pi-file-import"
      @button-click="store.fileSelectionModalVisible = true"
    />
    <StaticChart
      v-if="chartData.datasets[0] && chartData.datasets[0].data.length > 0"
      :data="chartData"
      :boundaries="chartBoundaries"
      @zoom="handleZoom"
    />
    <template #aside />
    <template #bottom>
      <Accordion
        v-if="parsedMetadata?.acceleration"
        class="border rounded-md mt-3"
      >
        <AccordionPanel value="0">
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
      </Accordion>
      <Accordion
        v-if="parsedMetadata?.pictures && Object.keys(parsedMetadata?.pictures).length > 0"
        class="border rounded-md mt-3"
      >
        <AccordionPanel value="0">
          <AccordionHeader class="!bg-transparent">
            Pictures
          </AccordionHeader>
          <AccordionContent
            class="!bg-transparent [margin-bottom:40px]"
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
      </Accordion>
    </template>
  </SplitLayout>
  <div
    v-else
    class="w-full h-stretch max-h-60 flex justify-center items-center"
  >
    <div class="max-w-60 flex flex-col gap-4">
      <h4>Fetching Measurement</h4>
      <ProgressBar
        :value="fetchingProgress"
        :pt="{
          value: {
            style: ['transition-duration: .25s;']
          }
        }" />
    </div>
  </div>
  <FileSelectionModal
    @upload="(event) => {
      const query = { ...route.query }
      query['file'] = (event as string)
      router.replace( { query } )
      store.fileSelectionModalVisible = false;
    }"
  />
</template>