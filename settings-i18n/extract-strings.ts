#!/usr/bin/env bun
// @ts-nocheck
/**
 * extract-strings.ts — 中英语料对齐提取 B/D 档文案 → STRING_ZH 候选
 *
 * 原理：omp-zh（基线 ≈17.2.14）与本地 17.3.7 的同名文件结构基本一致，
 * 只是字符串字面量被译为中文。逐行提取两边的字符串字面量序列，
 * 行结构（去掉字面量后）一致的行做配对：英文句 → 中文译文。
 *
 * 收录规则（与 STRING_ZH 字典约定一致）：
 *   - 静态完整字符串，≥12 字符（防 bundle 误伤）
 *   - 含 ${} / 反引号模板、含转义、含 \n 的不收
 *   - 译文必须含 CJK 字符
 *
 * 用法：bun extract-strings.ts [--write]
 *   默认打印候选清单 + 落地校验；--write 直接把通过校验的条目并入 index.ts 的 STRING_ZH
 */
import { fileURLToPath } from "node:url";
import * as path from "node:path";
import { STRING_ZH } from "./index.ts";

const ZH_ROOT = "D:/Data/Learn/.tmp-ompzh/repo/packages/coding-agent/src";
const EN_ROOT = "C:/Users/Alex/.bun/install/cache/@oh-my-pi/pi-coding-agent@17.3.7@@registry.npmjs.org@@@1/src";

const FILES = [
	"modes/utils/context-usage.ts",
	"modes/utils/hotkeys-markdown.ts",
	"modes/components/tree-selector.ts",
	"modes/components/session-selector.ts",
	"modes/components/model-browser.ts",
	"modes/components/model-picker.ts",
	"modes/components/mcp-add-wizard.ts",
	"modes/controllers/mcp-command-controller.ts",
	"modes/components/settings-selector.ts",
	"modes/components/plugin-selector.ts",
	"modes/components/plugin-settings.ts",
	"utils/changelog.ts",
	"cli/command-help.ts",
	"cli/help-extra.ts",
];

// 字符串字面量：双引号 / 单引号（不含模板反引号）
function literals(line: string): string[] {
	const out: string[] = [];
	const re = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(line)) !== null) {
		if (m[1] !== undefined) out.push(m[1]);
		else if (m[2] !== undefined) out.push(m[2]);
	}
	return out;
}

const hasCJK = (s: string) => /[\u4e00-\u9fff]/.test(s);
const isPlainASCII = (s: string) => /^[\x20-\x7e]*$/.test(s);

const candidates: Array<{ en: string; zh: string; file: string }> = [];
const skippedStruct = new Map<string, number>();

