# 前端审计与工程化优化实施记录

本文件记录了针对 `greenthree blog` 前端系统的全方位代码审计、架构重构与性能优化工作。

---

## 📌 优化成果速览

| 指标 / 维度 | 优化前 | 优化后 | 改善幅度 |
| :--- | :--- | :--- | :--- |
| **主入口 JS 体积** | `800.80 kB` (单一大包，触发警告) | `86.29 kB` (gzip: 33 kB) | **体积缩减约 89.2%** |
| **代码拆包策略** | 0 代码分割，全量打包 | 7 个独立模块 Chunk + 懒加载 | 模块独立缓存，按需加载 |
| **代码组织** | 单文件 `src/main.jsx` (771 行) | 模块化分层架构（15+ 个单一职责文件） | 易读性、维护性与扩展性大幅提升 |
| **SPA 内部导航** | 错误使用 `target="_blank"` 弹出新标签页 | 统一 SPA 状态导航 + 原生 History 同步 | 消除会话割裂，无刷新平滑切换 |
| **Canvas 能效** | 永不停歇 60 FPS 循环重绘（后台/遮挡亦耗电） | `IntersectionObserver` + 页面可见性感知暂停 | 显著降低移动端/笔记本 CPU/GPU 功耗 |
| **异常容灾** | 无任何 ErrorBoundary，局部报错即整屏白屏 | 全局 + 阅读器局部 `ErrorBoundary` 降级容错 | 极客级错误恢复与状态重置 |
| **文章阅读体验** | 代码块无高亮、无复制按钮 | 增加语言标牌与一键复制代码功能 | 增强技术博客开发阅读体验 |
| **网络与字体加载** | CSS 内 `@import` 阻塞渲染瀑布链 | `index.html` 预连接 `preconnect` + 标准外链 | 消除字体渲染阻塞 |
| **浏览量统计** | 无防刷，同一会话反复点开重复计数 | `sessionStorage` 会话级防刷与去重 | 避免本地与后端重复调用 |
| **SEO 与社交元标签** | 仅基础 title/desc | 补充 Favicon (SVG)、Open Graph、Twitter Card | 提升社交媒体与搜索收录效果 |

---

## 🛠️ 具体实施细节

### 1. 架构模块化与目录重构
我们将原本混杂在 `main.jsx` 单文件中的所有逻辑解耦为规范的现代前端目录结构：
```
src/
├── api/
│   └── supabase.js             # Supabase REST 接口请求、状态 Hook 与防刷逻辑
├── components/
│   ├── canvas/
│   │   ├── BlochSphere.jsx     # 布洛赫球交互（增加离开视口感知暂停）
│   │   └── WaveCanvas.jsx      # 波函数动画（增加离开视口感知暂停）
│   ├── common/
│   │   ├── ErrorBoundary.jsx   # React 错误边界降级组件
│   │   ├── HudDock.jsx         # 性能悬浮面板与表象切换
│   │   ├── LanguageSwitch.jsx  # 双语切换控件
│   │   └── PanelTitle.jsx      # 科技感面板标题
│   ├── reader/
│   │   ├── ArticleReader.jsx   # 文章阅读弹窗模态框（支持 Esc 关闭与背景滚动锁定）
│   │   └── MarkdownRenderer.jsx# Markdown 与 KaTeX 数学排版，集成代码块一键复制
│   └── views/
│       ├── ArticleArchive.jsx  # 首页文章归档列表
│       ├── ArticleAtlas.jsx    # 全部文章索引时间轴页
│       ├── ArticleViewCount.jsx# 文章点击量数字显示
│       ├── AtlasHeader.jsx     # 站点全功能顶栏（SPA 导航）
│       ├── AtlasHero.jsx       # 索引页头部统计
│       ├── AtlasPage.jsx       # 索引页通用布局外壳
│       ├── AtlasSearch.jsx     # 实时检索筛选面板
│       ├── ResourceAtlas.jsx   # 精选知识与项目资源导航
│       └── TopicAtlas.jsx      # 主题图谱与分类关联页
├── constants/
│   ├── copy.js                 # 中英双语文案字典 (UI_COPY, ATLAS_COPY)
│   └── resources.js            # 资源导航与项目入口配置 (RESOURCE_CATALOG)
├── utils/
│   ├── format.js               # 日期、复数、阅读时长、Slug 格式化
│   └── markdown.js             # YAML Frontmatter 解析与多语言正文切分
├── App.jsx                     # 核心应用状态机、SPA 路由协调与浏览器历史监听
├── main.jsx                    # 极简的应用挂载入口
├── math.jsx                    # 向后兼容的公式与渲染器导出模块
└── styles.css                  # 优化后的科技风视觉样式表
```

---

