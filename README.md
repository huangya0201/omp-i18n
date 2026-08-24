# omp-i18n

OMP (oh-my-pi) 中文翻译补丁的私有仓库，跨 Windows 机器同步。

## 内容

- `settings-i18n/` — 翻译字典 (index.ts) + 补丁/差异工具 + 维护手册 (MAINTENANCE.md)
- `commands/i18n-update.md` — `/i18n-update` 斜杠命令
- `sync.ps1` — 本机与仓库双向同步

## 新机器初始化

1. 前提：已装 bun；omp 用 bun 安装（`bun install -g @oh-my-pi/pi-coding-agent`），
   **不要**用 omp.sh 脚本或 `omp update`（独立 exe 无 dist 可打补丁）
2. `git clone` 本仓库 → `./sync.ps1 deploy`
3. `bun ~/.omp/agent/extensions/settings-i18n/patch.ts` → 重启 omp
4. 若本机 omp 版本比快照新，跑 `/i18n-update` 完整流程补翻译，最后 `--update` 刷新快照

## 日常更新流程（翻译有改动时）

```powershell
cd <本仓库>
git pull
./sync.ps1 deploy
bun ~/.omp/agent/extensions/settings-i18n/patch.ts   # 然后重启 omp
```

反向（本机改了翻译，推给仓库）：

```powershell
./sync.ps1 collect
git add . ; git commit -m "描述" ; git push
```

## 注意

- `en-snapshot.json` 绑定 omp 版本基线；两台机器版本漂移后各自跑
  `diff-translations.ts --update` 刷新，以最后推送者为准
- 恢复英文原版：`cp <omp目录>/dist/cli.js.bak <omp目录>/dist/cli.js`
