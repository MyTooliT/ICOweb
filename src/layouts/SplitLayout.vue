<template>
  <div class="[margin-bottom:40px]">
    <div class="p-3">
      <div class="flex flex-row">
        <div class="flex flex-col flex-grow border-gray-200 border-r pr-3 mr-3">
          <slot />
        </div>
        <div class="flex flex-col">
          <slot name="aside" />
        </div>
      </div>
      <slot name="bottom" />
    </div>
  </div>
</template>