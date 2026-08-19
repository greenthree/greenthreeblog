---
title: "The Geometry of a Qubit"
date: "2024-08-18"
category: "QUANTUM"
excerpt: "A visual note on amplitudes, state vectors, and the Bloch sphere."
readTime: "08 MIN"
tags:
  - quantum
  - geometry
  - bloch sphere
---

The Bloch sphere turns a two-level quantum state into a point on a familiar geometric object. The picture is compact, but it still keeps the phase information that a probability table would hide.

## A state as a direction

Every pure qubit can be written as

$$
|\psi\rangle = \cos\frac{\theta}{2}|0\rangle + e^{i\phi}\sin\frac{\theta}{2}|1\rangle.
$$

The polar angle `theta` controls the relative populations of the computational basis. The azimuth `phi` controls their relative phase. Together they select a direction on the sphere.

> A good visualization does not replace the algebra. It gives the algebra somewhere precise to land.

## Why the picture helps

Unitary gates become rotations. A Hadamard gate moves a state between the poles and the equator, while a phase gate rotates around the vertical axis. That makes composition easier to reason about before writing a circuit.

The global phase is not visible on the sphere, because multiplying the entire state by the same complex phase does not change a measurement. The remaining relative phase is exactly what interference can observe.

## A small experiment

Move the pointer across the state-vector panel on the home page. The cyan tip changes phase while the violet points reveal the opposite hemisphere. The canvas is a reminder that a state is both a number and a trajectory through a space of possibilities.
