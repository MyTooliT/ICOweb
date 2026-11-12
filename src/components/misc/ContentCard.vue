<script setup lang="ts">
import { ref } from 'vue';

/**
 * Compact card for the content of a page: a header with title, optional
 * subtitle, tags next to the title (`title` slot) and actions on the right,
 * followed by the body. Use `flush` for tables and other content that should
 * fill the card edge to edge. A `collapsible` card can be folded to its
 * header by clicking the title.
 */
const props = withDefaults(defineProps<{
  title?: string
  subtitle?: string
  flush?: boolean
  collapsible?: boolean
  collapsed?: boolean
}>(), {
  title: '',
  subtitle: '',
  flush: false,
  collapsible: false,
  collapsed: false
})

const slots = defineSlots<{
  default?: () => unknown
  title?: () => unknown
  actions?: () => unknown
  footer?: () => unknown
}>()

const isCollapsed = ref(props.collapsible && props.collapsed)

function toggle() {
  if (props.collapsible) isCollapsed.value = !isCollapsed.value
}
</script>

<template>
  <section class="ico-card content-card flex flex-col min-w-0 overflow-hidden">
    <header
      v-if="title || slots.title || slots.actions"
      class="flex flex-row flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5"
    >
      <component
        :is="collapsible ? 'button' : 'div'"
        class="grow min-w-0 text-left"
        :class="{ 'cursor-pointer': collapsible }"
        :type="collapsible ? 'button' : undefined"
        :aria-expanded="collapsible ? !isCollapsed : undefined"
        @click="toggle"
      >
        <div class="flex flex-row flex-wrap items-center gap-2">
          <i
            v-if="collapsible"
            class="pi text-xs ico-muted"
            :class="isCollapsed ? 'pi-chevron-right' : 'pi-chevron-down'"
          />
          <h2 class="font-medium text-base leading-tight">
            {{ title }}
          </h2>
          <slot name="title" />
        </div>
        <p
          v-if="subtitle"
          class="text-xs ico-muted truncate"
          :title="subtitle"
        >
          {{ subtitle }}
        </p>
      </component>
      <div
        v-if="slots.actions"
        class="flex flex-row flex-wrap items-center gap-2"
      >
        <slot name="actions" />
      </div>
    </header>
    <div
      v-if="slots.default && !isCollapsed"
      class="grow min-h-0 border-t ico-divider first:border-t-0"
      :class="{ 'p-4': !flush }"
    >
      <slot />
    </div>
    <footer
      v-if="slots.footer && !isCollapsed"
      class="px-4 py-2 text-xs ico-muted border-t ico-divider"
    >
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped>
/*
 * Tables are part of the card: no row background of their own, compact cells
 * that line up with the card padding, and no border below the last row (the
 * card has its own border).
 */
.content-card {
  --p-datatable-header-cell-padding: 0.5rem 1rem;
  --p-datatable-body-cell-padding: 0.375rem 1rem;
  --p-datatable-row-background: transparent;
  --p-datatable-header-cell-background: transparent;
  --p-paginator-background: transparent;
}

.content-card :deep(.p-datatable-tbody > tr:last-child > td) {
  border-bottom-width: 0;
}

.content-card :deep(.p-datatable-paginator-bottom) {
  border-bottom-width: 0;
  border-top: 1px solid var(--p-content-border-color);
}
</style>
