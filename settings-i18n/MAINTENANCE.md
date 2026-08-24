# OMP 中文翻译补丁 — 实现原理与维护手册

## 概述

本补丁为 omp（oh-my-pi）的 `/settings` 设置面板和 `/命令` 自动补全提供中文翻译。
翻译数据存放在 `index.ts`，由 `patch.ts` 写入 omp 的编译文件。

---

## 工作原理

### 为什么需要补丁脚本（而不是扩展）

omp 16.0.6+ 的 `package.json` 中：

```json
"main": "./src/index.ts",      ← 扩展 import 解析到这里（源码）
"bin":  { "omp": "dist/cli.js" }  ← omp 实际运行的是这里（编译 bundle）
```

`dist/cli.js` 是一个 18.5MB 的自包含 bundle——所有代码和数据都打包在这一个文件里。

当扩展执行 `import { SETTINGS_SCHEMA } from "@oh-my-pi/pi-coding-agent/config/settings-schema"` 时，
bun 根据 `main`/`exports` 字段解析到 **src 目录的源码文件**。这个源码对象和 bundle 内部的对象是
**两份完全独立的实例**——修改 src 的对象属性，bundle 里的对象不受影响。

### 补丁脚本的三个关键技术

**1. Unicode 转义（解决中文乱码）**

直接在文件中写入 UTF-8 中文字节会导致乱码（bun 读取大型 JS 文件时编码检测异常）。
所有中文都用 `\uXXXX` 转义序列表示，保持文件纯 ASCII：

```
"打开设置菜单" → \u6253\u5f00\u8bbe\u7f6e\u83dc\u5355
```

JS 引擎解析转义序列后得到正确的 Unicode 字符串。

> **注意：`esc()` 转义全部字符，不只是中文。** patch.ts 的 `esc()` 对字符串里**每一个**字符（含 ASCII 空格、字母、数字、`-` 等）都生成 `\uXXXX`。因此中文里夹带的英文（如"发送 OSC 9;4 信号"）在 bundle 中写作 `\u53d1\u9001\u0020\u004f\u0053\u0043\u0020\u0039...`（空格=`\u0020`、O=`\u004f`、S=`\u0053`…）。这一点对"验证 bundle 是否生效"至关重要（见下文「验证 bundle 是否实际生效」）。

**2. bundleStr（同步 bun minifier 的转义格式）**

bun 打包 dist/cli.js 时，minifier 对字符串做了三种转义：
- `\` → `\\`
- `"` → `\"`
- 非 ASCII 字符（如 `—` U+2014）→ `\u2014`

补丁脚本在构造匹配模式时必须同步这些转义，否则找不到字符串。
`bundleStr()` 函数负责这个转换。

**3. 单引号回退**

minifier 对部分字符串使用单引号（`description:'...'`）而非双引号。
当双引号模式未匹配时，自动尝试单引号变体。

> **已知盲区**：当 minifier 把字符串存为单引号 **且** 内部又含转义引号 `\"` 时（例如 `description:'...for example \"openai\"...'`），双引号模式和单引号回退模式都无法匹配 → 该条目显示英文。典型受影响项：含内嵌引号或反引号的长描述（如 `providers.maxInFlightRequests`、`providers.fireworksTier`）。这是 patch.ts 的匹配局限，不影响其他条目。

### 数据流

```
index.ts 翻译表（中文）  ──┐
                           ├──→ patch.ts ──→ 替换 dist/cli.js 中的英文字符串
src SETTINGS_SCHEMA（英文）──┘                   ↓
                                          重启 omp → 界面显示中文
```

---

## 关键路径与版本解析（重要，先读这一节）

### omp 安装位置

omp 以全局 bun 包安装。**补丁脚本改的是这个文件**（patch.ts 输出的目标）：

```
C:\Users\Alex\node_modules\@oh-my-pi\pi-coding-agent\dist\cli.js
```

`omp.exe` 本身在 `C:\Users\Alex\.bun\bin\omp.exe`，但补丁不打它。

### 版本解析陷阱：CWD 决定解析到哪个版本

`@oh-my-pi/pi-coding-agent` 这个 import 解析到哪个版本，**取决于运行目录（CWD）**：

- 从**扩展目录** `~/.omp/agent/extensions/settings-i18n/` 运行 → 解析到已安装运行时 `~/node_modules/@oh-my-pi/...`（如 16.0.10）✓
- 从**工作区**（如 `D:\Data\GitHub`）等无本地 `node_modules` 的目录跑 `bun -e`/`node -e` → bun 回退到**全局缓存** `~/.bun/install/cache/@oh-my-pi/pi-coding-agent@<旧版本>/`，可能拿到**过期版本**（如 16.0.6）✗

