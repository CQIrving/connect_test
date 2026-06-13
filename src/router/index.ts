﻿import Vue from 'vue'
import Router from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import HomeDashboard from '@/views/HomeDashboard.vue'
import AiAssistantPage from '@/views/AiAssistantPage.vue'
import AccountManagementPage from '@/views/AccountManagementPage.vue'
import TableModulePage from '@/views/TableModulePage.vue'
import ScaleModulePage from '@/views/ScaleModulePage.vue'
import IepPage from '@/views/IepPage.vue'
import LessonPage from '@/views/LessonPage.vue'
import ResourcePage from '@/views/ResourcePage.vue'
import DashboardPage from '@/views/DashboardPage.vue'

Vue.use(Router)

export default new Router({
  mode: 'hash',
  scrollBehavior: () => ({ x: 0, y: 0 }),
  routes: [
    {
      path: '/',
      component: MainLayout,
      redirect: '/overview',
      children: [
        { path: 'overview', component: HomeDashboard, meta: { title: '首页' } },
        { path: 'ai', component: AiAssistantPage, meta: { title: '特教AI' } },
        { path: 'base/account', component: AccountManagementPage, meta: { title: '账户管理', pageKey: 'account' } },
        { path: 'base/permission', component: AccountManagementPage, meta: { title: '教师管理', pageKey: 'permission' } },
        { path: 'base/term', component: TableModulePage, meta: { title: '学期管理', pageKey: 'term' } },
        { path: 'base/class', component: TableModulePage, meta: { title: '班级管理', pageKey: 'class' } },
        { path: 'base/student', component: TableModulePage, meta: { title: '学生管理', pageKey: 'student' } },
        { path: 'base/teacher', component: TableModulePage, meta: { title: '师资管理', pageKey: 'teacher' } },
        { path: 'base/tools', component: ScaleModulePage, meta: { title: '评量工具管理', pageKey: 'tools' } },
        { path: 'base/statistics', component: DashboardPage, meta: { title: '数据统计', pageKey: 'statistics' } },
        { path: 'classroom/classes', component: TableModulePage, meta: { title: '我的班级', pageKey: 'myClasses' } },
        { path: 'classroom/students', component: TableModulePage, meta: { title: '我的学生', pageKey: 'myStudents' } },
        { path: 'assessment/sihai', component: ScaleModulePage, meta: { title: '学科评估', pageKey: 'sihai' } },
        { path: 'assessment/autism', component: ScaleModulePage, meta: { title: '孤独症行为评估', pageKey: 'autism' } },
        { path: 'assessment/inclusion', component: ScaleModulePage, meta: { title: '融合学校随班就读评估', pageKey: 'inclusion' } },
        { path: 'assessment/custom', component: ScaleModulePage, meta: { title: '自有量表', pageKey: 'customAssessment' } },
        { path: 'assessment/list', component: TableModulePage, meta: { title: '评估列表', pageKey: 'assessmentList' } },
        { path: 'assessment/result', component: TableModulePage, meta: { title: '评估分析', pageKey: 'assessmentResult' } },
        { path: 'iep/manage', component: TableModulePage, meta: { title: '学期计划管理', pageKey: 'iepManage' } },
        { path: 'iep/list', component: IepPage, meta: { title: '学生计划管理', pageKey: 'iepList' } },
        { path: 'teaching/lesson', component: LessonPage, meta: { title: '教案管理', pageKey: 'lesson' } },
        { path: 'teaching/assistant', component: LessonPage, meta: { title: '班级教学助手', pageKey: 'assistant' } },
        { path: 'resources/cases', component: ResourcePage, meta: { title: '教学案例', pageKey: 'resourceCases' } },
        { path: 'resources/school', component: ResourcePage, meta: { title: '校本资源', pageKey: 'resourceSchool' } },
        { path: 'dashboard/overview', component: DashboardPage, meta: { title: '数据可视化', pageKey: 'dashboardOverview' } },
        { path: 'dashboard/resource-rooms', component: TableModulePage, meta: { title: '资源教室管理', pageKey: 'resourceRooms' } },
        { path: 'dashboard/inspection', component: DashboardPage, meta: { title: '资源教室巡检日志', pageKey: 'inspection' } },
        { path: 'delivery/home-teaching', component: TableModulePage, meta: { title: '送教上门学生管理', pageKey: 'delivery' } },
        { path: 'family/tasks', component: TableModulePage, meta: { title: '家校共育任务', pageKey: 'familyTasks' } },
        { path: 'family/notices', component: TableModulePage, meta: { title: '家校通知', pageKey: 'familyNotices' } },
      ],
    },
  ],
})

