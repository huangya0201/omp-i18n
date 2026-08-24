omp 更新后运行此命令，自动检查翻译差异、补充翻译并应用补丁。

## 步骤

### 1. 检查翻译差异
> 命令参数：`$ARGUMENTS`。若值为 `check`，仅执行本步（只读检查）后即结束，不修改任何文件。

运行差异检测工具，对比翻译表与当前 omp 版本：

```bash
bun ~/.omp/agent/extensions/settings-i18n/diff-translations.ts
```

将完整输出展示给用户。报告分四类：
- ✨ **新增**：当前版本有但翻译表没有的设置项/选项/命令/Tab
- 🗑️ **废除**：翻译表中有但当前版本已移除的冗余条目
- 📝 **文本变化**：英文原文与上次快照不同，翻译需要更新
- 📝 **措辞变化/移除**（通用文案区）：STRING_ZH 的英文原句在 bundle 中已找不到，上游改了措辞。报告自带源码定位（`↳ 文件:行号 + 疑似新句`），按定位结果更新 STRING_ZH 的 key 与译文即可，无需搜索源码

根据报告末尾的门槛提示判断后续操作：
- **⏸ 新增 < 15 条且无变化** → 跳过翻译，直接执行步骤 3 打补丁（旧字典照常应用，少量英文不影响使用）。新增项不依赖快照检测，下次运行会继续报告，攒够门槛再批量翻译
- **💡 新增 ≥ 15 条** → 执行步骤 2 批量翻译
- **⚠ 有 📝 变化（文本变化/措辞变化）** → 不受门槛限制，必须执行步骤 2 修复：已有翻译指向已消失的英文属退化，且文本变化快照刷新后不再报告，跳过即永久漏翻
- 仅 🗑️ 废除 → 可选清理翻译表冗余条目，跳到步骤 3
- 统计为「✨ 0 新增 🗑️ 0 废除 📝 0 变化」→ 直接步骤 3

### 2. 补充翻译

仅当**设置项/选项/命令/子命令**有 ✨新增 或 📝变化时执行此步。Tab 标签的新增通常保持英文，除非用户明确要求中文化。

1. 读取 `~/.omp/agent/extensions/settings-i18n/index.ts`
2. 根据 diff-translations.ts 报告的英文原文，在对应字典中添加或更新中文翻译

> 报告对每个新增设置项/选项/命令都已打印完整英文原文（label + description），可直接据此翻译，**无需另行查询 omp 的 SETTINGS_SCHEMA**。如确需手动查询，必须先 `cd ~/.omp/agent/extensions/settings-i18n` 再运行（见 MAINTENANCE.md「版本解析陷阱」），否则会解析到旧版本。

翻译规则：
- 专有名词保留英文（MCP, LSP, GPU, APFS, ZFS, Codex, OpenRouter, ProjFS, Overlayfs, Reflink 等）
- 数值选项（如 "120 seconds"、"16 tasks"）不需要翻译，跳过
- 翻译表格式（5 个字典）：

| 字典 | 格式 | 说明 |
|------|------|------|
| `SETTINGS_ZH` | `"path": { label: "中文", description: "中文说明" }` | 设置项 |
| `OPTION_ZH` | `"path": { "value": { label: "中文", description: "说明" } }` | 下拉选项（key 用 value 属性） |
| `COMMAND_ZH` | `"name": "中文描述"` | 斜杠命令 |
| `SUBCOMMAND_ZH` | `"cmd": { "sub": "中文描述" }` | 子命令 |
| `TAB_ZH` | `"tab": "中文"` | 分类标签 |
| `STRING_ZH` | `"英文原句": "中文"` | 设置面板/命令之外的 TUI 面板与 CLI 帮助文案（仅静态完整句，≥12 字符防误伤；模板拼接句不收录） |

3. 向用户展示翻译变更摘要，确认后写入

### 3. 应用补丁

```bash
bun ~/.omp/agent/extensions/settings-i18n/patch.ts
```

### 4. 刷新快照

```bash
bun ~/.omp/agent/extensions/settings-i18n/diff-translations.ts --update
```

### 5. 推送到同步仓库

> 仅当步骤 2 修改了翻译，或步骤 4 刷新了快照时执行；纯打补丁无文件变更则跳过。

```bash
cp -r ~/.omp/agent/extensions/settings-i18n/. /d/Data/GitHub/omp-i18n/settings-i18n/
cp ~/.omp/agent/commands/i18n-update.md /d/Data/GitHub/omp-i18n/commands/
cd /d/Data/GitHub/omp-i18n && git add . && git commit -m "omp <版本>: <变更摘要，如 新增24设置+4命令，修3变化>" && git push
```

网络不通时跳过并在完成报告中说明（下次执行会一并带上，collect 是整目录覆盖无丢失风险）。

### 6. 完成

- 告知用户重启 omp 以看到翻译效果
- 如果步骤 2 中有翻译变更，提示用户重启后检查对应设置页面

## 参考：技术文档

深入原理与排错见 `~/.omp/agent/extensions/settings-i18n/MAINTENANCE.md`（不会自动加载，需主动读）：
- **关键路径与版本解析**：`dist/cli.js` 实际位置 + CWD 版本解析陷阱（手动查 schema 前必读）
- **工作原理**：为什么用补丁而非扩展（src/dist 实例隔离、Unicode 转义、bundleStr）
- **常见问题**：替换未生效 / 中文乱码 / 未匹配项 / 恢复英文原版
