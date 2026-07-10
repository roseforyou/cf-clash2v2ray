# Clash → V2Ray 订阅转换工具 · 项目需求文档

## 0. 先决问题:必须在写代码前决定

**这个工具的定位是「本地/私有转换器」还是「公网长期订阅服务」?**

- Clash 订阅 URL 本身携带账号 token,等同于凭证。
- 若做成 `?url=<原始订阅地址>` 这种动态转换链接,原始凭证会以明文形式出现在:Worker 访问日志、浏览器历史、Referer header。
- 若这个新链接要给客户端"长期订阅",它必须公网可访问、无需登录 —— 这和"凭证不能泄露"天然冲突。

**本文档采用的方案:「模式 A:私有转换器」**,理由和后果如下,写在这里是为了让你(或未来接手代码的 AI)不再纠结:

| | 模式 A(本文档采用) | 模式 B(公网动态订阅,不采用) |
|---|---|---|
| 用途 | 手动/半自动转换一次,复制结果自己保存到客户端 | 客户端直接订阅一个 Worker 生成的链接,自动更新 |
| 是否需要访问控制 | 需要一个简单密钥(Cloudflare Access 或自定义 Header/Query Token) | 必须做,且要防日志泄露、防爬虫 |
| 复杂度 | 低,一个 Worker 端点 + 静态页面即可 | 高,需要日志脱敏、限流、可能还要缓存 |
| 本次是否实现 | ✅ | ❌(在"后续扩展"章节留出接口) |

如果之后你想升级成模式 B,架构上是兼容的,只是要在 Worker 里加一层访问控制和日志脱敏,不影响转换核心逻辑。

---

## 1. 项目目标

一个纯前端 + 轻量 Worker 的工具,用于把 Clash(Mihomo)格式的订阅转换为 V2Ray 通用格式(base64 编码的节点链接列表),部署在 Cloudflare Pages,本地开发、GitHub 一键部署。

## 2. 核心功能需求

### 2.1 输入方式(二选一,同一个转换按钮)

1. **URL 模式**:粘贴 Clash 订阅链接,前端调用 Worker 代理抓取(避免 CORS),Worker 拿到内容返回给前端解析
2. **文本模式**:直接粘贴 Clash YAML 文本(或 base64 编码后的文本,自动识别并解码)

### 2.2 转换范围(协议支持)

| Clash type | 转换目标格式 | 说明 |
|---|---|---|
| `ss` | `ss://` | method:password 部分 base64 编码 |
| `ssr` | `ssr://` | 全字段 base64,注意 protocol/obfs 参数映射 |
| `vmess` | `vmess://` | 拼 JSON 后整体 base64,字段映射见附录 |
| `vless` | `vless://` | query 参数拼接(encryption/flow/security/sni/type 等) |
| `trojan` | `trojan://` | password@server:port 形式,query 带 sni/type |
| `hysteria2` | `hysteria2://` | 若客户端不支持,标记为"仅供参考,V2Ray 核心不支持" |
| 其他不支持的类型 | 跳过并记录 | 前端展示"已跳过 N 个不支持节点"提示,附节点名列表 |

### 2.3 输出

- 文本框展示最终 base64 编码后的订阅内容(单个大字符串)
- **复制按钮**:一键复制到剪贴板,复制成功要有明确反馈(按钮文字短暂变化,不用 alert 弹窗)
- **可选:同时展示转换前的节点列表**(名称+类型+是否成功),方便肉眼核对数量对不对
- 下载按钮(可选):保存为 `.txt` 或 `v2ray_sub` 文件

### 2.4 错误处理(必须覆盖,这是这类工具最容易翻车的地方)

- 订阅 URL 抓取失败(网络错误、404、超时)→ 明确提示,不要吞掉错误
- YAML 解析失败(格式不对、不是 Clash 格式)→ 提示"无法识别为 Clash 配置"
- 部分节点字段缺失(比如 vmess 缺 `alterId`)→ 用默认值兜底,不要整体失败
- 全部节点都转换失败 → 明确提示,不要返回一个空的 base64 字符串让用户以为成功了
- **`proxies` 字段缺失时,不要去 `proxy-groups` 里找替代数据**:`proxy-groups` 存的是策略组(引用节点名字的字符串数组),不是节点的真实配置(server/port/uuid),两者结构完全不同。正确做法是校验 `config.proxies` 是否为非空数组,不是就直接报错"未找到 proxies 字段,可能不是标准 Clash 配置",不要试图从别的字段兜底拼凑数据
- **大文件保护**:部分机场订阅包含几百个节点 + 大量分流规则,文件可能达到数 MB,纯前端 `js-yaml` 解析大文本时要包 `try-catch`,并在解析期间显示 loading 状态,避免用户以为页面卡死

