---
title: "Making and Running Services on Linux using systemd"
date: "2022-01-13"
metaDesc: "A quick example, just as much for myself as for anyone else to reference."
tags:
  - personal
  - server
  - notes
postData:
  applicationName: "Minecraft"
  serviceName: "minecraft"
  screenName: "mc"
---

Once I have set up a project on a server, I typically want it to run all the time, surviving across reboots and restarting if it crashes. To facilitate this, I use `systemd`, a Linux system manager that enables the use of [daemons](https://en.wikipedia.org/wiki/Daemon_(computing)) and other custom background tasks. Below are my notes on how to set up such a system for personal projects. 

## Guide

First, create a `.service` file under `/etc/systemd/system/`. For the sake of this tutorial, we will create one for {{postData.applicationName}} and choose to call it `{{postData.serviceName}}.service`. Services are owned by root, so we must `sudo` to create the file successfully.
```bash
sudo touch /etc/systemd/system/{{postData.serviceName}}.service
```

Each `.service` file follows the syntax documented [here](https://www.freedesktop.org/software/systemd/man/systemd.syntax.html). My typical use requires only a few changes to a base set of contents, so I will provide that template here. Use this template to modify `{{postData.serviceName}}.service` as needed, saving as root. The purpose of each line is described below in comments. 
```systemd
# /etc/systemd/system/{{postData.serviceName}}.service

[Unit]
# A description used to identify what this service does.
Description=Run {{postData.applicationName}}
# Ensures that the service doesn't start until after networking has started.
After=network.target

[Service]
# The working directory.
# This should be set to wherever you want to run the task.
# This is typically the directory where the executable lives.
WorkingDirectory=/home/ubuntu/{{postData.serviceName}}

# The user and group you want to run this command as.
# Typically, I run commands as my own user (ubuntu) to simplify permissions.
User=ubuntu
Group=ubuntu

# This line ensures the program restarts on its own in case the process crashes.
Restart=always

# The actual command to execute on boot.
# We create a screen instance called {{postData.screenName}}.
# This will alow us to attach to the screen instance if necessary.
# After that is the command itself.
# In this case, we run a bash script in the working directory.
ExecStart=/usr/bin/screen -DmS {{postData.screenName}} bash {{postData.serviceName}}.sh

[Install]
# The run level.
# Ensures the process starts at the right part of the boot process.
WantedBy=multi-user.target
```

Now reload `systemd` so it has access to your new service. This should be run whenever `{{postData.serviceName}}.service` is modified.
```bash
sudo systemctl daemon-reload
```

Enable the service so it will run automatically at boot.
```bash
sudo systemctl enable {{postData.serviceName}}.service
```

From here, you can either start the service now with `sudo systemctl start {{postData.serviceName}}.service` or reboot to ensure the service starts properly.
```bash
sudo reboot now
```

After a reboot, you can verify that the command is executing by attaching to its [`screen`](https://linux.die.net/man/1/screen) instance.
```bash
screen -r {{postData.screenName}}
```

You can detach from a screen instance by pressing `Ctrl+a` `d`. A full cheat sheet of `screen` commands can be found via [this article on Linuxize](https://linuxize.com/post/how-to-use-linux-screen/).

## A Short `systemctl` Cheat Sheet

```bash
# Reload the system manager configuration.
# Run this after performing any modifications to a .service file.
sudo systemctl daemon-reload

# Enable the service to run at boot.
sudo systemctl enable {{postData.serviceName}}.service

# Disable the service so it no longer runs at boot.
sudo systemctl disable {{postData.serviceName}}.service

# Start the service.
# Used if the service is not running.
# This might happen if it was manually stopped
# or if it was never enabled to run at boot.
sudo systemctl start {{postData.serviceName}}.service

# Stop the service.
# When Restart=always is used, this command is necessary
# to prevent the killed process from restarting.
sudo systemctl stop {{postData.serviceName}}.service

# Equivalent to running stop followed by start.
sudo systemctl restart {{postData.serviceName}}.service
```