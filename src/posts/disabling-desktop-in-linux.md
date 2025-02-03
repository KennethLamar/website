---
title: "Disabling and Enabling Your Desktop Environment in Linux"
date: "2022-01-20"
metaDesc: "Turning the desktop environment off saves compute for servers, but sometimes you still want the convenience of a GUI. These shortcuts let you quickly switch between either."
tags:
  - personal
  - server
  - notes
---

To prevent a Linux desktop environment from starting on boot, all you have to do is use `systemd` to set the default mode with the following command:
```bash
sudo systemctl set-default graphical.target
```
The next time you boot, you will launch in a terminal, with no desktop GUI running. 

To restore back to the GUI, you can run the following command:
```bash
sudo systemctl set-default multi-user.target
```
This command also requires a reboot to take effect, but it will restore your standard desktop environment.

To easily automate the whole process, I have added the following lines to my `.bashrc` file:
```bash
alias startx="sudo systemctl set-default graphical.target && sudo reboot now"
alias term="sudo systemctl set-default multi-user.target && sudo reboot now"
```
Now, all I have to do is type `term` to reboot to a terminal and `startx` to reboot to a desktop environment.