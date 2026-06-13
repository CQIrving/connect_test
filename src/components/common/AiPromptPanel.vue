<template>
  <div class="ai-panel">
    <h2>天下特教是一家，有什么可以帮您的？</h2>
    <el-input v-model="draft" type="textarea" :rows="4" placeholder="让我帮您解决问题" />
    <div class="ai-toolbar">
      <div class="tag-row">
        <el-tag size="small" effect="plain" class="clickable-tag" @click.native="emitQuickAction('图片')">图片</el-tag>
        <el-tag size="small" effect="plain" class="clickable-tag" @click.native="emitQuickAction('指定学生')">指定学生</el-tag>
        <el-tag size="small" effect="plain" class="clickable-tag" @click.native="emitQuickAction('Agent')">Agent</el-tag>
      </div>
      <el-button type="primary" circle icon="el-icon-position" @click="handleSubmit"></el-button>
    </div>
    <div class="preset-list">
      <el-tag v-for="item in presets" :key="item" size="small" effect="plain" class="clickable-tag" @click.native="emitPreset(item)">{{ item }}</el-tag>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    presets: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return { draft: '' }
  },
  methods: {
    emitPreset(preset: string) {
      this.$emit('preset', preset)
      this.draft = `请基于${preset}生成演示方案`
    },
    emitQuickAction(action: string) {
      this.$emit('quick-action', action)
    },
    handleSubmit() {
      this.$emit('submit', this.draft)
    },
  },
})
</script>


