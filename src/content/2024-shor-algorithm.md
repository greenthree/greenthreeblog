---
title: "Shor's Algorithm, Read from the Period"
date: "2024-07-02"
category: "ALGORITHMS"
excerpt: "How a hidden period turns modular arithmetic into a factoring strategy."
readTime: "06 MIN"
tags:
  - algorithms
  - number theory
  - quantum
---

Shor's algorithm is easiest to remember as a change of viewpoint: factoring is reduced to finding the period of a modular function.

## The reduction

Choose an integer `a` that is coprime to `N` and study

$$
f(x) = a^x \bmod N.
$$

If the period `r` is even and `a^(r/2) != -1 (mod N)`, then the non-trivial factors of `N` are hidden in

```python
p = gcd(a ** (r // 2) - 1, N)
q = gcd(a ** (r // 2) + 1, N)
```

The quantum part estimates `r` with the quantum Fourier transform. The classical part checks the candidate period and extracts the factors.

## What the circuit contributes

The first register creates a superposition of exponents. Modular exponentiation writes the corresponding values into the second register. Measuring and applying the Fourier transform turns repeated structure into peaks that expose the period.

The speedup is not magic hidden inside a single gate. It comes from arranging interference so that the useful global pattern survives measurement.

## Complexity as a design constraint

For a practical implementation, the arithmetic circuit dominates the cost. The notebook card uses `O(log^3 N)` as a compact reminder: asymptotic notation is a design tool for deciding which experiment is worth building next.
