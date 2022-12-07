---
title: "ConVul Reimplementation"
date: "2022-03-10"
metaDesc: "Implementing a concurrency vulnerability detector."
tags:
  - professional
  - concurrency
---

## ConVul

[ConVul](https://ieeexplore.ieee.org/abstract/document/8952233) is a concurrency vulnerability detector that uses [Intel Pin](http://www.intel.com/software/pintool) to instrument and detect potential bugs at run time in concurrent code. Concurrent bug detection is a hard problem, as, in the naïve case, bug checkers must comprehensively examine all possible interleavings of all instructions that could possibly occur. 

The authors of ConVul simplified the process by identifying which instructions could actually have their execution order reversed in practice (dubbed exchangeable events in the paper). If they are exchangeable, then it is worth checking to see if reversing their order would result in a buggy execution. This check happens at runtime, so it is possible that certain instructions could be exchangeable yet missed by actual situations seen by a particular run. This makes their approach more of a heuristic, albeit a practical one to find bugs that could realistically occur. 

The authors' second set of optimizations to reduce the checking complexity was to consider only three classes of concurrency bugs: [use after free](https://cwe.mitre.org/data/definitions/416.html), [double free](https://cwe.mitre.org/data/definitions/415.html), and [null pointer dereference](https://cwe.mitre.org/data/definitions/476.html). These bugs are common and high impact, making them worthwhile targets. By restricting to these, only a small subset of instructions needs to be instrumented and checked for reorderings, reducing the overhead of the tool. 

## Reimplementation

I identified the ConVul paper as an ambitious class project idea when I took a computer security class last year. While the results were promising, the authors never provided their code. Only their [benchmarks](https://github.com/mryancai/ConVul) were made publicly available for use. 

To address this gap, I decided to reproduce the tool as my contribution. I had hoped to extend it to detect bugs in lock-free code, but my research sent me in a different direction. Nevertheless, my class paper and reimplemented code can be found on my GitHub. Ultimately, I consider my newfound understanding of Pin to be a valuable new tool under my belt, as this project made me feel comfortable instrumenting code for run-time code analysis. 

### Code

{{"https://github.com/KennethLamar/ConVul" | linkPreview: true}}

### Class Paper

[https://github.com/KennethLamar/ConVul/raw/main/Paper.pdf](https://github.com/KennethLamar/ConVul/raw/main/Paper.pdf)