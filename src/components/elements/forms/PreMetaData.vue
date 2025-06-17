<script setup lang="ts">
import {useYamlConfig} from '@/utils/useYamlConfig.ts';
import {capitalize, computed, onMounted} from 'vue';
import Select from 'primevue/select';
import NamedInput from '@/components/elements/forms/NamedInput.vue';
import {useMeasurementStore} from '@/stores/measurementStore/measurementStore.ts';
import {useHardwareStore} from '@/stores/hardwareStore/hardwareStore.ts';
import {
  Profile,
  ParameterDefinition,
  Parameters,
  ProfileParamDefinition,
  Parameter
} from '@/types/metadata';
import MetaInput from '@/components/elements/forms/meta/MetaInput.vue';
const mStore = useMeasurementStore()
const hwStore = useHardwareStore()
const { config, error, reload } = useYamlConfig()

const props = defineProps<{
  disabled: boolean
}>()

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


function getFullParameter(parameters: Parameters, param_key: Parameter, profileParamDef: ProfileParamDefinition): ParameterDefinition & ProfileParamDefinition | undefined {
  if (!parameters) return undefined
  const base_param = parameters[param_key]
  if (!base_param) return undefined
  return {
    ...base_param,
    ...profileParamDef
  }
}


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


function validate() {
  const params = getProfileParamKeys()
  let valid = true
  params.forEach(param => {
    valid = valid && (mStore.preMetaForm.parameters[param] !== null && mStore.preMetaForm.parameters[param] !== undefined && mStore.preMetaForm.parameters[param] !== '')
  })
  mStore.preMetaValid = valid
}


function update() {
  if(props.disabled) return
  if(!mStore.preMetaForm.parameters['sth_mac'])  {
    mStore.preMetaForm.parameters['sth_mac'] = hwStore.activeSTH?.getMacAddress()
  }

  if(!mStore.preMetaForm.parameters['stu_mac'])  {
    mStore.preMetaForm.parameters['stu_mac'] = hwStore.activeSTU?.getMacAddress()
  }

  if(!mStore.preMetaForm.version || mStore.preMetaForm.version === '')  {
    mStore.preMetaForm.version = config.value?.info.version ?? ''
  }

  validate()
}


onMounted(async () => {
  await reload()
  update()
})
</script>

<template>
  <div>
    <div v-if="error">
      {{ error }}
    </div>
    <div v-else>
      <NamedInput title="Profile">
        <template #header>
          <h4 class="font-semibold">
            Metadata Profile
          </h4>
        </template>
        <Select
          v-model="mStore.preMetaForm.profile"
          :disabled="disabled"
          :options="profiles ?? []"
          option-label="name"
          option-value="id"
          @change="update"
        />
      </NamedInput>
      <form>
        <div v-if="profile && parameters">
          <div v-if="profile.pre">
            <div
              v-for="[category, categoryParameters] in Object.entries(profile.pre)"
              :key="category"
              class="mt-4 pt-3 border-t "
            >
              <h4 class="font-semibold">
                {{ capitalize(category) }}
              </h4>
              <div class="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(30ch,1fr))]">
                <div
                  v-for="[param_key, profile_param_data] in Object.entries(categoryParameters)"
                  :key="param_key"
                >
                  <MetaInput
                    :disabled="disabled"
                    :param-key="param_key as Parameter"
                    :definition="getFullParameter(parameters, param_key as Parameter, profile_param_data)"
                    @update="update"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>

</style>