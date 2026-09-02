// @ts-nocheck
/**
 * OMP i18n Extension — 中文翻译（设置 + 命令）
 *
 * 运行时注入方式：在扩展加载阶段修改以下对象的属性，使内置界面显示中文：
 *   - TAB_METADATA / SETTINGS_SCHEMA → /settings 设置面板
 *   - BUILTIN_SLASH_COMMANDS          → /命令 自动补全与帮助文本
 *
 * 原理：这些对象虽声明了 `as const` / `ReadonlyArray`（TypeScript 只读），
 * 但运行时 JavaScript 不会调用 Object.freeze()，对象及其属性仍然是可变的。
 * ES Module 导出的是引用而非值拷贝，修改属性后所有持有引用的代码都能看到变化。
 *
 * 风险：依赖 OMP 内部模块结构（settings-schema.ts、slash-commands/builtin-registry.ts），
 * 大版本更新后可能需要更新翻译表。未翻译的条目会保留英文原文。
 */
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import { TAB_METADATA, SETTINGS_SCHEMA } from "@oh-my-pi/pi-coding-agent/config/settings-schema";
import { BUILTIN_SLASH_COMMANDS } from "@oh-my-pi/pi-coding-agent/slash-commands/builtin-registry";

// ═══════════════════════════════════════════════════════════════════════════
// Tab 标签翻译
// ═══════════════════════════════════════════════════════════════════════════

export const TAB_ZH: Record<string, string> = {
	appearance: "外观",
	model: "模型",
	interaction: "交互",
	context: "上下文",
	memory: "记忆",
	files: "Files",
	shell: "Shell",
	tools: "工具",
	tasks: "任务",
	providers: "服务商",
};

// ═══════════════════════════════════════════════════════════════════════════
// 设置项翻译：{ path: { label, description } }
// ═══════════════════════════════════════════════════════════════════════════

