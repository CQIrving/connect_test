<template>
  <div class="app-data-table-shell">
    <el-table :data="normalizedRows" stripe border class="page-table" :class="{ 'is-sortable': sortable }" empty-text="暂无数据" :header-cell-style="headerCellStyle" :row-class-name="rowClassName">
      <el-table-column
        v-if="sortable"
        label=""
        width="48"
        align="center"
        class-name="drag-column"
      >
        <template #default>
          <i class="el-icon-rank drag-handle"></i>
        </template>
      </el-table-column>
      <el-table-column
        v-for="item in visibleColumns"
        :key="`${item.label}-${item.index}`"
        :label="item.label"
        :prop="`col${item.index}`"
        :width="columnWidth(item.label)"
        :min-width="columnMinWidth(item.label)"
        :align="columnAlign(item.label)"
        :header-align="columnAlign(item.label)"
        :show-overflow-tooltip="shouldShowOverflowTooltip(item.label)"
      >
        <template #default="scope">
          <div v-if="isActionColumn(item.label)" class="action-group">
            <el-button
              v-for="action in splitActions(scope.row[`col${item.index}`])"
              :key="action"
              size="mini"
              plain
              :type="resolveActionType(action)"
              :disabled="isActionDisabled(action, scope.row)"
              class="table-action-btn"
              @click="emitAction(action, scope.row, scope.$index)"
            >
              {{ action }}
            </el-button>
          </div>
          <el-tag
            v-else-if="isStatusColumn(item.label)"
            size="mini"
            :type="resolveStatusType(scope.row[`col${item.index}`])"
            :class="['status-tag', resolveStatusClass(scope.row[`col${item.index}`])]"
            effect="plain"
          >
            {{ scope.row[`col${item.index}`] }}
          </el-tag>
          <span v-else-if="isAvatarColumn(item.label)" class="avatar-cell">
            <img v-if="isImageValue(scope.row[`col${item.index}`])" :src="scope.row[`col${item.index}`]" :alt="`${item.label}预览`" class="avatar-image" />
            <span v-else>{{ scope.row[`col${item.index}`] || imageFallbackText(item.label) }}</span>
          </span>
          <div v-else-if="isPlanContentColumn(item.label) && parsePlanContent(scope.row[`col${item.index}`])" class="plan-content-table-wrap">
            <div class="plan-content-summary">
              长期目标 {{ planContentCounts(scope.row[`col${item.index}`]).long }} 个，短期目标 {{ planContentCounts(scope.row[`col${item.index}`]).short }} 个
            </div>
            <div v-for="(goal, gi) in parsePlanContent(scope.row[`col${item.index}`])" :key="gi" class="plan-content-goal">
              <strong>{{ goal.长期目标 || '未填写长期目标' }}</strong>
              <table class="plan-content-mini-table">
                <thead><tr><th>短期目标</th><th>开始时间</th><th>结束时间</th></tr></thead>
                <tbody>
                  <tr v-for="(row, ri) in goal.短期目标" :key="ri">
                    <td>{{ row.短期目标 }}</td>
                    <td>{{ row.开始时间 }}</td>
                    <td>{{ row.结束时间 }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <el-button
            v-else-if="isTeachingRecordColumn(item.label)"
            size="mini"
            type="primary"
            plain
            class="table-action-btn"
            @click="emitAction('教学记录详情', scope.row, scope.$index)"
          >
            查看详情
          </el-button>
          <div v-else-if="isLessonContentColumn(item.label)" class="lesson-content-cell">
            <div class="lesson-content-line">
              <span class="lesson-content-label">内容：</span>
              <span>{{ parseLessonContentDisplay(scope.row[`col${item.index}`]).content }}</span>
            </div>
            <div class="lesson-content-line">
              <span class="lesson-content-label">重难点：</span>
              <span>{{ parseLessonContentDisplay(scope.row[`col${item.index}`]).difficulty }}</span>
            </div>
          </div>
          <span v-else class="table-cell-text">{{ formatCellValue(scope.row[`col${item.index}`], item.label) }}</span>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="pagination" class="table-pagination-bar">
      <span class="table-pagination-current">当前第 {{ currentPage }} / {{ pageCount }} 页</span>
      <el-pagination
        :current-page.sync="currentPage"
        :page-size="pageSize"
        :page-sizes="paginationPageSizes"
        :total="rowCount"
        layout="total, sizes, prev, pager, next, jumper"
        prev-text="上一页"
        next-text="下一页"
        @size-change="handlePageSizeChange"
        @current-change="handleCurrentPageChange"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Sortable from 'sortablejs'

type VisibleColumn = {
  label: string
  index: number
}

type DisplayRow = Record<string, string> & {
  __rowIndex: string
}

export default Vue.extend({
  props: {
    columns: {
      type: Array,
      default: () => [],
    },
    rows: {
      type: Array,
      default: () => [],
    },
    hiddenColumns: {
      type: Array,
      default: () => [],
    },
    minWidth: {
      type: Number,
      default: 120,
    },
    actionMinWidth: {
      type: Number,
      default: 220,
    },
    disabledActionCheck: {
      type: Function,
      default: null,
    },
    sortable: {
      type: Boolean,
      default: false,
    },
    pagination: {
      type: Boolean,
      default: false,
    },
    paginationPageSizes: {
      type: Array,
      default: () => [5, 10, 20, 50],
    },
    paginationDefaultPageSize: {
      type: Number,
      default: 10,
    },
  },
  data() {
    return {
      sortableInstance: null as Sortable | null,
      currentPage: 1,
      pageSize: this.paginationDefaultPageSize,
    }
  },
  computed: {
    visibleColumns(): VisibleColumn[] {
      const hidden = new Set((this.hiddenColumns as string[]).map(String))
      return (this.columns as string[])
        .map((label: string, index: number) => ({ label, index }))
        .filter((item: VisibleColumn) => !hidden.has(item.label))
    },
    rowCount(): number {
      return (this.rows as string[][]).length
    },
    pageCount(): number {
      return Math.max(1, Math.ceil(this.rowCount / this.pageSize))
    },
    paginationStart(): number {
      return this.pagination ? (this.currentPage - 1) * this.pageSize : 0
    },
    visibleRows(): string[][] {
      const rows = this.rows as string[][]
      if (!this.pagination) return rows
      return rows.slice(this.paginationStart, this.paginationStart + this.pageSize)
    },
    normalizedRows(): DisplayRow[] {
      return this.visibleRows.map((row: string[], rowIndex: number) => {
        const item: DisplayRow = { __rowIndex: String(this.paginationStart + rowIndex) }
        ;(this.columns as string[]).forEach((_: string, index: number) => {
          item[`col${index}`] = row[index] || ''
        })
        return item
      })
    },
  },
  watch: {
    rows() {
      this.currentPage = 1
      this.ensureValidCurrentPage()
      if (this.sortable) {
        this.$nextTick(() => this.initSortable())
      }
    },
    pageSize() {
      this.ensureValidCurrentPage()
    },
  },
  mounted() {
    if (this.sortable) {
      this.$nextTick(() => this.initSortable())
    }
  },
  beforeDestroy() {
    this.sortableInstance?.destroy()
    this.sortableInstance = null
  },
  methods: {
    initSortable() {
      const el = this.$el.querySelector('.el-table__body-wrapper tbody') as HTMLElement
      if (!el) return
      this.sortableInstance?.destroy()
      this.sortableInstance = Sortable.create(el, {
        animation: 180,
        handle: '.drag-handle',
        filter: '.action-group, .el-button, .el-checkbox, .el-radio, .el-switch',
        preventOnFilter: true,
        forceFallback: true,
        fallbackTolerance: 3,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        onEnd: ({ oldIndex, newIndex }) => {
          if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
          this.$emit('sort-end', {
            oldIndex: this.paginationStart + oldIndex,
            newIndex: this.paginationStart + newIndex,
          })
        },
      })
    },
    rowClassName({ rowIndex }: { rowIndex: number }): string {
      return this.sortable ? `sortable-row` : ''
    },
    isActionColumn(column: string): boolean {
      return ['操作', '历史得分'].includes(column)
    },
    isSequenceColumn(column: string): boolean {
      return ['序号', '编号'].includes(column)
    },
    isStatusColumn(column: string): boolean {
      return ['状态', '评估状态', '执行状态', '阅读状态', '家长通知状态', '家长阅读', '巡检结果', '推送状态'].includes(column)
    },
    isAvatarColumn(column: string): boolean {
      return ['头像', '照片', '教室图片'].includes(column)
    },
    imageFallbackText(column: string): string {
      return column === '教室图片' ? '暂无图片' : '头像'
    },
    isLongTextColumn(column: string): boolean {
      return ['通知内容', '详情及要求', '教学目标', '教学内容', '教学步骤', '教学过程摘要', '教学记录详情', '巡检记录', '题目', '答案', '考查维度', '长短期目标', '维度得分概览', '备注'].includes(column)
    },
    isPlanContentColumn(column: string): boolean {
      return column === '计划内容'
    },
    isTeachingRecordColumn(column: string): boolean {
      return column === '教学记录详情'
    },
    isLessonContentColumn(column: string): boolean {
      return column === '教学内容'
    },
    parsePlanContent(value: string): Array<{ 长期目标: string; 短期目标: Array<{ 短期目标: string; 开始时间: string; 结束时间: string }> }> | null {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].长期目标 !== undefined) {
          return parsed.map((goal: any) => ({
            长期目标: goal.长期目标 || '',
            短期目标: Array.isArray(goal.短期目标)
              ? goal.短期目标.map((row: any) => ({ 短期目标: row.短期目标 || row.目标 || '', 开始时间: row.开始时间 || '', 结束时间: row.结束时间 || '' }))
              : [],
          }))
        }
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].目标) {
          return [{
            长期目标: '阶段发展目标',
            短期目标: parsed.map((row: any) => ({ 短期目标: row.目标 || '', 开始时间: row.开始时间 || '', 结束时间: row.结束时间 || '' })),
          }]
        }
        return null
      } catch (error) {
        return null
      }
    },
    planContentCounts(value: string): { long: number; short: number } {
      const goals = this.parsePlanContent(value) || []
      return {
        long: goals.length,
        short: goals.reduce((total, goal) => total + (goal.短期目标 || []).length, 0),
      }
    },
    isImageValue(value: string): boolean {
      return String(value || '').startsWith('data:image/')
    },
    isActionDisabled(action: string, row: Record<string, string>): boolean {
      if (typeof this.disabledActionCheck === 'function') {
        return this.disabledActionCheck(action, row)
      }
      return false
    },
    columnWidth(column: string): number | undefined {
      if (this.isSequenceColumn(column)) return 72
      if (this.isAvatarColumn(column)) return 96
      if (['性别', '分值', '得分'].includes(column)) return 88
      if (['学科', '状态', '创建教师'].includes(column)) return 104
      if (['学号', '学生', '学期'].includes(column)) return 120
      if (['学生人数', '容纳人数', '已读人数', '未读人数', '知识点数'].includes(column)) return 104
      if (this.isStatusColumn(column)) return 116
      return undefined
    },
    columnMinWidth(column: string): number | undefined {
      if (this.columnWidth(column)) return undefined
      if (this.isActionColumn(column)) return this.actionMinWidth
      if (this.isPlanContentColumn(column)) return 500
      if (this.isLongTextColumn(column)) return 220
      if (['手机号', '最近更新时间', '最近操作时间', '最近送教时间', '发布时间', '提交时间', '评估时间', '上传时间'].includes(column)) return 150
      if (['班主任', '教师', '任教班级', '授课班级', '关联教案', '关联资源'].includes(column)) return 170
      return this.minWidth
    },
    columnAlign(column: string): string {
      return this.isLongTextColumn(column) ? 'left' : 'center'
    },
    shouldShowOverflowTooltip(column: string): boolean {
      return !this.isActionColumn(column) && !this.isAvatarColumn(column) && !this.isStatusColumn(column) && !this.isPlanContentColumn(column) && !this.isTeachingRecordColumn(column) && !this.isLessonContentColumn(column)
    },
    formatCellValue(value: string, column: string): string {
      const raw = String(value || '')
      if (!raw) return '-'
      if (column === '教学记录详情') return this.formatTeachingRecordValue(raw)
      if (column === '教学内容') return this.formatLessonContentValue(raw)
      if (column === '相关资源') return this.formatRelatedResourcesValue(raw)
      if (this.isFileDisplayColumn(column)) return this.formatFileValue(raw)
      if (this.isDateTimeColumn(column)) return this.formatDateTimeValue(raw)
      return raw
    },
    formatTeachingRecordValue(value: string): string {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => {
              const content = item.教学内容 || [item.日期, item.教学形式].filter(Boolean).join(' ') || '-'
              const effect = item.完成效果 || item.完成情况 || '-'
              return `${content} ${effect}`
            })
            .join('；')
        }
      } catch (error) {
        return value
      }
      return value
    },
    formatLessonContentValue(value: string): string {
      try {
        const parsed = JSON.parse(value)
        if (parsed && typeof parsed === 'object') {
          return `内容：${parsed.内容 || '-'}；重难点：${parsed.重难点 || '-'}`
        }
      } catch (error) {
        return value
      }
      return value
    },
    parseLessonContentDisplay(value: string): { content: string; difficulty: string } {
      const raw = String(value || '')
      if (!raw) return { content: '-', difficulty: '-' }
      try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          return {
            content: parsed.内容 || '-',
            difficulty: parsed.重难点 || '-',
          }
        }
      } catch (error) {
        return { content: raw, difficulty: '-' }
      }
      return { content: raw, difficulty: '-' }
    },
    formatRelatedResourcesValue(value: string): string {
      try {
        const parsed = JSON.parse(value)
        if (parsed && typeof parsed === 'object') {
          const selected = Array.isArray(parsed.selected) ? parsed.selected : []
          const uploaded = parsed.uploaded ? [parsed.uploaded] : []
          return [...selected, ...uploaded].filter(Boolean).join('、') || '-'
        }
      } catch (error) {
        return value
      }
      return value
    },
    isFileDisplayColumn(column: string): boolean {
      return ['课件', '资源上传', '文件', '附件'].includes(column)
    },
    isDateTimeColumn(column: string): boolean {
      return column.includes('时间') || column.includes('日期')
    },
    formatFileValue(value: string): string {
      try {
        const parsed = JSON.parse(value)
        if (parsed && typeof parsed === 'object') return String(parsed.name || value)
      } catch (error) {
        return value
      }
      return value
    },
    formatDateTimeValue(value: string): string {
      if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 16).replace('T', ' ')
      return value
    },
    splitActions(value: string): string[] {
      return String(value || '')
        .split('/')
        .map((item) => item.trim())
        .filter(Boolean)
    },
    resolveActionType(action: string): string {
      if (['删除', '归档'].includes(action)) return 'danger'
      if (['审核', '推送', '推送家长', '提醒完成', '提醒家长', '再次提醒', 'AI优化', 'AI 生成建议', '保存高清图片'].includes(action)) return 'warning'
      if (['查看', '查看详情', '查看统计', '查看图表', '查看分析图表', '查看记录', '预览', '下载', '借用', '学生主页', '历史得分', '开始评估', '继续评估'].includes(action)) return 'primary'
      return ''
    },
    resolveStatusType(value: string): string {
      if (value === '已完成') return 'success'
      if (value === '进行中') return 'warning'
      if (value === '未开始') return 'info'
      if (value === '未推送') return 'danger'
      if (['正常', '在用', '已发布', '已读', '通过', '已推送', '在读'].includes(value)) return 'success'
      if (['待完善', '送教班', '整改中', '待推送'].includes(value)) return 'warning'
      if (['未完成', '未读', '已归档'].includes(value)) return 'info'
      if (value === '可获取') return 'success'
      if (value === '不可获取') return 'info'
      if (value === '可借用') return 'success'
      if (value === '已借出') return 'warning'
      return ''
    },
    resolveStatusClass(value: string): string {
      const classMap: Record<string, string> = {
        已完成: 'is-status-completed',
        进行中: 'is-status-progress',
        未开始: 'is-status-pending',
        未推送: 'is-status-unpushed',
        可获取: 'is-status-available',
        不可获取: 'is-status-unavailable',
        可借用: 'is-status-borrowable',
        已借出: 'is-status-borrowed',
      }
      return classMap[value] || ''
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
    emitAction(action: string, row: DisplayRow, rowIndex: number) {
      if (this.isActionDisabled(action, row)) return
      const originalRowIndex = Number(row.__rowIndex || rowIndex)
      this.$emit('action', { action, row, rowIndex: originalRowIndex })
    },
    headerCellStyle() {
      return {
        background: 'rgba(248, 246, 241, 0.92)',
        color: '#6e7466',
        fontWeight: '600',
      }
    },
  },
})
</script>

