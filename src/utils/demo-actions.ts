export function cloneRows(rows: string[][] = []): string[][] {
  return rows.map((row) => [...row])
}

export function buildEmptyRow(columns: string[] = []): Record<string, string> {
  const row: Record<string, string> = {}
  columns.forEach((column, index) => {
    row[`col${index}`] = column === '操作' ? '' : ''
  })
  return row
}

export function getDefaultActionText(action: string, fallback = '查看 / 编辑'): string {
  const map: Record<string, string> = {
    添加学期: '设为默认 / 编辑 / 归档 / 删除',
    添加班级: '编辑班级信息 / 分配教师 / 设置班主任 / 学生管理 / 归档 / 删除',
    添加学生: '学生主页 / 编辑学生信息 / 转班 / 归档 / 删除',
    新增学生: '学生主页 / 编辑学生信息 / 转班 / 归档 / 删除',
    新增: '编辑 / 分配班级',
    添加资源教室: '巡查日志 / 编辑教室信息 / 删除',
    添加计划: '编辑 / 删除',
    创建: '学生主页 / 编辑 / 删除',
    新增送教记录: '学生主页 / 编辑 / 删除',
    添加任务: '提醒家长',
    发布家校任务: '提醒家长',
    添加通知: '查看统计 / 再次提醒',
    发布通知: '查看统计 / 再次提醒',
    添加教案: '查看 / 复制 / 编辑 / 删除',
    复制教案: '查看 / 复制 / 编辑 / 删除',
    添加学生计划: '编辑 / 删除',
    上传: '下载 / 编辑 / 删除',
    创建评估: '开始评估 / 编辑 / 删除',
  }
  return map[action] || fallback
}

export function columnsToRow(columns: string[], values: Record<string, string>): string[] {
  return columns.map((_, index) => values[`col${index}`] || '')
}

export function applyActionToValues(
  action: string,
  values: Record<string, string>,
  columns: string[],
): Record<string, string> {
  const next = { ...values }
  const statusIndex = findFirstColumn(columns, ['状态', '执行状态', '推送状态'])
  const updatedIndex = columns.findIndex((column) => column.includes('时间') || column.includes('日期'))
  const actionIndex = columns.findIndex((column) => column === '操作')
  const now = formatNow()

  if (statusIndex >= 0) {
    if (action === '归档') next[`col${statusIndex}`] = '已归档'
    if (action === '设为默认') next[`col${statusIndex}`] = '正常'
    if (action === '审核') next[`col${statusIndex}`] = '已完成'
    if (action === '推送家长') next[`col${statusIndex}`] = '已推送'
    if (action === '提醒家长' || action === '再次提醒') next[`col${statusIndex}`] = '已提醒'
  }

  if (updatedIndex >= 0 && !readonlyLikeAction(action)) {
    next[`col${updatedIndex}`] = now
  }

  if (action === '分配教师') {
    const teacherIndex = columns.findIndex((column) => column === '教师')
    if (teacherIndex >= 0) next[`col${teacherIndex}`] = next[`col${teacherIndex}`] || '李静、张毅'
  }

  if (action === '设置班主任') {
    const headTeacherIndex = columns.findIndex((column) => column === '班主任')
    if (headTeacherIndex >= 0) next[`col${headTeacherIndex}`] = next[`col${headTeacherIndex}`] || '李静'
  }

  if (action === '分配班级') {
    const authorityIndex = columns.findIndex((column) => column === '班级权限')
    if (authorityIndex >= 0) next[`col${authorityIndex}`] = next[`col${authorityIndex}`] || '启智一班 / 送教一组'
  }

  if (action === '提醒家长' || action === '再次提醒') {
    const readIndex = findFirstColumn(columns, ['家长阅读', '阅读状态'])
    if (readIndex >= 0) next[`col${readIndex}`] = '已提醒'
  }

  if (action === 'AI优化') {
    const summaryIndex = columns.findIndex((column) => column.includes('目标') || column.includes('摘要'))
    if (summaryIndex >= 0) next[`col${summaryIndex}`] = `${next[`col${summaryIndex}`] || ''}（已加入AI建议）`.trim()
  }

  if (actionIndex >= 0 && !next[`col${actionIndex}`]) {
    next[`col${actionIndex}`] = getDefaultActionText(action)
  }

  return next
}

function findFirstColumn(columns: string[], names: string[]) {
  return columns.findIndex((column) => names.includes(column))
}

function formatNow(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = `${now.getMonth() + 1}`.padStart(2, '0')
  const dd = `${now.getDate()}`.padStart(2, '0')
  const hh = `${now.getHours()}`.padStart(2, '0')
  const mi = `${now.getMinutes()}`.padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

function readonlyLikeAction(action: string): boolean {
  return ['查看', '查看详情', '查看统计', '查看图表', '查看分析图表', '查看记录', '预览', '下载', '借用', '学生主页', '历史得分'].includes(action)
}
