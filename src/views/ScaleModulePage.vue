<template>
  <div>
    <PageSection :title="page.title" :description="page.intro">
      <div v-if="page.cards" class="scale-grid">
        <div v-for="card in page.cards" :key="card.title" class="tool-card">
          <div class="tool-cover">{{ card.cover }}</div>
          <div>
            <h3>{{ card.title }}</h3>
            <p>{{ card.desc }}</p>
            <el-button type="primary" plain @click="$router.push(card.route)">{{ card.button }}</el-button>
          </div>
        </div>
      </div>

      <template v-else>
        <div class="table-actions">
          <el-dropdown v-if="isScaleManagedPage" trigger="click" :disabled="!scaleOptions.length" @command="openScaleManager">
            <el-button size="small" type="primary" plain :disabled="!scaleOptions.length">
              量表管理<i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item v-if="!scaleOptions.length" disabled>暂无量表</el-dropdown-item>
              <el-dropdown-item v-for="item in scaleOptions" :key="item" :command="item">{{ item }}</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          <el-button v-if="isCustomScalePage" size="small" type="primary" plain @click="openCustomScaleCreator">创建自有量表</el-button>
        </div>

        <div v-if="isScaleWorkspaceMode" class="scale-manager">
          <div class="scale-manager-hero">
            <div>
              <h3>{{ scaleWorkspaceTitle }}</h3>
              <p>{{ scaleWorkspaceDescription }}</p>
              <div v-if="isCustomScaleCreateMode" class="custom-scale-meta">
                <el-input v-model="customForm.name" size="small" placeholder="请输入自有量表名称" />
                <el-input v-model="customForm.desc" size="small" type="textarea" :rows="3" placeholder="请输入量表说明，可描述适用对象、评分方式或使用场景" />
              </div>
            </div>
            <el-tag type="warning" effect="plain">{{ isCustomScaleCreateMode ? '从0建表' : '编辑量表' }}</el-tag>
          </div>

          <div class="scale-manager-actions is-top">
            <el-button size="small" plain @click="exitScaleManager">返回评估列表</el-button>
            <el-button size="small" type="primary" plain @click="openQuestionDialog()">添加题目</el-button>
            <el-button size="small" type="success" plain @click="openStudentPreview">学生答题预览</el-button>
            <el-button size="small" plain @click="renumberActiveScale">重排题号</el-button>
            <el-button v-if="isCustomScaleCreateMode" size="small" type="danger" plain @click="clearCustomScaleDraft">清空草稿</el-button>
            <el-button v-else size="small" type="danger" plain @click="deleteActiveScale">删除量表</el-button>
            <el-button size="small" type="primary" plain @click="saveActiveScale">保存</el-button>
          </div>

          <AppDataTable :columns="scaleQuestionColumns" :rows="managedQuestionRows" :action-min-width="260" :min-width="140" pagination @action="handleManagedQuestionAction" />

          <div class="scale-manager-actions is-bottom">
            <el-button v-if="isCustomScaleCreateMode" size="small" type="danger" plain @click="clearCustomScaleDraft">清空草稿</el-button>
            <el-button v-else size="small" type="danger" plain @click="deleteActiveScale">删除量表</el-button>
            <el-button size="small" type="primary" plain @click="saveActiveScale">保存</el-button>
          </div>
        </div>

        <template v-else>
          <div class="filter-toolbar">
            <el-input v-model="filterValues.studentNo" clearable size="small" placeholder="请输入学号" class="toolbar-search" suffix-icon="el-icon-postcard"></el-input>
            <el-input v-model="filterValues.studentName" clearable size="small" placeholder="请输入学生" class="toolbar-search" suffix-icon="el-icon-search"></el-input>
            <el-select v-model="filterValues.scaleName" clearable size="small" placeholder="请选择评估量表" class="toolbar-select">
              <el-option v-for="item in scaleOptions" :key="item" :label="item" :value="item"></el-option>
            </el-select>
            <el-button type="primary" size="small" plain @click="notifyFilterResult">查找</el-button>
            <el-button size="small" plain @click="resetFilters">重置</el-button>
          </div>
          <AppDataTable :columns="assessmentColumns" :rows="filteredAssessmentRows" :action-min-width="180" pagination @action="handleAssessmentAction" />
        </template>
      </template>
    </PageSection>

    <el-dialog :visible.sync="questionDialogVisible" :title="questionDialogTitle" width="820px" class="demo-action-dialog">
      <el-form label-width="92px" class="demo-form">
        <el-form-item label="题型">
          <el-select v-model="questionEditForm.type" class="full-width">
            <el-option label="选择题" value="选择题"></el-option>
            <el-option label="判断题" value="判断题"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="题目" required>
          <el-input v-model="questionEditForm.title" type="textarea" :rows="7" placeholder="请输入题干、选项或判断说明" />
        </el-form-item>
        <el-form-item label="答案">
          <el-input v-model="questionEditForm.answer" placeholder="例如 A、B、√、×" />
        </el-form-item>
        <el-form-item label="分值">
          <el-input v-model="questionEditForm.score" placeholder="默认 5" />
        </el-form-item>
        <el-form-item label="考查维度">
          <el-input v-model="questionEditForm.dimension" placeholder="请输入考查维度" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="questionDialogVisible = false">取消</el-button>
        <el-button type="primary" plain @click="saveQuestionDialog">保存题目</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="studentPreviewVisible" :title="`${previewScaleName} - 学生答题预览`" width="920px" class="demo-action-dialog student-preview-dialog">
      <div class="student-preview-shell">
        <div class="student-preview-hero">
          <div>
            <h3>{{ previewScaleName }}</h3>
            <p>学生端模拟答题页面，可预览每一道题在学生作答时的展示方式。</p>
          </div>
          <el-tag type="warning" effect="plain">共 {{ activeScaleQuestions.length }} 题</el-tag>
        </div>

        <div v-if="!activeScaleQuestions.length" class="empty-state">
          <div class="empty-icon"><i class="el-icon-document"></i></div>
          <h3>当前量表还没有题目</h3>
          <p>请先添加题目，再打开学生答题预览。</p>
        </div>

        <div v-else class="student-question-list">
          <div v-for="(item, index) in activeScaleQuestions" :key="item.id" class="student-question-card">
            <div class="student-question-meta">
              <span>第 {{ index + 1 }} 题</span>
              <el-tag size="mini" effect="plain">{{ item.type }}</el-tag>
              <el-tag size="mini" type="warning" effect="plain">{{ item.score || 0 }} 分</el-tag>
            </div>
            <h4>{{ getQuestionStem(item.title) }}</h4>
            <el-radio-group v-if="getPreviewOptions(item).length" v-model="previewAnswers[item.id]" class="student-option-list">
              <el-radio v-for="option in getPreviewOptions(item)" :key="option.value" :label="option.value">{{ option.label }}</el-radio>
            </el-radio-group>
            <el-input v-else v-model="previewAnswers[item.id]" type="textarea" :rows="3" placeholder="学生在此输入答案或评分记录" />
            <p class="student-question-dim">考查维度：{{ item.dimension || '未设置' }}</p>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button plain @click="resetStudentPreview">重置预览答案</el-button>
        <el-button type="primary" plain @click="studentPreviewVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import AppDataTable from '@/components/common/AppDataTable.vue'
