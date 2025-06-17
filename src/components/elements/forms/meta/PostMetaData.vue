<script setup lang="ts">
import {useYamlConfig} from '@/utils/useYamlConfig.ts';
import {Parameter, ParameterDefinition, Parameters, Profile, ProfileParamDefinition} from '@/types/metadata';
import {capitalize, computed, onMounted} from 'vue';
import MetaInput from '@/components/elements/forms/meta/MetaInput.vue';
import {useMeasurementStore} from '@/stores/measurementStore/measurementStore.ts';
import Select from 'primevue/select';
import NamedInput from '@/components/elements/forms/NamedInput.vue';

const mStore = useMeasurementStore()
const { config, reload, error } = useYamlConfig();

const parameters = computed(() => {
  return config.value?.parameters || undefined
})

const profiles = computed<Profile[] | undefined>(() => {
  if (config.value?.profiles) {
    return Object.values(config.value?.profiles)
  } else {
    return undefined
  }
})
const profile = computed<Profile | undefined>(() => {
  if (profiles.value && mStore.preMetaForm.profile) {
    return profiles.value.find(p => p.id === mStore.preMetaForm.profile)
  } else {
    return undefined
  }
})

function getProfileParamKeys(): Parameter[] {
  const params: Parameter[] = []
  const categories = Object.values(profile.value?.pre ?? {})
  categories.forEach(category => {
    Object.entries(category).forEach(([k, param]) => {
      if(param.required === 'required') {
        params.push(k as Parameter)
      }
    })
  })
  return params
}

function getFullParameter(parameters: Parameters, param_key: Parameter, profileParamDef: ProfileParamDefinition): ParameterDefinition & ProfileParamDefinition | undefined {
  if (!parameters) return undefined
  const base_param = parameters[param_key]
  if (!base_param) return undefined
  return {
    ...base_param,
    ...profileParamDef
  }
}

function validate() {
  const params = getProfileParamKeys()
  let valid = true
  params.forEach(param => {
    valid = valid && (mStore.postMetaForm.data.parameters[param] !== null && mStore.postMetaForm.data.parameters[param] !== undefined && mStore.postMetaForm.data.parameters[param] !== '')
  })
  mStore.postMetaValid = valid
}

function update() {

}

onMounted(async () => {
  await reload()
})
</script>

<template>
  <form>
    <div v-if="profile && parameters">
      <div v-if="profile.post">
        <p>Please add your results and images. Everything will be stored in the HDF5 file.</p>
        <div
          v-for="[category, categoryParameters] in Object.entries(profile.post)"
          :key="category"
          class="mt-4 pt-3 border-t"
        >
          <h4 class="font-semibold">
            {{ capitalize(category) }}
          </h4>
          <div class="flex flex-row gap-3 justify-between">
            <div
              v-for="[param_key, profile_param_data] in Object.entries(categoryParameters)"
              :key="param_key"
              class="w-full"
            >
              <MetaInput
                :param-key="param_key as Parameter"
                :definition="getFullParameter(parameters, param_key as Parameter, profile_param_data)"
                phase="post"
                @update="validate"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <h5 class="mb-3">Your metadata profile was lost. Please confirm it.</h5>
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
  </form>
</template>

<style scoped>

</style>