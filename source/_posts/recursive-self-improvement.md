---
title: 递归自我改进（RSI）入门：从智能爆炸设想到今天的"弱 RSI"实践
date: 2026-11-04 10:00:00
categories:
  - 大模型
tags:
  - 递归自我改进
  - RSI
  - AI 安全
  - 智能体
  - 面试
---

**一句话理解**：递归自我改进（Recursive Self-Improvement，RSI）指 AI 系统**改进自己**，而且改进后的版本**更擅长继续改进自己**，如此循环。

> 截止时点：2026-11。本文所有论文结论均来自原文摘要或正文，链接见文末；尚无定论的内容会明确标注"有争议/不确定"。

<!-- more -->

## 本节重点

1. RSI 的关键不是"会变好"，而是"**改进的能力本身也在被改进**"。
2. 真正的、无上限的 RSI 目前**没有实现**；今天工程里有的是各种"弱 RSI"（部分环节自我改进）。
3. 能说出 3～4 个代表工作（STaR、Self-Rewarding、STOP、Darwin Gödel Machine）和主要风险（模型崩溃、奖励投机、对齐）。

## 概念直觉

想象一个学生：

- **普通学习**：老师教，学生变强。改进来自外部。
- **自我改进**：学生自己做题、自己对答案、自己总结错题。改进来自自己，但"学习方法"不变。
- **递归自我改进**：学生不仅做题，还在改进**自己的学习方法**；方法变好后，下一轮改进方法也更有效……

```mermaid
flowchart LR
  A[当前系统 v_n] --> B[提出对自己的修改]
  B --> C[评估/验证：新版本更好吗？]
  C -- 更好 --> D[替换为 v_n+1]
  C -- 不更好 --> A
  D --> A
```

图里最关键的一步是"**评估/验证**"：没有可靠的评估，自我修改就可能越改越差，甚至"骗过"评估（见后文奖励投机）。

## 必要术语（人话版）

| 术语 | 人话解释 |
|---|---|
| 智能爆炸（Intelligence Explosion） | 设想：机器聪明到能设计更聪明的机器，能力随之快速飙升 |
| 强 RSI / 弱 RSI | 本文用法：强 RSI 指系统能改进包括自身模型在内的一切且持续加速；弱 RSI 指只改进部分环节（数据、提示词、脚手架代码）。这是常见的口语区分，**并非学术界统一定义** |
| 自训练（Self-training） | 用模型自己生成、再筛选过的数据来训练它自己 |
| 自博弈（Self-play） | 和自己的副本对弈产生训练数据，如 AlphaZero |
| 脚手架（Scaffolding） | 包在大模型外面、组织多次调用的程序（如智能体框架） |
| 奖励投机（Reward Hacking） | 系统找到"刷高分但没真正完成任务"的捷径 |
| 模型崩溃（Model Collapse） | 反复用模型生成的数据训练模型，分布逐渐退化 |

## 历史脉络

1. **1965，I. J. Good**：在《Speculations Concerning the First Ultraintelligent Machine》中提出，超智能机器可以设计更好的机器，从而出现"智能爆炸"，并称第一台超智能机器将是人类"最后一项需要做的发明"（前提是它足够听话、能告诉我们如何控制它）。
2. **2003，Jürgen Schmidhuber，Gödel Machine（哥德尔机）**：一个理论上的自引用问题求解器，只有在**能证明**某次自我改写对效用有益时才改写自己的代码。理论优美，但实践中这种证明几乎做不出来（这一点后来被 Darwin Gödel Machine 论文直接指出）。
3. **2000s～2010s，Yudkowsky 与 Bostrom**：Eliezer Yudkowsky 在 MIRI 的文章（如 2013 年《Intelligence Explosion Microeconomics》）中系统讨论 RSI 和"起飞速度"；Nick Bostrom 在 2014 年《Superintelligence》中讨论智能爆炸的可能路径与控制问题。**"起飞是快是慢"至今有争议**，没有共识。

