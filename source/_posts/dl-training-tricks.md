---
title: 深度学习训练技巧：优化器、学习率、归一化、Dropout、初始化与 CNN/RNN 思想
date: 2026-10-29 15:40:00
categories:
  - 机器学习基础
tags:
  - Adam
  - BatchNorm
  - Dropout
  - 权重初始化
  - CNN
  - RNN
  - 面试
mathjax: true
---

**一句话理解**：会算梯度还不够，还得会**稳稳地更新参数**。优化器决定“怎么走”，学习率决定“步子多大”，归一化和初始化让网络别一训练就崩，Dropout 用来防过拟合。CNN 用卷积抓局部空间模式，RNN 用循环抓序列依赖——这是理解 Transformer 之前的两块底座。

<!-- more -->

## 通俗类比

下山找最低点：

- **SGD**：每步看一眼脚下坡度，走一小步——方向对，但遇到狭长山谷会左右震荡；
- **Momentum**：带着惯性，震荡会被平均掉，沿长廊方向冲得更顺；
- **Adam**：给每个参数一本“个性计步器”——陡的方向步子自动缩小，平的方向步子放大；
- **学习率调度**：开始步子大（快速下降），临近终点步子小（精细调整）；
- **BatchNorm/LayerNorm**：每隔几步把大家的体力（激活分布）重新对齐，别有人飘到极端；
- **Dropout**：训练时随机让部分员工请假，逼着团队不能依赖某几个明星员工。

## 核心原理

### 1. SGD、Momentum、Adam、AdamW

记梯度 $g_t=\nabla_\theta L_t(\theta_{t-1})$，学习率 $\alpha$。

**SGD**：

<div>
$$\theta_t=\theta_{t-1}-\alpha\, g_t$$
</div>

**Momentum**（带动量的 SGD）：用速度 $v$ 累积梯度

<div>
$$v_t=\beta v_{t-1}+g_t,\qquad \theta_t=\theta_{t-1}-\alpha\, v_t$$
</div>

（也有把 $\alpha$ 乘在梯度上再累积的写法，本质类似。）

**Adam**（Kingma & Ba, arXiv:1412.6980）：同时维护一阶矩 $m$（动量）和二阶矩 $v$（梯度平方的指数滑动平均），并做偏差修正：

<div>
$$\begin{aligned}
m_t&=\beta_1 m_{t-1}+(1-\beta_1)g_t,\quad
v_t=\beta_2 v_{t-1}+(1-\beta_2)g_t^2\\
\hat m_t&=\frac{m_t}{1-\beta_1^t},\quad
\hat v_t=\frac{v_t}{1-\beta_2^t}\\
\theta_t&=\theta_{t-1}-\alpha\frac{\hat m_t}{\sqrt{\hat v_t}+\epsilon}
\end{aligned}$$
</div>

PyTorch 文档中的默认超参：$\beta_1=0.9$，$\beta_2=0.999$，$\epsilon=10^{-8}$。这些是论文和框架的默认值，不保证对每个任务最优。

**AdamW**（Loshchilov & Hutter, arXiv:1711.05101）：论文指出，对 Adam 这类自适应算法，**L2 正则 ≠ 权重衰减**。Adam 里把 $\lambda\theta$ 加进梯度后，会被二阶矩缩放，大梯度维度反而衰减得少。AdamW 把权重衰减从自适应更新里**解耦**出来：

<div>
$$\theta_t\leftarrow\theta_{t-1}-\alpha\Big(\frac{\hat m_t}{\sqrt{\hat v_t}+\epsilon}+\lambda\theta_{t-1}\Big)$$
</div>

PyTorch 的 `AdamW` 默认 `weight_decay=1e-2`；而 `Adam` 的 `weight_decay` 实现的是耦合进梯度的 L2 惩罚。大模型微调里更常见 AdamW。

### 2. 学习率调度

学习率是最敏感的超参之一（**常见做法，没有唯一最优**）：

- **Warmup**：前若干步从很小慢慢升到目标值，避免初期大梯度把训练打崩；
- **Step / MultiStep**：到固定 epoch 乘以衰减系数；
- **Cosine Annealing**：按余弦曲线降到接近 0；
- **ReduceLROnPlateau**：验证指标长期不升就降学习率。

经验：宁可先把学习率调对，再细抠别的。

### 3. BatchNorm 与 LayerNorm

