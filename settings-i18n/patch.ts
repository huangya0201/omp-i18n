// @ts-nocheck
/**
 * OMP i18n 补丁脚本 — 直接替换编译文件 (dist/cli.js) 中的英文字符串
 *
 * 用法：bun ~/.omp/agent/extensions/settings-i18n/patch.ts
 *
 * 原理：omp 16.0.6 从 dist/cli.js (编译 bundle) 运行，扩展通过 import
 * 拿到的是 src 副本，修改不互通。本脚本直接修改 bundle 中的字符串，
 * 用 Unicode 转义 (\uXXXX) 保持文件纯 ASCII，避免编码问题。
 *
 * 每次 omp 更新后重新运行即可。
 */
import { TAB_ZH, SETTINGS_ZH, OPTION_ZH, COMMAND_ZH, SUBCOMMAND_ZH, STRING_ZH } from "./index.ts";
import { SETTINGS_SCHEMA, TAB_METADATA } from "@oh-my-pi/pi-coding-agent/config/settings-schema";
import pkg from "@oh-my-pi/pi-coding-agent/package.json";
import { BUILTIN_SLASH_COMMANDS } from "@oh-my-pi/pi-coding-agent/slash-commands/builtin-registry";
import { fileURLToPath } from "node:url";
import * as path from "node:path";

// ── 工具函数 ──────────────────────────────────────────────────────────────

