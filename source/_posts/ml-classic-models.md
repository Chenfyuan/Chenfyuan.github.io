---
title: 经典机器学习模型：线性回归、逻辑回归、决策树、随机森林与 GBDT/XGBoost
date: 2026-10-29 15:10:00
categories:
  - 机器学习基础
tags:
  - 线性回归
  - 逻辑回归
  - 决策树
  - 随机森林
  - XGBoost
  - 面试
mathjax: true
---

**一句话理解**：线性模型用“加权求和”做预测，简单、可解释；决策树用“一连串 if-else”做预测；随机森林是**很多棵树投票**（Bagging）；GBDT/XGBoost 是**一棵接一棵地修正前面的错误**（Boosting）。在表格类数据上，树的集成模型通常是很强的基线。

<!-- more -->

## 通俗类比

- **线性回归**：估房价 = 面积 × 单价 + 地段加分 + ……，每个因素一个“权重”。
- **逻辑回归**：先算一个分数，再用 S 形函数压成 0~1 的概率，比如“这封邮件是垃圾邮件的概率”。
- **决策树**：像医生问诊，“发烧吗？→ 咳嗽吗？→ ……”，一路问到结论。
- **随机森林**：找 100 个各看一部分资料的医生，最后少数服从多数。
- **GBDT**：第一个医生先诊断，第二个医生专门纠正第一个的错误，第三个再纠正剩下的错误……

## 核心原理

### 1. 线性回归

模型与损失（最小二乘）：

<div>
$$\hat y = w^\top x + b,\qquad \min_{w,b}\ \frac{1}{n}\sum_{i=1}^{n}(y_i-\hat y_i)^2$$
</div>

- 有闭式解（正规方程）$w=(X^\top X)^{-1}X^\top y$（$X^\top X$ 可逆时），数据大时也常用梯度下降。
- 加 L2 就是**岭回归**（Ridge），加 L1 就是 **Lasso**（scikit-learn 线性模型文档）。
- 特征之间高度相关（多重共线性）时，系数会不稳定，Ridge 能缓解。
- 可解释：在其他特征不变时，$w_j$ 表示特征 $j$ 增加 1 个单位、预测值的变化量。

### 2. 逻辑回归

名字带“回归”，实际是**分类**模型。先算线性分数 $z=w^\top x+b$，再用 sigmoid 变成概率：

<div>
$$P(y=1\mid x)=\sigma(z)=\frac{1}{1+e^{-z}}$$
</div>

损失函数是**交叉熵**（对数损失），等价于最大似然估计：

<div>
$$L=-\frac{1}{n}\sum_{i=1}^{n}\Big[y_i\log p_i+(1-y_i)\log(1-p_i)\Big]$$
</div>

- 为什么不用平方损失？配合 sigmoid 时平方损失对参数非凸，交叉熵是凸的，梯度形式也简单（$\partial L/\partial z = p-y$）。
- 决策边界 $w^\top x+b=0$ 是线性的；想要非线性边界需要做特征工程（如多项式特征）。
- 多分类可以用 softmax（多项逻辑回归）或一对多。
- scikit-learn 的 `LogisticRegression` **默认带 L2 正则**，强度由 `C` 控制（`C` 越小正则越强）。

### 3. 决策树

从根节点开始，每次选一个“最能把数据分干净”的特征和阈值切一刀，递归下去。scikit-learn 实现的是优化版 CART 算法（二叉树）。

衡量“分得干不干净”的指标（分类）：

<div>
$$\text{Gini}=1-\sum_{k}p_k^2,\qquad \text{Entropy}=-\sum_k p_k\log p_k$$
</div>

$p_k$ 是节点中第 $k$ 类样本的比例。回归树常用均方误差。

- 优点：可解释、不需要特征缩放、能处理非线性和特征交互。
- 缺点：**很容易过拟合**、方差大（数据稍变树结构就可能大变）。
- 控制过拟合：限制 `max_depth`、`min_samples_leaf`，或剪枝（scikit-learn 提供代价复杂度剪枝 `ccp_alpha`）。

### 4. 随机森林（Bagging）

随机森林由 Breiman 提出（2001），scikit-learn 集成文档的描述是：

1. 每棵树用**有放回抽样**（bootstrap）得到的数据训练；
2. 每次分裂时只在**随机选出的一部分特征**里找最优切分；
3. 分类取平均概率/投票，回归取平均。

两种随机性让树之间相关性降低，**平均后方差下降**，所以比单棵树稳。它主要降低方差，对偏差帮助不大。

- 树之间相互独立，**可以并行训练**。
- 没被抽到的样本（袋外样本，OOB）可以用来估计泛化误差（`oob_score=True`）。

### 5. GBDT 与 XGBoost（Boosting）

**梯度提升**（Friedman 2001）是加法模型，一棵一棵地加树：

