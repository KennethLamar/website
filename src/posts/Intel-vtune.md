---
title: "Intel VTune Profiler"
date: "2022-04-04"
metaDesc: "Profiling software to improve performance."
tags:
  - professional
  - concurrency
---

{{"https://www.intel.com/content/www/us/en/developer/tools/oneapi/vtune-profiler.html" | linkPreview: true}}

## VTune

In any situation where you're running performance-critical code, I would consider profiling to be an essential part of code development. 
Intel VTune is a performance profiler, used to aid in program optimization by showing how much time is spent in each instruction within a program.
It supports CPUs, GPUs, FPGAs, a wide variety of languages, multithreaded code, and more.
It is built on top of [Intel Pin](http://www.intel.com/software/pintool), the same tool used in the original implementation and [my reimplementation](/posts/convul/) of [ConVul](https://ieeexplore.ieee.org/abstract/document/8952233).
Using this tooling, profiling is performed at run-time, instrumenting code to determine how much time is spent in each section of the code.
It requires no special build steps, supporting arbitrary binaries out of the box.
In general, all you'll want to do is enable debug symbols so that reports can include more verbose data like function names.
A profiler will show ["hot spots"](https://en.wikipedia.org/wiki/Hot_spot_(computer_programming)), potential trouble spots and sections worth optimizing more heavily.

As a personal example, when I developed my [Lock-free transactional vector](https://dl.acm.org/doi/abs/10.1145/3380536.3380543), I was using a C++ `std:unordered_map`.
I had a section of code where I relied on catching an exception to handle a missing key in the hash table.
In retrospect, this was a simple yet significant mistake.
At the time, I didn't realize just how expensive C++ exceptions were, especially in concurrent code.
Catching these exceptions consumed most of my benchmark's run time.
I replaced it with a key `find()` instead and the performance issue disappeared.
Without profiling, I likely wouldn't have identified the issue, but VTune pointed it out to me.

If you prefer command-line tooling over the GUI provided by VTune, Chandler Carruth presented an excellent walkthrough of performance analysis and the gotchas of profiling C++ code using clang.

https://youtu.be/nXaxk27zwlk
