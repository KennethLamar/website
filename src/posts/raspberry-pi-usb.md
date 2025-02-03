---
title: "Booting a Raspberry Pi from USB"
date: "2022-03-31"
metaDesc: "Booting a Raspberry Pi off of USB storage instead of an SD card."
tags:
  - personal
  - hardware
  - notes
---

While Raspberry Pis typically boot off of an SD or micro SD card, one can instead opt to boot off of USB storage. This is useful in a pinch, where you don't have a microSD card with a large enough capacity but do have a large enough flash drive. It's also useful if you prefer to boot off of an external hard drive or SSD, since they are designed to handle the stress of frequent reads and writes typically performed by an operating system. 

There are several ways to boot off of USB. I prefer to use the `bootcode.bin` boot mode, which allows you to put a small `bootcode.bin` file on the SD card used with the Pi and flash the rest of the image on a USB device instead of the SD card. This approach is detailed [here](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#special-bootcode-bin-only-boot-mode).

For a full list of boot behaviors and options, check out the full documentation's boot modes section:

{{"https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#raspberry-pi-boot-modes" | linkPreview: true}}