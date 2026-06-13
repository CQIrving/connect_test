﻿﻿﻿<template>
  <div>
    <PageSection :title="page.title" :description="page.description">
      <div class="switch-row">
        <button class="switch-chip" type="button" @click="openCreateDialog">添加教师</button>
      </div>

      <div class="filter-toolbar">
        <el-input
          v-model="nameKeyword"
          size="small"
          placeholder="请输入姓名"
          class="toolbar-search"
          suffix-icon="el-icon-search"
        />
        <el-input
          v-model="workNoKeyword"
          size="small"
          placeholder="请输入工号"
          class="toolbar-search"
          suffix-icon="el-icon-postcard"
        />
        <el-input
          v-model="subjectKeyword"
          size="small"
          placeholder="请输入任教学科"
          class="toolbar-search"
          suffix-icon="el-icon-reading"
        />
        <el-input
          v-model="mobileKeyword"
          size="small"
          placeholder="请输入手机号"
          class="toolbar-search"
          suffix-icon="el-icon-mobile-phone"
        />
        <el-button type="primary" size="small" plain @click="notifySearchResult">查找</el-button>
        <el-button size="small" plain @click="resetSearch">重置</el-button>
      </div>

      <el-table :data="paginatedAccounts" stripe border class="page-table">
        <el-table-column type="index" :index="resolveAccountRowIndex" label="序号" width="72" align="center" header-align="center" />
        <el-table-column label="姓名" prop="name" min-width="130" align="center" header-align="center" />
        <el-table-column label="性别" prop="gender" width="88" align="center" header-align="center" />
        <el-table-column label="工号" prop="workNo" min-width="130" align="center" header-align="center" />
        <el-table-column label="任教班级" min-width="180" align="center" header-align="center">
          <template #default="scope">{{ formatAssignedClasses(scope.row) }}</template>
        </el-table-column>
        <el-table-column label="任教学科" min-width="140" align="center" header-align="center">
          <template #default="scope">{{ resolveTeacherSubject(scope.row) }}</template>
        </el-table-column>
        <el-table-column label="手机号" min-width="150" align="center" header-align="center">
          <template #default="scope">{{ scope.row.mobile }}</template>
        </el-table-column>
        <el-table-column label="操作" min-width="340" align="center" header-align="center">
          <template #default="scope">
            <div class="action-group">
              <el-button size="mini" plain @click="openEditDialog(scope.row)">编辑教师信息</el-button>
              <el-button size="mini" plain type="primary" @click="openAssignDialog(scope.row)">分配班级</el-button>
              <el-button size="mini" plain type="warning" @click="openPermissionDialog(scope.row)">分配权限</el-button>
              <el-button size="mini" plain type="danger" @click="confirmDeleteTeacher(scope.row)">删除</el-button>
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
          :total="filteredAccounts.length"
          layout="total, sizes, prev, pager, next, jumper"
          prev-text="上一页"
          next-text="下一页"
          @size-change="handlePageSizeChange"
          @current-change="handleCurrentPageChange"
        />
      </div>
    </PageSection>

    <el-dialog :visible.sync="editDialogVisible" :title="editingExisting ? '修改教师信息' : '添加教师'" width="760px">
      <el-form ref="accountFormRef" :model="accountForm" :rules="accountRules" label-width="88px" class="account-form-grid">
        <el-form-item label="手机号码" prop="mobile" required>
          <el-input v-model="accountForm.mobile" :disabled="editingExisting" maxlength="11" placeholder="请输入手机号码" />
        </el-form-item>
        <el-form-item label="姓名" prop="name" required>
          <el-input v-model="accountForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别" prop="gender" required>
          <el-select v-model="accountForm.gender" placeholder="请选择性别" class="full-width">
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
          </el-select>
        </el-form-item>
        <el-form-item label="工号" prop="workNo" required>
          <el-input v-model="accountForm.workNo" placeholder="请输入工号" />
        </el-form-item>
        <el-form-item label="任教班级" prop="assignedClasses">
          <el-select v-model="accountForm.assignedClasses" multiple filterable collapse-tags placeholder="请选择任教班级" class="full-width">
            <el-option v-for="item in assignableClasses" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="任教学科" prop="teachingSubject" required>
          <el-select v-model="accountForm.teachingSubject" filterable allow-create default-first-option placeholder="请选择或输入任教学科" class="full-width">
            <el-option v-for="item in subjectOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="账号角色" prop="roleLabel">
          <el-select v-model="accountForm.roleLabel" placeholder="请选择账号角色" class="full-width">
            <el-option v-for="item in permissionRoleOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" plain @click="saveAccount(false)">保存</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="assignDialogVisible" title="给教师分配班级" width="1120px">
      <div class="assign-tip">给教师分配班级后，该教师可管理对应班级学生、评估和教学数据。</div>
      <div class="assign-meta">
        <span>当前教师</span>
        <strong>{{ assignTarget.name || '--' }}</strong>
        <small>{{ assignTarget.mobile || '--' }}</small>
      </div>
      <div class="assign-search-row">
        <el-button size="small" @click="selectedClasses = []">取消全选</el-button>
        <div class="toolbar-inline">
          <span class="assign-search-label">搜索</span>
          <el-input v-model="classKeyword" size="small" placeholder="搜索班级名称" class="toolbar-search" />
          <el-button size="small" @click="classKeyword = ''">取消搜索</el-button>
          <el-button size="small" @click="selectFilteredClasses">全选搜索到的班级</el-button>
        </div>
      </div>
      <div class="assign-board">
        <div v-for="group in filteredClassGroups" :key="group.year" class="assign-year-group">
          <div class="assign-year-title">{{ group.year }}</div>
          <el-checkbox-group v-model="selectedClasses">
            <el-checkbox v-for="item in group.classes" :key="item" :label="item">{{ item }}</el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
      <div class="assigned-preview">已选班级：{{ selectedClasses.join('、') || '暂无' }}</div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="assignDialogVisible = false">取消并关闭</el-button>
        <el-button type="primary" plain @click="saveAssignedClasses">分配班级</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="permissionDialogVisible" title="分配教师权限" width="720px">
      <div class="assign-meta">
        <span>当前教师</span>
        <strong>{{ permissionTarget.name || '--' }}</strong>
        <small>{{ permissionTarget.mobile || '--' }}</small>
      </div>
      <el-form label-width="88px">
        <el-form-item label="权限角色">
          <el-select v-model="permissionRole" placeholder="请选择权限角色" class="permission-select">
            <el-option v-for="item in permissionRoleOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="功能权限">
          <el-checkbox-group v-model="selectedPermissions" class="permission-grid">
            <el-checkbox v-for="item in permissionOptions" :key="item" :label="item">{{ item }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" plain @click="savePermissions">保存权限</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import PageSection from '@/components/common/PageSection.vue'
import { getAccountPage } from '@/api/modules'
import { deleteAccount, listAccounts, listAssignableClasses, type AccountRecord, upsertAccount } from '@/db/demo-db'

type AccountForm = Omit<AccountRecord, 'id' | 'updatedAt'>

function createEmptyAccountForm(): AccountForm {
  return {
    plainId: '',
    avatar: '',
    mobile: '',
    name: '',
    workNo: '',
    gender: '男',
    teachingSubject: '',
    major: '',
    education: '其他',
    degree: '其他',
    title: '',
    status: '正常',
    assignedClasses: [],
    password: 'Teach@2026',
    roleLabel: '管理员',
  }
}

export default Vue.extend({
  components: { PageSection },
  data() {
    return {
      page: {} as any,
      accounts: [] as AccountRecord[],
      assignableClasses: [] as string[],
      nameKeyword: '',
      workNoKeyword: '',
      subjectKeyword: '',
      mobileKeyword: '',
      classKeyword: '',
      currentPage: 1,
      pageSize: 10,
      pageSizeOptions: [5, 10, 20, 50] as number[],
      editDialogVisible: false,
      assignDialogVisible: false,
      permissionDialogVisible: false,
      editingExisting: false,
      accountForm: createEmptyAccountForm(),
      assignTarget: {} as AccountRecord,
      permissionTarget: {} as AccountRecord,
      selectedClasses: [] as string[],
      permissionRole: '',
      selectedPermissions: [] as string[],
      permissionRoleOptions: ['管理员', '班主任', '资源教师', '任课教师'],
      permissionOptions: ['基础信息管理', '量表评估', '教育计划', '教案资源', '家校共育', '数据查看'],
      subjectOptions: ['生活语文', '生活数学', '康复训练', '感统训练', '绘画与手工', '劳动技能', '融合支持'],
      accountRules: {
        mobile: [{ required: true, message: '请输入手机号码', trigger: 'blur' }],
        name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
        gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
        workNo: [{ required: true, message: '请输入工号', trigger: 'blur' }],
        teachingSubject: [{ required: true, message: '请输入任教学科', trigger: 'blur' }],
      },
    }
  },
  computed: {
    filteredAccounts(): AccountRecord[] {
      const nameKeyword = this.nameKeyword.trim()
      const workNoKeyword = this.workNoKeyword.trim()
      const subjectKeyword = this.subjectKeyword.trim()
      const mobileKeyword = this.mobileKeyword.trim()
      return this.accounts.filter((item) => {
        const matchesName = !nameKeyword || item.name.includes(nameKeyword)
        const matchesWorkNo = !workNoKeyword || item.workNo.includes(workNoKeyword)
        const matchesSubject = !subjectKeyword || this.resolveTeacherSubject(item).includes(subjectKeyword)
        const matchesMobile = !mobileKeyword || item.mobile.includes(mobileKeyword)
        return matchesName && matchesWorkNo && matchesSubject && matchesMobile
      })
    },
    paginatedAccounts(): AccountRecord[] {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredAccounts.slice(start, start + this.pageSize)
    },
    pageCount(): number {
      return Math.max(1, Math.ceil(this.filteredAccounts.length / this.pageSize))
    },
    filteredClassGroups(): Array<{ year: string; classes: string[] }> {
      const keyword = this.classKeyword.trim()
      const source = (this.page.classYearGroups || []).map((group: Record<string, any>) => ({
        year: group.year,
        classes: (group.classes || []).filter((item: string) => this.assignableClasses.includes(item)),
      }))
      if (!keyword) return source
      return source
        .map((group: { year: string; classes: string[] }) => ({
          year: group.year,
          classes: group.classes.filter((item) => item.includes(keyword)),
        }))
        .filter((group: { classes: string[] }) => group.classes.length)
    },
  },
  watch: {
    filteredAccounts() {
      this.currentPage = 1
      this.ensureValidCurrentPage()
    },
    pageSize() {
      this.ensureValidCurrentPage()
    },
  },
  created() {
    this.loadPage()
  },
  methods: {
    async loadPage() {
      const [page, accounts, assignableClasses] = await Promise.all([getAccountPage(), listAccounts(), listAssignableClasses()])
      this.page = page || {}
      this.accounts = accounts
      this.assignableClasses = assignableClasses
      this.ensureValidCurrentPage()
    },
    notifySearchResult() {
      this.currentPage = 1
      this.$message.success(`已筛选出 ${this.filteredAccounts.length} 位教师。`)
    },
    resetSearch() {
      this.nameKeyword = ''
      this.workNoKeyword = ''
      this.subjectKeyword = ''
      this.mobileKeyword = ''
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
    resolveAccountRowIndex(index: number) {
      return (this.currentPage - 1) * this.pageSize + index + 1
    },
    resolveTeacherSubject(account: AccountRecord) {
      return account.teachingSubject || account.major || '未填写'
    },
    formatAssignedClasses(account: AccountRecord) {
      return account.assignedClasses?.length ? account.assignedClasses.join('、') : '未分配'
    },
    openCreateDialog() {
      this.editingExisting = false
      this.accountForm = {
        ...createEmptyAccountForm(),
        workNo: `T${new Date().getFullYear()}${String(this.accounts.length + 1).padStart(3, '0')}`,
      }
      this.editDialogVisible = true
      this.$nextTick(() => (this.$refs.accountFormRef as any)?.clearValidate?.())
    },
    openEditDialog(account: AccountRecord) {
      this.editingExisting = true
      this.accountForm = { ...account, assignedClasses: [...(account.assignedClasses || [])] }
      this.editDialogVisible = true
      this.$nextTick(() => (this.$refs.accountFormRef as any)?.clearValidate?.())
    },
    async saveAccount(openAssignAfterSave: boolean) {
      const formRef = this.$refs.accountFormRef as any
      if (!formRef) return
      formRef.validate(async (valid: boolean) => {
        if (!valid) return
        const plainId = this.accountForm.plainId || `account-${Date.now()}`
        const payload = {
          ...this.accountForm,
          plainId,
          avatar: '',
          password: this.accountForm.password || 'Teach@2026',
          assignedClasses: [...(this.accountForm.assignedClasses || [])],
        }
        await upsertAccount(payload)
        await this.loadPage()
        this.editDialogVisible = false
        this.$message.success('教师信息已保存到本地数据库。')
        if (openAssignAfterSave) {
          const target = this.accounts.find((item) => item.plainId === plainId) || payload
          this.openAssignDialog(target as AccountRecord)
        }
      })
    },
    openAssignDialog(account: AccountRecord) {
      this.assignTarget = account
      this.selectedClasses = [...(account.assignedClasses || [])]
      this.classKeyword = ''
      this.assignDialogVisible = true
    },
    selectFilteredClasses() {
      this.selectedClasses = Array.from(new Set(this.filteredClassGroups.flatMap((group) => group.classes)))
    },
    async saveAssignedClasses() {
      await upsertAccount({
        ...this.assignTarget,
        assignedClasses: [...this.selectedClasses],
      })
      this.assignDialogVisible = false
      await this.loadPage()
      this.$message.success('班级分配结果已保存到本地数据库。')
    },
    openPermissionDialog(account: AccountRecord) {
      this.permissionTarget = account
      this.permissionRole = account.roleLabel || '教师'
      this.selectedPermissions = [...(account.permissionScopes || this.resolveDefaultPermissions(account.roleLabel))]
      this.permissionDialogVisible = true
    },
    resolveDefaultPermissions(roleLabel: string): string[] {
      if (roleLabel === '管理员') return [...this.permissionOptions]
      if (roleLabel === '班主任') return ['基础信息管理', '量表评估', '教育计划', '家校共育']
      if (roleLabel === '资源教师') return ['量表评估', '教案资源', '数据查看']
      return ['量表评估', '教育计划']
    },
    async savePermissions() {
      await upsertAccount({
        ...this.permissionTarget,
        roleLabel: this.permissionRole,
        permissionScopes: [...this.selectedPermissions],
      })
      this.permissionDialogVisible = false
      await this.loadPage()
      this.$message.success('权限分配结果已保存到本地数据库。')
    },
    async confirmDeleteTeacher(account: AccountRecord) {
      try {
        await this.$confirm(`删除教师 < ${account.name} > 后会从当前本地教师列表移除，是否继续？`, '提示', {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          confirmButtonClass: 'danger-confirm-button',
        })
        await deleteAccount(account.plainId)
        await this.loadPage()
        this.$message.success('教师已删除。')
      } catch (error) {
        return
      }
    },
  },
})
</script>