<div>
$$F_m(x)=F_{m-1}(x)+\eta\, h_m(x)$$
</div>

第 $m$ 棵树 $h_m$ 去拟合当前损失对预测值的**负梯度**（平方损失时就是残差 $y-F_{m-1}(x)$），$\eta$ 是学习率（shrinkage）。它主要降低**偏差**；树必须**串行**训练。

**XGBoost**（Chen & Guestrin, KDD 2016）在梯度提升基础上的关键点（来自论文）：

- **带正则的目标函数**：$\mathcal{L}=\sum_i l(\hat y_i,y_i)+\sum_k\Omega(f_k)$，其中 $\Omega(f)=\gamma T+\frac12\lambda\|w\|^2$，$T$ 是叶子数，$w$ 是叶子分数；
- **二阶泰勒展开**：同时用一阶梯度 $g_i$ 和二阶导 $h_i$，叶子最优权重为

<div>
$$w_j^*=-\frac{\sum_{i\in I_j}g_i}{\sum_{i\in I_j}h_i+\lambda}$$
</div>

- **分裂增益**公式中自带 $-\gamma$，增益不够就不分裂；
- **shrinkage 和列采样**（借鉴随机森林）防过拟合；
- **稀疏感知**：为缺失值学习一个默认分裂方向，能直接处理缺失值；
- 系统层面：加权分位数草图做近似分裂、列块结构支持并行找分裂点、缓存感知和核外计算。

注意：XGBoost 的“并行”是**单棵树内部找分裂点时的并行**，树与树之间仍是串行的。

LightGBM、CatBoost 也是常用的梯度提升实现，各有优化点，本文不展开。

### 6. 对比与适用场景

| 模型 | 主要降低 | 可解释性 | 是否需要特征缩放 | 典型适用场景 |
| --- | --- | --- | --- | --- |
| 线性/逻辑回归 | — | 高 | 通常需要（尤其带正则时） | 基线、需要解释、特征多且近似线性、风控评分卡 |
| 决策树 | — | 高 | 不需要 | 需要规则化解释、教学 |
| 随机森林 | 方差 | 中 | 不需要 | 稳健基线、调参少 |
| GBDT/XGBoost | 偏差（也有正则控制方差） | 中低 | 不需要 | 表格数据上的高精度任务、竞赛、CTR 预估等 |

经验之谈（**常见做法，不是定理**）：表格数据先用逻辑回归和树模型做基线；图像、语音、文本等非结构化数据通常用深度学习。

## 小例子：同一数据集上比较四种模型

本机用 scikit-learn 1.9.1 实际运行：

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

X, y = load_breast_cancer(return_X_y=True)
models = {
    "逻辑回归": make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)),
    "决策树": DecisionTreeClassifier(random_state=0),
    "随机森林": RandomForestClassifier(n_estimators=200, random_state=0),
    "GBDT": GradientBoostingClassifier(random_state=0),
}
for name, m in models.items():
    s = cross_val_score(m, X, y, cv=5)
    print(f"{name}: 5 折平均准确率 {s.mean():.3f}")
