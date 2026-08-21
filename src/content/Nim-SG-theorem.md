---
slug: "nim-sprague-grundy-theorem"
date: "2024-04-23"
translations:
  zh:
    language: "zh-CN"
    title: "Nim 游戏与 SG 函数"
    category: "算法竞赛"
    excerpt: "从经典取石子游戏出发，理解异或和、SG 函数与公平组合游戏的胜负判定。"
    readTime: "09 MIN"
    tags:
      - 博弈论
      - Nim
      - SG 函数
      - 公平组合游戏
  en:
    language: "en"
    title: "Nim Games and the Sprague-Grundy Function"
    category: "COMPETITIVE PROGRAMMING"
    excerpt: "Starting from the classic stone game, derive xor states, SG values, and the winning criterion for impartial combinatorial games."
    readTime: "09 MIN"
    tags:
      - Game Theory
      - Nim
      - Sprague-Grundy
      - Impartial Games
---

<!-- lang:zh -->

## 从取石子游戏开始

游戏规则：地上有 $n$ 堆石子。每人每次可从任意一堆石子里取出任意多枚石子扔掉，可以取完，不能不取。每次只能从一堆里取。最后没石子可取的人就输了。

我们计算一下所有堆石子数的异或和：

$$
S=a_1\oplus a_2\oplus\cdots\oplus a_n.
$$

我们注意到，当游戏到达终点，即场上没有石子时，$S=0$，此时先手必输。

当 $S=k\ne 0$ 时，若 $k$ 的最高位 $1$ 所在位置为第 $i$ 位，我们找到第 $i$ 位同样为 $1$ 的一堆 $a_j$，并令

$$
a'_j=a_j\oplus k.
$$

$a'_j$ 一定小于 $a_j$。这是因为 $a_j$ 的变化只发生在第 $i$ 位及其后面：最高的第 $i$ 位从 $1$ 变为 $0$，后面无论有多少位从 $0$ 变为 $1$，结果仍然会变小。因此，我们可以从第 $j$ 堆中取走 $a_j-a'_j$ 枚石子。此时新的异或和为

$$
S'=S\oplus a_j\oplus a'_j=S\oplus k=k\oplus k=0.
$$

当 $S=0$ 且场上仍有石子时，无论怎样取，$S$ 都会变为非零。因为一次操作只会把某个 $a_j$ 改成 $a'_j$；如果操作后仍有 $S'=0$，就会得到 $a_j\oplus a'_j=0$，也就是 $a_j=a'_j$，这与必须取走至少一枚石子矛盾。

因此，若起手时 $S=0$，先手无论怎样操作都会把一个非零异或和的局面交给后手；后手又总能把它恢复为 $0$。在双方都采取最优策略时，先手会在自己的每个回合开始时收到一个异或和为 $0$ 的局面，并最终面对没有石子可取的终局。

最终我们得到结论：当异或和为 $0$ 时，先手必输；反之，先手必胜。

## 公平组合游戏

公平组合游戏（Impartial Combinatorial Game，ICG）的定义如下：

1. 游戏有两个人参与，二者轮流做出决策，双方均知道游戏的完整信息；
2. 任意一个游戏者在某一确定状态可以作出的决策集合只与当前状态有关，而与游戏者无关；
3. 游戏一定会在有限步后结束，不会出现平局；按照正常玩法，无法行动的玩家输掉比赛。

显然，上述取石子游戏就是公平组合游戏。每一个 ICG 模型都可以根据不同状态和状态转移的关系抽象成棋子在有向无环图上移动：从起点开始，谁无法继续移动，谁就输掉比赛。

取石子游戏可以抽象为下图。因为不同堆之间相互独立，所以这里只给出其中一堆的情况，并假设初始时有 $5$ 枚石子：

![一堆五枚石子、每次可以取任意正数枚时的状态转移图](diagrams/nim-state-graph.svg)

## 引入 SG 函数

定义一个状态 $x$ 的 $SG$ 值为它所有后继状态的 $SG$ 值中未出现的最小自然数，即

$$
SG(x)=\operatorname{mex}\{SG(y)\mid x\to y\}.
$$

其中，$x\to y$ 表示可以从状态 $x$ 一步移动到状态 $y$。终点没有后继，所以 $SG(0)=0$。