export const SETTINGS_ZH: Record<string, { label: string; description: string }> = {
	"autoResume": {
		label: "自动恢复会话",
		description: "在当前目录下自动恢复最近的会话",
	},
	"power.sleepPrevention": {
		label: "防止休眠",
		description: "在活动会话期间防止 macOS 休眠。每个级别是累积的 — 叠加所有更低级别的标志",
	},
	"advisor.enabled": {
		label: "启用顾问",
		description: "配置第二个模型（分配 'advisor' 角色），被动审查每一轮对话并注入建议",
	},
	"prewalk.enabled": {
		label: "启用 Prewalk",
		description: "在活动模型上启动，计划提示的待办列表存在后，在首次 edit/write 时切换到快速/廉价模型（默认 'smol' 角色）——由强模型规划、提交待办并开始实现后再交接。可用 --prewalk / --no-prewalk 按会话覆盖",
	},
	"advisor.syncBacklog": {
		label: "顾问同步积压",
		description: "当顾问落后指定轮次时，暂停主代理最多 30 秒以等待追赶。关闭表示禁用追赶延迟",
	},
	"advisor.immuneTurns": {
		label: "顾问免疫轮数",
		description: "顾问关注/阻塞器中断后，后续在指定轮数内不中断",
	},
	"git.enabled": {
		label: "启用 Git 集成",
		description: "在 TUI 中显示 Git 分支、状态和 PR 信息，并监控仓库元数据",
	},
	"providers.maxInFlightRequests": {
		label: "最大并发请求数",
		description: "每个服务商 id（例如 \"openai\" 或 \"anthropic\"）的最大并发 LLM 请求数，在使用相同配置根的本地 OMP 进程间共享。未列出的服务商不限制",
	},
	"providers.openai-codex.codeMode": {
		label: "Codex 代码模式",
		description: "将 Codex code_mode_only 模型（GPT-5.6）经由 eval 路由。直接工具为 eval/ask/todo/yield/think/checkpoint/rewind，其余会话工具从 eval 单元中调用。与 codex-rs 的 Code Mode 对齐。'auto' 跟随模型目录标记",
	},
	"providers.openai-codex.codeModeDirectTools": {
		label: "Codex 代码模式直接工具",
		description: "Codex 代码模式的额外直接工具。标准直接工具为 eval/ask/todo/yield/think/checkpoint/rewind",
	},
	"providers.cacheRetention": {
		label: "提示词缓存保留",
		description: "转发给支持该能力的服务商的提示词缓存保留策略（Anthropic、Bedrock、OpenRouter、OpenAI）",
	},
	"modelRoleStorage": {
		label: "模型角色存储",
		description: "模型选择器角色分配的保存位置",
	},
	"theme.dark": {
		label: "暗色主题",
		description: "终端深色背景时使用的主题",
	},
	"theme.light": {
		label: "亮色主题",
		description: "终端浅色背景时使用的主题",
	},
	"symbolPreset": {
		label: "符号样式",
		description: "图标/符号风格",
	},
	"colorBlindMode": {
		label: "色盲模式",
		description: "使用蓝色代替绿色显示 diff 新增行",
	},
	"composer.shape": {
		label: "输入区布局",
		description: "输入编辑器与状态行的视觉布局",
	},
	"statusLine.preset": {
		label: "状态栏预设",
		description: "预置的状态栏配置",
	},
	"statusLine.separator": {
		label: "状态栏分隔符",
		description: "状态栏段落之间的分隔符样式",
	},
	"statusLine.sessionAccent": {
		label: "会话主题色",
		description: "使用会话名称颜色作为编辑器边框和状态栏间隔色",
	},
	"statusLine.transparent": {
		label: "透明状态栏",
		description: "使用终端默认背景色而不是主题的 statusLineBg 作为状态栏背景。Powerline 端盖会被移除",
	},
	"statusLine.compactThinkingLevel": {
		label: "紧凑思考级别",
		description: "在模型名上以单个图标显示思考级别，而非单独的 ` · <级别>` 后缀",
	},
	"tools.artifactSpillThreshold": {
		label: "产物溢出阈值 (KB)",
		description: "工具输出超过此大小时保存为产物，尾部保留在内联中",
	},
	"tools.artifactTailBytes": {
		label: "产物尾部大小 (KB)",
		description: "输出溢出到产物时保留的尾部内容大小",
	},
	"tools.artifactHeadBytes": {
		label: "产物头部大小 (KB)",
		description: "输出溢出到产物时保留的头部内容（中部省略）。0 禁用",
	},
	"tools.outputMaxColumns": {
		label: "输出列上限",
		description: "流式工具输出和 read 的每行字节上限，超出部分省略",
	},
	"tools.artifactTailLines": {
		label: "产物尾部行数",
		description: "输出溢出到产物时保留的最大尾部行数",
	},
	"statusLine.showHookStatus": {
		label: "显示 Hook 状态",
		description: "在状态栏下方显示 Hook 状态消息",
	},
	"statusLine.contextLine": {
		label: "上下文响应线",
		description: "左右分段之间的那条线如何反映上下文用量（仅 box 布局）",
	},
	"terminal.showImages": {
		label: "内联显示图片",
		description: "在终端中内联渲染图片",
	},
	"images.autoResize": {
		label: "自动缩放图片",
		description: "将大图缩放至 2000x2000 以内，提高模型兼容性",
	},
	"images.blockImages": {
		label: "屏蔽图片",
		description: "阻止图片发送给 LLM 服务商",
	},
	"images.describeForTextModels": {
		label: "为文本模型描述图像",
		description: "当图像附加到不支持视觉的模型时，将其保存到 local:// 并注入来自支持视觉的模型的描述，而不是丢弃它",
	},
	"images.urls.enabled": {
		label: "图片以 URL 提供",
		description: "通过配置的后端链发布外发图片，向会抓取 URL 的服务商发送短链接而非内联 base64；全部后端或抓取失败时自动回退内联",
	},
	"images.urls.backends": {
		label: "图片 URL 后端",
		description: "发布图片供服务商访问时按序尝试的目标",
	},
	"images.urls.command": {
		label: "图片上传命令",
		description: "command 后端的 argv 模板；{file} 为图片路径，{mime}/{ext} 可选。取 stdout 打印的最后一个 URL（如 pasta -b -f {file}）",
	},
	"images.urls.publicBaseUrl": {
		label: "图片 URL 公开基址",
		description: "blob 服务之前的对外可达基址 URL（ssh 后端必填，direct 可选）",
	},
	"images.urls.ttlHours": {
		label: "图片 URL 有效期 (小时)",
		description: "本地托管图片 URL 的服务窗口，从会话最后一次发送起算；恢复会话按原链接重置窗口。0 表示链接在 broker 运行期间持续有效",
	},
	"images.urls.bindHost": {
		label: "图片 URL 绑定主机",
		description: "blob 服务绑定的主机；隧道用回环地址，直连服务用 0.0.0.0",
	},
	"images.urls.sshTarget": {
		label: "图片 URL SSH 目标",
		description: "ssh 反向转发的 user@host 目标",
	},
	"images.urls.sshRemotePort": {
		label: "图片 URL SSH 远程端口",
		description: "ssh 反向转发的远端监听端口，由你的 Web 服务器代理至此",
	},
	"terminal.showProgress": {
		label: "原生终端进度",
		description: "在代理或上下文维护运行时，发送 OSC 9;4 不确定进度信号",
	},
	"tui.textSizing": {
		label: "大标题 (Kitty)",
		description: "使用 Kitty 的 OSC 66 文本缩放协议，以 2 倍比例渲染 Markdown H1 标题。仅在 Kitty 终端上生效；其他地方忽略。默认关闭",
	},
	"tui.renderMermaid": {
		label: "渲染 Mermaid 图表",
		description: "将 Mermaid 围栏代码块渲染为 ASCII 图表",
	},
	"tui.codexResetFireworks": {
		label: "Codex 重置烟花",
		description: "以顶部三分之一区域的烟花叠加层庆祝计划外的 Codex 周用量重置和新存入的保存重置，按 Esc 关闭",
	},
	"tui.titleState": {
		label: "终端标题运行状态",
		description: "在终端标题的分隔符中显示代理运行状态——工作时为动画转圈（Windows 上为静态 ':'）、轮到你时为 '>'、代理等待你时为 '!'",
	},
	"tui.hyperlinks": {
		label: "终端超链接",
		description: "使用 OSC 8 超链接包装路径和 URL，实现终端原生点击打开（auto：检测支持；off：从不；always：无条件）",
	},
	"tui.tight": {
		label: "紧凑布局",
		description: "从终端输出的左右两侧删除 1 个字符的水平内边距",
	},
	"tui.resizeScrollback": {
		label: "调整尺寸时的滚动历史",
		description: "终端尺寸变化稳定后，如何刷新保留在终端滚动历史中的会话行",
	},
	"display.shimmer": {
		label: "加载动画",
		description: "工作/加载消息的动画样式",
	},
	"display.smoothStreaming": {
		label: "平滑流式输出",
		description: "在块到达时平滑显示助手文本和流式工具输入",
	},
	"display.hideToolActivity": {
		label: "隐藏工具活动",
		description: "在记录中隐藏模型发起的工具调用及其结果",
	},
	"display.showTokenUsage": {
		label: "显示 Token 用量",
		description: "在助手消息上显示每轮的 Token 用量",
	},
	"display.showTurnTime": {
		label: "显示轮次耗时",
		description: "在助手消息用量行上显示从提示到输出的总耗时（含工具调用）",
	},
	"display.cacheMissMarker": {
		label: "缓存未命中标记",
		description: "在请求丢失（未命中）提示词缓存的助手轮次之后显示分隔线",
	},
	"display.collapseCompacted": {
		label: "折叠压缩历史",
		description: "在实时记录中把压缩前的历史折叠到摘要分隔符之后；关闭则在每个压缩点保留带分隔符的完整内联记录",
	},
	"showHardwareCursor": {
		label: "硬件光标",
		description: "显示终端光标以支持输入法",
	},
	"tui.imeSafeCursor": {
		label: "输入法安全布局",
		description: "将提示的底框移到单独一行，使 macOS 输入法的预编辑文本无法将其挤位",
	},
	"spelling.typoDetection": {
		label: "拼写检查 (macOS)",
		description: "用当前 macOS 词典标记提示词中的拼写错误",
	},
	"spelling.autocomplete": {
		label: "单词自动补全 (macOS)",
		description: "将 macOS 词典的单词补全显示为行内提示，按 Tab 接受",
	},
	"spelling.autocorrect": {
		label: "自动纠错 (macOS)",
		description: "对完成的单词应用高置信度的 macOS 拼写纠正",
	},
	"defaultThinkingLevel": {
		label: "思考级别",
		description: "支持思考的模型的推理深度",
	},
	"hideThinkingBlock": {
		label: "隐藏思考块",
		description: "在助手回复中隐藏思考过程",
	},
	"proseOnlyThinking": {
		label: "纯文本思考摘要",
		description: "从思考摘要中省略代码块，并用省略号替代",
	},
	"omitThinking": {
		label: "省略思考摘要",
		description: "指示上游服务商在响应中完全省略思考摘要（在受支持的情况下）",
	},
	"externalThinking": {
		label: "外部思考",
		description: "私有草稿区；不显示给用户。禁用受支持的 GPT、Claude 和 Gemini 推理",
	},
	"model.loopGuard.enabled": {
		label: "循环防护",
		description: "为 Gemini 和 DeepSeek 模型启用自动流循环检测",
	},
	"model.loopGuard.checkAssistantContent": {
		label: "循环防护扫描文本",
		description: "除思考日志外，对助手文本消息也应用循环防护",
	},
	"model.loopGuard.toolCallReminder": {
		label: "循环防护工具调用提醒",
		description: "当 Gemini 推理流发出许多连续的规划标头而未调用工具时，中断它并注入一条提醒以发起工具调用（需要循环防护）",
	},
	"model.toolCallLoopGuard.enabled": {
		label: "工具调用循环防护",
		description: "检测跨轮次的连续相同工具调用并注入纠正引导",
	},
	"model.toolCallLoopGuard.threshold": {
		label: "工具调用循环阈值",
		description: "注入纠正引导前所需的连续相同工具调用次数",
	},
	"model.toolCallLoopGuard.exemptTools": {
		label: "工具调用循环豁免工具",
		description: "可连续重复而不会触发跨轮次循环防护的工具名称",
	},
	"inlineToolDescriptors": {
		label: "内联工具描述符",
		description: "在系统提示词中渲染完整的工具描述符，并从服务商工具 schema 中剥离顶层/嵌套描述，使描述符文本只发送一次。Auto 对 Gemini 模型启用此功能，对其他模型禁用",
	},
	"includeModelInPrompt": {
		label: "在提示中包含模型",
		description: "在系统提示中显示当前活动模型标识符，使代理知道它正在使用哪个模型",
	},
	"includeWorkspaceTree": {
		label: "包含工作区目录树",
		description: "在系统提示词中渲染工作区目录树。警告：当文件被修改时，这可能破坏跨会话的提示词缓存",
	},
	"workspace.additionalDirectories": {
		label: "额外工作区目录",
		description: "作为附加根目录添加到每个会话的额外工作区目录（多根工作区）。通过 /add-dir 和 /remove-dir 实时管理。路径相对于 cwd 解析；建议使用绝对路径。代理会被告知这些根目录的存在，并可读取/搜索/glob 它们",
	},
	"personality": {
		label: "人格",
		description: "注入系统提示词人格块的沟通风格",
	},
	"temperature": {
		label: "温度",
		description: "采样温度（0 = 确定性，1 = 创造性，-1 = 服务商默认）",
	},
	"topP": {
		label: "Top P",
		description: "核采样截断值（0-1，-1 = 服务商默认）",
	},
	"topK": {
		label: "Top K",
		description: "从概率最高的 K 个 token 中采样（-1 = 服务商默认）",
	},
	"minP": {
		label: "Min P",
		description: "最低概率阈值（0-1，-1 = 服务商默认）",
	},
	"presencePenalty": {
		label: "存在惩罚",
		description: "引入已存在 token 的惩罚（-1 = 服务商默认）",
	},
	"repetitionPenalty": {
		label: "重复惩罚",
		description: "重复 token 的惩罚（-1 = 服务商默认）",
	},
	"textVerbosity": {
		label: "文本详细度",
		description: "OpenAI Responses 和 Codex 的响应详细度（低、中或高）",
	},
	"tier.openai": {
		label: "服务层级 — OpenAI",
		description: "OpenAI / OpenAI-Codex 请求以及经 OpenRouter 路由的 OpenAI 系列模型的处理层级（none = 省略）。以 `service_tier` 发送",
	},
	"tier.anthropic": {
		label: "服务层级 — Anthropic",
		description: "Claude 请求的处理层级。`priority` 在受支持的直连 Anthropic 模型上实现快速模式；在 Bedrock/Vertex Claude 和经 OpenRouter 时忽略",
	},
	"tier.google": {
		label: "服务层级 — Google",
		description: "Gemini（Google AI Studio + Vertex）请求以及经 OpenRouter 路由的 Google 系列模型的处理层级（none = 省略）。作为顶层 `serviceTier` 字段发送",
	},
	"tier.subagent": {
		label: "服务层级 — 子代理",
		description: "为派生的 task/eval 子代理设置的服务层级。Inherit = 匹配主代理实时的各家族层级（跟随 /fast）；选择一个值可应用到子代理模型所属的家族",
	},
	"tier.advisor": {
		label: "服务层级 — 顾问",
		description: "为顾问模型设置的服务层级。None = 标准处理；Inherit = 匹配主代理实时的各家族层级；选择一个值可应用到顾问模型的家族",
	},
	"retry.maxRetries": {
		label: "重试次数",
		description: "API 错误时的最大重试次数",
	},
	"retry.maxDelayMs": {
		label: "最大重试延迟",
		description: "重试之间的最大等待时间（毫秒）。当提供商要求我们等待比这更长的时间且没有凭据或模型回退成功时，请求会快速失败而不是休眠（例如 3 小时的 Anthropic 速率限制窗口）。设为 0 解除上限——让会话按服务商声明的配额重置时间自动恢复",
	},
	"retry.modelFallback": {
		label: "重试模型回退",
		description: "允许重试恢复切换到配置的回退模型",
	},
	"retry.usageAwareFallback": {
		label: "用量感知回退",
		description: "使用可靠的 coding-plan 配额报告，在硬性用量限制前优先选择同服务商账户，再使用配置的回退模型。普通配置的 API 密钥不参与",
	},
	"retry.usageReservePct": {
		label: "预留余量",
		description: "当 coding-plan 模型的剩余百分比低于此值时，视为接近上限。未知或未映射的用量保持主模型不变",
	},
	"retry.usageReservePolicy": {
		label: "预留策略",
		description: "当所有同服务商 coding-plan 账户都在预留余量内时的处理方式",
	},
	"retry.fallbackChains": {
		label: "重试回退链",
		description: "将模型角色、模型选择器（\"provider/model-id\"）或服务商通配符（\"provider/*\"）映射到有序回退选择器的 JSON 对象。面向模型的键在该模型/服务商处于活动状态时始终生效；\"provider/*\" 条目保留失败模型的 id 并更换服务商；带 id 前缀的通配符（如 \"openrouter/google/*\"）会为失败模型的裸 id 重新加前缀",
	},
	"retry.fallbackRevertPolicy": {
		label: "回退恢复策略",
		description: "使用备用模型后何时切回主模型",
	},
	"providers.anthropic.serverSideFallback": {
		label: "Anthropic 服务端回退 (Fable 5)",
		description: "当 Claude Fable 5 / Mythos 5 请求被 Anthropic 的安全分类器拦截时，在 Claude Opus 4.8 上服务端重试（Anthropic server-side-fallback-2026-06-01 beta）。需主动启用——关闭则为每个请求保留回退前的行为",
	},
	"steeringMode": {
		label: "消息插入模式",
		description: "Agent 工作时如何处理排队的消息",
	},
	"followUpMode": {
		label: "后续消息模式",
		description: "一轮完成后如何处理后续消息",
	},
	"interruptMode": {
		label: "中断模式",
		description: "插入消息何时中断工具执行",
	},
	"loop.mode": {
		label: "循环模式",
		description: "/loop 迭代之间在重新提交提示前执行的操作",
	},
	"doubleEscapeAction": {
		label: "双击 Esc 操作",
		description: "编辑器为空时连按两次 Esc 打开记录回退选择器",
	},
	"treeFilterMode": {
		label: "会话树过滤器",
		description: "打开会话树时使用的默认过滤模式",
	},
	"autocompleteMaxVisible": {
		label: "自动补全条目数",
		description: "自动补全下拉菜单的最大可见条目数 (3-20)",
	},
	"emojiAutocomplete": {
		label: "Emoji 自动补全",
		description: "从 `:name:` 短代码建议 emoji 并扩展文本表情符号，如 `:D` 或 `:-)`",
	},
	"paste.largeMenuThreshold": {
		label: "大粘贴菜单",
		description: "粘贴达到此行数时，提供菜单选择包裹为代码块、XML 或保存为文件",
	},
	"startup.quiet": {
		label: "安静启动",
		description: "跳过欢迎界面和启动状态消息",
	},
	"startup.showSplash": {
		label: "显示启动画面",
		description: "在正常交互式启动时显示完整的动画设置画面，而不重新运行设置。静默启动仍然会抑制它",
	},
	"startup.setupWizard": {
		label: "设置向导",
		description: "每个设置版本显示一次新添加的入门步骤",
	},
	"startup.checkUpdate": {
		label: "检查更新",
		description: "关闭后跳过更新检查",
	},
	"marketplace.autoUpdate": {
		label: "插件市场自动更新",
		description: "启动时检查插件更新（关闭/通知/自动）",
	},
	"startup.changelogMode": {
		label: "启动更新日志",
		description: "选择更新说明在启动时以摘要、完整详情还是隐藏方式显示",
	},
	"magicKeywords.enabled": {
		label: "魔术关键字",
		description: "为独立的 ultrathink、orchestrate 和 workflowz 关键字启用隐藏通知",
	},
	"magicKeywords.ultrathink": {
		label: "Ultrathink 关键字",
		description: "允许独立的 ultrathink 请求最大自动思考并附加其隐藏通知",
	},
	"magicKeywords.orchestrate": {
		label: "Orchestrate 关键字",
		description: "允许独立的 orchestrate 附加其隐藏的多代理编排通知",
	},
	"magicKeywords.workflow": {
		label: "Workflow 关键字",
		description: "允许独立的 workflowz 附加其隐藏的评估工作流通知",
	},
	"completion.notify": {
		label: "完成通知",
		description: "Agent 完成任务时发送通知",
	},
	"error.notify": {
		label: "错误通知",
		description: "代理因错误停止时发送通知",
	},
	"ask.timeout": {
		label: "询问超时",
		description: "超时后自动选择推荐选项（0 表示禁用）",
	},
	"ask.notify": {
		label: "询问通知",
		description: "Ask 工具等待用户输入时发送通知",
	},
	"recap.enabled": {
		label: "空闲回顾",
		description: "终端空闲后生成一段简短的 LLM 回顾，说明当前进度",
	},
	"recap.idleSeconds": {
		label: "空闲回顾延迟",
		description: "显示回顾前等待空闲的秒数",
	},
	"collab.relayUrl": {
		label: "中继 URL",
		description: "/collab 使用的继电器 (wss://host[:port])",
	},
	"collab.webUrl": {
		label: "Web 界面 URL",
		description: "/collab 链接使用的浏览器界面；留空时从 collab.relayUrl 推导；显式 http:// 仅限本地访问",
	},
	"collab.displayName": {
		label: "显示名称",
		description: "向其他协作用户显示的名称（默认：操作系统用户名）",
	},
	"share.serverUrl": {
		label: "共享服务器",
		description: "/share 使用的共享查看器/上传基地（加密 blob 上传 + 查看器；链接为 <base>/<id>#<key>）",
	},
	"share.store": {
		label: "共享存储",
		description: "/share 上传加密会话 blob 的目标位置",
	},
	"share.redactSecrets": {
		label: "共享密钥编辑",
		description: "在上传前对 /share 快照运行密钥混淆器（使用 secrets.* 配置）",
	},
	"stt.enabled": {
		label: "语音输入",
		description: "通过麦克风启用语音转文字输入",
	},
	"stt.modelName": {
		label: "语音识别模型",
		description: "本地设备语音识别模型。Parakeet TDT v3 是 SoTA 默认",
	},
	"stt.submitTrigger": {
		label: "语音输入提交触发",
		description: "选择语音听写何时自动提交：never（提交前手动编辑）、on-release（松开时提交 2+ 词）、on-release-or-full-sentence（松开时或检测到完整句子时）、on-submit-keyword（说\"提交\"时提交）",
	},
	"contextPromotion.enabled": {
		label: "自动上下文提升",
		description: "上下文溢出时提升到更大上下文模型而非压缩",
	},
	"extendedContext": {
		label: "扩展上下文",
		description: "对超出阈值后额外计费的模型启用 premium 长上下文窗口（如 GPT-5.6 1M 在 272K 以上输入按 2 倍计费）；关闭则封顶在标准计价窗口",
	},
	"update.channel": {
		label: "更新通道",
		description: "omp update 与启动时更新检查所用的更新通道",
	},
	"compaction.enabled": {
		label: "自动压缩",
		description: "上下文过大时自动压缩",
	},
	"compaction.methodOrder": {
		label: "压缩方法顺序",
		description: "自动上下文维护的首选回退顺序；不可用或失败的方法顺延到下一项",
	},
	"compaction.asyncEnabled": {
		label: "异步压缩",
		description: "上下文接近压缩阈值时在后台预先生成摘要，越过阈值后将就绪结果拼接插入",
	},
	"compaction.midTurnEnabled": {
		label: "轮次中途压缩",
		description: "在下一个服务商请求之前，于安全的轮次中途工具循环边界处检查阈值",
	},
	"compaction.thresholdPercent": {
		label: "压缩阈值",
		description: "上下文维护的百分比阈值；设为默认则使用传统预留机制",
	},
	"compaction.thresholdTokens": {
		label: "压缩 Token 限额",
		description: "固定的上下文维护 Token 限额；设置后覆盖百分比阈值",
	},
	"compaction.handoffSaveToDisk": {
		label: "保存交接文档",
		description: "将自动交接生成的文档保存为 Markdown 文件",
	},
	"compaction.remoteStreamingV2Enabled": {
		label: "远程压缩 V2",
		description: "为兼容的远程压缩模型使用 Responses 流式压缩",
	},
	"compaction.idleEnabled": {
		label: "空闲压缩",
		description: "空闲时当 Token 数超过阈值时自动压缩",
	},
	"compaction.idleThresholdTokens": {
		label: "空闲压缩阈值",
		description: "触发空闲压缩的 Token 数量",
	},
	"compaction.idleTimeoutSeconds": {
		label: "空闲压缩延迟",
		description: "空闲多少秒后触发压缩",
	},
	"compaction.supersedeReads": {
		label: "覆盖过时的读取",
		description: "当再次读取同一文件时，修剪较旧的读取结果（感知缓存，每轮运行）",
	},
	"compaction.dropUseless": {
		label: "省略无用的结果",
		description: "一旦消费，修剪被上下文标记为无用的工具结果（无匹配、超时等待）（感知缓存）",
	},
	"snapcompact.systemPrompt": {
		label: "Snapcompact 系统提示",
		description: "实验性：将选定的系统提示渲染为密集 PNG 图像并附加（仅视觉模型）",
	},
	"snapcompact.toolResults": {
		label: "Snapcompact 工具结果",
		description: "实验性：将大型历史工具结果渲染为密集的 PNG 图像而不是文本（仅限视觉模型）。在累积的读取/搜索输出上节省 token",
	},
	"tools.format": {
		label: "工具调用模式",
		description: "控制工具如何暴露给模型。Auto 使用提供商原生工具调用",
	},
	"snapcompact.shape": {
		label: "Snapcompact 形状",
		description: "Snapcompact 打印文本的帧形状（压缩归档和内联图像）",
	},
	"branchSummary.enabled": {
		label: "分支摘要",
		description: "离开分支时自动生成摘要",
	},
	"memory.backend": {
		label: "记忆后端",
		description: "关闭、本地摘要管线、Mnemopi SQLite、Hindsight 远程记忆或 Sharpshooter",
	},
	"sharpshooter.model": {
		label: "Sharpshooter 模型",
		description: "抽取/整合所用模型选择器，留空 = smol 角色",
	},
	"autolearn.enabled": {
		label: "自动学习（实验性）",
		description: "代理停止后，提示它捕获经验到内存并创建/增强隔离的托管技能",
	},
	"autolearn.autoContinue": {
		label: "停止时自动运行捕获",
		description: "打开时，在停止时自动运行一次私有捕获轮（使用额外 token）。关闭时仅保留既有的自动学习引导",
	},
	"mnemopi.dbPath": {
		label: "Mnemopi 数据库路径",
		description: "可选的 SQLite 数据库路径。默认为代理内存目录",
	},
	"mnemopi.bank": {
		label: "Mnemopi 银行",
		description: "可选的共享银行基本名称。每个项目模式从中派生项目本地银行",
	},
	"mnemopi.scoping": {
		label: "Mnemopi 范围",
		description: "global=共享库；per-project=按项目隔离；per-project-tagged=项目本地+全局召回",
	},
	"mnemopi.embeddingVariant": {
		label: "嵌入变体",
		description: "本地嵌入模型系列。en=英文模型；multilingual=跨语言模型",
	},
	"mnemopi.autoRecall": {
		label: "Mnemopi 自动召回",
		description: "将本地内存召回到每个会话的第一轮",
	},
	"mnemopi.autoRetain": {
		label: "Mnemopi 自动保留",
		description: "将已完成的对话轮次保留到本地 Mnemopi 内存",
	},
	"mnemopi.polyphonicRecall": {
		label: "Mnemopi 多声部召回",
		description: "启用 4 声部召回（向量、图、事实、时间），融合倒数排名融合",
	},
	"mnemopi.enhancedRecall": {
		label: "Mnemopi 增强召回",
		description: "为重复和相似的召回查询启用分层查询结果缓存",
	},
	"mnemopi.proactiveLinking": {
		label: "Mnemopi 主动链接",
		description: "在新记忆存储时将其摄入情节图，并将其链接到相关实体和记忆",
	},
	"mnemopi.noEmbeddings": {
		label: "Mnemopi 禁用嵌入",
		description: "强制确定性的仅 FTS 召回而不是向量嵌入",
	},
	"mnemopi.embeddingModel": {
		label: "Mnemopi 嵌入模型",
		description: "高级：覆盖变体的显式嵌入模型 ID。留空以使用 mnemopi.embeddingVariant",
	},
	"mnemopi.embeddingApiUrl": {
		label: "Mnemopi 嵌入 API URL",
		description: "传递给 Mnemopi 的可选 OpenAI 兼容嵌入端点",
	},
	"mnemopi.embeddingApiKey": {
		label: "Mnemopi 嵌入 API 密钥",
		description: "传递给 Mnemopi 的可选嵌入 API 密钥",
	},
	"mnemopi.llmMode": {
		label: "Mnemopi LLM 模式",
		description: "不使用 LLM、使用在线微型模型（/models 的 TINY 角色，否则 pi/smol）、或远程 OpenAI 兼容端点",
	},
	"mnemopi.llmBaseUrl": {
		label: "Mnemopi LLM 基础 URL",
		description: "Mnemopi 远程模式的可选 OpenAI 兼容 LLM 端点",
	},
	"mnemopi.llmApiKey": {
		label: "Mnemopi LLM API 密钥",
		description: "Mnemopi 远程模式的可选 LLM API 密钥",
	},
	"mnemopi.llmModel": {
		label: "Mnemopi LLM 模型",
		description: "Mnemopi 远程模式的可选 LLM 模型名称",
	},
	"hindsight.apiUrl": {
		label: "Hindsight API 地址",
		description: "Hindsight 服务器地址（云服务或自托管）",
	},
	"hindsight.apiToken": {
		label: "Hindsight API 令牌",
		description: "用于已认证 Hindsight 服务器的 Bearer 令牌",
	},
	"hindsight.bankId": {
		label: "Hindsight 记忆库 ID",
		description: "记忆库标识符（默认：项目名称）",
	},
	"hindsight.scoping": {
		label: "Hindsight 作用域",
		description: "全局 = 共享库；按项目 = 独立库；按项目(标签) = 共享库+项目标签",
	},
	"hindsight.autoRecall": {
		label: "Hindsight 自动召回",
		description: "每个会话的第一轮自动召回记忆",
	},
	"hindsight.autoRetain": {
		label: "Hindsight 自动保留",
		description: "每 N 轮和会话边界自动保留对话记录",
	},
	"hindsight.retainMode": {
		label: "Hindsight 保留模式",
		description: "full-session = 每会话更新一个文档，last-turn = 按轮次切片",
	},
	"hindsight.mentalModelsEnabled": {
		label: "Hindsight 心智模型",
		description: "启动时将策划的反思摘要读入开发者指令",
	},
	"hindsight.mentalModelAutoSeed": {
		label: "Hindsight 心智模型自动种子",
		description: "会话开始时自动创建内置心智模型种子",
	},
	"ttsr.enabled": {
		label: "TTSR 流式规则",
		description: "输出匹配模式时中断 Agent（时空穿越流式规则）",
	},
	"ttsr.contextMode": {
		label: "TTSR 上下文模式",
		description: "TTSR 触发时对部分输出的处理方式",
	},
	"ttsr.interruptMode": {
		label: "TTSR 中断模式",
		description: "何时中断流式输出 vs 完成后注入警告",
	},
	"ttsr.repeatMode": {
		label: "TTSR 重复模式",
		description: "规则的重复方式：每会话一次或间隔消息后可再次触发",
	},
	"ttsr.repeatGap": {
		label: "TTSR 重复间隔",
		description: "规则再次触发前需要的消息数",
	},
	"ttsr.builtinRules": {
		label: "内置规则",
		description: "加载代理附带的默认规则（使用 ttsr.disabledRules 单独覆盖）",
	},
	"ttsr.disabledRules": {
		label: "禁用的规则",
		description: "完全忽略的规则名称（适用于捆绑的默认规则和您自己的规则）",
	},
	"edit.mode": {
		label: "编辑模式",
		description: "选择编辑工具变体（replace、patch、hashline、vim 或 apply_patch）",
	},
	"edit.fuzzyMatch": {
		label: "模糊匹配",
		description: "接受高置信度的空白差异模糊匹配",
	},
	"edit.fuzzyThreshold": {
		label: "模糊匹配阈值",
		description: "模糊匹配的相似度阈值",
	},
	"edit.streamingAbort": {
		label: "预览失败时中止",
		description: "补丁预览失败时中止流式编辑工具调用",
	},
	"edit.blockAutoGenerated": {
		label: "屏蔽自动生成文件",
		description: "阻止编辑看起来是自动生成的文件（protoc、sqlc、swagger 等）",
	},
	"edit.enforceSeenLines": {
		label: "强制已见行防护",
		description: "拒绝锚定在先前 read/search 从未完整显示的行上的编辑",
	},
	"edit.blackbox.enabled": {
		label: "记录解析回归",
		description: "当编辑引入 AST 解析失败时，追加完整的修改前/后源码",
	},
	"edit.autoRepair.enabled": {
		label: "自动修复解析回归",
		description: "编辑破坏文件 AST 解析时，让 smol 模型修复受损区域（重新解析校验；失败则退为警告）",
	},
	"edit.recoverInlineEdits": {
		label: "恢复内联编辑载荷",
		description: "把模型以纯文本形式输出的编辑载荷转换为 edit 工具调用并执行",
	},
	"readLineNumbers": {
		label: "行号显示",
		description: "默认在 read 工具输出中显示行号",
	},
	"read.defaultLimit": {
		label: "默认读取行数",
		description: "Agent 调用 read 未指定限制时的默认行数",
	},
	"read.renderMarkdown": {
		label: "Markdown 预览",
		description: "将 Markdown 读取结果渲染为格式化的终端 Markdown 预览，而非原始源码",
	},
	"read.summarize.enabled": {
		label: "代码摘要",
		description: "read 工具未指定选择器时返回结构化代码摘要",
	},
	"read.summarize.prose": {
		label: "文本摘要",
		description: "对 Markdown 和纯文本也返回结构化摘要",
	},
	"read.summarize.minBodyLines": {
		label: "摘要折叠行数",
		description: "多行代码体超过此行数时折叠显示",
	},
	"read.summarize.minCommentLines": {
		label: "注释折叠行数",
		description: "多行块注释超过此行数时折叠显示",
	},
	"read.summarize.minTotalLines": {
		label: "读取摘要最小文件长度",
		description: "总行数较少的文件将被逐字读取，而不是结构化摘要",
	},
	"read.summarize.unfoldUntil": {
		label: "读取摘要展开目标",
		description: "BFS 展开可省略的跨度，直到摘要至少具有指定的可见行数。0 仅保留最外层的省略",
	},
	"read.summarize.unfoldLimit": {
		label: "读取摘要展开上限",
		description: "BFS 展开期间摘要大小的硬上限。跳过其显示行将超过此限制的展开（该跨度保持折叠），并继续展开剩余的跨度",
	},
	"read.toolResultPreview": {
		label: "内联读取预览",
		description: "在对话流中直接渲染 read 工具结果而非摘要行",
	},
	"lsp.enabled": {
		label: "LSP 语言服务",
		description: "启用 LSP 工具进行语言服务协议交互",
	},
	"lsp.lazy": {
		label: "延迟 LSP 启动",
		description: "在首次使用时（lsp 工具或编辑匹配的文件类型）而不是在会话启动时启动语言服务器",
	},
	"lsp.shared": {
		label: "共享语言服务器",
		description: "通过守护进程代理在每个项目中跨 omp 实例共享一个语言服务器（不可用时回退到私有服务器）",
	},
	"lsp.formatOnWrite": {
		label: "写入时格式化",
		description: "写入代码文件后使用 LSP 自动格式化",
	},
	"lsp.diagnosticsOnWrite": {
		label: "写入时诊断",
		description: "写入代码文件后返回 LSP 诊断信息",
	},
	"lsp.diagnosticsOnEdit": {
		label: "编辑时诊断",
		description: "编辑代码文件后返回 LSP 诊断信息",
	},
	"lsp.diagnosticsDeduplicate": {
		label: "诊断去重",
		description: "抑制已为文件显示的编辑后 LSP 诊断；仅显示新的或更改的诊断",
	},
	"bash.enabled": {
		label: "Bash",
		description: "启用 bash 工具以执行 shell 命令",
	},
	"bash.autoBackground.enabled": {
		label: "Bash 自动后台",
		description: "自动将长时间运行的 Bash 命令转为后台执行并延迟返回结果",
	},
	"bash.patterns": {
		label: "Bash 批准规则",
		description: "有序的 bash 命令批准规则。每项包含 match 和 approval 字段；仅支持 '*' 通配符",
	},
	"bashInterceptor.enabled": {
		label: "Bash 命令拦截",
		description: "阻止应使用专用工具的 Shell 命令",
	},
	"bash.direnv": {
		label: "direnv 自动加载",
		description: "将仓库的 direnv/devenv `.envrc` 自动加载到 bash 会话中，无需手动 `direnv exec` 即可使用 devenv 工具和环境变量。遵循 direnv 的允许列表：未 `direnv allow` 过的 `.envrc` 永不执行",
	},
	"bash.direnvLoadTimeoutMs": {
		label: "direnv 加载超时 (ms)",
		description: "首次 `direnv export` 的最长等待时间（冷启动的 devenv shell 可能较慢）；超时后会话在没有 direnv 环境的情况下运行",
	},
	"shellMinimizer.enabled": {
		label: "Shell 输出精简",
		description: "压缩冗长的 Shell 输出（git、npm、cargo 等）后再返回给 Agent",
	},
	"shellMinimizer.sourceOutlineLevel": {
		label: "Shell Minimizer 源大纲",
		description: "源文件 cat/read 的源大纲模式：default 或 aggressive",
	},
	"eval.py": {
		label: "Eval: Python 后端",
		description: "允许 eval 工具调度到 IPython 内核",
	},
	"eval.js": {
		label: "Eval: JavaScript 后端",
		description: "允许 eval 工具调度到进程内 JavaScript 运行时",
	},
	"eval.rb": {
		label: "Eval: Ruby 后端",
		description: "允许 eval 工具调度到持久 Ruby 内核",
	},
	"eval.jl": {
		label: "Eval: Julia 后端",
		description: "允许 eval 工具调度到持久 Julia 内核",
	},
	"eval.autoBackground.enabled": {
		label: "Eval 自动后台化",
		description: "长时间运行的 eval 单元自动转入后台，结果稍后送达",
	},
	"python.kernelMode": {
		label: "Python 内核模式",
		description: "是否在调用间保持 IPython 内核存活",
	},
	"python.interpreter": {
		label: "Python 解释器",
		description: "精确 Python 可执行文件的可选路径。设置后，将跳过自动 Python 运行时发现",
	},
	"ruby.interpreter": {
		label: "Ruby 解释器",
		description: "指向确切 Ruby 可执行文件的可选路径。设置后，将跳过自动 Ruby 运行时发现",
	},
	"julia.interpreter": {
		label: "Julia 解释器",
		description: "指向确切 Julia 可执行文件的可选路径。设置后，将跳过自动 Julia 运行时发现",
	},
	"tools.approval": {
		label: "工具批准策略",
		description: "按工具批准策略。设置为 'allow' 以自动批准，'prompt' 以要求确认，或 'deny' 以阻止。在每个批准模式下都会遵守覆盖",
	},
	"tools.approvalMode": {
		label: "工具审批",
		description: "工具调用的默认审批行为。Always ask 仅自动批准只读工具",
	},
	"todo.enabled": {
		label: "任务列表",
		description: "启用 todo_write 工具进行任务追踪",
	},
	"todo.reminders": {
		label: "任务提醒",
		description: "在 Agent 停止前提醒完成任务",
	},
	"todo.remindersMax": {
		label: "任务提醒上限",
		description: "放弃前最多的任务提醒次数",
	},
	"todo.eager": {
		label: "自动创建任务列表",
		description: "首条消息后推动自动创建任务列表的强度",
	},
	"glob.enabled": {
		label: "Glob",
		description: "启用 glob 工具进行基于 glob 的文件查找",
	},
	"grep.enabled": {
		label: "Grep",
		description: "启用 grep 工具进行正则表达式内容搜索",
	},
	"grep.contextBefore": {
		label: "Grep 前文行数",
		description: "每个 grep 匹配项之前显示的上下文行数",
	},
	"grep.contextAfter": {
		label: "Grep 后文行数",
		description: "每个 grep 匹配项之后显示的上下文行数",
	},
	"astGrep.enabled": {
		label: "AST 结构搜索",
		description: "启用 ast_grep 工具进行结构化 AST 搜索",
	},
	"astEdit.enabled": {
		label: "AST 结构编辑",
		description: "启用 ast_edit 工具进行结构化 AST 重写",
	},
	"debug.enabled": {
		label: "调试器",
		description: "启用 debug 工具进行 DAP 调试",
	},
	"launch.enabled": {
		label: "Launch",
		description: "启用 launch 工具来监督共享的长期项目进程（监控、日志、交互输入/信号）。支持 .omp/launch-registry.json 中定义的进程",
	},
	"speechgen.enabled": {
		label: "语音生成",
		description: "启用 tts 工具以进行设备上 (Kokoro) 或 xAI Grok Voice 语音文件合成",
	},
	"generate_image.enabled": {
		label: "生成图片",
		description: "启用 generate_image 工具（文本生成图片及编辑）。当 tools.xdev 开启时作为 xd:// 设备暴露。支持 `resolution` `mode` `background` 参数。根据 providers.image 选择服务商（black-forest-labs/flux 为默认；OpenAI DALL·E 也受支持）",
	},
	"inspect_image.mode": {
		label: "图片理解",
		description: "控制 inspect_image 工具，该工具将图像理解委托给支持视觉的模型。'auto' 仅在活动模型缺少原生图像输入时暴露；'on' 始终暴露；'off' 从不暴露",
	},
	"computer.enabled": {
		label: "Computer",
		description: "启用可编程的主机桌面控制工具（截图、输入、无障碍功能）",
	},
	"computer.display": {
		label: "Computer 显示器",
		description: "all 合成所有显示器为单平面流；id 选择原生显示器 id（例如\"0\"、\"1\"）",
	},
	"computer.maxWidth": {
		label: "Computer 截图宽度",
		description: "合成截图的最大宽度（像素；默认 1920）",
	},
	"computer.maxHeight": {
		label: "Computer 截图高度",
		description: "合成截图的最大高度（像素；默认 1080）",
	},
	"inspect_image.timeoutMs": {
		label: "图片理解超时",
		description: "inspect_image 视觉模型调用的每次请求超时（毫秒）。停滞的服务商会快速以超时错误失败，而非阻塞到手动中止。设为 0 禁用超时",
	},
	"checkpoint.enabled": {
		label: "检查点/回退",
		description: "启用 checkpoint 和 rewind 工具进行上下文快照",
	},
	"fetch.enabled": {
		label: "读取 URL",
		description: "允许 read 工具获取并处理 URL 内容",
	},
	"vault.enabled": {
		label: "Obsidian Vault",
		description: "启用 vault:// 内部 URL 以通过 Obsidian CLI 读取和编辑 Obsidian vault 内容。禁用时，拒绝 vault:// 解析，并从系统提示中省略 vault:// 条目",
	},
	"github.enabled": {
		label: "GitHub CLI",
		description: "启用 github 工具（仓库、Issue、PR、Diff、搜索等操作）",
	},
	"github.cache.enabled": {
		label: "GitHub 查看缓存",
		description: "在 ~/.omp/cache/github-cache.db 中缓存渲染的 issue/PR 查看输出，以便重复读取是免费的",
	},
	"github.cache.softTtlSec": {
		label: "GitHub 缓存软 TTL",
		description: "在此窗口内，缓存的 issue/PR 查看行将直接返回（秒；默认 5 分钟）",
	},
	"github.cache.hardTtlSec": {
		label: "GitHub 缓存硬 TTL",
		description: "超过软 TTL 后，缓存的行将被返回并在后台刷新；超过硬 TTL 后，它将被丢弃（秒；默认 7 天）",
	},
	"web_search.enabled": {
		label: "网页搜索",
		description: "启用 web_search 工具进行网页搜索",
	},
	"security.enabled": {
		label: "安全扫描",
		description: "启用 OMP 原生安全扫描的计划、执行，以及只读 security:// 资源命名空间",
	},
	"ask.enabled": {
		label: "询问",
		description: "启用 ask 工具进行交互式用户提问",
	},
	"browser.enabled": {
		label: "浏览器",
		description: "启用 browser 工具（Ulixee Hero）",
	},
	"browser.cdpUrl": {
		label: "浏览器 CDP URL",
		description: "默认的 HTTP CDP 发现端点（例如 http://127.0.0.1:9222），用于附加浏览器而非启动新实例。工具调用时显式指定的 app.cdp_url 或 app.path 优先",
	},
	"browser.relay": {
		label: "浏览器中继",
		description: "通过 omp 浏览器中继驱动你自己的 Chrome 标签页。安装一次扩展（`omp browser-relay install`）；浏览器工具需要时中继服务器自动启动。优先于浏览器 CDP URL；设置 PI_BROWSER_RELAY=0 或 PI_BROWSER_RELAY=1 以覆盖",
	},
	"browser.relayUrl": {
		label: "浏览器中继 URL",
		description: "omp 浏览器中继端点（默认 http://127.0.0.1:9224）",
	},
	"browser.headless": {
		label: "无头浏览器",
		description: "以无头模式启动浏览器（关闭则显示浏览器界面）",
	},
	"browser.cmux": {
		label: "cmux 浏览器",
		description: "当 cmux 套接字可用时，使用 cmux WKWebView 表面进行浏览器自动化。设置 PI_BROWSER_CMUX=0 或 PI_BROWSER_CMUX=1 以覆盖",
	},
	"browser.screenshotDir": {
		label: "截图保存目录",
		description: "保存截图的目录。未设置时保存到临时文件。支持 ~",
	},
	"tools.intentTracing": {
		label: "意图追踪",
		description: "执行每个工具前让 Agent 描述调用意图",
	},
	"tools.abortOnFabricatedResult": {
		label: "对伪造工具结果中止",
		description: "使用带内工具调用时，当模型开始在中轮产生幻觉工具结果时立即停止模型。禁用可让模型完成生成并丢弃伪造的继续",
	},
	"tools.maxTimeout": {
		label: "最大工具超时",
		description: "Agent 可设置的最大工具超时秒数（0 = 无限制）",
	},
	"async.enabled": {
		label: "异步执行",
		description: "启用异步 Bash 命令和后台任务执行",
	},
	"async.pollWaitDuration": {
		label: "最大轮询时间",
		description: "`hub` wait 监控后台任务、返回当前状态前的时长。固定值每次都等待该时长。`smart` 自适应：从 5 秒开始，连续等待时逐次延长（最长 5 分钟），约一分钟未等待后重置为 5 秒",
	},
	"irc.timeoutMs": {
		label: "IRC 超时",
		description: "hub 消息等待（及 send await:true）的默认超时（毫秒）；0 禁用超时",
	},
	"tools.xdev": {
		label: "xd:// 工具",
		description: "将很少使用的（可发现的）工具挂载到 xd:// 设备 URL 下，通过 read/write 驱动，而非在每次请求都附带其 schema。显式工具列表授予了 read 但未授予 write 的会话，经由仅限设备的写入通道挂载设备（文件系统写入仍被拒绝）。关闭则以顶层方式暴露每个已启用的工具",
	},
	"tools.xdevDocs": {
		label: "xd:// 提示文档",
		description: "选择在系统提示中内联哪些已挂载设备的文档和 schema。Built-ins 将核心工具保持内联，而 MCP 和扩展工具按需提供",
	},
	"tools.xdevInlineDevices": {
		label: "xd:// 内联设备",
		description: "当 xd:// 提示文档为 Built-ins Only 时，内联名称匹配这些 glob 模式的动态设备（例如 mcp__context_mode_*）。Catalog Only 忽略此项",
	},
	"mcp.enableProjectConfig": {
		label: "MCP 项目配置",
		description: "从项目根目录加载 .mcp.json/mcp.json",
	},
	"mcp.renderMarkdownResults": {
		label: "MCP Markdown 结果",
		description: "将非 JSON 的 MCP 文本结果在记录中渲染为 Markdown",
	},
	"mcp.notifications": {
		label: "MCP 更新注入",
		description: "将 MCP 资源更新注入 Agent 对话",
	},
	"mcp.notificationDebounceMs": {
		label: "MCP 通知防抖",
		description: "注入对话前的 MCP 资源更新通知防抖窗口",
	},
	"plan.enabled": {
		label: "计划模式",
		description: "启用计划模式，在执行前进行只读探索和规划",
	},
	"plan.defaultOnStartup": {
		label: "在计划模式下启动",
		description: "在每个新会话开始时自动进入计划模式",
	},
	"goal.enabled": {
		label: "目标模式",
		description: "启用每会话目标模式和隐藏的目标工具",
	},
	"goal.statusInFooter": {
		label: "页脚中的目标状态",
		description: "在状态行中的目标指示器旁边显示 token 预算",
	},
	"goal.continuationModes": {
		label: "目标继续模式",
		description: "运行活动目标可能在轮次之间自动继续的模式",
	},
	"title.refreshOnReplan": {
		label: "重新规划时刷新标题",
		description: "除非标题由用户设置，否则在 todo init 重新规划后刷新生成的会话标题",
	},
	"task.isolation.mode": {
		label: "隔离模式",
		description: "子 Agent 的隔离方式。auto 让 PAL 自动选择最佳后端（APFS/btrfs/ZFS 写时复制、Overlayfs/ProjFS 叠加等）",
	},
	"task.isolation.apply": {
		label: "应用隔离变更",
		description: "自动将成功的隔离任务变更应用到父检出；关闭以保留补丁或分支产物",
	},
	"task.isolation.merge": {
		label: "隔离合并策略",
		description: "隔离任务变更的合并方式（补丁应用或分支合并）",
	},
	"task.isolation.commits": {
		label: "隔离提交风格",
		description: "嵌套仓库变更的提交消息风格（通用或 AI 生成）",
	},
	"worktree.base": {
		label: "工作树基础目录",
		description: "代理管理工作树的基础目录 — 任务隔离副本、`github` PR 检出和 `omp worktree` 清理都在此目录。未设置时使用 ~/.omp/wt。必须是绝对路径或 ~ 相对路径；相对路径将被忽略。OMP_WORKTREE_DIR 环境变量可覆盖此项",
	},
	"task.eager": {
		label: "优先委派任务",
		description: "推动将工作委派给子 Agent 的强度",
	},
	"task.batch": {
		label: "批量任务调用",
		description: "将任务工具切换到其批量形状：一次调用携带 { context, tasks[] }——每项一个子代理，带可选的每项代理（默认为会话生成策略代理）、每项隔离，以及前置到每个分配的必需共享上下文。启用 async.enabled=true 时，每个生成作为具有正常空闲/停放生命周期的独立后台代理运行；否则调用阻塞以合并结果。禁用以恢复扁平单生成架构",
	},
	"task.enableEffort": {
		label: "每任务努力度",
		description: "在 task 生成时暴露可选的 effort 参数，允许调用者覆盖每个子代理的思考级别",
	},
	"task.maxConcurrency": {
		label: "最大并发任务",
		description: "子 Agent 的并发上限",
	},
	"task.enableLsp": {
		label: "子代理中的 LSP",
		description: "允许通过任务工具生成的子代理使用 lsp 工具。默认关闭以保持子代理便宜；当 LSP 感知委托值得额外的 token 时启用",
	},
	"task.maxRecursionDepth": {
		label: "最大任务递归深度",
		description: "子 Agent 可以生成自己的子 Agent 的递归层数",
	},
	"task.maxRuntimeMs": {
		label: "最大子 Agent 运行时",
		description: "每个子 Agent 的硬挂钟时间限制（毫秒）。0 禁用",
	},
	"task.agentIdleTtlMs": {
		label: "代理空闲 TTL",
		description: "空闲子代理在停放至磁盘之前在内存中保持活动的时间（毫秒）。停放代理在消息或恢复时自动恢复。0 表示保持空闲代理活动直到退出",
	},
	"task.softRequestBudget": {
		label: "子 Agent 软请求预算",
		description: "每个子代理的软请求预算（每次运行的助手请求数）。超过时注入收尾引导通知（见 task.softRequestBudgetNotice）；达到预算的 1.5 倍时运行被强制停止，代理必须让出其部分结果。0 禁用防护。捆绑的 scout/sonic 代理使用较低的内置预算上限，因此低于该上限的值仍适用于它们",
	},
	"task.softRequestBudgetNotice": {
		label: "软请求预算通知",
		description: "当子代理超过其软请求预算时注入一条引导通知，要求它在 1.5 倍强制停止前收尾",
	},
	"task.maxEffort": {
		label: "每次生成最大努力度",
		description: "task 工具每次生成的 effort 提示允许的最大推理努力度。较低的值阻止调用者将子代理提升到此上限以上；默认值保留模型的完整范围",
	},
	"task.prewalk": {
		label: "通用任务 Prewalk",
		description: "为捆绑的通用 task 子代理启用 prewalk：在它解析的模型上启动，规划并开始实现，然后在首次 edit/write 时交接给 'smol' 角色。每代理覆盖（task.agentPrewalk，在 /agents 中用 P 切换）和用户代理的 prewalk frontmatter 无论此开关如何都生效",
	},
	"tasks.todoClearDelay": {
		label: "任务自动清除延迟",
		description: "完成后/放弃的任务从列表移除前的等待时间",
	},
	"task.showResolvedModelBadge": {
		label: "显示已解析模型徽章",
		description: "在任务小部件状态行中显示每个子代理使用的实际模型 ID",
	},
	"skills.enableSkillCommands": {
		label: "技能命令",
		description: "将技能注册为 /skill:name 命令",
	},
	"commands.enableClaudeUser": {
		label: "Claude 用户命令",
		description: "从 ~/.claude/commands/ 加载命令",
	},
	"commands.enableClaudeProject": {
		label: "Claude 项目命令",
		description: "从 .claude/commands/ 加载命令",
	},
	"commands.enableOpencodeUser": {
		label: "OpenCode 用户命令",
		description: "从 ~/.config/opencode/commands/ 加载命令",
	},
	"commands.enableOpencodeProject": {
		label: "OpenCode 项目命令",
		description: "从 .opencode/commands/ 加载命令",
	},
	"secrets.enabled": {
		label: "隐藏密钥",
		description: "混淆配置的密钥，并在发送给 AI 服务商前隐藏凭据形态的令牌",
	},
	"providers.ollama-cloud.maxConcurrency": {
		label: "Ollama Cloud 最大并发数",
		description: "每个进程的最大并发 Ollama Cloud 子代理运行数；0 禁用此服务商专属限制",
	},
	"providers.webSearchOrder": {
		label: "网页搜索服务商顺序",
		description: "web_search 工具优先使用的服务商；未列出的服务商之后保留默认顺序",
	},
	"providers.webSearchExclude": {
		label: "排除的网页搜索提供商",
		description: "web_search 永远不应使用的提供商，即使作为回退",
	},
	"providers.webSearchTimeoutSeconds": {
		label: "网页搜索超时",
		description: "每个服务商搜索传输的硬超时秒数，超时后 web_search 切换到下一个回退（最大 300）",
	},
	"providers.webSearchGeminiModel": {
		label: "Gemini web_search 模型",
		description: "Gemini Google Search 接地所用的模型 ID。默认为 gemini-2.5-flash",
	},
	"providers.antigravityEndpoint": {
		label: "Antigravity 端点模式",
		description: "google-antigravity 提供商的端点路由策略",
	},
	"providers.imageOrder": {
		label: "图片服务商顺序",
		description: "图片生成优先使用的服务商；未列出的服务商跟随活动会话服务商和内置顺序",
	},
	"providers.fireworksTier": {
		label: "Fireworks 服务层级",
		description: "Fireworks 请求的分发路径。Priority 发送 `service_tier: \"priority\"`，在流量高峰期以更高价格换取更高可靠性；Standard 省略此项。Fast（`-fast`）模型忽略此项 — Fast 是独立的分发路径",
	},
	"live.voice": {
		label: "Live 语音",
		description: "Codex 支持的实时语音会话使用的音色",
	},
	"providers.tts": {
		label: "文本转语音提供商",
		description: "tts 工具后端：本地设备上神经 TTS (Kokoro-82M)、xAI Grok Voice 或 DeepInfra 语音",
	},
	"tts.localModel": {
		label: "本地 TTS 模型",
		description: "本地 TTS 后端使用的神经 TTS 模型 (Kokoro-82M)",
	},
	"tts.localVoice": {
		label: "本地 TTS 语音",
		description: "本地 TTS 后端使用的 Kokoro 语音",
	},
	"speech.enabled": {
		label: "语音语音化",
		description: "在流式传输时通过扬声器大声说出助手的输出",
	},
	"speech.mode": {
		label: "语音朗读模式",
		description: "朗读内容：all=消息+思考；assistant=仅消息；yield=仅最终消息",
	},
	"speech.enhanced": {
		label: "增强语音重写",
		description: "在合成前用 tiny/smol 模型将助手输出重写为自然的口语散文（描述代码、去掉链接和 markdown）。失败时回退到机械清理",
	},
	"speech.voice": {
		label: "语音朗读音色",
		description: "朗读 Agent 输出时使用的 Kokoro 语音",
	},
	"providers.tinyModel": {
		label: "微型模型",
		description: "会话标题模型：默认在线（/models 的 TINY 角色，否则 pi/smol），或本地设备模型",
	},
	"providers.tinyModelDevice": {
		label: "微型模型设备",
		description: "本地微型模型的 ONNX 执行提供商。默认仅 CPU 推理",
	},
	"providers.tinyModelDtype": {
		label: "微型模型精度",
		description: "本地微型模型的 ONNX 量化精度。默认使用模型自带 dtype (q4)",
	},
	"providers.memoryModel": {
		label: "记忆模型",
		description: "Mnemopi 事实提取和整合的 LLM：默认在线（/models 的 TINY 角色，否则 smol/remote），或本地设备模型",
	},
	"providers.autoThinkingModel": {
		label: "自动思考模型",
		description: "auto 思考级别的难度分类器：默认在线（/models 的 TINY 角色，否则 smol），或本地设备模型",
	},
	"providers.autoThinkingMaxEffort": {
		label: "自动思考上限",
		description: "`auto` 分类器可解析到的最高努力级别。`xhigh` 使分类器止步于最高级以下一层，只有显式 `ultrathink` 才能达到 `max`；`max` 允许分类器判定为异常的轮次在支持的模型上计入最高级别",
	},
	"features.unexpectedStopDetection": {
		label: "意外停止恢复",
		description: "助手在没有可见消息的情况下停止时自动恢复。Smart 档还会用小模型对纯文本停止做分类",
	},
	"providers.unexpectedStopModel": {
		label: "意外停止检测模型",
		description: "Smart 意外停止检测的分类器：默认在线（/models 的 TINY 角色，否则 smol），或本地设备模型。",
	},
	"providers.kimiApiFormat": {
		label: "Kimi API 格式",
		description: "Kimi Code 服务商的 API 格式",
	},
	"providers.openaiWebsockets": {
		label: "OpenAI WebSocket",
		description: "OpenAI Codex 模型的 WebSocket 策略",
	},
	"providers.streamFirstEventTimeoutSeconds": {
		label: "首事件流超时",
		description: "等待首个模型流事件的秒数；-1 使用服务商/环境默认值，0 禁用看门狗",
	},
	"providers.streamIdleTimeoutSeconds": {
		label: "流空闲超时",
		description: "模型流在事件之间可以保持静默的秒数；-1 使用服务商/环境默认值，0 禁用看门狗",
	},
	"providers.openrouterVariant": {
		label: "OpenRouter 路由",
		description: "追加到 OpenRouter 模型 ID 的路由变体后缀",
	},
	"providers.fetch": {
		label: "Fetch 提供商",
		description: "fetch/read URL 工具的读取后端优先级",
	},
	"codexResets.autoRedeem": {
		label: "Codex 自动兑换重置",
		description: "自动消费已保存的 Codex 限流重置额度：当某轮卡住且无其他账户可接管时，恢复被 5 小时或周窗口耗尽所阻塞的账户；并抢救即将过期的额度。unset 在首次消费前询问，yes 无需提示直接消费，no 禁用两项检查",
	},
	"codexResets.minBlockedMinutes": {
		label: "Codex 最小兑换间隔",
		description: "仅当自然解锁（即耗尽的 5 小时/周窗口中最晚的重置时间）至少还有这么多分钟时才自动兑换（不要为节省短暂等待而花费稀缺额度）。提高该值（如 360）可忽略仅 5 小时的阻塞",
	},
	"codexResets.keepCredits": {
		label: "Codex 兑换保留额度",
		description: "不低于此数量时不自动消费已保存的重置（0 = 最后一个额度也可能被自动消费）。即将过期的额度不受此限——保留的额度过期后什么也留不下",
	},
	"codexResets.salvageHorizonHours": {
		label: "Codex 重置抢救窗口",
		description: "当已保存的 Codex 重置额度将在这么多小时内过期、且任一聊天窗口（5 小时或周窗口）有值得恢复的使用量时，自动消费该额度（0 禁用过期抢救）",
	},
	"provider.appendOnlyContext": {
		label: "追加式上下文",
		description: "缓存系统提示和工具规格，保持追加式消息日志以利用前缀缓存",
	},
	"exa.enabled": {
		label: "Exa 搜索",
		description: "启用 Exa 网页搜索服务商",
	},
	"exa.searchDelayMs": {
		label: "Exa 搜索延迟",
		description: "Exa 网页搜索请求之间的最小延迟（毫秒）；设为 0 禁用节流",
	},
	"searxng.endpoint": {
		label: "SearXNG 端点",
		description: "自托管搜索服务的基础 URL",
	},
	"extensionHandlers.toolCallTimeoutMs": {
		label: "工具调用处理器超时 (ms)",
		description: "扩展 tool_call 处理器的活动工作超时（正有限值）；无效值使用 30000ms，等待 OMP 自有对话框的时间不计入",
	},
	"dev.autoqa": {
		label: "自动 QA",
		description: "自动化工具问题报告（xd://report_issue）。默认开启；首次报告会征求同意，拒绝后禁用报告直到显式重新启用",
	},
	"dev.autoqaPush.endpoint": {
		label: "自动 QA 推送端点",
		description: "接收 Auto QA JSON 报告的完整 URL（默认 https://qa.omp.sh/v1/grievances）",
	},
};

