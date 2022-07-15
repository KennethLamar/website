---
title: "When To Use Relaxed Memory Semantics"
date: "2021-12-08"
metaDesc: "Relaxed memory semantics are tricky to work with in C++. Let's go through some example use cases."
tags:
  - professional
  - concurrency
---

## Background

The [C++ atomic operations library](https://en.cppreference.com/w/cpp/atomic) is a convenient way to access [atomic](https://en.wikipedia.org/wiki/Atomicity_(database_systems)) operations within C++ code. Atomic operations are essential building blocks for lock-free programming. Every atomic operation in the C++ library provides support for an optional [memory order](https://en.cppreference.com/w/cpp/atomic/memory_order) parameter. 

Modern processors use [pipelining](https://en.wikipedia.org/wiki/Instruction_pipelining). Pipelining works like a car assembly line, but for instructions, dividing individual operations into a series of smaller steps that can be performed by different parts of the processor in parallel. By tracking data dependencies, both the compiler and the processor identify instructions that are semantically equivalent when reordered and perform these reorderings to keep the pipeline full and minimize [stalls](https://en.wikipedia.org/wiki/Pipeline_stall). Because reordering will not change overall program behavior, programmers can write code that is easy to read while still benefitting from optimized reordering that provides equivalent results. However, this optimization only works for sequential programs.

## The Problem

When writing concurrent code, the effects of reordering may be visible to other threads. When an object must be synchronized between threads, we need to ensure those effects are visible. We must prevent reordering of operations that affect shared memory objects to ensure correctness, though this comes at the cost of losing some of the performance gains associated with reordering. Different instructions and architectures provide different ordering guarantees that may not be sufficient in a concurrent environment without more explicit mechanisms being added, such as memory [barriers](https://en.wikipedia.org/wiki/Memory_barrier). The C++ atomics library provides these barriers based on the memory order requested from the programmer and the memory ordering guarantees provided by the processor. In this way, the library remains platform-agnostic, using as few additional fences as needed to satisfy the reordering constraints chosen.

## The Insight

While I have been aware of memory order parameters for a long time, I have long wondered when it is appropriate to relax the constraints. Traditionally, I have used the strictest and default [sequentially-consistent](https://en.cppreference.com/w/cpp/atomic/memory_order#Sequentially-consistent_ordering) ordering, as this option ensures that all instructions leading up to the atomic operation have completed before the operation starts and that the atomic operation completes before the subsequent operations on that thread start. This provides a total ordering on all atomic operations that use this, which is typically what we want in lock-free code. However, there are several patterns where this level of strictness isn't necessary. 

### Atomic counters

One simple example would be an atomic counter. Incrementing a counter consists of three steps: loading the counter's current value, incrementing the value locally, and storing the incremented value back in memory. If multiple threads increment the counter at the same time, these steps may interleave, and some increments will be overwritten and lost. The atomic increment function ensures that these three steps are indivisible and thus counts are not lost, but oftentimes sequential consistency is a far greater requirement than is needed for a simple counter. When we don't care the order in which increments occur or when those increments become visible to other threads, we can use [relaxed](https://en.cppreference.com/w/cpp/atomic/memory_order#Relaxed_ordering) ordering.
Relaxed ordering only guarantees that our increments are not lost, since this is inherently guaranteed by the atomic library. Only for the final read of the counter would we need stronger reordering guarantees to read the final value.

### Locks

Locking is another popular pattern. In this paradigm, we use our own atomic operations to provide the locking mechanism, rather than the [mutex](https://en.cppreference.com/w/cpp/thread/mutex) library (which uses atomics internally anyway). When designing your own mutual exclusion lock, the lock only requires [acquire-release](https://en.cppreference.com/w/cpp/atomic/memory_order#Release-Acquire_ordering) reordering semantics. It ensures that anything that happens within a [critical section](https://en.wikipedia.org/wiki/Critical_section) is visible to another thread after it acquires the lock for itself. Anything else can be freely reordered safely.

### More?

There are certainly more uses of relaxed memory semantics that I didn't cover here. What I find useful about specific examples is that they provide a stronger intuition of how relaxed memory works and when it's applicable. With careful thought, one can identify more cases of free (but still correct) performance gains from relaxed ordering. I am relieved that using the strongest guarantees is the right choice for most lock-free programming synchronization; it means that my designs aren't leaving free performance on the table by using the strictest memory ordering. 