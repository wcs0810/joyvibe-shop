#!/usr/bin/env node
/**
 * JoyVibe 一键自动部署与同步校验流水线
 * =====================================
 *
 * 流程：构建(注入新版本号) → 部署到 Netlify → 轮询线上 version.json
 *       直到与本地产物一致（同步验证）→ 冒烟测试 → 生成同步报告。
 *
 * 用法：
 *   node scripts/deploy.mjs                      # 构建+生产部署+验证+报告
 *   node scripts/deploy.mjs --skip-build         # 跳过构建（直接部署 dist）
 *   node scripts/deploy.mjs --draft              # 预览部署（不更新正式网址）
 *   node scripts/deploy.mjs --message "修复登录" # 部署备注（写入报告）
 *
 * 异常处理：任一步失败立即终止，打印详细错误，退出码非 0；
 * 若配置了 DEPLOY_WEBHOOK（企业微信/飞书/Slack 等机器人 URL），会推送告警。
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---------- 参数 ----------
const argv = process.argv.slice(2);
const SKIP_BUILD = argv.includes('--skip-build');
const DRAFT = argv.includes('--draft');
const msgIdx = argv.indexOf('--message');
const DEPLOY_MESSAGE = msgIdx >= 0 ? argv[msgIdx + 1] : '';
const SITE_ID = process.env.NETLIFY_SITE_ID || 'f90d49df-aeb1-4fb7-bd8a-ecc374dd8689';
const SITE_URL = process.env.SITE_URL || 'https://joyvibe-shop.netlify.app';
const SYNC_TIMEOUT_MS = 120_000;   // 线上版本同步最长等待
const SYNC_POLL_MS = 4_000;
const REPORT_DIR = path.join(ROOT, 'deploy-reports');

// ---------- 工具 ----------
function ts() {
  // YYYYMMDDHHmmss (14 chars) — stop before the '.' that precedes milliseconds
  return new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
}
function nowISO() { return new Date().toISOString(); }

function run(cmd, args, opts = {}) {
  // Node ≥18/24 on Windows forbids spawning .cmd directly (CVE-2024-27980) and
  // warns when argv is passed alongside shell:true (DEP0190). Build a single
  // quoted command string and let the shell parse it.
  const quote = (a) => /\s/.test(a) ? `"${String(a).replace(/"/g, '\\"')}"` : String(a);
  const isWin = process.platform === 'win32';
  const full = [cmd, ...args].map((a) => (isWin ? quote(a) : a)).join(' ');
  console.log(`\n$ ${full}`);
  if (isWin) {
    // Command line is fully quoted already; shell parses it (no argv → no DEP0190)
    return execFileSync(full, [], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
      shell: true,
      ...opts,
    });
  }
  return execFileSync(cmd, args, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    ...opts,
  });
}

async function notify(text) {
  const webhook = process.env.DEPLOY_WEBHOOK;
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msgtype: 'text', text: { content: text } }),
    });
  } catch (e) {
    console.error('⚠️  告警推送失败（不影响主流程）:', e.message);
  }
}

const report = {
  project: 'joyvibe-web',
  siteUrl: SITE_URL,
  startedAt: nowISO(),
  finishedAt: null,
  version: null,
  mode: DRAFT ? 'draft' : 'production',
  message: DEPLOY_MESSAGE,
  steps: [],
  sync: null,
  smokeTests: [],
  status: 'failed',
  error: null,
};

function step(name, status, detail = {}) {
  report.steps.push({ name, status, at: nowISO(), ...detail });
  console.log(`${status === 'ok' ? '✅' : status === 'warn' ? '⚠️ ' : 'ℹ️ '} ${name}`);
}

async function fail(stage, err) {
  report.error = { stage, message: err?.message || String(err), at: nowISO() };
  if (err?.stdout) report.error.stdout = String(err.stdout).slice(-1500);
  if (err?.stderr) report.error.stderr = String(err.stderr).slice(-1500);
  report.finishedAt = nowISO();
  writeReport();
  const text =
    `🚨 JoyVibe 部署失败\n阶段：${stage}\n网址：${SITE_URL}\n时间：${report.finishedAt}\n错误：${report.error.message}\n报告：deploy-reports/${path.basename(reportFile)}`;
  console.error('\n❌ ' + text + '\n');
  await notify(text);
  process.exit(1);
}

if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
const reportFile = path.join(REPORT_DIR, `deploy-${ts()}.json`);
const reportMdFile = reportFile.replace(/\.json$/, '.md');

function writeReport() {
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  fs.writeFileSync(reportMdFile, renderMarkdown(report));
}

function renderMarkdown(r) {
  const L = [];
  L.push(`# 部署同步报告 · ${r.status === 'success' ? '✅ 成功' : '❌ 失败'}`);
  L.push('');
  L.push(`- 项目：${r.project}`);
  L.push(`- 网址：${r.siteUrl}`);
  L.push(`- 版本：\`${r.version ?? 'N/A'}\``);
  L.push(`- 模式：${r.mode}`);
  if (r.message) L.push(`- 备注：${r.message}`);
  L.push(`- 开始：${r.startedAt}`);
  L.push(`- 结束：${r.finishedAt ?? '—'}`);
  L.push('');
  L.push('## 执行步骤');
  for (const s of r.steps) L.push(`- ${s.status === 'ok' ? '✅' : s.status === 'warn' ? '⚠️' : 'ℹ️'} ${s.name} ${s.at}`);
  if (r.sync) {
    L.push('');
    L.push('## 同步验证');
    L.push(`- 线上版本：\`${r.sync.remoteVersion}\``);
    L.push(`- 期望版本：\`${r.sync.expectedVersion}\``);
    L.push(`- 结果：${r.sync.matched ? '✅ 网址已反映最新版本' : '❌ 版本不一致'}`);
    L.push(`- 耗时：${r.sync.elapsedMs} ms（轮询 ${r.sync.attempts} 次）`);
  }
  if (r.smokeTests.length) {
    L.push('');
    L.push('## 冒烟测试');
    for (const t of r.smokeTests) L.push(`- ${t.ok ? '✅' : '❌'} ${t.name} — ${t.detail}`);
  }
  if (r.error) {
    L.push('');
    L.push('## 错误详情');
    L.push(`- 阶段：${r.error.stage}`);
    L.push(`- 时间：${r.error.at}`);
    L.push(`- 信息：${r.error.message}`);
    if (r.error.stderr) L.push('```\n' + r.error.stderr + '\n```');
  }
  return L.join('\n');
}

// ---------- 主流程 ----------
try {
  // 1. 构建
  if (!SKIP_BUILD) {
    try {
      run('npm.cmd', ['run', 'build']);
      step('生产构建 (npm run build)', 'ok');
    } catch (e) { await fail('构建', e); }
  } else {
    step('跳过构建（--skip-build）', 'warn');
  }

  const versionJsonPath = path.join(ROOT, 'dist', 'version.json');
  if (!fs.existsSync(versionJsonPath)) await fail('构建产物', new Error('dist/version.json 不存在，版本同步无法校验'));
  const localVersionInfo = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
  report.version = localVersionInfo.version;
  console.log(`📦 本次版本：${localVersionInfo.version}（构建于 ${localVersionInfo.buildTime}，commit ${localVersionInfo.commit}）`);

  // 2. 部署
  const deployArgs = ['--yes', 'netlify-cli', 'deploy', '--site', SITE_ID];
  if (!DRAFT) deployArgs.push('--prod');
  deployArgs.push('--no-build', '--dir=dist');
  if (DEPLOY_MESSAGE) deployArgs.push('--message', DEPLOY_MESSAGE);

  let deployOut = '';
  try {
    deployOut = run('npx.cmd', deployArgs);
    step(`部署到 Netlify（${DRAFT ? '预览' : '生产'}）`, 'ok');
  } catch (e) { await fail('部署', e); }

  const deployUrl = (deployOut.match(/https:\/\/[a-z0-9-]+\.netlify\.app/) || [])[0];
  if (deployUrl) step('已获取部署 URL', 'info', { url: deployUrl });

  // 3. 同步验证：轮询线上 version.json 直到等于本次版本
  const expected = localVersionInfo.version;
  const verifyBase = DRAFT && deployUrl ? deployUrl : SITE_URL;
  const t0 = Date.now();
  let attempts = 0;
  let remoteVersion = null;
  let matched = false;

  step('等待 CDN 同步并校验线上版本...', 'info');
  while (Date.now() - t0 < SYNC_TIMEOUT_MS) {
    attempts++;
    try {
      const res = await fetch(`${verifyBase}/version.json?_=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const j = await res.json();
        remoteVersion = j.version;
        if (remoteVersion === expected) { matched = true; break; }
      }
    } catch { /* 冷启动/传播中，继续 */ }
    await new Promise((r) => setTimeout(r, SYNC_POLL_MS));
  }

  report.sync = {
    expectedVersion: expected,
    remoteVersion,
    matched,
    attempts,
    elapsedMs: Date.now() - t0,
  };

  if (!matched) {
    await fail('同步验证', new Error(`线上版本 ${remoteVersion ?? '未获取'} 与期望版本 ${expected} 不一致（已轮询 ${attempts} 次）`));
  }
  step('线上版本同步校验通过', 'ok');

  // 4. 冒烟测试（公开访问 + SPA 深链 + 同域 API）
  const checks = [
    {
      name: '首页公开可访问',
      run: async () => {
        const r = await fetch(`${SITE_URL}/`, { cache: 'no-store' });
        const h = await r.text();
        return r.ok && h.includes('id="root"') ? `HTTP ${r.status}` : Promise.reject(new Error(`HTTP ${r.status}, 非应用页面`));
      },
    },
    {
      name: 'SPA 深链 /service 返回应用',
      run: async () => {
        const r = await fetch(`${SITE_URL}/service`, { cache: 'no-store' });
        return r.ok ? `HTTP ${r.status}` : Promise.reject(new Error(`HTTP ${r.status}`));
      },
    },
    {
      name: '同域 API 健康检查',
      run: async () => {
        const r = await fetch(`${SITE_URL}/api/health`, { cache: 'no-store' });
        const j = await r.json();
        return j.status === 'ok' ? `uptime ${Math.round(j.uptime)}s` : Promise.reject(new Error('status != ok'));
      },
    },
    {
      name: '真实账号登录可用',
      run: async () => {
        const r = await fetch(`${SITE_URL}/api/auth/login`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: '李同学', password: '123456' }),
        });
        const j = await r.json();
        return j.token ? 'JWT 已签发' : Promise.reject(new Error('未返回 token'));
      },
    },
  ];

  for (const c of checks) {
    try {
      const detail = await c.run();
      report.smokeTests.push({ name: c.name, ok: true, detail });
      console.log(`   ✅ ${c.name} — ${detail}`);
    } catch (e) {
      report.smokeTests.push({ name: c.name, ok: false, detail: e.message });
      await fail('冒烟测试：' + c.name, e);
    }
  }

  // 5. 成功报告
  report.status = 'success';
  report.finishedAt = nowISO();
  writeReport();

  const okText =
    `✅ JoyVibe 部署同步成功\n网址：${SITE_URL}\n版本：${expected}\n同步耗时：${report.sync.elapsedMs}ms（${attempts} 次轮询）\n冒烟测试：${checks.length}/${checks.length} 通过\n报告：deploy-reports/${path.basename(reportMdFile)}`;
  console.log('\n' + okText + '\n');
  await notify(okText);
  process.exit(0);
} catch (e) {
  await fail('未预期异常', e);
}