// ═══════════════════════════════════════════════════════════════════════════
// 选项翻译：{ path: { value: { label, description } } }
// 仅翻译通用选项（Off/On/Default 等），数值选项保留原文
// ═══════════════════════════════════════════════════════════════════════════

export const OPTION_ZH: Record<string, Record<string, { label?: string; description?: string }>> = {
	"power.sleepPrevention": {
		"off": { label: "关闭", description: "不防止任何休眠" },
		"idle": { label: "防止空闲休眠", description: "会话打开时保持系统唤醒 (caffeinate -i)" },
		"display": { label: "防止显示器休眠", description: "同时防止显示器空闲休眠 (caffeinate -i -d)" },
		"system": { label: "防止系统休眠", description: "同时在交流电源上阻止所有系统休眠并声明用户活跃 (caffeinate -i -d -s -u)" },
	},
	"modelRoleStorage": {
		"global": { label: "全局", description: "将角色模型保存在当前活动配置文件中（当前行为）" },
		"project": { label: "按项目", description: "将项目角色模型保存在 .omp/config.yml；缺失的项目角色使用全局默认" },
	},
	"symbolPreset": {
		"unicode": { label: "Unicode", description: "标准符号（默认）" },
		"nerd": { label: "Nerd Font", description: "需要 Nerd Font 字体" },
		"ascii": { label: "ASCII", description: "最大兼容性" },
	},
	"statusLine.preset": {
		"default": { label: "默认", description: "模型、路径、Git、上下文、Token、费用" },
		"minimal": { label: "精简", description: "仅路径和 Git" },
		"compact": { label: "紧凑", description: "模型、Git、费用、上下文" },
		"full": { label: "完整", description: "所有段落包括时间" },
		"nerd": { label: "Nerd", description: "最多信息，使用 Nerd Font 图标" },
		"ascii": { label: "ASCII", description: "不使用特殊字符" },
		"custom": { label: "自定义", description: "用户自定义段落" },
	},
	"statusLine.separator": {
		"powerline": { label: "Powerline", description: "实心箭头（Nerd Font）" },
		"powerline-thin": { label: "细箭头", description: "细箭头（Nerd Font）" },
		"slash": { label: "斜杠", description: "正斜杠" },
		"pipe": { label: "竖线", description: "竖线分隔" },
		"block": { label: "方块", description: "实心方块" },
		"none": { label: "无", description: "仅空格" },
		"ascii": { label: "ASCII", description: "大于号" },
	},
	"tools.outputMaxColumns": {
		"0": { label: "关闭", description: "没有每行限制" },
	},
	"display.shimmer": {
		"classic": { label: "经典", description: "横扫文本的柔和余弦波" },
		"kitt": { label: "KITT 扫描仪", description: "Knight Rider 1982 红光左右弹跳" },
		"disabled": { label: "禁用", description: "没有动画；静态静音文本" },
	},
	"defaultThinkingLevel": {
		"auto": { label: "auto", description: "每个提示自动检测（低–超高）" },
		"minimal": { label: "min", description: "非常简短的推理（~1k tokens）" },
		"low": { label: "low", description: "轻量推理（~2k tokens）" },
		"medium": { label: "medium", description: "中等推理（~8k tokens）" },
		"high": { label: "high", description: "深度推理（~16k tokens）" },
		"xhigh": { label: "xhigh", description: "最大推理（~32k tokens）" },
		"max": { label: "max", description: "模型支持的最大推理" },
	},
	"inlineToolDescriptors": {
		"auto": { label: "自动", description: "对 Gemini 模型内联描述符；其他模型保留在工具 schema 中" },
		"on": { label: "开", description: "始终在系统提示词中内联描述符" },
		"off": { label: "关", description: "仅将描述符保留在服务商工具 schema 中" },
	},
	"personality": {
		"default": { label: "默认", description: "简洁、证据优先的工程师；密集、以行动为导向的回复" },
		"friendly": { label: "友好", description: "温暖、鼓励的协作者，专注于动力和士气" },
		"pragmatic": { label: "实用", description: "直接、高效的工程师，专注于清晰和严谨" },
		"none": { label: "无", description: "完全省略个性块" },
	},
	"temperature": {
		"-1": { label: "默认", description: "使用服务商默认值" },
	},
	"topP": {
		"-1": { label: "默认", description: "使用服务商默认值" },
	},
	"topK": {
		"-1": { label: "默认", description: "使用服务商默认值" },
	},
	"minP": {
		"-1": { label: "默认", description: "使用服务商默认值" },
	},
	"presencePenalty": {
		"-1": { label: "默认", description: "使用服务商默认值" },
	},
	"repetitionPenalty": {
		"-1": { label: "默认", description: "使用服务商默认值" },
	},
	"textVerbosity": {
		"low": { label: "低", description: "偏好简洁响应" },
		"medium": { label: "中", description: "平衡简洁与详细" },
		"high": { label: "高", description: "偏好详细响应（默认）" },
	},
	"tier.openai": {
		"none": { label: "无", description: "省略 service_tier（标准处理）" },
		"auto": { label: "自动", description: "提供商默认等级选择" },
		"default": { label: "默认", description: "标准优先处理" },
		"flex": { label: "Flex", description: "可用时更低成本、更高延迟" },
		"scale": { label: "Scale", description: "可用时使用 Scale Tier 额度" },
		"priority": { label: "Priority", description: "更快、成本更高（高级请求）" },
	},
	"tier.anthropic": {
		"none": { label: "无", description: "标准处理" },
		"priority": { label: "Priority", description: "在受支持的直连 Claude 模型上启用快速模式（`speed: \"fast\"`）；Bedrock/Vertex 上忽略" },
	},
	"tier.google": {
		"none": { label: "无", description: "标准处理" },
		"flex": { label: "Flex", description: "更低成本、更高延迟（Gemini API + Vertex）" },
		"priority": { label: "Priority", description: "更快、更可靠（Gemini API + Vertex）" },
	},
	"tier.subagent": {
		"inherit": { label: "继承", description: "匹配主 Agent 实时的按提供商族等级" },
		"none": { label: "无", description: "标准处理" },
		"auto": { label: "自动", description: "提供商默认等级选择（OpenAI 系）" },
		"default": { label: "默认", description: "标准优先处理（OpenAI 系）" },
		"flex": { label: "Flex", description: "弹性容量等级（OpenAI/Google 系）" },
		"scale": { label: "Scale", description: "Scale Tier 额度（OpenAI 系）" },
		"priority": { label: "Priority", description: "对派生模型所属的每个受支持提供商族启用 Priority" },
	},
	"tier.advisor": {
		"inherit": { label: "继承", description: "匹配主 Agent 实时的按提供商族等级" },
		"none": { label: "无", description: "标准处理" },
		"auto": { label: "自动", description: "提供商默认等级选择（OpenAI 系）" },
		"default": { label: "默认", description: "标准优先处理（OpenAI 系）" },
		"flex": { label: "Flex", description: "弹性容量等级（OpenAI/Google 系）" },
		"scale": { label: "Scale", description: "Scale Tier 额度（OpenAI 系）" },
		"priority": { label: "Priority", description: "对派生模型所属的每个受支持提供商族启用 Priority" },
	},
	"retry.usageReservePolicy": {
		"confirm": { label: "交互式确认", description: "交互会话保持主模型直到确认；后台 Agent 自动回退" },
		"auto": { label: "自动回退", description: "始终选择下一个符合条件的已配置回退" },
		"fail-closed": { label: "拒绝放行", description: "不消耗保留额度，也不选择回退" },
	},
	"retry.fallbackRevertPolicy": {
		"cooldown-expiry": { label: "冷却到期", description: "抑制窗口结束后切回主模型" },
		"never": { label: "从不", description: "留在备用模型直到手动更改" },
	},
	"loop.mode": {
		"prompt": { label: "提示", description: "作为后续消息重新提交（当前行为）" },
		"compact": { label: "压缩", description: "先压缩上下文再重新提交" },
		"reset": { label: "重置", description: "新建会话再重新提交" },
	},
	"paste.largeMenuThreshold": {
		"0": { label: "关闭" },
	},
	"marketplace.autoUpdate": {
		"off": { label: "关闭", description: "不检查插件更新" },
		"notify": { label: "通知", description: "启动时检查并通知可用更新" },
		"auto": { label: "自动", description: "启动时检查并自动安装更新" },
	},
	"startup.changelogMode": {
		"summary": { label: "摘要", description: "显示版本和变更数量，附带 /changelog 提示" },
		"expanded": { label: "展开", description: "完整显示最近的版本说明" },
		"hidden": { label: "隐藏", description: "启动时不显示版本说明" },
	},
	"ask.timeout": {
		"0": { label: "禁用" },
	},
	"share.store": {
		"blob": { label: "加密 Blob", description: "上传到分享服务器（无需 GitHub 账户；避开 gist API 速率限制）" },
		"gist": { label: "GitHub Gist", description: "推送到私密 gist（需已认证的 gh），失败时回退到分享服务器" },
	},
	"stt.modelName": {
		"fast": { label: "快速 (Whisper base)", description: "Whisper base，多语言。最小 + 最快；准确率最低。最适合低资源机器" },
		"balanced": { label: "平衡 (Whisper small)", description: "Whisper small，多语言。比快速更准确，仍然在 CPU/RAM 上轻量" },
		"turbo": { label: "Turbo (Whisper large-v3)", description: "Whisper large-v3-turbo，99 种语言。最广泛的语言覆盖；下载大，速度较慢" },
		"parakeet": { label: "Parakeet TDT v3 (SoTA)", description: "NVIDIA Parakeet TDT 0.6B v3，25 种语言。开放 ASR 排行榜领导者 — 最佳准确性和最快的解码。默认" },
	},
	"stt.submitTrigger": {
		"never": { label: "从不", description: "绝不自动提交；插入听写文本并停留在编辑器中。" },
		"release": { label: "松手提交", description: "松手时提交，若话语包含 2 个及以上单词，以避免误发送。" },
		"release-complete": { label: "松手且句子完整时提交", description: "松手时提交，若话语以句末标点（. ? ! 等）结尾。" },
		"say-submit": { label: "说出 Submit 时提交", description: "若话语以包含 \"submit\" 的单词结尾则提交（提交前会去掉该词）。" },
	},
	"compaction.thresholdPercent": {
		"default": { label: "默认", description: "传统预留阈值" },
	},
	"compaction.thresholdTokens": {
		"default": { label: "默认", description: "使用百分比阈值" },
	},
	"snapcompact.systemPrompt": {
		"none": { label: "无", description: "将系统提示保持为文本" },
		"agents-md": { label: "AGENTS.md", description: "仅当节省 token 时将加载的上下文文件指令移动到图像" },
		"all": { label: "全部", description: "当节省 token 时将完整的系统提示移动到图像" },
	},
	"tools.format": {
		"auto": { label: "自动", description: "使用原生工具调用，除非模型已知不支持它们" },
		"native": { label: "原生", description: "使用提供商原生工具调用" },
		"glm": { label: "GLM", description: "使用 GLM 风格的带内工具调用" },
		"hermes": { label: "Hermes", description: "使用 Hermes 风格的带内工具调用" },
		"kimi": { label: "Kimi", description: "使用 Kimi 风格的带内工具调用" },
		"xml": { label: "XML", description: "使用通用 XML 带内工具调用" },
		"anthropic": { label: "Anthropic", description: "使用 Anthropic 风格的带内工具调用" },
		"deepseek": { label: "DeepSeek", description: "使用 DeepSeek 风格的带内工具调用" },
		"harmony": { label: "Harmony", description: "使用 Harmony 风格的带内工具调用" },
		"qwen3": { label: "Qwen3", description: "使用 Qwen3 拥有的方言" },
		"gemini": { label: "Gemini", description: "使用 Gemini 拥有的方言" },
		"gemma": { label: "Gemma", description: "使用 Gemma 拥有的方言" },
		"minimax": { label: "MiniMax", description: "使用 MiniMax 拥有的方言" },
	},
	"snapcompact.shape": {
		"auto": { label: "自动", description: "为当前模型选择一个调整好的形状，回退到其提供商系列" },
		"silver16-bw": { label: "Silver 16, CJK", description: "16px 上嵌入的 Silver TrueType 字体" },
		"doc-8on16-bw": { label: "文档 8on16，黑色", description: "两个换词报纸栏，8x13 字形在 16px 间距上，黑色墨水" },
		"doc-8on16-sent": { label: "文档 8on16，句子色调", description: "双栏文档布局，句子色调墨水" },
		"doc-8on16-sent-dim": { label: "文档 8on16，句子色调 + 调暗停用词", description: "双栏文档布局，句子色调墨水，功能词调暗灰色" },
	},
	"memory.backend": {
		"off": { label: "关闭", description: "不运行记忆系统" },
		"local": { label: "本地", description: "本地会话摘要管线（memory_summary.md）" },
		"hindsight": { label: "Hindsight", description: "Vectorize Hindsight 远程记忆服务" },
		"mnemopi": { label: "Mnemopi", description: "本地 SQLite 召回/保留后端，支持可选嵌入" },
		"sharpshooter": { label: "Sharpshooter", description: "低摩擦门控的项目决策文件（架构/产品/风格），后台整合" },
	},
	"mnemopi.scoping": {
		"global": { label: "全局", description: "每个项目共享一个 Mnemopi 银行" },
		"per-project": { label: "每个项目", description: "每个 cwd 基本名称的项目本地 Mnemopi 银行" },
		"per-project-tagged": { label: "每个项目（标记）", description: "写入项目本地银行但合并项目 + 共享召回结果" },
	},
	"mnemopi.embeddingVariant": {
		"en": { label: "英语 (bge-base-en-v1.5)", description: "BAAI/bge-base-en-v1.5 (768d)，仅英语" },
		"multilingual": { label: "多语言 (multilingual-e5-large)", description: "intfloat/multilingual-e5-large (1024d)，跨语言召回" },
	},
	"mnemopi.llmMode": {
		"none": { label: "无", description: "禁用 Mnemopi LLM 支持的提取" },
		"smol": { label: "Smol", description: "使用配置的 pi-ai smol 模型" },
		"remote": { label: "远程", description: "使用下面的 Mnemopi 远程 LLM 设置" },
	},
	"hindsight.scoping": {
		"global": { label: "全局", description: "一个共享库 — 所有项目看到相同记忆" },
		"per-project": { label: "按项目", description: "每个项目独立库 — 项目间不可见" },
		"per-project-tagged": { label: "按项目(标签)", description: "共享库，用项目标签标记，召回时合并项目+全局记忆" },
	},
	"hindsight.retainMode": {
		"full-session": { label: "完整会话", description: "每会话更新一个文档（推荐）" },
		"last-turn": { label: "最近一轮", description: "按轮次边界切片保留" },
	},
	"ttsr.interruptMode": {
		"always": { label: "总是", description: "在文本和工具流中中断" },
		"prose-only": { label: "仅文本", description: "仅在回复/思考匹配时中断" },
		"tool-only": { label: "仅工具", description: "仅在工具调用参数匹配时中断" },
		"never": { label: "从不", description: "不中断；完成后注入警告" },
	},
	"tools.approvalMode": {
		"always-ask": { label: "总是询问", description: "自动批准只读工具；要求确认写入和执行工具" },
		"write": { label: "写入", description: "自动批准只读和写入工具；要求确认执行工具，如 bash、eval、browser、task 和 ssh" },
		"yolo": { label: "Yolo", description: "自动批准读取、写入和执行工具。用户策略仍可能要求确认或阻止调用" },
	},
	"todo.eager": {
		"default": { label: "默认", description: "模型决定；没有自动待办事项列表" },
		"preferred": { label: "首选", description: "在第一条消息上建议待办事项列表（提醒，不强制）" },
		"always": { label: "总是", description: "在第一条消息上强制综合待办事项列表" },
	},
	"inspect_image.mode": {
		"auto": { label: "自动（仅无视觉模型）" },
		"on": { label: "开启" },
		"off": { label: "关闭" },
	},
	"inspect_image.timeoutMs": {
		"0": { label: "已禁用" },
	},
	"tools.maxTimeout": {
		"0": { label: "无限制" },
	},
	"async.pollWaitDuration": {
		"smart": { label: "智能", description: "默认 — 自适应 5s→5m，停止轮询时重置" },
	},
	"irc.timeoutMs": {
		"0": { label: "禁用" },
	},
	"tools.xdevDocs": {
		"inline": { label: "所有设备", description: "为每个已挂载设备内联文档和 schema。" },
		"builtins": { label: "仅内置", description: "内联内置文档；MCP 和扩展文档按需获取。" },
		"catalog": { label: "仅目录", description: "列出所有设备；全部文档按需获取。" },
	},
	"task.isolation.mode": {
		"none": { label: "无", description: "不隔离" },
		"auto": { label: "自动", description: "让 PAL 选择最佳可用后端" },
		"apfs": { label: "APFS", description: "macOS clonefile 写时复制 (APFS)" },
		"btrfs": { label: "btrfs", description: "btrfs 子卷快照" },
		"zfs": { label: "ZFS", description: "ZFS 快照 + 克隆" },
		"reflink": { label: "Reflink", description: "Linux FICLONE 逐文件写时复制" },
		"overlayfs": { label: "Overlayfs", description: "Linux 内核叠加层（或 fuse-overlayfs 回退）" },
		"projfs": { label: "ProjFS", description: "Windows 投影文件系统" },
		"block-clone": { label: "Block clone", description: "Windows FSCTL_DUPLICATE_EXTENTS_TO_FILE (NTFS/ReFS)" },
		"rcopy": { label: "递归复制", description: "可用时用 git worktree，否则递归复制" },
	},
	"task.isolation.merge": {
		"patch": { label: "补丁", description: "合并差异并 git apply" },
		"branch": { label: "分支", description: "每个任务单独提交，用 --no-ff 合并" },
	},
	"task.isolation.commits": {
		"generic": { label: "通用", description: "静态提交消息" },
		"ai": { label: "AI", description: "从差异生成 AI 提交消息" },
	},
	"task.eager": {
		"default": { label: "默认", description: "模型决定何时委托" },
		"preferred": { label: "首选", description: "将委托指导添加到系统提示" },
		"always": { label: "总是", description: "提示指导加上第一轮委托提醒" },
	},
	"task.maxConcurrency": {
		"0": { label: "无限制" },
	},
	"task.maxRecursionDepth": {
		"0": { label: "禁止" },
		"1": { label: "单层" },
		"2": { label: "两层" },
		"3": { label: "三层" },
		"-1": { label: "无限制" },
	},
	"task.maxRuntimeMs": {
		"0": { label: "无限制", description: "默认" },
	},
	"task.softRequestBudget": {
		"0": { label: "禁用" },
	},
	"task.maxEffort": {
		"minimal": { label: "min", description: "极简推理（约 1k token）" },
		"low": { label: "low", description: "轻量推理（约 2k token）" },
		"medium": { label: "medium", description: "中等推理（约 8k token）" },
		"high": { label: "high", description: "深度推理（约 16k token）" },
		"xhigh": { label: "xhigh", description: "超深度推理（约 32k token）" },
		"max": { label: "max", description: "模型支持的最大推理" },
	},
	"tasks.todoClearDelay": {
		"0": { label: "立即" },
		"-1": { label: "从不" },
	},
	"providers.webSearchOrder": {
		"perplexity": { label: "Perplexity", description: "已配置时使用认证；显式选择失败时回退匿名搜索" },
		"gemini": { label: "Gemini", description: "通过 Gemini 的 Google 搜索接地（使用 google-gemini-cli 或 google-antigravity OAuth）" },
		"anthropic": { label: "Anthropic", description: "Claude 原生 web_search 工具（使用 Anthropic OAuth 或 ANTHROPIC_API_KEY）" },
		"codex": { label: "OpenAI", description: "OpenAI 原生 web_search（通过 /login openai-codex 使用 ChatGPT OAuth）" },
		"xai": { label: "xAI", description: "通过 xAI Responses API 的 Grok 网页搜索（通过 /login xai-oauth 使用 SuperGrok/X Premium+ OAuth，或 XAI_API_KEY）" },
		"zai": { label: "Z.AI", description: "调用 Z.AI webSearchPrime MCP" },
		"exa": { label: "Exa", description: "通过 /login exa 或 EXA_API_KEY 使用 API；显式无密钥回退经 MCP" },
		"tinyfish": { label: "TinyFish", description: "需要 TINYFISH_API_KEY" },
		"jina": { label: "Jina", description: "需要 JINA_API_KEY" },
		"kagi": { label: "Kagi", description: "需要 KAGI_API_KEY 和 Kagi Search API beta 访问权限" },
		"tavily": { label: "Tavily", description: "需要 TAVILY_API_KEY" },
		"firecrawl": { label: "Firecrawl", description: "设置 FIRECRAWL_API_KEY 时使用 Firecrawl API；回退到无密钥模式" },
		"brave": { label: "Brave", description: "需要 BRAVE_API_KEY" },
		"kimi": { label: "Kimi", description: "Kimi Code 搜索（需 Kimi Code Console 密钥，经 KIMI_SEARCH_API_KEY/MOONSHOT_SEARCH_API_KEY 或 /login kimi-code；不支持 MOONSHOT_API_KEY）" },
		"parallel": { label: "Parallel", description: "需要 PARALLEL_API_KEY" },
		"synthetic": { label: "Synthetic", description: "需要 SYNTHETIC_API_KEY" },
		"searxng": { label: "SearXNG", description: "需要 SEARXNG_ENDPOINT 或 searxng.endpoint" },
		"startpage": { label: "Startpage", description: "无凭证抓取 Startpage（Google 后端）结果；可能遇机器人验证" },
		"duckduckgo": { label: "DuckDuckGo", description: "无凭证尽力回退；数据中心/共享出口 IP 上可能遇机器人验证" },
		"ecosia": { label: "Ecosia", description: "无凭证、浏览器辅助抓取 Ecosia（Google 后端）结果" },
		"google": { label: "Google", description: "无凭证、浏览器辅助的回退；较慢且可能遇机器人验证" },
		"mojeek": { label: "Mojeek", description: "无凭证、浏览器辅助抓取 Mojeek 独立索引" },
		"public": { label: "Public Web", description: "并行查询所有无凭证引擎并合并去重结果" },
	},
	"providers.webSearchExclude": {
		"perplexity": { label: "Perplexity", description: "已配置时使用认证；显式选择失败时回退匿名搜索" },
		"gemini": { label: "Gemini", description: "通过 Gemini 的 Google 搜索接地（使用 google-gemini-cli 或 google-antigravity OAuth）" },
		"anthropic": { label: "Anthropic", description: "Claude 原生 web_search 工具（使用 Anthropic OAuth 或 ANTHROPIC_API_KEY）" },
		"codex": { label: "OpenAI", description: "OpenAI 原生 web_search（通过 /login openai-codex 使用 ChatGPT OAuth）" },
		"xai": { label: "xAI", description: "通过 xAI Responses API 的 Grok 网页搜索（通过 /login xai-oauth 使用 SuperGrok/X Premium+ OAuth，或 XAI_API_KEY）" },
		"zai": { label: "Z.AI", description: "调用 Z.AI webSearchPrime MCP" },
		"exa": { label: "Exa", description: "通过 /login exa 或 EXA_API_KEY 使用 API；显式无密钥回退经 MCP" },
		"tinyfish": { label: "TinyFish", description: "需要 TINYFISH_API_KEY" },
		"jina": { label: "Jina", description: "需要 JINA_API_KEY" },
		"kagi": { label: "Kagi", description: "需要 KAGI_API_KEY 和 Kagi Search API beta 访问权限" },
		"tavily": { label: "Tavily", description: "需要 TAVILY_API_KEY" },
		"firecrawl": { label: "Firecrawl", description: "设置 FIRECRAWL_API_KEY 时使用 Firecrawl API；回退到无密钥模式" },
		"brave": { label: "Brave", description: "需要 BRAVE_API_KEY" },
		"kimi": { label: "Kimi", description: "Kimi Code 搜索（需 Kimi Code Console 密钥，经 KIMI_SEARCH_API_KEY/MOONSHOT_SEARCH_API_KEY 或 /login kimi-code；不支持 MOONSHOT_API_KEY）" },
		"parallel": { label: "Parallel", description: "需要 PARALLEL_API_KEY" },
		"synthetic": { label: "Synthetic", description: "需要 SYNTHETIC_API_KEY" },
		"searxng": { label: "SearXNG", description: "需要 SEARXNG_ENDPOINT 或 searxng.endpoint" },
		"startpage": { label: "Startpage", description: "无凭证抓取 Startpage（Google 后端）结果；可能遇机器人验证" },
		"duckduckgo": { label: "DuckDuckGo", description: "无凭证尽力回退；数据中心/共享出口 IP 上可能遇机器人验证" },
		"ecosia": { label: "Ecosia", description: "无凭证、浏览器辅助抓取 Ecosia（Google 后端）结果" },
		"google": { label: "Google", description: "无凭证、浏览器辅助的回退；较慢且可能遇机器人验证" },
		"mojeek": { label: "Mojeek", description: "无凭证、浏览器辅助抓取 Mojeek 独立索引" },
		"public": { label: "Public Web", description: "并行查询所有无凭证引擎并合并去重结果" },
	},
	"providers.antigravityEndpoint": {
		"auto": { label: "自动", description: "尝试生产端点，在 5xx/429 上故障转移到沙箱" },
		"production": { label: "仅生产", description: "强制仅生产端点" },
		"sandbox": { label: "仅沙箱", description: "强制仅沙箱端点" },
	},
	"providers.imageOrder": {
		"openai": { label: "OpenAI", description: "OPENAI_API_KEY（gpt-image-2）或活动的 GPT 模型；回退到已连接的 Codex 订阅" },
		"openai-codex": { label: "OpenAI Codex (ChatGPT)", description: "使用已连接的 Codex / ChatGPT 订阅 — 无需 OPENAI_API_KEY" },
		"antigravity": { label: "Antigravity", description: "需要 google-antigravity OAuth" },
		"xai": { label: "xAI Grok Imagine", description: "需要 xAI Grok OAuth 或 XAI_API_KEY" },
		"gemini": { label: "Gemini", description: "需要 GEMINI_API_KEY" },
		"openrouter": { label: "OpenRouter", description: "需要 OPENROUTER_API_KEY" },
		"deepinfra": { label: "DeepInfra", description: "需要 DEEPINFRA_API_KEY" },
	},
	"providers.fireworksTier": {
		"standard": { label: "Standard", description: "默认分发路径（无 service_tier）" },
		"priority": { label: "Priority", description: "Priority 分发路径：更高可靠性、高级按 token 计价" },
	},
	"providers.tts": {
		"auto": { label: "自动", description: "优先本地设备上 TTS；当凭据存在时将 .mp3 输出路由到 xAI" },
		"local": { label: "本地", description: "设备上神经 TTS (Kokoro-82M)；输出是 WAV/PCM16" },
		"xai": { label: "xAI Grok Voice", description: "需要 xAI Grok OAuth 或 XAI_API_KEY；MP3 或 WAV" },
		"deepinfra": { label: "DeepInfra Speech", description: "需要 DEEPINFRA_API_KEY；MP3 或 WAV" },
	},
	"tts.localModel": {
		"kokoro": { label: "Kokoro-82M", description: "Kokoro-82M 神经 TTS — SoTA 设备上质量，多语音，完全本地" },
	},
	"tts.localVoice": {
		"af_heart": { label: "Heart (美式女声)" },
		"af_bella": { label: "Bella (美式女声)" },
		"af_nicole": { label: "Nicole (美式女声)" },
		"af_aoede": { label: "Aoede (美式女声)" },
		"af_kore": { label: "Kore (美式女声)" },
		"af_sarah": { label: "Sarah (美式女声)" },
		"am_michael": { label: "Michael (美式男声)" },
		"am_fenrir": { label: "Fenrir (美式男声)" },
		"am_puck": { label: "Puck (美式男声)" },
		"bf_emma": { label: "Emma (英式女声)" },
		"bm_george": { label: "George (英式男声)" },
		"bm_fable": { label: "Fable (英式男声)" },
	},
	"speech.mode": {
		"all": { label: "全部（消息 + 思考）" },
		"assistant": { label: "助手消息" },
		"yield": { label: "仅最终消息" },
	},
	"speech.voice": {
		"af_heart": { label: "Heart (美式女声)" },
		"af_bella": { label: "Bella (美式女声)" },
		"af_nicole": { label: "Nicole (美式女声)" },
		"af_aoede": { label: "Aoede (美式女声)" },
		"af_kore": { label: "Kore (美式女声)" },
		"af_sarah": { label: "Sarah (美式女声)" },
		"am_michael": { label: "Michael (美式男声)" },
		"am_fenrir": { label: "Fenrir (美式男声)" },
		"am_puck": { label: "Puck (美式男声)" },
		"bf_emma": { label: "Emma (英式女声)" },
		"bm_george": { label: "George (英式男声)" },
		"bm_fable": { label: "Fable (英式男声)" },
	},
	"providers.tinyModel": {
		"online": { label: "在线 (pi/smol)", description: "当前在线标题生成路径；没有本地模型下载或设备上推理" },
		"lfm2-350m": { label: "LFM2 350M", description: "推荐的本地模型；最佳速度/质量平衡，约 212 MB 缓存" },
		"qwen3-0.6b": { label: "Qwen3 0.6B", description: "最稳健的本地选项；首次加载较慢，约 500 MB 缓存" },
		"gemma-270m": { label: "Gemma 270M", description: "最小可行的本地选项；较低质量，最低缓存占用" },
		"qwen2.5-0.5b": { label: "Qwen2.5 0.5B", description: "平衡的本地回退；中等质量和缓存占用" },
		"lfm2-700m": { label: "LFM2 700M", description: "最高质量的本地选项；比 LFM2 350M 更大更慢" },
	},
	"providers.tinyModelDevice": {
		"default": { label: "默认", description: "仅 CPU 推理" },
		"gpu": { label: "GPU", description: "加速提供商（WebGPU/Metal、CUDA 或 DirectML）" },
		"cpu": { label: "CPU", description: "仅 CPU 推理" },
		"metal": { label: "Metal", description: "Apple GPU 的 WebGPU 别名" },
		"webgpu": { label: "WebGPU", description: "WebGPU/Metal 后端" },
		"cuda": { label: "CUDA", description: "NVIDIA CUDA (Linux x64)" },
		"dml": { label: "DirectML", description: "DirectML 后端 (Windows)" },
		"coreml": { label: "CoreML", description: "Apple CoreML（可选；可能加载失败）" },
		"auto": { label: "自动", description: "让 ONNX Runtime 选择提供商" },
		"wasm": { label: "WASM", description: "WebAssembly 后端" },
		"webnn": { label: "WebNN", description: "WebNN 后端" },
		"webnn-gpu": { label: "WebNN GPU", description: "WebNN GPU 设备" },
		"webnn-cpu": { label: "WebNN CPU", description: "WebNN CPU 设备" },
		"webnn-npu": { label: "WebNN NPU", description: "WebNN NPU 设备" },
	},
	"providers.tinyModelDtype": {
		"default": { label: "默认", description: "每个模型的装运 dtype（当前 q4）" },
		"q4": { label: "q4", description: "4 位权重；最小最快" },
		"q4f16": { label: "q4f16", description: "4 位权重，带 fp16 激活" },
		"q8": { label: "q8", description: "8 位量化" },
		"fp16": { label: "fp16", description: "16 位浮点；更高保真度，更大" },
		"fp32": { label: "fp32", description: "全精度；最大最慢" },
		"int8": { label: "int8", description: "有符号 8 位整数" },
		"uint8": { label: "uint8", description: "无符号 8 位整数" },
		"bnb4": { label: "bnb4", description: "bitsandbytes 4 位" },
		"q2": { label: "q2", description: "2 位权重" },
		"q2f16": { label: "q2f16", description: "2 位权重，带 fp16 激活" },
		"q1": { label: "q1", description: "1 位权重" },
		"q1f16": { label: "q1f16", description: "1 位权重，带 fp16 激活" },
		"auto": { label: "自动", description: "让 transformers.js 按设备选择" },
	},
	"providers.memoryModel": {
		"online": { label: "在线 (smol/remote)", description: "使用配置的 Mnemopi LLM 模式（smol 或 remote）；没有本地模型下载或设备上推理" },
		"qwen3-1.7b": { label: "Qwen3 1.7B", description: "推荐；最严格的提取（忽略聊天），良好的合并，约 1.1 GB 缓存" },
		"llama3.2:3b": { label: "Llama 3.2 3B", description: "更大的 Llama 3.2 本地记忆/分类器选项；潜在质量更高，但磁盘/内存/延迟开销更大" },
		"gemma-3-1b": { label: "Gemma 3 1B", description: "最佳合并/去重；更轻占用，但在提取期间泄漏小谈话" },
		"qwen2.5-1.5b": { label: "Qwen2.5 1.5B", description: "最佳提取粒度（原子事实）；更弱的合并" },
		"lfm2-1.2b": { label: "LFM2 1.2B", description: "最快加载；坚实的全能选手，稍嘈杂的提取标签" },
	},
	"providers.autoThinkingModel": {
		"online": { label: "在线 (smol)", description: "使用在线 smol 模型分类提示难度；没有本地下载或设备上推理" },
		"qwen3-1.7b": { label: "Qwen3 1.7B", description: "推荐；最严格的提取（忽略聊天），良好的合并，约 1.1 GB 缓存" },
		"llama3.2:3b": { label: "Llama 3.2 3B", description: "更大的 Llama 3.2 本地记忆/分类器选项；潜在质量更高，但磁盘/内存/延迟开销更大" },
		"gemma-3-1b": { label: "Gemma 3 1B", description: "最佳合并/去重；更轻占用，但在提取期间泄漏小谈话" },
		"qwen2.5-1.5b": { label: "Qwen2.5 1.5B", description: "最佳提取粒度（原子事实）；更弱的合并" },
		"lfm2-1.2b": { label: "LFM2 1.2B", description: "最快加载；坚实的全能选手，稍嘈杂的提取标签" },
	},
	"providers.autoThinkingMaxEffort": {
		"xhigh": { label: "xhigh", description: "分类器止步于 xhigh（默认）" },
		"max": { label: "max", description: "分类器可在模型支持时解析到 max" },
	},
	"providers.unexpectedStopModel": {
		"online": { label: "在线 (smol/remote)", description: "使用配置的 Mnemopi LLM 模式（smol 或 remote）；没有本地模型下载或设备上推理" },
		"qwen3-1.7b": { label: "Qwen3 1.7B", description: "推荐；最严格的提取（忽略聊天），良好的合并，约 1.1 GB 缓存" },
		"llama3.2:3b": { label: "Llama 3.2 3B", description: "更大的 Llama 3.2 本地记忆/分类器选项；潜在质量更高，但磁盘/内存/延迟开销更大" },
		"gemma-3-1b": { label: "Gemma 3 1B", description: "最佳合并/去重；更轻占用，但在提取期间泄漏小谈话" },
		"qwen2.5-1.5b": { label: "Qwen2.5 1.5B", description: "最佳提取粒度（原子事实）；更弱的合并" },
		"lfm2-1.2b": { label: "LFM2 1.2B", description: "最快加载；坚实的全能选手，稍嘈杂的提取标签" },
	},
	"providers.kimiApiFormat": {
		"auto": { label: "自动", description: "使用模型服务端声明的协议" },
		"openai": { label: "OpenAI", description: "api.kimi.com" },
		"anthropic": { label: "Anthropic", description: "api.moonshot.ai" },
	},
	"providers.openaiWebsockets": {
		"auto": { label: "自动", description: "使用模型/服务商默认行为" },
		"off": { label: "关闭", description: "禁用 OpenAI Codex WebSocket" },
		"on": { label: "开启", description: "强制启用 OpenAI Codex WebSocket" },
	},
	"providers.streamFirstEventTimeoutSeconds": {
		"0": { label: "关闭", description: "禁用首事件超时" },
		"-1": { label: "自动", description: "使用提供商默认值和 PI_* 超时环境变量" },
	},
	"providers.streamIdleTimeoutSeconds": {
		"0": { label: "关闭", description: "禁用空闲超时" },
		"-1": { label: "自动", description: "使用提供商默认值和 PI_* 超时环境变量" },
	},
	"providers.openrouterVariant": {
		"default": { label: "默认", description: "无后缀；使用 OpenRouter 的默认路由" },
		"nitro": { label: ":nitro", description: "优先考虑吞吐量 / 最低延迟" },
		"floor": { label: ":floor", description: "优先考虑最便宜的可用提供商" },
		"online": { label: ":online", description: "启用 OpenRouter 的网页搜索插件" },
		"exacto": { label: ":exacto", description: "挑选的高质量提供商（仅针对选定的模型定义）" },
	},
	"providers.fetch": {
		"auto": { label: "自动", description: "优先级：原生 > trafilatura > lynx > parallel > jina" },
		"native": { label: "原生", description: "进程内 HTML→Markdown 转换器（始终可用）" },
		"trafilatura": { label: "Trafilatura", description: "通过 uv/pip 自动安装" },
		"lynx": { label: "Lynx", description: "需要 lynx 系统包" },
		"parallel": { label: "Parallel", description: "需要 PARALLEL_API_KEY" },
		"jina": { label: "Jina", description: "使用 r.jina.ai 阅读器（JINA_API_KEY 可选）" },
	},
	"codexResets.autoRedeem": {
		"unset": { label: "未设置", description: "检查资格，然后在花费第一个保存的重置之前询问" },
		"yes": { label: "是", description: "在没有提示的情况下花费符合条件的保存重置" },
		"no": { label: "否", description: "不运行保存重置自动兑换检查" },
	},
	"provider.appendOnlyContext": {
		"auto": { label: "自动", description: "为已知的前缀缓存提供商启用（推荐）" },
		"on": { label: "开", description: "始终启用仅追加上下文" },
		"off": { label: "关", description: "禁用仅追加上下文" },
	},
};

