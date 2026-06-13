﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿<template>
  <div>
    <PageSection :title="page.title" :description="page.description">
      <template v-if="!isAssessmentListPage" #extra>
        <div v-if="visibleTopActions.length" class="table-actions">
          <template v-for="action in visibleTopActions">
            <el-dropdown v-if="isAssessmentListPage && action === '量表管理'" :key="action" trigger="click" @command="openAssessmentScaleManager">
              <el-button size="small" type="primary" plain>
                评估类别<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="/assessment/sihai">学科评估</el-dropdown-item>
                <el-dropdown-item command="/assessment/autism">孤独症行为评估</el-dropdown-item>
                <el-dropdown-item command="/assessment/inclusion">融合学校随班就读评估</el-dropdown-item>
                <el-dropdown-item command="/assessment/custom">自有量表评估</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
            <el-button v-else :key="action" size="small" type="primary" plain @click="openTopAction(action)">{{ action }}</el-button>
          </template>
        </div>
      </template>

      <div class="stat-grid" v-if="pageStats.length">
        <div class="mini-stat" v-for="item in pageStats" :key="item.label"><span>{{ item.label }}</span><strong>{{ item.value }}</strong></div>
      </div>

      <div v-if="page.comparison" class="comparison-board">
        <div class="comparison-card" v-for="item in page.comparison" :key="item.label" :class="item.status === 'risk' ? 'is-risk' : 'is-gain'">
          <span>{{ item.label }}</span>
          <strong>{{ item.current }}</strong>
          <small>上次 {{ item.previous }}，{{ item.status === 'risk' ? '退步预警' : '进步提升' }}</small>
        </div>
      </div>

      <div v-if="showSwitchRow" class="switch-row">
        <button v-for="tab in switchTabs" :key="tab" class="switch-chip" :class="{ 'is-active': tab === activeTab }" @click="activeTab = tab">
          {{ tab }}
        </button>
        <button v-if="isClassPage" class="switch-chip" type="button" @click="openTopAction('添加班级')">添加班级</button>
        <button v-if="isStudentPage" class="switch-chip" type="button" @click="openTopAction('添加学生')">添加学生</button>
        <button v-if="isResourceRoomPage" class="switch-chip" type="button" @click="openTopAction('添加资源教室')">添加资源教室</button>
        <button v-if="isTermPlanPage" class="switch-chip" type="button" @click="openTopAction('添加计划')">添加计划</button>
        <button v-if="isFamilyTaskPage" class="switch-chip" type="button" @click="openTopAction('添加任务')">添加任务</button>
        <button v-if="isFamilyNoticePage" class="switch-chip" type="button" @click="openTopAction('添加通知')">添加通知</button>
        <button v-if="isDeliveryPage" class="switch-chip" type="button" @click="openTopAction('创建')">创建</button>
      </div>

      <div v-if="isAssessmentListPage && visibleTopActions.length" class="table-actions assessment-list-actions">
        <template v-for="action in visibleTopActions">
          <el-dropdown v-if="action === '量表管理'" :key="action" trigger="click" @command="openAssessmentScaleManager">
            <el-button size="small" type="primary" plain>
              评估类别<i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="/assessment/sihai">学科评估</el-dropdown-item>
              <el-dropdown-item command="/assessment/autism">孤独症行为评估</el-dropdown-item>
              <el-dropdown-item command="/assessment/inclusion">融合学校随班就读评估</el-dropdown-item>
              <el-dropdown-item command="/assessment/custom">自有量表评估</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          <el-button v-else :key="action" size="small" type="primary" plain @click="openTopAction(action)">{{ action }}</el-button>
        </template>
      </div>

      <div v-if="(isAssessmentListPage || isAssessmentResultPage) && assessmentClassTabs.length > 1" class="switch-row assessment-class-tabs">
        <button
          v-for="tab in assessmentClassTabs"
          :key="tab"
          class="switch-chip"
          :class="{ 'is-active': tab === activeAssessmentClass }"
          type="button"
          @click="activeAssessmentClass = tab"
        >
          {{ tab }}
        </button>
      </div>

      <div v-if="hasFilters" class="filter-toolbar">
        <el-select v-for="filter in selectFilters" :key="filter" v-model="filterValues[filter]" clearable size="small" :placeholder="`请选择${filter}`" class="toolbar-select">
          <el-option v-for="option in getFilterOptions(filter)" :key="option" :label="option" :value="option"></el-option>
        </el-select>
        <el-input v-for="filter in textFilters" :key="filter" v-model="filterValues[filter]" clearable size="small" :placeholder="`请输入${filter}`" class="toolbar-search" suffix-icon="el-icon-search"></el-input>
        <el-button type="primary" size="small" plain @click="notifyFilterResult">查找</el-button>
        <el-button size="small" plain @click="resetFilters">重置</el-button>
      </div>

      <div v-if="page.tips" class="tip-list"><span v-for="tip in page.tips" :key="tip">{{ tip }}</span></div>

      <AppDataTable :columns="page.columns || []" :rows="displayRows" :hidden-columns="page.hiddenColumns || []" :action-min-width="260" :sortable="isClassPage" pagination @action="handleTableAction" @sort-end="handleSortEnd" />
    </PageSection>

    <DemoActionDialog
      v-if="!isTermPage"
      :visible.sync="dialogVisible"
      :action="currentAction"
      :columns="page.columns || []"
      :row="currentRow"
      :teacher-options="teacherOptions"
      :class-options="classOptions"
      :class-year-map="classYearMap"
      :student-options="studentOptions"
      :student-no-options="studentNoOptions"
      :student-profiles="studentProfiles"
      :current-user-name="currentUserName"
      @save="saveDialog"
    />

    <el-dialog :visible.sync="transferClassVisible" title="转班" width="520px" class="demo-action-dialog">
      <div class="transfer-class-tip">
        将学生转入目标班级，班级变更后学生信息将自动更新。
      </div>
      <el-form label-width="92px" class="demo-form">
        <el-form-item label="当前班级">
          <el-input :value="transferCurrentClass" readonly />
        </el-form-item>
        <el-form-item label="目标班级" required>
          <el-select v-model="transferTargetClass" filterable clearable placeholder="请搜索或选择班级" class="full-width">
            <el-option v-for="item in classOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="transferClassVisible = false">取消</el-button>
        <el-button type="primary" plain @click="saveTransferClass">确认转班</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="termDialogVisible" title="修改学期信息" width="760px">
      <el-form ref="termFormRef" :model="termForm" :rules="termRules" label-width="92px">
        <el-form-item label="学期名称" prop="name" required>
          <el-input v-model="termForm.name" placeholder="请输入学期名称" />
        </el-form-item>
        <el-form-item label="日期范围" prop="dateRange" required>
          <el-date-picker
            v-model="termForm.dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            range-separator="至"
            value-format="yyyy-MM-dd"
            class="term-date-range"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="saveTermDialog">保存并关闭</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="historyDialogVisible" :title="`${selectedStudentName} - ${selectedScaleName} 历史得分`" width="820px" class="demo-action-dialog">
      <AppDataTable :columns="['评估时间', '总分', '维度得分概览']" :rows="historyScoreRows" :min-width="180" :action-min-width="160" />
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" plain @click="historyDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="analysisDialogVisible" :title="`${selectedStudentName} - ${selectedScaleName} 查看分析图表`" width="980px" class="demo-action-dialog">
      <div class="assessment-analysis-layout">
        <div class="analysis-summary-strip">
          <div class="analysis-summary-card">
            <span>最近一次得分</span>
            <strong>{{ getRowValue(selectedAssessmentRow, '最近一次得分') || '-' }}</strong>
          </div>
          <div class="analysis-summary-card is-gain">
            <span>关键提升点</span>
            <strong>{{ gainDiffs.length }}</strong>
          </div>
          <div class="analysis-summary-card is-risk">
            <span>待提高领域</span>
            <strong>{{ riskDiffs.length }}</strong>
          </div>
        </div>

        <ChartPanel v-if="analysisDialogVisible" :options="analysisChartOptions" />

        <div class="analysis-highlight-grid">
          <div class="analysis-highlight is-gain">
            <h4>关键提升点</h4>
            <p v-if="!gainDiffs.length">最近两次评估未发现明显提升维度。</p>
            <span v-for="item in gainDiffs" :key="`gain-${item.name}`">{{ item.name }} {{ formatDiff(item.delta) }}</span>
          </div>
          <div class="analysis-highlight is-risk">
            <h4>待提高领域</h4>
            <p v-if="!riskDiffs.length">最近两次评估未发现待提高领域。</p>
            <span v-for="item in riskDiffs" :key="`risk-${item.name}`">{{ item.name }} {{ formatDiff(item.delta) }}</span>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="analysisDialogVisible = false">关闭</el-button>
        <el-button type="primary" plain @click="exportAssessmentImage(selectedAssessmentRow, 'png')">保存PNG图片</el-button>
        <el-button type="primary" plain @click="exportAssessmentImage(selectedAssessmentRow, 'jpg')">保存JPG图片</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="noticeStatsDialogVisible" :title="`${selectedNoticeTitle} 阅读统计`" width="860px" class="demo-action-dialog">
      <div class="notice-reader-summary">
        <div class="notice-reader-card is-read">
          <span>已读人数</span>
          <strong>{{ noticeReadPeople.length }}</strong>
        </div>
        <div class="notice-reader-card is-unread">
          <span>未读人数</span>
          <strong>{{ noticeUnreadPeople.length }}</strong>
        </div>
      </div>
      <div class="notice-reader-grid">
        <div class="notice-reader-list">
          <h4>已读名单</h4>
          <div class="notice-reader-tags">
            <el-tag v-for="name in noticeReadPeople" :key="`read-${name}`" size="mini" type="success" effect="plain">{{ name }}</el-tag>
          </div>
        </div>
        <div class="notice-reader-list is-unread">
          <h4>未读名单</h4>
          <div class="notice-reader-tags">
            <el-tag v-for="name in noticeUnreadPeople" :key="`unread-${name}`" size="mini" type="danger" effect="plain">{{ name }}</el-tag>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" plain @click="noticeStatsDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="teachingRecordsVisible" :title="`${selectedDeliveryStudentName} - 教学记录详情`" width="760px" class="demo-action-dialog">
      <AppDataTable :columns="['教学内容', '完成效果']" :rows="selectedTeachingRecordRows" :min-width="200" :action-min-width="120" />
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" plain @click="teachingRecordsVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="assessmentAnswerVisible" :title="assessmentAnswerDialogTitle" width="920px" class="demo-action-dialog student-preview-dialog">
      <div class="student-preview-shell">
        <div class="student-preview-hero">
          <div>
            <h3>{{ assessmentAnswerScaleName || '当前评估' }}</h3>
            <p>{{ assessmentAnswerHeroText }}</p>
          </div>
          <el-tag type="warning" effect="plain">共 {{ assessmentQuestionCount }} 题</el-tag>
        </div>

        <div v-if="!assessmentAnswerQuestions.length" class="empty-state">
          <div class="empty-icon"><i class="el-icon-document"></i></div>
          <h3>当前量表还没有题目</h3>
          <p>请先在量表管理中维护题目，再开始学生评估。</p>
        </div>

        <div v-else class="student-question-list">
          <div v-for="(item, index) in assessmentAnswerQuestions" :key="item.id" class="student-question-card">
            <div class="student-question-meta">
              <span>第 {{ index + 1 }} 题</span>
              <el-tag size="mini" effect="plain">{{ item.type }}</el-tag>
              <el-tag size="mini" type="warning" effect="plain">{{ item.score || 0 }} 分</el-tag>
            </div>
            <h4>{{ getQuestionStem(item.title) }}</h4>
            <el-radio-group v-if="getQuestionOptions(item).length" v-model="assessmentAnswerValues[item.id]" class="student-option-list">
              <el-radio v-for="option in getQuestionOptions(item)" :key="option.value" :label="option.value" :disabled="assessmentAnswerReadonly">{{ option.label }}</el-radio>
            </el-radio-group>
            <el-input v-else v-model="assessmentAnswerValues[item.id]" type="textarea" :rows="3" :disabled="assessmentAnswerReadonly" placeholder="学生在此输入答案或评分记录" />
            <p class="student-question-dim">考查维度：{{ item.dimension || '未设置' }}</p>
            <div v-if="assessmentAnswerReadonly" class="assessment-answer-record">
              <span>学生选择：{{ formatQuestionAnswerValue(item, assessmentAnswerValues[item.id]) }}</span>
              <span>参考答案：{{ formatQuestionAnswerValue(item, item.answer, '未设置') }}</span>
            </div>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <template v-if="assessmentAnswerReadonly">
          <el-button type="primary" plain @click="assessmentAnswerVisible = false">关闭</el-button>
        </template>
        <template v-else>
          <el-button plain @click="saveAssessmentAnswerDraft">暂存</el-button>
          <el-button type="primary" plain @click="submitAssessmentAnswer">提交</el-button>
        </template>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="studentProfileVisible" :title="`${studentProfile.name || '学生'}主页`" width="1040px" class="demo-action-dialog">
      <div class="student-profile-panel">
        <div class="student-profile-hero">
          <span class="avatar-cell student-profile-avatar">{{ studentProfile.name ? studentProfile.name.slice(0, 1) : '学' }}</span>
          <div>
            <h3>{{ studentProfile.name || '--' }}</h3>
            <p>{{ studentProfile.studentNo || '--' }} · {{ studentProfile.className || '--' }} · {{ studentProfile.disability || '--' }}</p>
          </div>
          <el-tag :type="studentProfile.status === '已归档' ? 'info' : 'success'" effect="plain">{{ studentProfile.status || '在读' }}</el-tag>
        </div>

        <div class="student-profile-meta">
          <span>性别：{{ studentProfile.gender || '--' }}</span>
          <span>安置形式：{{ studentProfile.placement || '--' }}</span>
          <span>负责老师：{{ studentProfile.teacher || '--' }}</span>
          <span>送教主题：{{ studentProfile.deliveryTopic || '--' }}</span>
        </div>

        <div class="student-profile-section">
          <h4>评估记录</h4>
          <AppDataTable :columns="['评估时间', '量表名称', '得分', '评估状态']" :rows="studentProfile.assessments" :min-width="140" :action-min-width="120" />
        </div>
        <div class="student-profile-section">
          <h4>学生计划</h4>
          <AppDataTable :columns="['学期', '计划内容', '状态', '关联教案']" :rows="studentProfile.plans" :min-width="150" :action-min-width="120" />
        </div>
        <div class="student-profile-section">
          <h4>送教与家校</h4>
          <AppDataTable :columns="['类型', '内容', '状态', '最近时间']" :rows="studentProfile.activities" :min-width="150" :action-min-width="120" />
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" plain @click="studentProfileVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import AppDataTable from '@/components/common/AppDataTable.vue'
import ChartPanel from '@/components/common/ChartPanel.vue'
import DemoActionDialog from '@/components/common/DemoActionDialog.vue'
import PageSection from '@/components/common/PageSection.vue'
import { getIepPage, getTablePage } from '@/api/modules'
import { getAppState, listAccounts, listScaleBankRecords, setAppState } from '@/db/demo-db'
import { deleteModuleRow, saveSortableItems, type RowRef, upsertModuleRow } from '@/db/demo-db'
import { tablePages } from '@/mock/app-data'
import type { SubjectScaleQuestion } from '@/mock/subject-scale-bank'
import { applyActionToValues, buildEmptyRow, cloneRows, columnsToRow, getDefaultActionText } from '@/utils/demo-actions'

