---
title: "Unsupported Ryzen Instructions"
date: "2022-03-21"
metaDesc: "The relatively new Ryzen processor line has had some growing pains with instruction support."
tags:
  - hardware
---

Ryzen processors shook up a stagnant processor market with more cores at competitive prices. Recent models have closed the gap on single-core performance, leaving few major weaknesses when compared against Intel processors. However, Ryzen has historically had growing pains supporting the full instruction sets provided by Intel, some of which still exist to this day. The situation has largely improved over time via microcode updates, BIOS patches, and new processor revisions.

Processors use [feature flags](https://en.wikipedia.org/wiki/CPUID#EAX=1:_Processor_Info_and_Feature_Bits) to convey which instruction sets are supported. If the associated flag is set, software can safely call those instructions, often with performance gains from calling a single specialized instruction instead of a large sequence of more common instructions or providing extra features. 

On Ryzen, these enable bits are often set even when only a portion of the instructions are supported. This is the case for 16-bit legacy instructions. These instructions are used when virtualizing '90s-era operating systems, such as Windows 98. Ryzen processors falsely claim full support for these 16-bit instructions, even though actual support is only partial. This is frustrating, as not claiming support would allow VMware to seamlessly fall back to virtualizing the required instructions in software. As it stands, the config needs to manually be adjusted to request software mode for these instructions, even today.

![Error messages in Windows 98 resulting from incorrect virtualization on Ryzen](/assets/images/Ryzen-Win98.png "A Windows 98 VM running on a Ryzen processor")

Instruction support has plagued the launch of popular video game titles. In the early days, Destiny 2 [failed to run](https://www.forbes.com/sites/jasonevangelho/2019/07/12/amd-motherboard-patch-ryzen-3000-customers-affected-by-destiny-2-and-linux-boot-problems/#56f47f0e16b8) on Ryzen systems without a BIOS update. While details are scant, the update presumably added support for instructions that were used by the game that were improperly handled by the CPU. Red Dead Redemption II was [similarly affected](https://old.reddit.com/r/reddeadredemption/comments/dsezeq/rockstar_games_launcher_crash_list_of_all/).

<!-- Other times, an instruction is supported, but only via microcode. Microcode is software at the processor level, which is often slower than proper hardware support. In the case of the (TODO) instruction, software supports it for a performance boost but falls back to several simpler instructions without support. Unfortunately, this instruction's microcode implementation is slow enough that it would be faster to simply act as though it was unsupported.  -->

A particularly egregious example was the way Ryzen handled random number generation. Some processors have instructions designed to provide fast random number generation in hardware. Ryzen claims this support, yet its initial implementation [always returned 0xffffffff](https://arstechnica.com/gadgets/2019/10/how-a-months-old-amd-microcode-bug-destroyed-my-weekend/), or -1 in signed 32-bit integer representation. To resolve this, Linux kernel developers had to ignore this instruction even for processors that claimed to support it. 

![Dilbert - Tour of Accounting](/assets/images/Dilbert-RNG.gif "Dilbert by Scott Adams, October 25, 2001")