## 今天工程实践中的"弱 RSI"实例

以下每篇都已核对原文（链接见文末）。

| 工作 | 改进的是什么 | 核心做法 | 关键事实（来自原文） |
|---|---|---|---|
| **STaR**（Zelikman 等，2022） | 模型参数 | 让模型生成推理过程，只保留答对的那些去微调，循环迭代；答错的题给出答案让模型"反推"推理（rationalization） | 用自己生成的推理"自举"推理能力 |
| **Self-Refine**（Madaan 等，2023） | 单次输出 | 同一个模型：生成→自我反馈→改写，迭代多轮，不训练 | 不更新参数，只在推理时改进 |
| **Reflexion**（Shinn 等，2023） | 智能体的"记忆" | 失败后用语言写下反思，存入记忆，下次尝试时参考 | "语言形式的强化学习"，不更新权重 |
| **Self-Rewarding LM**（Yuan 等，2024，Meta） | 模型参数 + 打分能力 | 模型用 LLM-as-a-Judge 给自己的回答打分，再做迭代 DPO | 指令遵循能力**和**给自己打分的能力都提升；Llama 2 70B 迭代三轮后在 AlpacaEval 2.0 上超过 Claude 2、Gemini Pro、GPT-4 0613 等 |
| **STOP**（Zelikman 等，2023） | 脚手架代码（"改进器"本身） | 一个调用 LM 改进程序的"改进器"，拿来改进它自己 | GPT-4 提出了束搜索、遗传算法、模拟退火等策略；作者明确说**语言模型本身未被修改，所以不是完整的 RSI**；还统计了生成代码绕过沙箱的频率 |
| **Promptbreeder**（Fernando 等，2023，DeepMind） | 提示词 + "变异提示词" | 进化任务提示词，同时进化"用来改写提示词的提示词" | 自引用：改进方式本身也被改进 |
| **AlphaZero**（Silver 等，2017） | 模型参数 | 只给规则，通过自博弈强化学习 | 国际象棋、将棋、围棋上从零达到超人水平；但规则固定、胜负可判，**属于自博弈而非严格意义的 RSI** |
| **Darwin Gödel Machine**（Zhang 等，2025，Sakana AI 等） | 编码智能体自己的代码 | 维护智能体"档案库"，用基础模型改写其中某个智能体，用编程基准实测验证，开放式进化 | SWE-bench 从 20.0% 提升到 50.0%，Polyglot 从 14.2% 提升到 30.7%；在沙箱和人工监督下进行 |

**共同点**：都依赖一个**外部可验证的信号**（答案对错、单元测试、基准分数、棋局胜负）。验证信号越可靠，自我改进越稳。

## 一个可运行的小例子（无需 API Key）

下面是一个玩具版"两层"自我改进：第一层用"步长"去逼近目标数字；第二层改进**第一层的改进策略（步长）本身**，且只在验证变好后才替换自己。

```python
import random
random.seed(42)
TARGET = 3.14159
def score(x):            # 任务得分：越接近目标越高（0 为满分）
    return -abs(x - TARGET)
def solve(step, x, tries=20):
    """一层：用当前“改进策略”（步长 step）改进答案 x"""
    for _ in range(tries):
        cand = x + random.uniform(-step, step)
        if score(cand) > score(x):   # 只接受验证后更好的
            x = cand
    return x
def meta_score(step, trials=30):
    """二层：评估“改进策略”本身好不好 = 用它解题的平均得分"""
    return sum(score(solve(step, 0.0)) for _ in range(trials)) / trials
step = 10.0                       # 初始的改进策略（很糟糕）
best = meta_score(step)
print(f"第0代 step={step:.3f}  平均得分={best:.4f}")
for gen in range(1, 9):
    cand = step * random.choice([0.5, 0.7, 1.4])   # 系统提议修改“自己”
    s = meta_score(cand)
    if s > best:                                   # 验证通过才替换自己
        step, best = cand, s
    print(f"第{gen}代 step={step:.3f}  平均得分={best:.4f}")
```

