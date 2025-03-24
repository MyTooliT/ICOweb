<script setup lang="ts">
import { writeADCValues } from '@/api/icoapi.ts';
import {
  useADCStore,
  referenceVoltageOptions,
  oversamplingRateOptions,
  acquisitionTimeOptions,
  prescaler,
  referenceVoltagesMap,
  TReferenceOptions
} from '@/stores/ADCStore/ADCStore.ts';
import { useHardwareStore } from '@/stores/hardwareStore/hardwareStore.ts';
import Button from 'primevue/button';
import Drawer from 'primevue/drawer';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';

const ADCStore = useADCStore()
const hwStore = useHardwareStore()
</script>

<template>
  <Drawer
    v-model:visible="ADCStore.ADCDrawerVisible"
    position="right"
  >
    <template #container>
      <div class="flex flex-col gap-3 p-3">
        <div class="pb-3 border-b border-gray-200">
          <h2 class="text-lg font-medium">
            ADC Settings
          </h2>
          <h4 class="mb-3">
            Fetch from STH and change values.
            Fetching may take several seconds.
          </h4>
          <Button
            :label="ADCStore.hasFetched ? 'Refetch' : 'Fetch'"
            :outlined="ADCStore.hasFetched"
            :icon="ADCStore.hasFetched ? 'pi pi-sync' : 'pi pi-download'"
            :loading="ADCStore.loading"
            :disabled="!hwStore.activeSTH"
            fluid
            @click="ADCStore.fetchADCValues(hwStore.activeSTH?.getMacAddress())"
          />
        </div>
        <div class="flex flex-col gap-3">
          <div>
            <h4 class="mb-1">
              Prescaler
              ({{ prescaler.min }} - {{ prescaler.max }})
            </h4>
            <InputNumber
              v-model="ADCStore.values.prescaler"
              :min="prescaler.min"
              :max="prescaler.max"
              suffix="s"
              placeholder="Please fetch values"
              :disabled="!ADCStore.values.prescaler"
              fluid
            />
          </div>
          <div>
            <h4 class="mb-1">
              Acquisition Time
            </h4>
            <Select
              v-model="ADCStore.values.acquisition_time"
              :options="acquisitionTimeOptions"
              placeholder="Please fetch values"
              :disabled="!ADCStore.values.acquisition_time"
              fluid
            />
          </div>
          <div>
            <h4 class="mb-1">
              Oversampling Rate
            </h4>
            <Select
              v-model="ADCStore.values.oversampling_rate"
              :options="oversamplingRateOptions"
              placeholder="Please fetch values"
              :disabled="!ADCStore.values.oversampling_rate"
              fluid
            />
          </div>
          <div
            v-if="ADCStore.samplingRate"
            class="mb-1"
          >
            <h4 class="font-semibold">
              Resulting sample rate: {{ Math.round(ADCStore.samplingRate) }}Hz
            </h4>
          </div>
          <div>
            <h4 class="mb-1">
              Reference Voltage
            </h4>
            <Select
              v-model="ADCStore.values.reference_voltage"
              :options="referenceVoltageOptions"
              :option-value="
                (voltage: TReferenceOptions) => referenceVoltagesMap[voltage]
              "
              placeholder="Please fetch values"
              :disabled="!ADCStore.values.reference_voltage"
              fluid
              severity="primary"
            />
          </div>
        </div>
      </div>
      <div class="absolute h-full right-full top-0 bg-error-container">
        <button
          class="
        vertical-writing-lr orientation-mixed rotate-180
        bg-gray-200 h-full"
          @click="ADCStore.ADCDrawerVisible = false"
        >
          Hide ADC Config
        </button>
      </div>
    </template>
  </Drawer>
</template>

<style scoped>

</style>