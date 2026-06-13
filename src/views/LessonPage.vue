<template>
  <div>
    <PageSection :title="page.title" :description="page.intro">
      <div class="switch-row" v-if="page.actions">
        <button v-for="action in page.actions" :key="action" class="switch-chip" type="button" @click="openTopAction(action)">{{ action }}</button>
      </div>
      <div class="filter-toolbar" v-if="page.filters">
        <el-input v-model="filterValues.lessonName" clearable size="small" placeholder="请输入教案名称" class="toolbar-search" suffix-icon="el-icon-search"></el-input>
        <el-select v-model="filterValues.teacher" clearable size="small" placeholder="请选择教师" class="toolbar-select">
          <el-option v-for="option in teacherOptions" :key="option" :label="option" :value="option"></el-option>
        </el-select>
        <el-select v-model="filterValues.student" clearable size="small" placeholder="请选择学生" class="toolbar-select">
          <el-option v-for="option in studentOptions" :key="option" :label="option" :value="option"></el-option>
        </el-select>
        <el-button type="primary" size="small" plain @click="notifyFilterResult">查找</el-button>
        <el-button size="small" plain @click="resetFilters">重置</el-button>
      </div>
      <div class="stat-grid" v-if="page.summary"><div class="mini-stat" v-for="item in page.summary" :key="item.label"><span>{{ item.label }}</span><strong>{{ item.value }}</strong></div></div>
      <div class="switch-row" v-if="page.subjects">
        <button
          v-for="subject in page.subjects"
          :key="subject"
          class="switch-chip"
          :class="{ 'is-active': subject === activeSubject }"
          @click="activeSubject = subject"
        >
          {{ subject }}
        </button>
      </div>
      <AppDataTable :columns="page.columns || []" :rows="displayRows" :action-min-width="230" pagination @action="handleTableAction" />
    </PageSection>
    <DemoActionDialog
      :visible.sync="dialogVisible"
      :action="currentAction"
      :columns="page.columns || []"
      :row="currentRow"
      :class-options="classOptions"
      :teacher-options="teacherOptions"
      :student-options="studentOptions"
      :resource-options="resourceOptions"
      :resource-option-types="resourceOptionTypes"
      :current-user-name="currentUserName"
      @save="saveDialog"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import AppDataTable from '@/components/common/AppDataTable.vue'
import DemoActionDialog from '@/components/common/DemoActionDialog.vue'
import PageSection from '@/components/common/PageSection.vue'
import { getLessonPage, getResourcePage, getTablePage } from '@/api/modules'
import { applyActionToValues, buildEmptyRow, cloneRows, columnsToRow, getDefaultActionText } from '@/utils/demo-actions'
import { deleteModuleRow, listAccounts, type RowRef, upsertModuleRow } from '@/db/demo-db'

