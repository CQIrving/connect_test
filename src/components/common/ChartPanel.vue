<template>
  <div ref="chartEl" class="chart-panel"></div>
</template>

<script lang="ts">
import Vue from 'vue'
import * as echarts from 'echarts'

export default Vue.extend({
  props: {
    options: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      chart: null as echarts.ECharts | null,
    }
  },
  mounted() {
    this.chart = echarts.init(this.$refs.chartEl as HTMLDivElement)
    this.chart.setOption(this.options)
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    this.chart?.dispose()
  },
  watch: {
    options: {
      deep: true,
      handler(value) {
        this.chart?.setOption(value)
      },
    },
  },
  methods: {
    handleResize() {
      this.chart?.resize()
    },
  },
})
</script>


