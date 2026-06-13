<template>
  <div class="stat-card">
    <div class="stat-icon"><i :class="icon"></i></div>
    <div>
      <p>{{ label }}</p>
      <strong>{{ value }}</strong>
      <span>{{ trend }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    label: String,
    value: String,
    trend: String,
    icon: {
      type: String,
      default: 'el-icon-data-analysis',
    },
  },
})
</script>


