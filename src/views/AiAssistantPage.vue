<template>
  <div class="ai-page ai-workspace">
    <aside class="ai-command-panel">
      <div class="ai-command-brand">
        <span class="ai-orb"><i class="el-icon-cpu"></i></span>
        <div>
          <strong>特教 AI 助教</strong>
          <small>基于平台本地数据生成建议</small>
        </div>
      </div>

      <div class="ai-command-section">
        <p>常用生成</p>
        <button
          v-for="mode in workModes"
          :key="mode.title"
          class="ai-command-btn"
          :class="{ 'is-active': selectedMode === mode.title }"
          type="button"
          @click="runMode(mode)"
        >
          <i :class="mode.icon"></i>
          <span>{{ mode.title }}</span>
        </button>
      </div>

      <div class="ai-command-section">
        <p>平台数据</p>
        <button
          v-for="source in dataSources"
          :key="source.name"
          class="ai-source-btn"
          :class="{ 'is-active': selectedSource === source.name }"
          type="button"
          @click="selectSource(source.name)"
        >
          <strong>{{ source.name }}</strong>
          <small>{{ source.desc }}</small>
        </button>
      </div>
    </aside>

    <main class="ai-chat-panel">
      <header class="ai-chat-head">
        <div>
          <h2>有什么可以帮您生成？</h2>
          <p>可直接调用评估、学生、计划、教案、资源和家校数据，生成可编辑的 IEP 与教学建议。</p>
        </div>
        <el-tag type="warning" effect="plain">本地模式 · 不接真实 AI</el-tag>
      </header>

      <section class="ai-context-strip">
        <button
          v-for="item in contextCards"
          :key="item.id"
          type="button"
          class="ai-context-pill"
          :class="{ 'is-active': selectedContextId === item.id }"
          @click="selectedContextId = item.id"
        >
          <strong>{{ item.student }}</strong>
          <span>{{ item.assessment }} · {{ item.score }} 分</span>
        </button>
      </section>

      <section class="ai-message-list">
        <article v-for="message in messages" :key="message.id" class="ai-message" :class="`is-${message.role}`">
          <div class="ai-avatar">{{ message.role === 'assistant' ? 'AI' : '我' }}</div>
          <div class="ai-bubble">
            <div class="ai-message-meta">
              <strong>{{ message.title }}</strong>
              <span>{{ message.time }}</span>
            </div>
            <div v-if="message.thinkingSteps && message.thinkingSteps.length" class="ai-thinking">
              <div
                v-for="step in message.thinkingSteps"
                :key="step"
                class="ai-thinking-step"
              >
                <i class="el-icon-loading" v-if="message.isThinking && step === message.thinkingSteps[message.thinkingSteps.length - 1]"></i>
                <i class="el-icon-check" v-else></i>
                <span>{{ step }}</span>
              </div>
            </div>
            <p v-if="message.content">{{ message.content }}</p>
            <span v-if="message.isStreaming" class="ai-stream-cursor"></span>

            <div v-if="!message.isThinking && message.sections && message.sections.length" class="ai-result-grid">
              <div v-for="section in message.sections" :key="section.title" class="ai-result-block">
                <h4>{{ section.title }}</h4>
                <ul>
                  <li v-for="line in section.items" :key="line">{{ line }}</li>
                </ul>
              </div>
            </div>

            <div v-if="message.editable && !message.isThinking && !message.isStreaming" class="ai-edit-card">
              <div class="ai-edit-head">
                <span>教师可手动调整优化</span>
                <small>保存后进入右侧生成记录</small>
              </div>
              <el-input v-model="message.draft" type="textarea" :rows="5" placeholder="可在此修改 AI 建议内容" />
              <div class="ai-edit-actions">
                <el-button size="small" plain @click="copyResult(message)">复制</el-button>
                <el-button size="small" plain @click="applyToIep(message)">转为 IEP 草稿</el-button>
                <el-button size="small" type="primary" plain @click="saveRecord(message)">保存记录</el-button>
              </div>
            </div>
          </div>
        </article>
      </section>

      <footer class="ai-composer">
        <div class="ai-quick-row">
          <button v-for="item in quickPrompts" :key="item" type="button" @click="sendPrompt(item)">{{ item }}</button>
        </div>
        <div class="ai-composer-box">
          <el-input
            v-model="draft"
            type="textarea"
            :rows="3"
            resize="none"
            placeholder="例如：调用陈思远最近两次评估数据，生成 IEP 框架、长期目标和本月短期目标。"
            @keydown.native.ctrl.enter.prevent="handleSubmit"
            @keydown.native.meta.enter.prevent="handleSubmit"
          />
          <div class="ai-composer-actions">
            <div class="ai-composer-tags">
              <el-tag size="mini" effect="plain">{{ selectedSource }}</el-tag>
              <el-tag size="mini" type="success" effect="plain">{{ currentContext.student }}</el-tag>
              <el-tag size="mini" type="warning" effect="plain">{{ selectedMode }}</el-tag>
            </div>
            <el-button type="primary" round icon="el-icon-position" :loading="isGenerating" @click="handleSubmit">发送</el-button>
          </div>
        </div>
      </footer>
    </main>

    <aside class="ai-data-panel">
      <div class="section-mini-head">
        <strong>平台数据上下文</strong>
        <span>可调用</span>
      </div>
      <div class="ai-context-card is-selected">
        <strong>{{ currentContext.student }}</strong>
        <p>{{ currentContext.summary }}</p>
        <div class="ai-context-tags">
          <el-tag v-for="tag in currentContext.tags" :key="tag" size="mini" effect="plain">{{ tag }}</el-tag>
        </div>
      </div>

      <div class="ai-data-list">
        <button v-for="item in platformFunctions" :key="item.title" type="button" @click="sendPrompt(item.prompt)">
          <i :class="item.icon"></i>
          <span>{{ item.title }}</span>
          <small>{{ item.desc }}</small>
        </button>
      </div>

      <div class="section-mini-head records-head">
        <strong>AI 生成记录</strong>
        <span>最近 {{ records.length }} 条</span>
      </div>
      <div v-if="records.length" class="ai-record-list">
        <div v-for="item in records" :key="item.id" class="ai-record-card">
          <strong>{{ item.title }}</strong>
          <p>{{ item.content }}</p>
          <span>{{ item.time }}</span>
        </div>
      </div>
      <div v-else class="ai-record-empty">生成并保存后，会在这里沉淀 IEP、目标和教学建议。</div>
    </aside>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { getAiPresets } from '@/api/modules'