// ═══════════════════════════════════════════════════════════════════════════
// 命令描述翻译：{ commandName: 中文描述 }
// 翻译内置 /命令 的 description（自动补全下拉、帮助文本中显示）
// ═══════════════════════════════════════════════════════════════════════════

export const COMMAND_ZH: Record<string, string> = {
	settings: "打开设置菜单",
	plan: "切换计划模式（Agent 先规划再执行）",
	loop: "切换循环模式。开启后，下一条提示在每次 Agent 返回后自动重新提交；Esc 取消当前轮次，再次 /loop 关闭",
	model: "选择模型（打开选择器）",
	fast: "切换快速模式（OpenAI 服务层级优先）",
	vibe: "切换 vibe 模式（直连持久的快速/优质工作会话；只读工具集）",
	prewalk: "在下一次操作时切换到快速/廉价模型（即使没有 --prewalk 也生效）",
	export: "导出会话为 HTML 文件",
	dump: "复制会话记录到剪贴板（并将 LLM 请求 JSON 写入临时文件）",
	share: "通过加密链接分享会话（共享服务器或私密 gist）",
	browser: "切换浏览器无头/可见模式",
	copy: "复制最后一条 Agent 消息到剪贴板",
	todo: "查看或修改 Agent 的任务列表",
	queue: "为代理让出后排队一条消息",
	session: "会话管理命令",
	jobs: "显示后台异步任务状态",
	usage: "显示服务商用量和额度",
	changelog: "显示更新日志",
	hotkeys: "显示所有键盘快捷键",
	tools: "显示当前 Agent 可用的工具",
	context: "显示上下文用量估算",
	extensions: "打开扩展控制中心",
	agents: "打开 Agent 控制中心",
	branch: "从历史消息创建新分支",
	fork: "从历史消息创建新分叉",
	tree: "浏览会话树（切换分支）",
	login: "使用 OAuth 登录",
	logout: "退出 OAuth 登录",
	mcp: "管理 MCP 服务器（添加、列表、删除、测试）",
	ssh: "管理 SSH 主机（添加、列表、删除）",
	new: "开始新会话",
	drop: "删除当前会话并开始新会话",
	compact: "手动压缩会话上下文",
	handoff: "将会话上下文移交给新会话",
	resume: "恢复其他会话",
	btw: "基于当前会话上下文提一个临时旁问",
	retry: "重试上一次失败的 Agent 轮次",
	debug: "打开调试工具选择器",
	memory: "查看与维护记忆",
	rename: "重命名当前会话",
	"add-dir": "为本会话添加工作区目录（多根）",
	"remove-dir": "从本会话移除工作区目录",
	dirs: "列出本会话的工作区目录",
	move: "将当前会话移动到其他目录",
	exit: "退出应用",
	marketplace: "管理市场插件源和已安装插件",
	plugins: "查看和管理已安装插件",
	"reload-plugins": "重新加载所有插件（技能、命令、钩子、工具、Agent、MCP）",
	force: "强制下一轮使用指定工具",
	quit: "退出应用",
	computer: "为本会话切换原生 computer-use 工具",
	vision: "控制本会话的 inspect_image 视觉委托工具",
	live: "启动 Codex 支持的实时语音模式",
	pause: "冻结所有代理（主代理、子代理、顾问）直到恢复",
	// ── 16.0.6 命令（setup/goal/advisor/collab 等）──
	setup: "打开服务商设置",
	"plan-review": "重新打开最新计划的评审（仅计划模式）",
	goal: "切换目标模式（本会话的持久自主目标）",
	"guided-goal": "让代理在聊天中访谈你，然后设置目标模式",
	switch: "切换本会话模型（同 alt+p）",
	advisor: "切换顾问（第二个模型，每轮审查并注入备注）",
	collab: "通过中继实时分享本会话",
	join: "加入共享的协作会话",
	leave: "离开协作会话",
	stats: "启动本地统计面板",
	fresh: "重置服务商流状态，不改变本地记录",
	shake: "丢弃上下文中的重内容（工具结果、大块文本）",
	tan: "在后台运行一个完整 Agent 处理旁支工作",
	omfg: "从抱怨生成 TTSR 规则，制止重复行为",
	security: "计划、运行、检查、导入和比较 OMP 原生安全扫描",
	clear: "原地清除对话上下文，保留会话",
	// ── 18.0 命令 ──
	"extended-context": "切换 premium 长上下文窗口",
	git: "打开 Git 界面（分屏 diff 查看器、暂存、提交编写器）",
	pin: "置顶/取消置顶会话（固定在恢复列表顶部）",
	cleanse: "用加权并行子 Agent 检测并修复项目诊断",
	// ── 18.1 命令 ──
	trace: "在统计面板中打开本会话的 trace",
	hub: "打开实时 Agent Hub",
	restart: "以相同启动参数重启 omp 并恢复本会话",
};

