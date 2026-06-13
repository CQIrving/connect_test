import Dexie, { type Table } from 'dexie'
import { accountPage, dashboardPages, iepPages, lessonPages, resourcePages, tablePages } from '@/mock/app-data'
import { subjectScaleBank, type SubjectScaleQuestion } from '@/mock/subject-scale-bank'
import { generateExternalId, RESOURCE_FIXED_KEY, validateExternalId } from '@/utils/external-id'

export type RowRef = {
  plainId: string
  externalId?: string
}

type AppMeta = {
  key: string
  value: string
}

type AppStateRecord = {
  key: string
  value: unknown
  updatedAt: string
}

type ModuleRowRecord = {
  id?: number
  pageKey: string
  plainId: string
  publicId: string
  row: string[]
  sortOrder: number
  updatedAt: string
}

type SortableRecord = {
  id?: number
  pageKey: string
  items: string[]
  updatedAt: string
}

export type ScaleBankRecord = {
  id?: number
  scaleName: string
  sourcePageKey: string
  description: string
  questions: SubjectScaleQuestion[]
  isCustom: number
  isDeleted: number
  sortOrder: number
  updatedAt: string
}

type ScaleAssessmentRecord = {
  id?: number
  pageKey: string
  plainId: string
  row: string[]
  sortOrder: number
  updatedAt: string
}

type ScalePreviewAnswerRecord = {
  id?: number
  scaleName: string
  answers: Record<string, string>
  updatedAt: string
}

export type ResourceRecord = {
  id?: number
  plainId: string
  key: string
  externalId: string
  name: string
  category: string
  subject: string
  grade: string
  visibility: string
  uploadedAt: string
  status: string
  actions: string
  updatedAt: string
}

export type AccountRecord = {
  id?: number
  plainId: string
  avatar?: string
  mobile: string
  name: string
  workNo: string
  gender: string
  teachingSubject?: string
  major: string
  education: string
  degree: string
  title: string
  status: string
  assignedClasses: string[]
  permissionScopes?: string[]
  password: string
  roleLabel: string
  updatedAt: string
}

class FrontDemoDexie extends Dexie {
  meta!: Table<AppMeta, string>
  appStates!: Table<AppStateRecord, string>
  moduleRows!: Table<ModuleRowRecord, number>
  sortables!: Table<SortableRecord, number>
  resources!: Table<ResourceRecord, number>
  accounts!: Table<AccountRecord, number>
  scaleBanks!: Table<ScaleBankRecord, number>
  scaleAssessmentRows!: Table<ScaleAssessmentRecord, number>
  scalePreviewAnswers!: Table<ScalePreviewAnswerRecord, number>

  constructor() {
    super('front-demo-dexie')
    this.version(1).stores({
      meta: '&key',
      moduleRows: '++id,&[pageKey+plainId],pageKey,plainId,sortOrder,updatedAt',
      sortables: '++id,&pageKey,updatedAt',
      resources: '++id,&plainId,&externalId,category,subject,visibility,uploadedAt,updatedAt',
    })
    this.version(2).stores({
      meta: '&key',
      moduleRows: '++id,&[pageKey+plainId],pageKey,plainId,sortOrder,updatedAt',
      sortables: '++id,&pageKey,updatedAt',
      resources: '++id,&plainId,&externalId,category,subject,visibility,uploadedAt,updatedAt',
      accounts: '++id,&plainId,mobile,name,status,updatedAt',
    })
    this.version(3).stores({
      meta: '&key',
      moduleRows: '++id,&[pageKey+plainId],pageKey,plainId,sortOrder,updatedAt',
      sortables: '++id,&pageKey,updatedAt',
      resources: '++id,&plainId,&externalId,category,subject,visibility,uploadedAt,updatedAt',
      accounts: '++id,&plainId,mobile,name,status,updatedAt',
      scaleBanks: '++id,&scaleName,sourcePageKey,isCustom,isDeleted,sortOrder,updatedAt',
      scaleAssessmentRows: '++id,&[pageKey+plainId],pageKey,plainId,sortOrder,updatedAt',
      scalePreviewAnswers: '++id,&scaleName,updatedAt',
    })
    this.version(4).stores({
      meta: '&key',
      appStates: '&key,updatedAt',
      moduleRows: '++id,&[pageKey+plainId],pageKey,plainId,sortOrder,updatedAt',
      sortables: '++id,&pageKey,updatedAt',
      resources: '++id,&plainId,&externalId,category,subject,visibility,uploadedAt,updatedAt',
      accounts: '++id,&plainId,mobile,name,status,updatedAt',
      scaleBanks: '++id,&scaleName,sourcePageKey,isCustom,isDeleted,sortOrder,updatedAt',
      scaleAssessmentRows: '++id,&[pageKey+plainId],pageKey,plainId,sortOrder,updatedAt',
      scalePreviewAnswers: '++id,&scaleName,updatedAt',
    })
  }
}

