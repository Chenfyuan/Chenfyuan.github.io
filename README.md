# AI 学习笔记

基于 Hexo + NexT（Gemini 方案）的博客，推送到 main 后由 GitHub Actions（`.github/workflows/pages.yml`）自动构建并发布到 https://chenfyuan.github.io 。

## 本地预览

```bash
npm ci
npx hexo server   # http://localhost:4000
```

## 加新文章

- **普通 Markdown 文章**：`npx hexo new "文章标题"`，或直接在 `source/_posts/` 新建 `.md`，头部写 title、date、categories、tags。
- **自带样式/JS 的整页 HTML 教程**：放进 `source/posts/`（已在 `_config.yml` 的 `skip_render` 中排除，原样发布），访问地址为 `/posts/文件名.html`。再在 `source/_posts/` 写一篇 Markdown 介绍并链接过去，它就会出现在首页。

## 配置

- 站点配置：`_config.yml`
- 主题配置：`_config.next.yml`（暗色模式、本地搜索、目录、代码高亮等）
