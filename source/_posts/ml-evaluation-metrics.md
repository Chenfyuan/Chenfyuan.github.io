---
title: 模型评估指标：混淆矩阵、精确率/召回率/F1、ROC-AUC、PR 曲线与类别不平衡
date: 2026-10-29 15:20:00
categories:
  - 机器学习基础
tags:
  - 评估指标
  - ROC
  - F1
  - 类别不平衡
  - 面试
mathjax: true
---

**一句话理解**：选对指标，比选对模型还重要。准确率在类别不平衡时会骗人；精确率和召回率要一起看；ROC-AUC 看排序能力，PR 曲线在正类很少时更敏感。评估指标必须和业务代价对齐。

<!-- more -->

## 通俗类比

医院做癌症筛查：

- **假阴性（漏诊）**：真有病却说没病 → 可能耽误治疗；
- **假阳性（误诊）**：没病却说有病 → 带来惊吓和多余检查。

“准确率 99%”听起来很好，但如果只有 1% 的人患病，一个“永远说没病”的模型也能拿到 99% 准确率——它一个病人也找不出来。所以必须拆开看：找到了多少真病人（召回率）、报阳里有多少是真的（精确率）。

## 核心原理

### 1. 混淆矩阵

二分类里，预测与真实的四种组合：

|  | 预测为正 | 预测为负 |
| --- | --- | --- |
| **真实为正** | TP（真正例） | FN（假负例） |
| **真实为负** | FP（假正例） | TN（真负例） |

所有分类指标都可以从这四个数字推出来。scikit-learn 的 `confusion_matrix` 默认把行当作真实标签、列当作预测标签。

### 2. 准确率、精确率、召回率、F1

<div>
$$\text{Accuracy}=\frac{TP+TN}{TP+TN+FP+FN}$$
</div>

<div>
$$\text{Precision}=\frac{TP}{TP+FP},\qquad \text{Recall}=\frac{TP}{TP+FN}$$
</div>

<div>
$$F_1=2\cdot\frac{\text{Precision}\cdot\text{Recall}}{\text{Precision}+\text{Recall}}$$
</div>

- **精确率（Precision）**：预测为正的里面，有多少真是正的。“报阳有多准”。
- **召回率（Recall，也叫灵敏度 Sensitivity）**：真实为正的里面，有多少被找出来了。“漏诊率有多低”。
- **F1**：精确率和召回率的调和平均。只有两者都高时 F1 才高；其中一个很低，F1 也会被拉下来。
- **特异度 Specificity** $=TN/(TN+FP)$：负类中被正确判为负的比例。

精确率和召回率通常此消彼长：把分类阈值调低，召回率上升、精确率下降；调高则相反。阈值要按业务代价选，不是固定 0.5。

### 3. ROC 曲线与 AUC

模型通常输出一个概率分数。把阈值从 1 扫到 0，对每个阈值算：

- **TPR（真正例率）** = Recall = $TP/(TP+FN)$
- **FPR（假正例率）** = $FP/(FP+TN)$

以 FPR 为横轴、TPR 为纵轴画出来就是 **ROC 曲线**。曲线下面积叫 **AUC（Area Under the Curve）**。

直观含义（scikit-learn 评估文档中的解释）：AUC 等于“随机抽一个正样本和一个负样本，模型给正样本的分数更高”的概率。

- AUC = 0.5：和随机猜差不多；
- AUC = 1：完美排序；
- 它只关心**排序质量**，不依赖某一个具体阈值。

### 4. PR 曲线与 Average Precision

以召回率为横轴、精确率为纵轴，就是 **PR（Precision-Recall）曲线**。曲线下面积常记为 **AP（Average Precision）**。

**什么时候更该看 PR？** 正类很少时，ROC 的横轴 FPR 里分母是大量负样本，$FP$ 变多也不容易把 FPR 拉高，ROC 看起来“还不错”；PR 的精确率直接吃 $FP$，对假阳性更敏感。scikit-learn 文档明确建议：在类别不平衡时优先看精确率、召回率、F1 和 PR 曲线。