const db = new FrontDemoDexie()
const SEED_VERSION = 'v13'
const SCALE_BANK_SEED_VERSION = 'v4-option-score-labels'
let initializePromise: Promise<void> | null = null

const SCALE_NAMES_BY_PAGE: Record<string, string[]> = {
  sihai: ['生活语文', '生活数学', '生活英语'],
  autism: ['沟通表达', '社会情绪', '认知学习', '语言行为', '动作发展'],
  inclusion: ['学习适应', '课堂参与', '同伴互动', '支持需求'],
}

export async function ensureDemoDbReady(): Promise<void> {
  if (!initializePromise) initializePromise = initializeDatabase()
  return initializePromise
}

async function initializeDatabase() {
  const currentVersion = await db.meta.get('seed-version')
  if (currentVersion?.value === SEED_VERSION) return

  await db.transaction('rw', [db.meta, db.moduleRows, db.sortables, db.resources, db.accounts, db.scaleBanks, db.scaleAssessmentRows, db.scalePreviewAnswers], async () => {
    await db.meta.clear()
    await db.moduleRows.clear()
    await db.sortables.clear()
    await db.resources.clear()
    await db.accounts.clear()
    await db.scaleBanks.clear()
    await db.scaleAssessmentRows.clear()
    await db.scalePreviewAnswers.clear()

    const moduleSeeds = buildModuleSeeds()
    if (moduleSeeds.length) await db.moduleRows.bulkAdd(moduleSeeds)

    const sortableSeeds = buildSortableSeeds()
    if (sortableSeeds.length) await db.sortables.bulkAdd(sortableSeeds)

    const resourceSeeds = buildResourceSeeds()
    if (resourceSeeds.length) await db.resources.bulkAdd(resourceSeeds)

    const accountSeeds = buildAccountSeeds()
    if (accountSeeds.length) await db.accounts.bulkAdd(accountSeeds)

    await db.meta.put({ key: 'seed-version', value: SEED_VERSION })
  })
}

function buildModuleSeeds(): ModuleRowRecord[] {
  const records: ModuleRowRecord[] = []
  const pageGroups = [
    { pages: tablePages, keys: Object.keys(tablePages) },
    { pages: dashboardPages, keys: ['inspection'] },
    { pages: iepPages, keys: ['iepList'] },
    { pages: lessonPages, keys: ['lesson', 'assistant'] },
  ]

  pageGroups.forEach(({ pages, keys }) => {
    keys.forEach((pageKey) => {
      const page = (pages as Record<string, any>)[pageKey]
      const rows = page?.rows || []
      const dashboardRows = page?.logs || []
      const seedRows = rows.length ? rows : dashboardRows
      seedRows.forEach((row: string[], index: number) => {
        records.push({
          pageKey,
          plainId: `${pageKey}-${index + 1}`,
          publicId: buildPublicId(pageKey, index),
          row: [...row],
          sortOrder: index,
          updatedAt: nowString(),
        })
      })
    })
  })

  return records
}

function buildSortableSeeds(): SortableRecord[] {
  return Object.entries(tablePages)
    .filter(([, page]) => Array.isArray(page?.sortableItems))
    .map(([pageKey, page]) => ({
      pageKey,
      items: [...page.sortableItems],
      updatedAt: nowString(),
    }))
}

function buildResourceSeeds(): ResourceRecord[] {
  const rows = resourcePages.resourceSchool.rows || []
  return rows.map((row: string[], index: number) => {
    const plainId = `resource-${index + 1}`
    return {
      plainId,
      key: RESOURCE_FIXED_KEY,
      externalId: generateExternalId(plainId, RESOURCE_FIXED_KEY),
      name: row[0] || '',
      category: row[1] || '',
      subject: row[2] || '',
      grade: row[3] || '',
      visibility: row[4] || '',
      uploadedAt: row[5] || '',
      status: row[6] || '可获取',
      actions: normalizeResourceActionText(row[7] || '下载 / 编辑 / 删除'),
      updatedAt: nowString(),
    }
  })
}

