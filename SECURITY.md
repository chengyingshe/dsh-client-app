# 安全策略

## 支持版本

当前开发分支获得安全修复。发布版本的支持范围会在 Release 说明中标注。

## 报告漏洞

请通过私密渠道联系维护者，提供复现步骤、受影响组件和修复建议。不要在公开 Issue 中提交真实密码、Token、Cookie、Cloudflare credentials 或公网地址中的敏感信息。

## 部署建议

- 公网部署必须使用 HTTPS。
- 使用随机生成的 `DSH_AUTH_TOKEN_SECRET`。
- 不要把 `.env`、Cloudflare credentials JSON 和 `cert.pem` 纳入版本控制。
- 定期轮换密码和 Token 密钥。
- 为公网入口增加速率限制、来源校验和监控。
