# 悦界 JoyVibe 京东对标优化 · 第三轮实施记录

> 文档性质：可追溯的优化操作台账（代码修改 / 配置调整 / 资源更新 / 测试与性能数据）
> 实施日期：2026-09-16
> 适用范围：`joyvibe-web/`（React 19 + Vite + TS）+ `joyvibe-api/`（Express）

---

## 1. 审计基线（优化前问题台账）

审计方法：组件地图 → 风险维度（功能/性能/安全/稳定）→ 证据来源（代码与运行时）。

| 编号 | 严重度 | 模块 | 问题与证据 |
|---|---|---|---|
| A1 | P0 | CheckoutPage | 结算数据源错误：购物车页写入 `jy_checkout_items`（勾选子集），结算页却使用购物车**全部** items，"稍后购买"商品会被误下单 |
| A2 | P0 | CheckoutPage | 下单后 `clear()` 清空整购物车，"稍后购买"商品被连带删除 |
| A3 | P0 | CheckoutPage | 渲染分支顺序缺陷：空购物车守卫早于 `paying/success` 分支；下单后购物车清空，成功页被空态覆盖（实测复现）；成功页金额重算为 ¥0 |
| A4 | P0 | joyvibe-api | carts/orders 仅存内存 Map（`DATA_DIR` 已创建但未使用），重启即丢数据 |
| A5 | P1 | joyvibe-api | 无安全响应头、无请求日志；畸形 JSON 返回 500；quantity/total 等入参无校验，可传 0/负数/超大值；`sort()` 原地修改；未知 API 路由无 JSON 404 |
| A6 | P1 | 前端 | 无 Error Boundary，单点渲染崩溃即整站白屏；路由切换不回顶部 |
| A7 | P1 | lib/api.ts | fetch 无超时，后端挂起时请求永不返回（只能靠网络错误 fallback） |
| A8 | P2 | 前端 | 15 处站内导航使用 `window.location.href` 全量跳转，破坏 SPA 缓存、触发整包重新解析 |

---

## 2. 优化操作明细（修改前 → 修改后 / 影响范围）

### A1–A3 结算链路修复 — `joyvibe-web/src/pages/CheckoutPage.tsx`

| 位置 | 修改前 | 修改后 |
|---|---|---|
| L26 数据源 | `{ items, totalPrice, clear } = useCart()`（全量） | `{ items: cartItems, removeItem }`；新增 `checkoutItems = useMemo`：优先读 `jy_checkout_items`，异常/缺失时回退到 `cartItems.filter(i => !i.saved)` |
| L62 价格 | totalPrice 取自全量购物车 | 由 checkoutItems 实时 reduce，运费/满减/应付基于本单商品 |
| 下单成功后 | `clear()`（清空全部，含稍后购买） | 仅 `removeItem(已购商品id)` + 删除 `jy_checkout_items`，保留 saved 项 |
| 渲染顺序 | 空态/未登录守卫在 paying/success 之前 | `paying → success` 分支上移到守卫之前，下单后购物车清空仍停留成功页 |
| 成功页金额 | 用 `finalTotal`，下单后重算为 ¥0 | 新增 `paidTotal` 状态快照，成功页显示 `paidTotal ?? finalTotal` |
| 立即购买 | ProductDetailPage `handleBuyNow` 先 addItem 污染购物车再整页跳转 | 只写 `jy_checkout_items` 后 `navigate('/checkout')`，不污染购物车 |

### A4 持久化 — `joyvibe-api/store.js`（新增）+ `server.js`