function buildAccountSeeds(): AccountRecord[] {
  return (accountPage.accounts || []).map((item: Record<string, any>) => ({
    plainId: item.plainId,
    avatar: '',
    mobile: item.mobile || '',
    name: item.name || '',
    workNo: item.workNo || '',
    gender: item.gender || '男',
    teachingSubject: item.teachingSubject || item.major || '',
    major: item.major || '',
    education: item.education || '其他',
    degree: item.degree || '其他',
    title: item.title || '',
    status: item.status || '正常',
    assignedClasses: [...(item.assignedClasses || [])],
    permissionScopes: [...(item.permissionScopes || [])],
    password: item.password || 'Teach@2026',
    roleLabel: item.roleLabel || '管理员',
    updatedAt: nowString(),
  }))
}

export async function listModuleRows(pageKey: string): Promise<{ rows: string[][]; rowRefs: RowRef[] }> {
  await ensureDemoDbReady()
  let records = await db.moduleRows.where('pageKey').equals(pageKey).sortBy('sortOrder')
  if (!records.length) {
    await seedMissingModuleRows(pageKey)
    records = await db.moduleRows.where('pageKey').equals(pageKey).sortBy('sortOrder')
  }
  return {
    rows: records.map((record) => [record.publicId, ...record.row]),
    rowRefs: records.map((record) => ({ plainId: record.plainId })),
  }
}

async function seedMissingModuleRows(pageKey: string) {
  const page = (tablePages as Record<string, any>)[pageKey] || (dashboardPages as Record<string, any>)[pageKey]
  const rows = page?.rows || []
  const dashboardRows = page?.logs || []
  const seedRows = rows.length ? rows : dashboardRows
  if (!seedRows.length) return
  const records = seedRows.map((row: string[], index: number) => ({
    pageKey,
    plainId: `${pageKey}-${index + 1}`,
    publicId: buildPublicId(pageKey, index),
    row: [...row],
    sortOrder: index,
    updatedAt: nowString(),
  }))
  await db.moduleRows.bulkPut(records)
}

