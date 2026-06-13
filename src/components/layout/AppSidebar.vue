<template>
  <div class="sidebar-wrap">
    <el-menu
      :default-active="$route.path"
      class="sidebar-menu"
      background-color="transparent"
      text-color="#5f675c"
      active-text-color="#223528"
      :collapse="collapsed"
      :collapse-transition="false"
      router
    >
      <template v-for="menu in menus">
        <el-menu-item
          v-if="isSingleMenu(menu)"
          :key="menu.route || menu.title"
          :index="menu.route"
          class="sidebar-menu-item"
          :class="{ 'is-menu-active': isMenuActive(menu) }"
          :style="menuStyle(menu)"
        >
          <i :class="menu.icon"></i>
          <span>{{ menu.title }}</span>
        </el-menu-item>
        <el-submenu
          v-else
          :key="menu.title"
          :index="menu.title"
          class="sidebar-submenu"
          :class="{ 'is-menu-active': isMenuActive(menu) }"
          :style="menuStyle(menu)"
        >
          <template slot="title">
            <i :class="menu.icon"></i>
            <span>{{ menu.title }}</span>
          </template>
          <el-menu-item v-for="child in menu.children" :key="child.route" :index="child.route" :style="menuStyle(menu)">
            <i v-if="child.icon" class="sidebar-child-icon" :class="child.icon"></i>
            <span>{{ child.title }}</span>
          </el-menu-item>
        </el-submenu>
      </template>
    </el-menu>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { getSidebarMenus } from '@/api/modules'

export default Vue.extend({
  props: {
    collapsed: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      menus: [] as any[],
    }
  },
  created() {
    getSidebarMenus().then((menus) => {
      this.menus = menus
    })
  },
  methods: {
    isSingleMenu(menu: { route?: string; children?: Array<{ route: string }> }) {
      return Boolean(menu.route && !menu.children?.length)
    },
    isMenuActive(menu: { route?: string; children?: Array<{ route: string }> }) {
      if (this.isSingleMenu(menu)) return menu.route === this.$route.path
      return Boolean(menu.children?.some((child) => child.route === this.$route.path))
    },
    menuStyle(menu: { color?: string; activeColor?: string }) {
      return {
        '--menu-color': menu.color || '#7d8c69',
        '--menu-active-color': menu.activeColor || menu.color || '#5f6f52',
      }
    },
  },
})
</script>


