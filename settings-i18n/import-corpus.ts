#!/usr/bin/env bun
// @ts-nocheck
/**
 * import-corpus.ts — 从 omp-zh 语料（https://github.com/wxyhgk/oh-my-pi-zh）
 * 导入 settings/option 中文翻译到 index.ts
 *
 * 用法：
 *   bun import-corpus.ts           dry-run：只输出统计与待翻译清单，不改文件
 *   bun import-corpus.ts --write   写入 index.ts（重写 SETTINGS_ZH / OPTION_ZH 两个块）
 *
 * 合并规则（优先级从高到低）：
 *   1. index.ts 现有翻译（用户已校对）→ 保留
 *   2. omp-zh 语料有同 path 翻译      → 采用
 *   3. 都没有                          → 列入 pending（英文原文打印，待人工翻译）
 *   4. 现有翻译对应的 path 在当前 EN schema 已不存在 → 清除（上游废除）
 *
 * 语料基线 ≈ 17.2.14，当前 schema 17.3.7。英文措辞漂移由 patch.ts 的
 * missed 报告兜底（英文变了 → bundleStr 匹配不到 → 列入未匹配清单）。
 */

import { SETTINGS_SCHEMA as EN_SCHEMA } from "@oh-my-pi/pi-coding-agent/config/settings-schema";
import { SETTINGS_ZH, OPTION_ZH } from "./index.ts";

interface Ui {
	label?: string;
	description?: string;
	options?: Array<{ value: string; label?: string; description?: string }>;
}
type Schema = Record<string, { ui?: Ui }>;

// 语料不走模块 import（omp-zh 源码依赖 @wxyhgk/* 自有 scope，本地不可解析），
// 改为文本状态机解析：提取 path → { label, description, options[value → {label, description}] }
const CORPUS_PATH = "D:/Data/Learn/.tmp-ompzh/repo/packages/coding-agent/src/config/settings-schema.ts";

