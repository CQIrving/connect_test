<template>
  <div>
    <div class="stat-grid">
      <StatCard v-for="item in stats" :key="item.label" :label="item.label" :value="item.value" :trend="item.trend" :icon="item.icon" />
    </div>

    <PageSection title="核心业务入口" description="按开发文档保留 9 个核心模块，点击卡片直接进入代表页面。">
      <div class="feature-grid">
        <div v-for="card in cards" :key="card.title" class="feature-card" :style="{ background: card.accent }" @click="openCard(card)">
          <h3>{{ card.title }}</h3>
          <p>{{ card.desc }}</p>
          <div class="feature-card-footer">
            <span>点击进入</span>
            <i class="el-icon-right"></i>
          </div>
        </div>
      </div>
    </PageSection>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { getHomeCards, getHomeStats } from '@/api/modules'
import PageSection from '@/components/common/PageSection.vue'
import StatCard from '@/components/common/StatCard.vue'

export default Vue.extend({
  components: { PageSection, StatCard },
  data() {
    return {
      stats: [] as any[],
      cards: [] as any[],
    }
  },
  created() {
    getHomeStats().then((stats) => (this.stats = stats))
    getHomeCards().then((cards) => (this.cards = cards))
  },
  methods: {
    openCard(card: { route?: string }) {
      if (card.route) this.$router.push(card.route)
    },
  },
})
</script>