### 5. 回归指标

| 指标 | 公式要点 | 特点 |
| --- | --- | --- |
| MAE | 平均绝对误差 | 对异常值相对稳健，单位与目标一致 |
| MSE | 平均平方误差 | 对大误差更敏感 |
| RMSE | MSE 开方 | 单位与目标一致，仍放大异常值 |
| $R^2$ | $1-\frac{SS_{res}}{SS_{tot}}$ | 相对基线（预测均值）的改进程度；可为负 |

$R^2$ 接近 1 并不等于业务可用，要结合 MAE/RMSE 的绝对量级一起看。

### 6. 类别不平衡怎么处理

思路分三类（**常见做法，具体组合因任务而异**）：

1. **改评估与阈值**：不要只看准确率；用 PR-AUC、F1、召回率；按业务代价调阈值。
2. **改采样**：过采样少数类（如 SMOTE）、欠采样多数类、或两者结合。注意：采样只在**训练集**上做，验证/测试保持原始分布。
3. **改损失/权重**：给少数类更大权重（如 scikit-learn 的 `class_weight='balanced'`），或用 focal loss 等（多见于深度学习）。

`class_weight='balanced'` 会把权重设成与类别频率成反比，让模型更重视少数类——代价通常是假阳性变多。

## 小例子：不平衡数据上看清指标

本机用 scikit-learn 1.9.1 实际运行（正类约占 5%）：

```python
import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (confusion_matrix, accuracy_score, precision_score,
    recall_score, f1_score, roc_auc_score, average_precision_score)

X, y = make_classification(n_samples=5000, weights=[0.95], random_state=0)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.3, stratify=y, random_state=0)

dumb = np.zeros_like(y_te)
print("全猜负类 准确率:", round(accuracy_score(y_te, dumb), 3), " 召回率:", recall_score(y_te, dumb))

for cw in [None, "balanced"]:
    m = LogisticRegression(class_weight=cw, max_iter=1000).fit(X_tr, y_tr)
    p = m.predict_proba(X_te)[:, 1]
    pred = (p >= 0.5).astype(int)
    print(f"\nclass_weight={cw}")
    print("混淆矩阵 [[TN FP][FN TP]]:\n", confusion_matrix(y_te, pred))
    print(f"P={precision_score(y_te,pred):.3f} R={recall_score(y_te,pred):.3f} "
          f"F1={f1_score(y_te,pred):.3f} ROC-AUC={roc_auc_score(y_te,p):.3f} AP={average_precision_score(y_te,p):.3f}")
```

本机输出：

```
全猜负类 准确率: 0.945  召回率: 0.0

class_weight=None
混淆矩阵 [[TN FP][FN TP]]:
 [[1416    2]
 [  19   63]]
P=0.969 R=0.768 F1=0.857 ROC-AUC=0.955 AP=0.893

class_weight=balanced
混淆矩阵 [[TN FP][FN TP]]:
 [[1349   69]
 [   9   73]]
P=0.514 R=0.890 F1=0.652 ROC-AUC=0.954 AP=0.893
```

怎么读：

1. “全猜负类”准确率 94.5%，召回率 0——准确率完全骗了人。
2. 加 `class_weight='balanced'` 后召回率从 0.768 升到 0.890（漏得更少），但精确率从 0.969 掉到 0.514（误报变多），F1 反而下降——说明**指标之间要权衡，没有万能最优**。
3. ROC-AUC 几乎不变，因为排序能力差不多；看阈值点上的 P/R/F1 才能看到业务差异。

## 常见误区

1. **“准确率高就是好模型”**：不平衡时几乎毫无意义。
2. **“AUC 高就一定业务好”**：AUC 只反映排序，不保证某个阈值下的精确率/召回率满足业务要求。
3. **“F1 越高越好，不用看业务”**：漏诊代价和误诊代价往往不对称，有时更该优化召回率或精确率本身。
4. **“在测试集上做过采样再评估”**：评估必须用原始分布，否则指标失真。
5. **“ROC 和 PR 随便看哪个都行”**：正类稀少时 PR 通常更有信息量。
6. **“阈值永远用 0.5”**：0.5 只是默认；应按验证集上的业务指标来选。

