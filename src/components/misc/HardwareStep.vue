<script setup lang="ts">
import Tag from 'primevue/tag';
import { computed } from 'vue';

/**
 * done: finished, current: the one to work on next, upcoming: needs an
 * earlier step first
 */
export type TStepState = 'done' | 'current' | 'upcoming'

/**
 * One step of the hardware setup (CAN network -> STU -> STH) as a card: a
 * header with the step number, title and actions, and a body that is meant
 * for a table, which fills the card edge to edge.
 */
const props = withDefaults(defineProps<{
  step: number
  state: TStepState
  title: string
  subtitle?: string
  // Every step shows its status the same way: a tag next to the title
  status: string
  severity?: string
  error?: string
  // Nothing in a locked step can be used (the earlier step is not done)
  locked?: boolean
  lockedMessage?: string
}>(), {
  subtitle: '',
  severity: 'secondary',
  error: '',
  locked: false,
  lockedMessage: ''
})

const cardClass = computed(() => props.state === 'current'
  ? 'border-primary/50'
  : 'border-[var(--p-content-border-color)]'
)

const badgeClass = computed(() => ({
  done: 'bg-primary border-primary text-on-primary',
  current: 'border-primary text-primary',
  upcoming: 'border-outline-variant text-on-surface-variant'
}[props.state]))
</script>

<template>
  <section
    class="hardware-step overflow-hidden border transition-colors"
    :class="[cardClass, locked ? 'opacity-60 select-none' : '']"
    :data-state="state"
    :inert="locked"
  >
    <header class="flex flex-row items-start gap-4 p-5">
      <span
        class="flex items-center justify-center shrink-0 w-9 h-9 rounded-full border-2 font-medium"
        :class="badgeClass"
        aria-hidden="true"
      >
        <i
          v-if="state === 'done'"
          class="pi pi-check"
        />
        <template v-else>{{ step }}</template>
      </span>
      <div class="grow min-w-0">
        <div class="flex flex-row flex-wrap items-center gap-3">
          <h2 class="font-medium text-xl">
            {{ title }}
          </h2>
          <Tag
            :value="status"
            :severity="severity"
          />
        </div>
        <p
          v-if="subtitle"
          class="step-muted"
        >
          {{ subtitle }}
        </p>
        <p
          v-if="error"
          class="text-error"
        >
          {{ error }}
        </p>
      </div>
      <div
        v-if="!locked"
        class="flex flex-row items-center gap-4 shrink-0"
      >
        <slot name="actions" />
      </div>
    </header>
    <p
      v-if="locked"
      class="step-muted px-5 pb-5"
    >
      {{ lockedMessage }}
    </p>
    <div
      v-else
      class="border-t border-[var(--p-content-border-color)]"
    >
      <slot />
    </div>
  </section>
</template>

<style scoped>
/*
 * Look of the PrimeVue Card (as used for the config files), taken from the
 * global theme tokens so that it follows theme and dark mode.
 *
 * Do not use the `--p-card-*` variables here: PrimeVue only defines the tokens
 * of a component once an instance of it was mounted, so they would be missing
 * until a page with a Card (e.g. the config page) was visited.
 */
.hardware-step {
  background: var(--p-content-background);
  border-radius: var(--p-border-radius-xl);
  /* Same as the Aura Card */
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  color: var(--p-content-color);
}

.step-muted {
  color: var(--p-text-muted-color);
}

/*
 * Make the PrimeVue tables part of the card: the rows have no background of
 * their own and the cells line up with the card padding. The card clips the
 * corners, so the table has no outer border.
 */
.hardware-step {
  --p-datatable-header-cell-padding: 0.75rem 1.25rem;
  --p-datatable-body-cell-padding: 0.875rem 1.25rem;
  --p-datatable-row-background: transparent;
}

.hardware-step :deep(.p-datatable-tbody > tr:last-child > td) {
  border-bottom-width: 0;
}
</style>