import { getAppState, setAppState } from '@/db/demo-db'

type AiMode = {
  title: string
  icon: string
  source: string
  prompt: string
}

type AiMessage = {
  id: string
  role: 'assistant' | 'user'
  title: string
  content: string
  time: string
  sections?: Array<{ title: string; items: string[] }>
  editable?: boolean
  draft?: string
  thinkingSteps?: string[]
  isThinking?: boolean
  isStreaming?: boolean
}

type AiRecord = {
  id: string
  title: string
  content: string
  time: string
}

type ContextCard = {
  id: string
  student: string
  assessment: string
  score: number
  summary: string
  strengths: string[]
  needs: string[]
  tags: string[]
}

export default Vue.extend({
  data() {
    return {
      presets: [] as string[],
      selectedSource: '评估数据',
      selectedMode: 'IEP框架生成',
      selectedContextId: 'chen',
      draft: '',
      records: [] as AiRecord[],
      isGenerating: false,
      generationTimers: [] as number[],
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          title: '特教 AI 助教',
          content: '请选择左侧常用生成，或在下方输入需求。我会基于右侧选中的学生与平台数据，生成可编辑的 IEP 框架、长短期目标、教案、资源推荐或家校沟通内容。',
          time: '刚刚',
        },
      ] as AiMessage[],
      contextCards: [
        {
          id: 'chen',
          student: '陈思远',
          assessment: '孤独症行为评估',
          score: 83,
          summary: '沟通表达与社会情绪提升明显，动作发展维度近期回落，需要在课堂回应、轮替活动和精细动作中继续支持。',
          strengths: ['能在图片提示下表达需求', '社会情绪识别进步', '课堂回应更稳定'],
          needs: ['动作发展需关注', '同伴互动需结构化支持', '家校练习需持续'],
          tags: ['孤独症行为评估 83', '动作发展预警', 'IEP优先'],
        },
        {
          id: 'wang',
          student: '王可欣',
          assessment: '学科评估',
          score: 91,
          summary: '生活数学进步明显，适合围绕购物、数量比较和实物点数生成学科目标与生活化练习。',
          strengths: ['数量匹配稳定', '购物情境兴趣高', '家庭配合度好'],
          needs: ['迁移到真实场景', '表达完整步骤', '维持注意时间'],
          tags: ['学科评估 91', '生活数学', '目标生成'],
        },
        {
          id: 'liu',
          student: '刘宇恒',
          assessment: '融合学校随班就读评估',
          score: 72,
          summary: '课堂参与有所提升，但同伴互动和支持需求仍需跟进，适合生成融合课堂支持策略和家校沟通建议。',
          strengths: ['课堂参与提升', '能接受教师提示', '任务开始速度变快'],
          needs: ['同伴互动', '支持需求', '情绪过渡'],
          tags: ['融合随班 72', '同伴互动', '支持策略'],
        },
      ] as ContextCard[],
      workModes: [
        { title: 'IEP框架生成', icon: 'el-icon-document-checked', source: '评估数据', prompt: '调用平台评估数据，生成符合 IEP 框架的学生现况、教育需求、服务建议和评估方式。' },
        { title: '长短期目标', icon: 'el-icon-aim', source: '评估数据', prompt: '基于最近评估结果，生成 1 个长期目标和 4 个可测量短期目标。' },
        { title: '个别化教案', icon: 'el-icon-reading', source: '教案模块', prompt: '结合学生 IEP 目标与资源库材料，生成一份可执行的个别化教案。' },
        { title: '资源推荐', icon: 'el-icon-folder-opened', source: '教学资源库', prompt: '根据学生目标与能力短板，推荐校本资源并说明使用方式。' },
        { title: '家校沟通', icon: 'el-icon-chat-line-round', source: '家校共育', prompt: '生成一段家校沟通通知，说明近期评估表现、家庭练习建议和注意事项。' },
        { title: '风险预警', icon: 'el-icon-warning-outline', source: '分校数据', prompt: '结合学生评估与近期任务数据，生成需要教师关注的风险预警和跟进动作。' },
      ] as AiMode[],
      dataSources: [
        { name: '评估数据', desc: '量表结果、历史得分、提升与待提高领域' },
        { name: '学生档案', desc: '班级、障碍类型、安置形式、教师分配' },
        { name: '教育计划', desc: '学期计划、学生计划、IEP 目标' },
        { name: '教案模块', desc: '课程、授课类型、教学过程与课件' },
        { name: '教学资源库', desc: '课件、教案、微课与应用范围' },
        { name: '家校共育', desc: '任务完成、通知阅读与家长提醒' },
        { name: '分校数据', desc: '资源教室、送教、巡检与校区数据' },
      ],
      platformFunctions: [
        { icon: 'el-icon-s-check', title: '生成 IEP 草稿', desc: '现况、目标、服务和评估方式', prompt: '请生成完整 IEP 草稿，并突出长短期目标。' },
        { icon: 'el-icon-data-line', title: '评估趋势解读', desc: '提升点、待提高点、下一步评估', prompt: '请解读最近两次评估趋势，并标注关键提升和待提高领域。' },
        { icon: 'el-icon-reading', title: '教案优化', desc: '导入、示范、练习、泛化', prompt: '请把当前 IEP 目标转化为一节个别化教案。' },
        { icon: 'el-icon-folder-opened', title: '资源匹配', desc: '从资源库匹配课件/教案/微课', prompt: '请根据学生需求推荐资源库材料和使用顺序。' },
        { icon: 'el-icon-bell', title: '家校通知', desc: '转为家长可理解的沟通话术', prompt: '请生成家校通知，包含家庭练习建议。' },
        { icon: 'el-icon-school', title: '分校数据摘要', desc: '校区、资源教室、送教工作摘要', prompt: '请生成本周分校数据摘要和待跟进事项。' },
      ],
    }
  },
  computed: {
    currentContext(): ContextCard {
      return this.contextCards.find((item: ContextCard) => item.id === this.selectedContextId) || this.contextCards[0]
    },
    quickPrompts(): string[] {
      return this.presets.length ? this.presets : ['IEP框架生成', '长短期目标建议', '评估结果解读', '个别化教案草稿']
    },
  },
  created() {
    this.loadAiWorkspace()
  },
  beforeDestroy() {
    this.clearGenerationTimers()
  },
  watch: {
    messages: {
      deep: true,
      handler() {
        this.persistAiMessages()
      },
    },
    records: {
      deep: true,
      handler() {
        this.persistAiRecords()
      },
    },
  },
  methods: {
    async loadAiWorkspace() {
      const [presets, savedMessages, savedRecords] = await Promise.all([
        getAiPresets(),
        getAppState<AiMessage[]>('ai-assistant:messages', []),
        getAppState<AiRecord[]>('ai-assistant:records', []),
      ])
      this.presets = presets
      if (savedMessages.length) {
        this.messages = savedMessages.map((message: AiMessage) => ({
          ...message,
          isThinking: false,
          isStreaming: false,
        }))
      }
      if (savedRecords.length) this.records = savedRecords
    },
    persistAiMessages() {
      void setAppState('ai-assistant:messages', this.messages)
    },
    persistAiRecords() {
      void setAppState('ai-assistant:records', this.records)
    },
    selectSource(source: string) {
      this.selectedSource = source
      this.draft = `请调用${source}，围绕${this.currentContext.student}生成可编辑建议。`
    },
    runMode(mode: AiMode) {
      this.selectedMode = mode.title
      this.selectedSource = mode.source
      this.sendPrompt(mode.prompt)
    },
    handleSubmit() {
      this.sendPrompt(this.draft)
    },
    sendPrompt(prompt: string) {
      const content = String(prompt || '').trim()
      if (this.isGenerating) {
        this.$message.warning('AI 正在生成，请稍候。')
        return
      }
      if (!content) {
        this.$message.warning('请输入问题后再发送。')
        return
      }

      this.clearGenerationTimers()
      this.messages.push({
        id: `user-${Date.now()}-${Math.random()}`,
        role: 'user',
        title: '教师提问',
        content,
        time: this.nowText(),
      })

      const response = this.buildAiResponse(content)
      const fullContent = response.content
      const fullSections = response.sections || []
      const fullDraft = response.draft || ''
      response.content = ''
      response.sections = []
      response.draft = ''
      response.editable = false
      response.isThinking = true
      response.isStreaming = false
      response.thinkingSteps = []
      this.messages.push(response)
      this.draft = ''
      this.scrollMessagesToBottom()
      this.playAiGeneration(response.id, fullContent, fullSections, fullDraft)
    },
    playAiGeneration(messageId: string, fullContent: string, fullSections: Array<{ title: string; items: string[] }>, fullDraft: string) {
      this.isGenerating = true
      const context = this.currentContext
      const steps = [
        `正在读取${this.selectedSource}与${context.student}的当前档案`,
        `正在分析${context.assessment}、优势表现和待支持领域`,
        '正在组织 IEP 目标、教学建议和家校延伸内容',
      ]
      const showStep = (index: number) => {
        const message = this.findMessage(messageId)
        if (!message) return
        if (index >= steps.length) {
          message.isThinking = false
          message.isStreaming = true
          this.typeAiContent(messageId, fullContent, fullSections, fullDraft)
          return
        }
        message.thinkingSteps = [...(message.thinkingSteps || []), steps[index]]
        this.scrollMessagesToBottom()
        this.generationTimers.push(window.setTimeout(() => showStep(index + 1), 650))
      }
      this.generationTimers.push(window.setTimeout(() => showStep(0), 320))
    },
    typeAiContent(messageId: string, fullContent: string, fullSections: Array<{ title: string; items: string[] }>, fullDraft: string) {
      const chars = Array.from(fullContent)
      const tick = (index: number) => {
        const message = this.findMessage(messageId)
        if (!message) return
        message.content = chars.slice(0, index).join('')
        this.scrollMessagesToBottom()
        if (index <= chars.length) {
          this.generationTimers.push(window.setTimeout(() => tick(index + 1), 34))
          return
        }
        message.content = fullContent
        message.sections = []
        this.streamAiSections(messageId, fullSections, fullDraft)
      }
      tick(1)
    },
    streamAiSections(messageId: string, fullSections: Array<{ title: string; items: string[] }>, fullDraft: string) {
      const message = this.findMessage(messageId)
      if (!message) return
      message.isStreaming = true
      message.sections = []
      const streamSection = (sectionIndex: number) => {
        const current = this.findMessage(messageId)
        if (!current) return
        if (sectionIndex >= fullSections.length) {
          current.isStreaming = false
          current.draft = fullDraft
          current.editable = true
          this.isGenerating = false
          this.clearGenerationTimers()
          this.scrollMessagesToBottom()
          return
        }
        const source = fullSections[sectionIndex]
        current.sections = [
          ...(current.sections || []),
          {
            title: source.title,
            items: [],
          },
        ]
        this.scrollMessagesToBottom()
        this.streamAiSectionItems(messageId, fullSections, sectionIndex, 0, () => {
          streamSection(sectionIndex + 1)
        })
      }
      streamSection(0)
    },
    streamAiSectionItems(
      messageId: string,
      fullSections: Array<{ title: string; items: string[] }>,
      sectionIndex: number,
      itemIndex: number,
      done: () => void,
    ) {
      const source = fullSections[sectionIndex]
      if (!source || itemIndex >= source.items.length) {
        this.generationTimers.push(window.setTimeout(done, 180))
        return
      }
      const message = this.findMessage(messageId)
      const section = message?.sections?.[sectionIndex]
      if (!message || !section) return
      section.items = [...section.items, '']
      message.sections = [...(message.sections || [])]
      const chars = Array.from(source.items[itemIndex])
      const tick = (index: number) => {
        const current = this.findMessage(messageId)
        const currentSection = current?.sections?.[sectionIndex]
        if (!current || !currentSection) return
        currentSection.items.splice(itemIndex, 1, chars.slice(0, index).join(''))
        current.sections = [...(current.sections || [])]
        this.scrollMessagesToBottom()
        if (index <= chars.length) {
          this.generationTimers.push(window.setTimeout(() => tick(index + 1), 18))
          return
        }
        this.generationTimers.push(window.setTimeout(() => {
          this.streamAiSectionItems(messageId, fullSections, sectionIndex, itemIndex + 1, done)
        }, 120))
      }
      tick(1)
    },
    findMessage(messageId: string): AiMessage | undefined {
      return this.messages.find((message: AiMessage) => message.id === messageId)
    },
    scrollMessagesToBottom() {
      this.$nextTick(() => {
        const panel = this.$el.querySelector('.ai-message-list')
        if (panel) panel.scrollTop = panel.scrollHeight
      })
    },
    clearGenerationTimers() {
      this.generationTimers.forEach((timer) => window.clearTimeout(timer))
      this.generationTimers = []
    },
    buildAiResponse(prompt: string): AiMessage {
      const context = this.currentContext
      const mode = this.resolveModeFromPrompt(prompt)
      const sections = [
        {
          title: 'IEP 框架建议',
          items: [
            `现况：${context.summary}`,
            `优先需求：${context.needs.slice(0, 2).join('、')}`,
            `支持方式：视觉提示、任务分解、同伴示范、家校同频练习。`,
          ],
        },
        {
          title: '长期目标',
          items: [
            `在 2026 学期内，${context.student}能在课堂和生活化情境中稳定运用目标能力，独立完成核心任务不少于 80%。`,
            `能在教师低强度提示下参与同伴或家庭练习，并保持连续 4 周正向表现。`,
          ],
        },
        {
          title: '短期目标',
          items: [
            `4 周内：围绕“${context.needs[0]}”完成每周 3 次结构化练习，正确率达到 70%。`,
            `8 周内：在真实课堂/家庭场景中完成迁移任务，教师提示次数减少 30%。`,
            `12 周内：能够用口语、图片或动作表达学习需求，并记录 3 次以上成功案例。`,
          ],
        },
        {
          title: '教师调整建议',
          items: [
            `保留学生优势：${context.strengths.slice(0, 2).join('、')}。`,
            `如果连续两周未达成，可降低任务步长，增加视觉支持和即时强化。`,
            `建议把结果同步到学生计划，并选择 1 个家校任务作为家庭延伸。`,
          ],
        },
      ]

      if (mode.includes('教案')) {
        sections[0] = {
          title: '个别化教案结构',
          items: ['导入：使用学生熟悉图片或实物建立动机。', '示范：教师分步演示目标行为。', '练习：个训或小组中完成 3 轮即时反馈。', '泛化：迁移到家庭或融合课堂。'],
        }
      }

      if (mode.includes('家校')) {
        sections[0] = {
          title: '家校沟通草稿',
          items: [`${context.student}近期在${context.assessment}中得分 ${context.score}，优势为${context.strengths.join('、')}。`, `建议家长本周重点配合：${context.needs[0]}，每天 10 分钟即可。`, '如孩子出现疲惫或抗拒，请降低难度并记录触发场景。'],
        }
      }

      const draft = sections
        .map((section) => `${section.title}\n${section.items.map((item, index) => `${index + 1}. ${item}`).join('\n')}`)
        .join('\n\n')

      return {
        id: `assistant-${Date.now()}-${Math.random()}`,
        role: 'assistant',
        title: `${mode} · ${context.student}`,
        content: `已调用${this.selectedSource}，基于${context.assessment}和平台数据生成以下可编辑建议。`,
        time: this.nowText(),
        sections,
        editable: true,
        draft,
      }
    },
    resolveModeFromPrompt(prompt: string): string {
      if (prompt.includes('教案')) return '个别化教案'
      if (prompt.includes('家校') || prompt.includes('通知')) return '家校沟通'
      if (prompt.includes('资源')) return '资源推荐'
      if (prompt.includes('风险') || prompt.includes('预警')) return '风险预警'
      if (prompt.includes('目标')) return '长短期目标'
      return this.selectedMode || 'IEP框架生成'
    },
    copyResult(message: AiMessage) {
      const text = message.draft || message.content
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text)
      }
      this.$message.success('已复制当前建议内容。')
    },
    applyToIep(message: AiMessage) {
      this.saveRecord({ ...message, title: `${message.title}（IEP草稿）` })
      this.$message.success('已转为 IEP 草稿记录，可继续在学生计划中调整。')
    },
    saveRecord(message: AiMessage) {
      this.records = [{
        id: `${Date.now()}-${Math.random()}`,
        title: message.title,
        content: (message.draft || message.content || '').slice(0, 120),
        time: this.nowText(),
      }, ...this.records].slice(0, 30)
    },
    nowText() {
      return new Date().toLocaleString('zh-CN', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    },
  },
})
</script>
