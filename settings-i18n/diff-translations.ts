#!/usr/bin/env bun
// @ts-nocheck
/**
 * diff-translations.ts — omp 更新后翻译差异检测
 *
 * 用法：
 *   bun diff-translations.ts           检查差异（只读，不修改任何文件）
 *   bun diff-translations.ts --update  检查差异并更新英文快照（供下次对比）
 *
 * 检测三类变化：
 *   ✨ 新增 — 当前版本有但翻译表没有（需要添加翻译）
 *   🗑️ 废除 — 翻译表有但当前版本已移除（可以清理冗余）
 *   📝 变化 — 英文原文与上次快照不同（翻译需要更新）
 */

import { SETTINGS_SCHEMA, TAB_METADATA } from "@oh-my-pi/pi-coding-agent/config/settings-schema";
import { BUILTIN_SLASH_COMMANDS } from "@oh-my-pi/pi-coding-agent/slash-commands/builtin-registry";
import { TAB_ZH, SETTINGS_ZH, OPTION_ZH, COMMAND_ZH, SUBCOMMAND_ZH, STRING_ZH } from "./index.ts";
import pkg from "@oh-my-pi/pi-coding-agent/package.json";
import { fileURLToPath } from "node:url";
import * as path from "node:path";

const SNAPSHOT_PATH = `${import.meta.dir}/en-snapshot.json`;
const shouldUpdate = process.argv.slice(2).some((a: string) => a === "--update" || a === "-u");

// ── ANSI 颜色 ───────────────────────────────────────────────────────────
const wrap = (code: string) => (s: string) => `\x1b[${code}m${s}\x1b[0m`;
const dim = wrap("2"), green = wrap("32"), yellow = wrap("33"), red = wrap("31"), cyan = wrap("36"), bold = wrap("1");
const trunc = (s: string, n = 60) => (s.length > n ? s.slice(0, n) + "…" : s);
const isNumeric = (s: string) => /^\d/.test(s);

// ── 提取当前版本的英文 UI 文本 ──────────────────────────────────────────

interface Snapshot {
	version: string;
	settings: Record<string, { label: string; description: string }>;
	options: Record<string, Record<string, { label?: string; description?: string }>>;
	commands: Record<string, string>;
	subcommands: Record<string, Record<string, string>>;
	tabs: string[];
}

function extract(): Snapshot {
	const settings: Snapshot["settings"] = {};
	const options: Snapshot["options"] = {};

	for (const [path, cfg] of Object.entries(SETTINGS_SCHEMA as Record<string, { ui?: Record<string, unknown> }>)) {
		const ui = cfg?.ui as
			| { label?: string; description?: string; tab?: string; options?: Array<{ value: string; label?: string; description?: string }> }
			| undefined;
		if (!ui) continue;
		settings[path] = { label: ui.label || "", description: ui.description || "" };
		if (Array.isArray(ui.options)) {
			const opts: Record<string, { label?: string; description?: string }> = {};
			for (const opt of ui.options) opts[opt.value] = { label: opt.label, description: opt.description };
			options[path] = opts;
		}
	}

	const commands: Snapshot["commands"] = {};
	const subcommands: Snapshot["subcommands"] = {};
	for (const cmd of BUILTIN_SLASH_COMMANDS as Array<{ name: string; description?: string; subcommands?: Array<{ name: string; description?: string }> }>) {
		commands[cmd.name] = cmd.description || "";
		if (cmd.subcommands) {
			const subs: Record<string, string> = {};
			for (const sub of cmd.subcommands) subs[sub.name] = sub.description || "";
			subcommands[cmd.name] = subs;
		}
	}

	return { version: pkg.version, settings, options, commands, subcommands, tabs: Object.keys(TAB_METADATA).sort() };
}

async function loadSnapshot(): Promise<Snapshot | null> {
	const f = Bun.file(SNAPSHOT_PATH);
	if (!(await f.exists())) return null;
	return JSON.parse(await f.text());
}

// ── 主逻辑 ──────────────────────────────────────────────────────────────

