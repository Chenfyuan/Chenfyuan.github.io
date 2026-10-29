---
title: 大模型推理入门：给小白的完整教程
date: 2026-10-29 12:00:00
categories:
  - 大模型
tags:
  - 推理
  - 大模型
  - KV Cache
---

这是一份从零讲起的大模型推理教程，共 14 节：从「推理是什么」「token 是什么」开始，一路讲到 KV Cache、量化、连续批处理，以及 vLLM 等推理框架，最后附上面试口径和自测题。

<!-- more -->

教程是一个带交互的独立网页，里面有逐字生成动画、拖动温度看概率变化、有无 KV Cache 的计算次数对比等小演示，每节还能勾选记录学习进度。

<div style="text-align:center;margin:2em 0;">
<a href="/posts/llm-inference.html" style="display:inline-block;padding:14px 32px;background:#222;color:#fff;border-radius:8px;font-size:1.15em;font-weight:bold;text-decoration:none;">👉 打开交互式教程</a>
</div>

## 你会学到

- 推理和训练的区别，token 与逐字生成
- 温度、Top-p 等采样参数
- KV Cache 为什么能加速
- 量化、连续批处理与 vLLM 等推理框架
- 面试 30 秒口径与自测题

建议每天学 2～3 节，慢慢来。
