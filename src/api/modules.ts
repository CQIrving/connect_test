import { resolveMock } from './index'
import {
  accountPage,
  aiPresets,
  dashboardPages,
  homeCards,
  homeStats,
  iepPages,
  lessonPages,
  resourcePages,
  scalePages,
  tablePages,
} from '@/mock/app-data'
import { sidebarMenus } from '@/mock/sidebar-menus'
import { ensureDemoDbReady, getSortableItems, listModuleRows, listResources } from '@/db/demo-db'

export const getSidebarMenus = () => resolveMock(sidebarMenus)
export const getHomeStats = () => resolveMock(homeStats)
export const getHomeCards = () => resolveMock(homeCards)
export const getAiPresets = () => resolveMock(aiPresets)
export const getAccountPage = () => resolveMock(accountPage)

export async function getTablePage(key: string) {
  await ensureDemoDbReady()
  const basePage = tablePages[key]
  if (!basePage?.rows) return resolveMock(basePage)
  const [data, sortableItems] = await Promise.all([listModuleRows(key), getSortableItems(key, basePage.sortableItems || [])])
  return resolveMock({ ...basePage, columns: withIdColumn(basePage.columns), rows: data.rows, rowRefs: data.rowRefs, sortableItems })
}

export const getScalePage = (key: string) => resolveMock(scalePages[key])

export async function getIepPage(key: string) {
  await ensureDemoDbReady()
  const basePage = iepPages[key]
  if (!basePage?.rows) return resolveMock(basePage)
  const data = await listModuleRows(key)
  return resolveMock({ ...basePage, columns: withIdColumn(basePage.columns), rows: data.rows, rowRefs: data.rowRefs })
}

export async function getLessonPage(key: string) {
  await ensureDemoDbReady()
  const basePage = lessonPages[key]
  if (!basePage?.rows) return resolveMock(basePage)
  const data = await listModuleRows(key)
  return resolveMock({ ...basePage, columns: withIdColumn(basePage.columns), rows: data.rows, rowRefs: data.rowRefs })
}

export async function getResourcePage(key: string) {
  await ensureDemoDbReady()
  const basePage = resourcePages[key]
  if (key !== 'resourceSchool') return resolveMock(basePage)
  const data = await listResources()
  return resolveMock({
    ...basePage,
    columns: ['序号', ...(basePage.columns || [])],
    rows: data.rows,
    rowRefs: data.rowRefs,
  })
}

export const getDashboardPage = (key: string) => resolveMock(dashboardPages[key])

function withIdColumn(columns: string[] = []) {
  if (!Array.isArray(columns)) return ['序号']
  const first = String(columns[0] || '').toLowerCase()
  if (first === 'id' || first.includes('id') || first.includes('编号') || first.includes('序号')) return columns
  return ['序号', ...columns]
}
