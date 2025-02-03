---
title: "Using a Netbook in 2022"
date: "2022-04-25"
metaDesc: "Limitations breed creativity."
socialImage: "/assets/images/IMG_1694.jpg"
tags:
  - personal
  - hardware
  - gaming
  - server
---

![A photograph of a Netbook on a table, running the LXQT desktop environment](/assets/images/IMG_1694.jpg)

There is a saying that limitations breed creativity.
For me, the limitation is my first personal laptop, an Acer Aspire One D150 Netbook from 2009.
The creativity is finding anything to do with it in 2022.

| Features | Acer Aspire One D150 |
| - | - |
| CPU: | 32-bit Intel Atom N270 @ 1.6 GHz |
|Graphics: | Intel 945GSE |
| RAM: | 2 GB of 533MHz DDR2 (Upgraded from 1GB) |
| Storage: | 160 GB 5,400 RPM HDD |
| Wireless: | Atheros BCM4312 802.11b/g |

## Getting Up and Running

### The OS

When setting this device up, I had to decide which operating system to install on it.
The stock Windows XP it came with has been unsupported since 2014.
I wanted to make this a secure, Internet connected device, so Windows XP wasn't suitable for my uses.
Instead, I looked to Linux.
The open-source community provides lightweight software that can breathe new life into aging devices, and I wasn't afraid of getting my hands dirty to make things work.

