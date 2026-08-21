---
slug: "cf1992g-solution"
date: "2024-07-12"
translations:
  zh:
    language: "zh-CN"
    title: "CF1992G 题解"
    category: "算法竞赛"
    excerpt: "个人认为不错的一道组合数题。"
    readTime: "10 MIN"
    tags:
      - Codeforces
      - 组合数学
      - MEX
      - 算法竞赛
  en:
    language: "en"
    title: "CF1992G Solution: Counting MEX Contributions"
    category: "COMPETITIVE PROGRAMMING"
    excerpt: "Decompose the (|b|+1)-th missing positive integer into a baseline and an extra contribution, then count every case in O(n²)."
    readTime: "10 MIN"
    tags:
      - Codeforces
      - Combinatorics
      - MEX
      - COMPETITIVE PROGRAMMING
---

<!-- lang:zh -->

# CF1992G 题解

原题链接：[https://codeforces.com/contest/1992/problem/G](https://codeforces.com/contest/1992/problem/G)

个人认为不错的一道组合数题。

题意简介：记 $\operatorname{MEX}(S, k)$ 为集合 $S$ 中未出现的第 $k$ 个**正整数**，集合 $a$ 为排列 $1 \sim n$，对于集合 $a$ 的所有子集 $b$，求 $\operatorname{MEX}(b, \left| b\right| + 1)$ 的和。

第一步，对于一个子集 $b$，先不考虑集合 $b$ 中元素的影响，$\operatorname{MEX}(b, \left| b\right| + 1)$（下称 $\operatorname{MEX}$ 值）的初始值为 $\left| b\right| + 1$，故对于所有大小为 $\left| b\right|$，总共的初始值为 $(\left| b\right| + 1)\operatorname{C}_n^{\left| b\right|}$。

第二步，集合 $b$ 中元素对 $\operatorname{MEX}$ 值的影响可以看作在初始值基础上的额外贡献。贡献取决于元素的分布，若是在 $1\sim (\left| b\right| + 1)$ 中分布有 $1$ 个值，就会对结果产生 $1$ 的贡献，若是在 $1\sim (\left| b\right| + 2)$ 中分布有 $2$ 个值，就会产生 $2$ 的贡献（较小值会先使得 $\operatorname{MEX}$ 值加 $1$ 变为，此时 $\left| b \right| + 2$ 一定大于较大值；依次类推，若是在 $1\sim \left| b\right| + m$ 中分布有 $m$ 个值，就会产生 $m$ 的贡献（第 $k$ 小一定小于等于 $\left| b \right| + k$）。接下来我们只要求出所有相同大小，相同贡献的不用子集个数即可。

对于集合大小为 $\left| b \right|$ 的子集，贡献为 $1$ 的有 $\operatorname{C}_{\left| b \right| + 1}^{1} \operatorname{C}_{n-(\left| b \right| + 2)}^{\left| b \right| -1}$ 种（从 $1\sim \left| b \right| + 1$ 中选一个，此时 $\operatorname{MEX}$ 值为 $\left| b \right| + 2$，还得从 $(\left| b \right| + 3)\sim n$ 中取 $\left| b \right| -1$ 个数），贡献为 $2$ 的有 $\operatorname{C}_{\left| b \right| + 2}^{2} \operatorname{C}_{n-(\left| b \right| + 3)}^{\left| b \right| -2}$，贡献为 $m$ 的有 $\operatorname{C}_{\left| b \right| + m}^{m} \operatorname{C}_{n-(\left| b \right| + m + 1)}^{\left| b \right| - m}$。

数据保证 $O(n^2)$ 不会超时，组合数可用预处理的阶乘逆元计算。

一些细节：

1. $\operatorname{MEX}$ 值会超过 $n$，即 $\left| b \right| + m$ 超过 $n$。这时就应该只在前 $n$ 项中选取，即 $\operatorname{C}_{\min(\left| b \right| + m,n)}^{m} \operatorname{C}_{n - \min(\left| b \right| + m + 1,n)}^{\left| b \right| - m}$。
2. 在前 $\min(\left| b \right| + m,n)$ 项选完后，要保证后续项能放下剩余的元素个数。具体见代码。
3. 空集也是子集。

```cpp
#include<bits/stdc++.h>
#define YES cout << "Yes" << endl
#define NO cout << "No" << endl
#define int long long
using namespace std;
int T;
int n;
int mod = 1e9 + 7;
int fact[20003] = {1};  
int inv[20003];
int ans;
int min(int a, int b){return a < b ? a : b;}
int max(int a, int b){return a > b ? a : b;}
int ksm(int x, int y)
{
    int ans = 1;
    while(y)
    {
        if(y & 1)
            ans = ans * x % mod;
        x = x * x % mod;
        y >>= 1;
    }
    return ans;
}
int C(int n, int m)
{
    return fact[n] * inv[m] % mod * inv[n - m] % mod;
}
signed main()
{
    for(int i = 1; i <= 5000; i ++)
    {
        fact[i] = fact[i - 1] * i % mod;
    }
    inv[5000] = ksm(fact[5000], mod - 2) % mod;
    for(int i = 4999; i >= 0; i --)
    {
        inv[i] = inv[i + 1] * (i + 1) % mod;
    }

    cin >> T;
    while(T --)
    {
        cin >> n;
        ans = 0;
        for(int i = 0; i <= n; i ++)
        {
            ans = (ans + (i + 1) * C(n, i) % mod) % mod;
            for(int j = 1; j <= i; j ++)
            {
                if(j + (n - min(i + j, n)) < i) 
                continue;
                ans = (ans + j * C(min(i + j, n), j) % mod * C(n - min(i + j + 1, n), i - j) % mod) % mod;
            }
        }
        cout << ans << endl;
    }
}
```

<!-- lang:en -->

# CF1992G Solution

Original problem: [https://codeforces.com/contest/1992/problem/G](https://codeforces.com/contest/1992/problem/G)

In my opinion, this is a nice combinatorics problem.

Problem summary: let $\operatorname{MEX}(S,k)$ be the $k$-th **positive integer** that does not appear in the set $S$. The set $a$ is a permutation of $1\sim n$. For every subset $b$ of $a$, find the sum of $\operatorname{MEX}(b,\left|b\right|+1)$.

First, for a subset $b$, ignore the influence of the elements in $b$. The initial value of $\operatorname{MEX}(b,\left|b\right|+1)$ (called the $\operatorname{MEX}$ value below) is $\left|b\right|+1$. Therefore, for all subsets of size $\left|b\right|$, the total initial value is $(\left|b\right|+1)\operatorname{C}_n^{\left|b\right|}$.

Second, the influence of the elements in $b$ on the $\operatorname{MEX}$ value can be treated as an extra contribution on top of the initial value. The contribution depends on the distribution of the elements. If one value is distributed in $1\sim(\left|b\right|+1)$, it contributes $1$ to the result. If two values are distributed in $1\sim(\left|b\right|+2)$, they contribute $2$. By the same reasoning, if $m$ values are distributed in $1\sim\left|b\right|+m$, they contribute $m$ (the $k$-th smallest value is at most $\left|b\right|+k$). We only need to count subsets with the same size and the same contribution.

For subsets of size $\left|b\right|$, the number with contribution $1$ is $\operatorname{C}_{\left|b\right|+1}^{1}\operatorname{C}_{n-(\left|b\right|+2)}^{\left|b\right|-1}$: choose one value from $1\sim\left|b\right|+1$, after which the $\operatorname{MEX}$ value is $\left|b\right|+2$, and choose the remaining $\left|b\right|-1$ values from $(\left|b\right|+3)\sim n$. The number with contribution $2$ is $\operatorname{C}_{\left|b\right|+2}^{2}\operatorname{C}_{n-(\left|b\right|+3)}^{\left|b\right|-2}$, and the number with contribution $m$ is $\operatorname{C}_{\left|b\right|+m}^{m}\operatorname{C}_{n-(\left|b\right|+m+1)}^{\left|b\right|-m}$.

The constraints guarantee that $O(n^2)$ is fast enough. Binomial coefficients can be calculated using precomputed factorials and inverse factorials.

Some details:

1. The $\operatorname{MEX}$ value may exceed $n$, meaning that $\left|b\right|+m$ exceeds $n$. In this case, values should only be selected from the first $n$ positions, giving $\operatorname{C}_{\min(\left|b\right|+m,n)}^m\operatorname{C}_{n-\min(\left|b\right|+m+1,n)}^{\left|b\right|-m}$.
2. After selecting values from the first $\min(\left|b\right|+m,n)$ positions, the remaining positions must be able to hold all remaining elements. See the code for the exact check.
3. The empty set is also a subset.

```cpp
#include<bits/stdc++.h>
#define YES cout << "Yes" << endl
#define NO cout << "No" << endl
#define int long long
using namespace std;
int T;
int n;
int mod = 1e9 + 7;
int fact[20003] = {1};  
int inv[20003];
int ans;
int min(int a, int b){return a < b ? a : b;}
int max(int a, int b){return a > b ? a : b;}
int ksm(int x, int y)
{
    int ans = 1;
    while(y)
    {
        if(y & 1)
            ans = ans * x % mod;
        x = x * x % mod;
        y >>= 1;
    }
    return ans;
}
int C(int n, int m)
{
    return fact[n] * inv[m] % mod * inv[n - m] % mod;
}
signed main()
{
    for(int i = 1; i <= 5000; i ++)
    {
        fact[i] = fact[i - 1] * i % mod;
    }
    inv[5000] = ksm(fact[5000], mod - 2) % mod;
    for(int i = 4999; i >= 0; i --)
    {
        inv[i] = inv[i + 1] * (i + 1) % mod;
    }

    cin >> T;
    while(T --)
    {
        cin >> n;
        ans = 0;
        for(int i = 0; i <= n; i ++)
        {
            ans = (ans + (i + 1) * C(n, i) % mod) % mod;
            for(int j = 1; j <= i; j ++)
            {
                if(j + (n - min(i + j, n)) < i) 
                continue;
                ans = (ans + j * C(min(i + j, n), j) % mod * C(n - min(i + j + 1, n), i - j) % mod) % mod;
            }
        }
        cout << ans << endl;
    }
}
```
