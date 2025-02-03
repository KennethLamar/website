---
title: "8 Player Splitscreen in Mario Kart: Double Dash!!"
date: "2021-11-07"
metaDesc: "Fulfilling the 8-player splitscreen dream on a GameCube classic."
socialImage: "/assets/images/MKDD_LAN_English.tiff"
tags:
  - personal
  - splitscreen
  - gaming
  - archives
---

I remember playing Mario Kart: Double Dash!! multiplayer on many a TV growing up. At one point, I discovered the existence of the GameCube Broadband Adapter, a rare accessory that enabled local and online network linking for a small number of games. For Mario Kart, it enabled a unique party trick: up to 8 GameCubes linked together with up to 16 players, two per kart. This was the first time Nintendo allowed all 8 positions in a race to be human-controlled. This type of setup was, and still is, fascinating to me. 

Unlike Xbox, where LAN was a core part of the console, the GameCube adapter was an add-on accessory, priced at [$34.95](http://www.nintendoworldreport.com/hardware/2306/gamecube-broadband-adapter-gamecube) each and requiring multiple adapters to support an actual link, which kept it out of my grasp as a child. As an adult, they are long out of production, with a price to match that status. Even if you have a few adapters in hand, they remain a clunky and difficult to coordinate option, requiring multiple GameCubes, multiple copies of the game, multiple TVs, multiple adapters, and multiple controllers. 
![A diagram of of LAN multiplayer with 8 GameCubes connected together via a networking hub](/assets/images/MKDD_LAN_English.tiff "This complex set-up is an example Nintendo provides in the game's instruction manual.")

In comes Dolphin, a mature GameCube emulator with built-in emulation of the Broadband Adapter. This is a useful solution, as it completely sidesteps the need for a real adapter, or even the need for multiple GameCubes, copies of the disc, TVs, or real GameCube controllers. I got to work trying this out for myself using my own dump of the game and managed a promising configuration where 8 instances of the emulator all networked together as expected. This enabled me to lay out all 8 screens together on one monitor, which I recorded as a proof-of-concept, as seen in my video below. Considering the increasing resolutions and dimensions of modern TVs compared to the CRTs used when the game released, this is actually quite workable. 

https://youtu.be/_FqtYo2NTk4

Later that year, I linked two instances of the emulator together on a laptop and managed 8 player Mario Kart: Double Dash for real, though I didn’t have the opportunity to record the event. 

As an aside, Nintendont, a GameCube ISO loader for Wii, also has support for the Broadband Adapter, emulating it over Wi-Fi and even supporting a mix of Wi-Fi and real Broadband Adapters together. This was a long-standing [feature request](https://github.com/FIX94/Nintendont/issues/144) fulfilled after lots of hard development work from FIX94 and some charitable donors who made the feature bounty worthwhile. It’s very much worth a try if you have the right hardware lying around. 