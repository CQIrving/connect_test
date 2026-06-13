<template>
  <section class="page-section">
    <div class="section-head" v-if="title || description || extra || $slots.extra">
      <div>
        <h2 v-if="title">{{ title }}</h2>
        <p v-if="description">{{ description }}</p>
      </div>
      <slot name="extra">
        <div class="section-extra" v-if="extra">{{ extra }}</div>
      </slot>
    </div>
    <slot />
  </section>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    title: String,
    description: String,
    extra: String,
  },
})
</script>


