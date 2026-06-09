# Tauri 自动更新配置指南

## 步骤 1: 生成签名密钥

```bash
npx tauri signer generate -w novel-engine.key
```

当提示输入密码时，按两次 Enter（使用空密码）。

## 步骤 2: 保存密钥到 GitHub Secrets

1. 打开 `novel-engine.key` 文件，复制内容
2. 访问 https://github.com/LIEJINYAN/novel-editor/settings/secrets/actions
3. 点击 "New repository secret"
4. Name: `TAURI_SIGNING_PRIVATE_KEY`
5. Value: 粘贴密钥内容
6. 点击 "Add secret"

## 步骤 3: 保存密码到 GitHub Secrets

1. Name: `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
2. Value: （如果设置了密码则填写，否则留空）

## 步骤 4: 发布新版本

```bash
# 更新版本号 (package.json 和 src-tauri/tauri.conf.json)
# 提交更改
git add .
git commit -m "chore: release v0.2.0"

# 创建标签
git tag v0.2.0

# 推送标签触发自动构建
git push origin v0.2.0
```

## 更新流程

1. 推送 `v*` 标签后，GitHub Actions 自动构建
2. 构建完成后，创建 GitHub Release
3. Release 包含 `latest.json` 更新元数据
4. 桌面端应用自动检查更新并提示用户

## 注意事项

- 确保 `src-tauri/tauri.conf.json` 中的 `updater.endpoints` 指向正确的 URL
- 更新检查频率默认为 4 小时
- 用户可以选择稍后更新或立即更新