**Batch Normalization**（Ioffe & Szegedy, arXiv:1502.03167）：对每个特征，在**一个 mini-batch 的样本维**上算均值方差，再归一化，并乘以可学习的 $\gamma$、加上 $\beta$：

<div>
$$\hat x_i=\frac{x_i-\mu_\mathcal{B}}{\sqrt{\sigma_\mathcal{B}^2+\epsilon}},\qquad y_i=\gamma\hat x_i+\beta$$
</div>

论文动机是减轻 **internal covariate shift**（训练中层输入分布不断漂移）。效果上：可用更大学习率、对初始化更不敏感，有时还能减少对 Dropout 的依赖。训练时用 batch 统计；推理时用运行中累积的全局均值方差（PyTorch `BatchNorm2d` 默认 `momentum=0.1` 做滑动平均）。

**Layer Normalization**（Ba et al., arXiv:1607.06450）：对**单个样本、在特征维**上算均值方差。与 batch 大小无关，训练和推理计算一致，天然适合 RNN 和 Transformer（序列长度/batch 变化大的场景）。

| | BatchNorm | LayerNorm |
| --- | --- | --- |
| 统计范围 | 同一特征跨样本 | 同一样本跨特征 |
| 依赖 batch 大小 | 是（batch 太小不稳定） | 否 |
| 常见位置 | CNN | RNN、Transformer |

### 4. Dropout

Dropout（Srivastava et al., JMLR 2014）：训练时以概率 $p$ 随机把神经元置 0，减轻共适应（co-adaptation），相当于隐式集成很多子网络。

PyTorch 的实现是 **inverted dropout**：训练时不仅置 0，还把留下的激活乘以 $1/(1-p)$，使期望不变；**推理时不做任何事**（恒等映射）。所以不要在推理时手动再乘 $(1-p)$。

### 5. 权重初始化

初始化太大会导致激活/梯度爆炸，太小会导致消失。

- **Xavier / Glorot**（Glorot & Bengio, 2010）：针对 sigmoid/tanh 等，方差与 `fan_in + fan_out` 相关。PyTorch `xavier_uniform_`：采样自 $\mathcal{U}(-a,a)$，$a=\mathrm{gain}\sqrt{6/(\mathrm{fan\_in}+\mathrm{fan\_out})}$。
- **He / Kaiming**（He et al., arXiv:1502.01852）：针对 ReLU，补偿一半神经元被置零。PyTorch `kaiming_normal_`：$\mathrm{std}=\mathrm{gain}/\sqrt{\mathrm{fan\_mode}}$。

经验法则：隐层用 ReLU → He；用 tanh/sigmoid → Xavier。现代框架对常见层常有合理默认，但自己写新模块时仍要留意。

### 6. CNN 与 RNN 的基本思想

**CNN（卷积神经网络）**：

- **局部连接 + 权值共享**：一个卷积核在图上滑动，提取同一种局部模式（边缘、纹理……），参数量远小于全连接；
- **多层堆叠**：低层抓边缘，高层抓部件和物体；
- **池化**（可选）：降空间分辨率，增大感受野。

**RNN（循环神经网络）**：

- 每一步共享同一组参数：$h_t=f(h_{t-1},x_t)$，把历史压缩进隐藏状态；
- 朴素 RNN 在长序列上易梯度消失/爆炸；
- **LSTM / GRU** 用门控（遗忘门、输入门等）有选择地记忆和遗忘，缓解长程依赖问题。

今天的大语言模型主流是 Transformer，但 CNN/RNN 的思想（局部性、权值共享、门控记忆）仍常考，也出现在混合架构里。

## 小例子：优化器对比、BN vs LN、Dropout 缩放

本机用 NumPy 实际运行：

