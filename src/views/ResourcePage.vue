<template>
  <div>
    <PageSection :title="sectionTitle" :description="sectionDescription">
      <div class="resource-hero" v-if="showResourceHero"><div><h3>{{ page.hero.title }}</h3><p>{{ page.hero.desc }}</p></div><el-button type="primary" plain @click="openCardAction({ title: page.hero.title, desc: page.hero.desc, actions: ['进入首页'] })">资源库首页</el-button></div>
      <div v-if="isSchoolResourcePage" class="switch-row">
        <button class="switch-chip" type="button" @click="openTopAction('上传')">上传</button>
      </div>
      <div class="resource-filter-board" v-if="page.filters">
        <div class="toolbar-inline resource-filter-line">
          <el-input v-model="keyword" size="small" placeholder="资源名称" class="toolbar-search" suffix-icon="el-icon-search"></el-input>
          <el-select v-for="filter in page.filters" :key="filter" v-model="filterValues[filter]" clearable size="small" :placeholder="filter" class="toolbar-select">
            <el-option v-for="option in page.filterOptions[filter]" :key="option" :label="option" :value="option"></el-option>
          </el-select>
          <el-button type="primary" size="small" plain @click="$message.success(`已筛选出 ${filteredRows.length} 个资源。`)">查找</el-button>
          <el-button size="small" plain @click="resetFilters">重置</el-button>
        </div>
      </div>
      <div v-if="page.cards" class="resource-card-grid">
        <div v-for="card in page.cards" :key="card.title" class="resource-card">
          <div class="resource-thumb"></div>
          <h3>{{ card.title }}</h3>
          <div class="tag-row">
            <el-tag v-for="action in card.actions" :key="action" size="small" class="clickable-tag" @click.native="openCardAction(card, action)">{{ action }}</el-tag>
          </div>
          <small v-if="cardStates[card.title]" class="resource-card-state">{{ cardStates[card.title] }}</small>
        </div>
      </div>
      <template v-else>
        <AppDataTable
          :columns="page.columns || []"
          :rows="displayRows"
          :hidden-columns="page.hiddenColumns || []"
          :action-min-width="240"
          :disabled-action-check="disabledActionCheck"
          :sortable="isSchoolResourcePage"
          @action="handleTableAction"
          @sort-end="handleSortEnd"
        />
        <div v-if="isSchoolResourcePage" class="resource-pagination-bar">
          <span class="resource-pagination-current">当前第 {{ currentPage }} / {{ pageCount }} 页</span>
          <el-pagination
            :current-page.sync="currentPage"
            :page-size="pageSize"
            :page-sizes="pageSizeOptions"
            :total="filteredRows.length"
            layout="total, sizes, prev, pager, next, jumper"
            prev-text="上一页"
            next-text="下一页"
            @size-change="handlePageSizeChange"
            @current-change="handleCurrentPageChange"
          />
        </div>
      </template>
    </PageSection>
    <DemoActionDialog :visible.sync="dialogVisible" :action="currentAction" :columns="dialogColumns" :row="currentRow" @save="saveDialog" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import AppDataTable from '@/components/common/AppDataTable.vue'
import DemoActionDialog from '@/components/common/DemoActionDialog.vue'
import PageSection from '@/components/common/PageSection.vue'
import { getResourcePage } from '@/api/modules'
import { applyActionToValues, buildEmptyRow, cloneRows, columnsToRow, getDefaultActionText } from '@/utils/demo-actions'
import { deleteResourceByExternalId, getAppState, setAppState, type RowRef, upsertResourceRow } from '@/db/demo-db'