// ═══════════════════════════════════════════════════════════════════════════
// 子命令描述翻译：{ commandName: { subName: 中文描述 } }
// 仅翻译有 subcommands 的命令；usage 参数说明保留原文
// ═══════════════════════════════════════════════════════════════════════════

export const SUBCOMMAND_ZH: Record<string, Record<string, string>> = {
	fast: {
		on: "开启快速模式",
		off: "关闭快速模式",
		status: "显示快速模式状态",
	},
	browser: {
		headless: "切换到无头模式",
		visible: "切换到可见模式",
	},
	todo: {
		edit: "在 $EDITOR 中打开任务列表（Markdown 往返）",
		copy: "以 Markdown 格式复制任务列表到剪贴板",
		export: "将任务列表写入 Markdown 文件（默认：TODO.md）",
		import: "从 Markdown 文件替换任务列表（默认：TODO.md）",
		append: "追加任务；阶段名模糊匹配或自动创建",
		start: "标记任务为进行中（模糊匹配）",
		done: "标记任务/阶段/全部为已完成（模糊匹配）",
		drop: "标记任务/阶段/全部为已放弃（模糊匹配）",
		rm: "移除任务/阶段/全部（模糊匹配）",
		expand: "在 HUD 中显示全部阶段与任务",
		collapse: "恢复有界的 HUD 预览",
	},
	session: {
		info: "显示会话信息和统计",
		delete: "删除当前会话并返回选择器",
		pin: "将当前服务商固定到已存储的 OAuth 账户",
	},
	changelog: {
		full: "显示完整更新日志",
	},
	mcp: {
		add: "添加新的 MCP 服务器",
		list: "列出所有已配置的 MCP 服务器",
		remove: "移除 MCP 服务器",
		test: "测试与服务器的连接",
		reauth: "为服务器重新授权 OAuth",
		unauth: "移除服务器的 OAuth 授权",
		enable: "启用 MCP 服务器",
		disable: "禁用 MCP 服务器",
		"smithery-search": "搜索 Smithery 注册表并部署 MCP 服务器",
		"smithery-login": "登录 Smithery 并缓存 API 密钥",
		"smithery-logout": "移除缓存的 Smithery API 密钥",
		reconnect: "重新连接指定 MCP 服务器",
		reload: "强制重新加载 MCP 运行时工具",
		resources: "列出已连接服务器的可用资源",
		prompts: "列出已连接服务器的可用提示",
		notifications: "显示通知能力和订阅",
		help: "显示帮助信息",
	},
	ssh: {
		add: "添加 SSH 主机",
		list: "列出所有已配置的 SSH 主机",
		remove: "移除 SSH 主机",
		help: "显示帮助信息",
	},
	memory: {
		view: "显示当前注入的记忆内容",
		stats: "显示记忆后端统计",
		diagnose: "运行记忆后端诊断",
		queue: "显示等待整合的待处理记忆增量",
		sync: "立即运行记忆整合",
		clear: "清除已持久化的记忆数据和产物",
		reset: "clear 的别名",
		enqueue: "排队记忆整合维护任务",
		rebuild: "enqueue 的别名",
		"mm list": "列出当前记忆库中的心智模型",
		"mm show": "显示单个心智模型（需指定 id）",
		"mm refresh": "刷新全库自动刷新模型，或按 id 刷新单个",
		"mm history": "对比心智模型的变更历史",
		"mm seed": "创建缺失的内置心智模型",
		"mm delete": "从记忆库删除心智模型（需指定 id）",
		"mm reload": "重新拉取缓存的 <mental_models> 块",
	},
	marketplace: {
		add: "添加市场源",
		remove: "移除市场源",
		update: "更新市场目录",
		list: "列出已配置的市场",
		discover: "浏览可用插件",
		install: "安装插件（无参数时打开交互式浏览器）",
		uninstall: "卸载插件（无参数时打开选择器）",
		installed: "列出已安装的市场插件",
		upgrade: "升级过时的插件",
		help: "显示使用指南",
	},
	plugins: {
		list: "列出所有已安装插件（npm + 市场）",
		enable: "启用市场插件",
		disable: "禁用市场插件",
	},
	goal: {
		set: "设定或替换目标",
		show: "显示当前目标详情",
		pause: "暂停当前目标",
		resume: "恢复已暂停的目标",
		drop: "放弃当前目标",
		budget: "调整 token 预算",
	},
	advisor: {
		on: "启用顾问",
		off: "禁用顾问",
		status: "显示顾问状态",
		dump: "复制顾问记录到剪贴板",
		configure: "打开顾问配置编辑器 (TUI)",
	},
	collab: {
		view: "分享只读链接（访客可观看，不可提问）",
		status: "显示链接和参与者",
		stop: "停止分享",
	},
	shake: {
		elide: "剥离工具结果和大块文本（默认）",
		images: "剥离图片块",
		thinking: "丢弃全部思考块",
	},
	setup: {
		providers: "配置登录和网页搜索服务商",
	},
	usage: {
		show: "显示服务商用量和额度",
		reset: "使用已保存的 Codex 速率限制重置",
	},
	debug: {
		"dump-next-request": "将下一次 AI 服务商 HTTP 请求转储为 JSON",
	},
};

