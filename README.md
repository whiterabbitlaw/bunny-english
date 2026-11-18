# 小兔英语 Bunny English

给 3–6 岁、家里说中文的孩子用的英语小练习。四个主题：动物、颜色、水果、数字。每个主题 6 个词，带中文、英语和原创插画。可以听一听、点图片、给图片和声音配对，也可以听示范并在本机录音回放。

没有账号、广告、统计、上传或后端。学习记录只在这台浏览器里。

## 这是预览，不是正式网站

`npm run dev` 打开的是本地开发预览。这个会话里的地址只在当前机器上、开发服务还开着的时候能用，关掉就没有了。它不是已发布的正式站点，也不能保证换一台设备还有同样的英语语音。

正式使用请在自己的电脑上构建，把 `dist/` 放到任意静态网站空间，并用 HTTPS。麦克风需要安全连接（HTTPS 或 localhost）。

## 本地运行

需要 Node.js 22 或更新版本。

```bash
npm install
npm run dev
```

浏览器打开 [http://127.0.0.1:43123](http://127.0.0.1:43123)。

其他命令：

```bash
npm run build      # 类型检查并生成 dist/（默认根路径）
npm run build:pages # 按 /bunny-english/ 构建，并检查资源前缀
npm run preview    # 预览根路径构建结果，仍是本机，不是正式部署
npm run preview:pages # 预览 GitHub Pages 子路径构建
npm run lint       # oxlint
npm run test:e2e   # Playwright 冒烟测试（会自己启动开发服务）
npm run test:pages # 子路径生产冒烟：脚本、样式、manifest、图标、Service Worker
npm run icons      # 用 public/favicon.svg 重新生成 PWA 图标
```

第一次跑测试需要浏览器：

```bash
npx playwright install chromium
```

## 孩子怎么玩

首页有四个世界。每个世界可以：

- **小课堂**：3 个词加 2 道听力题，没有倒计时。
- **学一学**：大图、英语、中文，点一下才朗读。
- **听一听**：听单词，点对应的图片。点错会鼓励再试，不会扣星星，也没有失败计时。
- **配一配**：一边是图片，一边是喇叭。不认识字也可以玩。点「重新洗牌」会清空本轮并换顺序。
- **读一读**：听示范，用本机麦克风录下来再听。刷新后录音消失。

星星存在这台浏览器里。第一次听成功一个新词、听一听答对、配对成功、或保存一段录音，会加星。

右上角可以开关声音。家长入口要按住大约一秒（或按住回车键）。直接打开 `#/parent` 也会先看到按住确认。

休息提醒默认 15 分钟，到点只是建议看看远处，可以继续玩。

## 家长需要知道的限制

这些话在家长区里也有，这里再说一遍，避免把浏览器能力说满：

- **英语朗读**用的是浏览器 `speechSynthesis`，优先 `en-US`。没有自带的真人录音，也没有付费语音接口。有的手机、电脑或无头浏览器读不到英语语音，甚至完全没有 `speechSynthesis`。这时仍然可以看图和单词；听一听会把英语单词显示出来，而不是假装听到了声音。
- **录音**用 `MediaRecorder` 和 `getUserMedia`。音频只做成页面内存里的 blob，用来本地回放，不上传、不写入 localStorage。拒绝权限、没有麦克风、或页面不是 HTTPS/localhost 时，会说明原因，听示范仍然可用。
- **词语对照**默认关闭。家长打开后，孩子再点一次按钮，才会使用浏览器的 `SpeechRecognition`。它只检查识别出的文字里有没有目标单词，**不是发音评分**，不显示分数。部分浏览器会把这段短音频发给系统或浏览器厂商的服务器。本应用没有自己的服务器，不会另外保存这段声音。
- **离线**：生产构建会注册一个很简单的 Service Worker，只缓存它所在目录里访问过的同源文件（根路径或 `/bunny-english/`）。它不能离线提供英语语音，也不能代替麦克风所需的安全连接。开发预览不注册 Service Worker。
- **安装**：`manifest.webmanifest` 只提供「添加到主屏幕」这类浏览器能力，不是应用商店，也不保证安装后离线可用。

## 架构

纯前端，Vite + React + TypeScript。样式是 Tailwind CSS。对话框和开关用 Radix（和 shadcn 同一套无样式基础），按钮样式在 `src/lib/button-style.ts`。

- 路由是 hash（`#/world/animals`），静态托管不需要服务器回退。
- 词表在 `src/data/worlds.ts`。
- 插画是 `src/components/art.tsx` 和 `src/components/Bunny.tsx` 里的原创 SVG。
- 进度键名是 `bunny-english-state-v1`（localStorage）。家长门闩是 `bunny-parent-unlock`（sessionStorage，关掉标签页就失效）。
- 语音、录音、可选识别分别在 `src/lib/speech.ts`、`src/hooks/useRecorder.ts`、`src/lib/recognition.ts`。

没有账号系统，没有分析脚本，没有第三方视频，字体随包发布（Fredoka、Noto Sans SC、站酷快乐体），运行时不请求字体服务。

## 隐私

存在本机的只有星星、听过的词 id、游戏次数、家长设置和本次打开的时间。录音不进 localStorage。词语对照若被家长打开，音频是否离开设备取决于那台浏览器的语音识别实现，不取决于本仓库的服务器——因为没有服务器。

## 微信作业小程序

幼儿园作业在 `wechat/`，和这个网页分开。老师上传图片和示范音频，家长看图听音频后交两段录音。网页的 GitHub Pages 不因此改变。配置、安全规则和真机清单见 [wechat/README.md](wechat/README.md)。仓库里不放 AppID、云环境 ID 或老师名单。

## 部署

`APP_BASE` 决定打包前缀，默认是 `/`。GitHub Pages 项目站点用 `/bunny-english/`。以后放到域名根路径（例如 Cloudflare）时不要设置 `APP_BASE`，同一套路径逻辑仍然成立。路由继续用 hash，静态托管不需要服务器回退。

```bash
npm install
npm run build
APP_BASE=/bunny-english/ npm run build
```

`npm run build:pages` 就是带 `/bunny-english/` 的构建，并检查 `dist/` 里的脚本、样式、manifest（`start_url`、`scope`、图标）和 Service Worker 注册地址都在这个前缀下。Service Worker 按自己的地址缓存，不会把子路径资源写到网站根上。

推送到 `main`，或在 Actions 里手动运行 “Deploy GitHub Pages”，会构建 `dist/` 并发布到 GitHub Pages。工作流不修改仓库可见性，也不改 Pages 的账号设置。不需要密钥。

麦克风和部分语音识别需要 HTTPS。`github.io` 是 HTTPS。localhost 上的 `npm run preview` 可以试麦克风，但那仍然只是你自己电脑上的预览。

## 测试

在本环境执行：

```bash
npx tsc -b --pretty false
npm run test:e2e
npm run test:homework
```

`npm run test:e2e` 使用 Playwright Chromium，启动 `http://127.0.0.1:43123`。覆盖首页和四个世界的导航、听一听答错/答对、星星刷新后还在、配对答错与重新洗牌、家长按住进入、声音/休息/词语对照开关、清空前取消与确认、休息提醒可关掉、麦克风不支持/非安全连接/拒绝权限、本地录音 blob 回放、没有 speechSynthesis 时的文字替代，以及家长开启后的词语对照（对上与没对上，且没有分数）。

最近一次本地结果（2026-11-17）：

```text
npx tsc -b --pretty false
# exit 0

npm run lint
# exit 0（src/state/store.tsx 仍有一条 fast-refresh 警告）

npm run build && node scripts/verify-pages-base.mjs dist /
# base paths ok: /

npm run test:e2e
# Running 17 tests using 2 workers
# 17 passed (14.4s)

npm run test:pages
# Running 2 tests using 1 worker
# 2 passed (5.2s)
```

2026-11-18 又跑过网页和作业测试：`npm run test:e2e` 17 passed，`npm run test:pages` 2 passed，`npm run test:homework` 9 passed。作业测试不连接云开发。

代表性截图在运行测试时写到本机的 `/opt/cursor/artifacts/`（home、learn、listen、match、speak、parent、tts fallback）。

`npm run lint` 可通过。`src/state/store.tsx` 同时导出状态钩子，oxlint 会给一条 fast-refresh 警告，不导致失败。

## 已知限制

- 英语能不能读出来，完全看设备和浏览器的语音列表。本预览环境的 Chromium 没有读到可用英语语音，所以听一听会显示单词。这是真实降级，不是测试专用后门。
- 词语对照不是口腔动作或音素评分。不要把它当成发音打分。
- 录音在刷新、关闭页面或离开读一读时会丢掉。
- 进度不能换设备同步。清站点数据会丢掉星星。
- Service Worker 只在生产构建注册，缓存范围跟着 `APP_BASE`。离线时如果缓存里没有页面，仍然打不开。
- 小课堂和听一听的题目顺序是随机的，方便重复玩。
