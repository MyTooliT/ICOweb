<script setup lang="ts">
import {useYamlConfig} from '@/utils/useYamlConfig.ts';
import {computed, onMounted, watch} from 'vue';
import Select from 'primevue/select';
import Button from 'primevue/button';
import NamedInput from '@/components/elements/forms/NamedInput.vue';
import {useMeasurementStore} from '@/stores/measurementStore/measurementStore.ts';
import {useHardwareStore} from '@/stores/hardwareStore/hardwareStore.ts';
import {
  getDefaultsObject,
  getRequiredParameterKeysForPhase,
  setDefaultsIfEmpty,
  setRestrictedDefaults,
  computeValidity,
  removeUnusedParams,
  type ProfileDefinition, clearEntries
} from '@/utils/metadataConfig.ts';
import MetaForm from '@/components/elements/forms/meta/MetaForm.vue';
const mStore = useMeasurementStore()
const { config, reload } = useYamlConfig()

defineProps<{
  disabled: boolean,
}>()

const profiles = computed<ProfileDefinition[] | undefined>(() => {
  if (config.value?.profiles) {
    return Object.values(config.value?.profiles)
  } else {
    return undefined
  }
})

const profile = computed<ProfileDefinition | undefined>(() => {
  if (profiles.value && mStore.preMetaForm.profile) {
    return profiles.value.find(p => p.id === mStore.preMetaForm.profile)
  } else {
    return undefined
  }
})

function setImplementations() {
  if(!profile.value) return
  const required_params = getRequiredParameterKeysForPhase(profile.value?.pre)
  const hwStore = useHardwareStore()
  if(required_params.includes('sth_mac')) {
    mStore.preMetaForm.parameters.sth_mac = hwStore.activeSTH?.getMacAddress()
  }
  if(required_params.includes('stu_mac')) {
    mStore.preMetaForm.parameters.stu_mac = hwStore.activeSTU?.getMacAddress()
  }
}

function setAllDefaults() {
  if(!profile.value) return
  clearEntries(mStore.preMetaForm.parameters)
  Object.assign(mStore.preMetaForm.parameters, getDefaultsObject(profile.value.pre))
}

function standardReset() {
  if(!profile.value || !config.value) return
  if(!mStore.preMetaForm.version || mStore.preMetaForm.version === '') {
    mStore.preMetaForm.version = config.value.info.version
  }
  setImplementations()
  setRestrictedDefaults(mStore.preMetaForm.parameters, profile.value.pre)
  setDefaultsIfEmpty(mStore.preMetaForm.parameters, profile.value.pre)
  removeUnusedParams(mStore.preMetaForm.parameters, profile.value.pre)
  mStore.preMetaValid = computeValidity(mStore.preMetaForm.parameters, profile.value.pre)
}

onMounted(async() => {
  await reload()
  standardReset()
})

watch(profile, standardReset)
</script>

<template>
  <div>
    <NamedInput title="Profile">
      <template #header>
        <h4 class="font-semibold">
          Metadata Profile
          <i
            v-tooltip="{ value: 'Changing the profile will set all parameters except those overwritten by the user to their default value (if present).\n\nTo reset all values, use the button to the right.' }"
            class="pi pi-info-circle" />
        </h4>
      </template>
      <div class="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(30ch,1fr))]">
        <Select
          v-model="mStore.preMetaForm.profile"
          :disabled="disabled"
          :options="profiles ?? []"
          option-label="name"
          option-value="id"
          class=""
        />
        <Button
          v-tooltip="{ value: 'Resets all parameters to their default values (if present) or empties them.' }"
          label="Clear Form"
          severity="primary"
          class="w-fit"
          @click="setAllDefaults"
        />
      </div>
    </NamedInput>
    <MetaForm
      v-if="profile"
      v-model:state-object="mStore.preMetaForm.parameters"
      v-model:state-validity="mStore.preMetaValid"
      :phase="profile.pre"
      :disabled="disabled"
    />
  </div>
</template>