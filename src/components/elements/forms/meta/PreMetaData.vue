<script setup lang="ts">
import {useYamlConfig} from '@/utils/useYamlConfig.ts';
import {computed, onMounted} from 'vue';
import Select from 'primevue/select';
import NamedInput from '@/components/elements/forms/NamedInput.vue';
import {useMeasurementStore} from '@/stores/measurementStore/measurementStore.ts';
import {useHardwareStore} from '@/stores/hardwareStore/hardwareStore.ts';
import {getRequiredParameterKeysForPhase, type ProfileDefinition} from '@/utils/metadataConfig.ts';
import MetaInput from '@/components/elements/forms/meta/MetaInput.vue';
const mStore = useMeasurementStore()
const hwStore = useHardwareStore()
const { config, error, reload } = useYamlConfig()

const props = defineProps<{
  disabled: boolean,
  phase: 'pre' | 'post'
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
    mStore.preMetaValid = false
    return
  }
  const params = getRequiredParameterKeysForPhase(profile.value.pre)
  let valid = true
  params.forEach(param => {
    let formValue = mStore.preMetaForm.parameters[param]
    if (formValue && typeof formValue === 'object' && 'value' in formValue) {
      // Either a Quantity or a base64 encoded image list
      if('value' in formValue) {
        formValue = formValue.value
      } else {
        formValue = Object.values(formValue)[0]
      }
    }

    valid = valid && (formValue !== null && formValue !== undefined && formValue !== '')
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
        <div v-if="profile">
          <div v-if="profile.pre">
            <div
              v-for="[category, categoryParameters] in Object.entries(profile.pre)"
              :key="category"
              class="mt-4 pt-3 border-t "
            >
              <h4 class="font-semibold">
                {{ category }}
              </h4>
              <div class="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(30ch,1fr))]">
                <div
                  v-for="[param_key, param_definition] in Object.entries(categoryParameters)"
                  :key="param_key"
                >
                  <MetaInput
                    :disabled="disabled"
                    :param-key="param_key"
                    :phase="phase"
                    :definition="param_definition"
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