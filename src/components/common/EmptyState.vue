<template>
  <div class="empty-state">
    <div class="empty-icon"><i class="el-icon-box"></i></div>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <el-button type="primary" plain>{{ actionText }}</el-button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    title: { type: String, default: '暂无数据' },
    description: { type: String, default: '请先补充基础数据后再继续当前操作。' },
    actionText: { type: String, default: '去处理' },
  },
})
</script>


