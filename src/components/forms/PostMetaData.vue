<script setup lang="ts">
import {useYamlConfig} from '@/utils/useYamlConfig.ts';
import {computed, onMounted} from 'vue';
import {useMeasurementStore} from '@/stores/measurementStore/measurementStore.ts';
import Select from 'primevue/select';
import NamedInput from '@/components/inputs/NamedInput.vue';
import Button from 'primevue/button';
import {
  type ProfileDefinition,
  setRestrictedDefaults,
  setDefaultsIfEmpty,
  removeUnusedParams,
  computeValidity, clearEntries
} from '@/utils/metadataConfig.ts';
import MetaForm from '@/components/forms/MetaForm.vue';

const mStore = useMeasurementStore()
const { config, reload } = useYamlConfig();

const emits = defineEmits(['send', 'canceled'])
defineProps<{
  loading: boolean
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

function standardReset() {
  if(!profile.value || !profile.value.post || !config.value) return
  if(!mStore.postMetaForm.version || mStore.postMetaForm.version === '') {
    mStore.postMetaForm.version = config.value.info.schema_version
  }
  clearEntries(mStore.postMetaForm.parameters)
  setRestrictedDefaults(mStore.postMetaForm.parameters, profile.value.post)
  setDefaultsIfEmpty(mStore.postMetaForm.parameters, profile.value.post)
  removeUnusedParams(mStore.postMetaForm.parameters, profile.value.post)
  mStore.postMetaValid = computeValidity(mStore.postMetaForm.parameters, profile.value.post)
}

onMounted(async () => {
  await reload()
  mStore.postMetaForm.profile = mStore.preMetaForm.profile
  mStore.postMetaForm.version = mStore.preMetaForm.version
  standardReset()
})
</script>

<template>
  <div v-if="profile && profile.post">
    <MetaForm
      v-model:state-object="mStore.postMetaForm.parameters"
      v-model:state-validity="mStore.postMetaValid"
      :phase="profile.post" />
    <div class="mt-4 pt-3 border-t">
      <div class="w-full flex justify-between">
        <Button
          label="Finish Without Post-Metadata"
          variant="outlined"
          :loading="loading"
          @click="emits('canceled')"
        />
        <Button
          label="Send & Finish Measurement"
          :disabled="!mStore.postMetaValid"
          :loading="loading"
          @click="emits('send')"
        />
      </div>
    </div>
  </div>
  <div v-else>
    <h5 class="mb-3">
      Your metadata profile was lost. Please confirm it.
    </h5>
    <NamedInput title="Profile">
      <template #header>
        <h4 class="font-semibold">
          Metadata Profile
        </h4>
      </template>
      <Select
        v-model="mStore.preMetaForm.profile"
        :options="profiles ?? []"
        option-label="name"
        option-value="id"
        @change="standardReset"
      />
    </NamedInput>
  </div>
</template>