export async function upsertModuleRow(pageKey: string, row: string[], plainId?: string) {
  await ensureDemoDbReady()
  const existing = plainId ? await db.moduleRows.where('[pageKey+plainId]').equals([pageKey, plainId]).first() : undefined
  const nextPlainId = plainId || `${pageKey}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const sortOrder = plainId ? await resolveModuleSortOrder(pageKey, plainId) : await resolveNextModuleSortOrder(pageKey)
  const payloadRow = [...row]
  if (payloadRow.length) payloadRow.shift()

  await db.moduleRows.put({
    id: existing?.id,
    pageKey,
    plainId: nextPlainId,
    publicId: existing?.publicId || buildPublicId(pageKey, sortOrder),
    row: payloadRow,
    sortOrder,
    updatedAt: nowString(),
  })
  return nextPlainId
}

export async function deleteModuleRow(pageKey: string, plainId: string) {
  await ensureDemoDbReady()
  const target = await db.moduleRows.where('[pageKey+plainId]').equals([pageKey, plainId]).first()
  if (target?.id !== undefined) await db.moduleRows.delete(target.id)
}

export async function getSortableItems(pageKey: string, fallback: string[] = []): Promise<string[]> {
  await ensureDemoDbReady()
  const record = await db.sortables.where('pageKey').equals(pageKey).first()
  return record?.items?.length ? [...record.items] : [...fallback]
}

export async function saveSortableItems(pageKey: string, items: string[]) {
  await ensureDemoDbReady()
  const current = await db.sortables.where('pageKey').equals(pageKey).first()
  await db.sortables.put({
    id: current?.id,
    pageKey,
    items: [...items],
    updatedAt: nowString(),
  })
}

export async function listScaleBankRecords(): Promise<ScaleBankRecord[]> {
  await ensureScaleBankSeeds()
  const records = await db.scaleBanks.where('isDeleted').equals(0).toArray()
  return records
    .sort((a, b) => a.sortOrder - b.sortOrder || a.scaleName.localeCompare(b.scaleName, 'zh-Hans-CN'))
    .map((record) => ({
      ...record,
      questions: cloneScaleQuestions(record.questions || []),
    }))
}

export async function upsertScaleBankRecord(payload: {
  scaleName: string
  sourcePageKey: string
  description: string
  questions: SubjectScaleQuestion[]
  isCustom?: boolean
  sortOrder?: number
}) {
  await ensureScaleBankSeeds()
  const existing = await db.scaleBanks.where('scaleName').equals(payload.scaleName).first()
  const sourcePageKey = payload.sourcePageKey || resolveScalePageKey(payload.scaleName)
  await db.scaleBanks.put({
    id: existing?.id,
    scaleName: payload.scaleName,
    sourcePageKey,
    description: payload.description || '',
    questions: cloneScaleQuestions(payload.questions),
    isCustom: payload.isCustom ? 1 : existing?.isCustom ?? 0,
    isDeleted: 0,
    sortOrder: payload.sortOrder ?? existing?.sortOrder ?? resolveScaleSortOrder(payload.scaleName, sourcePageKey),
    updatedAt: nowString(),
  })
}

export async function markScaleBankDeleted(scaleName: string) {
  await ensureScaleBankSeeds()
  const existing = await db.scaleBanks.where('scaleName').equals(scaleName).first()
  if (!existing) return
  await db.scaleBanks.put({
    ...existing,
    isDeleted: 1,
    updatedAt: nowString(),
  })
}

export async function listScaleAssessmentRows(pageKey: string, fallbackRows: string[][] = []): Promise<string[][]> {
  await ensureDemoDbReady()
  let records = await db.scaleAssessmentRows.where('pageKey').equals(pageKey).sortBy('sortOrder')
  if (!records.length && fallbackRows.length) {
    await saveScaleAssessmentRows(pageKey, fallbackRows)
    records = await db.scaleAssessmentRows.where('pageKey').equals(pageKey).sortBy('sortOrder')
  }
  return records.map((record) => [...record.row])
}

export async function saveScaleAssessmentRows(pageKey: string, rows: string[][]) {
  await ensureDemoDbReady()
  await db.transaction('rw', db.scaleAssessmentRows, async () => {
    await db.scaleAssessmentRows.where('pageKey').equals(pageKey).delete()
    const records = rows.map((row, index) => ({
      pageKey,
      plainId: `${pageKey}-${index + 1}`,
      row: [...row],
      sortOrder: index,
      updatedAt: nowString(),
    }))
    if (records.length) await db.scaleAssessmentRows.bulkAdd(records)
  })
}

export async function getScalePreviewAnswers(scaleName: string): Promise<Record<string, string>> {
  await ensureDemoDbReady()
  const record = await db.scalePreviewAnswers.where('scaleName').equals(scaleName).first()
  return record?.answers ? { ...record.answers } : {}
}

export async function saveScalePreviewAnswers(scaleName: string, answers: Record<string, string>) {
  await ensureDemoDbReady()
  const existing = await db.scalePreviewAnswers.where('scaleName').equals(scaleName).first()
  await db.scalePreviewAnswers.put({
    id: existing?.id,
    scaleName,
    answers: { ...answers },
    updatedAt: nowString(),
  })
}

export async function deleteScalePreviewAnswers(scaleName: string) {
  await ensureDemoDbReady()
  const existing = await db.scalePreviewAnswers.where('scaleName').equals(scaleName).first()
  if (existing?.id !== undefined) await db.scalePreviewAnswers.delete(existing.id)
}

export async function getAppState<T>(key: string, fallback: T): Promise<T> {
  await ensureDemoDbReady()
  const record = await db.appStates.get(key)
  if (record?.value === undefined) return cloneStateValue(fallback)
  return cloneStateValue(record.value as T)
}

export async function setAppState<T>(key: string, value: T) {
  await ensureDemoDbReady()
  await db.appStates.put({
    key,
    value: cloneStateValue(value),
    updatedAt: nowString(),
  })
}

export async function listResources(): Promise<{ rows: string[][]; rowRefs: RowRef[] }> {
  await ensureDemoDbReady()
  const records = await db.resources.orderBy('updatedAt').reverse().toArray()
  return {
    rows: records.map(resourceToRow),
    rowRefs: records.map((record) => ({ plainId: record.plainId, externalId: record.externalId })),
  }
}

export async function upsertResourceRow(row: string[], existingExternalId?: string) {
  await ensureDemoDbReady()
  const existing = existingExternalId ? await db.resources.where('externalId').equals(existingExternalId).first() : undefined
  const plainId = existing?.plainId || `resource-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const key = existing?.key || RESOURCE_FIXED_KEY
  const externalId = generateExternalId(plainId, key)

  await db.resources.put({
    id: existing?.id,
    plainId,
    key,
    externalId,
    name: row[1] || '',
    category: row[2] || '',
    subject: row[3] || '',
    grade: row[4] || '',
    visibility: row[5] || '',
    uploadedAt: row[6] || nowDateString(),
    status: row[7] || '可获取',
    actions: normalizeResourceActionText(row[8] || '下载 / 编辑 / 删除'),
    updatedAt: nowString(),
  })

  return externalId
}

