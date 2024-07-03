<script lang="ts" setup>
// NOTE: This wrapper is both for demo and testing purposes.

import H1 from './heading/H1.vue';
import H2 from './heading/H2.vue';
import H3 from './heading/H3.vue';
import H4 from './heading/H4.vue';
import H5 from './heading/H5.vue';
import H6 from './heading/H6.vue';
import Paragraph from './body/Paragraph.vue';
import Text from './body/Text.vue';
</script>

<template>
  <div class="mb-3 rounded-lg border border-primary p-3 text-left">
    <H1>Heading 1</H1>
    <H2>Heading 2</H2>
    <H3>Heading 3</H3>
    <H4>Heading 4</H4>
    <H5>Heading 5</H5>
    <H6>Heading 6</H6>
    <Paragraph
      >Paragraph: Lorem ipsum dolor sit amet consectetur adipisicing elit. Aut
      dolor quisquam rerum vero, cum rem neque in error? Mollitia exercitationem
      tempora impedit obcaecati dolorem reprehenderit possimus eum aliquam magni
      odit! Quia provident laboriosam amet laudantium minima ducimus perferendis
      magni accusantium, explicabo, optio sit corporis. Nemo ab a perferendis
      consectetur iure saepe totam aspernatur quisquam vitae illum sunt ex
      aperiam non, accusantium est exercitationem facere obcaecati minus
      consequuntur dolore dignissimos voluptatem voluptas. Voluptatem sed ex
      totam ad asperiores eaque possimus fugiat aspernatur sint reprehenderit,
      nihil ratione eveniet. Blanditiis facere amet cum doloremque non, delectus
      distinctio tempore. Adipisci exercitationem officia asperiores?
      Dolores.</Paragraph
    >
    <Text>Textelement</Text>
  </div>
</template>