```python
import numpy as np

# 狭长山谷 f=0.5*(x^2+50*y^2) 上比较优化器
def grad(w): return np.array([w[0], 50*w[1]])
def f(w): return 0.5*(w[0]**2 + 50*w[1]**2)

def run(name, steps=100):
    w = np.array([10.0, 1.0]); v = np.zeros(2); m = np.zeros(2); s = np.zeros(2)
    for t in range(1, steps+1):
        g = grad(w)
        if name == "SGD":
            w = w - 0.03*g
        elif name == "Momentum":
            v = 0.9*v + g; w = w - 0.03*v
        elif name == "Adam":
            b1, b2, eps, lr = 0.9, 0.999, 1e-8, 0.3
            m = b1*m + (1-b1)*g; s = b2*s + (1-b2)*g*g
            mh = m/(1-b1**t); sh = s/(1-b2**t)
            w = w - lr*mh/(np.sqrt(sh)+eps)
    return f(w)
for n in ["SGD", "Momentum", "Adam"]:
    print(f"{n:9s} 100 步后 loss = {run(n):.6f}")

x = np.random.RandomState(0).randn(4, 3) * 5 + 2
bn = (x - x.mean(0)) / np.sqrt(x.var(0) + 1e-5)
ln = (x - x.mean(1, keepdims=True)) / np.sqrt(x.var(1, keepdims=True) + 1e-5)
print("BN 后每列均值:", bn.mean(0).round(6), " LN 后每行均值:", ln.mean(1).round(6))

p = 0.5; a = np.ones(100000)
mask = (np.random.RandomState(1).rand(a.size) > p)
print("Dropout 后均值约等于原均值:", round((a*mask/(1-p)).mean(), 3))
```

本机输出：

```
SGD       100 步后 loss = 0.113062
Momentum  100 步后 loss = 0.000338
Adam      100 步后 loss = 0.001384
BN 后每列均值: [ 0.  0. -0.]  LN 后每行均值: [-0.  0. -0.  0.]
Dropout 后均值约等于原均值: 1.0
```

怎么读：同一山谷里，Momentum 和 Adam 明显比朴素 SGD 降得快（具体数值依赖学习率，这里只说明机制差异）。BN 让**每列（特征）**均值为 0，LN 让**每行（样本）**均值为 0——这就是两者统计维度的区别。Inverted Dropout 乘 $1/(1-p)$ 后期望保持为 1。

## 常见误区

1. **“Adam 的 weight_decay 就是权重衰减”**：在 `torch.optim.Adam` 里它是 L2 惩罚；真正解耦的权重衰减用 `AdamW`。
2. **“BatchNorm 在 batch_size=1 时也能正常训”**：单样本无法估计有意义的 batch 方差，训练会不稳定；这时更该用 LayerNorm / GroupNorm。
3. **“推理时也要做 Dropout”**：PyTorch 的 Dropout 在 `eval()` 下是恒等；训练时已用 $1/(1-p)$ 补过期望。
4. **“学习率固定最好”**：多数任务会从调度中获益；是否 warmup、怎么衰减属于要调的部分。
5. **“CNN 只能用于图像”**：一维卷积常用于序列/语音；关键是局部相关 + 权值共享。
6. **“RNN 已经完全过时”**：主流大模型是 Transformer，但 RNN/LSTM 思想仍常考，边缘端和小模型里也还有应用。

## 面试口径

**30 秒版**：SGD 每步按梯度走；Momentum 加惯性减少震荡；Adam 用一、二阶矩自适应每维学习率，默认 β=(0.9, 0.999)。AdamW 把权重衰减从自适应更新里解耦，常用于大模型。BatchNorm 跨样本归一化，LayerNorm 跨特征归一化。Dropout 训练时随机置零并用 1/(1−p) 缩放。ReLU 网络用 He 初始化，tanh 用 Xavier。CNN 靠卷积抓局部模式，RNN 靠循环状态建模序列。

**2 分钟版**：先写清 Adam 的 $m,v$ 更新和偏差修正，说明它为何对稀疏梯度友好。再对比 Adam 与 AdamW：论文证明自适应算法下 L2 ≠ weight decay，解耦后泛化更好。接着讲 BN 的训练/推理统计差异和 LN 不依赖 batch 的优势。然后讲 Dropout 的 inverted 实现和初始化的 fan_in/fan_out 直觉。最后用一分钟点 CNN（局部连接、权值共享、层次特征）和 RNN/LSTM（隐藏状态、门控缓解长程依赖），作为通向 Transformer 的铺垫。

## 面试高频问答

**Q1：Adam 和 SGD+Momentum 的核心区别？**
Momentum 只维护一阶动量，全局一个学习率；Adam 额外维护梯度平方的滑动平均，对每个参数自适应缩放学习率，并做偏差修正。

**Q2：为什么需要 AdamW？**
在 Adam 中加入 L2 项会被二阶矩缩放，导致衰减力度与梯度历史耦合。AdamW 将权重衰减独立出来，衰减率与自适应更新解耦，论文显示往往泛化更好。

