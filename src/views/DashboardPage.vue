<template>
  <div>
    <PageSection :title="page.title" :description="page.description">
      <template v-if="page.logs">
        <div v-if="inspectionRoomNo" class="filter-toolbar">
          <el-tag type="success" effect="plain">当前筛查教师编号：{{ inspectionRoomNo }}</el-tag>
          <el-button size="small" plain @click="$router.push({ path: '/dashboard/inspection' })">查看全部日志</el-button>
        </div>
        <div class="table-actions"><el-button type="primary" plain @click="addInspectionLog">新增巡检日志</el-button></div>
        <el-table :data="paginatedLogData" stripe border class="page-table">
          <el-table-column label="序号" prop="seq" width="72" align="center" header-align="center" />
          <el-table-column label="教师编号" prop="col0" min-width="150" align="center" header-align="center" />
          <el-table-column label="巡检日期" prop="col1" min-width="120" align="center" header-align="center" />
          <el-table-column label="巡检结果" prop="col2" width="116" align="center" header-align="center">
            <template #default="scope"><el-tag :type="scope.row.col2 === '通过' ? 'success' : 'warning'" effect="plain">{{ scope.row.col2 }}</el-tag></template>
          </el-table-column>
          <el-table-column label="巡检人" prop="col3" min-width="120" align="center" header-align="center" />
          <el-table-column label="巡检记录" prop="col4" min-width="240" align="left" header-align="left" show-overflow-tooltip />
          <el-table-column label="操作" min-width="180" align="center" header-align="center">
            <template #default="scope">
              <div class="action-group">
                <el-button v-if="scope.row.col2 === '整改中'" size="mini" type="success" plain @click="approveInspectionLog(scope.row)">整改通过</el-button>
                <el-button size="mini" type="danger" plain @click="deleteInspectionLog(scope.row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <div class="table-pagination-bar">
          <span class="table-pagination-current">当前第 {{ currentPage }} / {{ pageCount }} 页</span>
          <el-pagination
            :current-page.sync="currentPage"
            :page-size="pageSize"
            :page-sizes="pageSizeOptions"
            :total="logData.length"
            layout="total, sizes, prev, pager, next, jumper"
            prev-text="上一页"
            next-text="下一页"
            @size-change="handlePageSizeChange"
            @current-change="handleCurrentPageChange"
          />
        </div>
      </template>
      <template v-else>
        <div class="stat-grid dashboard-stat-grid"><StatCard v-for="item in page.metrics" :key="item.label" :label="item.label" :value="item.value" :trend="item.trend" :icon="item.icon" /></div>
        <div class="dashboard-grid dashboard-primary-grid">
          <div class="dashboard-map">
            <div class="map-card-head">
              <div>
                <h3>重庆市校区分布</h3>
              </div>
              <span>32 所校区</span>
            </div>
            <div class="cq-map-wrap">
              <ChartPanel class="cq-geo-chart" :options="mapOptions" />
            </div>
          </div>
          <ChartPanel :options="trendOptions" />
          <ChartPanel :options="pieOptions" />
          <div class="notice-card work-insight-card">
            <div class="work-card-head">
              <div>
                <h3>近期工作看板</h3>
                <p>按任务类型汇总待办、巡检、推送和整改进展。</p>
              </div>
              <div class="work-summary-ring" :style="workRingStyle">
                <div>
                  <strong>{{ workCompletionRate }}%</strong>
                  <span>整体进度</span>
                </div>
              </div>
            </div>
            <div class="work-item-list">
              <div v-for="item in workItems" :key="item.title" :class="['work-item-card', item.tone]">
                <i :class="item.icon"></i>
                <div class="work-item-main">
                  <div class="work-item-title">
                    <strong>{{ item.title }}</strong>
                    <em>{{ item.badge }}</em>
                  </div>
                  <span>{{ item.desc }}</span>
                  <div class="work-progress"><span :style="{ width: `${item.progress}%` }"></span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="trend-strip dashboard-trend-strip">
          <div v-for="item in trendInsights" :key="item.title" :class="['trend-card', 'visual-trend-card', item.tone]">
            <div class="trend-card-head">
              <span>{{ item.title }}</span>
              <strong>{{ item.value }}</strong>
            </div>
            <div class="mini-bars">
              <span v-for="(bar, index) in item.series" :key="`${item.title}-${index}`" :style="{ height: `${bar}%` }"></span>
            </div>
            <small>{{ item.desc }}</small>
          </div>
        </div>
      </template>
    </PageSection>

    <el-dialog :visible.sync="addLogVisible" title="新增巡检日志" width="640px" class="demo-action-dialog" @close="resetAddLogForm">
      <div class="transfer-class-tip">
        填写巡检日志信息，所有字段均为必填，保存后日志将出现在列表中。
      </div>
      <el-form label-width="92px" class="demo-form">
        <el-form-item label="教师编号" required>
          <el-input v-model="addLogForm.roomNo" placeholder="请输入教师编号" />
        </el-form-item>
        <el-form-item label="巡检日期" required>
          <el-date-picker v-model="addLogForm.date" type="date" value-format="yyyy-MM-dd" placeholder="请选择巡检日期" class="full-width" />
        </el-form-item>
        <el-form-item label="巡检结果" required>
          <el-select v-model="addLogForm.result" placeholder="请选择巡检结果" class="full-width">
            <el-option label="通过" value="通过" />
            <el-option label="整改中" value="整改中" />
          </el-select>
        </el-form-item>
        <el-form-item label="巡检人" required>
          <el-select v-model="addLogForm.inspector" filterable clearable placeholder="请搜索或选择巡检人" class="full-width">
            <el-option v-for="name in inspectorOptions" :key="name" :label="name" :value="name" />
          </el-select>
        </el-form-item>
        <el-form-item label="巡检记录" required>
          <el-input v-model="addLogForm.record" type="textarea" :rows="3" placeholder="请输入巡检记录内容" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="addLogVisible = false">取消</el-button>
        <el-button type="primary" plain @click="saveAddLog">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import * as echarts from 'echarts'
