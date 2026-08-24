#!/usr/bin/env bun
// @ts-nocheck
/**
 * extract-panels.ts — 单语启发式提取信息面板文案（17.3.7 源码 → STRING_ZH 候选）
 *
 * 与 extract-strings.ts（双语语料对齐）不同：本工具不走 omp-zh 语料，
 * 直接从本地源码按渲染调用模式提取英文，译文由维护者提供（MANUAL 表）。
 *
 * 提取模式：theme.bold("...") / theme.fg("dim"|"accent"|"muted"|"warning"|"success", "...")
 *          / new Text("...") / 纯静态字符串数组行（mcp help 块）
 * 过滤：≥6 字符、纯 ASCII、无 ${} 模板、命中 bundle 次数 ≤5
 *
 * 用法：bun extract-panels.ts [--write]
 */

import { STRING_ZH } from "./index.ts";
import { fileURLToPath } from "node:url";
import * as path from "node:path";

const EN_ROOT = "C:/Users/Alex/.bun/install/cache/@oh-my-pi/pi-coding-agent@17.3.7@@registry.npmjs.org@@@1/src";

const FILES = [
	"modes/controllers/command-controller.ts",
	"modes/controllers/mcp-command-controller.ts",
];

// 手翻表：键为英文原文（必须与源码逐字一致），值为中文译文
const MANUAL: Record<string, string> = {
	// ── /session info ──
	"Session Info": "会话信息",
	"Provider": "提供商",
	"Messages": "消息",
	"Tokens": "Token",
	"LSP Servers": "LSP 服务器",
	"MCP Servers": "MCP 服务器",
	"None connected": "无连接",
	"No model selected": "未选择模型",
	"User:": "用户：",
	"Assistant:": "助手：",
	"Tool Calls:": "工具调用：",
	"File:": "文件：",
	"ID:": "ID：",
	"Input:": "输入：",
	"Output:": "输出：",
	"Cache Read:": "缓存读取：",
	"Cache Write:": "缓存写入：",
	"Total:": "总计：",
	"Model:": "模型：",
	"Cost:": "费用：",
	// ── /advisor status ──
	"Advisor Status": "Advisor 状态",
	"Quota": "配额",
	"Context": "上下文",
	"Spend": "消耗",
	// ── /jobs ──
	"Background Jobs": "后台任务",
	"Running Jobs": "运行中的任务",
	"Recent Jobs": "近期的任务",
	"Running:": "运行中：",
	"No background jobs have run in this session.": "本会话尚未运行过后台任务。",
	// ── /usage ──
	"Models with usage data": "有用量数据的模型",
	"Saved rate-limit resets": "已保存的速率限制重置",
	// ── /context 相关 ──
	"Context Usage": "上下文用量",
	"Memory Injection Payload": "记忆注入载荷",
	// ── /mcp 面板 ──
	"MCP Server Management": "MCP 服务器管理",
	"Manage Model Context Protocol (MCP) servers for external tool integrations.": "管理用于外部工具集成的 Model Context Protocol (MCP) 服务器。",
	"Commands:": "命令：",
	"MCP Resources": "MCP 资源",
	"MCP Prompts": "MCP 提示词",
	"MCP Notifications": "MCP 通知",
	"Smithery Login": "Smithery 登录",
	"Configured MCP Servers": "已配置的 MCP 服务器",
	"User level": "用户级",
	"Project level": "项目级",
	"Browser authorization started. Complete auth in your browser.": "浏览器授权已开始。请在浏览器中完成认证。",
	"enabled": "已启用",
	"disabled": "已禁用",
	"(mcp.notifications setting)": "（mcp.notifications 设置）",
	"No MCP resources found.": "未找到 MCP 资源。",
	"No MCP prompts found.": "未找到 MCP 提示词。",
	// ── /hotkeys 面板（标题 + 静态行 + 插值行固定尾段，含管道符保证唯一）──
	"Keyboard Shortcuts": "键盘快捷键",
	"| Key | Action |": "| 按键 | 操作 |",
	"| `Arrow keys` | Move cursor / browse history (Up when empty) |": "| `方向键` | 移动光标 / 浏览历史（空时向上） |",
	"| `Ctrl+A` / `Home` | Start of line |": "| `Ctrl+A` / `Home` | 行首 |",
	"| `Ctrl+E` / `End` | End of line |": "| `Ctrl+E` / `End` | 行尾 |",
	"| `Enter` | Send message |": "| `Enter` | 发送消息 |",
	"| `Ctrl+U` | Delete to start of line |": "| `Ctrl+U` | 删除至行首 |",
	"| `Ctrl+K` | Delete to end of line |": "| `Ctrl+K` | 删除至行尾 |",
	"| `Tab` | Path completion / accept autocomplete |": "| `Tab` | 路径补全 / 接受自动补全 |",
	"| Hold `Space` | Speech-to-text (push-to-talk): hold to record, release to transcribe |": "| 按住 `Space` | 语音转文字（按键说话）：按住录音，松开转写 |",
	"| `#<number>` | GitHub issue/PR reference (e.g. `#3164` → `pr://`/`issue://`) |": "| `#<数字>` | GitHub issue/PR 引用（如 `#3164` → `pr://`/`issue://`） |",
	"| `#` / `#<text>` | Prompt actions (copy / undo / move cursor) |": "| `#` / `#<文本>` | 提示词操作（复制 / 撤销 / 移动光标） |",
	"| `/` | Slash commands |": "| `/` | 斜杠命令 |",
	"| `!` | Run bash command |": "| `!` | 运行 bash 命令 |",
	"| `!!` | Run bash command (excluded from context) |": "| `!!` | 运行 bash 命令（不进入上下文） |",
	"| `$` | Run Python in shared kernel |": "| `$` | 在共享内核中运行 Python |",
	"| `$$` | Run Python (excluded from context) |": "| `$$` | 运行 Python（不进入上下文） |",
	"| Move by word |": "| 按词移动",
	"| Delete word backwards |": "| 向前删除一个词",
	"Copy current line": "复制当前行",
	"Copy whole prompt": "复制整个提示词",
	"| Cancel autocomplete / interrupt active work |": "| 取消自动补全 / 中断进行中的工作",
	"| Clear editor (first) / exit (second) |": "| 清空编辑器（第一次）/ 退出（第二次）",
	"| Exit (saves current prompt as draft) |": "| 退出（当前提示词存为草稿）",
	"| Suspend to background |": "| 挂起到后台",
	"Reset terminal display": "重置终端显示",
	"Cycle thinking level": "循环切换思考级别",
	"| Cycle role models (slow/default/smol) |": "| 循环切换角色模型（slow/default/smol）",
	"| Cycle role models (backward) |": "| 循环切换角色模型（反向）",
	"| Select model (temporary) |": "| 选择模型（临时）",
	"| Select model (set roles) |": "| 选择模型（设置角色）",
	"Toggle plan mode": "切换计划模式",
	"| Search prompt history |": "| 搜索提示词历史",
	"| Toggle tool output expansion |": "| 切换工具输出展开",
	"| Toggle tool activity visibility |": "| 切换工具活动可见性",
	"| Toggle thinking block visibility |": "| 切换思考块可见性",
	"| Edit message in external editor |": "| 在外部编辑器中编辑消息",
	"Retry last failed assistant turn": "重试上次失败的助手轮次",
	"Paste image or text from clipboard": "从剪贴板粘贴图片或文本",
	"| Start/stop live voice mode (/live) |": "| 开始/停止实时语音模式（/live）",
	// ── MCP 流程与状态（extract 参考清单补翻）──
	"Tool Results:": "工具结果：",
	"Append-Only:": "仅追加：",
	"Premium Requests:": "高级请求：",
	"No async jobs yet.": "暂无异步任务。",
	"Open authorization URL:": "打开授权 URL：",
	"Preparing browser authorization...": "正在准备浏览器授权...",
	"Waiting for authorization... (Press Esc to cancel, 5 minute timeout)": "等待授权中…（按 Esc 取消，5 分钟超时）",
	"Alternative if browser did not open:": "若浏览器未打开，备选方式：",
	"Server creation cancelled.": "服务器创建已取消。",
	"Tip: Press Ctrl+C or Esc anytime to cancel": "提示：随时按 Ctrl+C 或 Esc 取消",
	"No MCP servers configured.": "未配置 MCP 服务器。",
	" (discovered servers):": "（已发现的服务器）：",
	"Not connected yet": "尚未连接",
	"Some servers failed to connect:": "部分服务器连接失败：",
	"Templates:": "模板：",
	"No resources available on connected servers.": "已连接的服务器上无可用资源。",
	"No prompts available on connected servers.": "已连接的服务器上无可用提示词。",
	"no active subscriptions": "无有效订阅",
	"inactive (notifications disabled)": "未激活（通知已禁用）",
	"No servers support notifications.": "没有服务器支持通知。",
	"Authorize URL:": "授权 URL：",
	"If browser auth fails, you can paste an API key.": "若浏览器认证失败，可粘贴 API 密钥。",
	"Reloading MCP servers and runtime tools...": "正在重载 MCP 服务器与运行时工具...",
	"| Copy current line |": "| 复制当前行 |",
	"| Copy whole prompt |": "| 复制整个提示词 |",
	"| Toggle plan mode |": "| 切换计划模式 |",
	"| Cycle thinking level |": "| 循环切换思考级别 |",
	"| Reset terminal display |": "| 重置终端显示 |",
	" | Start of line |": " | 行首 |",
	" | End of line |": " | 行尾 |",
	// ── /tools 面板 ──
	"Available Tools": "可用工具",
};