import PageSection from '@/components/common/PageSection.vue'
import { getScalePage } from '@/api/modules'
import {
  deleteScalePreviewAnswers,
  getScalePreviewAnswers,
  listScaleAssessmentRows,
  listScaleBankRecords,
  markScaleBankDeleted,
  saveScaleAssessmentRows,
  saveScalePreviewAnswers,
  upsertScaleBankRecord,
  type ScaleBankRecord,
} from '@/db/demo-db'
import type { SubjectScaleQuestion } from '@/mock/subject-scale-bank'

const SCALE_OPTIONS_BY_PAGE: Record<string, string[]> = {
  sihai: ['生活语文', '生活数学', '生活英语'],
  autism: ['沟通表达', '社会情绪', '认知学习', '语言行为', '动作发展'],
  inclusion: ['学习适应', '课堂参与', '同伴互动', '支持需求'],
}

const CUSTOM_SCALE_PAGE_KEY = 'customAssessment'

function resolveScaleSourcePage(scaleName: string) {
  const entry = Object.entries(SCALE_OPTIONS_BY_PAGE).find(([, options]) => options.includes(scaleName))
  return entry?.[0] || CUSTOM_SCALE_PAGE_KEY
}

export default Vue.extend({
  components: { AppDataTable, PageSection },
  data() {
    return {
      page: {} as any,
      customForm: {
        name: '',
        desc: '',
      },
      assessmentTableRows: [] as string[][],
      customScaleNames: [] as string[],
      customScaleDescriptions: {} as Record<string, string>,
      customDraftQuestions: [] as SubjectScaleQuestion[],
      filterValues: {
        studentNo: '',
        studentName: '',
        scaleName: '',
      },
      managedScales: {} as Record<string, SubjectScaleQuestion[]>,
      questionDialogVisible: false,
      studentPreviewVisible: false,
      previewAnswers: {} as Record<string, string>,
      editingQuestionIndex: -1,
      questionEditForm: {
        id: '',
        no: 0,
        type: '选择题',
        title: '',
        answer: '',
        score: '5',
        dimension: '',
      } as SubjectScaleQuestion,
    }
  },
  computed: {
    pageKey(): string {
      return String(this.$route.meta.pageKey || '')
    },
    isCustomScalePage(): boolean {
      return this.pageKey === CUSTOM_SCALE_PAGE_KEY
    },
    isCustomScaleCreateMode(): boolean {
      return Boolean(this.isCustomScalePage && this.$route.query.createScale === '1')
    },
    currentScaleOptions(): string[] {
      if (this.isCustomScalePage) return this.customScaleNames
      return SCALE_OPTIONS_BY_PAGE[this.pageKey] || []
    },
    isScaleManagedPage(): boolean {
      return this.currentScaleOptions.length > 0 || this.isCustomScalePage
    },
    activeScaleName(): string {
      const name = String(this.$route.query.manageScale || '')
      return this.currentScaleOptions.includes(name) ? name : ''
    },
    isScaleManagerMode(): boolean {
      return Boolean(!this.isCustomScaleCreateMode && this.isScaleManagedPage && this.activeScaleName && this.managedScales[this.activeScaleName])
    },
    isScaleWorkspaceMode(): boolean {
      return Boolean(this.isScaleManagerMode || this.isCustomScaleCreateMode)
    },
    activeScaleQuestions(): SubjectScaleQuestion[] {
      if (this.isCustomScaleCreateMode) return this.customDraftQuestions
      return this.activeScaleName ? this.managedScales[this.activeScaleName] || [] : []
    },
    scaleWorkspaceTitle(): string {
      if (this.isCustomScaleCreateMode) return '创建自有量表'
      return `${this.activeScaleName}量表`
    },
    previewScaleName(): string {
      if (this.isCustomScaleCreateMode) return this.customForm.name.trim() || '未命名自有量表'
      return this.activeScaleName || '当前量表'
    },
    scaleWorkspaceDescription(): string {
      if (this.isCustomScaleCreateMode) {
        return `从空白量表开始创建，当前已录入 ${this.activeScaleQuestions.length} 道题，支持编辑题干、答案、分值、考查维度和调整题目顺序。`
      }
      const desc = this.customScaleDescriptions[this.activeScaleName]
      return desc || `共 ${this.activeScaleQuestions.length} 道题，支持编辑题干、答案、分值、考查维度和调整题目顺序。`
    },
    assessmentColumns(): string[] {
      return ['序号', '学号', '学生', '评估量表', '状态', '完成进度/得分', '操作']
    },
    scaleQuestionColumns(): string[] {
      return ['序号', '题型', '题目', '答案', '分值', '考查维度', '操作']
    },
    managedQuestionRows(): string[][] {
      return this.activeScaleQuestions.map((item: SubjectScaleQuestion, index: number) => [
        String(index + 1),
        item.type,
        this.formatQuestionTitle(item.title),
        item.answer,
        item.score,
        item.dimension,
        '上移 / 下移 / 编辑 / 删除',
      ])
    },
    questionDialogTitle(): string {
      return this.editingQuestionIndex >= 0 ? '编辑题目' : '添加题目'
    },
    scaleOptions(): string[] {
      if (this.isScaleManagedPage) return this.currentScaleOptions.filter((item) => Boolean(this.managedScales[item]))
      const options = (this.page.dimensions || []).map(String)
      return Array.from(new Set(options.length ? options : ['学科评估', '孤独症行为评估', '融合学校随班就读评估']))
    },
    assessmentRows(): string[][] {
      return this.assessmentTableRows.map((row: string[], index: number) => {
        const actions = this.resolveAssessmentActions(row)
        const displayRow = [...row]
        displayRow[4] = this.resolveAssessmentProgress(row)
        return [String(index + 1), ...displayRow, actions]
      })
    },
    filteredAssessmentRows(): string[][] {
      return this.assessmentRows.filter((row: string[]) => {
        const [, studentNo, studentName, scaleName] = row
        const noMatched = !this.filterValues.studentNo || studentNo.includes(this.filterValues.studentNo.trim())
        const studentMatched = !this.filterValues.studentName || studentName.includes(this.filterValues.studentName.trim())
        const scaleMatched = !this.filterValues.scaleName || scaleName === this.filterValues.scaleName
        return noMatched && studentMatched && scaleMatched
      })
    },
  },
  created() { this.loadPage() },
  watch: {
    '$route.meta.pageKey': 'loadPage',
    previewAnswers: {
      deep: true,
      handler() {
        if (this.studentPreviewVisible) void this.persistPreviewAnswers()
      },
    },
  },
  methods: {
    async loadPage() {
      const pageKey = String(this.$route.meta.pageKey)
      const page = await getScalePage(pageKey)
      const [scaleRecords, assessmentRows] = await Promise.all([
        listScaleBankRecords(),
        listScaleAssessmentRows(pageKey, page?.records || []),
      ])
      this.page = page || {}
      this.applyScaleBankRecords(scaleRecords)
      this.assessmentTableRows = assessmentRows.map((row: string[], index: number) => this.normalizeAssessmentRecord(row, index))
      this.resetFilters()
    },
    applyScaleBankRecords(records: ScaleBankRecord[]) {
      const managedScales: Record<string, SubjectScaleQuestion[]> = {}
      const descriptions: Record<string, string> = {}
      const customNames: string[] = []

      records.forEach((record) => {
        managedScales[record.scaleName] = record.questions || []
        if (record.description) descriptions[record.scaleName] = record.description
        if (record.isCustom) customNames.push(record.scaleName)
      })
      this.managedScales = managedScales
      this.customScaleDescriptions = descriptions
      this.customScaleNames = customNames
    },
    async handleAssessmentAction(payload: { action: string; row: Record<string, string> }) {
      if (payload.action === '提醒完成') {
        this.$message.success(`已提醒 ${payload.row.col2} 完成 ${payload.row.col3}。`)
        return
      }
      if (payload.action === '推送') {
        const targetIndex = Number(payload.row.col0) - 1
        const targetRow = this.assessmentTableRows[targetIndex]
        if (targetRow) {
          this.$set(this.assessmentTableRows, targetIndex, [targetRow[0], targetRow[1], targetRow[2], '已完成', targetRow[4]])
          await saveScaleAssessmentRows(this.pageKey, this.assessmentTableRows)
        }
        this.$message.success(`${payload.row.col2} 的 ${payload.row.col3} 已推送。`)
        return
      }
      this.$alert(`学号：${payload.row.col1}<br/>学生：${payload.row.col2}<br/>评估量表：${payload.row.col3}<br/>完成进度/得分：${payload.row.col5}`, '评估记录', {
        dangerouslyUseHTMLString: true,
      })
    },
    openScaleManager(scaleName: string) {
      const nextQuery = { ...this.$route.query, manageScale: scaleName } as Record<string, any>
      delete nextQuery.createScale
      this.$router.push({ path: this.$route.path, query: nextQuery })
    },
    exitScaleManager() {
      const nextQuery = { ...this.$route.query } as Record<string, any>
      delete nextQuery.manageScale
      delete nextQuery.createScale
      this.$router.push({ path: this.$route.path, query: nextQuery })
    },
    openCustomScaleCreator() {
      this.customForm = { name: '', desc: '' }
      this.customDraftQuestions = []
      const nextQuery = { ...this.$route.query, createScale: '1' } as Record<string, any>
      delete nextQuery.manageScale
      this.$router.push({ path: this.$route.path, query: nextQuery })
    },
    formatQuestionTitle(title: string): string {
      const firstLine = String(title || '').split('\n').find(Boolean) || ''
      return firstLine.length > 68 ? `${firstLine.slice(0, 68)}...` : firstLine
    },
    openQuestionDialog(index = -1) {
      this.editingQuestionIndex = index
      const current = index >= 0 ? this.activeScaleQuestions[index] : null
      this.questionEditForm = current
        ? { ...current }
        : {
            id: `q${String(this.activeScaleQuestions.length + 1).padStart(2, '0')}`,
            no: this.activeScaleQuestions.length + 1,
            type: '选择题',
            title: '',
            answer: '',
            score: '5',
            dimension: '',
          }
      this.questionDialogVisible = true
    },
    saveQuestionDialog() {
      if (!this.isCustomScaleCreateMode && !this.activeScaleName) return
      if (!this.questionEditForm.title.trim()) {
        this.$message.warning('请先输入题目内容。')
        return
      }
      const questions = [...this.activeScaleQuestions]
      if (this.editingQuestionIndex >= 0) {
        questions.splice(this.editingQuestionIndex, 1, { ...this.questionEditForm })
      } else {
        questions.push({ ...this.questionEditForm })
      }
      this.updateActiveScale(questions)
      this.questionDialogVisible = false
      this.$message.success('题目已更新，请记得点击保存量表。')
    },
    async openStudentPreview() {
      const savedAnswers = await getScalePreviewAnswers(this.resolvePreviewStorageKey())
      const answers: Record<string, string> = {}
      this.activeScaleQuestions.forEach((item: SubjectScaleQuestion) => {
        answers[item.id] = savedAnswers[item.id] || ''
      })
      this.previewAnswers = answers
      this.studentPreviewVisible = true
    },
    async resetStudentPreview() {
      Object.keys(this.previewAnswers).forEach((key) => {
        this.$set(this.previewAnswers, key, '')
      })
      await this.persistPreviewAnswers()
      this.$message.success('预览答案已重置。')
    },
    resolvePreviewStorageKey(): string {
      if (this.isCustomScaleCreateMode) return `draft:${this.customForm.name.trim() || '未命名自有量表'}`
      return this.activeScaleName || this.previewScaleName
    },
    async persistPreviewAnswers() {
      const scaleName = this.resolvePreviewStorageKey()
      if (!scaleName) return
      await saveScalePreviewAnswers(scaleName, this.previewAnswers)
    },
    getQuestionStem(title: string): string {
      const lines = String(title || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
      const stemLines = lines.filter((line) => !this.isOptionLine(line))
      return stemLines.join('\n') || '未填写题干'
    },
    getPreviewOptions(question: SubjectScaleQuestion): Array<{ value: string; label: string }> {
      if (question.type === '判断题') {
        return [
          { value: '√', label: '正确（√）' },
          { value: '×', label: '错误（×）' },
        ]
      }
      return String(question.title || '')
        .split('\n')
        .map((line) => line.trim())
        .map((line) => line.match(/^([A-E])[\.\．、]\s*(.+)$/i))
        .filter((match): match is RegExpMatchArray => Boolean(match))
        .map((match) => ({
          value: match[1].toUpperCase(),
          label: `${match[1].toUpperCase()}. ${match[2]}`,
        }))
    },
    isOptionLine(line: string): boolean {
      return /^([A-E])[\.\．、]\s*.+$/i.test(String(line || '').trim())
    },
    handleManagedQuestionAction(payload: { action: string; row: Record<string, string> }) {
      const index = Number(payload.row.col0) - 1
      if (payload.action === '上移') {
        this.moveManagedQuestion(index, -1)
        return
      }
      if (payload.action === '下移') {
        this.moveManagedQuestion(index, 1)
        return
      }
      if (payload.action === '编辑') {
        this.openQuestionDialog(index)
        return
      }
      if (payload.action === '删除') {
        this.deleteManagedQuestion(index)
      }
    },
    moveManagedQuestion(index: number, direction: number) {
      const targetIndex = index + direction
      const questions = [...this.activeScaleQuestions]
      if (index < 0 || targetIndex < 0 || targetIndex >= questions.length) {
        this.$message.info(direction < 0 ? '已经是第一题。' : '已经是最后一题。')
        return
      }
      const moved = questions.splice(index, 1)[0]
      questions.splice(targetIndex, 0, moved)
      this.updateActiveScale(questions)
    },
    deleteManagedQuestion(index: number) {
      const questions = [...this.activeScaleQuestions]
      if (!questions[index]) return
      questions.splice(index, 1)
      this.updateActiveScale(questions)
      this.$message.success('题目已删除，请记得点击保存量表。')
    },
    renumberActiveScale() {
      this.updateActiveScale(this.activeScaleQuestions)
      this.$message.success('题号已按当前顺序重新整理。')
    },
    normalizeScaleQuestions(questions: SubjectScaleQuestion[]): SubjectScaleQuestion[] {
      return questions.map((item, index) => ({
        ...item,
        no: index + 1,
        id: `q${String(index + 1).padStart(2, '0')}`,
      }))
    },
    updateActiveScale(questions: SubjectScaleQuestion[]) {
      const normalized = this.normalizeScaleQuestions(questions)
      if (this.isCustomScaleCreateMode) {
        this.customDraftQuestions = normalized
        return
      }
      if (!this.activeScaleName) return
      this.$set(this.managedScales, this.activeScaleName, normalized)
    },
    async saveActiveScale() {
      if (this.isCustomScaleCreateMode) {
        const scaleName = this.customForm.name.trim()
        if (!scaleName) {
          this.$message.warning('请先输入自有量表名称。')
          return
        }
        if (this.managedScales[scaleName]) {
          this.$message.warning('该量表名称已存在，请换一个名称。')
          return
        }
        const questions = this.normalizeScaleQuestions(this.customDraftQuestions)
        this.$set(this.managedScales, scaleName, questions)
        this.$set(this.customScaleDescriptions, scaleName, this.customForm.desc.trim())
        this.customScaleNames.push(scaleName)
        await upsertScaleBankRecord({
          scaleName,
          sourcePageKey: CUSTOM_SCALE_PAGE_KEY,
          description: this.customForm.desc.trim(),
          questions,
          isCustom: true,
          sortOrder: this.customScaleNames.length,
        })
        if (Object.keys(this.previewAnswers).length) {
          await saveScalePreviewAnswers(scaleName, this.previewAnswers)
        }
        this.$message.success(`${scaleName}已保存，共 ${questions.length} 道题。`)
        this.openScaleManager(scaleName)
        return
      }
      if (!this.activeScaleName) return
      await upsertScaleBankRecord({
        scaleName: this.activeScaleName,
        sourcePageKey: resolveScaleSourcePage(this.activeScaleName),
        description: this.customScaleDescriptions[this.activeScaleName] || '',
        questions: this.activeScaleQuestions,
        isCustom: this.customScaleNames.includes(this.activeScaleName),
        sortOrder: this.currentScaleOptions.indexOf(this.activeScaleName),
      })
      this.$message.success(`${this.activeScaleName}量表已保存，共 ${this.activeScaleQuestions.length} 道题。`)
    },
    async deleteActiveScale() {
      if (!this.activeScaleName) return
      try {
        await this.$confirm(`删除后，${this.activeScaleName} 将被移除，是否继续？`, '删除量表', {
          type: 'warning',
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          confirmButtonClass: 'danger-confirm-button',
        })
        const name = this.activeScaleName
        this.$delete(this.managedScales, name)
        this.$delete(this.customScaleDescriptions, name)
        this.customScaleNames = this.customScaleNames.filter((item) => item !== name)
        await markScaleBankDeleted(name)
        await deleteScalePreviewAnswers(name)
        this.exitScaleManager()
        this.$message.success(`${name}量表已删除。`)
      } catch (error) {
        return
      }
    },
    clearCustomScaleDraft() {
      this.customForm = { name: '', desc: '' }
      this.customDraftQuestions = []
      this.$message.success('自有量表草稿已清空。')
    },
    resolveAssessmentProgress(row: string[]): string {
      if (row[3] === '未开始') return ''
      if (row[3] === '未推送') return '等待老师推送'
      return row[4] || ''
    },
    resolveAssessmentActions(row: string[]): string {
      if (row[3] === '未开始') return '提醒完成'
      if (row[3] === '未推送') return '推送'
      return '查看记录'
    },
    normalizeAssessmentRecord(row: string[], index: number): string[] {
      const fallbackStudentNo = `S2026${String(index + 1).padStart(3, '0')}`
      if (row.length >= 5) return [row[0] || fallbackStudentNo, row[1] || '', row[2] || '', row[3] || '未推送', row[4] || '']
      return [fallbackStudentNo, row[0] || '', row[1] || '', row[2] || '未推送', row[3] || '']
    },
    notifyFilterResult() {
      this.$message.success(`已筛选出 ${this.filteredAssessmentRows.length} 条记录。`)
    },
    resetFilters() {
      this.filterValues = {
        studentNo: '',
        studentName: '',
        scaleName: '',
      }
    },
  },
})
</script>
