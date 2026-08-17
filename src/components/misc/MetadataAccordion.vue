<script setup lang="ts">
import Image from 'primevue/image';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import mime from 'mime';
import {Accordion, AccordionContent, AccordionHeader, AccordionPanel} from 'primevue';
import {EmbeddedFileInfo, Metadata, ParsedMetadata} from '@/client';
import {Sensor} from '@/stores/hardwareStore/classes/Sensor.ts';
import {capitalize, computed, onMounted, ref, watch} from 'vue';
import {useYamlConfig} from '@/utils/useYamlConfig.ts';
import MetaForm from '@/components/forms/MetaForm.vue';
import MetadataProfileSelector from '@/components/forms/MetadataProfileSelector.vue';
import {
  computeValidity,
  MetadataConfig,
  ProfilePhase,
  removeUnusedParams,
  setDefaultsIfEmpty,
  setRestrictedDefaults,
} from '@/utils/metadataConfig.ts';
import MetadataEditSection from '@/components/forms/MetadataEditSection.vue';
import {
  deleteFileFromHDF5,
  deletePostMeta,
  deletePreMeta,
  getAPILink,
  sendPostMetaOverride,
  sendPreMetaOverride,
} from '@/api/icoapi.ts';
import {useRoute} from 'vue-router';
import {useLoadingHandler} from '@/utils/useLoadingHandler.ts';
import CustomFileUpload from '@/components/forms/CustomFileUpload.vue';
import {formatFileSize} from '@/utils/helper.ts';
import DownloadButton from '@/components/buttons/DownloadButton.vue';
import DeleteButton from '@/components/buttons/DeleteButton.vue';
import Fieldset from 'primevue/fieldset';
import {useMessageBus} from '@/message';
import {formatSupplyVoltage} from '@/utils/helper.ts';

const route = useRoute()
const m = useMessageBus()

const props = defineProps<{
  parsedMetadata: ParsedMetadata
}>()

const startSupplyVoltage = computed(() => formatSupplyVoltage(
  props.parsedMetadata.acceleration.attributes['start_supply_voltage']
))

const sensorColumns = props.parsedMetadata.sensors[0]
    ? Object.keys(props.parsedMetadata.sensors[0]).map((key: string) => {
      return {
        field: key,
        header: key
      }
    })
    : []

const { config, reload } = useYamlConfig()

/**
 * Manages the pre- or post-measurement metadata section of an already
 * recorded file: viewing the saved value, editing/saving it in place,
 * adding it to a file that has none yet, changing its profile, and
 * deleting it entirely.
 */