> 实测：从工作区解析到 `pi-coding-agent@16.0.6@@@1`（缓存旧版），从扩展目录解析到 `~/node_modules/.../16.0.10`（真实运行时）。在旧版里查新版才有的键（如 `collab.webUrl`）会"键不存在"，造成假象。

**规则**：任何需要读取 `SETTINGS_SCHEMA` 的内联命令，必须先 `cd ~/.omp/agent/extensions/settings-i18n`。

**更好的做法**：直接依赖 `diff-translations.ts` 报告——它打印新增项的完整英文（label + description），常规翻译无需另行查询 schema。

## 文件结构

```
~/.omp/agent/extensions/settings-i18n/
├── index.ts             ← 翻译表（6 个字典）+ 扩展工厂函数（已失效，保留备用）
├── patch.ts             ← 补丁脚本（核心：读取翻译表 → 替换 dist/cli.js）
├── extract-strings.ts    ← B/D 档双语对齐提取（omp-zh 语料 ↔ 本地源码，产出 STRING_ZH 候选）
├── extract-panels.ts     ← 面板文案提取（单语启发式：源码渲染调用 → MANUAL 手翻表 → STRING_ZH）
├── diff-translations.ts ← 差异检测工具（对比翻译表与当前版本，找出新增/废除/变化/文案失配）
├── import-corpus.ts     ← 语料导入工具（omp-zh 汉化库 → 本地字典，含人工翻译表）
├── en-snapshot.json     ← 英文快照（上次检测时的版本基线，用于发现文本变化）
└── MAINTENANCE.md       ← 本文件
```

### index.ts 中的 6 个翻译字典

| 字典 | 格式 | 内容 |
|------|------|------|
| `TAB_ZH` | `{ key: "中文" }` | 设置页顶部的分类标签 |
| `SETTINGS_ZH` | `{ path: { label, description } }` | 设置项的名称和说明 |
| `OPTION_ZH` | `{ path: { value: { label?, description? } } }` | 下拉选项的名称和说明 |
| `COMMAND_ZH` | `{ name: "中文" }` | `/命令` 的描述 |
| `SUBCOMMAND_ZH` | `{ name: { subname: "中文" } }` | 子命令的描述 |
| `STRING_ZH` | `{ "英文原句": "中文" }` | 设置面板/命令之外的 TUI 面板与 CLI 帮助文案 |

> **格式关键**：`SETTINGS_ZH` 的值是扁平的 `{ label, description }`；
> `OPTION_ZH` 的值是嵌套的 `{ "选项值": { label, description } }`。
> 两者不能混用，否则 patch.ts 会跳过该条目。

### STRING_ZH（通用文案）的特殊规则

- 仅收录**静态完整字符串**：patch.ts 按带引号的完整字面量（`"英文"`）匹配，
  不带 `label:`/`description:` 前缀锚定，靠句子本身唯一性定位。
- 句子须足够独特（建议 ≥12 字符），防止 bundle 内多处命中误伤；
  patch.ts 的 count>5 保护仍然生效。
- **模板拼接句（含 `${}` 插值）不收录**——无法整句替换，子串替换误伤风险高。
- diff-translations.ts 对每条英文做**存在性检测**（在 cli.js.bak 中找不到
  = 上游改了措辞或移除，报告为 📝 措辞变化）。

### 语料导入（import-corpus.ts）

