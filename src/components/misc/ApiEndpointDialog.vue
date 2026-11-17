<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Button, Dialog, InputText, Select } from 'primevue';
import {
  ApiEndpoint,
  applyApiEndpoint,
  buildApiLink,
  getApiEndpoint,
  hasApiEndpointOverride,
  isProxied,
  resetApiEndpoint,
  validateApiEndpoint
} from '@/api/apiEndpoint.ts';

const visible = defineModel<boolean>('visible', { default: false })

const protocols = ['http', 'https']
const form = ref<ApiEndpoint>(getApiEndpoint())
const isOverride = ref(hasApiEndpointOverride())

// Show the current address whenever the dialog opens
watch(visible, (open) => {
  if (!open) return
  form.value = getApiEndpoint()
  isOverride.value = hasApiEndpointOverride()
})

const error = computed(() => validateApiEndpoint(form.value))
const unchanged = computed(() => {
  const current = getApiEndpoint()
  return current.protocol === form.value.protocol
    && current.hostname === form.value.hostname.trim()
    && current.port === form.value.port.trim()
})
const preview = computed(() => buildApiLink(form.value))

// Used by the Apply button and by Enter in a field
function apply() {
  if (error.value || unchanged.value) return
  applyApiEndpoint(form.value)
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="ICOapi address"
    class="w-[28rem] max-w-[95vw]"
  >
    <div class="flex flex-col gap-3 text-sm">
      <p class="ico-muted">
        Connect to a different ICOapi. The page reloads after applying.
        The address is stored in this browser.
      </p>
      <div class="flex flex-row gap-2">
        <div class="flex flex-col gap-1">
          <label for="api-protocol">Protocol</label>
          <Select
            v-model="form.protocol"
            input-id="api-protocol"
            :options="protocols"
            class="w-28"
          />
        </div>
        <div class="flex flex-col gap-1 grow min-w-0">
          <label for="api-hostname">Hostname</label>
          <InputText
            id="api-hostname"
            v-model="form.hostname"
            placeholder="localhost"
            autocomplete="off"
            :invalid="!!error && form.hostname.trim() === ''"
            @keydown.enter.prevent="apply"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label for="api-port">Port</label>
          <InputText
            id="api-port"
            v-model="form.port"
            inputmode="numeric"
            placeholder="default"
            autocomplete="off"
            class="w-24"
            @keydown.enter.prevent="apply"
          />
        </div>
      </div>
      <p class="font-mono ico-muted [overflow-wrap:anywhere]">
        {{ preview }}
      </p>
      <p
        v-if="isProxied(form)"
        class="text-xs ico-muted"
      >
        Requests go through the ICOweb server, which forwards them to this address.
      </p>
      <p
        v-if="error"
        class="text-error"
      >
        {{ error }}
      </p>
    </div>
    <template #footer>
      <Button
        label="Reset to default"
        icon="pi pi-undo"
        size="small"
        severity="secondary"
        outlined
        :disabled="!isOverride"
        @click="resetApiEndpoint()"
      />
      <Button
        label="Apply"
        icon="pi pi-check"
        size="small"
        :disabled="!!error || unchanged"
        @click="apply"
      />
    </template>
  </Dialog>
</template>