function parseCorpus(text: string): Schema {
	const result: Schema = {};
	let path: string | null = null;
	let optValue: string | null = null;
	const entryRe = /^\t(["']?)([\w.\-/]+)\1: \{$/;
	const valueRe = /^\t{4}value: (["'])(.*?)\1,?$/;
	const labelRe = /^\t+label: (["'])(.*)\1,?$/;
	const descRe = /^\t+description: (["'])(.*)\1,?$/;
	const descContRe = /^\t+(["'])(.*)\1,?$/;
	let awaitDesc = false;
	for (const rawLine of text.split(/\r?\n/)) {
		const m = rawLine.match(entryRe);
		if (m) {
			path = m[2];
			optValue = null;
			result[path] = { ui: {} };
			continue;
		}
		if (path === null) continue;
		const ui = result[path].ui;
		const vm = rawLine.match(valueRe);
		if (vm) {
			optValue = vm[2];
			ui.options = ui.options ?? [];
			ui.options.push({ value: optValue });
			continue;
		}
		const lm = rawLine.match(labelRe);
		if (lm) {
			if (optValue !== null) ui.options!.at(-1)!.label = lm[2];
			else ui.label = lm[2];
			awaitDesc = false;
			continue;
		}
		const dm = rawLine.match(descRe);
		if (dm) {
			if (optValue !== null) ui.options!.at(-1)!.description = dm[2];
			else ui.description = dm[2];
			awaitDesc = false;
			continue;
		}
		if (awaitDesc) {
			const cm = rawLine.match(descContRe);
			if (cm) {
				if (optValue !== null) ui.options!.at(-1)!.description = cm[2];
				else ui.description = cm[2];
				awaitDesc = false;
				continue;
			}
		}
		if (/^\t*description:$/.test(rawLine) && optValue === null) awaitDesc = true;
		if (/^\t\t\],$/.test(rawLine)) optValue = null;
	}
	return result;
}

const WRITE = process.argv.slice(2).includes("--write");

const en = EN_SCHEMA as unknown as Schema;
const zh = parseCorpus(await Bun.file(CORPUS_PATH).text());

const isNumeric = (s: string) => /^\d/.test(s ?? "");

// ── 人工翻译表（语料未覆盖的 pending 项；stt 4 条采用 omp-zh 语料译文）──

const EXTRA_SETTINGS: Record<string, { label: string; description: string }> = {
	externalThinking: {
		label: "外部思考",
		description: "私有草稿区；不显示给用户。禁用受支持的 GPT、Claude 和 Gemini 推理",
	},
	"extensionHandlers.toolCallTimeoutMs": {
		label: "工具调用处理器超时 (ms)",
		description: "扩展 tool_call 处理器的活动工作超时（正有限值）；无效值使用 30000ms，等待 OMP 自有对话框的时间不计入",
	},
};

const TIER_NONE = { label: "无", description: "标准处理" };
const WEB_SEARCH: Record<string, { label: string; description: string }> = {
	perplexity: { label: "Perplexity", description: "已配置时使用认证；显式选择失败时回退匿名搜索" },
	gemini: { label: "Gemini", description: "通过 Gemini 的 Google 搜索接地（使用 google-gemini-cli 或 google-antigravity OAuth）" },
	anthropic: { label: "Anthropic", description: "Claude 原生 web_search 工具（使用 Anthropic OAuth 或 ANTHROPIC_API_KEY）" },
	codex: { label: "OpenAI", description: "OpenAI 原生 web_search（通过 /login openai-codex 使用 ChatGPT OAuth）" },
	xai: { label: "xAI", description: "通过 xAI Responses API 的 Grok 网页搜索（通过 /login xai-oauth 使用 SuperGrok/X Premium+ OAuth，或 XAI_API_KEY）" },
	zai: { label: "Z.AI", description: "调用 Z.AI webSearchPrime MCP" },
	exa: { label: "Exa", description: "通过 /login exa 或 EXA_API_KEY 使用 API；显式无密钥回退经 MCP" },
	tinyfish: { label: "TinyFish", description: "需要 TINYFISH_API_KEY" },
	jina: { label: "Jina", description: "需要 JINA_API_KEY" },
	kagi: { label: "Kagi", description: "需要 KAGI_API_KEY 和 Kagi Search API beta 访问权限" },
	tavily: { label: "Tavily", description: "需要 TAVILY_API_KEY" },
	firecrawl: { label: "Firecrawl", description: "设置 FIRECRAWL_API_KEY 时使用 Firecrawl API；回退到无密钥模式" },
	brave: { label: "Brave", description: "需要 BRAVE_API_KEY" },
	kimi: { label: "Kimi", description: "Kimi Code 搜索（需 Kimi Code Console 密钥，经 KIMI_SEARCH_API_KEY/MOONSHOT_SEARCH_API_KEY 或 /login kimi-code；不支持 MOONSHOT_API_KEY）" },
	parallel: { label: "Parallel", description: "需要 PARALLEL_API_KEY" },
	synthetic: { label: "Synthetic", description: "需要 SYNTHETIC_API_KEY" },
	searxng: { label: "SearXNG", description: "需要 SEARXNG_ENDPOINT 或 searxng.endpoint" },
	startpage: { label: "Startpage", description: "无凭证抓取 Startpage（Google 后端）结果；可能遇机器人验证" },
	duckduckgo: { label: "DuckDuckGo", description: "无凭证尽力回退；数据中心/共享出口 IP 上可能遇机器人验证" },
	ecosia: { label: "Ecosia", description: "无凭证、浏览器辅助抓取 Ecosia（Google 后端）结果" },
	google: { label: "Google", description: "无凭证、浏览器辅助的回退；较慢且可能遇机器人验证" },
	mojeek: { label: "Mojeek", description: "无凭证、浏览器辅助抓取 Mojeek 独立索引" },
	public: { label: "Public Web", description: "并行查询所有无凭证引擎并合并去重结果" },
};

const SUBAGENT_TIER: Record<string, { label: string; description: string }> = {
	inherit: { label: "继承", description: "匹配主 Agent 实时的按提供商族等级" },
	none: TIER_NONE,
	auto: { label: "自动", description: "提供商默认等级选择（OpenAI 系）" },
	default: { label: "默认", description: "标准优先处理（OpenAI 系）" },
	flex: { label: "Flex", description: "弹性容量等级（OpenAI/Google 系）" },
	scale: { label: "Scale", description: "Scale Tier 额度（OpenAI 系）" },
	priority: { label: "Priority", description: "对派生模型所属的每个受支持提供商族启用 Priority" },
};

const EXTRA_OPTIONS: Record<string, Record<string, { label?: string; description?: string }>> = {
	modelRoleStorage: {
		global: { label: "全局", description: "将角色模型保存在当前活动配置文件中（当前行为）" },
		project: { label: "按项目", description: "将项目角色模型保存在 .omp/config.yml；缺失的项目角色使用全局默认" },
	},
	"tier.openai": {
		none: { label: "无", description: "省略 service_tier（标准处理）" },
		auto: { label: "自动", description: "提供商默认等级选择" },
		default: { label: "默认", description: "标准优先处理" },
		flex: { label: "Flex", description: "可用时更低成本、更高延迟" },
		scale: { label: "Scale", description: "可用时使用 Scale Tier 额度" },
		priority: { label: "Priority", description: "更快、成本更高（高级请求）" },
	},
	"tier.anthropic": {
		none: TIER_NONE,
		priority: { label: "Priority", description: "在受支持的直连 Claude 模型上启用快速模式（`speed: \"fast\"`）；Bedrock/Vertex 上忽略" },
	},
	"tier.google": {
		none: TIER_NONE,
		flex: { label: "Flex", description: "更低成本、更高延迟（Gemini API + Vertex）" },
		priority: { label: "Priority", description: "更快、更可靠（Gemini API + Vertex）" },
	},
	"tier.subagent": SUBAGENT_TIER,
	"tier.advisor": SUBAGENT_TIER,
	retry: {},
	"retry.usageReservePolicy": {
		confirm: { label: "交互式确认", description: "交互会话保持主模型直到确认；后台 Agent 自动回退" },
		auto: { label: "自动回退", description: "始终选择下一个符合条件的已配置回退" },
		"fail-closed": { label: "拒绝放行", description: "不消耗保留额度，也不选择回退" },
	},
	"share.store": {
		blob: { label: "加密 Blob", description: "上传到分享服务器（无需 GitHub 账户；避开 gist API 速率限制）" },
		gist: { label: "GitHub Gist", description: "推送到私密 gist（需已认证的 gh），失败时回退到分享服务器" },
	},
	stt: {},
	"stt.submitTrigger": {
		never: { label: "从不", description: "绝不自动提交；插入听写文本并停留在编辑器中。" },
		release: { label: "松手提交", description: "松手时提交，若话语包含 2 个及以上单词，以避免误发送。" },
		"release-complete": { label: "松手且句子完整时提交", description: "松手时提交，若话语以句末标点（. ? ! 等）结尾。" },
		"say-submit": { label: "说出 Submit 时提交", description: "若话语以包含 \"submit\" 的单词结尾则提交（提交前会去掉该词）。" },
	},
	"inspect_image.mode": {
		auto: { label: "自动（仅无视觉模型）" },
		on: { label: "开启" },
		off: { label: "关闭" },
	},
	"inspect_image.timeoutMs": { "0": { label: "已禁用" } },
	"tools.xdevDocs": {
		inline: { label: "所有设备", description: "为每个已挂载设备内联文档和 schema。" },
		builtins: { label: "仅内置", description: "内联内置文档；MCP 和扩展文档按需获取。" },
		catalog: { label: "仅目录", description: "列出所有设备；全部文档按需获取。" },
	},
	"task.maxEffort": {
		minimal: { label: "min", description: "极简推理（约 1k token）" },
		low: { label: "low", description: "轻量推理（约 2k token）" },
		medium: { label: "medium", description: "中等推理（约 8k token）" },
		high: { label: "high", description: "深度推理（约 16k token）" },
		xhigh: { label: "xhigh", description: "超深度推理（约 32k token）" },
		max: { label: "max", description: "模型支持的最大推理" },
	},
	"providers.webSearchOrder": WEB_SEARCH,
	"providers.webSearchExclude": WEB_SEARCH,
	"providers.imageOrder": {
		openai: { label: "OpenAI", description: "OPENAI_API_KEY（gpt-image-2）或活动的 GPT 模型；回退到已连接的 Codex 订阅" },
		"openai-codex": { label: "OpenAI Codex (ChatGPT)", description: "使用已连接的 Codex / ChatGPT 订阅 — 无需 OPENAI_API_KEY" },
		antigravity: { label: "Antigravity", description: "需要 google-antigravity OAuth" },
		xai: { label: "xAI Grok Imagine", description: "需要 xAI Grok OAuth 或 XAI_API_KEY" },
		gemini: { label: "Gemini", description: "需要 GEMINI_API_KEY" },
		openrouter: { label: "OpenRouter", description: "需要 OPENROUTER_API_KEY" },
	},
	"providers.fireworksTier": {
		standard: { label: "Standard", description: "默认分发路径（无 service_tier）" },
		priority: { label: "Priority", description: "Priority 分发路径：更高可靠性、高级按 token 计价" },
	},
	"providers.streamFirstEventTimeoutSeconds": {
		"-1": { label: "自动", description: "使用提供商默认值和 PI_* 超时环境变量" },
		"0": { label: "关闭", description: "禁用首事件超时" },
	},
	"providers.streamIdleTimeoutSeconds": {
		"-1": { label: "自动", description: "使用提供商默认值和 PI_* 超时环境变量" },
		"0": { label: "关闭", description: "禁用空闲超时" },
	},
};
delete EXTRA_OPTIONS.retry; // 占位移除
delete EXTRA_OPTIONS.stt;

// 品牌声音名等专有选项：保留原文，不计入待翻译
const IGNORE_OPTIONS: Record<string, string[]> = {
	"live.voice": ["arbor", "breeze", "cove", "ember", "juniper", "maple", "sol", "spruce", "vale"],
};

// ── 合并 settings ──
const newSettings: Record<string, { label: string; description: string }> = {};
const pendingSettings: Array<{ path: string; en: { label?: string; description?: string } }> = [];
let keptS = 0, adoptedS = 0, droppedS = 0;

for (const [path, cfg] of Object.entries(en)) {
	const ui = cfg?.ui;
	if (!ui) continue;
	if (SETTINGS_ZH[path]) { newSettings[path] = SETTINGS_ZH[path]; keptS++; continue; }
	const zhUi = zh[path]?.ui;
	if (zhUi?.label) {
		newSettings[path] = { label: zhUi.label, description: zhUi.description ?? "" };
		adoptedS++;
		continue;
	}
	const extraS = EXTRA_SETTINGS[path];
	if (extraS) {
		newSettings[path] = extraS;
		adoptedS++;
	} else {
		pendingSettings.push({ path, en: { label: ui.label, description: ui.description } });
	}
}
for (const path of Object.keys(SETTINGS_ZH)) {
	if (!en[path]?.ui) droppedS++;
}

// ── 合并 options ──
const newOptions: Record<string, Record<string, { label?: string; description?: string }>> = {};
const pendingOptions: Array<{ path: string; value: string; en: { label?: string; description?: string } }> = [];
let keptO = 0, adoptedO = 0;

for (const [path, cfg] of Object.entries(en)) {
	const opts = cfg?.ui?.options;
	if (!Array.isArray(opts) || opts.length === 0) continue;
	const cur: Record<string, { label?: string; description?: string }> = {};
	for (const opt of opts) {
		if (!opt.label || isNumeric(opt.label)) continue;
		const existing = OPTION_ZH[path]?.[opt.value];
		if (existing) { cur[opt.value] = existing; keptO++; continue; }
		// omp-zh 语料里找同 value 选项
		const zhOpt = zh[path]?.ui?.options?.find((o) => o.value === opt.value);
		if (zhOpt?.label) { cur[opt.value] = { label: zhOpt.label, description: zhOpt.description ?? "" }; adoptedO++; continue; }
		// 人工翻译表
		const extraO = EXTRA_OPTIONS[path]?.[opt.value];
		if (extraO) { cur[opt.value] = extraO; adoptedO++; continue; }
		if (IGNORE_OPTIONS[path]?.includes(opt.value)) continue;
		pendingOptions.push({ path, value: opt.value, en: { label: opt.label, description: opt.description } });
	}
	if (Object.keys(cur).length > 0) newOptions[path] = cur;
}

// ── 生成 TS 文本 ──
const q = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

function settingsBlock(): string {
	const lines = ["export const SETTINGS_ZH: Record<string, { label: string; description: string }> = {"];
	for (const [path, v] of Object.entries(newSettings)) {
		lines.push(`\t${q(path)}: {`);
		lines.push(`\t\tlabel: ${q(v.label)},`);
		lines.push(`\t\tdescription: ${q(v.description)},`);
		lines.push(`\t},`);
	}
	lines.push("};");
	return lines.join("\n");
}

function optionsBlock(): string {
	const lines = ["export const OPTION_ZH: Record<string, Record<string, { label?: string; description?: string }>> = {"];
	for (const [path, opts] of Object.entries(newOptions)) {
		lines.push(`\t${q(path)}: {`);
		for (const [value, v] of Object.entries(opts)) {
			const parts: string[] = [];
			if (v.label) parts.push(`label: ${q(v.label)}`);
			if (v.description) parts.push(`description: ${q(v.description)}`);
			if (parts.length > 0) lines.push(`\t\t${q(value)}: { ${parts.join(", ")} },`);
		}
		lines.push(`\t},`);
	}
	lines.push("};");
	return lines.join("\n");
}

// ── 报告 ──
console.log("═══ 导入统计（omp-zh 语料 → index.ts）═══");
console.log(`设置项: 保留 ${keptS} / 采用语料 ${adoptedS} / 待翻译 ${pendingSettings.length} / 清除废除 ${droppedS}`);
console.log(`选  项: 保留 ${keptO} / 采用语料 ${adoptedO} / 待翻译 ${pendingOptions.length}`);

if (pendingSettings.length > 0) {
	console.log("\n── 待翻译设置项（语料与现有表均无）──");
	for (const p of pendingSettings) {
		console.log(`  • ${p.path}`);
		console.log(`    label: ${p.en.label ?? ""}`);
		if (p.en.description) console.log(`    desc:  ${p.en.description.slice(0, 160)}`);
	}
}
if (pendingOptions.length > 0) {
	console.log("\n── 待翻译选项 ──");
	for (const p of pendingOptions) {
		console.log(`  • ${p.path}[${p.value}]: ${p.en.label}${p.en.description ? " — " + p.en.description.slice(0, 100) : ""}`);
	}
}

// ── 写入 ──
if (WRITE) {
	const file = await Bun.file(`${import.meta.dir}/index.ts`).text();
	const lines = file.split("\n");

	// 定位块边界：从 "export const XXX" 行到其后第一个顶格 "};"
	function findBlock(startLine: number): [number, number] {
		let depth = 0, end = -1;
		for (let i = startLine; i < lines.length; i++) {
			if (i === startLine) { depth = 1; continue; }
			for (const ch of lines[i]) {
				if (ch === "{") depth++;
				else if (ch === "}") depth--;
			}
			if (depth === 0) { end = i; break; }
		}
		return [startLine, end];
	}

	const sStart = lines.findIndex((l) => l.startsWith("export const SETTINGS_ZH"));
	const oStart = lines.findIndex((l) => l.startsWith("export const OPTION_ZH"));
	if (sStart < 0 || oStart < 0) throw new Error("找不到字典块起始行");
	const [sFrom, sTo] = findBlock(sStart);
	const [oFrom, oTo] = findBlock(oStart);

	// SETTINGS_ZH 块（行号较小）在前，OPTION_ZH 在后；按原文件顺序拼接
	const out = [
		...lines.slice(0, sFrom),
		...settingsBlock().split("\n"),
		...lines.slice(sTo + 1, oFrom),
		...optionsBlock().split("\n"),
		...lines.slice(oTo + 1),
	];
	await Bun.write(`${import.meta.dir}/index.ts`, out.join("\n"));
	console.log(`\n✓ 已写入 index.ts（SETTINGS_ZH: ${sFrom + 1}-${sTo + 1} → ${Object.keys(newSettings).length} 项；OPTION_ZH: ${oFrom + 1}-${oTo + 1} → ${Object.keys(newOptions).length} 组）`);
} else {
	console.log("\n(dry-run，未写文件。加 --write 写入)");
}