export default Vue.extend({
  components: { AppDataTable, DemoActionDialog, PageSection },
  data() {
    return {
      page: {} as any,
      tableRows: [] as string[][],
      rowRefs: [] as RowRef[],
      classOptions: [] as string[],
      teacherOptions: [] as string[],
      studentOptions: [] as string[],
      resourceOptions: [] as string[],
      resourceOptionTypes: {} as Record<string, string>,
      activeSubject: '',
      filterValues: {
        lessonName: '',
        teacher: '',
        student: '',
      },
      dialogVisible: false,
      currentAction: '',
      currentRow: {} as Record<string, string>,
      editingRowIndex: -1,
    }
  },
  computed: {
    currentUserName(): string {
      return String(this.$store.state.currentUser?.name || '当前登录账户')
    },
    displayRows(): string[][] {
      const tabMatchedRows = this.matchSubjectRows(this.tableRows)
      return tabMatchedRows.filter((row) => this.matchFilters(row))
    },
  },
  created() { this.loadPage() },
  watch: { '$route.meta.pageKey': 'loadPage' },
  methods: {
    matchSubjectRows(rows: string[][]): string[][] {
      if (!this.activeSubject || this.activeSubject === '全部') return rows
      const subjectIndex = (this.page.columns || []).findIndex((column: string) => column === '课程' || column === '学科')
      if (subjectIndex < 0) return rows
      return rows.filter((row) => row[subjectIndex] === this.activeSubject)
    },
    loadPage() {
      getLessonPage(String(this.$route.meta.pageKey)).then((page) => {
        this.page = page || {}
        this.tableRows = cloneRows(page?.rows || []).map((row) => this.normalizeLessonRow(row))
        this.rowRefs = [...(page?.rowRefs || [])]
        this.activeSubject = page?.subjects?.[0] || ''
        this.resetFilters()
      })
      this.loadClassOptions()
      this.loadTeacherOptions()
      this.loadStudentOptions()
      this.loadResourceOptions()
    },
    async loadClassOptions() {
      const page = await getTablePage('class')
      const columns = page?.columns || []
      const classNameIndex = columns.findIndex((column: string) => column === '班级名称')
      this.classOptions = (page?.rows || [])
        .map((row: string[]) => row[classNameIndex] || row[1])
        .filter(Boolean)
    },
    async loadTeacherOptions() {
      const accounts = await listAccounts()
      this.teacherOptions = accounts.map((item) => item.name).filter(Boolean)
    },
    async loadStudentOptions() {
      const page = await getTablePage('student')
      const columns = page?.columns || []
      const nameIndex = columns.findIndex((column: string) => column === '姓名')
      this.studentOptions = (page?.rows || []).map((row: string[]) => row[nameIndex]).filter(Boolean)
    },
    async loadResourceOptions() {
      const page = await getResourcePage('resourceSchool')
      const columns = page?.columns || []
      const nameIndex = columns.findIndex((column: string) => column === '资源名称')
      const typeIndex = columns.findIndex((column: string) => column === '资源类型')
      const uploadIndex = columns.findIndex((column: string) => column === '资源上传')
      const typeMap: Record<string, string> = {}
      this.resourceOptions = (page?.rows || [])
        .map((row: string[]) => {
          const name = row[nameIndex] || ''
          if (name) typeMap[name] = [row[typeIndex], row[uploadIndex]].filter(Boolean).join('|')
          return name
        })
        .filter(Boolean)
      this.resourceOptionTypes = typeMap
    },
    handleTableAction(payload: { action: string; row: Record<string, string>; rowIndex: number }) {
      if (payload.action === '复制') {
        this.copyLesson(payload.row)
        return
      }
      if (payload.action === '删除') {
        this.confirmDeleteLesson(payload.row)
        return
      }
      this.currentAction = payload.action
      this.currentRow = { ...payload.row }
      this.editingRowIndex = this.resolveOriginalIndex(payload.row)
      this.dialogVisible = true
    },
    openTopAction(action: string) {
      this.currentAction = action
      this.editingRowIndex = -1
      const row = buildEmptyRow(this.page.columns || [])
      const actionIndex = (this.page.columns || []).findIndex((column: string) => column === '操作')
      if (actionIndex >= 0) row[`col${actionIndex}`] = getDefaultActionText(action, '查看 / 复制 / 编辑')
      this.currentRow = applyActionToValues(action, row, this.page.columns || [])
      this.dialogVisible = true
    },
    async copyLesson(row: Record<string, string>) {
      const columns = this.page.columns || []
      const nextValues = { ...row }
      nextValues.col1 = `${nextValues.col1 || '教案'}（复制）`
      const creatorIndex = columns.findIndex((column: string) => column === '创建人')
      if (creatorIndex >= 0) nextValues[`col${creatorIndex}`] = this.currentUserName
      const updatedIndex = columns.findIndex((column: string) => column.includes('更新时间'))
      if (updatedIndex >= 0) nextValues[`col${updatedIndex}`] = new Date().toISOString().slice(0, 10)
      const actionIndex = columns.findIndex((column: string) => column === '操作')
      if (actionIndex >= 0) nextValues[`col${actionIndex}`] = getDefaultActionText('添加教案')
      const nextRow = columnsToRow(columns, nextValues)
      const plainId = await upsertModuleRow(String(this.$route.meta.pageKey), nextRow)
      this.tableRows.unshift(nextRow)
      this.rowRefs.unshift({ plainId })
      this.$message.success('已复制教案，可在表格中编辑复用。')
    },
    async confirmDeleteLesson(row: Record<string, string>) {
      const rowIndex = this.resolveOriginalIndex(row)
      if (rowIndex < 0) return
      try {
        await this.$confirm('删除后会从当前教案列表移除，是否继续？', '提示', {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          confirmButtonClass: 'danger-confirm-button',
        })
        const currentRef = this.rowRefs[rowIndex]
        if (currentRef?.plainId) await deleteModuleRow(String(this.$route.meta.pageKey), currentRef.plainId)
        this.tableRows.splice(rowIndex, 1)
        this.rowRefs.splice(rowIndex, 1)
        this.$message.success('教案已删除。')
      } catch (error) {
        return
      }
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
    rowToRecord(row: string[]): Record<string, string> {
      const record: Record<string, string> = {}
      ;(this.page.columns || []).forEach((_: string, index: number) => {
        record[`col${index}`] = row[index] || ''
      })
      return record
    },
    resolveOriginalIndex(row: Record<string, string>): number {
      return this.tableRows.findIndex((item) => item[0] === row.col0)
    },
    matchFilters(row: string[]): boolean {
      const lessonName = this.filterValues.lessonName.trim()
      const teacher = this.filterValues.teacher
      const student = this.filterValues.student
      const lessonNameIndex = this.getColumnIndex('教案名称')
      const teacherIndex = this.getColumnIndex('教师')
      const studentIndex = this.getColumnIndex('学生')
      const lessonMatched = !lessonName || (lessonNameIndex >= 0 && String(row[lessonNameIndex] || '').includes(lessonName))
      const teacherMatched = !teacher || (teacherIndex >= 0 && String(row[teacherIndex] || '').includes(teacher))
      const studentMatched = !student || (studentIndex >= 0 && String(row[studentIndex] || '').includes(student))
      return lessonMatched && teacherMatched && studentMatched
    },
    notifyFilterResult() {
      this.$message.success(`已筛选出 ${this.displayRows.length} 条教案。`)
    },
    resetFilters() {
      this.filterValues = { lessonName: '', teacher: '', student: '' }
    },
    getColumnIndex(column: string): number {
      return (this.page.columns || []).findIndex((item: string) => item === column)
    },
    getUniqueColumnOptions(column: string): string[] {
      const index = this.getColumnIndex(column)
      if (index < 0) return []
      return Array.from(new Set(this.tableRows.map((row) => String(row[index] || '').trim()).filter(Boolean)))
    },
    normalizeLessonRow(row: string[]): string[] {
      const expectedLength = (this.page.columns || []).length
      const looksOldShape = row.length > expectedLength || (row.length >= 10 && !this.looksLikeJsonObject(row[5]))
      const normalized = looksOldShape
        ? [
            row[0] || '',
            row[1] || '',
            row[7] || this.currentUserName,
            this.resolveLegacyLessonStudents(row[1] || '', row[4] || ''),
            row[2] ? `完成${row[2]}相关教学目标。` : '',
            JSON.stringify({ 内容: row[5] || '', 重难点: row[3] || '' }),
            row[5] || '',
            row[6] || '',
            String(row[9] || row[8] || '查看 / 复制 / 编辑 / 删除').replace(/查看 \/ 复制 \/ 编辑(?! \/ 删除)/, '查看 / 复制 / 编辑 / 删除'),
          ]
        : [...row]
      const actionIndex = (this.page.columns || []).findIndex((column: string) => column === '操作')
      if (actionIndex >= 0 && !String(normalized[actionIndex] || '').includes('删除')) {
        normalized[actionIndex] = `${normalized[actionIndex] || '查看 / 复制 / 编辑'} / 删除`
      }
      return normalized
    },
    resolveLegacyLessonStudents(lessonName: string, className: string): string {
      if (lessonName.includes('手部') || className.includes('送教')) return '王可欣'
      if (lessonName.includes('情绪') || className.includes('启智')) return '陈思远、刘宇恒'
      return this.studentOptions.slice(0, 2).join('、')
    },
    looksLikeJsonObject(value: string): boolean {
      try {
        const parsed = JSON.parse(String(value || ''))
        return Boolean(parsed && typeof parsed === 'object' && !Array.isArray(parsed))
      } catch (error) {
        return false
      }
    },
  },
})
</script>