// ── 提取 ──
const seen = new Set<string>();
for (const rel of FILES) {
	const text = await Bun.file(`${EN_ROOT}/${rel}`).text();
	// 渲染调用包裹的字符串
	const patterns = [
		/theme\.bold\("((?:[^"\\\n]|\\.)*)"\)/g,
		/theme\.fg\("(?:dim|accent|muted|warning|success|error)", "((?:[^"\\\n]|\\.)*)"\)/g,
	];
	for (const re of patterns) {
		let m: RegExpExecArray | null;
		while ((m = re.exec(text)) !== null) seen.add(m[1]);
	}
}

// ── bundle 命中校验 ──
const bundleStr = (s: string) =>
	s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[^\x00-\x7f]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
const moduleUrl = import.meta.resolve("@oh-my-pi/pi-coding-agent/config/settings-schema");
const cliPath = path.join(fileURLToPath(moduleUrl).replace(/[\/\\]src[\/\\]config[\/\\]settings-schema\.ts$/, ""), "dist", "cli.js");
const bakPath = cliPath + ".bak";
const bundle = (await Bun.file(bakPath).exists() ? await Bun.file(bakPath).text() : await Bun.file(cliPath).text());

const accepted: Array<{ en: string; zh: string }> = [];
const rejected: Array<{ en: string; reason: string }> = [];
for (const [en, zh] of Object.entries(MANUAL)) {
	if (STRING_ZH[en] !== undefined) { rejected.push({ en, reason: "已收录" }); continue; }
	// 带引号形态优先；含 | 的表格行回退裸子串形态（模板串内固定段）
	const n = bundle.split(`"${bundleStr(en)}"`).length - 1 || (en.includes("|") ? bundle.split(bundleStr(en)).length - 1 : 0);
	if (n === 0) { rejected.push({ en, reason: "bundle 未命中" }); continue; }
	if (n > 5) { rejected.push({ en, reason: `命中 ${n} 次（误伤风险）` }); continue; }
	accepted.push({ en, zh });
}
// 源码提取到但 MANUAL 未提供译文的（盘点参考）
const untranslated: string[] = [];
for (const en of seen) {
	if (MANUAL[en] === undefined && STRING_ZH[en] === undefined && en.length >= 10 && /^[\x20-\x7e]+$/.test(en)) untranslated.push(en);
}