// ═══════════════════════════════════════════════════════════════════════════
// 通用文案翻译：{ "英文原句": "中文" } — 设置面板/命令之外的 TUI 面板与 CLI 帮助文案
// 规则：仅收录静态完整字符串（patch.ts 按带引号的完整字面量匹配）；
// 句子须足够独特（建议 ≥12 字符）防误伤；模板拼接句（含 ${} 插值）不收录。
// diff-translations.ts 会检测每条英文是否仍在 bundle 中（上游措辞变化 → 报告）。
// ═══════════════════════════════════════════════════════════════════════════

export const STRING_ZH: Record<string, string> = {
	// ── changelog 展示 ──
	"What's New": "新功能",
	"Full Changelog": "完整更新日志",
	"Recent Changes": "最近变更",
	"No changelog entries found.": "未找到更新日志条目。",
	"Use `/changelog full` to view the complete changelog.": "使用 `/changelog full` 查看完整更新日志。",
	"Updated omp. Use /changelog for recent changes.": "omp 已更新。使用 /changelog 查看最近变更。",
	"Install marketplace plugins: omp plugin install <name>@<marketplace>": "安装市场插件:         omp plugin install <name>@<marketplace>",
	"Install npm plugins:        omp plugin install <package>": "安装 npm 插件:        omp plugin install <package>",
	"No plugins installed": "未安装任何插件",
	"  No quick roles in the Ctrl+P cycle": "  Ctrl+P 循环中没有快速角色",
	"No sessions found": "未找到会话",
	" [installed]": " [已安装]",
	"[marketplace]": "[市场]",
	"**Editing**": "**编辑**",
	"**Navigation**": "**导航**",
	"**Other**": "**其他**",
	"# Additional LLM Providers": "# 其他 LLM 提供商",
	"# Cloud Providers": "# 云提供商",
	"# Configuration": "# 配置",
	"# Core Providers": "# 核心提供商",
	"# Search & Tools": "# 搜索与工具",
	"Add MCP Server": "添加 MCP 服务器",
	"Available Tools (default-enabled unless noted):": "可用工具(除非另有说明,默认启用):",
	"Benchmark models: TTFT/prefill vs decode throughput with p50/p95, across chat, prefill, generation, and prompt-cache workloads": "模型基准测试：TTFT/预填充与解码吞吐量对比（p50/p95），覆盖 chat、预填充、生成与提示词缓存负载",
	"Check for and install updates": "检查并安装更新",
	"Context usage is unavailable: no model is selected for this session.": "上下文用量不可用:当前会话未选择模型。",
	"Detect and fix project diagnostics with weighted parallel subagents": "用加权并行子 Agent 检测并修复项目诊断",
	"Download tiny local models (session titles + memory)": "下载微型本地模型（会话标题 + 记忆）",
	"Dry-run OAuth account balancing across random session ids": "按随机会话 id 预演 OAuth 账户均衡",
	"Enable or disable this marketplace plugin": "启用或禁用此市场插件",
	"Enable or disable this plugin": "启用或禁用此插件",
	"Enter a unique name for this server:": "为此服务器输入唯一名称:",
	"Environment Variables:": "环境变量:",
	"Estimated usage by category": "按类别估算的用量",
	"frames would not save tokens": "帧无法节省 token",
	"Generate a commit message and update changelogs": "生成提交信息并更新变更日志",
	"Get the API key or OAuth token for a provider": "获取提供商的 API 密钥或 OAuth token",
	"Headless? Paste the redirect URL or code with /login <value>.": "无头环境?请使用 /login <value> 粘贴重定向 URL 或代码。",
	"image budget exhausted": "图像预算已用尽",
	"Inspect and test Time-Traveling Stream Rules (TTSR)": "检查并测试时光回溯流规则（TTSR）",
	"Install or link an extension package (alias of `plugin install`/`plugin link`)": "安装或链接扩展包（`plugin install`/`plugin link` 的别名）",
	"Interactive shell console": "交互式 shell 控制台",
	"Join a shared collab session (same as /join)": "加入共享协作会话（同 /join）",
	"List or clear agent-managed git worktrees (~/.omp/wt)": "列出或清除 Agent 管理的 git worktree（~/.omp/wt）",
	"List, search, and refresh available models": "列出、搜索并刷新可用模型",
	"Manage bundled task agents": "管理内置的 task Agent",
	"Manage configuration settings": "管理配置设置",
	"Manage plugins (install, uninstall, list, etc.)": "管理插件（安装、卸载、列表等）",
	"Manage SSH host configurations": "管理 SSH 主机配置",
	"Manage the omp auth-broker (credential vault)": "管理 omp auth-broker（凭据保险库）",
	"No plugins available": "没有可用插件",
	"nothing to image": "没有可成像的内容",
	"Plugin Options:": "插件选项:",
	"Preview tool, composer, and status-line renderers in a deterministic visual gallery": "在确定性可视化画廊中预览工具、编写器与状态栏渲染器",
	"Print a shell completion script (bash, zsh, or fish)": "输出 shell 补全脚本（bash、zsh 或 fish）",
	"Rewrite a text file into the dense prompt register, reporting what it drops": "将文本文件重写为密集提示词寄存器，并报告丢弃的内容",
	"Run an auth-gateway forward proxy backed by the configured broker": "运行由已配置 broker 支撑的 auth-gateway 正向代理",
	"Run Oh My Pi as an ACP (Agent Client Protocol) server over stdio": "以 ACP（Agent Client Protocol）服务器模式通过 stdio 运行 Oh My Pi",
	"Run onboarding setup or install dependencies for optional features": "运行引导设置，或安装可选功能的依赖",
	"Run storage garbage collection": "运行存储垃圾回收",
	"Run the local CDP relay that lets the browser tool drive your own Chrome tabs": "运行本地 CDP relay，让浏览器工具操控你自己的 Chrome 标签页",
	"Share a saved session via an encrypted link (same as /share)": "通过加密链接分享已保存的会话（同 /share）",
	"Show provider usage limits for every authenticated account": "显示每个已认证账户的提供商用量限制",
	"Show what the read tool will return for a path, URL, or internal URI": "查看 read 工具对路径、URL 或内部 URI 将返回的内容",
	"Snapcompact (estimated wire savings)": "Snapcompact(预估传输节省)",
	"Snapcompact: inactive (model has no image input)": "Snapcompact:未启用(模型不支持图像输入)",
	"stdio (Local process)": "stdio（本地进程）",
	"Step 1: Server Name": "步骤 1:服务器名称",
	"Switch Model": "切换模型",
	"Synthesize text with the local TTS engine and play it through the speakers": "用本地 TTS 引擎合成文本并通过扬声器播放",
	"System context": "系统上下文",
	"System prompt": "系统提示词",
	"System tools": "系统工具",
	"Test grep tool": "测试 grep 工具",
	"Test web search providers": "测试网页搜索提供商",
	"URL is required": "URL 为必填",
	"Useful Commands:": "常用命令:",
	"View usage statistics": "查看用量统计",
	"View, clean, or push reported tool issues (auto-QA grievances)": "查看、清理或推送报告的工具问题（auto-QA grievances）",
	" (discovered servers):": "（已发现的服务器）：",
	"(mcp.notifications setting)": "（mcp.notifications 设置）",
	"| `!!` | Run bash command (excluded from context) |": "| `!!` | 运行 bash 命令（不进入上下文） |",
	"| `!` | Run bash command |": "| `!` | 运行 bash 命令 |",
	"| `/` | Slash commands |": "| `/` | 斜杠命令 |",
	"| `#` / `#<text>` | Prompt actions (copy / undo / move cursor) |": "| `#` / `#<文本>` | 提示词操作（复制 / 撤销 / 移动光标） |",
	"| `#<number>` | GitHub issue/PR reference (e.g. `#3164` → `pr://`/`issue://`) |": "| `#<数字>` | GitHub issue/PR 引用（如 `#3164` → `pr://`/`issue://`） |",
	"| `$` | Run Python in shared kernel |": "| `$` | 在共享内核中运行 Python |",
	"| `$$` | Run Python (excluded from context) |": "| `$$` | 运行 Python（不进入上下文） |",
	"| `Arrow keys` | Move cursor / browse history (Up when empty) |": "| `方向键` | 移动光标 / 浏览历史（空时向上） |",
	"| `Ctrl+A` / `Home` | Start of line |": "| `Ctrl+A` / `Home` | 行首 |",
	"| `Ctrl+E` / `End` | End of line |": "| `Ctrl+E` / `End` | 行尾 |",
	"| `Ctrl+K` | Delete to end of line |": "| `Ctrl+K` | 删除至行尾 |",
	"| `Ctrl+U` | Delete to start of line |": "| `Ctrl+U` | 删除至行首 |",
	"| `Enter` | Send message |": "| `Enter` | 发送消息 |",
	"| `Tab` | Path completion / accept autocomplete |": "| `Tab` | 路径补全 / 接受自动补全 |",
	"| Cancel autocomplete / interrupt active work |": "| 取消自动补全 / 中断进行中的工作",
	"| Clear editor (first) / exit (second) |": "| 清空编辑器（第一次）/ 退出（第二次）",
	"| Cycle role models (backward) |": "| 循环切换角色模型（反向）",
	"| Cycle role models (slow/default/smol) |": "| 循环切换角色模型（slow/default/smol）",
	"| Delete word backwards |": "| 向前删除一个词",
	"| Edit message in external editor |": "| 在外部编辑器中编辑消息",
	"| Exit (saves current prompt as draft) |": "| 退出（当前提示词存为草稿）",
	"| Hold `Space` | Speech-to-text (push-to-talk): hold to record, release to transcribe |": "| 按住 `Space` | 语音转文字（按键说话）：按住录音，松开转写 |",
	"| Key | Action |": "| 按键 | 操作 |",
	"| Move by word |": "| 按词移动",
	"| Search prompt history |": "| 搜索提示词历史",
	"| Select model (set roles) |": "| 选择模型（设置角色）",
	"| Select model (temporary) |": "| 选择模型（临时）",
	"| Start/stop live voice mode (/live) |": "| 开始/停止实时语音模式（/live）",
	"| Suspend to background |": "| 挂起到后台",
	"| Toggle thinking block visibility |": "| 切换思考块可见性",
	"| Toggle tool activity visibility |": "| 切换工具活动可见性",
	"| Toggle tool output expansion |": "| 切换工具输出展开",
	"Advisor Status": "Advisor 状态",
	"Alternative if browser did not open:": "若浏览器未打开，备选方式：",
	"Append-Only:": "仅追加：",
	"Assistant:": "助手：",
	"Authorize URL:": "授权 URL：",
	"Background Jobs": "后台任务",
	"Browser authorization started. Complete auth in your browser.": "浏览器授权已开始。请在浏览器中完成认证。",
	"Cache Read:": "缓存读取：",
	"Cache Write:": "缓存写入：",
	"Commands:": "命令：",
	"Configured MCP Servers": "已配置的 MCP 服务器",
	"Context": "上下文",
	"Context Usage": "上下文用量",
	"Copy current line": "复制当前行",
	"Copy whole prompt": "复制整个提示词",
	"Cost:": "费用：",
	"Cycle thinking level": "循环切换思考级别",
	"File:": "文件：",
	"ID:": "ID：",
	"If browser auth fails, you can paste an API key.": "若浏览器认证失败，可粘贴 API 密钥。",
	"inactive (notifications disabled)": "未激活（通知已禁用）",
	"Input:": "输入：",
	"Keyboard Shortcuts": "键盘快捷键",
	"LSP Servers": "LSP 服务器",
	"Manage Model Context Protocol (MCP) servers for external tool integrations.": "管理用于外部工具集成的 Model Context Protocol (MCP) 服务器。",
	"MCP Notifications": "MCP 通知",
	"MCP Prompts": "MCP 提示词",
	"MCP Resources": "MCP 资源",
	"MCP Server Management": "MCP 服务器管理",
	"MCP Servers": "MCP 服务器",
	"Memory Injection Payload": "记忆注入载荷",
	"Messages": "消息",
	"Model:": "模型：",
	"Models with usage data": "有用量数据的模型",
	"no active subscriptions": "无有效订阅",
	"No async jobs yet.": "暂无异步任务。",
	"No MCP servers configured.": "未配置 MCP 服务器。",
	"No model selected": "未选择模型",
	"No prompts available on connected servers.": "已连接的服务器上无可用提示词。",
	"No resources available on connected servers.": "已连接的服务器上无可用资源。",
	"No servers support notifications.": "没有服务器支持通知。",
	"None connected": "无连接",
	"Not connected yet": "尚未连接",
	"Open authorization URL:": "打开授权 URL：",
	"Output:": "输出：",
	"Paste image or text from clipboard": "从剪贴板粘贴图片或文本",
	"Premium Requests:": "高级请求：",
	"Preparing browser authorization...": "正在准备浏览器授权...",
	"Project level": "项目级",
	"Provider": "提供商",
	"Quota": "配额",
	"Recent Jobs": "近期的任务",
	"Reloading MCP servers and runtime tools...": "正在重载 MCP 服务器与运行时工具...",
	"Reset terminal display": "重置终端显示",
	"Retry last failed assistant turn": "重试上次失败的助手轮次",
	"Running Jobs": "运行中的任务",
	"Running:": "运行中：",
	"Saved rate-limit resets": "已保存的速率限制重置",
	"Server creation cancelled.": "服务器创建已取消。",
	"Session Info": "会话信息",
	"Smithery Login": "Smithery 登录",
	"Some servers failed to connect:": "部分服务器连接失败：",
	"Spend": "消耗",
	"Templates:": "模板：",
	"Tip: Press Ctrl+C or Esc anytime to cancel": "提示：随时按 Ctrl+C 或 Esc 取消",
	"Toggle plan mode": "切换计划模式",
	"Tokens": "Token",
	"Tool Calls:": "工具调用：",
	"Tool Results:": "工具结果：",
	"Total:": "总计：",
	"User level": "用户级",
	"User:": "用户：",
	"Waiting for authorization... (Press Esc to cancel, 5 minute timeout)": "等待授权中…（按 Esc 取消，5 分钟超时）",
	" | End of line |": " | 行尾 |",
	" | Start of line |": " | 行首 |",
	"| Copy current line |": "| 复制当前行 |",
	"| Copy whole prompt |": "| 复制整个提示词 |",
	"| Cycle thinking level |": "| 循环切换思考级别 |",
	"| Reset terminal display |": "| 重置终端显示 |",
	"| Toggle plan mode |": "| 切换计划模式 |",
};