/** 中文字符串 → \uXXXX\uXXXX...（写入文件后是纯 ASCII，绕过编码问题）*/
function esc(s: string): string {
	return [...s]
		.map((c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"))
		.join("");
}

/** 英文原文在 bundle 中被 minifier 转义（\ → \\, " → \", 非 ASCII → \uXXXX），匹配时需同步 */
function bundleStr(s: string): string {
	return s
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/[^\x00-\x7f]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
}

/** 定位 omp 编译文件 */
function findCliJs(): string {
	// import.meta.resolve 返回模块的 file:// URL，从中推导包根目录
	const moduleUrl = import.meta.resolve("@oh-my-pi/pi-coding-agent/config/settings-schema");
	const modulePath = fileURLToPath(moduleUrl);
	const pkgRoot = modulePath.replace(/[\/\\]src[\/\\]config[\/\\]settings-schema\.ts$/, "");
	return path.join(pkgRoot, "dist", "cli.js");
}

// ── 生成替换对 ────────────────────────────────────────────────────────────

type Pair = [string, string];
const pairs: Pair[] = [];

// 宽松访问 schema（类型由 as const 推导，这里只需读 ui 属性）
const schema = SETTINGS_SCHEMA as unknown as Record<
	string,
	{ ui?: { label?: string; description?: string; options?: Array<{ value: string; label?: string; description?: string }> } }
>;

// 1. Tab 标签：用 icon 后缀保证唯一
for (const [tab, zh] of Object.entries(TAB_ZH)) {
	const en = TAB_METADATA[tab]?.label;
	if (en) {
		pairs.push([`label:"${bundleStr(en)}",icon:"tab.${tab}"`, `label:"${esc(zh)}",icon:"tab.${tab}"`]);
	}
}

// 2. 命令描述 + 子命令描述
for (const cmd of BUILTIN_SLASH_COMMANDS) {
	const zh = COMMAND_ZH[cmd.name];
	if (zh && cmd.description) {
		pairs.push([`description:"${bundleStr(cmd.description)}"`, `description:"${esc(zh)}"`]);
	}
	const subs = SUBCOMMAND_ZH[cmd.name];
	if (subs && cmd.subcommands) {
		for (const sub of cmd.subcommands) {
			const zhSub = subs[sub.name];
			if (zhSub && sub.description) {
				pairs.push([`description:"${bundleStr(sub.description)}"`, `description:"${esc(zhSub)}"`]);
			}
		}
	}
}

// 3. 设置项 label + description
for (const [path, zh] of Object.entries(SETTINGS_ZH)) {
	const ui = schema[path]?.ui;
	if (ui) {
		if (ui.label && zh.label) {
			pairs.push([`label:"${bundleStr(ui.label)}"`, `label:"${esc(zh.label)}"`]);
		}
		if (ui.description && zh.description) {
			pairs.push([`description:"${bundleStr(ui.description)}"`, `description:"${esc(zh.description)}"`]);
		}
	}
}

// 4. 选项 label + description
for (const [path, options] of Object.entries(OPTION_ZH)) {
	const opts = schema[path]?.ui?.options;
	if (opts) {
		for (const opt of opts) {
			const zhOpt = options[opt.value];
			if (zhOpt) {
				if (zhOpt.label && opt.label) {
				pairs.push([`label:"${bundleStr(opt.label)}"`, `label:"${esc(zhOpt.label)}"`]);
				}
				if (zhOpt.description && opt.description) {
				pairs.push([`description:"${bundleStr(opt.description)}"`, `description:"${esc(zhOpt.description)}"`]);
				}
			}
		}
	}
}


// 5. 通用平字符串（TUI 面板 / CLI 帮助文案）：带引号完整字面量匹配；
// 含 | 的表格行额外生成裸形态对（模板串固定段无引号包裹）。
// 短句误伤风险由 count>5 保护 + 字典收录规则（≥12 字符、不收模板句）控制。
// 双宿主：同一英文既在键位表（带引号常量）又在模板串（裸固定段）时两个对都生成
for (const [enStr, zhStr] of Object.entries(STRING_ZH)) {
	if (enStr.includes("|")) pairs.push([bundleStr(enStr), esc(zhStr)]);
	pairs.push([`"${bundleStr(enStr)}"`, `"${esc(zhStr)}"`]);
}
console.log(`生成 ${pairs.length} 个替换对`);

// ── 应用替换 ──────────────────────────────────────────────────────────────

const cliPath = findCliJs();
const bakPath = cliPath + ".bak";
console.log("目标文件:", cliPath);

// 版本检测 + 备份（omp 更新后自动刷新备份，防止版本回退）
const versionPath = bakPath + ".version";
const bakVersion = (await Bun.file(versionPath).exists()) ? await Bun.file(versionPath).text() : "";
if (pkg.version !== bakVersion) {
	const cur = await Bun.file(cliPath).text();
	await Bun.write(bakPath, cur);
	await Bun.write(versionPath, pkg.version);
	console.log(bakVersion
		? `✓ 检测到版本更新（${bakVersion} → ${pkg.version}），已刷新备份`
		: `✓ 已备份原始文件 → cli.js.bak`
	);
}

// 从备份替换（幂等：多次运行结果一致）
let source = await Bun.file(bakPath).text();
let replaced = 0;
const skipped: Array<{ pattern: string; count: number }> = [];
const missed: string[] = [];

for (const [from, to] of pairs) {
	// 1. 双引号（原始模式）
	const count = source.split(from).length - 1;
	if (count > 5) {
		skipped.push({ pattern: from.slice(0, 70), count });
		continue;
	}
	if (count > 0) {
		source = source.replaceAll(from, to);
		replaced++;
		continue;
	}
	// 2. 双引号未匹配 → 单引号变体（bun minifier 对部分字符串用单引号）
	const sqFrom = from.replace(/:"([^"]*)"/, ":'$1'");
	const sqCount = source.split(sqFrom).length - 1;
	if (sqCount > 0 && sqCount <= 5) {
		source = source.replaceAll(sqFrom, to);
		replaced++;
		continue;
	}
	// 3. 裸子串回退：模板串（反引号）内的固定段无引号包裹，仅限含 | 的表格行形态
	const bare = from.startsWith('"') ? from.slice(1, -1) : from;
	if (bare.includes("|")) {
		const bareCount = source.split(bare).length - 1;
		if (bareCount > 0 && bareCount <= 5) {
			source = source.replaceAll(bare, to.startsWith('"') ? to.slice(1, -1) : to);
			replaced++;
			continue;
		}
	}
	missed.push(from.slice(0, 70));
}

await Bun.write(cliPath, source);

// ── 报告 ──────────────────────────────────────────────────────────────────

console.log(`\n═══ 替换结果 ═══`);
console.log(`✓ 成功替换: ${replaced}/${pairs.length}`);
if (skipped.length > 0) {
	console.log(`⚠ 跳过 ${skipped.length} 个（出现 >5 次，可能非 UI 上下文）：`);
	for (const s of skipped.slice(0, 10)) console.log(`   ${s.count}x ${s.pattern}`);
}
if (missed.length > 0) {
	console.log(`✗ 未匹配 ${missed.length} 个（格式可能不同或已移除）：`);
	for (const m of missed.slice(0, 10)) console.log(`   ${m}`);
}
console.log(`\n重启 omp 查看效果。恢复原版：cp "${bakPath}" "${cliPath}"`);