**Q3：BatchNorm 和 LayerNorm 的区别？什么时候用哪个？**
BN 对每个通道在 batch 维归一化，依赖 batch 大小，CNN 常用；LN 对每个样本在特征维归一化，与 batch 无关，RNN/Transformer 常用。

**Q4：Dropout 在训练和推理时有什么不同？**
训练时按概率 $p$ 置零，并对保留值乘 $1/(1-p)$；推理时关闭 Dropout，直接全量前向。这是 PyTorch 的 inverted dropout。

**Q5：什么是学习率 Warmup？为什么有用？**
训练初期学习率从很小逐步升到目标值。初期参数随机、梯度噪声大，直接用大学习率容易不稳定；Warmup 是常见的稳定技巧。

**Q6：Xavier 和 He 初始化分别适用什么激活？**
Xavier/Glorot 假设激活大致关于 0 对称（sigmoid/tanh）；He/Kaiming 针对 ReLU（一半激活被置零），用更大的方差补偿。

**Q7：CNN 相比全连接处理图像的优势？**
局部连接和权值共享大幅减少参数；平移一个局部模式可以用同一个核检测；多层形成从边缘到物体的层次表示。

**Q8：LSTM 如何缓解普通 RNN 的梯度消失？**
引入细胞状态和门控（遗忘门、输入门、输出门），让信息可以沿时间步近似恒等地传递，梯度更易流过长距离。

## 自测题

1. 写出 Adam 中偏差修正 $\hat m_t=m_t/(1-\beta_1^t)$ 的直观原因。
2. BatchNorm 在推理时用的均值方差从哪来？
3. PyTorch Dropout(p=0.5) 训练时保留的激活要乘多少？
4. 为什么 batch_size 很小时 BatchNorm 效果可能变差？
5. 卷积核大小为 $3\times 3$、输入 3 通道、输出 64 通道，不计偏置，有多少参数？

<details>
<summary>参考答案要点</summary>

1. $m_0=0$，训练初期 $m_t$ 被 $\beta_1$ 拉向 0，偏差修正把它放大回来，使早期估计更接近真实期望。
2. 来自训练过程中滑动平均（running mean/var）累积的全局统计，推理时冻结使用。
3. 乘 $1/(1-0.5)=2$。
4. batch 内统计噪声大，归一化不稳定；此时可改用 LayerNorm、GroupNorm，或同步 BN 等。
5. $3\times 3\times 3\times 64=1728$。

</details>

## 参考资料

- Kingma & Ba, *Adam: A Method for Stochastic Optimization*, 2014. [arXiv:1412.6980](https://arxiv.org/abs/1412.6980)
- Loshchilov & Hutter, *Decoupled Weight Decay Regularization*, 2017. [arXiv:1711.05101](https://arxiv.org/abs/1711.05101)
- Ioffe & Szegedy, *Batch Normalization*, 2015. [arXiv:1502.03167](https://arxiv.org/abs/1502.03167)
- Ba, Kiros, Hinton, *Layer Normalization*, 2016. [arXiv:1607.06450](https://arxiv.org/abs/1607.06450)
- Srivastava et al., *Dropout*, JMLR 2014. [jmlr.org](https://www.jmlr.org/papers/v15/srivastava14a.html)
- He et al., *Delving Deep into Rectifiers*, 2015. [arXiv:1502.01852](https://arxiv.org/abs/1502.01852)
- Glorot & Bengio, *Understanding the difficulty of training deep feedforward neural networks*, AISTATS 2010. [proceedings.mlr.press](https://proceedings.mlr.press/v9/glorot10a.html)
- PyTorch 文档：Adam / AdamW / BatchNorm2d / Dropout / nn.init. [Adam](https://docs.pytorch.org/docs/stable/generated/torch.optim.Adam.html) · [AdamW](https://docs.pytorch.org/docs/stable/generated/torch.optim.AdamW.html) · [BatchNorm2d](https://docs.pytorch.org/docs/stable/generated/torch.nn.BatchNorm2d.html) · [Dropout](https://docs.pytorch.org/docs/stable/generated/torch.nn.Dropout.html) · [nn.init](https://docs.pytorch.org/docs/stable/nn.init.html)
- Goodfellow et al., *Deep Learning*（在线版）. [deeplearningbook.org](https://www.deeplearningbook.org/)
