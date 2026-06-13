import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    sidebarCollapsed: false,
    currentUser: {
      name: '王林',
      campus: '重庆大学电子音像出版社-测试区',
      school: '特殊儿童个别化教学平台',
    },
  },
  mutations: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
  },
})
