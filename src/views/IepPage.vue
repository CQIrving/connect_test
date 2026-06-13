<template>
  <div>
    <PageSection>
      <EmptyState v-if="page.mode === 'empty'" :title="page.emptyTitle" :description="page.emptyDesc" action-text="班级管理" />
      <template v-else>
        <div class="switch-row">
          <button class="switch-chip" type="button" @click="openTopAction('添加计划')">添加计划</button>
        </div>
        <div class="filter-toolbar">
          <el-input v-model="filterValues.studentNo" clearable size="small" placeholder="请输入学号" class="toolbar-search" suffix-icon="el-icon-postcard"></el-input>
          <el-input v-model="filterValues.studentName" clearable size="small" placeholder="请输入学生" class="toolbar-search" suffix-icon="el-icon-search"></el-input>
          <el-button type="primary" size="small" plain @click="notifyFilterResult">查找</el-button>
          <el-button size="small" plain @click="resetFilters">重置</el-button>
        </div>
        <AppDataTable :columns="page.columns || []" :rows="filteredRows" :min-width="92" :action-min-width="170" pagination @action="handleTableAction" />
      </template>
    </PageSection>

    <DemoActionDialog
      :visible.sync="dialogVisible"
      :action="currentAction"
      :columns="page.columns || []"
      :row="currentRow"
      :student-options="studentOptions"
      :student-no-options="studentNoOptions"
      :student-profiles="studentProfiles"
      :lesson-options="lessonOptions"
      :current-user-name="currentUserName"
      @save="saveDialog"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import AppDataTable from '@/components/common/AppDataTable.vue'
import DemoActionDialog from '@/components/common/DemoActionDialog.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PageSection from '@/components/common/PageSection.vue'
import { getIepPage, getLessonPage, getTablePage } from '@/api/modules'
import { applyActionToValues, buildEmptyRow, cloneRows, columnsToRow, getDefaultActionText } from '@/utils/demo-actions'
import { deleteModuleRow, type RowRef, upsertModuleRow } from '@/db/demo-db'

