<template>
  <div class="book-card">
    <div class="book-cover">{{ cover }}</div>
    <div class="book-info">
      <h3>{{ title }}</h3>
      <p class="book-author">作者团队：{{ author }}</p>
      <p class="book-desc">{{ desc }}</p>
      <el-button type="primary" plain @click="$emit('action')">去做评量</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    title: String,
    cover: String,
    author: String,
    desc: String,
  },
})
</script>