## 3. 技术架构

```
本地开发 / GitHub 仓库
        │
        ▼
Cloudflare Pages(静态前端 + Pages Functions)
        │
        ├── / (index.html)              前端页面,Claude Chat 风格 UI
        ├── /functions/api/fetch.ts     Worker 函数:代理抓取订阅 URL(绕过 CORS)
        └── /src/lib/convert.ts         转换核心逻辑(前端和 Worker 共用同一份)
```

- **前端**:纯静态,Vite 构建,不用重框架也行(考虑到你之前笔记本项目已经用 React+Vite+Tailwind,这里保持技术栈一致,方便复用经验)
- **Worker**:仅做一件事 —— 代理抓取远程订阅内容并返回文本,不做转换(转换放前端,减少 Worker CPU 时间压力,同时避免把访问密钥经过 Worker 逻辑分支泄露到日志里)
- **访问控制**:Worker 的 `/api/fetch` 端点校验一个简单 Header Token(前端调用时自动带上,值存在 Cloudflare 环境变量里),防止你的 Worker 被别人当公共代理白嫖

## 4. UI/UX 设计规范(Claude Chat 风格)

### 4.1 视觉基调

- 主背景:暖白/浅米色(`#F5F4EF` 或类似),不是纯白
- 强调色:陶土橙/珊瑚色(接近 Claude 的 `#D97757` 系),用于主按钮和高亮
- 字体:系统默认无衬线字体即可,标题可用衬线体增加"文档感"(Claude 官网标题常用衬线体)
- 圆角:较大的圆角(12–16px),卡片式布局,避免生硬直角

### 4.2 布局(对话式单栏,而不是传统"表单+按钮"横向布局)

```
┌─────────────────────────────┐
│  标题区                        │
│  Clash → V2Ray 订阅转换        │
├─────────────────────────────┤
│  [URL 输入框]                  │
│  或                            │
│  [多行文本粘贴框]                │
│  (Tab 切换,而不是两个框同时显示)  │
├─────────────────────────────┤
│         [ 转换 ] 按钮           │
├─────────────────────────────┤
│  结果卡片(转换成功后才出现,       │
│  带淡入动画)                    │
│  - 节点统计:成功 N / 跳过 M      │
│  - 输出文本框(只读,等宽字体)     │
│  - [复制] [下载] 按钮            │
└─────────────────────────────┘
```

### 4.3 响应式(PC / 移动端)

- PC:主容器最大宽度 720px,居中,留白充足
- 移动端(<640px):
  - 主容器 padding 收窄到 16px
  - 按钮宽度撑满
  - 输出文本框改为可横向滚动的等宽字体块,避免长 base64 字符串挤压布局
  - Tab 切换(URL/文本)在窄屏下改为下拉选择或上下堆叠

### 4.4 交互细节

- 转换按钮点击后要有 loading 状态(Claude 风格的那种简洁 spinner 或文字跳动,不要花哨进度条)
- 复制成功:按钮文字短暂变为"已复制 ✓",1.5 秒后恢复
- 错误提示:用类似 Claude 对话中"系统提示"的浅色卡片样式,不用刺眼的红色警告框

## 5. 目录结构建议

```
clash2v2ray/
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── InputPanel.tsx
│   │   ├── ResultCard.tsx
│   │   └── CopyButton.tsx
│   ├── lib/
│   │   ├── convert.ts        # 核心转换逻辑(纯函数,可单测)
│   │   ├── parsers/
│   │   │   ├── ss.ts
│   │   │   ├── vmess.ts
│   │   │   ├── vless.ts
│   │   │   └── trojan.ts
│   │   └── yaml.ts           # 封装 js-yaml
│   └── styles/
├── functions/
│   └── api/
│       └── fetch.ts          # Cloudflare Pages Function,代理抓取
├── public/
├── wrangler.toml
├── package.json
└── README.md
```

## 6. 部署方案(一键部署)

