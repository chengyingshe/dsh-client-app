# 贡献指南

感谢参与 dsh 认证插件与客户端项目。

## 开发流程

1. Fork 仓库并创建功能分支。
2. 只修改与 Issue 直接相关的文件。
3. 为认证、配置和客户端行为补充测试。
4. 提交前运行：

```bash
cd dsh-plugin && pnpm typecheck && pnpm test
cd ../tauri-client && pnpm typecheck && pnpm test && pnpm build
```

5. 创建 Pull Request，说明变更、测试命令和平台限制。

## 提交信息

使用 Conventional Commits，例如：

```text
feat: add refresh token rotation
fix: prevent duplicate client login
docs: improve tunnel setup guide
```

## 安全问题

不要在公开 Issue 中发布密码、Token、Cookie、Tunnel credentials 或完整生产日志。请按照 [SECURITY.md](./SECURITY.md) 报告安全问题。