When exploring my options, I was surprised to learn that most Linux [distros](https://en.wikipedia.org/wiki/Linux_distribution) have dropped support for the x86 32-bit architecture.
Most of the [remaining options](https://distrowatch.com/search.php?ostype=Linux&architecture=i686) seem to be Debian and a handful of Debian derivatives.
Other distributions, such as Ubuntu, provide 32-bit LTS builds, but those will lose support in 2023.
I decided to install Debian as my OS, since it was closest to the Ubuntu experience I'm used to.
LXQT served as my [DE](https://en.wikipedia.org/wiki/Desktop_environment), since it's one of the lightest modern desktop environments in the Linux world.

![A screenshot of my Netbook running the LXQT desktop environment](/assets/images/netbook-screenshot.jpg "LXQT on my netbook.")

### Sleep Bug

When I first installed Debian on the machine, the first thing I noticed was that my Netbook would often fall asleep if left at idle for more than a minute or two.
This is not default behavior in Debian and was never an issue in Windows XP.
I came to discover that this line of computers has a bug where lid close events get sent to the OS periodically even when left open.
This caused the computer to sleep while on, sleep mid-boot, and even sleep before finishing a shutdown.
Initially, my fix was to change my configuration so that lid close events would be ignored.
This is a reasonable solution, although it means actually closing the lid would no longer do anything.

I later discovered that Acer had provided a BIOS update that fixes this issue.
Unfortunately, Acer support no longer provides software downloads for devices this old.
I could have tried to find a download from some random forum on the Internet, but I instead tracked down the latest BIOS update using the [Wayback Machine](http://web.archive.org/).
The Wayback Machine supports wildcard searches to see all files archived under a server directory.
I found the directory where the BIOS files used to be by following around some pages still on the Internet linking to the (dead) download.
From there, it was a matter of filtering to `.zip` archives and finding appropriately named BIOS files.
Fortunately, the Wayback Machine had archived these drivers, and I was able to download the last BIOS revision, [1.13](https://www.google.com/url?q=http://web.archive.org/web/2011*/http://global-download.acer.com/GDFiles/BIOS/BIOS/BIOS_Acer_1.13_A_A.zip%3Facerid%3D634006067021142404%26Step1%3DNetbook%26Step2%3DAspire%2520One%26Step3%3DAOD150%26OS%3DX02%26LC%3Den%26BC%3DAcer%26SC%3DPA_6&usg=AOvVaw3VOh3yOR9s7B5ZBluGzDLK).

Installing the BIOS update was somewhat inconvenient, as there are no visible options in the BIOS menus.
Eventually, I found a [tutorial](https://youtu.be/ZR6paPNebPY) on YouTube that worked for me.
The process is as follows:
1. Ensure the battery is attached.
1. Connect a flash drive formatted as FAT32 containing the `.fd` firmware file, `KAV10.fd` in this case.
1. Hold Fn+Esc.
1. While still holding these keys, plug in the power cable.
1. While still holding the keys, press the power button.
1. After waiting a few seconds, release the keys.
1. You can tell that it worked if the screen remains blank but the flash drive is blinking as the firmware is read.

I also found an alternative, easier approach.
1. Image [FreeDOS](https://www.freedos.org/) onto a USB flash drive. [Rufus](https://rufus.ie/) has this functionality built in.
1. Copy the `DOS` folder from the firmware `.zip` file to the root of the flash drive.
1. Boot the Netbook off the USB to load into FreeDOS.
1. `cd` to the `DOS` folder copied earlier.
1. Run the `.bat` file.
1. Follow the prompts.

With the BIOS updated, I could safely remove my hack, and lid close events now worked properly.
No more random sleeping.

### Wi-Fi Firmware

My last major setup difficulty involved finding and installing Wi-Fi firmware.
On this Netbook, as with many laptops (especially of this era), Wi-Fi firmware support in Linux is poor.
After following [a guide](https://wiki.debian.org/bcm43xx) on the Debian Wiki, I was able to get it working by installing `b43-firmware-installer`, a packages that downloads and installs the proprietary Broadcom firmware needed for this machine's wireless adapter. 

## The Creativity

Now we get to the fun part: finding tasks well-suited for such a low power device.
This Netbook makes a [Raspberry Pi](https://www.raspberrypi.org/) look high end, and frankly, most projects would be better suited by the energy efficiency of a Pi.
My netbook's benefits over a Pi come from the hardware: a (low resolution) screen, (cramped) keyboard, (tiny) trackpad, and (aging) battery are all included in one convenient(ish) package.
If I wanted to run these projects on a Pi, I'd have to buy more equipment.
This netbook costs me nothing extra, since it's been sitting in a closet doing nothing for years.

### Web Browsing

Most web browsers have dropped support for 32-bit platforms.
Firefox still maintains a version, called [Firefox ESR](https://www.mozilla.org/en-US/firefox/enterprise/), that continues to receive updates on machines this old.
However, the web has continued to become a more complex and bloated place.
The mere act of opening a tab can overwhelm this device for over a second before the CPU settles down.
Simple sites are manageable, if uncomfortable.
Any site serving web video is far too much for my Netbook, so I have resorted to lightweight alternatives such as downloading YouTube videos using [yt-dlp](https://github.com/yt-dlp/yt-dlp) for later playback in [VLC](https://www.videolan.org/) or watching live broadcasts using [streamlink](https://streamlink.github.io/).

As an alternative to traditional web browsers, I have developed a newfound appreciation for text-based web browsers.
[Lynx](https://lynx.invisible-island.net/) is a 6 MB text web browser that runs entirely within a terminal.
Most websites with reasonably well-organized html just work on Lynx.
The inability to serve anything other than text removes a ton of unnecessary bloat present on the web and makes navigating the Internet a downright snappy experience on this Netbook.

![A terminal window displaying my website in Lynx](/assets/images/lynx-website.png "My website in Lynx.")

### Web Server

It doesn't take a supercomputer to run a web server, at least not if the pages served are lightweight and the number of visitors remains low. Just look at this [solar-powered website](https://solar.lowtechmagazine.com/power.html), which uses only a Raspberry Pi, a solar panel, and a battery.
I installed [lighttpd](https://www.lighttpd.net/), a web server optimized for minimal resource use, and threw a few files on it. 

### Games

#### Armagetron Advanced

For me, [Armagetron Advanced](http://www.armagetronad.org/) was a real classic.
It's a 3D Tron-inspired lightcycle game that is free and open-source.
It was one of my most-played games on my Netbook back when it was my main device.
It was (and remains) one of the few 3D games that runs reasonably well on it.

#### Cave Story

This is another classic from this Netbook's past.
Developed over the course of five years by one man and released in 2004, [Cave Story](https://www.cavestory.org/) is a 2D platform adventure game.
As it was free and required little in the way of hardware capabilities, this was quite frequently played on my Netbook.
I found a proper Linux build with 32-bit support, and it runs great, just as well as it did when I played it years ago.

#### Open RollerCoaster Tycoon 2

[Open RollerCoaster Tycoon 2](https://openrct2.org/) is an open-source conversion of RollerCoaster Tycoon 2.
The original game was written almost entirely in hand-written assembly, but this project works to convert the entire codebase to C++.
While it doesn't reach a full 60 FPS in larger parks, the experience is still entirely playable on my Netbook.
Of note, the PPA recommended by the Open RCT2 developers doesn't seem to provide packages for the 32-bit architecture.
I had to build and run this one from source.

#### mGBA

Just like a Pi, low powered computers such as this are well-suited for emulation of older game systems.
mGBA is one of the most mature GBA emulators available.
Using it on a Netbook makes for one oversized Game Boy.
Not all titles run at full speed, but there are still plenty that do.

#### Super Mario 64

Super Mario 64 recently had its code [fully decompiled](https://github.com/n64decomp/sm64) into C code that can be rebuilt into a bit-for-bit identical N64 ROM. 
Using this base code, the game has been ported to many different platforms, including PC.
The [PC port](https://github.com/sm64-port/sm64-port) runs reasonably well on my Netbook, at native widescreen resolution.

#### Minecraft

Running Minecraft was a poor experience on this machine, though I didn't come in expecting much.
The official Linux launcher requires a 64-bit CPU, so I had to use a community-supported alternative with 32-bit support, [MultiMC](https://multimc.org/).
This was not the last complication.
Starting with Minecraft 1.13, they increased the minimum OpenGL version required.
As a result, my lowly Intel 945GSE refused to boot the latest version of the game.
I had to install version 1.12.2, the last supported version.
Finally in game, I turned the settings down as low as they would go.
I ended up with a Minecraft experience that ran at 5-7 FPS.

![A screenshot of Minecraft running on the Netbook](/assets/images/netbook-minecraft.jpg "This was the best I could manage.")