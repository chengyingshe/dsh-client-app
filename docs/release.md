# 发布指南

## 发布前检查

1. 确认远程仓库地址、项目描述和许可证已设置。
2. 确认 `main` 分支的 CI 全部通过。
3. 更新版本号、变更日志和 README 的发布说明。
4. 检查仓库中没有密码、Token、Cookie、`.env`、Cloudflare credentials 或本地路径。

## 创建 Release

```bash
git tag -a v0.1.0 -m "release: v0.1.0"
git push origin v0.1.0
```

GitHub Release 发布后，`tauri-build.yml` 会在 macOS、Windows 和 Ubuntu 上构建安装包并上传构建产物。当前工作流未配置代码签名，因此生成的安装包适合测试，不适合直接作为正式分发版本。

## macOS 签名与公证

正式发布需要在 GitHub Secrets 中配置 Apple Developer 相关凭据，例如签名证书、App Store Connect API Key 和公证信息。不要把证书、私钥或 API Key 写入仓库文件。配置签名前，应先在 `tauri.conf.json` 中固定 Bundle Identifier，并完成 Apple Developer 账户授权。

## Windows 签名

正式发布建议使用受保护的代码签名证书。证书密码只能配置在 GitHub Secrets 中，不能写入工作流或仓库。

## Linux 发布

工作流当前生成 AppImage 和 Debian 包。正式发布前请在目标发行版上验证 WebKit、系统托盘和自动更新行为。