export default Vue.extend({
  components: { AppDataTable, DemoActionDialog, PageSection },
  data() {
    return {
      page: {} as any,
      tableRows: [] as string[][],
      rowRefs: [] as RowRef[],
      cardStates: {} as Record<string, string>,
      filterValues: {} as Record<string, string>,
      keyword: '',
      dialogVisible: false,
      currentAction: '',
      currentRow: {} as Record<string, string>,
      dialogColumns: [] as string[],
      editingRowIndex: -1,
      currentPage: 1,
      pageSize: 10,
      pageSizeOptions: [5, 10, 20, 50] as number[],
    }
  },
  computed: {
    isSchoolResourcePage(): boolean {
      return String(this.$route.meta.pageKey) === 'resourceSchool'
    },
    sectionTitle(): string {
      return this.isSchoolResourcePage ? '' : this.page.title
    },
    sectionDescription(): string {
      return this.isSchoolResourcePage ? '' : this.page.hero?.desc
    },
    showResourceHero(): boolean {
      return Boolean(this.page.hero && !this.isSchoolResourcePage)
    },
    cardStateKey(): string {
      return `resource-page:card-states:${String(this.$route.meta.pageKey || 'default')}`
    },
    filteredRows(): string[][] {
      return this.filteredItems.map((item: { row: string[] }) => item.row)
    },
    displayItems(): Array<{ row: string[]; index: number }> {
      if (!this.isSchoolResourcePage) return this.filteredItems
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredItems.slice(start, start + this.pageSize)
    },
    displayRows(): string[][] {
      return this.displayItems.map((item: { row: string[] }) => item.row)
    },
    filteredItems(): Array<{ row: string[]; index: number }> {
      return this.tableRows
        .map((row: string[], index: number) => ({ row, index }))
        .filter((item: { row: string[] }) => this.matchKeyword(item.row))
        .filter((item: { row: string[] }) => this.matchFilters(item.row))
    },
    pageCount(): number {
      return Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize))
    },
  },
  created() { this.loadPage() },
  watch: {
    '$route.meta.pageKey': 'loadPage',
    keyword() {
      this.currentPage = 1
    },
    filterValues: {
      deep: true,
      handler() {
        this.currentPage = 1
      },
    },
    filteredRows() {
      this.ensureValidCurrentPage()
    },
  },
  methods: {
    disabledActionCheck(action: string, row: Record<string, string>): boolean {
      return false
    },
    handleSortEnd(payload: { oldIndex: number; newIndex: number }) {
      const { oldIndex, newIndex } = payload
      if (oldIndex === newIndex) return
      const fromItem = this.displayItems[oldIndex]
      const toItem = this.displayItems[newIndex]
      const originalOld = fromItem?.index ?? oldIndex
      const row = this.tableRows.splice(originalOld, 1)[0]
      const ref = this.rowRefs.splice(originalOld, 1)[0]
      const originalNew = toItem?.index ?? newIndex
      const adjustedNew = originalOld < originalNew ? originalNew : originalNew
      this.tableRows.splice(adjustedNew, 0, row)
      this.rowRefs.splice(adjustedNew, 0, ref)
      this.renumberResourceRows()
      this.$message.success('排序已更新。')
    },
    loadPage() {
      getResourcePage(String(this.$route.meta.pageKey)).then((page) => {
        this.page = page || {}
        this.tableRows = cloneRows(page?.rows || [])
        this.rowRefs = [...(page?.rowRefs || [])]
        this.currentPage = 1
        this.resetFilters()
        this.loadCardStates()
      })
    },
    async loadCardStates() {
      this.cardStates = await getAppState<Record<string, string>>(this.cardStateKey, {})
    },
    handleTableAction(payload: { action: string; row: Record<string, string>; rowIndex: number }) {
      const originalIndex = this.displayItems[payload.rowIndex]?.index ?? payload.rowIndex
      if (payload.action === '删除') {
        this.deleteResource(originalIndex)
        return
      }
      if (payload.action === '下载') {
        this.downloadResource(payload.row)
        return
      }
      if (payload.action === '借用') {
        this.borrowResource(payload.row, originalIndex)
        return
      }
      this.currentAction = payload.action
      this.currentRow = { ...payload.row }
      this.dialogColumns = this.page.columns || []
      this.editingRowIndex = originalIndex
      this.dialogVisible = true
    },
    borrowResource(row: Record<string, string>, rowIndex: number) {
      const resourceName = this.getRowValue(row, '资源名称') || '教具'
      this.$message.success(`${resourceName} 借用成功。`)
    },
    openTopAction(action: string) {
      this.currentAction = action
      this.editingRowIndex = -1
      this.dialogColumns = this.page.columns || []
      const row = buildEmptyRow(this.page.columns || [])
      const actionIndex = (this.page.columns || []).findIndex((column: string) => column === '操作')
      if (actionIndex >= 0) row[`col${actionIndex}`] = getDefaultActionText(action, '下载 / 编辑 / 删除')
      const rangeIndex = (this.page.columns || []).findIndex((column: string) => column === '应用范围')
      if (rangeIndex >= 0) row[`col${rangeIndex}`] = '全校'
      this.currentRow = applyActionToValues(action, row, this.page.columns || [])
      this.dialogVisible = true
    },
    openCardAction(card: { title: string; desc?: string; actions?: string[] }, action = '卡片演示') {
      this.currentAction = action
      this.editingRowIndex = -1
      const columns = ['资源主题', '处理内容', '页面回显']
      this.dialogColumns = columns
      const row = buildEmptyRow(columns)
      row.col0 = card.title
      row.col1 = card.desc || `${card.title} 的 ${action}`
      row.col2 = `已选择动作：${action}`
      this.currentRow = row
      this.dialogVisible = true
    },
    async saveDialog(payload: { values: Record<string, string> }) {
      if (this.page.cards) {
        const nextStates = {
          ...this.cardStates,
          [payload.values.col0 || '资源卡片']: payload.values.col2 || '已完成',
        }
        this.cardStates = nextStates
        await setAppState(this.cardStateKey, nextStates)
        this.$message.success(`${this.currentAction} 已保存。`)
        return
      }

      const nextValues = applyActionToValues(this.currentAction, payload.values, this.page.columns || [])
      const categoryIndex = (this.page.columns || []).findIndex((column: string) => column === '资源类型')
      if (categoryIndex >= 0 && nextValues[`col${categoryIndex}`] === '教具') {
        const actionIndex = (this.page.columns || []).findIndex((column: string) => column === '操作')
        if (actionIndex >= 0) {
          const originalAction = nextValues[`col${actionIndex}`] || ''
          nextValues[`col${actionIndex}`] = originalAction.replace(/下载/g, '借用')
        }
      }
      const nextRow = columnsToRow(this.page.columns || [], nextValues)
      const currentRef = this.editingRowIndex >= 0 ? this.rowRefs[this.editingRowIndex] : undefined
      const externalId = await upsertResourceRow(nextRow, currentRef?.externalId)
      if (this.editingRowIndex >= 0) {
        this.$set(this.tableRows, this.editingRowIndex, nextRow)
        this.$set(this.rowRefs, this.editingRowIndex, { plainId: currentRef?.plainId || '', externalId })
      } else {
        nextRow[0] = '1'
        this.tableRows.unshift(nextRow)
        this.rowRefs.unshift({ plainId: '', externalId })
        this.renumberResourceRows()
        this.currentPage = 1
      }
      this.$message.success(`${this.currentAction} 已保存到当前本地数据库。`)
    },
    async downloadResource(row: Record<string, string>) {
      const resourceName = this.getRowValue(row, '资源名称') || '资源'
      const filePayload = this.parseResourceFileValue(this.getRowValue(row, '资源上传'))
      const fileName = filePayload.name || `${resourceName}.txt`
      let blob: Blob
      if (filePayload.dataUrl) {
        const response = await fetch(filePayload.dataUrl)
        blob = await response.blob()
      } else {
        blob = new Blob([`${resourceName}\n\n未检测到上传文件，已生成对应的下载文件。`], { type: 'text/plain;charset=utf-8' })
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)
      this.$message.success(`${fileName} 已开始下载。`)
    },
    getRowValue(row: Record<string, string>, column: string): string {
      const index = (this.page.columns || []).findIndex((item: string) => item === column)
      return index >= 0 ? row[`col${index}`] || '' : ''
    },
    parseResourceFileValue(value: string): { name: string; type?: string; dataUrl?: string } {
      const raw = String(value || '')
      if (!raw) return { name: '' }
      try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          return {
            name: String(parsed.name || ''),
            type: String(parsed.type || ''),
            dataUrl: String(parsed.dataUrl || ''),
          }
        }
      } catch (error) {
        return { name: raw }
      }
      return { name: raw }
    },
    async deleteResource(rowIndex: number) {
      try {
        await this.$confirm('删除后资源将被移除，是否继续？', '提示', {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          confirmButtonClass: 'danger-confirm-button',
        })
        const currentRef = this.rowRefs[rowIndex]
        if (currentRef?.externalId) await deleteResourceByExternalId(currentRef.externalId)
        this.tableRows.splice(rowIndex, 1)
        this.rowRefs.splice(rowIndex, 1)
        this.renumberResourceRows()
        this.ensureValidCurrentPage()
        this.$message.success('资源已移除。')
      } catch (error) {
        return
      }
    },
    matchKeyword(row: string[]): boolean {
      const value = this.keyword.trim()
      if (!value) return true
      const nameIndex = (this.page.columns || []).findIndex((column: string) => column === '资源名称')
      return nameIndex >= 0 ? String(row[nameIndex] || '').includes(value) : row.join(' ').includes(value)
    },
    renumberResourceRows() {
      if (!this.isSchoolResourcePage) return
      this.tableRows = this.tableRows.map((row: string[], index: number) => [String(index + 1), ...row.slice(1)])
    },
    matchFilters(row: string[]): boolean {
      return (this.page.filters || []).every((filter: string) => {
        const value = this.filterValues[filter]
        if (!value) return true
        const index = (this.page.columns || []).findIndex((column: string) => column === filter)
        return index < 0 ? row.join(' ').includes(value) : row[index] === value
      })
    },
    resetFilters() {
      this.keyword = ''
      const next: Record<string, string> = {}
      ;(this.page.filters || []).forEach((filter: string) => {
        next[filter] = ''
      })
      this.filterValues = next
      this.currentPage = 1
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
  },
})
</script>

<style scoped>
.resource-pagination-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 14px 4px 0;
  color: #5f6b57;
  font-size: 13px;
}
.resource-pagination-current {
  white-space: nowrap;
}

@media (max-width: 768px) {
  .resource-pagination-bar {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