```

本机输出：

```
逻辑回归: 5 折平均准确率 0.981
决策树: 5 折平均准确率 0.917
随机森林: 5 折平均准确率 0.960
GBDT: 5 折平均准确率 0.963
```

怎么读：单棵树最差，集成之后明显变好，符合“集成降低方差”的直觉。但在这个小而接近线性可分的数据集上，**简单的逻辑回归反而最好**——这正说明“没有在所有问题上都最好的模型”，必须在自己的数据上用交叉验证比较。

## 常见误区

1. **“逻辑回归是回归模型”**：它是分类模型，输出的是类别概率。
2. **“随机森林和 GBDT 都是并行训练的”**：随机森林的树可以并行；GBDT 的树必须串行，XGBoost 并行的是单棵树内的分裂查找。
3. **“树越多 GBDT 一定越好”**：Boosting 树太多会过拟合，要配合学习率和早停；随机森林增加树数一般不会明显过拟合，但收益递减。
4. **“树模型也必须标准化特征”**：树的分裂只看大小顺序，对单调缩放不敏感，不需要标准化。
5. **“特征重要性就是因果关系”**：基于不纯度的重要性对高基数特征有偏，也不代表因果，scikit-learn 文档建议同时参考置换重要性（permutation importance）。
6. **“XGBoost 一定比深度学习好”**：只能说在许多表格数据任务上它是很强的基线，需要具体比较。

## 面试口径

**30 秒版**：线性回归最小化平方误差，逻辑回归用 sigmoid 输出概率、用交叉熵训练，是线性分类器。决策树按基尼或信息熵贪心分裂，可解释但易过拟合。随机森林通过 bootstrap 和特征随机做 Bagging，主要降方差，可并行；GBDT 用新树拟合负梯度做 Boosting，主要降偏差，串行训练。XGBoost 在 GBDT 上加了正则化目标、二阶展开、缺失值默认方向和系统级优化。

**2 分钟版**：先讲线性模型：可解释、有闭式解，配合 L1/L2；逻辑回归交叉熵是凸的、梯度是 p−y。再讲树：CART 二叉分裂，用 max_depth、min_samples_leaf、剪枝控过拟合。然后讲集成的两条路线：Bagging（随机森林）通过降低树间相关性后平均来降方差，OOB 可估泛化误差；Boosting（GBDT）每轮拟合负梯度、用学习率收缩，降偏差但要防过拟合。最后讲 XGBoost 的四个点：目标函数含 γT 和 λ‖w‖²；二阶泰勒展开得到叶子权重 −G/(H+λ) 和分裂增益；shrinkage 和列采样；稀疏感知和并行分裂查找。选型上：要可解释选线性模型，要稳健基线选随机森林，追求表格数据精度选梯度提升，都要靠交叉验证决定。

## 面试高频问答

**Q1：逻辑回归为什么用交叉熵而不用均方误差？**
交叉熵来自最大似然；配合 sigmoid 时它对参数是凸的，梯度为 $(p-y)x$，不会因 sigmoid 饱和而梯度很小。均方误差配 sigmoid 是非凸的，饱和区梯度小，训练慢。

**Q2：逻辑回归能处理非线性问题吗？**
模型本身的决策边界是线性的。可以通过特征工程（多项式特征、分箱、交叉特征）让它在原空间表达非线性边界。

**Q3：基尼系数和信息熵有什么区别？**
都衡量节点不纯度，纯节点时都为 0。基尼不需要算对数，计算稍快；实践中两者结果通常相近。

**Q4：随机森林的“随机”体现在哪？为什么能降低方差？**
样本随机（bootstrap）和特征随机（每次分裂只看部分特征）。多棵相关性较低的树取平均，方差会下降，而偏差基本不变。

**Q5：Bagging 和 Boosting 的区别？**
Bagging 并行训练多个独立的模型再平均，主要降方差；Boosting 串行训练，每个新模型关注之前的错误，主要降偏差。代表分别是随机森林和 GBDT。

**Q6：GBDT 中每棵树拟合的是什么？**
当前模型损失函数对预测值的负梯度。平方损失下负梯度就是残差。

**Q7：XGBoost 相比传统 GBDT 有哪些改进？**
目标函数加入叶子数和叶子权重的正则；用二阶泰勒展开，叶子权重和分裂增益有解析式；支持 shrinkage 和列采样；稀疏感知算法为缺失值学默认方向；加权分位数草图做近似分裂；列块结构支持并行、缓存优化和核外计算。

**Q8：XGBoost 如何处理缺失值？**
分裂时只用非缺失样本找切分点，同时分别尝试把缺失样本都放左边和都放右边，选增益更大的方向作为该节点的默认方向。

## 自测题

1. 线性回归的正规方程解是什么？什么时候不能直接用？
2. 为什么树模型不需要特征标准化？
3. 随机森林里加更多树和 GBDT 里加更多树，过拟合风险有什么区别？
4. XGBoost 的叶子最优权重公式里 $\lambda$ 起什么作用？
5. 一个风控场景要求能向监管解释每个特征的影响，你会首选什么模型？

<details>
<summary>参考答案要点</summary>

1. $w=(X^\top X)^{-1}X^\top y$；当 $X^\top X$ 不可逆（如特征共线、特征数多于样本数）或数据量极大时，不宜直接求逆，可用正则化（Ridge）或梯度下降。
2. 分裂只依赖特征值的排序和阈值，单调缩放不改变排序，所以不影响分裂结果。
3. 随机森林加树主要是让平均更稳定，一般不会明显过拟合；GBDT 每棵树都在继续拟合训练误差，树太多会过拟合，需要学习率和早停。
4. 它在分母中，使叶子权重向 0 收缩，相当于对叶子分数做 L2 正则，防止过拟合。
5. 常见选择是逻辑回归（如评分卡），系数可直接解释；具体还要结合业务和监管要求。

</details>

## 参考资料

- scikit-learn 文档：Linear Models. [链接](https://scikit-learn.org/stable/modules/linear_model.html)
- scikit-learn 文档：Decision Trees. [链接](https://scikit-learn.org/stable/modules/tree.html)
- scikit-learn 文档：Ensembles（随机森林、梯度提升、特征重要性）. [链接](https://scikit-learn.org/stable/modules/ensemble.html)
- scikit-learn API：LogisticRegression. [链接](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html)
- Chen & Guestrin, *XGBoost: A Scalable Tree Boosting System*, KDD 2016. [arXiv:1603.02754](https://arxiv.org/abs/1603.02754)