### 2. SPA 路由与导航修复
- **问题修复**：原代码在顶栏、Hero 探索按钮、移动端菜单等处对内部页面（`?view=articles`、`?view=topics`、`?view=resources`）设置了 `target="_blank"`，导致用户每点击一个导航就打开一个新浏览器标签页，完全破坏了 SPA 的即时体验和浏览器前进/后退栈。
- **优化方案**：在 `App.jsx` 中统一由 `handleNavigate` 进行管理，拦截普通左键点击并在单页内平滑切换视图，同步更新 `window.history.pushState`；同时监听 `popstate` 和 `hashchange` 事件，确保浏览器原生“前进 / 后退”完美响应。

---

### 3. 代码分包与构建优化
在 [`vite.config.js`](./vite.config.js) 中配置了 Rollup `manualChunks`：
- **`vendor-react`**：React 与 React-DOM 核心库。
- **`vendor-katex`**：KaTeX 核心数学排版引擎。
- **`vendor-markdown`**：`react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex` 等 AST 解析器。
- **`vendor-icons`**：`lucide-react` 图标库。
- **`vendor-yaml`**：Frontmatter 解析库。
- **`ArticleReader`**：采用 `React.lazy()` 懒加载，首屏不加载阅读器组件，点击打开文章时才按需载入。

---

### 4. Canvas 能效与电池保护
- 对 [`BlochSphere`](./src/components/canvas/BlochSphere.jsx) 与 [`WaveCanvas`](./src/components/canvas/WaveCanvas.jsx) 引入 `IntersectionObserver`。
- 当页面滚动使 Canvas 脱离可视区域、或打开了遮挡底层的文章弹窗、或用户切换到其他浏览器标签页（`document.hidden`）时，自动暂停昂贵的 Canvas 2D 绘图与渐变计算，恢复可见时自动恢复，大幅降低移动端与笔记本的发热和耗电。

---

### 5. 阅读与排版体验升级
- **代码块一键复制**：在 [`MarkdownRenderer.jsx`](./src/components/reader/MarkdownRenderer.jsx) 中自定义了 `pre`/`code` 渲染逻辑，顶部显示语言标牌（如 `BASH` / `JS` / `PYTHON`）及交互式复制按钮（复制成功后显示 `COPIED` 反馈）。
- **滚动锁定与键盘无障碍**：打开文章弹窗时锁定背景 `body` 滚动，支持 `Esc` 键一键退出，点击弹窗外空白区域关闭。

---

### 6. 数据请求防刷与健壮性
- 在 [`src/api/supabase.js`](./src/api/supabase.js) 中加入 `sessionStorage` 校验，同一浏览会话内重复打开同一篇文章不会向 Supabase 发送无意义的重复递增请求。
- 在组件关键路径（整站根部、文章阅读器、Markdown 内容区）增加 [`ErrorBoundary`](./src/components/common/ErrorBoundary.jsx)，防止渲染偶发异常导致整个页面白屏崩溃。

---

### 7. 页面加载与 SEO 元标签
- 在 [`index.html`](./index.html) 中：
  - 增加 Google Fonts 的 `<link rel="preconnect">`，消除原 CSS 内 `@import` 引起的瀑布式阻塞。
  - 增加内联 SVG Favicon（ψ 字符）。
  - 增加 Open Graph 和 Twitter Card 社交媒体分享卡片元标签。

### 8. 本轮审计修复
- 阅读器代码块现在只生成一个语义正确的 `<pre>`，并在异步剪贴板权限失败时回退到 textarea 复制方案。
- 文章点击统计统一由选中文章状态触发，覆盖界面打开、hash 深链接和刷新；计数回调稳定化，避免失败时重复重试。
- 文章 slug 校验脚本复用前端同一套 ASCII slug 规则，并优先使用中文/英文翻译标题作为缺省种子，保证构建端与 Supabase 白名单同步一致。
- 菜单与主题弹窗加入 Escape 关闭、焦点初始定位、Tab 焦点圈定和关闭后焦点恢复；Canvas 在弹窗遮挡、页面隐藏或 reduced-motion 偏好下停止动画。
- 中英文主题标签不再按数组位置配对，避免译文增删或重排造成错误主题归并；搜索输入补充可访问名称并实时播报结果数量。
- 新增 `npm test` 原生 Node 回归测试，覆盖文章 slug、双语 frontmatter 和物理复数格式。
- Supabase 计数 RPC 增加按客户端指纹与小时桶的服务端去重；只保存 MD5 指纹，不保存原始代理地址。它降低脚本刷量风险，但不替代专业分析系统的反作弊能力。

### 9. 发布前数据库操作
首次启用或新增文章后，需要在 Supabase SQL Editor 执行：
`supabase/migrations/202608200001_article_slug_registry.sql`

新增文章 slug 白名单同步使用 `npm run sync:article-slugs`。该命令只在安全的本地或 CI 环境读取 `SUPABASE_SERVICE_ROLE_KEY`，service role key 不得进入前端环境变量、构建产物或 GitHub Pages。

---

## 🚀 如何验证

在项目根目录下执行：
```bash
# 1. 验证生产构建
npm run build

# 2. 启动本地预览
npm run preview
```