export default Vue.extend({
  components: { AppDataTable, DemoActionDialog, EmptyState, PageSection },
  data() {
    return {
      page: {} as any,
      tableRows: [] as string[][],
      rowRefs: [] as RowRef[],
      studentOptions: [] as string[],
      studentNoOptions: [] as string[],
      studentProfiles: [] as Array<Record<string, string>>,
      lessonOptions: [] as string[],
      dialogVisible: false,
      currentAction: '',
      currentRow: {} as Record<string, string>,
      editingRowIndex: -1,
      filterValues: {
        studentNo: '',
        studentName: '',
      },
    }
  },
  created() { this.loadPage() },
  watch: { '$route.meta.pageKey': 'loadPage' },
  computed: {
    currentUserName(): string {
      return String(this.$store.state.currentUser?.name || '当前登录账户')
    },
    filteredItems(): Array<{ row: string[]; index: number }> {
      return this.tableRows
        .map((row: string[], index: number) => ({ row, index }))
        .filter((item: { row: string[] }) => this.matchFilters(item.row))
    },
    filteredRows(): string[][] {
      return this.filteredItems.map((item: { row: string[] }) => item.row)
    },
  },
  methods: {
    loadPage() {
      getIepPage(String(this.$route.meta.pageKey)).then((page) => {
        this.page = page || {}
        this.tableRows = cloneRows(page?.rows || []).map((row: string[]) => this.normalizeStudentPlanRow(row))
        this.rowRefs = [...(page?.rowRefs || [])]
        this.resetFilters()
      })
      this.loadStudentOptions()
      this.loadLessonOptions()
    },
    async loadStudentOptions() {
      const page = await getTablePage('student')
      const columns = page?.columns || []
      const nameIndex = columns.findIndex((column: string) => column === '姓名')
      const numberIndex = columns.findIndex((column: string) => column === '学号')
      const genderIndex = columns.findIndex((column: string) => column === '性别')
      const classIndex = columns.findIndex((column: string) => column === '班级')
      const disabilityIndex = columns.findIndex((column: string) => column === '障碍类型')
      const rows = this.normalizeStudentRowsForColumns(page?.rows || [], columns)
      this.studentProfiles = rows
        .map((row: string[]) => ({
          name: row[nameIndex] || '',
          studentNo: row[numberIndex] || '',
          gender: row[genderIndex] || '',
          className: row[classIndex] || '',
          disability: row[disabilityIndex] || '',
        }))
        .filter((item: Record<string, string>) => item.name || item.studentNo)
      this.studentOptions = rows
        .map((row: string[]) => row[nameIndex] || '')
        .filter(Boolean)
      this.studentNoOptions = rows
        .map((row: string[]) => row[numberIndex] || '')
        .filter(Boolean)
    },
    normalizeStudentRowsForColumns(rows: string[][], columns: string[]): string[][] {
      return rows.map((row, index) => this.normalizeStudentRowForColumns(row, index, columns))
    },
    normalizeStudentRowForColumns(row: string[], index: number, columns: string[]): string[] {
      const expectedLength = columns.length
      const sequence = row[0] || String(index + 1)
      const isLegacyAvatar = (value: string) => String(value || '').startsWith('头像') || String(value || '').startsWith('data:image/')
      const looksLikeLegacyWithSequence = row.length === expectedLength + 1 && isLegacyAvatar(row[1])
      if (looksLikeLegacyWithSequence) return [sequence, ...row.slice(2)]

      const looksLikeLegacyWithoutSequence = row.length === expectedLength && isLegacyAvatar(row[0])
      if (looksLikeLegacyWithoutSequence) return [sequence, ...row.slice(1)]

      const next = [...row]
      next[0] = next[0] || sequence
      return next
    },
    normalizeStudentPlanRow(row: string[]): string[] {
      const columns = this.page.columns || []
      const studentNoIndex = columns.findIndex((column: string) => column === '学号')
      const studentIndex = columns.findIndex((column: string) => column === '学生')
      if (studentNoIndex < 0 || studentIndex < 0) return row
      const avatarMap: Record<string, { studentNo: string; name: string }> = {
        头像A: { studentNo: 'S2026001', name: '陈思远' },
        头像B: { studentNo: 'S2026002', name: '王可欣' },
        头像C: { studentNo: 'S2026003', name: '刘宇恒' },
        头像D: { studentNo: 'S2026010', name: '周嘉宁' },
      }
      const matched = avatarMap[String(row[studentIndex] || '')]
      if (!matched) return row
      const next = [...row]
      next[studentNoIndex] = matched.studentNo
      next[studentIndex] = matched.name
      return next
    },
    async loadLessonOptions() {
      const page = await getLessonPage('lesson')
      const columns = page?.columns || []
      const nameIndex = columns.findIndex((column: string) => column === '教案名称')
      this.lessonOptions = (page?.rows || []).map((row: string[]) => row[nameIndex]).filter(Boolean)
    },
    matchFilters(row: string[]): boolean {
      const studentNo = this.filterValues.studentNo.trim()
      const studentName = this.filterValues.studentName.trim()
      const studentNoIndex = this.getColumnIndex('学号')
      const studentNameIndex = this.getColumnIndex('学生')
      const noMatched = !studentNo || (studentNoIndex >= 0 && String(row[studentNoIndex] || '').includes(studentNo))
      const nameMatched = !studentName || (studentNameIndex >= 0 && String(row[studentNameIndex] || '').includes(studentName))
      return noMatched && nameMatched
    },
    notifyFilterResult() {
      this.$message.success(`已筛选出 ${this.filteredRows.length} 条学生计划。`)
    },
    resetFilters() {
      this.filterValues = { studentNo: '', studentName: '' }
    },
    getColumnIndex(column: string): number {
      return (this.page.columns || []).findIndex((item: string) => item === column)
    },
    handleTableAction(payload: { action: string; row: Record<string, string>; rowIndex: number }) {
      const originalIndex = this.filteredItems[payload.rowIndex]?.index ?? payload.rowIndex
      if (payload.action === '删除') {
        this.confirmDeletePlan(originalIndex)
        return
      }
      this.currentAction = payload.action
      this.currentRow = { ...payload.row }
      this.editingRowIndex = originalIndex
      this.dialogVisible = true
    },
    openTopAction(action: string) {
      this.currentAction = action
      this.editingRowIndex = -1
      const row = buildEmptyRow(this.page.columns || [])
      const actionIndex = (this.page.columns || []).findIndex((column: string) => column === '操作')
      if (actionIndex >= 0) row[`col${actionIndex}`] = getDefaultActionText('添加学生计划', '编辑 / 删除')
      this.currentRow = applyActionToValues(action, row, this.page.columns || [])
      this.dialogVisible = true
    },
    async saveDialog(payload: { values: Record<string, string> }) {
      const nextValues = applyActionToValues(this.currentAction, payload.values, this.page.columns || [])
      const nextRow = columnsToRow(this.page.columns || [], nextValues)
      const currentRef = this.editingRowIndex >= 0 ? this.rowRefs[this.editingRowIndex] : undefined
      const plainId = await upsertModuleRow(String(this.$route.meta.pageKey), nextRow, currentRef?.plainId)
      if (this.editingRowIndex >= 0) {
        this.$set(this.tableRows, this.editingRowIndex, nextRow)
        this.$set(this.rowRefs, this.editingRowIndex, { plainId })
      } else {
        this.tableRows.unshift(nextRow)
        this.rowRefs.unshift({ plainId })
      }
      this.$message.success(`${this.currentAction} 已保存到当前本地数据库。`)
    },
    async confirmDeletePlan(rowIndex: number) {
      try {
        await this.$confirm('删除后会从当前本地学生计划列表移除，是否继续？', '提示', {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          confirmButtonClass: 'danger-confirm-button',
        })
        const currentRef = this.rowRefs[rowIndex]
        if (currentRef?.plainId) await deleteModuleRow(String(this.$route.meta.pageKey), currentRef.plainId)
        this.tableRows.splice(rowIndex, 1)
        this.rowRefs.splice(rowIndex, 1)
        this.$message.success('学生计划已删除。')
      } catch (error) {
        return
      }
    },
  },
})
</script>


