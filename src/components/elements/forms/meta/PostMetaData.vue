<script setup lang="ts">
import {useYamlConfig} from '@/utils/useYamlConfig.ts';
import {computed, onMounted} from 'vue';
import MetaInput from '@/components/elements/forms/meta/MetaInput.vue';
import {useMeasurementStore} from '@/stores/measurementStore/measurementStore.ts';
import Select from 'primevue/select';
import NamedInput from '@/components/elements/forms/NamedInput.vue';
import Button from 'primevue/button';
import {Quantity} from '@/client';
import {
  type ProfileDefinition,
  ParameterKey,
  getRequiredParameterKeysForPhase
} from '@/utils/metadataConfig.ts';

const mStore = useMeasurementStore()
const { config, reload } = useYamlConfig();

const emits = defineEmits(['send'])
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

function validate() {
  if(profile.value === undefined) {
    mStore.postMetaValid = false
    return
  }
  if(profile.value.post === undefined) {
    mStore.postMetaValid = true;
    return;
  }
  const params = getRequiredParameterKeysForPhase(profile.value.post)
  let valid = true
  params.forEach(param => {
    let formValue = mStore.postMetaForm.parameters[param]
    valid = valid && (formValue !== null && formValue !== undefined && formValue !== '')
    if(formValue && typeof formValue === 'object') {
      if('value' in formValue ) {
        const qty = formValue as Quantity
        valid = valid && (qty.value !== null)
      } else {
        const imgs = Object.values(formValue)
        valid = valid && (imgs.length > 0)
      }
    }
  })
  mStore.postMetaValid = valid
}

onMounted(async () => {
  await reload()
  mStore.postMetaForm.profile = mStore.preMetaForm.profile
  mStore.postMetaForm.version = mStore.preMetaForm.version
  if(profile.value && profile.value.post) {
    const params = getRequiredParameterKeysForPhase(profile.value.post)
    Object.keys(mStore.postMetaForm.parameters).forEach(param => {
      if(!params.includes(param as ParameterKey)) {
        delete mStore.postMetaForm.parameters[param]
      }
    })
    validate()
  }
})
</script>

<template>
  <form>
    <div v-if="profile">
      <div v-if="profile.post">
        <p>Please add your results and images. Everything will be stored in the HDF5 file.</p>
        <div
          v-for="[category, categoryParameters] in Object.entries(profile.post)"
          :key="category"
          class="mt-4 pt-3 border-t"
        >
          <h4 class="font-semibold">
            {{ category }}
          </h4>
          <div class="flex flex-row gap-3 justify-between flex-wrap">
            <div
              v-for="[param_key, param_definition] in Object.entries(categoryParameters)"
              :key="param_key"
              class="flex-grow flex-shrink [flex-basis:20%]"
            >
              <MetaInput
                :param-key="param_key"
                :definition="param_definition"
                phase="post"
                @update="validate"
              />
            </div>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t">
          <div class="w-full flex justify-center">
            <Button
              label="Finish Measurement"
              :disabled="!mStore.postMetaValid"
              :loading="loading"
              @click="emits('send')"
            />
          </div>
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
          @change="validate"
        />
      </NamedInput>
    </div>
    {{ mStore.postMetaValid }}
  </form>
</template>