function createPhaseEditor(phaseKind: 'pre' | 'post') {
  const saved = ref<Metadata | undefined>(undefined)
  const editing = ref(false)
  const draft = ref<Metadata>(emptyMetadata())
  const draftValid = ref(false)

  function phaseOf(profileId: string | undefined): ProfilePhase | undefined {
    if (!config.value || !profileId) return undefined
    const profile = Object.values(config.value.profiles).find(p => p.id === profileId)
    if (!profile) return undefined
    return phaseKind === 'pre' ? profile.pre : profile.post
  }

  const draftPhase = computed(() => phaseOf(draft.value.profile))
  const savedPhase = computed(() => phaseOf(saved.value?.profile))
  const savedValid = computed(() => (
    savedPhase.value ? computeValidity(saved.value?.parameters ?? {}, savedPhase.value) : true
  ))

  // Post-measurement metadata can only use a profile that defines post fields.
  const selectorConfig = computed<MetadataConfig | undefined>(() => {
    if (!config.value) return undefined
    if (phaseKind === 'pre') return config.value
    return {
      ...config.value,
      profiles: Object.fromEntries(
          Object.entries(config.value.profiles).filter(([, profile]) => !!profile.post)
      ),
    }
  })

  function extract(source: any) {
    saved.value = source === undefined || source === null
        ? undefined
        : JSON.parse(JSON.stringify(source))
  }

  function applyGentleDefaults() {
    const phase = draftPhase.value
    if (!phase) return
    setRestrictedDefaults(draft.value.parameters, phase)
    setDefaultsIfEmpty(draft.value.parameters, phase)
    removeUnusedParams(draft.value.parameters, phase)
    draftValid.value = computeValidity(draft.value.parameters, phase)
  }

  watch(() => draft.value.profile, () => {
    if (editing.value) applyGentleDefaults()
  })

  function startAdd() {
    draft.value = emptyMetadata()
    editing.value = true
    const candidates = selectorConfig.value ? Object.values(selectorConfig.value.profiles) : []
    if (candidates.length && !candidates.some(profile => profile.id === draft.value.profile)) {
      draft.value.profile = candidates[0].id
    }
    applyGentleDefaults()
  }

  function startEdit() {
    draft.value = saved.value
        ? JSON.parse(JSON.stringify(saved.value))
        : emptyMetadata()
    editing.value = true
    applyGentleDefaults()
  }

  function cancelEdit() {
    editing.value = false
  }

  const overrideFn = phaseKind === 'pre' ? sendPreMetaOverride : sendPostMetaOverride
  const deleteFn = phaseKind === 'pre' ? deletePreMeta : deletePostMeta
  const label = phaseKind === 'pre' ? 'Pre-Measurement Metadata' : 'Post-Measurement Metadata'

  const { loading: saving, call: save } = useLoadingHandler(async () => {
    if (!route.query['file']) return
    const filename = String(route.query['file'])
    await overrideFn(filename, draft.value)
    saved.value = JSON.parse(JSON.stringify(draft.value))
    editing.value = false
    m.success(`${label} Saved`, 'The metadata was written to the file.')
  })

  const { loading: deleting, call: remove } = useLoadingHandler(async () => {
    if (!route.query['file']) return
    if (!window.confirm(`Delete all ${label.toLowerCase()} for this file? This cannot be undone.`)) return
    const filename = String(route.query['file'])
    await deleteFn(filename)
    saved.value = undefined
    m.success(`${label} Deleted`, 'The metadata was removed from the file.')
  })

  return {
    saved, editing, draft, draftValid, draftPhase, savedPhase, savedValid, selectorConfig,
    extract, startAdd, startEdit, cancelEdit, saving, save, deleting, remove,
  }
}

function emptyMetadata(): Metadata {
  return {
    version: config.value?.info.schema_version ?? '',
    profile: config.value?.default_profile_id ?? '',
    parameters: {},
  }
}

const {
  saved: preSaved, editing: preEditing, draft: preDraft, draftValid: preDraftValid,
  draftPhase: preDraftPhase, savedPhase: preSavedPhase, savedValid: preSavedValid,
  selectorConfig: preSelectorConfig, extract: extractPre, startAdd: preStartAdd,
  startEdit: preStartEdit, cancelEdit: preCancelEdit, saving: preSaving, save: preSave,
  deleting: preDeleting, remove: preRemove,
} = createPhaseEditor('pre')

const {
  saved: postSaved, editing: postEditing, draft: postDraft, draftValid: postDraftValid,
  draftPhase: postDraftPhase, savedPhase: postSavedPhase, savedValid: postSavedValid,
  selectorConfig: postSelectorConfig, extract: extractPost, startAdd: postStartAdd,
  startEdit: postStartEdit, cancelEdit: postCancelEdit, saving: postSaving, save: postSave,
  deleting: postDeleting, remove: postRemove,
} = createPhaseEditor('post')

function joinPath(...parts: string[]): string {
  return parts.map(part => encodeURIComponent(part)).join('/');
}

function buildEmbeddedFileUrl(
    hdf5Name: string,
    apiBase: string = getAPILink(),
): string {
  const url = new URL('/api/v1/', apiBase);
  url.pathname += `files/${joinPath(hdf5Name, 'embedded')}`;
  return url.toString();
}

const deletedFiles = ref<string[]>([])

onMounted(async () => {
  await reload()
})

