# 双语文章发布指南

博客会自动读取 `src/content/` 中的所有 Markdown 文件。每篇文章只需一个文件，但必须在同一文件中提供完整中文和英文版本；标题不需要提前登记，也不需要修改 React 页面。

## 文件模板

在 `src/content/` 新建任意名称的 `.md` 文件，并使用以下结构：

```md
---
slug: "stable-english-slug"
date: "2026-08-19"
translations:
  zh:
    language: "zh-CN"
    title: "中文标题"
    category: "文章分类"
    excerpt: "中文摘要。"
    readTime: "08 MIN"
    tags:
      - 物理
      - 算法
  en:
    language: "en"
    title: "English Title"
    category: "FIELD NOTE"
    excerpt: "English summary."
    readTime: "08 MIN"
    tags:
      - Physics
      - Algorithms
---

<!-- lang:zh -->

这里写完整中文正文。

<!-- lang:en -->

Write the complete English article here.
```

`slug` 是不随语言变化的文章地址标识。发布后不要随意修改，否则旧的 `#article/slug` 链接会失效。文章按 `date` 从新到旧排列；正文支持标题、列表、引用、代码块、表格、GitHub Flavored Markdown 和 LaTeX 数学公式。

文章在站内被主动打开时，会使用稳定的文章 ID 在 Supabase 中原子累加点击数。推荐每篇文章填写唯一、稳定的小写英文 `slug`，词与词之间使用连字符；如果省略或使用非 ASCII slug，构建会根据文件路径生成稳定的 `note-xxxxxxx` ID。

## 发布

在项目目录执行：

```bash
npm run build
npm run validate:articles
git add src/content/你的文章.md
git commit -m "Add bilingual article"
git push origin main
```

如果 Supabase 已应用文章 slug 白名单迁移，新增文章后还需要在只运行于本地或 CI 的安全环境中同步白名单：

首次使用阅读量统计时，请先在 Supabase SQL Editor 中执行 `supabase/migrations/202608200001_article_slug_registry.sql`。

```bash
# Bash
SUPABASE_SERVICE_ROLE_KEY=只放在本地或GitHub Actions密钥中 npm run sync:article-slugs

# PowerShell
$env:SUPABASE_SERVICE_ROLE_KEY = '只放在本地或GitHub Actions密钥中'; npm run sync:article-slugs
```

`SUPABASE_SERVICE_ROLE_KEY` 绝不能写入 `.env`、前端代码或 GitHub Pages 构建产物。

GitHub Actions 会自动构建并发布到 GitHub Pages。

## 写作约定

- 中文和英文的 `title`、`category`、`excerpt`、`readTime`、`tags` 都应填写。
- `<!-- lang:zh -->` 与 `<!-- lang:en -->` 后必须分别提供完整正文，不要只翻译摘要。
- 日期统一使用 `YYYY-MM-DD`。
- 阅读时长统一写成 `08 MIN` 形式。
- 图片建议放在 `public/`，再从 Markdown 使用站点可访问的绝对路径引用。