import chongqingGeoJson from '@/assets/maps/chongqing.geo.json'
import ChartPanel from '@/components/common/ChartPanel.vue'
import PageSection from '@/components/common/PageSection.vue'
import StatCard from '@/components/common/StatCard.vue'
import { getDashboardPage } from '@/api/modules'
import { deleteModuleRow, listAccounts, listModuleRows, type RowRef, upsertModuleRow } from '@/db/demo-db'

const CHONGQING_MAP_NAME = 'chongqing-city'
const echartsMapRegistry = echarts as typeof echarts & { getMap?: (name: string) => unknown }
if (!echartsMapRegistry.getMap?.(CHONGQING_MAP_NAME)) {
  echarts.registerMap(CHONGQING_MAP_NAME, chongqingGeoJson as any)
}

const chongqingDistrictCenters = ((chongqingGeoJson as any).features || []).reduce(
  (centers: Record<string, number[]>, feature: any) => {
    const name = feature?.properties?.name
    const center = feature?.properties?.center || feature?.properties?.centroid
    if (name && Array.isArray(center)) centers[name] = center
    return centers
  },
  {},
)

const chongqingDistrictNames = ((chongqingGeoJson as any).features || []).map((feature: any) => feature?.properties?.name).filter(Boolean)

export default Vue.extend({
  components: { ChartPanel, PageSection, StatCard },
  data() {
    return {
      page: {} as any,
      inspectionLogs: [] as string[][],
      inspectionRefs: [] as RowRef[],
      addLogVisible: false,
      currentPage: 1,
      pageSize: 10,
      pageSizeOptions: [5, 10, 20, 50] as number[],
      addLogForm: {
        roomNo: '',
        date: '',
        result: '',
        inspector: '',
        record: '',
      },
      inspectorOptions: [] as string[],
      defaultNotices: ['待完成 IEP 审核 5 项', '待同步教育局师资数据 1 次', '待发起家校通知 2 条'],
    }
  },
  computed: {
    inspectionRoomNo(): string {
      return String(this.$route.query.roomNo || '').trim()
    },
    logData(): any[] {
      return this.inspectionLogs
        .map((row: string[], sourceIndex: number) => ({ sourceIndex, col0: row[0], col1: row[1], col2: row[2], col3: row[3], col4: row[4] }))
        .filter((row: Record<string, any>) => !this.inspectionRoomNo || row.col0 === this.inspectionRoomNo)
        .map((row: Record<string, any>, index: number) => ({ ...row, seq: index + 1 }))
    },
    paginatedLogData(): any[] {
      const start = (this.currentPage - 1) * this.pageSize
      return this.logData.slice(start, start + this.pageSize)
    },
    pageCount(): number {
      return Math.max(1, Math.ceil(this.logData.length / this.pageSize))
    },
    workItems(): Array<{ title: string; desc: string; badge: string; progress: number; icon: string; tone: string }> {
      const notices = this.page.notices?.length ? this.page.notices : this.defaultNotices
      const presets = [
        { title: '送教记录补录', badge: '8 条', progress: 68, icon: 'el-icon-edit-outline', tone: 'is-warm' },
        { title: '巡检日志更新', badge: '5 条', progress: 82, icon: 'el-icon-document-checked', tone: 'is-green' },
        { title: '评估结果推送', badge: '3 份', progress: 56, icon: 'el-icon-position', tone: 'is-blue' },
        { title: '整改复检跟进', badge: '1 项', progress: 42, icon: 'el-icon-warning-outline', tone: 'is-rose' },
      ]
      return notices.map((notice: string, index: number) => ({
        ...presets[index % presets.length],
        desc: notice,
      }))
    },
    workCompletionRate(): number {
      if (!this.workItems.length) return 0
      const total = this.workItems.reduce((sum, item) => sum + item.progress, 0)
      return Math.round(total / this.workItems.length)
    },
    workRingStyle(): Record<string, string> {
      return {
        background: `conic-gradient(#7d8c69 ${this.workCompletionRate}%, rgba(125, 140, 105, 0.14) 0)`,
      }
    },
    campusList(): Array<{ district: string; name: string }> {
      return this.page.campusList || []
    },
    campusByDistrict(): Record<string, string[]> {
      return this.campusList.reduce((districtMap, campus) => {
        if (!districtMap[campus.district]) districtMap[campus.district] = []
        districtMap[campus.district].push(campus.name)
        return districtMap
      }, {} as Record<string, string[]>)
    },
    mapDistrictData(): Array<{ name: string; value: number; campuses: string[] }> {
      const campusByDistrict = this.campusByDistrict
      return chongqingDistrictNames.map((name: string) => ({
        name,
        value: campusByDistrict[name]?.length || 0,
        campuses: campusByDistrict[name] || [],
      }))
    },
    mapPointData(): Array<{ name: string; coord: number[]; value: number; district: string; campusList: string[] }> {
      const campusByDistrict = this.campusByDistrict
      return this.campusList
        .map((campus, index) => {
          const center = chongqingDistrictCenters[campus.district]
          const ring = index % 8
          const offsetLng = ((ring % 4) - 1.5) * 0.035
          const offsetLat = (Math.floor(ring / 4) - 0.5) * 0.035
          return {
            name: campus.name,
            district: campus.district,
            coord: Array.isArray(center) ? [center[0] + offsetLng, center[1] + offsetLat] : center,
            value: 1,
            campusList: campusByDistrict[campus.district] || [],
          }
        })
        .filter((campus) => Array.isArray(campus.coord))
    },
    mapOptions(): any {
      const campusByDistrict = this.campusByDistrict
      return {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          confine: true,
          borderWidth: 0,
          padding: [10, 12],
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          textStyle: { color: '#334033', fontSize: 12 },
          formatter: (params: any) => {
            if (params.data?.district) {
              const names = params.data.campusList || [params.data.name]
              return `<strong>${params.data.name}</strong><br/>所属区域：${params.data.district}<br/>同区校区：${names.join('、')}`
            }
            const campuses = params.data?.campuses || campusByDistrict[params.name] || []
            const campusLines = campuses.length ? campuses.map((name: string, index: number) => `${index + 1}. ${name}`).join('<br/>') : '暂无校区'
            return `<strong>${params.name}</strong><br/>校区数量：${campuses.length} 所<br/>${campusLines}`
          },
        },
        series: [
          {
            name: '重庆校区分布',
            type: 'map',
            map: CHONGQING_MAP_NAME,
            roam: true,
            zoom: 1.08,
            scaleLimit: { min: 0.8, max: 5 },
            top: 8,
            bottom: 18,
            selectedMode: false,
            data: this.mapDistrictData,
            itemStyle: {
              areaColor: '#edf3e7',
              borderColor: 'rgba(255,255,255,0.96)',
              borderWidth: 1,
              shadowColor: 'rgba(83, 92, 71, 0.16)',
              shadowBlur: 8,
            },
            emphasis: {
              label: { show: true, color: '#334033', fontWeight: 700 },
              itemStyle: { areaColor: '#e7b36a', borderColor: '#fff', borderWidth: 1.4 },
            },
            label: {
              show: false,
              color: 'rgba(51,64,51,0.58)',
              fontSize: 9,
            },
            markPoint: {
              symbol: 'circle',
              symbolSize: 10,
              itemStyle: { color: '#c27a2c', borderColor: '#fff', borderWidth: 2, shadowColor: 'rgba(126, 76, 25, 0.28)', shadowBlur: 10 },
              emphasis: { itemStyle: { color: '#7d8c69', borderColor: '#fff', borderWidth: 3 } },
              label: { show: false },
              data: this.mapPointData,
            },
          },
        ],
      }
    },
    trendInsights(): Array<{ title: string; value: string; desc: string; series: number[]; tone: string }> {
      const trend = this.page.trend || { delivery: [12, 15, 18], guidance: [6, 8, 10] }
      return [
        {
          title: '送教上门趋势',
          value: '本周 +18%',
          desc: '较上周新增 6 次服务',
          series: this.normalizeSeries(trend.delivery || []),
          tone: 'is-green',
        },
        {
          title: '巡回指导趋势',
          value: '本周 +12%',
          desc: '完成 14 次入校指导',
          series: this.normalizeSeries(trend.guidance || []),
          tone: 'is-warm',
        },
        {
          title: '资源教室巡检',
          value: '5 条',
          desc: '1 条需要整改复检',
          series: this.normalizeSeries([2, 3, 4, 5, 4]),
          tone: 'is-blue',
        },
      ]
    },
    trendOptions(): any {
      const trend = this.page.trend || { weeks: ['第1周', '第2周', '第3周'], delivery: [12, 15, 18], guidance: [6, 8, 10] }
      return {
        color: ['#7c8c6a', '#d6a86e'],
        tooltip: { trigger: 'axis' },
        legend: { data: ['送教上门', '巡回指导'] },
        xAxis: { type: 'category', data: trend.weeks },
        yAxis: { type: 'value' },
        series: [
          { name: '送教上门', type: 'line', smooth: true, data: trend.delivery },
          { name: '巡回指导', type: 'bar', data: trend.guidance, barWidth: 24, borderRadius: [8, 8, 0, 0] },
        ],
      }
    },
    pieOptions(): any {
      const data = this.page.disabilityDistribution || []
      return { color: ['#5f6f52', '#e7b36a', '#9ab89a', '#cfd8c5', '#d14d72'], tooltip: { trigger: 'item' }, series: [{ type: 'pie', radius: ['45%', '70%'], data }] }
    },
  },
  created() { this.loadPage() },
  watch: {
    '$route.meta.pageKey': 'loadPage',
    '$route.query.roomNo'() {
      this.currentPage = 1
      this.ensureValidCurrentPage()
    },
    logData() {
      this.ensureValidCurrentPage()
    },
    pageSize() {
      this.ensureValidCurrentPage()
    },
  },
  methods: {
    async loadPage() {
      const pageKey = String(this.$route.meta.pageKey)
      const page = await getDashboardPage(pageKey)
      this.page = page || {}
      if (page?.logs) {
        const { rows, rowRefs } = await listModuleRows(pageKey)
        this.inspectionLogs = rows.map((row) => row.slice(1))
        this.inspectionRefs = rowRefs
        this.loadInspectorOptions()
      } else {
        this.inspectionLogs = [...(page?.logs || [])]
        this.inspectionRefs = []
      }
      this.ensureValidCurrentPage()
    },
    async loadInspectorOptions() {
      const accounts = await listAccounts()
      this.inspectorOptions = accounts.map((item) => item.name).filter(Boolean)
    },
    addInspectionLog() {
      this.addLogForm.roomNo = this.inspectionRoomNo || 'ROOM-2026-001'
      this.addLogForm.date = new Date().toISOString().slice(0, 10)
      this.addLogForm.result = '通过'
      this.addLogForm.inspector = ''
      this.addLogForm.record = ''
      this.addLogVisible = true
    },
    resetAddLogForm() {
      this.addLogForm = { roomNo: '', date: '', result: '', inspector: '', record: '' }
    },
    async saveAddLog() {
      const { roomNo, date, result, inspector, record } = this.addLogForm
      if (!roomNo) { this.$message.warning('请填写教师编号。'); return }
      if (!date) { this.$message.warning('请选择巡检日期。'); return }
      if (!result) { this.$message.warning('请选择巡检结果。'); return }
      if (!inspector) { this.$message.warning('请选择巡检人。'); return }
      if (!record) { this.$message.warning('请填写巡检记录。'); return }
      try {
        const nextRow = [roomNo, date, result, inspector, record]
        const plainId = await upsertModuleRow(String(this.$route.meta.pageKey), ['', ...nextRow])
        this.inspectionLogs.push(nextRow)
        this.inspectionRefs.push({ plainId })
        this.currentPage = this.pageCount
        this.addLogVisible = false
        this.$message.success('巡检日志已新增到当前页面。')
      } catch (error) {
        console.error('新增巡检日志失败:', error)
        this.$message.error('新增巡检日志失败，请重试。')
      }
    },
    async approveInspectionLog(row: Record<string, any>) {
      const sourceIndex = Number(row.sourceIndex)
      const current = this.inspectionLogs[sourceIndex]
      if (!current) return
      const nextRow = [...current]
      nextRow[2] = '通过'
      const ref = this.inspectionRefs[sourceIndex]
        const plainId = await upsertModuleRow(String(this.$route.meta.pageKey), ['', ...nextRow], ref?.plainId)
        this.$set(this.inspectionLogs, sourceIndex, nextRow)
        if (!ref) this.$set(this.inspectionRefs, sourceIndex, { plainId })
        this.ensureValidCurrentPage()
        this.$message.success('该巡检记录已标记为整改通过。')
    },
    async deleteInspectionLog(row: Record<string, any>) {
      try {
        await this.$confirm('删除后会从当前巡检日志中移除，是否继续？', '提示', {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          confirmButtonClass: 'danger-confirm-button',
        })
        const sourceIndex = Number(row.sourceIndex)
        const ref = this.inspectionRefs[sourceIndex]
        if (ref?.plainId) await deleteModuleRow(String(this.$route.meta.pageKey), ref.plainId)
        this.inspectionLogs.splice(sourceIndex, 1)
        this.inspectionRefs.splice(sourceIndex, 1)
        this.ensureValidCurrentPage()
        this.$message.success('巡检日志已删除。')
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') console.warn(error)
      }
    },
    handlePageSizeChange(size: number) {
      this.pageSize = size
      this.currentPage = 1
    },
    handleCurrentPageChange(page: number) {
      this.currentPage = page
      this.ensureValidCurrentPage()
    },
    ensureValidCurrentPage() {
      if (this.currentPage > this.pageCount) this.currentPage = this.pageCount
      if (this.currentPage < 1) this.currentPage = 1
    },
    normalizeSeries(values: number[]): number[] {
      const max = Math.max(...values, 1)
      return values.map((value) => Math.max(18, Math.round((value / max) * 100)))
    },
  },
})
</script>

