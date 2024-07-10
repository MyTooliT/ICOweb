<script lang="ts" setup>
// NOTE: This wrapper is both for demo and testing purposes.

import Heading1 from './heading/Heading1.vue';
import Heading2 from './heading/Heading2.vue';
import Heading3 from './heading/Heading3.vue';
import Heading4 from './heading/Heading4.vue';
import Heading5 from './heading/Heading5.vue';
import Heading6 from './heading/Heading6.vue';
import Paragraph from './body/Paragraph.vue';
import Text from './body/Text.vue';
</script>

<template>
  <div class="mb-3 rounded-lg border border-primary p-3 text-left">
    <Heading1>Heading 1</Heading1>
    <Heading2>Heading 2</Heading2>
    <Heading3>Heading 3</Heading3>
    <Heading4>Heading 4</Heading4>
    <Heading5>Heading 5</Heading5>
    <Heading6>Heading 6</Heading6>
    <Paragraph>
      Paragraph: Lorem ipsum dolor sit amet consectetur adipisicing elit. Aut
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
      Dolores.
    </Paragraph>
    <Text>Textelement</Text>
  </div>
</template>
