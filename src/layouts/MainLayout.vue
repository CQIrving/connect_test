<template>
  <el-container class="app-shell">
    <el-aside :width="collapsed ? '92px' : '248px'" class="shell-aside">
      <AppSidebar :collapsed="collapsed" />
    </el-aside>
    <el-container>
      <el-header class="shell-header">
        <AppHeader />
      </el-header>
      <el-main class="shell-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script lang="ts">
import Vue from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

export default Vue.extend({
  components: { AppSidebar, AppHeader },
  computed: {
    collapsed(): boolean {
      return this.$store.state.sidebarCollapsed
    },
  },
})
</script>