type FilteredItem = {
  row: string[]
  ref?: RowRef
  index: number
}

type AssessmentHistoryRecord = {
  date: string
  total: number
  dimensions: Record<string, number>
}

type AssessmentDiff = {
  name: string
  previous: number
  current: number
  delta: number
  status: 'gain' | 'risk' | 'flat'
}

type StudentProfile = {
  name: string
  studentNo: string
  className: string
  gender: string
  disability: string
  placement: string
  status: string
  teacher: string
  deliveryTopic: string
  assessments: string[][]
  plans: string[][]
  activities: string[][]
}

export default Vue.extend({
  components: { AppDataTable, ChartPanel, DemoActionDialog, PageSection },
  data() {
    return {
      page: {} as any,
      tableRows: [] as string[][],
      rowRefs: [] as RowRef[],
      sortableItems: [] as string[],
      teacherOptions: [] as string[],
      classOptions: [] as string[],
      classYearMap: {} as Record<string, string>,
      studentOptions: [] as string[],
      studentNoOptions: [] as string[],
      studentProfiles: [] as Array<Record<string, string>>,
      activeTab: '',
      activeAssessmentClass: '全部',
      filterValues: {} as Record<string, string>,
      dialogVisible: false,
      historyDialogVisible: false,
      analysisDialogVisible: false,
      noticeStatsDialogVisible: false,
      teachingRecordsVisible: false,
      assessmentAnswerVisible: false,
      studentProfileVisible: false,
      termDialogVisible: false,
      transferClassVisible: false,
      transferTargetClass: '',
      transferRowIndex: -1,
      currentAction: '',
      currentRow: {} as Record<string, string>,
      selectedAssessmentRow: {} as Record<string, string>,
      assessmentHistoryMap: {} as Record<string, AssessmentHistoryRecord[]>,
      assessmentAnswerRow: {} as Record<string, string>,
      assessmentAnswerRowIndex: -1,
      assessmentAnswerMode: 'answer',
      assessmentAnswerQuestions: [] as SubjectScaleQuestion[],
      assessmentAnswerValues: {} as Record<string, string>,
      selectedNoticeRow: {} as Record<string, string>,
      selectedTeachingRecordRow: {} as Record<string, string>,
      studentProfile: {
        name: '',
        studentNo: '',
        className: '',
        gender: '',
        disability: '',
        placement: '',
        status: '',
        teacher: '',
        deliveryTopic: '',
        assessments: [],
        plans: [],
        activities: [],
      } as StudentProfile,
      editingRowIndex: -1,
      termForm: {
        name: '',
        dateRange: [] as string[],
      },
      termRules: {
        name: [{ required: true, message: '请输入学期名称', trigger: 'blur' }],
        dateRange: [{ required: true, type: 'array', min: 2, message: '请选择日期范围', trigger: 'change' }],
      },
    }
  },
  computed: {
    isTermPage(): boolean {
      return String(this.$route.meta.pageKey) === 'term'
    },
    isClassPage(): boolean {
      return String(this.$route.meta.pageKey) === 'class'
    },
    isStudentPage(): boolean {
      return String(this.$route.meta.pageKey) === 'student'
    },
    transferCurrentClass(): string {
      if (this.transferRowIndex < 0) return ''
      const classIndex = this.getColumnIndex('班级')
      if (classIndex < 0) return ''
      const row = this.tableRows[this.transferRowIndex]
      return row ? row[classIndex] || '' : ''
    },
    isResourceRoomPage(): boolean {
      return String(this.$route.meta.pageKey) === 'resourceRooms'
    },
    isTermPlanPage(): boolean {
      return String(this.$route.meta.pageKey) === 'iepManage'
    },
    isFamilyTaskPage(): boolean {
      return String(this.$route.meta.pageKey) === 'familyTasks'
    },
    isFamilyNoticePage(): boolean {
      return String(this.$route.meta.pageKey) === 'familyNotices'
    },
    isDeliveryPage(): boolean {
      return String(this.$route.meta.pageKey) === 'delivery'
    },
    isAssessmentListPage(): boolean {
      return String(this.$route.meta.pageKey) === 'assessmentList'
    },
    isAssessmentResultPage(): boolean {
      return String(this.$route.meta.pageKey) === 'assessmentResult'
    },
    currentUserName(): string {
      return String(this.$store.state.currentUser?.name || '当前登录账户')
    },
    selectedStudentName(): string {
      return this.getRowValue(this.selectedAssessmentRow, '学生')
    },
    selectedScaleName(): string {
      return this.getRowValue(this.selectedAssessmentRow, '评估量表') || this.getRowValue(this.selectedAssessmentRow, '量表')
    },
    selectedNoticeTitle(): string {
      return this.getRowValue(this.selectedNoticeRow, '通知标题') || '通知'
    },
    selectedDeliveryStudentName(): string {
      return this.getRowValue(this.selectedTeachingRecordRow, '学生姓名') || '学生'
    },
    assessmentAnswerScaleName(): string {
      return this.getRowValue(this.assessmentAnswerRow, '评估量表')
    },
    assessmentAnswerStudentName(): string {
      return this.getRowValue(this.assessmentAnswerRow, '学生')
    },
    assessmentAnswerReadonly(): boolean {
      return this.assessmentAnswerMode === 'record'
    },
    assessmentAnswerDialogTitle(): string {
      const suffix = this.assessmentAnswerReadonly ? '答题记录' : '学生答题界面'
      return `${this.assessmentAnswerScaleName || '评估'} - ${suffix}`
    },
    assessmentAnswerHeroText(): string {
      const student = this.assessmentAnswerStudentName || '学生'
      if (this.assessmentAnswerReadonly) return `${student}的作答记录，可查看每题选择和参考答案。`
      return `${student}正在作答，暂存后可继续评估，提交后生成得分。`
    },
    assessmentQuestionCount(): number {
      return this.assessmentAnswerQuestions.length
    },
    assessmentAnsweredCount(): number {
      return this.assessmentAnswerQuestions.filter((item: SubjectScaleQuestion) => String(this.assessmentAnswerValues[item.id] || '').trim()).length
    },
    selectedTeachingRecordRows(): string[][] {
      const raw = this.getRowValue(this.selectedTeachingRecordRow, '教学记录详情')
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          return parsed.map((item) => [
            item.教学内容 || [item.日期, item.教学形式].filter(Boolean).join(' ') || '-',
            item.完成效果 || item.完成情况 || '-',
          ])
        }
      } catch (error) {
        return raw ? [[raw, '-']] : []
      }
      return []
    },
    noticeReadPeople(): string[] {
      return this.buildNoticePeopleList('read')
    },
    noticeUnreadPeople(): string[] {
      return this.buildNoticePeopleList('unread')
    },
    selectedAssessmentHistory(): AssessmentHistoryRecord[] {
      return this.resolveAssessmentHistory(this.selectedAssessmentRow)
    },
    recentAssessmentHistory(): AssessmentHistoryRecord[] {
      return this.selectedAssessmentHistory.slice(-5)
    },
    historyScoreRows(): string[][] {
      return this.selectedAssessmentHistory.map((item: AssessmentHistoryRecord) => [
        item.date,
        String(item.total),
        this.formatDimensionSummary(item),
      ])
    },
    selectedAssessmentDiffs(): AssessmentDiff[] {
      return this.getAssessmentDiffsFromHistory(this.selectedAssessmentHistory)
    },
    gainDiffs(): AssessmentDiff[] {
      return this.selectedAssessmentDiffs
        .filter((item: AssessmentDiff) => item.delta > 0)
        .sort((a: AssessmentDiff, b: AssessmentDiff) => b.delta - a.delta)
    },
    riskDiffs(): AssessmentDiff[] {
      return this.selectedAssessmentDiffs
        .filter((item: AssessmentDiff) => item.delta < 0)
        .sort((a: AssessmentDiff, b: AssessmentDiff) => a.delta - b.delta)
    },
    analysisChartOptions(): Record<string, any> {
      const history = this.recentAssessmentHistory
      const dates = history.map((item: AssessmentHistoryRecord) => item.date)
      const scores = history.map((item: AssessmentHistoryRecord) => item.total)
      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' },
        },
        legend: { top: 8, data: ['评估得分', '趋势变化'] },
        grid: { left: 46, right: 24, top: 58, bottom: 44 },
        xAxis: {
          type: 'category',
          data: dates,
          axisLabel: { interval: 0, color: '#6e7466' },
        },
        yAxis: {
          type: 'value',
          min: Math.max(0, Math.min(...scores, 0) - 10),
          max: Math.max(100, Math.max(...scores, 0) + 10),
          axisLabel: { color: '#6e7466' },
          splitLine: { lineStyle: { color: 'rgba(125,140,105,0.16)' } },
        },
        series: [
          {
            name: '评估得分',
            type: 'bar',
            barWidth: 28,
            data: scores.map((score: number, index: number) => ({
              value: score,
              itemStyle: {
                color: index === scores.length - 1 ? '#2f7d4f' : '#c8b99b',
                borderRadius: [8, 8, 0, 0],
              },
            })),
          },
          {
            name: '趋势变化',
            type: 'line',
            smooth: true,
            symbolSize: 9,
            data: scores,
            lineStyle: { color: '#6d5bd0', width: 3 },
            itemStyle: { color: '#6d5bd0' },
          },
        ],
      }
    },
    showSwitchRow(): boolean {
      return Boolean(this.page.tabs || this.isClassPage || this.isStudentPage || this.isResourceRoomPage || this.isTermPlanPage || this.isFamilyTaskPage || this.isFamilyNoticePage || this.isDeliveryPage)
    },
    switchTabs(): string[] {
      return this.page.tabs || []
    },
    visibleTopActions(): string[] {
      const actions = this.page.actions || []
      if (this.isClassPage) return actions.filter((action: string) => !['添加班级'].includes(action))
      if (this.isResourceRoomPage) return actions.filter((action: string) => action !== '添加资源教室')
      if (this.isTermPlanPage) return actions.filter((action: string) => action !== '添加计划')
      if (this.isFamilyTaskPage) return actions.filter((action: string) => action !== '添加任务')
      if (this.isFamilyNoticePage) return actions.filter((action: string) => action !== '添加通知')
      if (this.isDeliveryPage) return actions.filter((action: string) => action !== '创建')
      if (!this.isStudentPage) return actions
      return actions.filter((action: string) => !['添加学生', '批量导入'].includes(action))
    },
    assessmentClassTabs(): string[] {
      if (!(this.isAssessmentListPage || this.isAssessmentResultPage)) return []
      const classes = (this.studentProfiles as Array<Record<string, string>>)
        .map((item) => String(item.className || '').trim())
        .filter(Boolean)
      return ['全部', ...Array.from(new Set(classes))]
    },
    hasFilters(): boolean {
      return Boolean((this.page.filters || []).length)
    },
    selectFilters(): string[] {
      return (this.page.filters || []).filter((item: string) => !this.isTextFilter(item))
    },
    textFilters(): string[] {
      return (this.page.filters || []).filter((item: string) => this.isTextFilter(item))
    },
    filteredItems(): FilteredItem[] {
      return this.tableRows
        .map((row: string[], index: number) => ({ row, ref: this.rowRefs[index], index }))
        .filter((item: FilteredItem) => this.matchTab(item.row))
        .filter((item: FilteredItem) => this.matchAssessmentClassTab(item.row))
        .filter((item: FilteredItem) => this.matchFilters(item.row))
    },
    displayRows(): string[][] {
      return this.filteredItems.map((item: FilteredItem) => this.formatDisplayRow(item.row))
    },
    pageStats(): Array<{ label: string; value: string }> {
      if (!this.page.statsFromRows) return this.page.stats || []
      const statusIndex = this.getColumnIndex('执行状态')
      const total = this.tableRows.length
      const completed = statusIndex >= 0 ? this.tableRows.filter((row) => row[statusIndex] === '已完成').length : 0
      const unfinished = Math.max(total - completed, 0)
      const rate = total ? `${Math.round((completed / total) * 100)}%` : '0%'
      return [
        { label: '任务总数', value: String(total) },
        { label: '已完成', value: String(completed) },
        { label: '未完成', value: String(unfinished) },
        { label: '完成率', value: rate },
      ]
    },
  },
  created() { this.loadPage() },
  watch: { '$route.meta.pageKey': 'loadPage' },
  methods: {
    loadPage() {
      getTablePage(String(this.$route.meta.pageKey)).then((page) => {
        this.page = page || {}
        this.tableRows = this.normalizeLoadedRows(cloneRows(page?.rows || []))
        this.rowRefs = this.normalizeLoadedRowRefs(page?.rowRefs || [], this.tableRows.length, String(this.$route.meta.pageKey))
        this.sortableItems = [...(page?.sortableItems || [])]
        this.activeTab = page?.tabs?.[0] || ''
        this.activeAssessmentClass = '全部'
        this.assessmentHistoryMap = { ...(page?.assessmentHistories || {}) }
        this.resetFilters()
        if (this.isAssessmentResultPage) void this.loadAssessmentResultRows()
        if (String(this.$route.meta.pageKey) === 'student' && this.$route.query.className) {
          this.$set(this.filterValues, '班级', String(this.$route.query.className))
        }
      })
      this.loadTeacherOptions()
      this.loadClassOptions()
      this.loadStudentOptions()
    },
    async loadTeacherOptions() {
      if (!(this.isClassPage || this.isDeliveryPage || this.isAssessmentListPage)) return
      const accounts = await listAccounts()
      this.teacherOptions = accounts.map((item) => item.name).filter(Boolean)
    },
    async loadClassOptions() {
      if (!(this.isClassPage || this.isStudentPage || this.isDeliveryPage)) return
      const page = await getTablePage('class')
      const columns = page?.columns || []
      const classNameIndex = columns.findIndex((column: string) => column === '班级名称')
      const classYearIndex = columns.findIndex((column: string) => column === '开设学年')
      const nextClassYearMap: Record<string, string> = {}
      this.classOptions = (page?.rows || [])
        .map((row: string[]) => {
          const className = row[classNameIndex] || row[1] || ''
          const classYear = classYearIndex >= 0 ? row[classYearIndex] || '' : ''
          if (className) nextClassYearMap[className] = classYear
          return className
        })
        .filter(Boolean)
      this.classYearMap = nextClassYearMap
    },
    async loadStudentOptions() {
      if (!(this.isTermPlanPage || this.isFamilyTaskPage || this.isDeliveryPage || this.isAssessmentListPage || this.isAssessmentResultPage)) return
      const page = await getTablePage('student')
      const columns = page?.columns || []
      const rows = this.normalizeStudentRowsForColumns(page?.rows || [], columns)
      const nameIndex = columns.findIndex((column: string) => column === '姓名')
      const studentNoIndex = columns.findIndex((column: string) => column === '学号')
      const genderIndex = columns.findIndex((column: string) => column === '性别')
      const classIndex = columns.findIndex((column: string) => column === '班级')
      const disabilityIndex = columns.findIndex((column: string) => column === '障碍类型')
      this.studentProfiles = rows
        .map((row: string[]) => ({
          name: row[nameIndex] || '',
          studentNo: row[studentNoIndex] || '',
          gender: row[genderIndex] || '',
          className: row[classIndex] || '',
          disability: row[disabilityIndex] || '',
        }))
        .filter((item: Record<string, string>) => item.name || item.studentNo)
      this.studentOptions = rows
        .map((row: string[]) => row[nameIndex])
        .filter(Boolean)
      this.studentNoOptions = rows
        .map((row: string[]) => row[studentNoIndex])
        .filter(Boolean)
    },
    async loadAssessmentResultRows() {
      const assessmentPage = await getTablePage('assessmentList')
      const sourceRows = this.supplementAssessmentHistoryRows(
        cloneRows(assessmentPage?.rows || []).map((row: string[], index: number) => this.normalizeAssessmentListRow(row, index)),
      )
      const supplementalHistories = this.getAssessmentSupplementHistories()
      const nextHistories: Record<string, AssessmentHistoryRecord[]> = {}
      const groups: Record<string, { studentNo: string; student: string; type: string; scale: string; histories: AssessmentHistoryRecord[] }> = {}

      sourceRows.forEach((row: string[]) => {
        const [, studentNo, student, , , type, scale, scoreOrProgress, assessmentTime, , status] = row
        if (status !== '已完成') return
        const score = this.parseAssessmentScore(scoreOrProgress)
        if (score === null) return
        const key = `${student || studentNo}|${scale || type}`
        if (!groups[key]) groups[key] = { studentNo, student, type, scale, histories: [] }
        groups[key].histories.push({
          date: String(assessmentTime || '').slice(0, 10) || this.formatLocalDate(),
          total: score,
          dimensions: this.buildSyntheticAssessmentDimensions(type, scale, score),
        })
      })

      Object.values(groups).forEach((group) => {
        const exactKey = `${group.student}|${group.scale}`
        group.histories = this.enrichAssessmentHistories(group.histories, supplementalHistories[exactKey] || [])
        nextHistories[exactKey] = group.histories
      })

      const rowsWithoutSequence = Object.values(groups)
        .map((group) => {
          const history = group.histories
          const latest = history[history.length - 1]
          const diffs = this.getAssessmentDiffsFromHistory(history)
          const gains = diffs.filter((item: AssessmentDiff) => item.delta > 0).sort((a: AssessmentDiff, b: AssessmentDiff) => b.delta - a.delta)
          const risks = diffs.filter((item: AssessmentDiff) => item.delta < 0).sort((a: AssessmentDiff, b: AssessmentDiff) => a.delta - b.delta)
          return [
            group.studentNo,
            group.student,
            group.type,
            group.scale,
            latest ? String(latest.total) : '',
            `${history.length}次`,
            this.formatAssessmentDiffSummary(gains, '无'),
            this.formatAssessmentDiffSummary(risks, '无'),
            '查看分析图表',
          ]
        })
        .sort((a, b) => String(a[1]).localeCompare(String(b[1]), 'zh-Hans-CN') || String(a[3]).localeCompare(String(b[3]), 'zh-Hans-CN'))
      const rows = rowsWithoutSequence.map((row, index) => [String(index + 1), ...row])

      this.assessmentHistoryMap = nextHistories
      this.$set(this.page, 'assessmentHistories', nextHistories)
      this.$set(this.page, 'filterOptions', {
        ...(this.page.filterOptions || {}),
        评估量表: Array.from(new Set(rows.map((row) => row[4]).filter(Boolean))),
      })
      this.$set(this.page, 'stats', [
        { label: '分析对象', value: String(rows.length) },
        { label: '历史记录', value: String(Object.values(groups).reduce((total, item) => total + item.histories.length, 0)) },
        { label: '提升维度', value: String(rows.filter((row) => row[7] !== '无').length) },
        { label: '待提高维度', value: String(rows.filter((row) => row[8] !== '无').length) },
      ])
      this.tableRows = rows
      this.rowRefs = rows.map((_, index) => ({ plainId: `assessment-result-${index + 1}` }))
    },
    handleSortEnd(payload: { oldIndex: number; newIndex: number }) {
      const { oldIndex, newIndex } = payload
      const target = this.filteredItems[oldIndex]
      const originalOld = target?.index ?? oldIndex
      const row = this.tableRows.splice(originalOld, 1)[0]
      const ref = this.rowRefs.splice(originalOld, 1)[0]
      const insertAt = newIndex > oldIndex ? newIndex : newIndex
      this.tableRows.splice(insertAt, 0, row)
      this.rowRefs.splice(insertAt, 0, ref)
      const moved = this.sortableItems.splice(oldIndex, 1)[0]
      this.sortableItems.splice(newIndex, 0, moved)
      saveSortableItems(String(this.$route.meta.pageKey), this.sortableItems)
      this.$message.success('展示顺序已更新。')
    },
    handleTableAction(payload: { action: string; row: Record<string, string>; rowIndex: number }) {
      const target = this.filteredItems[payload.rowIndex]
      const originalIndex = target?.index ?? payload.rowIndex

      if (this.isTermPage) {
        this.handleTermAction({ ...payload, rowIndex: originalIndex })
        return
      }

      if (payload.action === '学生管理') {
        const className = payload.row.col1 || ''
        this.$router.push({ path: '/base/student', query: { className } })
        this.$message.success(`已进入学生管理，并按 ${className} 过滤。`)
        return
      }

      if (payload.action === '学生主页') {
        this.openStudentProfile(payload.row)
        return
      }

      if (payload.action === '教学记录详情') {
        this.selectedTeachingRecordRow = { ...payload.row }
        this.teachingRecordsVisible = true
        return
      }

      if (payload.action === '转班') {
        this.openTransferClassDialog(payload.row, originalIndex)
        return
      }

      if (payload.action === '巡查日志') {
        const roomNo = payload.row[`col${this.getColumnIndex('教室序号')}`] || ''
        this.$router.push({ path: '/dashboard/inspection', query: { roomNo } })
        this.$message.success(roomNo ? `已进入巡检日志，并按 ${roomNo} 精准筛查。` : '已进入巡检日志。')
        return
      }

      if (this.isFamilyTaskPage && payload.action === '提醒家长') {
        this.remindFamilyTaskParent(originalIndex)
        return
      }

      if (this.isFamilyNoticePage && payload.action === '查看统计') {
        this.openNoticeStatsDialog(payload.row)
        return
      }

      if (this.isFamilyNoticePage && payload.action === '再次提醒') {
        this.$message.success('已向未读家长再次提醒。')
        return
      }

      if (this.isAssessmentResultPage && payload.action === '历史得分') {
        this.openHistoryDialog(payload.row)
        return
      }

      if (this.isAssessmentResultPage && payload.action === '查看分析图表') {
        this.openAnalysisDialog(payload.row)
        return
      }

      if (this.isAssessmentListPage && ['开始评估', '继续评估', '查看记录'].includes(payload.action)) {
        this.openAssessmentFromList(payload.row, originalIndex, payload.action)
        return
      }

      if (this.isAssessmentListPage && payload.action === '家长推送') {
        this.$message.success('推送成功')
        return
      }

      if (payload.action === '保存高清图片') {
        this.exportAssessmentImage(payload.row)
        return
      }

      if (payload.action === '推送家长') {
        this.quickUpdateRow(payload.action, originalIndex, payload.row)
        return
      }

      if (payload.action === '归档') {
        this.archiveRow(originalIndex, payload.row)
        return
      }

      if (payload.action === '删除') {
        this.confirmDeleteRow(originalIndex)
        return
      }

      this.currentAction = payload.action
      this.currentRow = { ...payload.row }
      this.editingRowIndex = originalIndex
      this.dialogVisible = true
    },
    openTopAction(action: string) {
      if (this.isTermPage && action === '添加学期') {
        this.openTermDialog()
        return
      }
      if (action === '保存高清图片') {
        this.exportAssessmentImage()
        return
      }
      if (action === '推送家长') {
        this.bulkPushParents()
        return
      }
      this.currentAction = action
      this.editingRowIndex = -1
      this.currentRow = this.createTopActionRow(action)
      this.dialogVisible = true
    },
    createTopActionRow(action: string): Record<string, string> {
      const row = buildEmptyRow(this.page.columns || [])
      const columns = this.page.columns || []
      const actionIndex = columns.findIndex((column: string) => column === '操作')
      if (actionIndex >= 0) row[`col${actionIndex}`] = getDefaultActionText(action)
      const statusIndex = this.getColumnIndex('状态')
      if (statusIndex >= 0) row[`col${statusIndex}`] = String(this.$route.meta.pageKey) === 'student' ? '在读' : '在用'
      const yearIndex = this.getColumnIndex('学年')
      if (yearIndex >= 0) row[`col${yearIndex}`] = String(new Date().getFullYear())
      const termIndex = this.getColumnIndex('开设学年')
      if (termIndex >= 0) row[`col${termIndex}`] = String(new Date().getFullYear())
      const classTypeIndex = this.getColumnIndex('班级类型')
      if (classTypeIndex >= 0) row[`col${classTypeIndex}`] = '在校班'
      const creatorIndex = this.getColumnIndex('创建教师')
      if (creatorIndex >= 0) row[`col${creatorIndex}`] = this.currentUserName
      return applyActionToValues(action, row, columns)
    },
    openAssessmentScaleManager(path: string) {
      this.$router.push(String(path || '/assessment/sihai'))
    },
    async openAssessmentFromList(row: Record<string, string>, rowIndex: number, action: string) {
      const scale = this.getRowValue(row, '评估量表')
      const records = await listScaleBankRecords()
      const matched = records.find((item) => item.scaleName === scale)
      this.assessmentAnswerRowIndex = rowIndex
      this.assessmentAnswerRow = { ...row }
      this.assessmentAnswerMode = action === '查看记录' ? 'record' : 'answer'
      this.assessmentAnswerQuestions = matched?.questions || []
      const savedAnswers = await getAppState<Record<string, string>>(this.getAssessmentAnswerStorageKey(rowIndex, row), {})
      const answers: Record<string, string> = {}
      const hasSavedAnswers = Object.values(savedAnswers).some((value) => String(value || '').trim())
      const seedCount = hasSavedAnswers ? 0 : this.parseAssessmentProgressCount(this.getRowValue(row, '得分/进度'))
      this.assessmentAnswerQuestions.forEach((item: SubjectScaleQuestion) => {
        const index = this.assessmentAnswerQuestions.findIndex((question) => question.id === item.id)
        answers[item.id] = savedAnswers[item.id] || this.resolveFallbackAnswerValue(item, index, seedCount)
      })
      this.assessmentAnswerValues = answers
      this.assessmentAnswerVisible = true
      if (!this.assessmentAnswerQuestions.length) this.$message.warning(`${scale || '当前量表'}暂无题目。`)
    },
    getAssessmentAnswerStorageKey(rowIndex = this.assessmentAnswerRowIndex, row = this.assessmentAnswerRow): string {
      const ref = rowIndex >= 0 ? this.rowRefs[rowIndex] : undefined
      const studentNo = this.getRowValue(row, '学号') || `row-${rowIndex}`
      const scale = this.getRowValue(row, '评估量表') || '评估量表'
      return `assessment-answer:${ref?.plainId || `${studentNo}-${scale}`}`
    },
    resolveFallbackAnswerValue(question: SubjectScaleQuestion, index: number, progressSeedCount: number): string {
      const options = this.getQuestionOptions(question)
      if (this.assessmentAnswerReadonly) {
        const scoreSeedCount = this.parseAssessmentScoreCount(this.getRowValue(this.assessmentAnswerRow, '得分/进度'))
        if (index < scoreSeedCount) return this.resolveQuestionCorrectOptionValue(question) || options[0]?.value || ''
      }
      if (index < progressSeedCount) return options[0]?.value || String(question.answer || '')
      return ''
    },
    resolveQuestionCorrectOptionValue(question: SubjectScaleQuestion): string {
      const answer = String(question.answer || '').trim()
      if (this.isLikertScaleQuestion(question)) return this.resolveLikertBestOptionValue(question) || 'E'
      if (!answer) return ''
      const optionValues = this.getQuestionOptions(question).map((item) => item.value)
      if (optionValues.includes(answer)) return answer
      const matched = answer.match(/^([A-E])\s*[=：:]/i)
      if (matched?.[1]) return matched[1].toUpperCase()
      if (['√', '×'].includes(answer)) return answer
      return ''
    },
    async saveAssessmentAnswerDraft() {
      if (!this.assessmentAnswerQuestions.length) {
        this.$message.warning('当前量表暂无题目，无法暂存。')
        return
      }
      await setAppState(this.getAssessmentAnswerStorageKey(), this.assessmentAnswerValues)
      await this.updateAssessmentAnswerRow('进行中', `已完成 ${this.assessmentAnsweredCount}/${this.assessmentQuestionCount} 题`)
      this.assessmentAnswerVisible = false
      this.$message.success('评估已暂存，进度已更新。')
    },
    async submitAssessmentAnswer() {
      if (!this.assessmentAnswerQuestions.length) {
        this.$message.warning('当前量表暂无题目，无法提交。')
        return
      }
      await setAppState(this.getAssessmentAnswerStorageKey(), this.assessmentAnswerValues)
      await this.updateAssessmentAnswerRow('已完成', String(this.calculateAssessmentAnswerScore()))
      this.assessmentAnswerVisible = false
      this.$message.success('评估已提交，得分已更新。')
    },
    async updateAssessmentAnswerRow(status: string, progressValue: string) {
      if (this.assessmentAnswerRowIndex < 0) return
      const nextRow = [...this.tableRows[this.assessmentAnswerRowIndex]]
      const progressIndex = this.getAssessmentProgressColumnIndex()
      const statusIndex = this.getColumnIndex('评估状态')
      const actionIndex = this.getColumnIndex('操作')
      const timeIndex = this.getColumnIndex('评估时间')
      if (progressIndex >= 0) nextRow[progressIndex] = progressValue
      if (statusIndex >= 0) nextRow[statusIndex] = status
      if (actionIndex >= 0) nextRow[actionIndex] = this.resolveAssessmentListActions(status)
      if (timeIndex >= 0 && status === '已完成') nextRow[timeIndex] = this.formatLocalDate()
      const currentRef = this.rowRefs[this.assessmentAnswerRowIndex]
      const plainId = await upsertModuleRow(String(this.$route.meta.pageKey), nextRow, currentRef?.plainId)
      this.$set(this.tableRows, this.assessmentAnswerRowIndex, nextRow)
      this.$set(this.rowRefs, this.assessmentAnswerRowIndex, { plainId })
      this.assessmentAnswerRow = this.rowToRecord(nextRow)
    },
    rowToRecord(row: string[]): Record<string, string> {
      const record: Record<string, string> = {}
      ;(this.page.columns || []).forEach((_: string, index: number) => {
        record[`col${index}`] = row[index] || ''
      })
      return record
    },
    calculateAssessmentAnswerScore(): number {
      return this.assessmentAnswerQuestions.reduce((total: number, question: SubjectScaleQuestion) => {
        const value = String(this.assessmentAnswerValues[question.id] || '').trim()
        if (!value) return total
        const likertScore = this.calculateLikertQuestionScore(question, value)
        if (likertScore !== null) return total + likertScore
        const score = Number(question.score || 0)
        const answer = String(question.answer || '').trim()
        if (!answer) return total + score
        return this.normalizeAnswerValue(value) === this.normalizeAnswerValue(answer) ? total + score : total
      }, 0)
    },
    isLikertScaleQuestion(question: SubjectScaleQuestion): boolean {
      const answer = String(question.answer || '')
      return question.type === '量表题' || answer.includes('正向计分') || answer.includes('反向计分') || Object.keys(this.parseLikertScoreMap(answer)).length > 0
    },
    calculateLikertQuestionScore(question: SubjectScaleQuestion, value: string): number | null {
      if (!this.isLikertScaleQuestion(question)) return null
      const scoreMap = this.parseLikertScoreMap(question.answer)
      const selected = this.normalizeAnswerValue(value)
      if (scoreMap[selected] !== undefined) return scoreMap[selected]

      const optionScores: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5 }
      const rawScore = optionScores[selected]
      if (!rawScore) return 0
      const maxScore = Number(question.score || 5) || 5
      const scored = String(question.answer || '').includes('反向') ? 6 - rawScore : rawScore
      return Math.round((scored / 5) * maxScore)
    },
    parseLikertScoreMap(answer: string): Record<string, number> {
      const map: Record<string, number> = {}
      const regex = /([A-E])\s*[=＝:：]\s*(\d+(?:\.\d+)?)\s*分?/gi
      let matched = regex.exec(String(answer || ''))
      while (matched) {
        map[matched[1].toUpperCase()] = Number(matched[2])
        matched = regex.exec(String(answer || ''))
      }
      return map
    },
    resolveLikertBestOptionValue(question: SubjectScaleQuestion): string {
      const scoreMap = this.parseLikertScoreMap(question.answer)
      const entries = Object.entries(scoreMap) as Array<[string, number]>
      if (entries.length) {
        return entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]
      }
      const answer = String(question.answer || '')
      return answer.includes('反向') ? 'A' : 'E'
    },
    normalizeAnswerValue(value: string): string {
      return String(value || '').replace(/\s/g, '').toUpperCase()
    },
    parseAssessmentProgressCount(value: string): number {
      const matched = String(value || '').match(/(\d+)\s*\/\s*\d+/)
      return matched ? Number(matched[1] || 0) : 0
    },
    parseAssessmentScoreCount(value: string): number {
      const score = Number(String(value || '').match(/(\d+(?:\.\d+)?)/)?.[1] || 0)
      if (!score) return 0
      let total = 0
      for (const question of this.assessmentAnswerQuestions) {
        total += Number(question.score || 0)
        if (total >= score) return this.assessmentAnswerQuestions.indexOf(question) + 1
      }
      return this.assessmentAnswerQuestions.length
    },
    getQuestionStem(title: string): string {
      const lines = String(title || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
      const stemLines = lines.filter((line) => !this.isOptionLine(line))
      return stemLines.join('\n') || '未填写题干'
    },
    getQuestionOptions(question: SubjectScaleQuestion): Array<{ value: string; label: string }> {
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
    formatQuestionAnswerValue(question: SubjectScaleQuestion, value: string, emptyText = '未作答'): string {
      const raw = String(value || '').trim()
      if (!raw) return emptyText
      const option = this.getQuestionOptions(question).find((item) => item.value === raw)
      return option ? option.label : raw
    },
    async saveDialog(payload: { values: Record<string, string> }) {
      const columns = this.page.columns || []
      const preparedValues = this.prepareDialogValues(payload.values, columns)
      const nextValues = applyActionToValues(this.currentAction, preparedValues, columns)
      const nextRow = columnsToRow(columns, nextValues)
      const pageKey = String(this.$route.meta.pageKey)
      const currentRef = this.editingRowIndex >= 0 ? this.rowRefs[this.editingRowIndex] : undefined

      const plainId = await upsertModuleRow(pageKey, nextRow, currentRef?.plainId)
      if (this.editingRowIndex >= 0) {
        this.$set(this.tableRows, this.editingRowIndex, nextRow)
        this.$set(this.rowRefs, this.editingRowIndex, { plainId })
      } else {
        this.tableRows.unshift(nextRow)
        this.rowRefs.unshift({ plainId })
      }

      this.$message.success(`${this.currentAction} 已保存到当前本地数据库。`)
    },
    prepareDialogValues(values: Record<string, string>, columns: string[]): Record<string, string> {
      if (!(this.isClassPage && ['添加班级', '编辑班级信息', '分配教师', '设置班主任'].includes(this.currentAction))) return values
      const next = { ...values }
      const headTeacherIndex = columns.findIndex((column: string) => column === '班主任')
      const teachersIndex = columns.findIndex((column: string) => column === '教师')
      const headTeacher = headTeacherIndex >= 0 ? next[`col${headTeacherIndex}`] : ''
      if (headTeacher && teachersIndex >= 0) {
        const teachers = String(next[`col${teachersIndex}`] || '')
          .split(/[、,，/]/)
          .map((item) => item.trim())
          .filter(Boolean)
        if (!teachers.includes(headTeacher)) teachers.unshift(headTeacher)
        next[`col${teachersIndex}`] = teachers.join('、')
      }
      return next
    },
    async quickUpdateRow(action: string, rowIndex: number, row: Record<string, string>) {
      const columns = this.page.columns || []
      const nextValues = applyActionToValues(action, { ...row }, columns)
      const nextRow = columnsToRow(columns, nextValues)
      const currentRef = this.rowRefs[rowIndex]
      const plainId = await upsertModuleRow(String(this.$route.meta.pageKey), nextRow, currentRef?.plainId)
      this.$set(this.tableRows, rowIndex, nextRow)
      this.$set(this.rowRefs, rowIndex, { plainId })
      this.$message.success(`${action} 已完成。`)
    },
    async archiveRow(rowIndex: number, row: Record<string, string>) {
      try {
        const columns = this.page.columns || []
        const nextValues = applyActionToValues('归档', { ...row }, columns)
        const nextRow = columnsToRow(columns, nextValues)
        const currentRef = this.rowRefs[rowIndex]
        await upsertModuleRow(String(this.$route.meta.pageKey), nextRow, currentRef?.plainId)
        this.$set(this.tableRows, rowIndex, nextRow)
        const archiveTab = (this.page.tabs || []).find((tab: string) => tab.includes('已归档'))
        if (archiveTab) this.activeTab = archiveTab
        this.$message.success('班级已归档，已切换到已归档班级列表。')
      } catch (error) {
        console.error('归档操作失败:', error)
        this.$message.error('归档操作失败，请重试。')
      }
    },
    async remindFamilyTaskParent(rowIndex: number) {
      const nextRow = [...this.tableRows[rowIndex]]
      const readIndex = this.getColumnIndex('阅读状态')
      if (readIndex >= 0) nextRow[readIndex] = '已提醒'
      const currentRef = this.rowRefs[rowIndex]
      const plainId = await upsertModuleRow(String(this.$route.meta.pageKey), nextRow, currentRef?.plainId)
      this.$set(this.tableRows, rowIndex, nextRow)
      this.$set(this.rowRefs, rowIndex, { plainId })
      this.$message.success('已提醒家长。')
    },
    async confirmDeleteRow(rowIndex: number) {
      try {
        await this.$confirm('删除后数据将被移除，是否继续？', '提示', {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          confirmButtonClass: 'danger-confirm-button',
        })
        const currentRef = this.rowRefs[rowIndex]
        if (currentRef?.plainId) await deleteModuleRow(String(this.$route.meta.pageKey), currentRef.plainId)
        this.tableRows.splice(rowIndex, 1)
        this.rowRefs.splice(rowIndex, 1)
        this.$message.success('已移除。')
      } catch (error) {
        return
      }
    },
    openHistoryDialog(row: Record<string, string>) {
      this.selectedAssessmentRow = { ...row }
      this.historyDialogVisible = true
    },
    openAnalysisDialog(row: Record<string, string>) {
      this.selectedAssessmentRow = { ...row }
      this.analysisDialogVisible = true
    },
    openNoticeStatsDialog(row: Record<string, string>) {
      this.selectedNoticeRow = { ...row }
      this.noticeStatsDialogVisible = true
    },
    openTransferClassDialog(row: Record<string, string>, rowIndex: number) {
      this.transferRowIndex = rowIndex
      this.transferTargetClass = this.getRowValue(row, '班级')
      this.transferClassVisible = true
    },
    async saveTransferClass() {
      if (!this.transferTargetClass) {
        this.$message.warning('请选择目标班级。')
        return
      }
      const classIndex = this.getColumnIndex('班级')
      if (classIndex >= 0 && this.transferRowIndex >= 0) {
        const row = this.tableRows[this.transferRowIndex]
        row[classIndex] = this.transferTargetClass
        const yearIndex = this.getColumnIndex('学年')
        if (yearIndex >= 0) row[yearIndex] = this.classYearMap[this.transferTargetClass] || row[yearIndex] || String(new Date().getFullYear())
        this.$set(this.tableRows, this.transferRowIndex, [...row])
      }
      this.transferClassVisible = false
      this.$message.success('转班成功，班级已更新。')
    },
    async openStudentProfile(row: Record<string, string>) {
      const base = this.resolveStudentProfileBase(row)
      const [assessmentPage, iepPage, deliveryPage, familyTaskPage] = await Promise.all([
        getTablePage('assessmentList'),
        getIepPage('iepList'),
        getTablePage('delivery'),
        getTablePage('familyTasks'),
      ])
      const assessments = this.pickStudentRows(assessmentPage?.columns || [], assessmentPage?.rows || [], base)
        .map((item) => [
          this.readRowColumn(assessmentPage.columns || [], item, '评估时间'),
          this.readRowColumn(assessmentPage.columns || [], item, '评估量表') || this.readRowColumn(assessmentPage.columns || [], item, '量表名称') || this.readRowColumn(assessmentPage.columns || [], item, '评估类型'),
          this.readRowColumn(assessmentPage.columns || [], item, '得分/进度') || this.readRowColumn(assessmentPage.columns || [], item, '得分'),
          this.readRowColumn(assessmentPage.columns || [], item, '评估状态'),
        ])
      const plans = this.pickStudentRows(iepPage?.columns || [], iepPage?.rows || [], base)
        .map((item) => [
          this.readRowColumn(iepPage.columns || [], item, '学期'),
          this.readRowColumn(iepPage.columns || [], item, '计划内容'),
          this.readRowColumn(iepPage.columns || [], item, '状态'),
          this.readRowColumn(iepPage.columns || [], item, '关联教案'),
        ])
      const deliveryActivities = this.pickStudentRows(deliveryPage?.columns || [], deliveryPage?.rows || [], base)
        .map((item) => [
          '送教上门',
          this.readRowColumn(deliveryPage.columns || [], item, '送教主题') || '--',
          this.readRowColumn(deliveryPage.columns || [], item, '负责老师') || '--',
          this.formatTeachingRecordLatestDate(this.readRowColumn(deliveryPage.columns || [], item, '教学记录详情')),
        ])
      const familyActivities = this.pickStudentRows(familyTaskPage?.columns || [], familyTaskPage?.rows || [], base)
        .map((item) => [
          '家校任务',
          this.readRowColumn(familyTaskPage.columns || [], item, '任务名称'),
          this.readRowColumn(familyTaskPage.columns || [], item, '执行状态'),
          this.readRowColumn(familyTaskPage.columns || [], item, '提交时间'),
        ])
      this.studentProfile = {
        ...base,
        assessments: assessments.length ? assessments : [['-', '暂无评估记录', '-', '-']],
        plans: plans.length ? plans : [['-', '暂无学生计划', '-', '-']],
        activities: [...deliveryActivities, ...familyActivities].length ? [...deliveryActivities, ...familyActivities] : [['-', '暂无送教或家校记录', '-', '-']],
      }
      this.studentProfileVisible = true
    },
    resolveStudentProfileBase(row: Record<string, string>): StudentProfile {
      const name = this.getRowValue(row, '姓名') || this.getRowValue(row, '学生姓名') || this.getRowValue(row, '学生')
      return {
        name,
        studentNo: this.getRowValue(row, '学号'),
        className: this.getRowValue(row, '班级') || this.getRowValue(row, '所属班级'),
        gender: this.getRowValue(row, '性别'),
        disability: this.getRowValue(row, '障碍类型'),
        placement: this.getRowValue(row, '安置形式'),
        status: this.getRowValue(row, '状态'),
        teacher: this.getRowValue(row, '负责老师'),
        deliveryTopic: this.getRowValue(row, '送教主题'),
        assessments: [],
        plans: [],
        activities: [],
      }
    },
    formatTeachingRecordLatestDate(value: string): string {
      const raw = String(value || '')
      if (!raw) return ''
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          const dates = parsed.map((item) => String(item.日期 || '')).filter(Boolean).sort()
          return dates[dates.length - 1] || ''
        }
      } catch (error) {
        return raw
      }
      return raw
    },
    pickStudentRows(columns: string[], rows: string[][], base: StudentProfile): string[][] {
      return rows.filter((row) => {
        const studentNo = this.readRowColumn(columns, row, '学号')
        const name = this.readRowColumn(columns, row, '学生') || this.readRowColumn(columns, row, '学生姓名') || this.readRowColumn(columns, row, '学生名称') || this.readRowColumn(columns, row, '姓名')
        const noMatched = Boolean(base.studentNo && studentNo && base.studentNo === studentNo)
        const nameMatched = Boolean(base.name && name && base.name === name)
        return noMatched || nameMatched
      })
    },
    readRowColumn(columns: string[], row: string[], column: string): string {
      const index = columns.findIndex((item) => item === column)
      return index >= 0 ? row[index] || '' : ''
    },
    getRowValue(row: Record<string, string>, column: string): string {
      const index = this.getColumnIndex(column)
      return index >= 0 ? row?.[`col${index}`] || '' : ''
    },
    getAssessmentHistoryKey(row: Record<string, string>): string {
      return `${this.getRowValue(row, '学生')}|${this.getRowValue(row, '评估量表') || this.getRowValue(row, '量表')}`
    },
    resolveAssessmentHistory(row: Record<string, string>): AssessmentHistoryRecord[] {
      const key = this.getAssessmentHistoryKey(row)
      const student = this.getRowValue(row, '学生')
      const type = this.getRowValue(row, '评估类型')
      const histories = this.assessmentHistoryMap || this.page.assessmentHistories || {}
      const matched = histories[key] || histories[`${student}|${type}`] || []
      return [...matched].sort((a: AssessmentHistoryRecord, b: AssessmentHistoryRecord) => a.date.localeCompare(b.date))
    },
    formatDimensionSummary(record: AssessmentHistoryRecord): string {
      return Object.entries(record.dimensions || {})
        .map(([name, score]) => `${name} ${score}`)
        .join('、')
    },
    parseAssessmentScore(value: string): number | null {
      const raw = String(value || '')
      if (raw.includes('/') || raw.includes('已完成')) return null
      const matched = raw.match(/\d+(?:\.\d+)?/)
      return matched ? Number(matched[0]) : null
    },
    enrichAssessmentHistories(histories: AssessmentHistoryRecord[], supplemental: AssessmentHistoryRecord[]): AssessmentHistoryRecord[] {
      const supplementalMap = new Map<string, AssessmentHistoryRecord>()
      supplemental.forEach((item) => {
        if (!item?.date) return
        supplementalMap.set(`${item.date}|${Number(item.total || 0)}`, item)
      })

      const next = histories.map((item) => {
        const matched = supplementalMap.get(`${item.date}|${Number(item.total || 0)}`)
        return {
          date: item.date,
          total: Number(item.total || 0),
          dimensions: { ...((matched || item).dimensions || {}) },
        }
      })
      const existingKeys = new Set(next.map((item) => `${item.date}|${item.total}`))

      supplemental.forEach((item) => {
        const key = `${item.date}|${Number(item.total || 0)}`
        if (!item?.date || existingKeys.has(key)) return
        next.push({
          date: item.date,
          total: Number(item.total || 0),
          dimensions: { ...(item.dimensions || {}) },
        })
        existingKeys.add(key)
      })

      return next.sort((a: AssessmentHistoryRecord, b: AssessmentHistoryRecord) => a.date.localeCompare(b.date))
    },
    mergeAssessmentHistories(histories: AssessmentHistoryRecord[]): AssessmentHistoryRecord[] {
      const map = new Map<string, AssessmentHistoryRecord>()
      histories.forEach((item: AssessmentHistoryRecord) => {
        if (!item?.date) return
        map.set(`${item.date}|${item.total}`, {
          date: item.date,
          total: Number(item.total || 0),
          dimensions: { ...(item.dimensions || {}) },
        })
      })
      return Array.from(map.values()).sort((a: AssessmentHistoryRecord, b: AssessmentHistoryRecord) => a.date.localeCompare(b.date))
    },
    buildSyntheticAssessmentDimensions(type: string, scale: string, score: number): Record<string, number> {
      const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))
      const names = this.resolveAssessmentDimensionNames(type, scale)
      return names.reduce((result: Record<string, number>, name: string, index: number) => {
        result[name] = clamp(score - (index % 3) * 3 + (index === 0 ? 2 : 0))
        return result
      }, {})
    },
    resolveAssessmentDimensionNames(type: string, scale: string): string[] {
      if (type === '学科评估') return ['生活语文', '生活数学', '生活英语']
      if (type === '融合学校随班就读评估') return ['学习适应', '课堂参与', '同伴互动', '支持需求']
      if (type === '孤独症行为评估') return ['沟通表达', '社会情绪', '认知学习', '语言行为', '动作发展']
      return [scale || '综合表现', '学习参与', '支持需求']
    },
    formatAssessmentDiffSummary(items: AssessmentDiff[], emptyText = '无'): string {
      return items.length ? items.map((item: AssessmentDiff) => `${item.name} ${this.formatDiff(item.delta)}`).join('、') : emptyText
    },
    getAssessmentDiffsFromHistory(history: AssessmentHistoryRecord[]): AssessmentDiff[] {
      const latest = history[history.length - 1]
      if (!latest) return []
      const previous = history.length >= 2 ? history[history.length - 2] : latest
      const names = Array.from(new Set([...Object.keys(previous.dimensions || {}), ...Object.keys(latest.dimensions || {})]))
      return names.map((name) => {
        const previousScore = Number(previous.dimensions?.[name] || 0)
        const currentScore = Number(latest.dimensions?.[name] || 0)
        const delta = currentScore - previousScore
        return {
          name,
          previous: previousScore,
          current: currentScore,
          delta,
          status: delta > 0 ? 'gain' : delta < 0 ? 'risk' : 'flat',
        }
      })
    },
    formatDiff(delta: number): string {
      if (delta > 0) return `+${delta}`
      return String(delta)
    },
    escapeSvgText(value: string): string {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    },
    bulkPushParents() {
      const pushIndex = this.getColumnIndex('推送状态')
      if (pushIndex < 0) {
        this.$message.info('当前页面没有可批量推送的家长端状态。')
        return
      }
      this.tableRows.forEach((row, index) => {
        const next = [...row]
        next[pushIndex] = '已推送'
        this.$set(this.tableRows, index, next)
        const ref = this.rowRefs[index]
        upsertModuleRow(String(this.$route.meta.pageKey), next, ref?.plainId)
      })
      this.$message.success('评估结果已批量标记为已推送家长。')
    },
    buildAssessmentImageSvg(row?: Record<string, string>): { title: string; svg: string } {
      const targetRow = row && Object.keys(row).length ? row : this.selectedAssessmentRow
      const student = this.getRowValue(targetRow, '学生') || '学生'
      const scale = this.getRowValue(targetRow, '量表') || '评估量表'
      const latestScore = this.getRowValue(targetRow, '最近一次得分') || '-'
      const history = this.resolveAssessmentHistory(targetRow)
      const diffs = this.getAssessmentDiffsFromHistory(history)
      const gains = diffs.filter((item) => item.delta > 0).sort((a, b) => b.delta - a.delta)
      const risks = diffs.filter((item) => item.delta < 0).sort((a, b) => a.delta - b.delta)
      const title = `${student}${scale}分析图表`
      const gainText = gains.length ? gains.map((item) => `${item.name} ${this.formatDiff(item.delta)}`).join('、') : '暂无明显提升'
      const riskText = risks.length ? risks.map((item) => `${item.name} ${this.formatDiff(item.delta)}`).join('、') : '暂无待提高领域'
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#f5f2eb"/><text x="80" y="96" font-size="40" fill="#556445">${this.escapeSvgText(title)}</text><text x="80" y="150" font-size="24" fill="#7f8677">最近一次得分：${this.escapeSvgText(latestScore)}。绿色代表关键提升点，红色代表待提高领域。</text><rect x="80" y="210" width="1120" height="360" rx="28" fill="#ffffff"/><text x="130" y="300" font-size="32" fill="#2f7d4f">关键提升点：${this.escapeSvgText(gainText)}</text><text x="130" y="390" font-size="32" fill="#b94a48">待提高领域：${this.escapeSvgText(riskText)}</text><text x="130" y="480" font-size="26" fill="#556445">依据最近两次评估维度得分自动计算，用于辅助教师对比干预效果。</text><text x="80" y="640" font-size="20" fill="#9aa08f">数据来源于当前本地评估记录。</text></svg>`
      return { title, svg }
    },
    exportAssessmentImage(row?: Record<string, string>, format: 'png' | 'jpg' = 'png') {
      const { title, svg } = this.buildAssessmentImageSvg(row)
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 1280
        canvas.height = 720
        const context = canvas.getContext('2d')
        if (!context) {
          URL.revokeObjectURL(url)
          this.$message.error('当前浏览器不支持图片导出。')
          return
        }
        context.fillStyle = '#f5f2eb'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0)
        const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png'
        canvas.toBlob((result) => {
          URL.revokeObjectURL(url)
          if (!result) {
            this.$message.error('图片生成失败，请稍后再试。')
            return
          }
          const downloadUrl = URL.createObjectURL(result)
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = `${title}.${format}`
          link.click()
          URL.revokeObjectURL(downloadUrl)
          this.$message.success(`高清${format.toUpperCase()}图片已生成并开始下载。`)
        }, mimeType, 0.95)
      }
      image.onerror = () => {
        URL.revokeObjectURL(url)
        this.$message.error('图片生成失败，请稍后再试。')
      }
      image.src = url
    },
    getFilterOptions(filter: string): string[] {
      return this.page.filterOptions?.[filter] || []
    },
    isTextFilter(filter: string): boolean {
      return ['关键词', '学生信息', '姓名', '学号', '学生', '教室序号', '发送范围'].includes(filter)
        || filter.includes('名称')
        || filter.includes('信息')
        || filter.includes('标题')
    },
    normalizeLoadedRowRefs(rowRefs: RowRef[], rowCount: number, pageKey: string): RowRef[] {
      const next = [...rowRefs].slice(0, rowCount)
      while (next.length < rowCount) {
        next.push({ plainId: `${pageKey}-supplement-${next.length + 1}` })
      }
      return next
    },
    normalizeLoadedRows(rows: string[][]): string[][] {
      if (this.isAssessmentListPage) return this.normalizeAssessmentListRows(rows)
      if (this.isStudentPage) return rows.map((row, index) => this.normalizeStudentRow(row, index))
      if (this.isResourceRoomPage) return rows.map((row) => this.normalizeResourceRoomRow(row))
      if (this.isTermPlanPage) return rows.map((row) => this.normalizeCreatorTeacherRow(row))
      if (this.isDeliveryPage) return rows.map((row, index) => this.normalizeDeliveryRow(row, index))
      if (this.isFamilyTaskPage) return rows.map((row, index) => this.normalizeFamilyTaskRow(row, index))
      if (this.isFamilyNoticePage) return rows.map((row) => this.normalizeFamilyNoticeRow(row))
      return rows
    },
    normalizeCreatorTeacherRow(row: string[]): string[] {
      const columns = this.page.columns || []
      const creatorIndex = columns.indexOf('创建教师')
      if (creatorIndex < 0) return row
      const next = [...row]
      if (this.isMaskedAccountName(next[creatorIndex])) next[creatorIndex] = this.currentUserName
      return next
    },
    isMaskedAccountName(value: string): boolean {
      return /^\d{2,4}\*{2,}\d{3,4}$/.test(String(value || '').trim())
    },
    normalizeResourceRoomRow(row: string[]): string[] {
      const columns = this.page.columns || []
      const expectedLength = columns.length
      const capacityIndex = columns.indexOf('容纳人数')
      if (row.length >= expectedLength || capacityIndex < 0) return row

      const next = [...row]
      const missingCount = expectedLength - next.length
      for (let index = 0; index < missingCount; index += 1) {
        next.splice(capacityIndex + 1 + index, 0, '')
      }
      return next
    },
    normalizeStudentRow(row: string[], index: number): string[] {
      const columns = this.page.columns || []
      return this.normalizeStudentRowForColumns(row, index, columns)
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
    normalizeAssessmentListRows(rows: string[][]): string[][] {
      return this.supplementAssessmentHistoryRows(rows.map((row, index) => this.normalizeAssessmentListRow(row, index)))
    },
    supplementAssessmentHistoryRows(rows: string[][]): string[][] {
      const next = rows.map((row) => [...row])
      const existingKeys = new Set<string>()
      next.forEach((row) => {
        const key = this.getAssessmentListHistoryKey(row)
        if (key) existingKeys.add(key)
      })

      const histories = this.getAssessmentSupplementHistories() as Record<string, AssessmentHistoryRecord[]>
      Object.entries(histories).forEach(([key, records]: [string, AssessmentHistoryRecord[]]) => {
        const [student, scale] = key.split('|')
        if (!student || !scale || !records?.length) return
        const type = this.resolveAssessmentType(scale)
        const template = next.find((row) => (row[2] === student || row[1] === student) && (row[6] === scale || row[5] === type))
        const profile = this.resolveAssessmentStudentProfile(template?.[1] || '', student)
        const teacher = template?.[9] || ''

        records.forEach((record) => {
          const date = String(record.date || '').slice(0, 10)
          const score = Number(record.total || 0)
          const historyKey = `${profile.name || student}|${scale}|${date}|${score}`
          if (!date || existingKeys.has(historyKey)) return
          next.push([
            '',
            profile.studentNo || template?.[1] || '',
            profile.name || student,
            profile.gender || template?.[3] || '',
            profile.disability || template?.[4] || '',
            type,
            scale,
            String(score),
            date,
            teacher,
            '已完成',
            this.resolveAssessmentListActions('已完成'),
          ])
          existingKeys.add(historyKey)
        })
      })

      return next.map((row, index) => {
        const normalized = [...row]
        normalized[0] = String(index + 1)
        normalized[11] = this.resolveAssessmentListActions(normalized[10] || '未开始')
        return normalized
      })
    },
    getAssessmentListHistoryKey(row: string[]): string {
      if ((row[10] || '') !== '已完成') return ''
      const score = this.parseAssessmentScore(row[7] || '')
      if (score === null) return ''
      const student = row[2] || row[1] || ''
      const scale = row[6] || row[5] || ''
      const date = String(row[8] || '').slice(0, 10)
      return student && scale && date ? `${student}|${scale}|${date}|${score}` : ''
    },
    getAssessmentSupplementHistories(): Record<string, AssessmentHistoryRecord[]> {
      const source = {
        ...((tablePages.assessmentResult?.assessmentHistories || {}) as Record<string, AssessmentHistoryRecord[]>),
        ...((this.page.assessmentHistories || {}) as Record<string, AssessmentHistoryRecord[]>),
      }
      const keys = Object.keys(source)
      const result: Record<string, AssessmentHistoryRecord[]> = {}

      keys.forEach((key) => {
        const [student, rawScale] = key.split('|')
        if (!student || !rawScale) return
        const isBroadType = this.isBroadAssessmentType(rawScale)
        const hasExactScale = keys.some((candidateKey) => {
          const [candidateStudent, candidateScale] = candidateKey.split('|')
          return candidateStudent === student && !this.isBroadAssessmentType(candidateScale) && this.resolveAssessmentType(candidateScale) === rawScale
        })
        if (isBroadType && hasExactScale) return

        const scale = isBroadType ? this.resolveDefaultAssessmentScale(rawScale) : rawScale
        const normalizedKey = `${student}|${scale}`
        result[normalizedKey] = this.mergeAssessmentHistories([
          ...(result[normalizedKey] || []),
          ...(source[key] || []),
        ])
      })

      return result
    },
    normalizeAssessmentListRow(row: string[], index: number): string[] {
      const assessmentTypes = ['学科评估', '孤独症行为评估', '融合学校随班就读评估', '自有量表评估']
      if (assessmentTypes.includes(row[5] || '')) return [
        row[0] || String(index + 1),
        row[1] || '',
        row[2] || '',
        row[3] || '',
        row[4] || '',
        row[5] || '',
        row[6] || '',
        row[7] || '',
        row[8] || '',
        row[9] || '',
        row[10] || '未开始',
        row[11] || this.resolveAssessmentListActions(row[10] || '未开始'),
      ]

      if (assessmentTypes.includes(row[6] || '')) return [
        row[0] || String(index + 1),
        row[1] || '',
        row[2] || '',
        row[3] || '',
        row[5] || '',
        row[6] || '',
        row[7] || '',
        row[8] || '',
        row[9] || '',
        row[10] || '',
        row[11] || '未开始',
        row[12] || this.resolveAssessmentListActions(row[11] || '未开始'),
      ]

      const sequence = row[0] || String(index + 1)
      const oldStudent = row[1] || ''
      const oldStudentNo = row[2] || ''
      const oldScaleName = row[4] || ''
      const profile = this.resolveAssessmentStudentFallback(oldStudentNo, oldStudent)
      const assessmentType = this.resolveAssessmentType(oldScaleName)
      const assessmentScale = this.resolveDefaultAssessmentScale(assessmentType)
      const scoreOrProgress = row[5] || ''
      const assessmentTime = row[6] || ''
      const teacher = row[7] || ''
      const status = row[8] || '未开始'
      const actions = this.resolveAssessmentListActions(status)
      return [
        sequence,
        oldStudentNo || profile.studentNo,
        oldStudent || profile.name,
        profile.gender,
        profile.disability,
        assessmentType,
        assessmentScale,
        scoreOrProgress,
        assessmentTime,
        teacher,
        status,
        actions,
      ]
    },
    formatDisplayRow(row: string[]): string[] {
      if (!this.isAssessmentListPage) return row
      const next = [...row]
      const statusIndex = this.getColumnIndex('评估状态')
      const progressIndex = this.getAssessmentProgressColumnIndex()
      const actionIndex = this.getColumnIndex('操作')
      if (progressIndex >= 0) next[progressIndex] = this.resolveAssessmentProgressDisplay(next)
      if (statusIndex >= 0 && actionIndex >= 0) next[actionIndex] = this.resolveAssessmentListActions(next[statusIndex])
      return next
    },
    getAssessmentProgressColumnIndex(): number {
      const columns = this.page.columns || []
      return columns.findIndex((column: string) => ['得分/进度', '得分', '完成进度/得分'].includes(column))
    },
    resolveAssessmentProgressDisplay(row: string[]): string {
      const statusIndex = this.getColumnIndex('评估状态')
      const progressIndex = this.getAssessmentProgressColumnIndex()
      const status = statusIndex >= 0 ? row[statusIndex] || '' : ''
      const raw = progressIndex >= 0 ? String(row[progressIndex] || '').trim() : ''
      if (status === '未开始') return ' '
      if (status === '进行中') return this.resolveAssessmentProgressText(row)
      if (status === '已完成') {
        if (!raw) return '-'
        return raw.includes('分') ? raw : `${raw} 分`
      }
      return raw
    },
    resolveAssessmentProgressText(row: string[]): string {
      const progressIndex = this.getAssessmentProgressColumnIndex()
      const raw = progressIndex >= 0 ? String(row[progressIndex] || '').trim() : ''
      if (raw && (raw.includes('已完成') || raw.includes('/'))) return raw
      const scaleIndex = this.getColumnIndex('评估量表')
      const scale = scaleIndex >= 0 ? row[scaleIndex] || '' : ''
      const map: Record<string, string> = {
        生活语文: '已完成 12/20 题',
        生活数学: '已完成 10/20 题',
        生活英语: '已完成 8/20 题',
        沟通表达: '已完成 15/24 题',
        社会情绪: '已完成 14/24 题',
        认知学习: '已完成 16/24 题',
        语言行为: '已完成 12/24 题',
        动作发展: '已完成 13/24 题',
        学习适应: '已完成 9/18 题',
        课堂参与: '已完成 12/20 题',
        同伴互动: '已完成 10/18 题',
        支持需求: '已完成 11/18 题',
      }
      return map[scale] || '已完成 12/20 题'
    },
    resolveAssessmentListActions(status: string): string {
      const editableActions = '编辑 / 删除'
      if (status === '未开始') return `开始评估 / ${editableActions}`
      if (status === '进行中') return `继续评估 / ${editableActions}`
      if (status === '已完成') return `家长推送 / 查看记录 / ${editableActions}`
      return editableActions
    },
    isBroadAssessmentType(value: string): boolean {
      return ['学科评估', '孤独症行为评估', '融合学校随班就读评估', '自有量表评估'].includes(value)
    },
    resolveAssessmentType(value: string): string {
      if (['学科评估', '孤独症行为评估', '融合学校随班就读评估', '自有量表评估'].includes(value)) return value
      if (['生活语文', '生活数学', '生活英语'].includes(value)) return '学科评估'
      if (['学习适应', '课堂参与', '同伴互动', '支持需求'].includes(value)) return '融合学校随班就读评估'
      if (value.includes('融合')) return '融合学校随班就读评估'
      if (value.includes('孤独症') || ['沟通表达', '社会情绪', '认知学习', '语言行为', '动作发展'].includes(value)) return '孤独症行为评估'
      return value.includes('校本') || value.includes('自有') ? '自有量表评估' : '学科评估'
    },
    resolveDefaultAssessmentScale(type: string): string {
      const map: Record<string, string> = {
        学科评估: '生活语文',
        孤独症行为评估: '沟通表达',
        融合学校随班就读评估: '课堂参与',
        自有量表评估: '校本沟通能力量表',
      }
      return map[type] || '生活语文'
    },
    resolveAssessmentStudentFallback(studentNo: string, name: string): Record<string, string> {
      const map: Record<string, Record<string, string>> = {
        S2026001: { studentNo: 'S2026001', name: '陈思远', gender: '男', className: '启智一班', disability: '孤独症' },
        S2026002: { studentNo: 'S2026002', name: '王可欣', gender: '女', className: '送教一组', disability: '肢体障碍' },
        S2026003: { studentNo: 'S2026003', name: '刘宇恒', gender: '男', className: '融合支持班', disability: '学习障碍' },
      }
      const byNo = map[studentNo]
      if (byNo) return byNo
      const byName = Object.values(map).find((item) => item.name === name)
      return byName || { studentNo, name, gender: '', className: '', disability: '' }
    },
    resolveAssessmentStudentProfile(studentNo: string, name: string): Record<string, string> {
      const profile = (this.studentProfiles as Array<Record<string, string>>).find((item) => {
        return Boolean((studentNo && item.studentNo === studentNo) || (name && item.name === name))
      })
      const fallback = this.resolveAssessmentStudentFallback(studentNo || profile?.studentNo || '', name || profile?.name || '')
      return {
        studentNo: profile?.studentNo || fallback.studentNo || studentNo,
        name: profile?.name || fallback.name || name,
        gender: profile?.gender || fallback.gender || '',
        className: profile?.className || fallback.className || '',
        disability: profile?.disability || fallback.disability || '',
      }
    },
    normalizeDeliveryRow(row: string[], index: number): string[] {
      const actionText = row[row.length - 1] || ''
      const isLegacyAvatar = (value: string) => String(value || '').startsWith('头像') || String(value || '').startsWith('data:image/')
      const isStudentNo = (value: string) => /^S\d{4,}/.test(String(value || '').trim())
      const sequence = row[0] || String(index + 1)

      if (isStudentNo(row[1]) && isLegacyAvatar(row[2])) {
        return [
          sequence,
          row[5] || '',
          row[3] || '',
          row[4] || '',
          row[1] || '',
          row[6] || '',
          row[7] || '',
          row[8] || '',
          row[9] || '',
          actionText || '学生主页 / 编辑 / 删除',
        ]
      }

      if (isStudentNo(row[0]) && isLegacyAvatar(row[1])) {
        return [
          String(index + 1),
          row[4] || '',
          row[2] || '',
          row[3] || '',
          row[0] || '',
          row[5] || '',
          row[6] || '',
          row[7] || '',
          row[8] || '',
          actionText || '学生主页 / 编辑 / 删除',
        ]
      }

      const looksLikeOldShape = /^\d{4}-\d{2}-\d{2}/.test(row[8] || '') || actionText.includes('编辑学生信息')
      if (!looksLikeOldShape) return row

      const className = row[1] || ''
      const studentName = row[2] || ''
      const gender = row[3] || ''
      const studentNo = row[4] || ''
      const disability = row[5] || ''
      const teacher = row[6] || ''
      const frequency = row[7] || ''
      const latestDate = row[8] || ''
      const deliveryTopic = frequency ? `${frequency}送教支持` : '送教支持'
      const records = latestDate ? JSON.stringify([{ 教学内容: `${deliveryTopic}跟进`, 完成效果: '已完成' }]) : ''
      return [sequence, className, studentName, gender, studentNo, disability, deliveryTopic, records, teacher, '学生主页 / 编辑 / 删除']
    },
    normalizeFamilyTaskRow(row: string[], index: number): string[] {
      const columns = this.page.columns || []
      const hasStudentNoColumn = columns.includes('学号')
      const hasDetailColumn = columns.includes('详情及要求')
      if (hasDetailColumn) {
        const sequence = row[0] || String(index + 1)
        const taskName = row[1] || ''
        const secondValue = row[2] || ''
        const isLegacyStudentNo = /^S\d{4,}$/i.test(String(secondValue).trim())
        const detail = isLegacyStudentNo ? this.resolveFamilyTaskDetail(taskName) : secondValue
        const studentName = row[3] || ''
        const executeStatus = row[4] || '未完成'
        const readStatus = row[5] || '未读'
        const submitTime = row[6] || this.formatLocalDateTime()
        const actionText = this.normalizeFamilyTaskAction(row[7] || '', executeStatus)
        return [sequence, taskName, detail, studentName, executeStatus, readStatus, submitTime, actionText]
      }
      if (!hasStudentNoColumn) return row

      const isNewShape = row.length >= columns.length
      const sequence = row[0] || String(index + 1)
      const taskName = row[1] || ''
      const studentNo = isNewShape ? row[2] || '' : this.resolveFamilyTaskStudentNo(row[2] || '', index)
      const studentName = isNewShape ? row[3] || '' : row[2] || ''
      const executeStatus = isNewShape ? row[4] || '未完成' : row[3] || '未完成'
      const readStatus = isNewShape ? row[5] || '未读' : row[4] || '未读'
      const submitTime = isNewShape ? row[6] || this.formatLocalDateTime() : row[5] || this.formatLocalDateTime()
      const actionText = this.normalizeFamilyTaskAction(isNewShape ? row[7] || '' : row[6] || '', executeStatus)
      return [sequence, taskName, studentNo, studentName, executeStatus, readStatus, submitTime, actionText]
    },
    normalizeFamilyTaskAction(action: string, executeStatus: string): string {
      if (executeStatus === '已完成') return ''
      return String(action || '提醒家长')
        .split('/')
        .map((item) => item.trim())
        .filter((item) => item && item !== '查看详情')
        .join(' / ') || '提醒家长'
    },
    resolveFamilyTaskDetail(taskName: string): string {
      const map: Record<string, string> = {
        居家训练反馈: '请家长记录本周居家训练次数、学生配合情况及需要教师继续支持的问题。',
        本周康复作业: '完成康复训练作业并反馈过程照片，重点关注动作完成质量和学生配合情况。',
        情绪识别打卡: '每日完成情绪卡片识别练习，家长记录学生能否说出情绪名称和触发原因。',
        精细动作练习: '按教师示范完成居家精细动作训练，提交练习照片和完成效果说明。',
      }
      return map[taskName] || '请家长按任务要求完成居家配合，并反馈学生完成情况。'
    },
    normalizeFamilyNoticeRow(row: string[]): string[] {
      const columns = this.page.columns || []
      if (!columns.includes('通知内容')) return row
      const isNewShape = row.length >= columns.length
      if (isNewShape) return row

      const sequence = row[0] || ''
      const title = row[1] || ''
      const content = this.resolveNoticeContent(title)
      const range = row[2] || ''
      const readCount = row[3] || '0'
      const unreadCount = row[4] || '0'
      const publishTime = row[5] || this.formatLocalDateTime()
      const actionText = row[6] || '查看统计 / 再次提醒'
      return [sequence, title, content, range, readCount, unreadCount, publishTime, actionText]
    },
    resolveNoticeContent(title: string): string {
      const map: Record<string, string> = {
        家长开放日安排: '请家长按时到校参加开放日活动，了解学生在校学习与康复训练情况。',
        送教上门告知单: '本周送教上门安排已发布，请相关家长保持电话畅通并提前准备学习材料。',
      }
      return map[title] || '请家长及时查看学校通知，并按要求完成相关配合事项。'
    },
    resolveFamilyTaskStudentNo(studentName: string, index: number): string {
      const map: Record<string, string> = {
        陈思远: 'S2026001',
        王可欣: 'S2026002',
        刘宇恒: 'S2026003',
        赵晨: 'S2024012',
      }
      return map[studentName] || `S2026${String(index + 1).padStart(3, '0')}`
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
    buildNoticePeopleList(type: 'read' | 'unread'): string[] {
      const countColumn = type === 'read' ? '已读人数' : '未读人数'
      const count = Number(this.getRowValue(this.selectedNoticeRow, countColumn) || 0)
      const range = this.getRowValue(this.selectedNoticeRow, '发送范围')
      const seedNames = type === 'read'
        ? ['陈思远家长', '王可欣家长', '刘宇恒家长', '赵晨家长', '林悦家长', '许沐阳家长', '周嘉宁家长', '唐安安家长', '郑若辰家长', '宋一禾家长', '蒋乐宁家长', '韩知予家长']
        : ['顾明轩家长', '梁小满家长', '罗一诺家长', '田沐辰家长', '沈星遥家长', '何予安家长', '秦念初家长', '叶嘉禾家长']
      const prefix = range.includes('送教') ? '送教' : range.includes('全校') ? '校区' : '班级'
      return Array.from({ length: count }, (_, index) => seedNames[index] || `${prefix}${String(index + 1).padStart(2, '0')}学生家长`)
    },
    matchTab(row: string[]): boolean {
      if (!this.page.tabColumn || !this.activeTab) return true
      const index = this.getColumnIndex(this.page.tabColumn)
      if (index < 0) return true
      const expected = this.page.tabFilters?.[this.activeTab] || [this.activeTab]
      return expected.includes(row[index])
    },
    matchAssessmentClassTab(row: string[]): boolean {
      if (!(this.isAssessmentListPage || this.isAssessmentResultPage) || !this.activeAssessmentClass || this.activeAssessmentClass === '全部') return true
      return this.resolveAssessmentRowClass(row) === this.activeAssessmentClass
    },
    resolveAssessmentRowClass(row: string[]): string {
      const studentNoIndex = this.getColumnIndex('学号')
      const studentIndex = this.getColumnIndex('学生')
      const studentNo = studentNoIndex >= 0 ? row[studentNoIndex] || '' : ''
      const studentName = studentIndex >= 0 ? row[studentIndex] || '' : ''
      const profile = (this.studentProfiles as Array<Record<string, string>>).find((item) => {
        return Boolean((studentNo && item.studentNo === studentNo) || (studentName && item.name === studentName))
      })
      return String(profile?.className || '')
    },
    matchFilters(row: string[]): boolean {
      return (this.page.filters || []).every((filter: string) => {
        const value = String(this.filterValues[filter] || '').trim()
        if (!value) return true
        if (this.isTextFilter(filter)) return row.join(' ').includes(value)
        const index = this.getColumnIndex(this.resolveFilterColumn(filter))
        return index < 0 ? row.join(' ').includes(value) : row[index] === value
      })
    },
    resolveFilterColumn(filter: string): string {
      const map: Record<string, string> = {
        学年: '学年',
        开设学年: '开设学年',
        班级: '班级',
        班级名称: '班级名称',
        姓名: '姓名',
        学号: '学号',
        障碍类型: '障碍类型',
        校区: '校区',
        教室类型: '教室类型',
        教室序号: '教室序号',
      }
      return map[filter] || filter
    },
    getColumnIndex(column: string): number {
      return (this.page.columns || []).findIndex((item: string) => item === column)
    },
    notifyFilterResult() {
      this.$message.success(`已筛选出 ${this.displayRows.length} 条记录。`)
    },
    resetFilters() {
      const next: Record<string, string> = {}
      ;(this.page.filters || []).forEach((filter: string) => {
        next[filter] = ''
      })
      this.filterValues = next
    },
    handleTermAction(payload: { action: string; row: Record<string, string>; rowIndex: number }) {
      this.currentAction = payload.action
      this.currentRow = { ...payload.row }
      this.editingRowIndex = payload.rowIndex

      if (payload.action === '编辑') {
        this.openTermDialog(payload.row)
        return
      }
      if (payload.action === '设为默认') {
        this.confirmSetDefault()
        return
      }
      if (payload.action === '归档') {
        this.confirmArchiveTerm()
        return
      }
      if (payload.action === '删除') {
        this.confirmDeleteTerm()
      }
    },
    openTermDialog(row?: Record<string, string>) {
      this.currentAction = row ? '编辑' : '添加学期'
      if (!row) this.editingRowIndex = -1
      this.termForm = {
        name: row?.col1 || '',
        dateRange: row ? [row.col2 || '', row.col3 || ''] : [],
      }
      this.termDialogVisible = true
      this.$nextTick(() => (this.$refs.termFormRef as any)?.clearValidate?.())
    },
    async saveTermDialog() {
      const formRef = this.$refs.termFormRef as any
      if (!formRef) return
      formRef.validate(async (valid: boolean) => {
        if (!valid) return
        const columns = this.page.columns || []
        const currentRef = this.editingRowIndex >= 0 ? this.rowRefs[this.editingRowIndex] : undefined
        const nextValues = this.editingRowIndex >= 0 ? { ...this.currentRow } : buildEmptyRow(columns)
        nextValues.col1 = this.termForm.name
        nextValues.col2 = this.termForm.dateRange[0] || ''
        nextValues.col3 = this.termForm.dateRange[1] || ''
        nextValues.col4 = nextValues.col4 || '正常'
        nextValues.col6 = nextValues.col6 || '设为默认 / 编辑 / 归档 / 删除'
        const enhancedValues = applyActionToValues(this.currentAction, nextValues, columns)
        const nextRow = columnsToRow(columns, enhancedValues)
        await upsertModuleRow(String(this.$route.meta.pageKey), nextRow, currentRef?.plainId)
        this.termDialogVisible = false
        await this.loadPage()
        this.$message.success(`${this.currentAction} 已保存到当前本地数据库。`)
      })
    },
    async confirmSetDefault() {
      try {
        await this.$confirm(`将学期 < ${this.currentRow.col1} > 设置为默认学期，同时取消其他学期的默认设置，是否继续？`, '提示', {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消',
        })
        const columns = this.page.columns || []
        const currentRef = this.rowRefs[this.editingRowIndex]
        const nextValues = applyActionToValues('设为默认', { ...this.currentRow }, columns)
        await upsertModuleRow(String(this.$route.meta.pageKey), columnsToRow(columns, nextValues), currentRef?.plainId)
        await this.loadPage()
        this.$message.success('默认学期设置已更新。')
      } catch (error) {
        return
      }
    },
    async confirmArchiveTerm() {
      try {
        await this.$confirm(`归档后，该学期 < ${this.currentRow.col1} > 将仅用于查询操作，同时将取消默认学期的设置，是否继续？`, '提示', {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消',
        })
        const columns = this.page.columns || []
        const currentRef = this.rowRefs[this.editingRowIndex]
        const nextValues = applyActionToValues('归档', { ...this.currentRow }, columns)
        await upsertModuleRow(String(this.$route.meta.pageKey), columnsToRow(columns, nextValues), currentRef?.plainId)
        await this.loadPage()
        this.$message.success('该学期已归档。')
      } catch (error) {
        return
      }
    },
    async confirmDeleteTerm() {
      try {
        await this.$confirm(`仅可删除未使用的学期，如果该学期 < ${this.currentRow.col1} > 已经使用将不能删除，是否继续？`, '提示', {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          confirmButtonClass: 'danger-confirm-button',
        })
        const currentRef = this.rowRefs[this.editingRowIndex]
        if (currentRef?.plainId) await deleteModuleRow(String(this.$route.meta.pageKey), currentRef.plainId)
        await this.loadPage()
        this.$message.success('该学期已从当前本地数据库中删除。')
      } catch (error) {
        return
      }
    },
  },
})
</script>
