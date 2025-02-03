---
title: "Running Minecraft in the Oracle Cloud Free Tier"
date: "2022-01-13"
metaDesc: "Oracle Cloud's free tier makes an excellent and free Minecraft server host."
tags:
  - personal
  - gaming
  - cloud
  - server
---

Recently, I worked with a friend to migrate his Minecraft server over to the Oracle Cloud free tier, primarily using [this blog post](https://blogs.oracle.com/developers/post/how-to-set-up-and-run-a-really-powerful-free-minecraft-server-in-the-cloud) as a guide. Using the Oracle Cloud service is a significant upgrade over the $12/month plan provided by [Bisect Hosting](https://www.bisecthosting.com/minecraft-server-hosting.php) my friend was using, which often lagged and enforced arbitrary limits on server configurations. Hosting via the cloud overcame these limits for free, plus we found that the server ping was cut in half, presumably because the Oracle data centers were closer than Bisect's offerings. 

Ultimately, for anyone willing to get their hands dirty with some [CLI](https://en.wikipedia.org/wiki/Command-line_interface) use, the Oracle Cloud server is more powerful and more flexible while running 24/7 at the unbeatable price of free. It also offered significant advantages over a home server solution, since it doesn't cut into residential data caps, doesn't consume a share of limited residential upload bandwidth, and provides better uptime and consistency than could be expected with a local machine. 