// 手翻覆盖表：行漂移导致的错位配对在此以人工译文覆盖；语料缺失的补充条目也放这里。
// （command-help.ts 全量 33 条为人工翻译——17.2.14→17.3.7 新增命令使行级对齐错位）
const MANUAL: Record<string, string> = {
	"Run Oh My Pi as an ACP (Agent Client Protocol) server over stdio": "以 ACP（Agent Client Protocol）服务器模式通过 stdio 运行 Oh My Pi",
	"Manage bundled task agents": "管理内置的 task Agent",
	"Manage the omp auth-broker (credential vault)": "管理 omp auth-broker（凭据保险库）",
	"Run an auth-gateway forward proxy backed by the configured broker": "运行由已配置 broker 支撑的 auth-gateway 正向代理",
	"Benchmark models with the same prompt: time-to-first-token and generation throughput (tokens/s)": "用相同提示词对模型做基准测试：首 token 耗时与生成吞吐量 (tokens/s)",
	"Run the local CDP relay that lets the browser tool drive your own Chrome tabs": "运行本地 CDP relay，让浏览器工具操控你自己的 Chrome 标签页",
	"Detect and fix project diagnostics with weighted parallel subagents": "用加权并行子 Agent 检测并修复项目诊断",
	"Generate a commit message and update changelogs": "生成提交信息并更新变更日志",
	"Print a shell completion script (bash, zsh, or fish)": "输出 shell 补全脚本（bash、zsh 或 fish）",
	"Rewrite a text file into the dense prompt register, reporting what it drops": "将文本文件重写为密集提示词寄存器，并报告丢弃的内容",
	"Manage configuration settings": "管理配置设置",
	"Dry-run OAuth account balancing across random session ids": "按随机会话 id 预演 OAuth 账户均衡",
	"Preview tool renderers across streaming, in-progress, success, and failure states": "预览工具渲染器在流式、进行中、成功与失败状态下的效果",
	"Run storage garbage collection": "运行存储垃圾回收",
	"Test grep tool": "测试 grep 工具",
	"View, clean, or push reported tool issues (auto-QA grievances)": "查看、清理或推送报告的工具问题（auto-QA grievances）",
	"Install or link an extension package (alias of `plugin install`/`plugin link`)": "安装或链接扩展包（`plugin install`/`plugin link` 的别名）",
	"Join a shared collab session (same as /join)": "加入共享协作会话（同 /join）",
	"List, search, and refresh available models": "列出、搜索并刷新可用模型",
	"Manage plugins (install, uninstall, list, etc.)": "管理插件（安装、卸载、列表等）",
	"Show what the read tool will return for a path, URL, or internal URI": "查看 read 工具对路径、URL 或内部 URI 将返回的内容",
	"Synthesize text with the local TTS engine and play it through the speakers": "用本地 TTS 引擎合成文本并通过扬声器播放",
	"Test web search providers": "测试网页搜索提供商",
	"Share a saved session via an encrypted link (same as /share)": "通过加密链接分享已保存的会话（同 /share）",
	"Run onboarding setup or install dependencies for optional features": "运行引导设置，或安装可选功能的依赖",
	"Interactive shell console": "交互式 shell 控制台",
	"Manage SSH host configurations": "管理 SSH 主机配置",
	"View usage statistics": "查看用量统计",
	"Download tiny local models (session titles + memory)": "下载微型本地模型（会话标题 + 记忆）",
	"Get the API key or OAuth token for a provider": "获取提供商的 API 密钥或 OAuth token",
	"Inspect and test Time-Traveling Stream Rules (TTSR)": "检查并测试时光回溯流规则（TTSR）",
	"Check for and install updates": "检查并安装更新",
	"Show provider usage limits for every authenticated account": "显示每个已认证账户的提供商用量限制",
	"List or clear agent-managed git worktrees (~/.omp/wt)": "列出或清除 Agent 管理的 git worktree（~/.omp/wt）",
	"stdio (Local process)": "stdio（本地进程）",
	"URL is required": "URL 为必填",
	"**Navigation**": "**导航**",
	"**Editing**": "**编辑**",
	"**Other**": "**其他**",
};
for (const rel of FILES) {
	let enText: string, zhText: string;
	try {
		enText = await Bun.file(`${EN_ROOT}/${rel}`).text();
		zhText = await Bun.file(`${ZH_ROOT}/${rel}`).text();
	} catch {
		console.log(`⚠ 跳过（读不到）: ${rel}`);
		continue;
	}
	const enLines = enText.split(/\r?\n/);
	const zhLines = zhText.split(/\r?\n/);
	if (enLines.length !== zhLines.length) skippedStruct.set(rel, enLines.length - zhLines.length);

	const skeleton = (l: string) => l.replace(/"(?:[^"\\\n]|\\.)*"/g, '""').replace(/'(?:[^'\\\n]|\\.)*'/g, "''");
	for (let i = 0; i < Math.min(enLines.length, zhLines.length); i++) {
		const enL = enLines[i], zhL = zhLines[i];
		if (skeleton(enL) !== skeleton(zhL)) continue;
		const enLits = literals(enL);
		const zhLits = literals(zhL);
		if (enLits.length !== zhLits.length || enLits.length === 0) continue;
		for (let k = 0; k < enLits.length; k++) {
			const en = enLits[k], zh = zhLits[k];
			if (en === zh) continue;
			if (en.length < 12 || en.length > 200) continue;
			if (!isPlainASCII(en)) continue;
			if (!hasCJK(zh)) continue;
			if (/[$`]/.test(en) || /\n/.test(en)) continue;
			candidates.push({ en, zh, file: rel });
		}
	}
}

// bundle 落地校验：英文原句必须存在于当前 dist（cli.js.bak 优先）
const bundleStr = (s: string) =>
	s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[^\x00-\x7f]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
const moduleUrl = import.meta.resolve("@oh-my-pi/pi-coding-agent/config/settings-schema");
const cliPath = path.join(fileURLToPath(moduleUrl).replace(/[\/\\]src[\/\\]config[\/\\]settings-schema\.ts$/, ""), "dist", "cli.js");
const bakPath = cliPath + ".bak";
const bundle = (await Bun.file(bakPath).exists() ? await Bun.file(bakPath).text() : await Bun.file(cliPath).text());

// 同英文多译：取出现次数最多的译文
const byEn = new Map<string, Map<string, string>>();
for (const c of candidates) {
	if (!byEn.has(c.en)) byEn.set(c.en, new Map());
	byEn.get(c.en)!.set(c.zh, (byEn.get(c.en)!.get(c.zh) ?? "") + "|" + c.file);
}

const accepted: Array<{ en: string; zh: string }> = [];
const rejected: Array<{ en: string; zh: string; reason: string }> = [];
for (const en of new Set([...Object.keys(MANUAL), ...byEn.keys()])) {
	if (STRING_ZH[en] !== undefined) continue; // 已收录
	if (MANUAL[en] !== undefined) {
		if (bundle.includes(`"${bundleStr(en)}"`)) accepted.push({ en, zh: MANUAL[en] });
		else rejected.push({ en, zh: MANUAL[en], reason: "bundle 不含该英文原句" });
		continue;
	}
	const entries = [...byEn.get(en)!.entries()].sort((a, b) => b[1].length - a[1].length);
	const [zh] = entries[0];
	if (entries.length > 1) rejected.push({ en, zh, reason: `多译冲突 ${entries.length} 种` });
	else if (!bundle.includes(`"${bundleStr(en)}"`)) rejected.push({ en, zh, reason: "bundle 不含该英文原句" });
	else accepted.push({ en, zh });
}
console.log(`═══ 中英对齐提取（${FILES.length} 文件）═══`);
console.log(`候选 ${candidates.length} 条 → 去重 ${byEn.size} → 采纳 ${accepted.length}，拒绝 ${rejected.length}`);
for (const f of skippedStruct) console.log(`⚠ 行数漂移 ${f[0]}: ${f[1] > 0 ? "+" : ""}${f[1]} 行（漂移部分未对齐）`);
console.log("\n── 拒绝明细（前 30）──");
for (const r of rejected.slice(0, 30)) console.log(`  ✗ [${r.reason}] "${r.en.slice(0, 70)}" → ${r.zh.slice(0, 40)}`);

if (process.argv.includes("--write")) {
	// 并入 index.ts 的 STRING_ZH 块
	const file = `${import.meta.dir}/index.ts`;
	const lines = (await Bun.file(file).text()).split("\n");
	const start = lines.findIndex((l) => l.startsWith("export const STRING_ZH"));
	if (start < 0) throw new Error("找不到 STRING_ZH 块");
	let end = -1;
	for (let i = start + 1; i < lines.length; i++) if (lines[i] === "};") { end = i; break; }
	const q = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
	const rows = accepted
		.sort((a, b) => a.en.localeCompare(b.en))
		.map((a) => `\t${q(a.en)}: ${q(a.zh)},`);
	// 按来源文件分组注释
	const out = [...lines.slice(0, end), ...rows, ...lines.slice(end)];
	await Bun.write(file, out.join("\n"));
	console.log(`\n✓ 已并入 ${accepted.length} 条到 STRING_ZH（追加在块尾，含原有关闭行前）`);
} else {
	console.log("\n── 采纳清单 ──");
	for (const a of accepted) console.log(`  ✓ "${a.en.slice(0, 70)}" → ${a.zh.slice(0, 45)}`);
	console.log("\n(dry-run。加 --write 并入 index.ts)");
}
