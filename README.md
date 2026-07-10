# 🍁 Clash → V2Ray 订阅转换工具

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)

---

### 🚀 一键部署

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://dash.cloudflare.com/?to=/:account/pages/new)

一个纯前端解析、支持多协议、高颜值的 **Clash (Mihomo) 订阅转 V2Ray 订阅链接** 工具。项目设计灵感来源于 **Claude Chat** 的极简学术风格，并且全面适配了 PC 端与移动端。

> 🔒 **隐私至上：**
> 本工具属于「私有转换器」设计。所有的 YAML 解析、多协议映射、Base64 编码等核心转换逻辑均在您浏览器的前端沙箱中完成。Worker 仅作为一个轻量级的网络请求中转站（用于绕过浏览器 CORS 跨域限制，且包含完备的访问密钥校验）。

---

## 🎨 界面与设计规范 (Claude 风格)

- **色彩基调：** 选用暖白与浅米色（`#F5F4EF`）作为主背景，主色调使用陶土橙与珊瑚色（`#D97757`），带来纸张般的舒适质感。
- **排版结构：** 单栏式布局，PC 端最大宽度限制为 720px 完美居中；移动端全面优化，极长 Base64 编码文本框支持平滑的横向滚动。
- **动效细节：** 转换结果卡片采用平滑的淡入上滑动画；复制成功后，按钮状态短暂变化为“已复制 ✓”并在 1.5 秒后自动恢复。

---

## ✨ 核心特性

- [x] **多协议支持**：
  - **Shadowsocks (SS)**：将密码与加密方式进行 Base64 编码，生成标准 `ss://` 链接。
  - **ShadowsocksR (SSR)**：自动映射 `protocol` / `obfs` 及其对应参数，完整生成 `ssr://`。
  - **VMess**：将各项字段映射并生成 V2Ray 兼容的 JSON，整体进行 Base64 编码。*(注：端口与 alterId 均严格转为字符串，确保各大主流客户端正常导入。)*
  - **VLESS**：全面支持 `TLS` 模式以及现代的 `Reality` 混淆模式（支持 `pbk`/`sid`/`fp` 等 query 参数映射）。
  - **Trojan**：生成符合规范的 `trojan://` 链接，携带 `sni` 和 `type` 等参数。
  - **Hysteria 2**：若检测到 Hysteria 2 协议，会自动转换并向用户标记“仅供参考，V2Ray 核心本身不原生支持（取决于客户端核心是否内置）”。
- [x] **双输入模式**：支持粘贴订阅链接进行后台代理抓取，或直接粘贴 YAML（或 Base64 后的配置文本）进行纯本地转换。
- [x] **代理防白嫖设计**：后端抓取端点强制校验 `X-Fetch-Proxy-Token`，该密钥通过前端的“设置”弹窗存入本地 `localStorage`，不在代码仓库与前端编译包中留存，安全防爬。
- [x] **容错与大文件处理**：解析逻辑包裹在 `try-catch` 中并配合 `setTimeout`，支持在解析大文件（如包含数百个节点及海量分流规则的机场订阅）时完美显示 loading 状态，不会造成浏览器卡死。

---

## 🚀 快速部署 (一键部署至 Cloudflare Pages)

1. 点击上方 **Deploy to Cloudflare Pages** 按钮（或手动进入 [Cloudflare Dashboard](https://dash.cloudflare.com) 并连接您的 GitHub 仓库）。
2. 在 Cloudflare Pages 创建项目，设置以下构建配置：
   - **构建命令 (`Build command`)**：`npm run build` 或 `pnpm run build`
   - **输出目录 (`Build output directory`)**：`dist`
3. **关键安全配置：**
   - 进入项目根目录的 **Settings** -> **Environment variables**（环境变量）。
   - 添加一个环境变量：`FETCH_PROXY_TOKEN`，其值设定为一个您自己知道的随机字符串（例如：`MySecretToken_123456`）。
4. 保存并重新触发部署。
5. 部署完成后，在前端页面的右上角点击 **“配置代理”** 按钮，输入您刚才设置的 `FETCH_PROXY_TOKEN`。这样您的前端才能正常调用 Pages Function API 获取订阅内容。

---

## 🛠️ 本地开发

本项目基于 **React + TypeScript + Vite + TailwindCSS** 构建。我们支持使用 `npm` 或 `pnpm` 进行依赖管理（推荐使用更快速、更安全的 `pnpm`）。

### 1. 克隆项目并安装依赖

使用 `pnpm`：
```bash
pnpm install
```

或者使用 `npm`：
```bash
npm install
```

### 2. 启动本地开发服务

```bash
# 启动前端开发服务器 (默认端口: 3000)
pnpm run dev
# 或 npm run dev

# 另起一个终端启动本地 Cloudflare Pages Functions 模拟服务 (默认端口: 8788)
npx wrangler pages dev dist
```

> 💡 **本地测试代理密钥：**
> 本地开发时，默认的 `FETCH_PROXY_TOKEN` 为 `local_development_token_change_me_in_dashboard`（配置于 `wrangler.toml` 中）。请在前端点击“配置代理”并填入此值，即可在本地测试链接抓取功能。

---

## 📂 项目结构

```
clash2v2ray/
├── functions/
│   └── api/
│       └── fetch.ts          # Pages Function 后端代理抓取 API (防 CORS)
├── src/
│   ├── components/
│   │   ├── InputPanel.tsx    # 订阅输入控制面板
│   │   ├── ResultCard.tsx    # 转换结果与节点列表明细面板
│   │   └── SettingsModal.tsx # 本地代理密钥配置弹窗
│   ├── lib/
│   │   ├── parsers/          # 各协议专有解析逻辑 (ss, vmess, vless, trojan)
│   │   ├── convert.ts        # 核心转换器调度逻辑
│   │   └── yaml.ts           # js-yaml 封装 (包含 Base64 自动检测与 UTF-8 互转)
│   ├── App.tsx               # 界面主组装与生命周期管理
│   ├── index.css             # Tailwind 样式及自定义动效
│   └── main.tsx              # React 挂载入口
├── wrangler.toml             # wrangler 本地部署与环境变量声明
├── package.json              # 依赖与脚本定义
└── README.md                 # 项目指南说明书
```

---

## 📝 许可证

本项目遵循 [MIT License](LICENSE) 开源协议。