console.log(`═══ 面板文案提取（${FILES.length} 文件）═══`);
console.log(`MANUAL ${Object.keys(MANUAL).length} 条 → 采纳 ${accepted.length}，拒绝 ${rejected.length}`);
if (rejected.length > 0) {
	console.log("\n── 拒绝明细 ──");
	for (const r of rejected) console.log(`  ✗ [${r.reason}] "${r.en.slice(0, 60)}"`);
}
if (untranslated.length > 0) {
	console.log(`\n── 源码提取到但未提供译文（${untranslated.length} 条，参考）──`);
	for (const s of untranslated.slice(0, 60)) console.log(`  ? "${s.slice(0, 70)}"`);
}

if (process.argv.includes("--write")) {
	const file = `${import.meta.dir}/index.ts`;
	const lines = (await Bun.file(file).text()).split("\n");
	let end = -1;
	for (let i = 0; i < lines.length; i++) if (lines[i] === "};" && lines[i - 1]?.startsWith("\t") && lines.findIndex((l) => l.startsWith("export const STRING_ZH")) < i) { end = i; break; }
	if (end < 0) throw new Error("找不到 STRING_ZH 块尾");
	const q = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
	const rows = accepted.sort((a, b) => a.en.localeCompare(b.en)).map((a) => `\t${q(a.en)}: ${q(a.zh)},`);
	const out = [...lines.slice(0, end), ...rows, ...lines.slice(end)];
	await Bun.write(file, out.join("\n"));
	console.log(`\n✓ 已并入 ${accepted.length} 条到 STRING_ZH`);
} else {
	console.log("\n(dry-run。加 --write 并入 index.ts)");
}