export async function deleteResourceByExternalId(externalId: string) {
  await ensureDemoDbReady()
  const record = await db.resources.where('externalId').equals(externalId).first()
  if (record?.id !== undefined) await db.resources.delete(record.id)
}

export async function findResourceByExternalId(externalId: string): Promise<ResourceRecord | undefined> {
  await ensureDemoDbReady()
  const record = await db.resources.where('externalId').equals(externalId).first()
  if (!record) return undefined
  return validateExternalId(record.externalId, record.key) ? record : undefined
}

export async function listAccounts(): Promise<AccountRecord[]> {
  await ensureDemoDbReady()
  return db.accounts.orderBy('updatedAt').reverse().toArray()
}

export async function upsertAccount(account: Omit<AccountRecord, 'id' | 'updatedAt'>) {
  await ensureDemoDbReady()
  const existing = await db.accounts.where('plainId').equals(account.plainId).first()
  await db.accounts.put({
    ...account,
    id: existing?.id,
    assignedClasses: [...(account.assignedClasses || [])],
    permissionScopes: [...(account.permissionScopes || [])],
    updatedAt: nowString(),
  })
  return account.plainId
}

export async function deleteAccount(plainId: string) {
  await ensureDemoDbReady()
  const existing = await db.accounts.where('plainId').equals(plainId).first()
  if (existing?.id !== undefined) await db.accounts.delete(existing.id)
}

export async function createImportedAccounts() {
  await ensureDemoDbReady()
  const seeds: Array<Omit<AccountRecord, 'id' | 'updatedAt'>> = [
    {
      plainId: `account-${Date.now()}-a`,
      mobile: '13300001234',
      name: '陈老师',
      workNo: 'T2026002',
      gender: '女',
      major: '学前教育',
      education: '本科',
      degree: '学士',
      title: '班主任',
      status: '正常',
      assignedClasses: ['启智二班'],
      password: 'Teach@2026',
      roleLabel: '教师',
    },
    {
      plainId: `account-${Date.now()}-b`,
      mobile: '13600004567',
      name: '周老师',
      workNo: 'T2026003',
      gender: '男',
      major: '康复治疗',
      education: '硕士',
      degree: '硕士',
      title: '康复教师',
      status: '正常',
      assignedClasses: ['融合支持班'],
      password: 'Teach@2026',
      roleLabel: '教师',
    },
  ]
  for (const seed of seeds) {
    await upsertAccount(seed)
  }
}

export async function updateAccountPassword(plainId: string, password: string) {
  await ensureDemoDbReady()
  const existing = await db.accounts.where('plainId').equals(plainId).first()
  if (!existing) return
  await db.accounts.put({ ...existing, password, updatedAt: nowString() })
}

export async function revokeAccount(plainId: string) {
  await ensureDemoDbReady()
  const existing = await db.accounts.where('plainId').equals(plainId).first()
  if (!existing) return
  await db.accounts.put({
    ...existing,
    status: '已撤销',
    assignedClasses: [],
    updatedAt: nowString(),
  })
}

export async function resetAccount(plainId: string) {
  await ensureDemoDbReady()
  const existing = await db.accounts.where('plainId').equals(plainId).first()
  if (!existing) return ''
  const nextPassword = buildTemporaryPassword()
  await db.accounts.put({
    ...existing,
    password: nextPassword,
    status: '正常',
    updatedAt: nowString(),
  })
  return nextPassword
}

