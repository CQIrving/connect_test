<template>
  <el-dialog
    :visible.sync="dialogVisible"
    :title="dialogTitle"
    width="720px"
    custom-class="demo-action-dialog"
    @close="handleClose"
  >
    <el-form label-width="110px" class="demo-form">
      <el-form-item v-for="field in editableFields" :key="field.key" :label="field.label">
        <div v-if="isPlanContentField(field) && !field.readonly" class="plan-content-editor">
          <div class="plan-goal-counts">长期目标 {{ planContentRows.length }} 个，短期目标 {{ planShortGoalCount }} 个</div>
          <div v-for="(goal, gi) in planContentRows" :key="gi" class="plan-long-goal-card">
            <div class="plan-long-goal-head">
              <el-input v-model="goal.长期目标" size="mini" placeholder="请输入长期目标" />
              <el-button size="mini" type="danger" plain icon="el-icon-delete" circle @click="removePlanRow(gi)"></el-button>
            </div>
            <table class="plan-content-edit-table">
              <thead><tr><th>短期目标</th><th>开始时间</th><th>结束时间</th><th></th></tr></thead>
              <tbody>
                <tr v-for="(shortGoal, si) in goal.短期目标" :key="si">
                  <td><el-input v-model="shortGoal.短期目标" size="mini" placeholder="请输入短期目标" /></td>
                  <td><el-date-picker v-model="shortGoal.开始时间" type="date" value-format="yyyy-MM-dd" size="mini" placeholder="开始时间" class="full-width" /></td>
                  <td><el-date-picker v-model="shortGoal.结束时间" type="date" value-format="yyyy-MM-dd" size="mini" placeholder="结束时间" class="full-width" /></td>
                  <td class="plan-content-action-cell"><el-button size="mini" type="danger" plain icon="el-icon-delete" circle @click="removeShortPlanRow(gi, si)"></el-button></td>
                </tr>
              </tbody>
            </table>
            <el-button size="mini" type="primary" plain @click="addShortPlanRow(gi)">添加短期目标</el-button>
          </div>
          <el-button size="small" type="primary" plain @click="addPlanRow">添加长期目标</el-button>
        </div>
        <div v-else-if="isPlanContentField(field) && field.readonly" class="plan-content-editor">
          <div class="plan-goal-counts">长期目标 {{ planContentRows.length }} 个，短期目标 {{ planShortGoalCount }} 个</div>
          <div v-for="(goal, gi) in planContentRows" :key="gi" class="plan-long-goal-card">
            <strong>{{ goal.长期目标 || '未填写长期目标' }}</strong>
            <table class="plan-content-edit-table">
              <thead><tr><th>短期目标</th><th>开始时间</th><th>结束时间</th></tr></thead>
              <tbody>
                <tr v-for="(shortGoal, si) in goal.短期目标" :key="si">
                  <td>{{ shortGoal.短期目标 }}</td>
                  <td>{{ shortGoal.开始时间 }}</td>
                  <td>{{ shortGoal.结束时间 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else-if="isDeliveryRecordField(field) && !field.readonly" class="plan-content-editor">
          <table class="plan-content-edit-table">
            <thead><tr><th>教学内容</th><th>完成效果</th><th></th></tr></thead>
            <tbody>
              <tr v-for="(row, ri) in deliveryRecordRows" :key="ri">
                <td>
                  <el-input v-model="row.教学内容" size="mini" placeholder="请输入教学内容" />
                </td>
                <td>
                  <el-select v-model="row.完成效果" size="mini" placeholder="完成效果" class="full-width">
                    <el-option v-for="option in deliveryRecordStatusOptions" :key="option" :label="option" :value="option" />
                  </el-select>
                </td>
                <td class="plan-content-action-cell"><el-button size="mini" type="danger" plain icon="el-icon-delete" circle @click="removeDeliveryRecordRow(ri)"></el-button></td>
              </tr>
            </tbody>
          </table>
          <el-button size="small" type="primary" plain @click="addDeliveryRecordRow">添加一行</el-button>
        </div>
        <div v-else-if="isDeliveryRecordField(field) && field.readonly" class="plan-content-editor">
          <table class="plan-content-edit-table">
            <thead><tr><th>教学内容</th><th>完成效果</th></tr></thead>
            <tbody>
              <tr v-for="(row, ri) in deliveryRecordRows" :key="ri">
                <td>{{ row.教学内容 }}</td>
                <td>{{ row.完成效果 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else-if="isLessonContentField(field) && !field.readonly" class="plan-content-editor">
          <el-input v-model="lessonContentForm.内容" type="textarea" :rows="3" placeholder="请输入教学内容" />
          <el-input v-model="lessonContentForm.重难点" type="textarea" :rows="3" placeholder="请输入教学重难点" class="lesson-content-gap" />
        </div>
        <div v-else-if="isLessonContentField(field) && field.readonly" class="demo-readonly-field">
          {{ formatLessonContentDisplay(localValues[field.key]) || '暂无内容' }}
        </div>
        <div v-else-if="isRelatedResourceField(field)" class="related-resource-field">
          <div v-if="field.readonly" class="related-resource-readonly">
            <span
              v-for="option in relatedResourceDisplayItems(localValues[field.key])"
              :key="option"
              class="related-resource-option"
              :class="getRelatedResourceIconClass(option)"
            >
              <span class="related-resource-type">{{ getRelatedResourceTypeLabel(option) }}</span>
              <i :class="getRelatedResourceIcon(option)"></i>
              <span>{{ option }}</span>
            </span>
            <span v-if="!relatedResourceDisplayItems(localValues[field.key]).length" class="related-resource-empty">暂无相关资源</span>
          </div>
          <template v-if="!field.readonly">
            <el-checkbox-group
              :value="getRelatedResourceSelected(field.key)"
              class="dialog-checkbox-grid related-resource-grid"
              @input="setRelatedResourceSelected(field.key, $event)"
            >
              <el-checkbox v-for="option in normalizedResourceOptions()" :key="option" :label="option">
                <span class="related-resource-option" :class="getRelatedResourceIconClass(option)">
                  <span class="related-resource-type">{{ getRelatedResourceTypeLabel(option) }}</span>
                  <i :class="getRelatedResourceIcon(option)"></i>
                  <span>{{ option }}</span>
                </span>
              </el-checkbox>
            </el-checkbox-group>
            <el-upload action="" :show-file-list="false" :before-upload="(file) => handleRelatedResourceUpload(file, field.key)">
              <el-button size="small">上传资源</el-button>
            </el-upload>
            <el-button v-if="localValues[field.key]" size="small" @click="clearRelatedResource(field.key)">清空资源</el-button>
          </template>
        </div>
        <div v-else-if="isAvatarColumn(field.label)" class="image-upload-field">
          <div class="image-preview">
            <img v-if="isImageValue(localValues[field.key])" :src="localValues[field.key]" :alt="`${field.label}预览`" />
            <span v-else>{{ localValues[field.key] || getEmptyImageText(field.label) }}</span>
          </div>
          <template v-if="!field.readonly">
            <el-upload action="" :show-file-list="false" :before-upload="(file) => handleImageUpload(file, field.key)">
              <el-button size="small">{{ getImageUploadButtonText(field.label) }}</el-button>
            </el-upload>
            <el-button v-if="localValues[field.key]" size="small" @click="clearImage(field.key)">{{ getImageClearButtonText(field.label) }}</el-button>
          </template>
        </div>
        <div v-else-if="isFileUploadColumn(field.label)" class="image-upload-field">
          <div class="demo-readonly-field">
            {{ formatFileDisplay(localValues[field.key]) || getEmptyFileText(field.label) }}
          </div>
          <template v-if="!field.readonly">
            <el-upload action="" :show-file-list="false" :before-upload="(file) => handleFileUpload(file, field.key)">
              <el-button size="small">{{ getUploadButtonText(field.label) }}</el-button>
            </el-upload>
            <el-button v-if="localValues[field.key]" size="small" @click="clearFile(field.key)">移除文件</el-button>
            <el-progress
              v-if="isUploadProgressVisible(field.key)"
              :percentage="getUploadProgress(field.key)"
              :status="getUploadProgress(field.key) >= 100 ? 'success' : undefined"
              class="upload-progress"
            />
          </template>
        </div>
        <el-checkbox-group
          v-else-if="!field.readonly && field.control === 'checkbox'"
          :value="getMultiValue(field.key)"
          class="dialog-checkbox-grid"
          @input="setMultiValue(field.key, $event)"
        >
          <el-checkbox v-for="option in field.options" :key="option" :label="option">{{ option }}</el-checkbox>
        </el-checkbox-group>
        <el-select
          v-else-if="!field.readonly && field.control === 'select' && field.multiple"
          :value="getMultiValue(field.key)"
          multiple
          filterable
          collapse-tags
          :placeholder="`请选择${field.label}`"
          class="full-width"
          @input="setMultiValue(field.key, $event)"
        >
          <el-option v-for="option in field.options" :key="option" :label="option" :value="option" />
        </el-select>
        <el-select
          v-else-if="!field.readonly && field.control === 'select'"
          v-model="localValues[field.key]"
          filterable
          :placeholder="`请选择${field.label}`"
          class="full-width"
          @change="handleFieldChange(field)"
        >
          <el-option v-for="option in field.options" :key="option" :label="option" :value="option" />
        </el-select>
        <el-date-picker
          v-else-if="!field.readonly && field.control === 'year'"
          v-model="localValues[field.key]"
          type="year"
          value-format="yyyy"
          :placeholder="`请选择${field.label}`"
          class="full-width"
        />
        <el-date-picker
          v-else-if="!field.readonly && field.control === 'date'"
          v-model="localValues[field.key]"
          type="date"
          value-format="yyyy-MM-dd"
          :placeholder="`请选择${field.label}`"
          class="full-width"
        />
        <el-input
          v-else-if="!field.readonly"
          v-model="localValues[field.key]"
          :type="field.type"
          :rows="field.type === 'textarea' ? 3 : undefined"
          :placeholder="`请输入${field.label}`"
        />
        <div v-else class="demo-readonly-field">
          {{ localValues[field.key] || '暂无内容' }}
        </div>
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button v-if="showSave" type="primary" plain @click="handleSave">保存</el-button>
      <el-button v-else type="primary" plain @click="dialogVisible = false">关闭</el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import Vue from 'vue'

type FieldItem = {
  key: string
  label: string
  readonly: boolean
  type: string
  control: 'input' | 'select' | 'year' | 'date' | 'checkbox'
  options: string[]
  multiple: boolean
}

type DeliveryRecordRow = {
  教学内容: string
  完成效果: string
}

type PlanShortGoal = {
  短期目标: string
  开始时间: string
  结束时间: string
}

type PlanLongGoal = {
  长期目标: string
  短期目标: PlanShortGoal[]
}

const readonlyActions = ['查看', '查看详情', '查看统计', '查看图表', '查看分析图表', '查看记录', '预览', '下载', '学生主页', '历史得分']
const textareaLabels = ['关键提升点', '待提高领域', '班级权限', '教学目标', '教学步骤', '教学过程摘要', '学科目标摘要', '处理内容', '处理结果', '通知内容', '详情及要求', '备注']
const resourceUploadTypeOptions = ['课件', '教案', '微课', '教具']
const deliveryRecordStatusOptions = ['未开始', '跟进中', '已完成']
const assessmentTypeOptions = ['学科评估', '孤独症行为评估', '融合学校随班就读评估', '自有量表评估']
const assessmentScaleOptionsByType: Record<string, string[]> = {
  学科评估: ['生活语文', '生活数学', '生活英语'],
  孤独症行为评估: ['沟通表达', '社会情绪', '认知学习', '语言行为', '动作发展'],
  融合学校随班就读评估: ['学习适应', '课堂参与', '同伴互动', '支持需求'],
  自有量表评估: ['校本沟通能力量表', '个别化学习表现量表'],
}

export default Vue.extend({
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    action: {
      type: String,
      default: '',
    },
    columns: {
      type: Array,
      default: () => [],
    },
    row: {
      type: Object,
      default: () => ({}),
    },
    teacherOptions: {
      type: Array,
      default: () => [],
    },
    classOptions: {
      type: Array,
      default: () => [],
    },
    classYearMap: {
      type: Object,
      default: () => ({}),
    },
    studentOptions: {
      type: Array,
      default: () => [],
    },
    studentNoOptions: {
      type: Array,
      default: () => [],
    },
    studentProfiles: {
      type: Array,
      default: () => [],
    },
    lessonOptions: {
      type: Array,
      default: () => [],
    },
    resourceOptions: {
      type: Array,
      default: () => [],
    },
    resourceOptionTypes: {
      type: Object,
      default: () => ({}),
    },
    currentUserName: {
      type: String,
      default: '当前登录账户',
    },
  },
  data() {
    return {
      dialogVisible: false,
      localValues: {} as Record<string, string>,
      uploadProgress: {} as Record<string, number>,
      uploadTimers: {} as Record<string, number>,
      planContentRows: [] as PlanLongGoal[],
      deliveryRecordRows: [] as DeliveryRecordRow[],
      lessonContentForm: { 内容: '', 重难点: '' },
      deliveryRecordStatusOptions,
    }
  },
  computed: {
    planShortGoalCount(): number {
      return this.planContentRows.reduce((total: number, goal: PlanLongGoal) => total + (goal.短期目标 || []).length, 0)
    },
    dialogTitle(): string {
      return `${this.action}`
    },
    showSave(): boolean {
      return !readonlyActions.includes(this.action)
    },
    isAddClassDialog(): boolean {
      return this.action === '添加班级'
    },
    isClassTableDialog(): boolean {
      const columns = this.columns as string[]
      return ['班级名称', '班级类型', '开设学年', '班主任', '教师'].every((column) => columns.includes(column))
    },
    isEditClassDialog(): boolean {
      return this.isClassTableDialog && this.action === '编辑班级信息'
    },
    isAssignClassTeachersDialog(): boolean {
      return this.isClassTableDialog && this.action === '分配教师'
    },
    isSetClassHeadTeacherDialog(): boolean {
      return this.isClassTableDialog && this.action === '设置班主任'
    },
    isAddStudentDialog(): boolean {
      return ['添加学生', '新增学生'].includes(this.action)
    },
    isStudentTableDialog(): boolean {
      const columns = this.columns as string[]
      return ['姓名', '性别', '学号', '班级'].every((column) => columns.includes(column))
    },
    isStudentFormDialog(): boolean {
      return this.isStudentTableDialog && ['添加学生', '新增学生', '编辑学生信息', '学生主页'].includes(this.action)
    },
    isResourceRoomTableDialog(): boolean {
      const columns = this.columns as string[]
      return ['校区', '教室类型', '教室序号', '教室面积', '容纳人数'].every((column) => columns.includes(column))
    },
    isResourceRoomFormDialog(): boolean {
      return this.isResourceRoomTableDialog && ['添加资源教室', '编辑教室信息'].includes(this.action)
    },
    isTermPlanTableDialog(): boolean {
      const columns = this.columns as string[]
      return !columns.includes('学号') && ['学期', '学科', '计划内容', '创建教师', '学生'].every((column) => columns.includes(column))
    },
    isTermPlanFormDialog(): boolean {
      return this.isTermPlanTableDialog && ['添加计划', '编辑'].includes(this.action)
    },
    isLessonTableDialog(): boolean {
      const columns = this.columns as string[]
      return ['教案名称', '教师', '学生', '教学目标', '教学内容', '教学步骤', '相关资源'].every((column) => columns.includes(column))
    },
    isLessonFormDialog(): boolean {
      return this.isLessonTableDialog && ['添加教案', '编辑', '查看'].includes(this.action)
    },
    isResourceLibraryTableDialog(): boolean {
      const columns = this.columns as string[]
      return ['资源名称', '资源类型', '学科', '资源上传', '应用范围', '上传时间'].every((column) => columns.includes(column))
    },
    isResourceLibraryFormDialog(): boolean {
      return this.isResourceLibraryTableDialog && ['上传', '编辑', '预览', '下载'].includes(this.action)
    },
    isStudentPlanTableDialog(): boolean {
      const columns = this.columns as string[]
      return ['学号', '学生', '学科', '计划内容', '学期', '创建教师', '状态', '关联教案'].every((column) => columns.includes(column))
    },
    isStudentPlanFormDialog(): boolean {
      return this.isStudentPlanTableDialog && ['添加计划', '编辑', '查看'].includes(this.action)
    },
    isFamilyTaskTableDialog(): boolean {
      const columns = this.columns as string[]
      return ['任务名称', '详情及要求', '学生', '执行状态', '阅读状态', '提交时间'].every((column) => columns.includes(column))
    },
    isFamilyTaskFormDialog(): boolean {
      return this.isFamilyTaskTableDialog && ['添加任务', '提醒家长'].includes(this.action)
    },
    isFamilyNoticeTableDialog(): boolean {
      const columns = this.columns as string[]
      return ['通知标题', '通知内容', '发送范围', '已读人数', '未读人数', '发布时间'].every((column) => columns.includes(column))
    },
    isFamilyNoticeFormDialog(): boolean {
      return this.isFamilyNoticeTableDialog && ['添加通知', '再次提醒'].includes(this.action)
    },
    isDeliveryTableDialog(): boolean {
      const columns = this.columns as string[]
      return ['班级', '学生姓名', '性别', '学号', '障碍类型', '送教主题', '教学记录详情', '负责老师'].every((column) => columns.includes(column))
    },
    isDeliveryFormDialog(): boolean {
      return this.isDeliveryTableDialog && ['创建', '新增送教记录', '编辑'].includes(this.action)
    },
    isAssessmentListTableDialog(): boolean {
      const columns = this.columns as string[]
      return ['学号', '学生', '性别', '障碍类型', '评估类型', '评估量表', '评估状态'].every((column) => columns.includes(column))
    },
    isAssessmentListFormDialog(): boolean {
      return this.isAssessmentListTableDialog && ['创建评估', '编辑', '查看记录'].includes(this.action)
    },
    currentYear(): string {
      return String(new Date().getFullYear())
    },
    editableFields(): FieldItem[] {
      return (this.columns as string[])
        .map((column, index) => ({ column, index }))
        .filter((item) => !this.hiddenFieldLabels.includes(item.column))
        .map(({ column, index }) => ({
          key: `col${index}`,
          label: column,
          readonly: this.resolveFieldReadonly(column),
          type: textareaLabels.includes(column) ? 'textarea' : 'text',
          control: this.resolveFieldControl(column),
          options: this.resolveFieldOptions(column),
          multiple: this.isMultiSelectField(column),
        }))
    },
    hiddenFieldLabels(): string[] {
      if (this.action === '添加通知') return this.keepOnlyFieldLabels(['通知标题', '通知内容', '发送范围'])
      if (this.isAddClassDialog) return ['序号', '学生人数', '更新时间', '状态', '操作']
      if (this.isEditClassDialog) return ['序号', '学生人数', '更新时间', '状态', '操作']
      if (this.isAssignClassTeachersDialog) return this.keepOnlyFieldLabels(['班级名称', '教师'])
      if (this.isSetClassHeadTeacherDialog) return this.keepOnlyFieldLabels(['班级名称', '班主任'])
      if (this.isStudentFormDialog) return ['序号', '学年', '状态', '操作']
      if (this.isResourceRoomFormDialog) return ['序号', '操作']
      if (this.isResourceLibraryFormDialog) return ['序号', '上传时间', '操作']
      if (this.isTermPlanFormDialog) return ['序号', '操作']
      if (this.isLessonFormDialog) return ['序号', '最近更新时间', '操作']
      if (this.isStudentPlanFormDialog) return ['序号', '操作']
      if (this.isFamilyTaskFormDialog) return ['序号', '执行状态', '阅读状态', '提交时间', '操作']
      if (this.isFamilyNoticeFormDialog) return ['序号', '已读人数', '未读人数', '发布时间', '操作']
      if (this.isDeliveryFormDialog) return ['序号', '性别', '学号', '障碍类型', '操作']
      if (this.isAssessmentListFormDialog) return ['序号', '班级', '性别', '障碍类型', '评估类型', '得分', '得分/进度', '评估时间', '评估教师', '评估状态', '操作']
      return ['操作']
    },
  },
  watch: {
    visible: {
      immediate: true,
      handler(value: boolean) {
        this.dialogVisible = value
        if (value) this.syncValues()
      },
    },
    dialogVisible(value: boolean) {
      if (!value) {
        this.$emit('update:visible', false)
      }
    },
    row: {
      deep: true,
      handler() {
        if (this.dialogVisible) this.syncValues()
      },
    },
  },
  methods: {
    syncValues() {
      this.localValues = { ...(this.row as Record<string, string>) }
      this.planContentRows = this.parsePlanContentFromRow()
      this.deliveryRecordRows = this.parseDeliveryRecordsFromRow()
      this.lessonContentForm = this.parseLessonContentFromRow()
      if (this.isAddClassDialog) this.applyClassDefaults()
      if (this.isAddStudentDialog) this.applyStudentDefaults()
      if (this.action === '添加资源教室') this.applyResourceRoomDefaults()
      if (this.action === '添加计划') this.applyTermPlanDefaults()
      if (this.action === '添加计划' && this.isStudentPlanFormDialog) this.applyStudentPlanDefaults()
      if (this.action === '添加教案') this.applyLessonDefaults()
      if (this.action === '上传') this.applyResourceLibraryDefaults()
      if (this.action === '添加任务') this.applyFamilyTaskDefaults()
      if (this.action === '添加通知') this.applyFamilyNoticeDefaults()
      if (['创建', '新增送教记录'].includes(this.action)) this.applyDeliveryDefaults()
      if (this.action === '创建评估') this.applyAssessmentListDefaults()
    },
    handleClose() {
      this.$emit('close')
    },
    handleSave() {
      this.serializePlanContentToRow()
      this.serializeDeliveryRecordsToRow()
      this.serializeLessonContentToRow()
      const values = this.buildSaveValues()
      this.$emit('save', { values })
      this.dialogVisible = false
    },
    isPlanContentField(field: FieldItem): boolean {
      return field.label === '计划内容' && (this.isTermPlanFormDialog || this.isStudentPlanFormDialog)
    },
    isDeliveryRecordField(field: FieldItem): boolean {
      return field.label === '教学记录详情' && this.isDeliveryFormDialog
    },
    isLessonContentField(field: FieldItem): boolean {
      return field.label === '教学内容' && this.isLessonFormDialog
    },
    isRelatedResourceField(field: FieldItem): boolean {
      return field.label === '相关资源' && this.isLessonFormDialog
    },
    parsePlanContentFromRow(): PlanLongGoal[] {
      const key = this.getColumnKey('计划内容')
      if (!key) return []
      const raw = String(this.localValues[key] || '')
      if (!raw) return []
      try {
        const parsed = JSON.parse(raw)
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
      } catch (error) {
        return [{ 长期目标: raw, 短期目标: [{ 短期目标: '', 开始时间: '', 结束时间: '' }] }]
      }
      return [{ 长期目标: raw, 短期目标: [{ 短期目标: '', 开始时间: '', 结束时间: '' }] }]
    },
    serializePlanContentToRow() {
      const key = this.getColumnKey('计划内容')
      if (!key || !this.isPlanContentField({ label: '计划内容', key, readonly: false, type: 'text', control: 'input', options: [], multiple: false })) return
      const filtered = this.planContentRows
        .map((goal) => ({
          长期目标: goal.长期目标 || '',
          短期目标: (goal.短期目标 || []).filter((row) => row.短期目标 || row.开始时间 || row.结束时间),
        }))
        .filter((goal) => goal.长期目标 || goal.短期目标.length)
      if (filtered.length > 0) {
        this.localValues[key] = JSON.stringify(filtered)
      } else {
        this.localValues[key] = ''
      }
    },
    addPlanRow() {
      this.planContentRows.push({ 长期目标: '', 短期目标: [{ 短期目标: '', 开始时间: '', 结束时间: '' }] })
    },
    removePlanRow(index: number) {
      this.planContentRows.splice(index, 1)
    },
    addShortPlanRow(goalIndex: number) {
      const goal = this.planContentRows[goalIndex]
      if (!goal) return
      goal.短期目标.push({ 短期目标: '', 开始时间: '', 结束时间: '' })
    },
    removeShortPlanRow(goalIndex: number, shortIndex: number) {
      const goal = this.planContentRows[goalIndex]
      if (!goal) return
      goal.短期目标.splice(shortIndex, 1)
      if (!goal.短期目标.length) goal.短期目标.push({ 短期目标: '', 开始时间: '', 结束时间: '' })
    },
    parseDeliveryRecordsFromRow(): DeliveryRecordRow[] {
      const key = this.getColumnKey('教学记录详情')
      if (!key) return []
      const raw = String(this.localValues[key] || '')
      if (!raw) return []
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          return parsed.map((row: any) => ({
            教学内容: row.教学内容 || [row.日期, row.教学形式].filter(Boolean).join(' ') || '',
            完成效果: row.完成效果 || row.完成情况 || '',
          }))
        }
      } catch (error) {
        return [{ 教学内容: raw, 完成效果: '' }]
      }
      return []
    },
    serializeDeliveryRecordsToRow() {
      const key = this.getColumnKey('教学记录详情')
      if (!key || !this.isDeliveryFormDialog) return
      const filtered = this.deliveryRecordRows.filter((row) => row.教学内容 || row.完成效果)
      this.localValues[key] = filtered.length ? JSON.stringify(filtered) : ''
    },
    addDeliveryRecordRow() {
      this.deliveryRecordRows.push({ 教学内容: '', 完成效果: '' })
    },
    removeDeliveryRecordRow(index: number) {
      this.deliveryRecordRows.splice(index, 1)
    },
    parseLessonContentFromRow(): { 内容: string; 重难点: string } {
      const key = this.getColumnKey('教学内容')
      if (!key) return { 内容: '', 重难点: '' }
      const raw = String(this.localValues[key] || '')
      if (!raw) return { 内容: '', 重难点: '' }
      try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          return { 内容: parsed.内容 || '', 重难点: parsed.重难点 || '' }
        }
      } catch (error) {
        return { 内容: raw, 重难点: '' }
      }
      return { 内容: raw, 重难点: '' }
    },
    serializeLessonContentToRow() {
      const key = this.getColumnKey('教学内容')
      if (!key || !this.isLessonFormDialog) return
      const content = this.lessonContentForm.内容 || ''
      const difficulty = this.lessonContentForm.重难点 || ''
      this.localValues[key] = content || difficulty ? JSON.stringify({ 内容: content, 重难点: difficulty }) : ''
    },
    keepOnlyFieldLabels(visibleLabels: string[]): string[] {
      return (this.columns as string[]).filter((column) => !visibleLabels.includes(column))
    },
    resolveFieldReadonly(column: string): boolean {
      if (['分配教师', '设置班主任'].includes(this.action) && column === '班级名称') return true
      if (this.isTermPlanFormDialog && column === '创建教师') return true
      if (this.isStudentPlanFormDialog && column === '创建教师') return true
      return readonlyActions.includes(this.action)
    },
    isMultiSelectField(column: string): boolean {
      if (this.isTermPlanFormDialog && column === '学生') return true
      if (this.isStudentPlanFormDialog && column === '关联教案') return true
      if (this.isLessonFormDialog && ['教师', '学生'].includes(column)) return true
      if (this.isDeliveryFormDialog && column === '负责老师') return true
      return this.isClassTeacherMultiSelect(column)
    },
    isStudentLinkedForm(): boolean {
      return this.isDeliveryFormDialog || this.isStudentPlanFormDialog || this.isFamilyTaskFormDialog || this.isAssessmentListFormDialog
    },
    isClassTeacherMultiSelect(column: string): boolean {
      return (this.isAddClassDialog || this.isEditClassDialog || this.isAssignClassTeachersDialog) && column === '教师'
    },
    resolveFieldControl(column: string): 'input' | 'select' | 'year' | 'date' | 'checkbox' {
      if (this.isAddClassDialog || this.isEditClassDialog || this.isAssignClassTeachersDialog || this.isSetClassHeadTeacherDialog) {
        if (column === '开设学年') return 'year'
        return ['班级类型', '班主任', '教师'].includes(column) ? 'select' : 'input'
      }
      if (this.isStudentFormDialog) {
        return ['性别', '班级', '障碍类型', '安置形式'].includes(column) ? 'select' : 'input'
      }
      if (this.isResourceRoomFormDialog) {
        return ['校区', '教室类型'].includes(column) ? 'select' : 'input'
      }
      if (this.isTermPlanFormDialog) {
        return ['学期', '学科', '学生'].includes(column) ? 'select' : 'input'
      }
      if (this.isLessonFormDialog) {
        if (['教师', '学生'].includes(column)) return 'select'
        return 'input'
      }
      if (this.isResourceLibraryFormDialog) {
        return ['资源类型', '学科', '应用范围'].includes(column) ? 'select' : 'input'
      }
      if (this.isStudentPlanFormDialog) {
        if (column === '关联教案') return 'checkbox'
        return ['学生', '学号', '学科', '学期', '状态', '关联教案'].includes(column) ? 'select' : 'input'
      }
      if (this.isFamilyTaskFormDialog) {
        return ['学生', '执行状态', '阅读状态'].includes(column) ? 'select' : 'input'
      }
      if (this.isFamilyNoticeFormDialog) {
        return column === '发送范围' ? 'select' : 'input'
      }
      if (this.isDeliveryFormDialog) {
        if (column === '送教主题') return 'input'
        if (column === '教学记录详情') return 'date'
        if (column === '负责老师') return 'checkbox'
        return ['班级', '学生姓名', '性别', '学号', '障碍类型', '负责老师'].includes(column) ? 'select' : 'input'
      }
      if (this.isAssessmentListFormDialog) {
        return ['学号', '学生', '性别', '障碍类型', '评估类型', '评估量表', '评估教师'].includes(column) ? 'select' : 'input'
      }
      return 'input'
    },
    resolveFieldOptions(column: string): string[] {
      if (column === '性别') return ['男', '女']
      if (column === '班级类型') return ['送教班', '在校班']
      if (['班主任', '教师'].includes(column)) return this.normalizedTeacherOptions()
      if (column === '班级') return this.normalizedClassOptions()
      if (column === '障碍类型') return ['智力障碍', '孤独症', '肢体障碍', '学习障碍', '听力障碍', '视力障碍', '多重障碍']
      if (column === '安置形式') return ['特教学校就读', '送教上门', '融合学校随班就读']
      if (column === '校区') return ['渝中校区', '江北校区', '沙坪坝校区', '九龙坡校区']
      if (column === '教室类型') return ['资源教室', '感统教室', '康复训练室', '心理辅导室']
      if (column === '学期') return ['2026春季学期', '2026秋季学期']
      if (column === '学科') return ['生活语文', '生活数学', '生活适应', '运动与保健', '康复训练']
      if (column === '学生') return this.normalizedStudentOptions()
      if (this.isLessonFormDialog && column === '教师') return this.normalizedTeacherOptions()
      if (this.isLessonFormDialog && column === '学生') return this.normalizedStudentOptions()
      if (this.isStudentLinkedForm && column === '学生姓名') return this.normalizedStudentOptions()
      if (this.isStudentLinkedForm && column === '学号') return this.normalizedStudentNoOptions()
      if (column === '课程') return ['生活语文', '生活数学', '生活适应', '运动与保健', '康复训练']
      if (column === '授课类型') return ['个训', '集体教学', '送教上门', '融合支持']
      if (column === '授课班级') return this.normalizedClassOptions()
      if (this.isResourceLibraryFormDialog && column === '资源类型') return resourceUploadTypeOptions
      if (this.isResourceLibraryFormDialog && column === '学科') return ['生活语文', '生活数学', '社会适应', '运动与保健']
      if (this.isResourceLibraryFormDialog && column === '应用范围') return ['全校', '私有', '公共']
      if (column === '状态' && this.isStudentPlanFormDialog) return ['进行中', '已完成']
      if (column === '关联教案') return this.normalizedLessonOptions()
      if (this.isFamilyTaskFormDialog && column === '执行状态') return ['未完成', '已完成']
      if (this.isFamilyTaskFormDialog && column === '阅读状态') return ['未读', '已读', '已提醒']
      if (this.isFamilyNoticeFormDialog && column === '发送范围') return ['全校家长', '送教班家长', '启智一班家长', '启智二班家长', '融合支持班家长']
      if (this.isDeliveryFormDialog && column === '班级') return this.normalizedClassOptions()
      if (this.isDeliveryFormDialog && column === '负责老师') return this.normalizedTeacherOptions()
      if (this.isAssessmentListFormDialog && column === '评估类型') return assessmentTypeOptions
      if (this.isAssessmentListFormDialog && column === '评估量表') return this.assessmentScaleOptions()
      if (this.isAssessmentListFormDialog && column === '评估教师') return this.normalizedTeacherOptions()
      return []
    },
    normalizedTeacherOptions(): string[] {
      const options = (this.teacherOptions as string[]).map(String).filter(Boolean)
      return Array.from(new Set(options))
    },
    normalizedClassOptions(): string[] {
      const options = (this.classOptions as string[]).map(String).filter(Boolean)
      return Array.from(new Set(options))
    },
    resolveClassYear(className: string): string {
      const name = String(className || '').trim()
      const yearMap = this.classYearMap as Record<string, string>
      return String(yearMap[name] || this.currentYear)
    },
    syncStudentYearByClass() {
      const classKey = this.getColumnKey('班级')
      const yearKey = this.getColumnKey('学年')
      if (!classKey || !yearKey) return
      this.$set(this.localValues, yearKey, this.resolveClassYear(this.localValues[classKey]))
    },
    normalizedStudentOptions(): string[] {
      const profiles = (this.studentProfiles as Array<Record<string, string>>)
        .map((item) => String(item.name || ''))
        .filter(Boolean)
      if (profiles.length) return Array.from(new Set(profiles))
      const options = (this.studentOptions as string[]).map(String).filter(Boolean)
      return Array.from(new Set(options))
    },
    normalizedStudentNoOptions(): string[] {
      const profiles = (this.studentProfiles as Array<Record<string, string>>)
        .map((item) => String(item.studentNo || ''))
        .filter(Boolean)
      if (profiles.length) return Array.from(new Set(profiles))
      const options = (this.studentNoOptions as string[]).map(String).filter(Boolean)
      return Array.from(new Set(options))
    },
    normalizedLessonOptions(): string[] {
      const options = (this.lessonOptions as string[]).map(String).filter(Boolean)
      return Array.from(new Set(options))
    },
    normalizedResourceOptions(): string[] {
      const options = (this.resourceOptions as string[]).map(String).filter(Boolean)
      return Array.from(new Set(options))
    },
    getRelatedResourceMeta(option: string): string {
      return String((this.resourceOptionTypes as Record<string, string>)[option] || option || '')
    },
    getRelatedResourceKind(option: string): 'image' | 'document' | 'video' | 'tool' | 'courseware' | 'resource' {
      const meta = `${this.getRelatedResourceMeta(option)} ${option}`.toLowerCase()
      if (/(png|jpe?g|gif|webp|bmp|svg|图片|图像|照片)/i.test(meta)) return 'image'
      if (/(mp4|mov|avi|wmv|webm|m4v|视频|微课)/i.test(meta)) return 'video'
      if (/(教具|训练器|沙盘|平衡木|器材|工具)/i.test(meta)) return 'tool'
      if (/(ppt|pptx|课件|幻灯片)/i.test(meta)) return 'courseware'
      if (/(pdf|doc|docx|xls|xlsx|txt|教案|文档|文件)/i.test(meta)) return 'document'
      return 'resource'
    },
    getRelatedResourceIcon(option: string): string {
      const iconMap: Record<string, string> = {
        image: 'el-icon-picture-outline',
        document: 'el-icon-document',
        video: 'el-icon-video-camera',
        tool: 'el-icon-box',
        courseware: 'el-icon-data-board',
        resource: 'el-icon-folder-opened',
      }
      return iconMap[this.getRelatedResourceKind(option)]
    },
    getRelatedResourceTypeLabel(option: string): string {
      const meta = this.getRelatedResourceMeta(option)
      const explicitType = String(meta.split('|')[0] || '').trim()
      if (['课件', '教案', '微课', '教具', '图片', '文档', '视频'].includes(explicitType)) return explicitType
      const labelMap: Record<string, string> = {
        image: '图片',
        document: '文档',
        video: '视频',
        tool: '教具',
        courseware: '课件',
        resource: '资源',
      }
      return labelMap[this.getRelatedResourceKind(option)]
    },
    getRelatedResourceIconClass(option: string): string {
      return `is-${this.getRelatedResourceKind(option)}`
    },
    handleFieldChange(field: FieldItem) {
      if (this.isAssessmentListFormDialog && field.label === '评估类型') {
        this.syncAssessmentScaleByType()
        return
      }
      if (this.isAssessmentListFormDialog && field.label === '评估量表') {
        this.syncAssessmentTypeByScale()
        return
      }
      if (this.isStudentFormDialog && field.label === '班级') {
        this.syncStudentYearByClass()
        return
      }
      if (!this.isStudentLinkedForm || !['学生', '学生姓名', '学号'].includes(field.label)) return
      const profile = this.resolveStudentProfileByValue(this.localValues[field.key], field.label)
      if (profile) this.applyStudentProfile(profile)
    },
    resolveStudentProfileByValue(value: string, label: string): Record<string, string> | undefined {
      const raw = String(value || '').trim()
      if (!raw) return undefined
      const matchedNo = raw.match(/（(.+?)）/)
      const normalized = matchedNo ? matchedNo[1] : raw
      const profiles = this.studentProfiles as Array<Record<string, string>>
      if (label === '学号' || matchedNo) return profiles.find((item) => item.studentNo === normalized)
      return profiles.find((item) => item.name === normalized || item.studentNo === normalized)
    },
    applyStudentProfile(profile: Record<string, string>) {
      const values: Record<string, string> = {
        学生: profile.name || '',
        学生姓名: profile.name || '',
        学号: profile.studentNo || '',
        性别: profile.gender || '',
        班级: profile.className || '',
        障碍类型: profile.disability || '',
      }
      Object.entries(values).forEach(([label, value]) => {
        const key = this.getColumnKey(label)
        if (key && value) this.$set(this.localValues, key, value)
      })
    },
    getColumnKey(label: string): string {
      const index = (this.columns as string[]).findIndex((column) => column === label)
      return index >= 0 ? `col${index}` : ''
    },
    applyClassDefaults() {
      const defaults: Record<string, string> = {
        班级类型: '在校班',
        开设学年: this.currentYear,
        学生人数: '0',
        状态: '在用',
      }
      Object.entries(defaults).forEach(([label, value]) => {
        const key = this.getColumnKey(label)
        if (key && !this.localValues[key]) this.$set(this.localValues, key, value)
      })
      ;['班主任', '教师'].forEach((label) => {
        const key = this.getColumnKey(label)
        if (key) this.$set(this.localValues, key, '')
      })
    },
    buildClassSaveValues(): Record<string, string> {
      const values = { ...this.localValues }
      const autoValues: Record<string, string> = {
        学生人数: '0',
        状态: '在用',
      }
      Object.entries(autoValues).forEach(([label, value]) => {
        const key = this.getColumnKey(label)
        if (key) values[key] = value
      })
      return values
    },
    applyStudentDefaults() {
      const defaults: Record<string, string> = {
        性别: '',
        班级: '',
        障碍类型: '',
        安置形式: '',
        学年: this.currentYear,
        状态: '在读',
      }
      Object.entries(defaults).forEach(([label, value]) => {
        const key = this.getColumnKey(label)
        if (key) this.$set(this.localValues, key, value)
      })
      this.syncStudentYearByClass()
    },
    buildStudentSaveValues(): Record<string, string> {
      const values = { ...this.localValues }
      const autoValues: Record<string, string> = {
        状态: '在读',
      }
      const classKey = this.getColumnKey('班级')
      const yearKey = this.getColumnKey('学年')
      if (classKey && yearKey) values[yearKey] = this.resolveClassYear(values[classKey])
      Object.entries(autoValues).forEach(([label, value]) => {
        const key = this.getColumnKey(label)
        if (key) values[key] = value
      })
      const studentNoKey = this.getColumnKey('学号')
      if (studentNoKey && !values[studentNoKey]) values[studentNoKey] = `S${this.currentYear}${Date.now().toString().slice(-4)}`
      return values
    },
    applyResourceRoomDefaults() {
      const defaults: Record<string, string> = {
        校区: '',
        教室类型: '',
        教室序号: `ROOM-${this.currentYear}-${Date.now().toString().slice(-3)}`,
        教室面积: '',
        容纳人数: '',
        备注: '',
        教室图片: '',
      }
      Object.entries(defaults).forEach(([label, value]) => {
        const key = this.getColumnKey(label)
        if (key && !this.localValues[key]) this.$set(this.localValues, key, value)
      })
    },
    buildResourceRoomSaveValues(): Record<string, string> {
      const values = { ...this.localValues }
      const roomNoKey = this.getColumnKey('教室序号')
      if (roomNoKey && !values[roomNoKey]) values[roomNoKey] = `ROOM-${this.currentYear}-${Date.now().toString().slice(-3)}`
      return values
    },
    applyTermPlanDefaults() {
      const defaults: Record<string, string> = {
        学期: '2026春季学期',
        学科: '',
        创建教师: this.currentUserName,
        学生: '',
      }
      Object.entries(defaults).forEach(([label, value]) => {
        const key = this.getColumnKey(label)
        if (key && !this.localValues[key]) this.$set(this.localValues, key, value)
      })
      if (!this.planContentRows.length) this.planContentRows = [{ 长期目标: '', 短期目标: [{ 短期目标: '', 开始时间: '', 结束时间: '' }] }]
    },
    buildTermPlanSaveValues(): Record<string, string> {
      const values = { ...this.localValues }
      const creatorKey = this.getColumnKey('创建教师')
      if (creatorKey) values[creatorKey] = this.currentUserName
      const actionKey = this.getColumnKey('操作')
      if (actionKey) values[actionKey] = '编辑 / 删除'
      return values
    },
    applyStudentPlanDefaults() {
      const defaults: Record<string, string> = {
        学号: '',
        学生: '',
        学科: '',
        学期: '2026春季学期',
        创建教师: this.currentUserName,
        状态: '进行中',
        关联教案: '',
      }
      Object.entries(defaults).forEach(([label, value]) => {
        const key = this.getColumnKey(label)
        if (key && !this.localValues[key]) this.$set(this.localValues, key, value)
      })
      if (!this.planContentRows.length) this.planContentRows = [{ 长期目标: '', 短期目标: [{ 短期目标: '', 开始时间: '', 结束时间: '' }] }]
    },
    buildStudentPlanSaveValues(): Record<string, string> {
      const values = { ...this.localValues }
      const studentKey = this.getColumnKey('学生')
      const studentNoKey = this.getColumnKey('学号')
      if (studentKey && studentNoKey) {
        const matched = String(values[studentKey] || '').match(/（(.+?)）/)
        if (matched?.[1]) {
          values[studentNoKey] = matched[1]
          values[studentKey] = String(values[studentKey]).replace(/（.+?）/, '')
        }
      }
      const creatorKey = this.getColumnKey('创建教师')
      if (creatorKey) values[creatorKey] = this.currentUserName
      const statusKey = this.getColumnKey('状态')
      if (statusKey) values[statusKey] = values[statusKey] || '进行中'
      const actionKey = this.getColumnKey('操作')
      if (actionKey) values[actionKey] = '编辑 / 删除'
      return values
    },
    applyLessonDefaults() {
      const defaults: Record<string, string> = {
        教案名称: '',
        教师: '',
        学生: '',
        教学目标: '',
        教学内容: '',
        教学步骤: '',
        相关资源: '',
      }
      Object.entries(defaults).forEach(([label, value]) => {
        const key = this.getColumnKey(label)
        if (key && !this.localValues[key]) this.$set(this.localValues, key, value)
      })
      this.lessonContentForm = this.parseLessonContentFromRow()
    },
    buildLessonSaveValues(): Record<string, string> {
      const values = { ...this.localValues }
      const actionKey = this.getColumnKey('操作')
      if (actionKey) values[actionKey] = '查看 / 复制 / 编辑 / 删除'
      return values
    },
    applyResourceLibraryDefaults() {
      const defaults: Record<string, string> = {
        资源名称: '',
        资源类型: '',
        学科: '',
        资源上传: '',
        应用范围: '全校',
        上传时间: this.formatLocalDateTime(),
      }
      Object.entries(defaults).forEach(([label, value]) => {
        const key = this.getColumnKey(label)
        if (key && !this.localValues[key]) this.$set(this.localValues, key, value)
      })
    },
    buildResourceLibrarySaveValues(): Record<string, string> {
      const values = { ...this.localValues }
      const uploadTimeKey = this.getColumnKey('上传时间')
      if (uploadTimeKey) values[uploadTimeKey] = values[uploadTimeKey] || this.formatLocalDateTime()
      const actionKey = this.getColumnKey('操作')
      if (actionKey) values[actionKey] = '下载 / 编辑 / 删除'
      return values
    },
    applyFamilyTaskDefaults() {
      const defaults: Record<string, string> = {
        任务名称: '',
        详情及要求: '',
        学生: '',
        执行状态: '未完成',
        阅读状态: '未读',
        提交时间: this.formatLocalDateTime(),
      }
      Object.entries(defaults).forEach(([label, value]) => {
        const key = this.getColumnKey(label)
        if (key && !this.localValues[key]) this.$set(this.localValues, key, value)
      })
    },
    buildFamilyTaskSaveValues(): Record<string, string> {
      const values = { ...this.localValues }
      const statusKey = this.getColumnKey('执行状态')
      if (statusKey) values[statusKey] = values[statusKey] || '未完成'
      const readKey = this.getColumnKey('阅读状态')
      if (readKey) values[readKey] = values[readKey] || '未读'
      const submitKey = this.getColumnKey('提交时间')
      if (submitKey) values[submitKey] = values[submitKey] || this.formatLocalDateTime()
      const actionKey = this.getColumnKey('操作')
      if (actionKey) values[actionKey] = '提醒家长'
      return values
    },
    applyFamilyNoticeDefaults() {
      const defaults: Record<string, string> = {
        通知标题: '',
        通知内容: '',
        发送范围: '',
        已读人数: '0',
        未读人数: '0',
        发布时间: this.formatLocalDateTime(),
      }
      Object.entries(defaults).forEach(([label, value]) => {
        const key = this.getColumnKey(label)
        if (key && !this.localValues[key]) this.$set(this.localValues, key, value)
      })
    },
    buildFamilyNoticeSaveValues(): Record<string, string> {
      const values = { ...this.localValues }
      const readKey = this.getColumnKey('已读人数')
      if (readKey) values[readKey] = values[readKey] || '0'
      const unreadKey = this.getColumnKey('未读人数')
      if (unreadKey) values[unreadKey] = values[unreadKey] || '0'
      const publishKey = this.getColumnKey('发布时间')
      if (publishKey) values[publishKey] = values[publishKey] || this.formatLocalDateTime()
      const actionKey = this.getColumnKey('操作')
      if (actionKey) values[actionKey] = '查看统计 / 再次提醒'
      return values
    },
    applyDeliveryDefaults() {
      const defaults: Record<string, string> = {
        班级: '',
        学生姓名: '',
        性别: '',
        学号: '',
        障碍类型: '',
        送教主题: '',
        教学记录详情: '',
        负责老师: '',
      }
      Object.entries(defaults).forEach(([label, value]) => {
        const key = this.getColumnKey(label)
        if (key && !this.localValues[key]) this.$set(this.localValues, key, value)
      })
      if (!this.deliveryRecordRows.length) this.deliveryRecordRows = [{ 教学内容: '', 完成效果: '' }]
    },
    buildDeliverySaveValues(): Record<string, string> {
      const values = { ...this.localValues }
      const actionKey = this.getColumnKey('操作')
      if (actionKey) values[actionKey] = '学生主页 / 编辑 / 删除'
      return values
    },
    applyAssessmentListDefaults() {
      const defaults: Record<string, string> = {
        学号: '',
        学生: '',
        性别: '',
        障碍类型: '',
        评估类型: '学科评估',
        评估量表: '生活语文',
        '得分/进度': '',
        评估时间: this.formatLocalDate(),
        评估教师: this.currentUserName,
        评估状态: '未开始',
      }
      Object.entries(defaults).forEach(([label, value]) => {
        const key = this.getColumnKey(label)
        if (key && !this.localValues[key]) this.$set(this.localValues, key, value)
      })
      const timeKey = this.getColumnKey('评估时间')
      if (timeKey) this.$set(this.localValues, timeKey, this.formatLocalDate())
      this.syncAssessmentScaleByType()
    },
    assessmentScaleOptions(): string[] {
      const typeKey = this.getColumnKey('评估类型')
      if (!typeKey || this.hiddenFieldLabels.includes('评估类型')) {
        return Array.from(new Set(Object.values(assessmentScaleOptionsByType).flat()))
      }
      const type = String(this.localValues[typeKey] || '学科评估')
      return assessmentScaleOptionsByType[type] || assessmentScaleOptionsByType['学科评估']
    },
    syncAssessmentScaleByType() {
      const scaleKey = this.getColumnKey('评估量表')
      if (!scaleKey) return
      const options = this.assessmentScaleOptions()
      if (!options.includes(this.localValues[scaleKey])) this.$set(this.localValues, scaleKey, options[0] || '')
      this.syncAssessmentTypeByScale()
    },
    syncAssessmentTypeByScale() {
      const typeKey = this.getColumnKey('评估类型')
      const scaleKey = this.getColumnKey('评估量表')
      if (!typeKey || !scaleKey) return
      this.$set(this.localValues, typeKey, this.resolveAssessmentTypeByScale(this.localValues[scaleKey]))
    },
    resolveAssessmentTypeByScale(scale: string): string {
      const raw = String(scale || '')
      const matched = Object.entries(assessmentScaleOptionsByType).find(([, options]) => options.includes(raw))
      return matched?.[0] || '学科评估'
    },
    buildAssessmentListSaveValues(): Record<string, string> {
      const values = { ...this.localValues }
      const studentKey = this.getColumnKey('学生')
      const studentNoKey = this.getColumnKey('学号')
      if (studentKey && studentNoKey) {
        const matched = String(values[studentKey] || '').match(/（(.+?)）/)
        if (matched?.[1]) {
          values[studentNoKey] = matched[1]
          values[studentKey] = String(values[studentKey]).replace(/（.+?）/, '')
        }
      }
      const timeKey = this.getColumnKey('评估时间')
      if (timeKey) values[timeKey] = values[timeKey] || this.formatLocalDate()
      const scaleKey = this.getColumnKey('评估量表')
      const typeKey = this.getColumnKey('评估类型')
      if (typeKey && scaleKey) values[typeKey] = this.resolveAssessmentTypeByScale(values[scaleKey])
      const teacherKey = this.getColumnKey('评估教师')
      if (teacherKey) values[teacherKey] = this.currentUserName
      const statusKey = this.getColumnKey('评估状态')
      if (statusKey) values[statusKey] = values[statusKey] || '未开始'
      const actionKey = this.getColumnKey('操作')
      if (actionKey) {
        if (values[statusKey] === '未开始') values[actionKey] = '开始评估 / 编辑 / 删除'
        else if (values[statusKey] === '进行中') values[actionKey] = '继续评估 / 编辑 / 删除'
        else if (values[statusKey] === '已完成') values[actionKey] = '家长推送 / 查看记录 / 编辑 / 删除'
        else values[actionKey] = '编辑 / 删除'
      }
      return values
    },
    formatLocalDate(): string {
      const now = new Date()
      const yyyy = now.getFullYear()
      const mm = `${now.getMonth() + 1}`.padStart(2, '0')
      const dd = `${now.getDate()}`.padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    },
    formatLocalDateTime(): string {
      const now = new Date()
      const yyyy = now.getFullYear()
      const mm = `${now.getMonth() + 1}`.padStart(2, '0')
      const dd = `${now.getDate()}`.padStart(2, '0')
      const hh = `${now.getHours()}`.padStart(2, '0')
      const mi = `${now.getMinutes()}`.padStart(2, '0')
      return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
    },
    buildSaveValues(): Record<string, string> {
      if (this.isAddClassDialog) return this.buildClassSaveValues()
      if (this.isStudentFormDialog) return this.buildStudentSaveValues()
      if (this.isResourceRoomFormDialog) return this.buildResourceRoomSaveValues()
      if (this.isResourceLibraryFormDialog) return this.buildResourceLibrarySaveValues()
      if (this.isTermPlanFormDialog) return this.buildTermPlanSaveValues()
      if (this.isLessonFormDialog) return this.buildLessonSaveValues()
      if (this.isStudentPlanFormDialog) return this.buildStudentPlanSaveValues()
      if (this.isFamilyTaskFormDialog) return this.buildFamilyTaskSaveValues()
      if (this.isFamilyNoticeFormDialog) return this.buildFamilyNoticeSaveValues()
      if (this.isDeliveryFormDialog) return this.buildDeliverySaveValues()
      if (this.isAssessmentListFormDialog) return this.buildAssessmentListSaveValues()
      return { ...this.localValues }
    },
    parseRelatedResourceValue(value: string): { selected: string[]; uploaded: string } {
      const raw = String(value || '')
      if (!raw) return { selected: [], uploaded: '' }
      try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          return {
            selected: Array.isArray(parsed.selected) ? parsed.selected.map(String).filter(Boolean) : [],
            uploaded: String(parsed.uploaded || ''),
          }
        }
      } catch (error) {
        return { selected: raw.split(/[、,，/]/).map((item) => item.trim()).filter(Boolean), uploaded: '' }
      }
      return { selected: [], uploaded: '' }
    },
    serializeRelatedResourceValue(value: { selected: string[]; uploaded: string }): string {
      const selected = Array.from(new Set((value.selected || []).map(String).filter(Boolean)))
      const uploaded = String(value.uploaded || '')
      if (!selected.length && !uploaded) return ''
      return JSON.stringify({ selected, uploaded })
    },
    getRelatedResourceSelected(key: string): string[] {
      return this.parseRelatedResourceValue(this.localValues[key]).selected
    },
    setRelatedResourceSelected(key: string, value: string[]) {
      const current = this.parseRelatedResourceValue(this.localValues[key])
      this.$set(this.localValues, key, this.serializeRelatedResourceValue({ ...current, selected: value || [] }))
    },
    handleRelatedResourceUpload(file: File, key: string) {
      const current = this.parseRelatedResourceValue(this.localValues[key])
      this.$set(this.localValues, key, this.serializeRelatedResourceValue({ ...current, uploaded: file.name }))
      this.$message.success(`${file.name} 已添加到相关资源。`)
      return false
    },
    clearRelatedResource(key: string) {
      this.$set(this.localValues, key, '')
    },
    formatRelatedResourceDisplay(value: string): string {
      const parsed = this.parseRelatedResourceValue(value)
      return [...parsed.selected, parsed.uploaded].filter(Boolean).join('、')
    },
    relatedResourceDisplayItems(value: string): string[] {
      const parsed = this.parseRelatedResourceValue(value)
      return [...parsed.selected, parsed.uploaded].filter(Boolean)
    },
    formatLessonContentDisplay(value: string): string {
      const raw = String(value || '')
      if (!raw) return ''
      try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') return `内容：${parsed.内容 || '-'}；重难点：${parsed.重难点 || '-'}`
      } catch (error) {
        return raw
      }
      return raw
    },
    getMultiValue(key: string): string[] {
      return String(this.localValues[key] || '')
        .split(/[、,，/]/)
        .map((item) => item.trim())
        .filter(Boolean)
    },
    setMultiValue(key: string, value: string[]) {
      this.$set(this.localValues, key, (value || []).join('、'))
    },
    isAvatarColumn(column: string): boolean {
      return ['头像', '照片', '教室图片'].includes(column)
    },
    getImageUploadButtonText(column: string): string {
      return column === '教室图片' ? '上传图片' : '上传头像'
    },
    getImageClearButtonText(column: string): string {
      return column === '教室图片' ? '移除图片' : '移除头像'
    },
    getEmptyImageText(column: string): string {
      return column === '教室图片' ? '暂无图片' : '暂无头像'
    },
    isFileUploadColumn(column: string): boolean {
      return (this.isLessonFormDialog && column === '课件') || (this.isResourceLibraryFormDialog && column === '资源上传')
    },
    getUploadButtonText(column: string): string {
      return column === '资源上传' ? '上传资源' : '上传课件'
    },
    getEmptyFileText(column: string): string {
      return column === '资源上传' ? '暂无资源文件' : '暂无课件'
    },
    formatFileDisplay(value: string): string {
      const raw = String(value || '')
      if (!raw) return ''
      try {
        const parsed = JSON.parse(raw)
        return String(parsed?.name || raw)
      } catch (error) {
        return raw
      }
    },
    isImageValue(value: string): boolean {
      return String(value || '').startsWith('data:image/')
    },
    handleImageUpload(file: File, key: string) {
      if (!file.type.startsWith('image/')) {
        this.$message.warning('请上传图片文件。')
        return false
      }
      const reader = new FileReader()
      reader.onload = () => {
        this.$set(this.localValues, key, String(reader.result || ''))
      }
      reader.readAsDataURL(file)
      return false
    },
    clearImage(key: string) {
      this.$set(this.localValues, key, '')
    },
    handleFileUpload(file: File, key: string) {
      this.clearUploadTimer(key)
      const label = this.getFieldLabelByKey(key)
      if (label === '资源上传') {
        const reader = new FileReader()
        reader.onload = () => {
          this.$set(this.localValues, key, JSON.stringify({
            name: file.name,
            type: file.type || 'application/octet-stream',
            dataUrl: String(reader.result || ''),
          }))
        }
        reader.readAsDataURL(file)
      } else {
        this.$set(this.localValues, key, file.name)
      }
      this.$set(this.uploadProgress, key, 8)
      this.uploadTimers[key] = window.setInterval(() => {
        const current = this.uploadProgress[key] || 0
        const next = Math.min(current + 18, 100)
        this.$set(this.uploadProgress, key, next)
        if (next >= 100) {
          this.clearUploadTimer(key)
          this.$message.success(`${file.name} 上传完成。`)
        }
      }, 160)
      return false
    },
    getFieldLabelByKey(key: string): string {
      const match = String(key || '').match(/^col(\d+)$/)
      const index = match ? Number(match[1]) : -1
      return index >= 0 ? String((this.columns as string[])[index] || '') : ''
    },
    clearFile(key: string) {
      this.clearUploadTimer(key)
      this.$set(this.localValues, key, '')
      this.$delete(this.uploadProgress, key)
    },
    isUploadProgressVisible(key: string): boolean {
      return this.uploadProgress[key] > 0
    },
    getUploadProgress(key: string): number {
      return this.uploadProgress[key] || 0
    },
    clearUploadTimer(key: string) {
      const timer = this.uploadTimers[key]
      if (timer) window.clearInterval(timer)
      this.$delete(this.uploadTimers, key)
    },
  },
})
</script>