在上面的图中，状态 $3$ 的后继是 $2,1,0$。因为每次可以取走任意多枚石子，状态 $x$ 可以移动到所有比 $x$ 小的状态。因此：

$$
SG(0)=0,\quad SG(1)=1,\quad SG(2)=2,\quad\ldots,\quad SG(5)=5.
$$

这样可能不太容易看出 $SG$ 函数的用处。我们改一下取石子的规则：每次只能取走 $1$ 或 $2$ 枚石子。此时状态图变为：

![一堆五枚石子、每次只能取一枚或两枚时的状态转移图](diagrams/subtraction-game-state-graph.svg)

按照定义逐个计算，可以得到：

$$
\begin{aligned}
SG(0)&=0,& SG(1)&=1,& SG(2)&=2,\\
SG(3)&=0,& SG(4)&=1,& SG(5)&=2.
\end{aligned}
$$

我们注意到，所有 $SG$ 值不为 $0$ 的状态都能一步移动到 $SG$ 值为 $0$ 的状态；所有 $SG$ 值为 $0$ 的状态都只能移动到 $SG$ 值不为 $0$ 的状态。

这和上文的思路一样：若起点的 $SG$ 值为 $0$，先手每次移动后，后手总能再移动到一个 $SG$ 值为 $0$ 的状态。在双方都采取最优策略时，先手最终会迎来终局并输掉比赛。于是，在只有一个棋子的情况下，起点 $SG$ 值为 $0$ 时先手必输；否则先手必胜。

## 从 Nim 推广到所有 ICG

我们再回到之前得到的结论：所有石堆的石子数异或和不为 $0$ 时，先手必胜。在第一张图中，某一石堆的初始 $SG$ 值正好等于该石堆的石子数。实质上，我们并不是对石堆的石子数求异或和，而是在对每个独立游戏的初始 $SG$ 值求异或和。

对于若干个相互独立的 ICG 子游戏 $G_1,G_2,\ldots,G_n$，它们组合后的 $SG$ 值满足：

$$
SG(G_1+G_2+\cdots+G_n)=SG(G_1)\oplus SG(G_2)\oplus\cdots\oplus SG(G_n).
$$

按照之前的思路，设当前所有棋子所在状态的 $SG$ 值异或和为 $k\ne 0$。我们找到一个 $SG$ 值的第 $i$ 位为 $1$ 的棋子，其中第 $i$ 位是 $k$ 的最高位 $1$，再令这个棋子的目标 $SG$ 值等于它原来的 $SG$ 值异或上 $k$。得到的结果一定比原值小。

又因为 $SG$ 值是后继 $SG$ 值集合中首个未出现的自然数，所以所有比当前 $SG$ 值小的自然数都一定在后继的 $SG$ 值中出现。也就是说，我们一定能找到目标 $SG$ 值对应的后继，并把棋子移动到那里。移动后，所有棋子的 $SG$ 值异或和就变为 $0$。

同理，当异或和为 $0$ 时，任何一次合法移动都会使某一个子游戏的 $SG$ 值发生变化，从而使总异或和变为非零。

最终得到 Sprague-Grundy 定理的胜负判定：对于 ICG 模型，当所有棋子初始位置的 $SG$ 值异或和不为 $0$ 时，先手必胜；反之，先手必败。

<!-- lang:en -->

## Starting with a Stone Game

The rules are simple: there are $n$ piles of stones on the ground. On each turn, a player chooses exactly one pile and removes any positive number of stones from it, possibly the entire pile. A player may not skip a turn. The player who has no stone left to remove loses.

Let us compute the xor of the sizes of all piles:

$$
S=a_1\oplus a_2\oplus\cdots\oplus a_n.
$$

When the game reaches its terminal position, there are no stones left and $S=0$. The player to move then loses.

Suppose $S=k\ne 0$, and the highest set bit of $k$ is bit $i$. There must be a pile $a_j$ whose bit $i$ is also $1$. Set

$$
a'_j=a_j\oplus k.
$$

We must have $a'_j<a_j$. Only bit $i$ and the lower bits can change: the highest affected bit changes from $1$ to $0$, so no combination of changes below it can make the result larger. We can therefore make a legal move by removing $a_j-a'_j$ stones from pile $j$. The new xor is

$$
S'=S\oplus a_j\oplus a'_j=S\oplus k=k\oplus k=0.
$$

