<template>
  <div class="header-bar">
    <div class="header-left">
      <el-button circle size="mini" icon="el-icon-s-fold" @click="$store.commit('toggleSidebar')" />
      <div>
        <p class="crumb-title">{{ $route.meta.title || '首页' }}</p>
        <span class="crumb-desc">提示：如在使用过程中有任何疑问，可联系 023-88050379 获取帮助。</span>
      </div>
    </div>
    <div class="header-right">
      <div class="ai-pill" @click="$router.push('/ai')">特教 AI 智能体</div>
      <div class="user-pill">
        <i class="el-icon-user-solid"></i>
        <span>{{ currentUser.name }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  computed: {
    currentUser(): any {
      return this.$store.state.currentUser
    },
  },
})
</script>