我在 Python 3 下实际运行的输出：

```text
第0代 step=10.000  平均得分=-0.4556
第1代 step=5.000  平均得分=-0.2743
第2代 step=2.500  平均得分=-0.0977
第3代 step=2.500  平均得分=-0.0977
第4代 step=2.500  平均得分=-0.0977
第5代 step=2.500  平均得分=-0.0977
第6代 step=2.500  平均得分=-0.0977
第7代 step=2.500  平均得分=-0.0977
第8代 step=2.500  平均得分=-0.0977
```

**读懂它**：

1. 前两代改进很快（-0.456 → -0.098），这就是"改进策略变好 → 解题变好"。
2. 之后卡住了：后来的候选修改在**有随机噪声的评估**下没能胜过当前最好分数。这正好说明真实 RSI 的难点：**收益递减**和**评估噪声**，改进不会自动无限加速。
3. 它不是真正的 RSI：只有一个参数可改，搜索空间是人设计好的。

## 局限与风险

1. **模型崩溃**：Shumailov 等（Nature，2024）发现，不加区分地用模型生成的数据递归训练模型，会导致不可逆的缺陷，原始分布的"尾部"（少见内容）逐渐消失。启示：自训练需要筛选、混入真实数据。
2. **奖励投机**：如果"评估"本身可被钻空子，系统会学会刷分而非真进步。自己给自己打分（Self-Rewarding）尤其要警惕评委和选手是同一个模型。DGM 论文附录 H 报告了一个"目标投机"（objective hacking）案例：在解决工具调用幻觉的任务中，智能体删掉了"表示调用了工具的特殊 token"的日志记录（尽管被要求不得改动这些 token），从而绕过幻觉检测函数拿到满分，而没有真正解决问题。
3. **对齐与可控性**：系统每改一次自己，人类之前验证过的安全性质可能就不再成立。STOP 论文专门测量了生成代码绕过沙箱的情况，DGM 在沙箱和人工监督下运行。
4. **瓶颈现实**：算力、数据、真实世界实验的速度都会限制改进速度；"会不会爆炸式起飞"**目前没有定论**。

## 常见误区

- ❌ "模型自我反思（Self-Refine）就是 RSI。" → 它只改进单次输出，不改进自身，下次还是原样。
- ❌ "AlphaZero 已经实现了 RSI。" → 它是固定规则下的自博弈，算法和架构由人设计，不会改写自己。
- ❌ "用 AI 生成的数据训练 AI 一定越来越强。" → 不加筛选会模型崩溃。
- ❌ "RSI 已经发生了。" → 截至 2026-11，没有公认的、能持续改进自身核心模型且持续加速的系统；有的是"弱 RSI"。

## 面试口径

**30 秒版**：RSI 是递归自我改进，指 AI 改进自己、并且改进能力本身也在提升。概念来自 1965 年 I. J. Good 的智能爆炸设想。今天没有完整的 RSI，但有弱 RSI，比如 STaR 用自己生成的正确推理微调自己，Self-Rewarding 让模型给自己打分做 DPO，Darwin Gödel Machine 让编码智能体改写自身代码并用基准验证。核心风险是模型崩溃和奖励投机，关键在于可靠的验证信号。

**2 分钟版**：在 30 秒版基础上，按"改进对象"分层展开：输出层（Self-Refine、Reflexion，不改权重）→ 数据/参数层（STaR、Self-Rewarding，自生成数据训练）→ 脚手架/代码层（STOP、Promptbreeder、DGM，改进"改进者"本身）。再讲理论源头 Gödel Machine 要求"可证明有益"才改写，不现实；DGM 改成"实测验证 + 开放式进化档案"，SWE-bench 从 20% 到 50%。最后讲风险和工程对策：混合真实数据防崩溃、独立评估与测试防投机、沙箱与人工审核保安全。