- 新增 [store.js](file:///c:/Users/ROG/Desktop/全国大学生广告艺术大赛（辽宁赛区）/joyvibe-api/store.js)：`loadStore(name)` 启动恢复；`saveStore(name, map)` 1000ms 防抖 + **tmp 写入再 rename 的原子落盘**；损坏文件自动备份为 `*.corrupt-*.json` 后空库启动，绝不崩进程；`saveStoreNow()` 供优雅退出。
- carts/orders 在每次 sync/add/下单/状态变更后调度落盘到 `data/carts.json`、`data/orders.json`。
- SIGINT/SIGTERM 优雅退出：先 flush 再关闭 server，3s 兜底强退。

### A5 后端加固 — `joyvibe-api/server.js`

| 项 | 修改前 | 修改后 |
|---|---|---|
| 安全头 | 无 | `X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy`、`X-XSS-Protection`、`Permissions-Policy` |
| CORS | 含通配 `127.0.0.1:*` | 仅允许 5173/5174 + `CORS_ORIGIN` 环境变量扩展，非法来源 403 |
| 请求日志 | 无 | 每请求记录 `时间 方法 路径 状态 耗时ms`，≥500 走 stderr |
| 入参校验 | 仅查空 | 购物车 quantity 必须为 1–99 整数、单次 ≤200 条；订单行支持 `{product,quantity}` 与 `{productId,quantity}` 双形态、total 非负有限数、paymentMethod ≤30 字符、address 为对象 |
| 加购 | `existing.quantity += qty` 直接改请求体且无上限 | 规整化后 `Math.min(99, …)` |
| 畸形 JSON | 落入 500 | 识别 SyntaxError 返回 400「请求体不是合法的 JSON」 |
| 订单排序 | `userOrders.sort()` 原地改 | `[...userOrders].sort()` 拷贝后排序 |
| 未知路由 | 无处理 | `/api/*` 统一 JSON 404 |
| 健康检查 | 仅 status/uptime | 增加 timestamp/pid/内存(rssMB,heapUsedMB)/stores 计数，供探针使用 |

### A6 前端健壮性

- 新增 [ErrorBoundary.tsx](file:///c:/Users/ROG/Desktop/全国大学生广告艺术大赛（辽宁赛区）/joyvibe-web/src/components/ErrorBoundary.tsx)：捕获渲染错误，展示可恢复的错误页（刷新/回首页），不再白屏；在 [App.tsx](file:///c:/Users/ROG/Desktop/全国大学生广告艺术大赛（辽宁赛区）/joyvibe-web/src/App.tsx) 最外层包裹。
- 新增 [ScrollToTop.tsx](file:///c:/Users/ROG/Desktop/全国大学生广告艺术大赛（辽宁赛区）/joyvibe-web/src/components/ScrollToTop.tsx)：pathname/search 变化回到顶部（无 hash 场景）。

### A7 请求超时 — `joyvibe-web/src/lib/api.ts`

- 引入 `AbortController`，统一 **8000ms 超时**；超时返回 `{ ok:false, timedOut:true }`，调用方按原逻辑 fallback 到本地，UI 不挂死。

### A8 站内导航 SPA 化（共 9 处，2 处刻意保留）

已替换 `window.location.href → navigate()`：Header 搜索、HomePage 2 个 Hero 按钮、CartPage 3 处、CampaignPage 3 处、AccountPage 2 处、App 404 页。
刻意保留：AuthContext 退出登录后整页跳转（需彻底重置内存状态）、ErrorBoundary 错误恢复（需硬刷新）。

---

## 3. 配置与资源变更

| 文件 | 变更 |
|---|---|
| `joyvibe-api/server.js` | 重写（API 契约保持兼容），见第 2 节 |
| `joyvibe-api/store.js` | 新增持久化模块 |
| `joyvibe-api/stability-check.cjs` | 新增 72h 稳定性探针（CSV 日志 + 汇总 + 非零退出码） |
| `joyvibe-api/test-e2e.cjs` | 19 条 → **28 条**：新增畸形 JSON、非法数量、越界数量、空商品、负金额、安全头、健康指标、404、落盘验证 |
| `joyvibe-api/data/*.json` | 新增运行期数据文件（carts/orders/探针 CSV） |
| 前端 7 个文件 | CheckoutPage / ProductDetailPage / api.ts / App.tsx / Header / HomePage / CartPage / CampaignPage / AccountPage + 2 个新增组件 |

---

## 4. 回归测试结果（2026-09-16）

### 4.1 后端端到端 `node test-e2e.cjs`：**28 / 28 通过**

- 健康检查 1 项；认证 7 项；购物车 5 项；订单 6 项
- 加固新增 8 项（畸形 JSON 400、quantity=0/>99 拒绝、空商品/负金额拒绝、安全头、健康指标、JSON 404）
- 持久化 1 项（1.3s 内 `data/orders.json` 落盘且含 u001 订单）

### 4.2 重启持久性验证（关键稳定性指标）

1. 下单 JV1789539402776842（paid）→ 2. 杀进程 → 3. 重新启动 → 4. `GET /api/orders` 仍返回该订单；启动横幅打印「已恢复 carts: 1 orders: 1」。**重启零丢失。**

### 4.3 浏览器核心链路（人工可复现）

| 链路 | 结果 |
|---|---|
| 稍后购买商品不进入结算 | ✅ 仅 saved 项时 /checkout 显示空态 |
| 移回购物车后正常结算 | ✅ 商品与 5 种支付方式正常显示 |
| 下单 → 支付成功页 | ✅ 修复后成功页正常展示，金额正确（¥129 快照不被清空影响） |
| 已购商品清除、saved 保留 | ✅ removeItem 精准清除 |
| 真实后端链路（登录→加购→结算→支付） | ✅ 后端订单数 1 → 2，JWT 鉴权全程有效 |
| 账户中心订单 + 查看物流入口 | ✅ 正常 |

### 4.4 前端构建

`npm run build` 通过，TypeScript 零错误（约 0.95s）。

---

## 5. 性能 KPI 数据（本机 dev/生产构建实测）

| 指标 | 数据 | 采集方式 |
|---|---|---|
| 首屏 DOMContentLoaded（dev，本机 localhost） | **99 ms** | Performance Timing |
| load 完成 | **100 ms**，47 个资源 | Performance Timing |
| 站内跳转（首页→分类） | 同一文档内完成，**无网络文档重载**（navigation type 仍为 navigate），路由切换 < 约 120ms | 点击 SPA Link 实测 |
| 旧实现站内跳转 | 全量文档重载（重新解析 react-vendor 280KB + 全部 chunk） | 修改前代码证据 |
| 生产包总量（gzip） | CSS 8.40 KB + JS ≈ **130 KB**（react-vendor 89.82 / vendor 9.00 / 应用壳 17.32 / 各页按路由懒加载 1.95–7.12 KB） | vite build 产物 |
| 后端健康接口延迟（30s 冒烟） | avg **5 ms**，max 16 ms | stability-check.cjs |
| 后端内存（RSS）冒烟期 | 稳定 **61 MB**，无增长 | 探针 rssMB 序列 61×6 |
| 后端请求可用性（冒烟） | **100.000%**（6/6） | 探针汇总 |

> 说明：8s 请求超时是新增的保护性上限（正常远低于此）；图片 `loading=lazy + decoding=async`、路由 2s 后预加载、preconnect/dns-prefetch、manualChunks 分包为上一轮已落地并保留的优化项。

---

## 6. 72 小时稳定性观察方案

探针已通过 30 秒冒烟验证。正式 72 小时观察需在部署环境连续运行（该过程不可由开发会话代为完成）：

```bash
# 终端 1：后端常驻
cd joyvibe-api && npm start

# 终端 2：72 小时探针（默认 60s 间隔 × 72h）
cd joyvibe-api && node stability-check.cjs

# 可选：自定义强度
DURATION_MIN=4320 INTERVAL_SEC=30 API=http://localhost:4000 node stability-check.cjs
```

产出：`data/stability-YYYYMMDD-HHmm.csv`（每次探活时间戳/状态/延迟/内存）与 `data/stability-latest-summary.txt`（可用率、失败数、延迟均值/峰值、RSS 峰值）；出现任何失败时进程以非零码退出，可直接接入任务计划/告警。

**验收基线（来自本次冒烟，供 72h 报告对比）**：可用率应保持 100%；p99 健康检查延迟应 < 50ms；RSS 不应出现单调爬升（内存泄漏判据）；重启服务后历史订单仍可查询。

---

## 7. 回滚说明

- 后端：恢复旧 `server.js`（删除 `require('./store')` 相关行）即可回到纯内存模式；`data/*.json` 不影响旧代码运行。
- 前端：所有改动均在既有文件内增量完成，回滚 checkout 时需同时恢复 `clear()` 调用与原渲染顺序；无破坏性数据结构变更，`jy_*` localStorage 键全部沿用。