1. 本地用 `npm create cloudflare@latest` 或直接用 Vite 模板初始化,推送到你自己的 GitHub 仓库
2. Cloudflare Dashboard → Pages → Connect to Git → 选择该仓库,构建命令 `npm run build`,输出目录 `dist`
3. 在 Pages 项目的环境变量里配置:
   - `FETCH_PROXY_TOKEN`:自定义一个密钥,Worker 端校验此 Header

   > ⚠️ **不要把这个密钥硬编码在前端代码里**。前端是纯静态站点,任何人都能通过浏览器"查看源码"或 Network 面板看到打包后的 JS,硬编码的密钥形同虚设,而且一旦这个仓库开源,密钥会直接写进 git 历史。
   >
   > 正确做法:页面提供一个简单的"设置"入口,用户首次使用时手动输入密钥,存入浏览器 `localStorage`,之后请求 `/api/fetch` 时从 `localStorage` 读取并带上。这样解决的是"代码公开导致密钥公开"的问题 —— 密钥不进代码仓库,只存在于你自己的浏览器里。这不是为了防止有人用 F12 看到自己的密钥(那本来就无所谓,是你自己的浏览器),而是为了让这个项目就算开源出去,别人拿到代码也拿不到你的密钥。
4. 之后每次 `git push` 到主分支自动触发部署(这就是"一键部署"的实际含义 —— 一次配置,后续免操作)
5. README 里附上"Deploy to Cloudflare Pages"按钮(Cloudflare 支持这种一键 fork+部署的按钮,方便你以后重新部署或分享给别人自建)

## 7. 转换逻辑关键映射(附录,供 AI 编码工具直接参考)

### vmess (Clash → vmess://)

Clash 字段 → vmess JSON 字段:
```
name → ps
server → add
port → port
uuid → id
alterId → aid (缺省填 0)
cipher → scy (缺省 "auto")
network → net
tls → tls ("tls" 或 "")
servername/sni → sni
ws-opts.path → path
ws-opts.headers.Host → host
```
最终:`vmess://` + base64(JSON.stringify(上述对象))

> ⚠️ **关键坑**:`port` 和 `aid` 在 Clash 里是数字类型(`443`, `0`),但拼进 vmess 的 JSON 时**必须转成字符串**(`"443"`, `"0"`),否则 v2rayNG 等主流客户端会直接拒绝导入。`network` 字段若缺失,默认补 `"tcp"`,不要留空。

### trojan (Clash → trojan://)

```
trojan://{password}@{server}:{port}?sni={sni}&type={network}#{urlEncode(name)}
```

### ss (Clash → ss://)

```
ss://{base64(cipher:password)}@{server}:{port}#{urlEncode(name)}
```

### vless (Clash → vless://)

```
vless://{uuid}@{server}:{port}?encryption=none&security={tls?"tls":"none"}&type={network}&sni={sni}#{urlEncode(name)}
```

> ⚠️ **现在的 VLESS 节点绝大多数用 Reality,不是裸 TLS**,必须额外映射 `reality-opts` 字段,否则转换出的节点大概率连不上:
>
> ```
> Clash 字段                  → vless:// query 参数
> reality-opts.public-key    → pbk
> reality-opts.short-id      → sid
> client-fingerprint         → fp(缺省 "chrome")
> reality-opts.spider-x      → spx(可选)
> ```
>
> 当 `reality-opts` 存在时,`security` 应设为 `reality` 而不是 `tls`。

> 注:以上是简化映射,实际字段(如 `flow`、`grpc-opts.grpc-service-name`、`ws-opts.headers`)要在开发时对照 Clash 官方配置文档和 V2Ray 链接标准(v2rayN 的 URI Scheme 约定)逐项核对,不同客户端对同一字段的解析容错度不同,建议先用你自己现有的节点做真实转换测试,而不是只用构造的假数据测试。

## 8. 测试用例(最低限度要覆盖)

- 单节点、多节点(50+)的 Clash 配置各测一次
- 订阅内容本身是 base64 编码 vs 明文 YAML,两种都要能识别
- 包含不支持协议(如 hysteria2)混杂在正常节点中的情况
- 节点名包含中文/emoji 时,urlEncode 是否正确,复制到客户端后名称显示是否正常
- 移动端 Safari / Chrome 复制到剪贴板的兼容性(iOS Safari 对 `navigator.clipboard` 有额外限制,需要做降级方案 `document.execCommand('copy')`)

## 9. 后续可选扩展(不在本次实现范围,留接口)

- 升级为"模式 B"动态订阅:加访问 token + 日志脱敏 + 限流
- 支持反向转换(V2Ray → Clash)
- 支持节点去重、按延迟测速排序后再输出
- 支持自定义节点重命名规则(比如按地区分组前缀)