// ═══════════════════════════════════════════════════════════════════════════
// 运行时注入
// ═══════════════════════════════════════════════════════════════════════════

function applyTranslations(): void {
	try {
		// 1. 翻译 Tab 标签
		for (const [tab, zh] of Object.entries(TAB_ZH)) {
			if (TAB_METADATA[tab]) {
				TAB_METADATA[tab].label = zh;
			}
		}

		// 2. 翻译设置项的 label 和 description
		for (const [path, zh] of Object.entries(SETTINGS_ZH)) {
			const setting = (SETTINGS_SCHEMA as Record<string, any>)[path];
			if (setting?.ui) {
				setting.ui.label = zh.label;
				setting.ui.description = zh.description;
			}
		}

		// 3. 翻译选项的 label 和 description
		for (const [path, options] of Object.entries(OPTION_ZH)) {
			const setting = (SETTINGS_SCHEMA as Record<string, any>)[path];
			if (setting?.ui?.options && Array.isArray(setting.ui.options)) {
				for (const opt of setting.ui.options) {
					const zhOpt = options[opt.value];
					if (zhOpt) {
						if (zhOpt.label) opt.label = zhOpt.label;
						if (zhOpt.description) opt.description = zhOpt.description;
					}
				}
			}
		}

		// 4. 翻译内置命令的 description（含子命令）
		// BUILTIN_SLASH_COMMANDS 是 UI 最终消费的数组；其元素与上游
		// REGISTRY/DEFS 共享 subcommands 数组引用，修改属性即全局生效
		for (const cmd of BUILTIN_SLASH_COMMANDS) {
			const zhDesc = COMMAND_ZH[cmd.name];
			if (zhDesc) cmd.description = zhDesc;
			const zhSubs = SUBCOMMAND_ZH[cmd.name];
			if (zhSubs && cmd.subcommands) {
				for (const sub of cmd.subcommands) {
					const zhSub = zhSubs[sub.name];
					if (zhSub) sub.description = zhSub;
				}
			}
		}

		// 5. settings-defs.ts 的 cachedDefs 是惰性缓存
		// 扩展加载阶段早于 UI 渲染，此时缓存尚未生成，无需清除
	} catch (e) {
		// 静默失败 — 翻译不影响功能，只是显示英文
	}
}

export default function settingsI18n(pi: ExtensionAPI) {
	pi.setLabel("中文翻译（设置 + 命令）");

	// 在工厂函数中立即执行翻译注入
	// 此阶段早于任何 UI 渲染，settings-defs 缓存与命令列表均未被 UI 消费
	applyTranslations();
}
