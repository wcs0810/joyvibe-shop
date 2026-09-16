# 自动同步与部署机制

网站：**https://joyvibe-shop.netlify.app**

## 三条更新通道

| 场景 | 命令 | 说明 |
|---|---|---|
| 手动发布一次 | `npm run deploy` | 构建 → 部署 → 同步校验 → 冒烟测试 → 报告 |
| 仅生成预览链接（不影响正式网址） | `npm run deploy:draft` | 用于先自测再发布 |
| 改完代码自动同步 | `npm run deploy:watch` | 监听 `src/public/netlify/配置文件`，静默 10s 后自动跑部署流水线 |

## 流水线做了什么（scripts/deploy.mjs）

1. **构建**：`npm run build`，Vite 插件自动生成带唯一版本号的 `dist/version.json`（version/buildTime/commit）。
2. **部署**：Netlify CLI 发布前端 + `/api/*` 函数到生产环境。
3. **同步验证（严格）**：每 4s 轮询 `https://joyvibe-shop.netlify.app/version.json`，
   直到线上版本号与本地产物**完全一致**（超时 120s 判定失败），确保网址反映当前状态。
4. **冒烟测试**：首页 200、SPA 深链 `/service`、同域 `/api/health`、真实账号登录。
5. **报告**：每次生成 `deploy-reports/deploy-时间戳.json` 与 `.md`（步骤/版本/同步耗时/测试结果）。

## 异常处理与告警

- 构建、部署、同步超时、冒烟测试任一失败：**退出码非 0**，终端打印阶段与错误，
  报告写入 `error.stage / message / stderr`。
- 可选机器人告警：设置环境变量后失败/成功都会推送（企业微信/飞书/Slack webhook 格式）：
  ```powershell
  $env:DEPLOY_WEBHOOK = "https://open.feishu.cn/open-apis/bot/v2/hook/xxxx"
  npm run deploy
  ```
- 可选参数：`--message "本次改动说明"`（写入报告）、`--skip-build`（直接发 dist）。

## 已打开网页的用户如何收到更新（VersionCheck）

- 构建产物含 `/version.json`（Netlify 配置 `no-cache`，永不被 CDN 缓存）。
- 页面在**首次加载 8s 后、切回标签页、网络恢复、每 5 分钟**拉取比对版本。
- 发现新版本：底部弹出提示条，显示发布时间，用户点"立即刷新"；支付页不提示，避免打断。
- 购物车/登录/心愿单均在 localStorage，刷新不丢状态。

## GitHub 自动发布（已配置，推荐日常使用）

仓库 `wcs0810/joyvibe-shop` 已与 Netlify 站点打通，**push 即发布，无需本地命令**：

1. 本地提交并推送到 `main`：
   ```powershell
   git add .
   git commit -m "feat: 改动说明"
   git push origin main
   ```
2. GitHub push Webhook 自动通知 Netlify Build Hook，触发云端构建：
   - Base 目录：`joyvibe-web/`
   - 构建命令：`npm run build`
   - 发布目录：`dist/`，Functions 目录：`netlify/functions/`
   - 构建规则以仓库内 `netlify.toml` 为准（重定向、缓存头、安全头均自动生效）。
3. 构建成功后自动发布到 **https://joyvibe-shop.netlify.app**；
   构建失败会在 Netlify 站点的 Deploys 页面标红，线上版本不受影响。
4. 已打开网页的用户由 VersionCheck 机制（见上节）收到更新提示。

配套设置（一次性，已完成，仅供排查时参考）：

- Netlify 站点构建配置通过 Netlify API 绑定：`repo=wcs0810/joyvibe-shop`、`branch=main`、
  `base=joyvibe-web`。
- GitHub 仓库 Deploy Keys 中存放 Netlify 部署公钥（只读，名称 `netlify-joyvibe-shop`），
  供 Netlify 构建机克隆代码。
- GitHub 仓库 Webhooks 中注册了 push 事件，指向 Netlify Build Hook；
  在仓库 Settings → Webhooks 可查看每次投递是否成功。
- 如需手动让云端重新构建一次，可在 Netlify 控制台 Deploys → Trigger deploy，
  或重新推送 main（空提交也可：`git commit --allow-empty -m "chore: rebuild" && git push`）。

本地 CLI 部署（`npm run deploy` / `deploy:draft` / `deploy:watch`）仍然保留，
用于紧急发布、预览链接和离线调试；与 GitHub 自动发布互不冲突。
