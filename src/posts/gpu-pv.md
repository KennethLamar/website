---
title: "Splitting a GPU among Multiple VMs with GPU-PV"
date: "2022-01-20"
metaDesc: "Using GPU-PV for cutting-edge GPU acceleration within a VM."
tags:
  - personal
  - hardware
  - cloud
  - server
  - gaming
---

Windows Display Driver GPU Paravirtualization, or GPU-PV for short, was announced for release in [this blog post](https://devblogs.microsoft.com/directx/directx-heart-linux/#gpu-virtualization). It provides a GPU driver within [Hyper-V](https://en.wikipedia.org/wiki/Hyper-V) that taps into the full power of a GPU, splitting resources among the host and the VMs as needed. Conventional VM GPUs are primarily designed for accelerating desktop GUIs yet are insufficient for use in gaming or other graphically demanding workloads. Oftentimes, driver support is poor, resulting in graphical glitches and crashes. Even when they do work, latency is often unacceptably high. GPU-PV attempts to solve these limitations, making it viable to run your own personal cloud GPU-accelerated VMs, ideal for gaming, machine learning, scientific computing, and other GPU-accelerated tasks split among multiple users on a single physical machine. 

The main limit here is that you are constrained to running a Windows-based host with only Windows VM guests currently supported. Since most games run natively on Windows already, this may not be a major concern, but this will depend on the use case. For instance, GPU-PV can be used to expose the virtualized GPU to [WSL2](https://docs.microsoft.com/en-us/windows/wsl/about) for hardware-accelerated ML on Linux from within Windows. 

There are also some rough edges. [OpenGL](https://en.wikipedia.org/wiki/OpenGL) support is limited and [Vulkan](https://en.wikipedia.org/wiki/Vulkan) won't work at all. Additionally, resolution changes and [UAC](https://docs.microsoft.com/en-us/windows/security/identity-protection/user-account-control/how-user-account-control-works) prompts often result in black screens for a few seconds. Finally, a display must be connected to the GPU (even a dummy connection will work), or else display capture will fail. 

## Tutorials

While official documentation is scant, there are several tutorials already available to set this up for yourself. 

This blog post provides a textual tutorial and more background on GPU-PV:

{{"https://mu0.cc/2020/08/25/hyperv-gpupv/" | linkPreview:false}}

This video provides an excellent guide to set it up yourself as well:

https://youtu.be/XLLcc29EZ_8?t=570

Finally, this GitHub project below will provide a refined script that quickly sets you up with a fresh install of Windows with GPU-PV enabled and [Parsec](https://parsec.app/) installed for up to 4K resolution and more than 120Hz refresh rates via hardware-accelerated desktop streaming to a virtualized display driver. 

{{"https://github.com/jamesstringerparsec/Easy-GPU-PV" | linkPreview:true}}