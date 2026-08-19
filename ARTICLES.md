# Articles

博客文章现在由 `src/content/` 目录中的 Markdown 文件驱动。标题不需要提前登记，也不需要修改 React 页面。

## 新增一篇文章

1. 在 `src/content/` 新建一个 `.md` 文件，文件名可以自定义，例如 `my-new-note.md`。
2. 在文件开头写 frontmatter：

```md
---
title: "文章标题"
date: "2024-08-18"
lang: "zh-CN"
category: "RESEARCH"
excerpt: "列表里显示的一句话摘要。"
readTime: "08 MIN"
tags:
  - physics
  - algorithms
---
```

3. 在第二个 `---` 后写正文。支持标题、列表、引用、代码块、表格和 GitHub Flavored Markdown。
4. 在项目目录执行：

```bash
npm run build
git add .
git commit -m "Add article: your title"
git push
```

GitHub Actions 会自动构建并发布到 GitHub Pages。文章会按 `date` 从新到旧显示，点击文章后会打开阅读视图；文章链接也支持 `#article/文件标题生成的 slug` 深链接。

## 写作约定

- `title`、`date`、`excerpt` 建议始终填写。
- 日期使用 `YYYY-MM-DD`，便于归档排序。
- 中文文章可填写 `lang: "zh-CN"`；省略时默认按中文排版。
- `category` 会显示为文章分类，`tags` 会显示在阅读视图顶部。
- 图片可以放在 `public/` 中，再在 Markdown 里使用 `/文件名` 引用；纯静态路径最适合 GitHub Pages。