翻译语料来自 [wxyhgk/oh-my-pi-zh](https://github.com/wxyhgk/oh-my-pi-zh)
（omp 全量汉化 fork，基线 ≈ 17.2.14）。它是一次性快照项目（单日冲刺、
无上游 git 历史、不可 merge 同步），**只作语料用，不作发行版用**。

```bash
# 语料目录 D:/Data/Learn/.tmp-ompzh 已删除（omp-zh 停更，价值已榨取完毕）。
# 日常 /i18n-update 四步零依赖语料；仅重新运行 import-corpus/extract-strings
# 时需先重新 sparse clone（见脚本内 CORPUS_PATH / ZH_ROOT，EN_ROOT 也要
# 按当前版本更新缓存路径）。
bun import-corpus.ts           # dry-run：统计 + 待翻译清单
bun import-corpus.ts --write   # 重写 index.ts 的 SETTINGS_ZH / OPTION_ZH 块
```

合并优先级：现有翻译 > omp-zh 语料 > 脚本内 `EXTRA_*` 人工翻译表 > 待翻译。
语料基线与当前版本的英文措辞漂移，由 patch.ts 的未匹配报告兜底暴露。


### 通用文案提取（extract-strings.ts）

B/D 档（/context、/help、模型/MCP/插件选择器、CLI `--help`）文案经
中英语料**逐行骨架对齐**提取：omp-zh 中文版与本地英文版同名文件，
去掉字符串字面量后骨架一致的行做配对。行数漂移的文件漂移点之后
不可靠，错位配对由脚本内 `MANUAL` 手翻表覆盖（command-help.ts 全量
手翻）。产出经 bundle 存在性校验后并入 `STRING_ZH`。

```bash
bun extract-strings.ts           # dry-run：候选 + 拒绝明细
bun extract-strings.ts --write   # 采纳条目并入 index.ts 的 STRING_ZH
```

### 面板文案提取（extract-panels.ts）

信息面板类命令（/session、/jobs、/advisor、/mcp、/usage、/hotkeys 等）的
文案不经过 schema，直接从源码渲染调用（`theme.bold(...)`、`theme.fg("dim", ...)`）
提取英文，译文写在脚本内 `MANUAL` 表，经 bundle 命中校验（带引号形态，
含 `|` 的表格行回退裸子串形态）后并入 `STRING_ZH`。

**模板串双宿主**：hotkeys 表格短语同时存在于键位绑定表（带引号常量
`description:"..."`）和模板串固定段（反引号内裸文本）。patch.ts 对含 `|`
的条目自动生成两个替换对，裸词形态条目需在 MANUAL 里同时提供裸词与
管道两种形态才能覆盖双宿主。

```bash
bun extract-panels.ts           # dry-run：采纳/拒绝明细 + 未译参考清单
bun extract-panels.ts --write   # 采纳条目并入 STRING_ZH（已收录条目自动跳过）
```
---

## 日常维护

### 快捷方式：`/i18n-update` 命令

可自动执行下方完整流程（检查差异 → 补充翻译 → 应用补丁 → 刷新快照）。
输入 `/i18n-update check` 仅检查差异不修改文件。


### omp 更新后的标准流程（4 步）

omp 更新会覆盖 `dist/cli.js`（恢复英文），可能新增/废除/修改设置项。标准流程：

```bash
# 第 1 步：检查差异（只读，不修改任何文件）
bun ~/.omp/agent/extensions/settings-i18n/diff-translations.ts
```

根据报告的 ✨新增 / 🗑️废除 / 📝变化，编辑 `index.ts` 补充或更新翻译。

```bash
# 第 2 步：应用翻译到 dist/cli.js
bun ~/.omp/agent/extensions/settings-i18n/patch.ts
```

patch.ts 会自动从 `cli.js.bak` 备份恢复再重新替换（幂等：多次运行结果一致）。

```bash
# 第 3 步：重启 omp 验证翻译效果

# 第 4 步：刷新快照（记录当前版本的英文文本，供下次更新对比）
bun ~/.omp/agent/extensions/settings-i18n/diff-translations.ts --update
```

> **跳过第 4 步的后果**：下次 omp 更新后，`📝 文本变化` 检测会失效（没有基线可对比），
> 但 `✨ 新增` 和 `🗑️ 废除` 检测不受影响（它们对比的是翻译表，不是快照）。
### 检查翻译覆盖率

`diff-translations.ts` 是唯一的覆盖率检查工具，不需要手写临时脚本。

```bash
bun ~/.omp/agent/extensions/settings-i18n/diff-translations.ts
```

输出分 5 个区域（设置项 / 选项 / 命令 / 子命令 / Tab），每个区域列出：
- **✨ 新增**：当前版本有但翻译表没有 → 需要在 `index.ts` 中添加翻译
- **🗑️ 废除**：翻译表有但当前版本已移除 → 可以从 `index.ts` 中清理
- **📝 文本变化**：英文原文与上次快照不同 → 翻译需要更新

纯数值选项（如 "120 seconds"、"16 tasks"）会自动跳过，不报告为缺失。

### 添加或修改翻译

**添加设置项翻译**：在 `index.ts` 的 `SETTINGS_ZH` 字典中添加：

```typescript
"new.setting.path": {
    label: "中文名称",
    description: "中文说明句子",
},
```

**添加选项翻译**：在 `OPTION_ZH` 字典中添加：

```typescript
"new.setting.path": {
    "value1": { label: "选项一", description: "说明" },
    "value2": { label: "选项二", description: "说明" },
},
```

**添加命令翻译**：在 `COMMAND_ZH` 中添加 `"命令名": "中文描述"`。

修改后运行 `bun ~/.omp/agent/extensions/settings-i18n/patch.ts` 即可生效。

### 检查翻译覆盖率

如果发现界面有未翻译的英文，可以写一个诊断脚本检查哪些设置项缺失翻译：

```typescript
// diagnose.ts（临时脚本）
import { SETTINGS_SCHEMA } from "@oh-my-pi/pi-coding-agent/config/settings-schema";
import { SETTINGS_ZH } from "./index.ts";

const schema = SETTINGS_SCHEMA as unknown as Record<string, { ui?: { label?: string } }>;
for (const path of Object.keys(schema)) {
    if (schema[path]?.ui && !SETTINGS_ZH[path]) {
        console.log(`缺失: ${path} = "${schema[path].ui.label}"`);
    }
}
```

运行：`bun diagnose.ts`，根据输出补全翻译后重新运行 patch.ts。

### 验证 bundle 是否实际生效（diff 查不到的事）

`diff-translations.ts` 只对比**翻译表 vs schema**（即"该不该有翻译"），**不验证 patch 是否真的写进了 `dist/cli.js`**。翻译表 100% 覆盖 ≠ bundle 里都替换成功。要确认某条翻译确实落地，在 bundle 里搜索它的**全转义中文**（每个字符都转成 `\uXXXX`，与 `esc()` 完全一致）：

```typescript
// verify.ts（临时脚本，须从扩展目录运行，避免版本解析陷阱）
import { SETTINGS_ZH } from "./index.ts";
import { readFileSync } from "fs";
// dist/cli.js 路径见 patch.ts 输出
const bundle = readFileSync("C:/Users/Alex/node_modules/@oh-my-pi/pi-coding-agent/dist/cli.js", "utf8");
// 必须与 patch.ts 的 esc() 一致：转义全部字符（含 ASCII）
const esc = (s: string) => [...s].map(c => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")).join("");
for (const [path, zh] of Object.entries(SETTINGS_ZH)) {
  const ok = bundle.includes(esc(zh.label)) && bundle.includes(esc(zh.description));
  console.log(`${ok ? "OK " : "MISS"} ${path}`);
}
```

> **易错点**：`esc()` 转义**全部**字符（含 ASCII），校验时也必须全转义；只转义非 ASCII 会得到假阴性——含 "OSC"、"Gemini"、空格、`-` 等的条目会被误判为未生效。

### 替换未生效的排查顺序

1. 先跑 `diff-translations.ts` 确认翻译表覆盖（该不该有翻译）；
2. 再用上面的 verify 脚本确认 patch 真的写进 bundle（特殊字符项可能 MISS，属已知局限）；
3. 最后重启 omp（新窗口）。

---

## 常见问题

### 替换未生效

1. 确认运行了 `patch.ts`（不是只改了 `index.ts`）
2. 确认重启了 omp（新窗口启动）
3. 检查 `patch.ts` 输出的目标文件路径是否正确：
   `C:\Users\<用户名>\node_modules\@oh-my-pi\pi-coding-agent\dist\cli.js`

### 中文显示为乱码

确保 `patch.ts` 使用了 Unicode 转义（`esc()` 函数），而不是直接写入 UTF-8 中文。
`patch.ts` 已内置此逻辑，正常使用不会出现乱码。

### patch.ts 报告「未匹配」

表示 `index.ts` 翻译表中的英文原文与 bundle 中的实际字符串不一致。常见原因：
- 英文 description 含有特殊字符（`—`、`"`、`\`），已被 `bundleStr()` 处理
- bun minifier 对该字符串使用了单引号，已被单引号回退处理
- 设置项在当前版本中已移除或重命名（正常现象，不影响其他翻译）
- 单引号存储 **且** 内含转义引号 `\"`（minifier 在单引号串里仍转义 `"`），双/单引号模式均无法匹配——见上文「单引号回退」已知盲区

### 恢复英文原版

```bash
cp "<dist路径>/cli.js.bak" "<dist路径>/cli.js"
```

路径见 patch.ts 输出。

### 扩展的 import 方式还能用吗

不能。`index.ts` 中的 `applyTranslations()` 函数（通过 import 修改对象属性）在 omp 16.0.6+
中完全失效。它被保留是因为 `index.ts` 的翻译表仍被 `patch.ts` 复用。未来如果 omp 改回从
src 运行，或官方提供 i18n API，可以重新启用。