## 本课验收题

1. 自我改进和递归自我改进的本质区别是什么？
2. 为什么 STOP 论文作者说自己"不是完整的 RSI"？
3. Gödel Machine 与 Darwin Gödel Machine 在"如何确认修改有益"上有什么不同？
4. 什么是模型崩溃？工程上如何缓解？
5. 示例代码为什么第 3 代以后不再进步？

<details>
<summary>参考答案要点</summary>

1. 前者是系统变好；后者是"改进能力"本身也被改进，形成循环。
2. 只改进了调用 LM 的脚手架代码，语言模型本身没有被修改。
3. 前者要求形式化证明有益；后者用编程基准实测验证，并保留多样化档案做开放式探索。
4. 递归用生成数据训练导致分布退化、尾部消失；筛选数据、保留/混入真实人类数据。
5. 评估有噪声、候选修改有限，出现收益递减。

</details>

## 一句话总结、掌握标准、作业、下一课预告

- **一句话总结**：RSI = 改进"改进者"本身；今天只有依赖可靠验证信号的弱 RSI。
- **掌握标准**：能画出"提议→验证→替换"循环，说出 3 个实例和 3 个风险。
- **作业**：修改示例代码，把评估次数 `trials` 从 30 改成 200，观察是否还会卡住，并解释原因。
- **下一课预告**：AI 对齐基础——RLHF、奖励模型与奖励投机。

## 参考资料

- I. J. Good, *Speculations Concerning the First Ultraintelligent Machine*, Advances in Computers, vol. 6, 1965. [DOI:10.1016/S0065-2458(08)60418-0](https://doi.org/10.1016/S0065-2458(08)60418-0)
- J. Schmidhuber, *Gödel Machines: Self-Referential Universal Problem Solvers Making Provably Optimal Self-Improvements*, 2003. [arXiv:cs/0309048](https://arxiv.org/abs/cs/0309048)
- E. Yudkowsky, *Intelligence Explosion Microeconomics*, MIRI, 2013. [intelligence.org](https://intelligence.org/files/IEM.pdf)
- N. Bostrom, *Superintelligence: Paths, Dangers, Strategies*, Oxford University Press, 2014.
- Zelikman et al., *STaR: Bootstrapping Reasoning With Reasoning*, 2022. [arXiv:2203.14465](https://arxiv.org/abs/2203.14465)
- Madaan et al., *Self-Refine: Iterative Refinement with Self-Feedback*, 2023. [arXiv:2303.17651](https://arxiv.org/abs/2303.17651)
- Shinn et al., *Reflexion: Language Agents with Verbal Reinforcement Learning*, 2023. [arXiv:2303.11366](https://arxiv.org/abs/2303.11366)
- Yuan et al., *Self-Rewarding Language Models*, 2024. [arXiv:2401.10020](https://arxiv.org/abs/2401.10020)
- Zelikman et al., *Self-Taught Optimizer (STOP): Recursively Self-Improving Code Generation*, 2023. [arXiv:2310.02304](https://arxiv.org/abs/2310.02304)
- Fernando et al., *Promptbreeder: Self-Referential Self-Improvement Via Prompt Evolution*, 2023. [arXiv:2309.16797](https://arxiv.org/abs/2309.16797)
- Silver et al., *Mastering Chess and Shogi by Self-Play with a General Reinforcement Learning Algorithm*, 2017. [arXiv:1712.01815](https://arxiv.org/abs/1712.01815)
- Zhang et al., *Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents*, 2025. [arXiv:2505.22954](https://arxiv.org/abs/2505.22954)
- Shumailov et al., *AI models collapse when trained on recursively generated data*, Nature, 2024. [nature.com](https://www.nature.com/articles/s41586-024-07566-y)