If $S=0$ while stones remain, every legal move makes $S$ nonzero. A move replaces one $a_j$ with a different value $a'_j$. If the new xor were still zero, then $a_j\oplus a'_j=0$, which would imply $a_j=a'_j$ and contradict the requirement that at least one stone be removed.

Therefore, if the initial xor is zero, every move by the first player gives the second player a nonzero position, and the second player can always restore the xor to zero. Under optimal play, the first player receives a zero-xor position at the beginning of every turn and eventually reaches the terminal position with no legal move.

We obtain the familiar criterion: if the xor is zero, the first player loses; otherwise, the first player wins.

## Impartial Combinatorial Games

An impartial combinatorial game, or ICG, has the following properties:

1. Two players alternate moves, and both have complete information about the game;
2. The legal moves from a position depend only on that position, not on which player is moving;
3. The game ends after finitely many moves and cannot end in a draw. Under normal play, the player with no legal move loses.

The stone game above is clearly an impartial combinatorial game. We can represent any finite ICG by a directed acyclic graph: vertices are positions, and an edge is a legal move from one position to another.

The stone game has the following state graph. Different piles are independent, so the diagram shows only one pile, initially containing five stones:

![State graph for a five-stone pile when any positive number may be removed](diagrams/nim-state-graph.svg)

## Introducing the SG Function

The $SG$ value of a position $x$ is the smallest nonnegative integer absent from the $SG$ values of all positions reachable from $x$ in one move:

$$
SG(x)=\operatorname{mex}\{SG(y)\mid x\to y\}.
$$

Here, $x\to y$ means that one legal move takes state $x$ to state $y$. A terminal state has no successor, so $SG(0)=0$.

In the graph above, the successors of state $3$ are $2,1,0$. Because a player may remove any positive number of stones, state $x$ can reach every smaller state. Hence

$$
SG(0)=0,\quad SG(1)=1,\quad SG(2)=2,\quad\ldots,\quad SG(5)=5.
$$

This example does not yet make the purpose of the $SG$ function especially clear, so let us change the rules: a player may now remove only one or two stones. The state graph becomes:

![State graph for a five-stone pile when only one or two stones may be removed](diagrams/subtraction-game-state-graph.svg)

Applying the definition one state at a time gives

$$
\begin{aligned}
SG(0)&=0,& SG(1)&=1,& SG(2)&=2,\\
SG(3)&=0,& SG(4)&=1,& SG(5)&=2.
\end{aligned}
$$

Every position with a nonzero $SG$ value can move to a position with $SG=0$, while every position with $SG=0$ can move only to positions with nonzero $SG$ values.

This is the same pattern as before. If the initial position has $SG=0$, every move by the first player allows the second player to return to an $SG=0$ position. Under optimal play, the first player eventually faces the terminal position and loses. Thus, for a single token, the first player loses exactly when its initial position has $SG=0$.

## From Nim to Every ICG

Return to our earlier conclusion: the first player wins Nim exactly when the xor of all pile sizes is nonzero. In the first diagram, the initial $SG$ value of a pile is equal to its number of stones. What we are really taking is not the xor of the pile sizes themselves, but the xor of the initial $SG$ values of the independent games.

For independent subgames $G_1,G_2,\ldots,G_n$, their disjoint sum satisfies

$$
SG(G_1+G_2+\cdots+G_n)=SG(G_1)\oplus SG(G_2)\oplus\cdots\oplus SG(G_n).
$$

Suppose the xor of the current component $SG$ values is $k\ne 0$. Let bit $i$ be the highest set bit of $k$, and choose a component whose $SG$ value also has bit $i$ set. Xor that component's current $SG$ value with $k$ to obtain a target value. As in the Nim proof, this target is smaller than the current value.

Since an $SG$ value is the first nonnegative integer missing from the set of successor values, every smaller nonnegative integer must occur among those successors. Therefore, a successor with the target $SG$ value always exists. Moving to it makes the xor of all component $SG$ values zero.

Conversely, from a zero-xor position, every legal move changes the $SG$ value of exactly one component and therefore makes the total xor nonzero.

This yields the winning criterion of the Sprague-Grundy theorem: in an impartial combinatorial game, the first player wins exactly when the xor of the initial component $SG$ values is nonzero. If that xor is zero, the first player loses.