watch(props, async () => {
  await reload()
  extractPre(props.parsedMetadata.acceleration.attributes['pre_metadata'])
  extractPost(props.parsedMetadata.acceleration.attributes['post_metadata'])
}, {
  deep: true,
  immediate: true
})
</script>

<template>
  <Accordion
    value="information"
    class="border rounded-md [margin-bottom:40px]"
  >
    <AccordionPanel
      v-if="startSupplyVoltage"
      value="information"
    >
      <AccordionHeader>
        Information
      </AccordionHeader>
      <AccordionContent>
        <p class="text-sm text-surface-600">
          <span class="font-semibold">Supply Voltage at Start:</span> {{ startSupplyVoltage }}
        </p>
      </AccordionContent>
    </AccordionPanel>
    <AccordionPanel
      v-if="parsedMetadata?.pictures && Object.keys(parsedMetadata?.pictures).length > 0"
      value="0"
    >
      <AccordionHeader>
        Pictures
      </AccordionHeader>
      <AccordionContent>
        <div class="flex flex-wrap gap-3">
          <div
            v-for="[picture_param, content] in Object.entries(parsedMetadata.pictures)"
            :key="picture_param"
            class="border rounded">
            <h4 class="font-semibold m-3">
              {{ picture_param.split('_').map(s => capitalize(s)).join(' ') }}
            </h4>
            <div class="grid grid-cols-3 gap-3 p-3">
              <div
                v-for="(picture, index) in content"
                :key="picture"
                class="flex flex-col items-center"
              >
                <Image
                  :src="picture"
                  :alt="`Image ${index} of ${picture_param}`"
                  preview
                />
                <Button
                  :label="`${picture_param}_${index}.${mime.getExtension(picture.split(':')[1].split(';')[0])}`"
                  :href="picture"
                  icon="pi pi-download"
                  :download="`${picture_param}_${index}.${mime.getExtension(picture.split(':')[1].split(';')[0])}`"
                  link
                  as="a"
                />
              </div>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionPanel>
    <AccordionPanel value="1">
      <AccordionHeader class="data-[p-active=true]:!border-b">
        Pre-Measurement Metadata
      </AccordionHeader>
      <AccordionContent>
        <div
          v-if="config"
          class="bg-white gap-3 pt-3 flex flex-col"
        >
          <MetadataEditSection
            :state="preEditing ? 'edit' : (preSaved ? 'view' : 'empty')"
            :loading="preSaving"
            :delete-loading="preDeleting"
            edit-btn-label="Edit Pre-Measurement Metadata"
            add-btn-label="Add Pre-Measurement Metadata"
            info-text="Warning: This edits and overrides the complete pre-measurement metadata section. Changes take effect as soon as they are saved."
            @edit="preStartEdit"
            @add="preStartAdd"
            @cancel-edit="preCancelEdit"
            @save="preSave"
            @delete="preRemove"
          />
          <MetadataProfileSelector
            v-if="preEditing && preSelectorConfig"
            v-model="preDraft.profile"
            :disabled="false"
            :config="preSelectorConfig"
          />
          <MetaForm
            v-if="preEditing && preDraftPhase"
            v-model:state-object="preDraft.parameters"
            v-model:state-validity="preDraftValid"
            :phase="preDraftPhase"
          />
          <MetaForm
            v-if="!preEditing && preSaved && preSavedPhase"
            :state-object="preSaved.parameters"
            :state-validity="preSavedValid"
            disabled
            :phase="preSavedPhase"
          />
          <p
            v-if="!preEditing && preSaved && !preSavedPhase"
            class="text-sm text-surface-500"
          >
            This file's metadata profile ("{{ preSaved.profile }}") is no longer defined in the
            current metadata configuration. Edit to assign a current profile.
          </p>
        </div>
      </AccordionContent>
    </AccordionPanel>
    <AccordionPanel value="2">
      <AccordionHeader class="data-[p-active=true]:!border-b">
        Post-Measurement Metadata
      </AccordionHeader>
      <AccordionContent>
        <div
          v-if="config"
          class="bg-white gap-3 pt-3 flex flex-col"
        >
          <MetadataEditSection
            :state="postEditing ? 'edit' : (postSaved ? 'view' : 'empty')"
            :loading="postSaving"
            :delete-loading="postDeleting"
            edit-btn-label="Edit Post-Measurement Metadata"
            add-btn-label="Add Post-Measurement Metadata"
            info-text="Warning: This edits and overrides the complete post-measurement metadata section. Changes take effect as soon as they are saved."
            @edit="postStartEdit"
            @add="postStartAdd"
            @cancel-edit="postCancelEdit"
            @save="postSave"
            @delete="postRemove"
          />
          <MetadataProfileSelector
            v-if="postEditing && postSelectorConfig"
            v-model="postDraft.profile"
            :disabled="false"
            :config="postSelectorConfig"
          />
          <MetaForm
            v-if="postEditing && postDraftPhase"
            v-model:state-object="postDraft.parameters"
            v-model:state-validity="postDraftValid"
            :phase="postDraftPhase"
            class="pt-3"
          />
          <p
            v-if="postEditing && !postDraftPhase"
            class="text-sm text-surface-500"
          >
            No profile with post-measurement fields is available.
          </p>
          <MetaForm
            v-if="!postEditing && postSaved && postSavedPhase"
            :state-object="postSaved.parameters"
            :state-validity="postSavedValid"
            disabled
            :phase="postSavedPhase"
            class="pt-3"
          />
          <p
            v-if="!postEditing && postSaved && !postSavedPhase"
            class="text-sm text-surface-500"
          >
            This file's metadata profile ("{{ postSaved.profile }}") is no longer defined, or no
            longer has post-measurement fields, in the current metadata configuration. Edit to
            assign a current profile.
          </p>
        </div>
      </AccordionContent>
    </AccordionPanel>
    <AccordionPanel
      v-if="parsedMetadata?.sensors && parsedMetadata.sensors.length > 0"
      value="3"
    >
      <AccordionHeader>
        Sensor Data
      </AccordionHeader>
      <AccordionContent>
        <DataTable :value="parsedMetadata.sensors">
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
    <AccordionPanel
      v-if="parsedMetadata?.embedded_files"
      value="4"
    >
      <AccordionHeader>
        Embedded Files
      </AccordionHeader>
      <AccordionContent>
        <DataTable :value="parsedMetadata.embedded_files.filter(f => !deletedFiles.includes(f.dataset_name))">
          <Column
            header="Filename"
            field="original_name"
          />
          <Column
            header="Dataset Name"
            field="dataset_name"
          />
          <Column
            header="Size"
          >
            <template #body="{ data }: { data: EmbeddedFileInfo }">
              {{ formatFileSize(data.size) }}
            </template>
          </Column>
          <Column header="Actions">
            <template #body="{ data }: { data: EmbeddedFileInfo }">
              <div class="flex gap-3">
                <DownloadButton
                  :compact="true"
                  :link="`${getAPILink()}/${data.download_path}`"
                />
                <DeleteButton
                  tooltip="Remove from HDF5 file"
                  @click="deleteFileFromHDF5(
                    route.query['file'] as string,
                    data.dataset_name
                  ).then(() => {
                    deletedFiles.push(data.dataset_name)
                    m.success('Embedded File Removed ', `${data.original_name} was removed from the HDF5 file.`)
                  })"
                />
              </div>
            </template>
          </Column>
        </DataTable>
        <Fieldset
          legend="Embed New Files"
        >
          <CustomFileUpload
            :url="buildEmbeddedFileUrl(route.query['file'] as string)"
            :max-file-size="1000000"
            :multiple="true"
            field-name="files"
            @success="() => m.success(
              'Embedding Successful',
              `${route.query['file']} was added to the HDF5 file.\n\nReload the page to see the new files.`
            )"
            @error="e => m.error(
              'Embedding Failed',
              e.xhr.response?.message || e.xhr.response?.error || 'Unknown Error'
            )"
          />
        </Fieldset>
      </AccordionContent>
    </AccordionPanel>
  </Accordion>
</template>