## 面试口径

**30 秒版**：先画混淆矩阵，再谈精确率、召回率和 F1。准确率在不平衡时会骗人。ROC-AUC 衡量排序能力，不依赖单一阈值；正类很少时更该看 PR 曲线和 AP。回归看 MAE/RMSE/$R^2$。不平衡可以从评估、采样、样本权重三方面处理，阈值按业务代价选。

**2 分钟版**：展开三点。第一，精确率是“报阳有多准”，召回率是“真阳抓到了多少”，F1 是两者调和平均；通过调阈值在两者之间权衡。第二，ROC 以 FPR-TPR 作图，AUC 是随机正负样本被正确排序的概率；PR 以召回-精确率作图，对假阳性更敏感，适合不平衡。第三，处理不平衡时：评估改用 PR/F1，训练可用 `class_weight` 或重采样（只在训练集），最终在原始分布的测试集上报告，并和业务代价（漏报 vs 误报）对齐。

## 面试高频问答

**Q1：精确率和召回率分别是什么？什么时候更关注哪个？**
精确率 = TP/(TP+FP)，召回率 = TP/(TP+FN)。漏诊代价高（癌症筛查、欺诈召回）更关注召回率；误报代价高（推送广告、垃圾过滤误伤）更关注精确率。

**Q2：为什么 F1 用调和平均而不是算术平均？**
调和平均对较小值更敏感：精确率或召回率有一个很低时，F1 会被明显拉低，避免“一个 0.99、一个 0.01、平均还看起来不错”的假象。

**Q3：ROC-AUC 的直观含义？**
随机抽一个正样本和一个负样本，模型给正样本更高分的概率。它衡量排序质量，与具体阈值无关。

**Q4：什么时候用 PR 曲线而不是 ROC？**
正类很少、或更关心正类预测质量时。此时大量负样本会让 FPR 看起来很好，掩盖假阳性问题；PR 直接看精确率。

**Q5：类别不平衡有哪些处理方法？**
换指标与阈值；训练集过采样/欠采样；`class_weight` 或代价敏感学习。评估必须在原始分布上。

**Q6：多分类怎么算精确率/召回率？**
先对每个类算，再平均。macro 平均对每类一视同仁；micro 平均先汇总 TP/FP/FN 再算，受大类影响更大；weighted 按样本数加权。

**Q7：MAE 和 RMSE 怎么选？**
都希望越小越好。RMSE 对大误差更敏感，适合“特别不能出大错”的场景；MAE 更稳健、更好解释。两者单位都与目标一致。

**Q8：阈值 0.5 一定最优吗？**
不一定。应根据验证集上的业务指标（如在精确率 ≥ 某值的前提下最大化召回率）来选阈值。

## 自测题

1. 正类只有 1%，一个永远预测负类的模型准确率大约是多少？召回率呢？
2. 把分类阈值从 0.5 降到 0.1，精确率和召回率通常怎么变？
3. AUC = 0.5 说明什么？
4. 为什么说不平衡时 PR 比 ROC 更有信息量？
5. 用 SMOTE 过采样后，应该在哪份数据上报告最终指标？

<details>
<summary>参考答案要点</summary>

1. 准确率约 99%，召回率 = 0。
2. 更容易被判为正：召回率通常上升，精确率通常下降。
3. 模型的排序能力和随机猜差不多。
4. 负类很多时 FPR 分母大，假阳性被“稀释”；PR 的精确率分母是预测为正的数量，直接反映假阳性代价。
5. 必须在保持原始分布的验证/测试集上报告；SMOTE 只作用于训练集。

</details>

## 参考资料

- scikit-learn 文档：Metrics and scoring: quantifying the quality of predictions. [链接](https://scikit-learn.org/stable/modules/model_evaluation.html)
- scikit-learn 文档：LogisticRegression（含 `class_weight`）. [链接](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html)
