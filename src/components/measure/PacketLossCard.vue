<script setup lang="ts">
import ContentCard from '@/components/misc/ContentCard.vue';
import Tag from 'primevue/tag';
import { computed } from 'vue';

/**
 * Share of lost packets (0 to 1) of every source. A source that has not
 * reported yet is missing.
 */
const props = defineProps<{
  lossBySource: Record<string, number>
}>()

const sources = computed(() => Object.keys(props.lossBySource))
// The worst source decides (null before any data was received)
const worst = computed<number | null>(() =>
  sources.value.length === 0
    ? null
    : Math.max(...Object.values(props.lossBySource)) * 100
)

function severity(percent: number): string {
  return percent === 0 ? 'success' : percent < 1 ? 'warn' : 'danger'
}
</script>

<template>
  <ContentCard title="Packet Loss">
    <template #title>
      <Tag
        v-if="worst !== null"
        :value="`${worst.toFixed(2)} % lost`"
        :severity="severity(worst)"
      />
    </template>
    <template v-if="worst !== null">
      <div
        v-for="source in sources"
        :key="source"
        class="mb-2 last:mb-0"
      >
        <div
          v-if="sources.length > 1"
          class="flex flex-row justify-between text-xs ico-muted mb-1"
        >
          <span>{{ source }}</span>
          <span>{{ (lossBySource[source] * 100).toFixed(2) }} %</span>
        </div>
        <div
          class="h-2 rounded-full overflow-hidden flex flex-row bg-error"
          role="meter"
          :aria-label="`Received packets of ${source}`"
          :aria-valuenow="Math.round(100 - lossBySource[source] * 100)"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            class="h-full bg-[var(--p-green-500)]"
            :style="{ width: `${100 - lossBySource[source] * 100}%` }"
          />
        </div>
      </div>
    </template>
    <p
      v-else
      class="text-sm ico-muted"
    >
      Shown once data is received.
    </p>
  </ContentCard>
</template>
