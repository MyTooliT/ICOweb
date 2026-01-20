import { getADCValues } from '@/api/icoapi.ts';
import { ADCValues } from '@/client';
import { defineStore } from 'pinia';
import {
  computed,
  ref
} from 'vue';

export const acquisitionTimeOptions = [
  1, 2, 3, 4, 8, 16, 32, 64, 128, 256
]
export type TAcquisitionTime = typeof acquisitionTimeOptions[number]

export const oversamplingRateOptions = [
  1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096
]
export type TOversamplingRate = typeof oversamplingRateOptions[number]

export const referenceVoltageOptions = [
  '1V25',
  'Vfs1V65',
  'Vfs1V8',
  'Vfs2V1',
  'Vfs2V2',
  '2V5',
  'Vfs2V7',
  'VDD',
  '5V',
  '6V6',
]
export type TReferenceOptions = typeof referenceVoltageOptions[number];

export const referenceVoltagesMap: { [Key in TReferenceOptions]: number } = {
  '1V25': 1.25,
  'Vfs1V65': 1.65,
  'Vfs1V8': 1.8,
  'Vfs2V1': 2.1,
  'Vfs2V2': 2.2,
  '2V5': 2.5,
  'Vfs2V7': 2.7,
  'VDD': 3.3,
  '5V': 5.0,
  '6V6': 6.6,
} as const;

export const prescaler = {
  min: 2,
  max: 127
} as const

export const useADCStore = defineStore('adc', () => {

  // Value for showing / hiding ADC drawer on measurement page
  const ADCDrawerVisible = ref<boolean>(false)

  // Values
  const values = ref<ADCValues>({
    prescaler: null,
    acquisition_time: null,
    oversampling_rate: null,
    reference_voltage: null
  })

  // Indicates whether values have been fetched.
  const hasFetched = computed<boolean>(() => {
    return values.value.reference_voltage !== null
  })

  // Loading state
  const loading = ref<boolean>(false)

  async function fetchADCValues() {
    loading.value = true
    try {
      values.value = await getADCValues()
    } catch (error) {
      console.log(error);
    }
    loading.value = false
  }

  const samplingRate = computed<number | undefined>(() => {
    if (
        !values.value.prescaler ||
        !values.value.oversampling_rate ||
        !values.value.acquisition_time
    ) { return undefined }
    // https://mytoolit.github.io/Documentation/#sampling-rate
    return 38400000 / (
        (values.value.prescaler + 1) *
        (values.value.acquisition_time + 13) *
        values.value.oversampling_rate
    )
  })

  return {
    ADCDrawerVisible,
    values,
    loading,
    fetchADCValues,
    hasFetched,
    samplingRate
  }
}, {
  persist: true
})