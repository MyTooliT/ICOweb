<script setup lang="ts">
const version = __APP_VERSION__
</script>

<template>
  <div
    class="flex flex-col w-full justify-center items-center gap-4 h-stretch"
  >
    <h1 class="text-4xl text-primary">ICOgui</h1>
    <h2>Graphical User Interface for Sensory Tool Holder System by MyTooliT</h2>
    <p class="text-center">
      Technische Universität Wien <br />
      Institute of Production Engineering and Photonic Technologies
    </p>
    <p>Version: {{ version }}</p>
    <p>
      Report a bug:
      <a
        class="underline underline-offset-2"
        href="mailto:breurather@ift.at">
        breurather@ift.at
      </a>
    </p>
  </div>
</template>