export async function listAssignableClasses(): Promise<string[]> {
  await ensureDemoDbReady()
  const records = await db.moduleRows.where('pageKey').equals('class').sortBy('sortOrder')
  const classNames = records.map((record) => record.row[0]).filter(Boolean)
  if (classNames.length) return classNames
  return ['启智一班', '启智二班', '融合支持班', '送教一组']
}

async function ensureScaleBankSeeds() {
  await ensureDemoDbReady()
  const currentVersion = await db.meta.get('scale-bank-seed-version')
  if (currentVersion?.value === SCALE_BANK_SEED_VERSION) return

  const records: ScaleBankRecord[] = []
  Object.entries(SCALE_NAMES_BY_PAGE).forEach(([pageKey, scaleNames]) => {
    scaleNames.forEach((scaleName, index) => {
      records.push({
        scaleName,
        sourcePageKey: pageKey,
        description: '',
        questions: cloneScaleQuestions(subjectScaleBank[scaleName] || []),
        isCustom: 0,
        isDeleted: 0,
        sortOrder: index,
        updatedAt: nowString(),
      })
    })
  })

  await db.transaction('rw', [db.scaleBanks, db.meta], async () => {
    for (const record of records) {
      const existing = await db.scaleBanks.where('scaleName').equals(record.scaleName).first()
      if (!existing) {
        await db.scaleBanks.add(record)
        continue
      }

      if (!existing.isCustom && record.questions.length) {
        await db.scaleBanks.put({
          ...existing,
          sourcePageKey: record.sourcePageKey,
          description: record.description,
          questions: record.questions,
          isDeleted: 0,
          sortOrder: record.sortOrder,
          updatedAt: nowString(),
        })
      }
    }
    await db.meta.put({ key: 'scale-bank-seed-version', value: SCALE_BANK_SEED_VERSION })
  })
}

function resourceToRow(record: ResourceRecord, index: number): string[] {
  return [
    String(index + 1),
    record.name,
    record.category,
    record.subject,
    normalizeResourceFileValue(record.grade),
    record.visibility,
    record.uploadedAt,
    record.status,
    normalizeResourceActionText(record.actions),
  ]
}

function normalizeResourceActionText(value: string): string {
  return String(value || '下载 / 编辑 / 删除').replace(/预览/g, '下载')
}

function normalizeResourceFileValue(value: string): string {
  if (['启智一年级', '启智二年级', '跨年级'].includes(value)) return ''
  return value || ''
}

function cloneStateValue<T>(value: T): T {
  if (value === undefined || value === null) return value
  return JSON.parse(JSON.stringify(value)) as T
}

function cloneScaleQuestions(questions: SubjectScaleQuestion[]): SubjectScaleQuestion[] {
  return questions.map((item, index) => ({
    ...item,
    no: item.no || index + 1,
    id: item.id || `q${String(index + 1).padStart(2, '0')}`,
  }))
}

function resolveScalePageKey(scaleName: string) {
  const entry = Object.entries(SCALE_NAMES_BY_PAGE).find(([, scaleNames]) => scaleNames.includes(scaleName))
  return entry?.[0] || 'customAssessment'
}

function resolveScaleSortOrder(scaleName: string, pageKey = resolveScalePageKey(scaleName)) {
  const names = SCALE_NAMES_BY_PAGE[pageKey] || []
  const index = names.indexOf(scaleName)
  return index >= 0 ? index : Date.now()
}

async function resolveNextModuleSortOrder(pageKey: string): Promise<number> {
  const records = await db.moduleRows.where('pageKey').equals(pageKey).sortBy('sortOrder')
  return records.length ? records[records.length - 1].sortOrder + 1 : 0
}

async function resolveModuleSortOrder(pageKey: string, plainId: string): Promise<number> {
  const record = await db.moduleRows.where('[pageKey+plainId]').equals([pageKey, plainId]).first()
  return record?.sortOrder ?? (await resolveNextModuleSortOrder(pageKey))
}

function nowString() {
  return new Date().toISOString()
}

function nowDateString() {
  return new Date().toISOString().slice(0, 10)
}

function buildPublicId(pageKey: string, index: number) {
  return String(index + 1)
}

function buildTemporaryPassword() {
  return `Dpt@${Math.random().toString(36).slice(2, 6)}9`
}
