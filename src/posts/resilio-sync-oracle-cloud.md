---
title: "Running Resilio Sync in Oracle Cloud Free Tier"
date: "2022-01-24"
metaDesc: "Using Oracle Cloud's free tier, I have enhanced my own decentralized file share."
tags:
  - personal
  - cloud
  - server
---

[Resilio Sync](https://www.resilio.com/individuals/) is a file synchronization and sharing service that provides a decentralized, peer-to-peer alternative to traditional cloud-hosted alternatives like Google Drive, OneDrive, and Dropbox. I use it for fast file sharing between my devices and between my friends, without concerns over file sizes or cloud vendor restrictions. 

One of the shortcomings of this solution is that there is no guarantee that any peer devices will be online to receive a file unless you have made sure to leave it on in advance. To overcome this, I have leveraged the Oracle Cloud free tier, which allows me to run a Resilio Sync instance 24/7. This instance leverages the 200GB of free block storage to keep files synchronized. Resilio has an optional encryption option I use so that the cloud machine can synchronize the files without having access to them. Additionally, the ARM compute instances are provisioned with symmetric gigabit networking, which means that I can use the cloud server to alleviate most of the bandwidth limits inherent from sharing files over residential Internet connections. I like this solution because it keeps me in control of my own files. 