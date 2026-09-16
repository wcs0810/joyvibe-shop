#!/usr/bin/env node
/**
 * 内容/配置变更自动触发部署
 * ========================
 * 监听源码、静态资源、部署配置的变更，停止操作 N 秒后自动执行 deploy.mjs，
 * 实现"改完代码 → 网址自动同步"。
 *
 * 用法：
 *   node scripts/watch-deploy.mjs              # 默认静默 10s 后自动部署
 *   WATCH_DEBOUNCE_MS=20000 node ...           # 调整静默窗口
 *   node scripts/watch-deploy.mjs --draft      # 自动部署为预览链接（不动正式网址）
 *
 * 注意：仅监听 src/public/netlify/vite.config.ts/netlify.toml/package.json，
 * 不监听 dist/ 与 deploy-reports/，避免产物写入引发循环。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DEBOUNCE_MS = Number(process.env.WATCH_DEBOUNCE_MS) || 10_000;
const DRAFT = process.argv.includes('--draft');

const WATCH_TARGETS = [
  'src',
  'public',
  'netlify',
  'index.html',
  'vite.config.ts',
  'netlify.toml',
  'package.json',
];

let timer = null;
let running = false;
let queued = false;

function schedule(file) {
  if (timer) clearTimeout(timer);
  console.log(`[watch] 检测到变更：${path.relative(ROOT, file)} —— ${DEBOUNCE_MS / 1000}s 后自动同步${DRAFT ? '（预览）' : ''}`);
  timer = setTimeout(runDeploy, DEBOUNCE_MS);
}

function runDeploy() {
  if (running) { queued = true; return; }
  running = true;
  const startedAt = new Date().toLocaleString('zh-CN');
  console.log(`\n[watch] ===== 自动部署开始 @ ${startedAt} =====`);
  const child = spawn(process.execPath, [path.join(__dirname, 'deploy.mjs'), ...(DRAFT ? ['--draft'] : []), '--message', 'watch 自动触发'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
  });
  child.on('exit', (code) => {
    running = false;
    console.log(`[watch] 部署结束，退出码 ${code}`);
    if (queued) { queued = false; console.log('[watch] 部署期间有新变更，立即再次同步'); runDeploy(); }
  });
}

console.log(`[watch] 已启动，监听目录：${WATCH_TARGETS.join(', ')}`);
console.log(`[watch] 静默窗口 ${DEBOUNCE_MS / 1000}s，Ctrl+C 退出\n`);

for (const target of WATCH_TARGETS) {
  const abs = path.join(ROOT, target);
  if (!fs.existsSync(abs)) continue;
  const stat = fs.statSync(abs);
  try {
    fs.watch(
      abs,
      { recursive: stat.isDirectory(), persistent: true },
      (_event, filename) => {
        if (!filename) return;
        // 忽略临时文件与非源码
        if (/\.(tmp|swp|log|json\.tmp)$/i.test(filename)) return;
        schedule(path.join(abs, filename));
      },
    );
  } catch (e) {
    console.error(`[watch] 无法监听 ${target}:`, e.message);
  }
}