<style scoped>
.drag-handle {
  cursor: grab;
  color: var(--muted, #6e7466);
  font-size: 16px;
  transition: color 0.2s, transform 0.15s;
  user-select: none;
}
.drag-handle:hover {
  color: var(--brand, #7d8c69);
  transform: scale(1.15);
}
.drag-handle:active {
  cursor: grabbing;
  color: var(--brand-deep, #5a6b48);
}
.table-pagination-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 14px 4px 0;
  color: #5f6b57;
  font-size: 13px;
}
.table-pagination-current {
  white-space: nowrap;
}
.plan-content-table-wrap {
  width: 100%;
}
.plan-content-mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  line-height: 1.4;
}
.plan-content-mini-table th {
  background: rgba(248, 246, 241, 0.92);
  color: #6e7466;
  font-weight: 600;
  padding: 4px 8px;
  border: 1px solid #e8e6de;
  text-align: center;
}
.plan-content-mini-table td {
  padding: 4px 8px;
  border: 1px solid #e8e6de;
  color: #556445;
  text-align: left;
}
.plan-content-mini-table td:nth-child(2),
.plan-content-mini-table td:nth-child(3) {
  text-align: center;
  white-space: nowrap;
}
.lesson-content-cell {
  line-height: 1.7;
  color: #4b5563;
  white-space: normal;
}
.lesson-content-line {
  display: flex;
  gap: 4px;
}
.lesson-content-label {
  flex: 0 0 auto;
  color: #6b7280;
}

@media (max-width: 768px) {
  .table-pagination-bar {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
