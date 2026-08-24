# omp-i18n 同步脚本 — 仓库 ↔ 本机 ~/.omp
# 用法:
#   ./sync.ps1 deploy   仓库 → 本机（更新翻译后部署）
#   ./sync.ps1 collect  本机 → 仓库（翻译改动收进仓库准备提交）
param(
    [ValidateSet('deploy', 'collect')]
    [string]$Action = 'deploy'
)

$agent = "$env:USERPROFILE\.omp\agent"
$repo  = $PSScriptRoot

if ($Action -eq 'deploy') {
    Copy-Item -Recurse -Force "$repo\settings-i18n" "$agent\extensions\settings-i18n"
    Copy-Item -Force "$repo\commands\i18n-update.md" "$agent\commands\i18n-update.md"
    Write-Host "已部署到本机。应用补丁: bun $agent\extensions\settings-i18n\patch.ts  然后重启 omp" -ForegroundColor Green
}
else {
    Copy-Item -Recurse -Force "$agent\extensions\settings-i18n" "$repo\settings-i18n"
    Copy-Item -Force "$agent\commands\i18n-update.md" "$repo\commands\i18n-update.md"
    Write-Host "已收进仓库。提交推送: git add . ; git commit -m '...' ; git push" -ForegroundColor Green
}
