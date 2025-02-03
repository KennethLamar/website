---
title: "A Homage to CRTs"
date: "2021-11-12"
metaDesc: "CRTs are a great option for gaming, offering advantages unmatched even by modern flat panels."
socialImage: "/assets/images/Discarded-Adam_Kent.jpg"
tags:
  - personal
  - gaming
  - hardware
---

You may remember CRT (cathode-ray tube) displays, those big boxes we used to use for screens. Back before LCDs, they were one of the only display options available. They were big, heavy, large, power-hungry, flickery, sometimes staticky, and often prone to electromagnetic interference. For these reasons, you may wonder why anyone would want to use them in the modern day.

![A CRT monitor abandoned on the ground](/assets/images/Discarded-Adam_Kent.jpg "Photo by Adam Kent on Flickr.")


Here's a list of reasons CRT monitors are often better than what is offered today:

## Minimum input latency
Modern displays, particularly TVs, are notorious for applying lengthy processing effects in the name of "enhanced" image quality, but these come at the cost of input latency, often in the order of hundreds of milliseconds of additional delay, which is significant. Most TVs offer a gaming mode, which disables most of this post processing, but there is extra latency involved even then. People can get used to this input latency, but they will always suffer from a competitive disadvantage in games. Even trying to use your TV as a PC monitor may add noticeable latency to actions as simple as mouse cursor movements.

It is impossible to achieve better latency than a CRT at a given refresh rate. CRTs are an analog technology and had no easy way to buffer images for processing. Instead, these screens are designed to scan out the image to screen as soon as the data is provided to it. This means the only meaningful latency incurred from a CRT is the time it takes for the scanout itself to complete. At 60Hz, this scanout will take about 16.6 ms. The top of the display scans out the image instantaneously, while the bottom of the image finishes getting output at the end of the 16.6 ms period. This means the average latency of a CRT is about 8.3 ms, and with a V-SYNC enabled 60Hz signal, this cannot get any better. There are only a few modern displays that do better, such as expensive competitive gaming monitors that run at refresh rates far higher than a CRT can maintain. 

## Superior black levels
CRTs have excellent black levels, superseded only perhaps by modern OLED displays. Compared to conventional LCDs, CRTs have always offered true blacks without suffering from banding or other artifacts. Games with dark lighting greatly benefit from this technology.

## Arbitrary refresh rates
Modern LCD technology is constrained to a handful of specific refresh rates, typically consisting of 60Hz. If the frame rate of the content displayed isn't a factor of the monitor's refresh rate, it will result in improper frame pacing, which appears to the user as unstable judder, particularly noticeable on smooth camera pans. This is why modern games often target 60 or 30 fps, and never anything in-between (unless it's [Batman: Return to Arkham](https://youtu.be/xIy0Sb0SvIw?t=245)). 

CRTs generally support arbitrary refresh rates. So long as the refresh rate doesn't exceed the maximum speed achievable by the electron beam, you can keep turning the refresh rate up, or strategically turn the refresh rate down (though turn it too low, and flicker becomes more apparent). This is great for games where you can't quite achieve the target frame rate. 45 fps, for instance, would be a perfectly acceptable target; just set your CRT to 90Hz and off you go with proper frame pacing. Another great use is in classic games. Arcade games often leveraged CRTs for all sorts of non-standard refresh rates back in the day, and a real CRT not only provides a more authentic [MAME](https://www.mamedev.org/) emulation experience than an LCD, a CRT can also adjust its refresh rate to match the content being displayed, no need for frame dropping, emulation speed changes, or potentially expensive adaptive refresh rate technology. 

## Arbitrary resolutions
Modern LCDs use a fixed grid of pixels. For instance, a 1080p screen consists of a grid 1920 pixels wide by 1080 pixels tall. Non-native resolutions must be rescaled to fit on screen. Conventionally, this is handled by bilinear filtering, a cheap scaler that blurs the image. There are modern upscalers taking hold in the industry to work around this issue, such as [NVIDIA DLSS](https://www.nvidia.com/en-us/geforce/technologies/dlss/) and [AMD FidelityFX CAS](https://gpuopen.com/fidelityfx-cas/), but a CRT can bypass the problem entirely. You can choose to run at any resolution you like, and CRTs permit targeting even sub-720p resolutions while still looking great. This is an excellent way to claw back performance if your graphics card isn't quite up to snuff, without totally compromising the game you're trying to play. 

## High motion clarity
Because CRTs inherently work by scanning an image out to the screen with an electron beam, it provides what is essentially a strobing effect, where each frame of an image is clearly distinct from the next. This provides extreme clarity in motion, where detail is retained even for fast motion. It can be clearly illustrated in the Blur Busters [UFO motion test](https://www.testufo.com/), where the three-eyed alien's eyes all seem to smear together on an LCD yet remain distinct on a CRT. Modern displays achieve comparable results though backlight strobing, black frame insertion (BFI), or NVIDIA Ultra Low Motion Blur (ULMB) technology, but this remains a niche feature supported only on high-end displays. Some amount of blur [can be desirable](https://youtu.be/VXIrSTMgJ9s) as a post-processing effect in games, but you still want the opportunity to choose between sharp motion and motion blur that applies selectively and artistically, such as DOOM 2016, which can apply motion blur only to the weapon view models to add more impact to the animations. LCD blur merely piles its blur on top of artistic blur as an unpleasant side effect.

## Concluding Remarks
CRTs have been out of production [since 2015](https://www.npr.org/sections/alltechconsidered/2016/08/15/489629491/saying-goodbye-to-old-technology-and-a-legendary-nyc-repair-shop). Their weight makes them expensive to ship. Plus, they are delicate enough to require careful packing, which you often can't rely on from private shippers on eBay or other online services. However, they were ubiquitous enough that you can still find them in local thrift shops. If you have the space, I highly suggest keeping one of these things around, particularly for games that most benefit from the technology. They are hardly a one-size-fits-all solution, but there are still many situations where I would rather use a CRT over any modern display. Be sure to buy a PC CRT monitor, rather than a CRT TV. CRT TVs are far more limited, with low color resolution, interlacing, and a mere 525 scan lines.

If you aren't yet convinced, Digital Foundry has covered the greatness of CRT technology in one of their videos:

https://www.youtube.com/watch?v=V8BVTHxc4LM