<script setup lang="ts">
import ContentCard from '@/components/misc/ContentCard.vue';
import { PreflightResponse } from '@/client';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

/**
 * The check of all units before a measurement (multi STU support): A
 * measurement only starts if every unit is ready.
 */
defineProps<{
  result: PreflightResponse | null
  loading: boolean
  /** The check failed (e.g. the API does not answer) */
  error?: string | null
}>()

defineEmits<{ (e: 'check'): void }>()
</script>

<template>
  <ContentCard title="Preflight Check">
    <template #title>
      <Tag
        v-if="result"
        :value="result.ready ? 'Ready' : 'Not ready'"
        :severity="result.ready ? 'success' : 'danger'"
      />
    </template>
    <template #actions>
      <Button
        v-tooltip.left="'Check all units again'"
        icon="pi pi-refresh"
        size="small"
        text
        rounded
        aria-label="Check again"
        :loading="loading"
        @click="$emit('check')"
      />
    </template>
    <p
      v-if="error"
      class="text-sm text-error"
    >
      {{ error }}
    </p>
    <ul
      v-if="result"
      class="flex flex-col gap-2 text-sm"
    >
      <li
        v-for="unit in result.units"
        :key="unit.unit"
        data-test="preflight-unit"
      >
        <div class="flex flex-row items-center gap-2">
          <i
            class="pi"
            :class="unit.ok
              ? 'pi-check-circle text-[var(--p-green-500)]'
              : 'pi-exclamation-triangle text-error'"
          />
          <span class="font-medium">{{ unit.tool_name ?? unit.unit }}</span>
          <span class="ico-muted text-xs">{{ unit.unit }}</span>
        </div>
        <div
          v-if="unit.ok"
          class="ico-muted text-xs ml-6"
        >
          <span v-if="unit.rssi != null">RSSI {{ unit.rssi }} dB</span>
          <span v-if="unit.supply_voltage != null">
            · {{ unit.supply_voltage.toFixed(2) }} V
          </span>
          <span v-if="unit.sample_rate != null">
            · {{ Math.round(unit.sample_rate) }} Hz
          </span>
        </div>
        <ul
          v-else
          class="text-error text-xs ml-6 list-disc list-inside"
        >
          <li
            v-for="problem in unit.problems"
            :key="problem"
          >
            {{ problem }}
          </li>
        </ul>
      </li>
    </ul>
    <p
      v-else-if="!error"
      class="text-sm ico-muted"
    >
      Not checked yet.
    </p>
  </ContentCard>
</template>