async function main() {
	const cur = extract();
	const prev = await loadSnapshot();
	const hasSnap = prev !== null;

	console.log(`\n${bold("OMP 翻译差异报告")} ${dim("—")} ${cyan(cur.version)}`);
	if (hasSnap) {
		console.log(`${dim("上次快照")}: ${prev.version}${prev.version !== cur.version ? yellow(" ← 版本已更新") : ""}\n`);
	} else {
		console.log(dim("(首次运行，无快照)\n"));
	}

	let totalNew = 0;
	let totalRemoved = 0;
	let totalChanged = 0;

	// ── 设置项 ──
	console.log(bold("━━━ 设置项 ━━━"));
	const sAdded = Object.keys(cur.settings).filter((p) => !SETTINGS_ZH[p]);
	const sRemoved = Object.keys(SETTINGS_ZH).filter((p) => !cur.settings[p]);
	if (sAdded.length) {
		console.log(`  ${green("✨ 新增")} ${dim(`(${sAdded.length} 项需要翻译):`)}`);
		for (const p of sAdded) console.log(`    ${dim("•")} ${p}: "${trunc(cur.settings[p].label)}" — "${trunc(cur.settings[p].description || "", 60)}"`);
		totalNew += sAdded.length;
	}
	if (sRemoved.length) {
		console.log(`  ${red("🗑️ 废除")} ${dim(`(${sRemoved.length} 项翻译表冗余):`)}`);
		for (const p of sRemoved) console.log(`    ${dim("•")} ${p}: "${trunc(SETTINGS_ZH[p].label)}"`);
		totalRemoved += sRemoved.length;
	}
	let sChanged = 0;
	if (hasSnap) {
		for (const [p, en] of Object.entries(cur.settings)) {
			const old = prev.settings[p];
			if (old && (old.label !== en.label || old.description !== en.description)) {
				if (sChanged === 0) console.log(`  ${yellow("📝 文本变化")} ${dim("(翻译需更新):")}`);
				console.log(`    ${dim("•")} ${p}:`);
				if (old.label !== en.label) console.log(`      label: ${red(trunc(old.label, 40))} → ${green(trunc(en.label, 40))}`);
				if (old.description !== en.description) console.log(`      desc:  ${red(trunc(old.description, 40))} → ${green(trunc(en.description, 40))}`);
				sChanged++;
			}
		}
		totalChanged += sChanged;
	}
	if (!sAdded.length && !sRemoved.length && !sChanged) console.log(`  ${dim("✓ 无变化")}`);

	// ── 选项 ──
	console.log(bold("\n━━━ 选项 ━━━"));
	let oAdded = 0;
	let oRemoved = 0;
	for (const [path, optZh] of Object.entries(OPTION_ZH as Record<string, Record<string, unknown>>)) {
		const curOpts = cur.options[path];
		if (!curOpts) continue;
		for (const [val, en] of Object.entries(curOpts)) {
			if (!optZh[val] && en.label && !isNumeric(en.label)) {
				if (oAdded === 0) console.log(`  ${green("✨ 新增选项")}:`);
				console.log(`    ${dim("•")} ${path}[${val}]: "${trunc(en.label)}" — "${trunc(en.description || "", 40)}"`);
				oAdded++;
			}
		}
		for (const val of Object.keys(optZh)) {
			if (!curOpts[val]) {
				if (oRemoved === 0) console.log(`  ${red("🗑️ 废除选项")}:`);
				console.log(`    ${dim("•")} ${path}[${val}]`);
				oRemoved++;
			}
		}
	}
	if (!oAdded && !oRemoved) console.log(`  ${dim("✓ 无变化")}`);
	totalNew += oAdded;
	totalRemoved += oRemoved;

	// ── 命令 ──
	console.log(bold("\n━━━ 命令 ━━━"));
	const cAdded = Object.keys(cur.commands).filter((n) => !COMMAND_ZH[n]);
	const cRemoved = Object.keys(COMMAND_ZH).filter((n) => !cur.commands[n]);
	if (cAdded.length) {
		console.log(`  ${green("✨ 新增")}:`);
		for (const n of cAdded) console.log(`    ${dim("•")} /${n}: "${trunc(cur.commands[n])}"`);
		totalNew += cAdded.length;
	}
	if (cRemoved.length) {
		console.log(`  ${red("🗑️ 废除")}:`);
		for (const n of cRemoved) console.log(`    ${dim("•")} /${n}`);
		totalRemoved += cRemoved.length;
	}
	let cChanged = 0;
	if (hasSnap) {
		for (const [n, desc] of Object.entries(cur.commands)) {
			if (prev.commands[n] && prev.commands[n] !== desc) {
				if (cChanged === 0) console.log(`  ${yellow("📝 描述变化")}:`);
				console.log(`    ${dim("•")} /${n}: ${red(trunc(prev.commands[n], 40))} → ${green(trunc(desc, 40))}`);
				cChanged++;
			}
		}
		totalChanged += cChanged;
	}
	if (!cAdded.length && !cRemoved.length && !cChanged) console.log(`  ${dim("✓ 无变化")}`);

	// ── 子命令 ──
	console.log(bold("\n━━━ 子命令 ━━━"));
	let subAdded = 0;
	let subRemoved = 0;
	for (const [cmd, subs] of Object.entries(SUBCOMMAND_ZH as Record<string, Record<string, unknown>>)) {
		const curSubs = cur.subcommands[cmd];
		if (!curSubs) continue;
		for (const name of Object.keys(subs)) {
			if (!curSubs[name]) {
				if (subRemoved === 0) console.log(`  ${red("🗑️ 废除")}:`);
				console.log(`    ${dim("•")} /${cmd} ${name}`);
				subRemoved++;
			}
		}
		for (const name of Object.keys(curSubs)) {
			if (!subs[name]) {
				if (subAdded === 0) console.log(`  ${green("✨ 新增")}:`);
				console.log(`    ${dim("•")} /${cmd} ${name}: "${trunc(curSubs[name])}"`);
				subAdded++;
			}
		}
	}
	if (!subAdded && !subRemoved) console.log(`  ${dim("✓ 无变化")}`);
	totalNew += subAdded;
	totalRemoved += subRemoved;

	// ── Tab ──
	console.log(bold("\n━━━ Tab 标签 ━━━"));
	const tAdded = cur.tabs.filter((t) => !TAB_ZH[t]);
	const tRemoved = Object.keys(TAB_ZH).filter((t) => !cur.tabs.includes(t));
	if (tAdded.length) {
		console.log(`  ${green("✨ 新增")}: ${tAdded.join(", ")}`);
		totalNew += tAdded.length;
	}
	if (tRemoved.length) {
		console.log(`  ${red("🗑️ 废除")}: ${tRemoved.join(", ")}`);
		totalRemoved += tRemoved.length;
	}
	if (!tAdded.length && !tRemoved.length) console.log(`  ${dim("✓ 无变化")}`);
	// ── 通用文案（STRING_ZH：句子存在性检测）──
	console.log(bold("\n━━━ 通用文案 ━━━"));
	const stringEntries = Object.keys(STRING_ZH);
	if (stringEntries.length > 0) {
		// 与 patch.ts 的 bundleStr() 同步：bun minifier 对字符串的转义规则
		const bundleStr = (s: string) =>
			s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[^\x00-\x7f]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
		// 定位 dist/cli.js（与 patch.ts 同款逻辑），优先读未打补丁的 .bak
		const moduleUrl = import.meta.resolve("@oh-my-pi/pi-coding-agent/config/settings-schema");
		const pkgRoot = fileURLToPath(moduleUrl).replace(/[\/\\]src[\/\\]config[\/\\]settings-schema\.ts$/, "");
		const cliPath = path.join(pkgRoot, "dist", "cli.js");
		const bakPath = cliPath + ".bak";
		let bundle = "";
		if (await Bun.file(bakPath).exists()) bundle = await Bun.file(bakPath).text();
		else if (await Bun.file(cliPath).exists()) bundle = await Bun.file(cliPath).text();
		if (bundle) {
			const stale: string[] = [];
		for (const en of stringEntries) {
			// 镜像 patch.ts 三级链：带引号 → 单引号变体 → 含 | 的裸子串（模板串固定段）
			const quoted = `"${bundleStr(en)}"`;
			const found = bundle.includes(quoted)
				|| bundle.includes(quoted.replace(/:"([^"]*)"/, ":'$1'"))
				|| (en.includes("|") && bundle.includes(bundleStr(en)));
			if (!found) stale.push(en);
		}
		if (stale.length > 0) {
			console.log(`  ${yellow("📝 措辞变化/移除")} ${dim(`(${stale.length} 条英文原句在 bundle 中找不到):`)}`);
			// 源码定位疑似新句：取旧句前 N 词在 src/ 逐级退化探测，省去 agent 源码搜索
			const srcDir = path.join(pkgRoot, "src");
			const srcFiles: Array<[string, string]> = [];
			if (await Bun.file(path.join(srcDir, "config", "settings-schema.ts")).exists()) {
				for (const rel of new Bun.Glob("**/*.ts").scanSync({ cwd: srcDir })) {
					srcFiles.push([rel, await Bun.file(path.join(srcDir, rel)).text()]);
				}
			}
			for (const en of stale) {
				console.log(`    ${dim("•")} "${trunc(en)}"`);
				const words = (en.match(/[A-Za-z]{2,}/g) ?? []).slice(0, 4);
				let located = false;
				for (const n of [4, 3, 2]) {
					if (words.length < n) continue;
					const probe = words.slice(0, n).join(" ");
					for (const [rel, text] of srcFiles) {
						const i = text.indexOf(probe);
						if (i >= 0) {
							const line = text.slice(0, i).split("\n").length;
							console.log(`      ${cyan(`↳ ${rel}:${line}`)} ${dim(trunc(text.split("\n")[line - 1].trim(), 90))}`);
							located = true;
							break;
						}
					}
					if (located) break;
				}
				if (!located) console.log(`      ${dim("↳ 未在 src 定位到疑似新句，需手动查源码")}`);
			}
			totalChanged += stale.length;
		} else {
			console.log(`  ${dim(`✓ 全部 ${stringEntries.length} 条存在`)}`);
		}
		} else {
			console.log(`  ${dim("⚠ 未找到 dist/cli.js，跳过存在性检测")}`);
		}
	} else {
		console.log(`  ${dim("✓ 无条目")}`);
	}


	// ── 统计 ──
	console.log(bold("\n━━━ 统计 ━━━"));
	const optCount = Object.values(OPTION_ZH).reduce((s, o) => s + Object.keys(o).length, 0);
	console.log(`  设置项: ${Object.keys(SETTINGS_ZH).length} 已译 / ${Object.keys(cur.settings).length} 总计`);
	console.log(`  通用文案: ${stringEntries.length} 条`);
	console.log(`  选项:   ${optCount} 已译`);
	console.log(`  命令:   ${Object.keys(COMMAND_ZH).length} 已译 / ${Object.keys(cur.commands).length} 总计`);
	console.log(`\n  ${green(`✨ ${totalNew} 新增`)}  ${red(`🗑️ ${totalRemoved} 废除`)}  ${yellow(`📝 ${totalChanged} 变化`)}`);

	// ── 提示（翻译门槛：✨新增+📝变化合并攒批，>15 触发新一轮）──
	const pending = totalNew + totalChanged;
	if (pending > 15) {
		console.log(`\n${cyan("💡")} 新增+变化 ${pending} 条（✨${totalNew} + 📝${totalChanged}）超过 15 门槛：编辑 ${bold("index.ts")} 批量翻译，然后 patch + 快照刷新 + 推送`);
	} else {
		console.log(`\n${cyan("⏸")} 新增+变化 ${pending} 条（✨${totalNew} + 📝${totalChanged}）未过 15 门槛：本轮仅打补丁（保住已有中文），跳过翻译/快照刷新/推送`);
		console.log(`  ${dim("不刷新快照则新增与变化下次继续报告，攒够门槛一并处理（文本变化仅在快照刷新后才从报告中消失）")}`);
	}

	// ── 更新快照 ──
	if (shouldUpdate) {
		await Bun.write(SNAPSHOT_PATH, JSON.stringify(cur, null, "\t"));
		console.log(`\n${green("✓")} 英文快照已更新: ${dim(SNAPSHOT_PATH)}`);
	} else if (!hasSnap) {
		console.log(`\n${cyan("ℹ")} 首次运行，运行 ${bold("bun diff-translations.ts --update")} 创建快照基线`);
	}
}

main();
