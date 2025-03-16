---
title: fde-bootloader
tags: [forensics, aes, memdump, nordics-ddc-ecsc-2025]
date: 2025-03-17 00:00:00
draft: false
heroImage: ./assets/cyberlandslaget-ddc.png
---

# fde-bootloader

<style>
.basis-1\/5{flex-basis: 5% !important;}
.max-w-prose{max-width: 100ch !important;}
.prose{max-width: 100ch !important;}
</style>

```
I’ve found this ancient disk in a computer during a recent search, but I haven’t found the password yet… 
did they even have full disk encryption back then?

files: hda.img, mem.dump, run-qemu.sh
```

**If you would like to just read the steps to get the flag, then scroll to the bottom of the page to "TLDR" section.**
## First look
### Gather information
I spend the first minutes gathering information on the handout files to figure where to start. I usually run the following commands on files as low-hanging fruits.

```bash
strings file.ext > file.ext.txt
binwalk -e file.ext
```

After running strings on **mem.dump** file I figure out it's a memory dump from qemu with FreeDOS kernel. Which is an open source kernel for ms-dos.

```
FreeDOS kernel (build 1933 or prior)
FreeDOS kernel version %d.%d.%d
```

So we are working with ms-dos system that has been encrypted.

strings on **hda.img** only gives us the printable string error! and a lot of mess.
### Running emulator
There is probably more information we can get from the files, but I decided to run the qemu emulator to see what the image file contains.

When running the qemu script get a terminal with the content

```
SeaBIOS (version .)

IPXE (http://ipxe.org) .

Booting from Hard Disk...

Enter decryption key: _
```


The disk is encrypted, and from the title we can assume the bootloader has been modified to decrypt the files.

## Rabbit holes
After I found out the bootloader decrypts the disk, I went into a rabbit hole of trying to reverse engineer the bootloader. This is harder said than done, because of the 16 bit architecture it uses. The bootloader is 16 bit and majority of decompilers do not use a lot of resources to maintain 16 bit decompilation. IDA has no way to decompile 16 bit instructions, so it's harder to figure out what happens.

So I spent a few hours trying to also do dynamic analysis using ltrace, strace and dump from qemu. However I found a unique easter egg from the qemu memory dump:

```
Copyright (C) 2024 Segphault Heavy Industries and Technology Emporium. All rights reserved.
```

I first assumed this was the author(s) name, and doing some googling we can connect it to the team https://segphault.com/ where there are writeups from previous Danish CTFs like NC3.

I spent an extra time trying to do some OSINT and see if I could get info, but I couldn't find any info that would help.

## Time to do research
After a failed reverse engineering attempt, I started to focus on research with information from blog posts and previous ctf writeups. I usually use keywords like `ctf` `forensics` and other things that could be useful.

After a few searches I find this writeup https://g0blin.co.uk/hack-lu-ctf-2015-dr-bob-writeup/ where it uses package [[AESKeyFind]] to extract the AES keys from a memory dump.

So I thought it could be worth a try here as I haven't been able to find the password directly, nor been able to reverse engineer the bootloader.

I got these two keys after running the command:

```
30e7ce9231c822e37065aa3044c0793d
c6dea73a7b053b85e1782aa720ae61dd
```

I then went to cyberchef and tried using AES CBC with key and it worked. The entropy changed from 7.9 to 5.5. Entropy is a way to determine if data is encrypted, compressed or plain text. Higher entropy usually means compressed or encrypted data.

Part of the data seemed to be encrypted or corrupted, so I renamed the decrypted file to .data and dragged it into gimp to see what the data would like like as pixels.

I then noticed these lines that seemed to be encrypted data.

![[gimp-encrypt-noise.png]]

This left me a bit uncertain if I used wrong AES encryption. I then looked into disk encryption and found out this about [ESSIV](https://en.wikipedia.org/wiki/Disk_encryption_theory#Encrypted_salt-sector_initialization_vector_(ESSIV)) which stands for "Encrypted salt-sector initialization vector". 
TLDR it's a way to have unique IV for each boot sector that prevents attacks.

Next step is trying to find code that can decrypt aes-cbc-essiv, and my go to is Github. I was lukcy to find this repository https://github.com/trounce1/Android-AES/blob/master/android_aes.py which implements aes-cbc-essiv which I would need.

When I initially found the two aes keys I was a bit unsure why there were 2 keys, after reading the wikipedia for ESSIV it started making sense. One was the decryption key and other was the key used to create IV (salt) for each boot sector that is being decrypted.

So I modified the code to use the following keys
* 30e7ce9231c822e37065aa3044c0793d for encryption cipher
* c6dea73a7b053b85e1782aa720ae61dd for ESSIV cipher

It took some messing around with the code, but I figured out that first 512 bytes in **hda.img** is the header, so we need to exclude those from the decryption. The block number to be starting from 1 than zero, as we don't need to decryption block sector 0.

When writing the file again, I include the header so it can be mounted.

## Another rabbithole
After getting the entire decrypted disk, I was a bit uncertain where to go next. I had done some analysis on the memory dump, and seen the text "SECRET" but this left my mind.

I wasn't able to run the image on qemu for some weird reason.
It tried booting, and then next was the string "Error!"

I took the time to mount the image on linux and extracted the files.

```
mount -t msdos -o loop,offset=32256 hda-decrypted.img /mnt/dos
```

The disk contained two games, doom and skyroads.

Both seems to have modding tools, so I assumed that could've been the goal. Usually flags can be hidden using sprites, and I assumed this could be the case. I was wrong, both games were their original files and nothing had changed. So several hours were wasted here.
## Finding the flag
After trying for hours and getting nowhere, and I had forgotten about low hanging fruits.
I copied the image file over to my Windows VM and started up started a new case in Autopsy.

Selected the image, and after it was done with it's scan it recognized a hidden file
`_lag.txt` and included following content
<pre class="astro-code github-dark" style="background-color:#24292e;color:#e1e4e8; overflow-x: auto; word-wrap: break-word; white-space: normal !important;">
<code style="white-space: normal !important;">
DDDDD   DDDDD    CCCCC     {{  1              EEEEEEE RRRRRR   SSSSS  TTTTTTT   AAA   TTTTTTT         BBBBB    OOOOO   OOOOO  TTTTTTT LL       OOOOO    AAA   DDDDD   EEEEEEE RRRRRR           2222               KK  KK RRRRRR  YY   YY PPPPPP  TTTTTTT EEEEEEE RRRRRR          DDDDD   IIIII  SSSSS  KK  KK         333333               ???   ???   ???   ???              44               PPPPPP  RRRRRR   OOOOO  FFFFFFF IIIII TTTTTTT }}    
DD  DD  DD  DD  CC    C   {{  111             EE      RR   RR SS        TTT    AAAAA    TTT           BB   B  OO   OO OO   OO   TTT   LL      OO   OO  AAAAA  DD  DD  EE      RR   RR         222222              KK KK  RR   RR YY   YY PP   PP   TTT   EE      RR   RR         DD  DD   III  SS      KK KK             3333             ?? ?? ?? ?? ?? ?? ?? ??            444               PP   PP RR   RR OO   OO FF       III    TTT    }}   
DD   DD DD   DD CC      {{{    11             EEEEE   RRRRRR   SSSSS    TTT   AA   AA   TTT           BBBBBB  OO   OO OO   OO   TTT   LL      OO   OO AA   AA DD   DD EEEEE   RRRRRR              222             KKKK   RRRRRR   YYYYY  PPPPPP    TTT   EEEEE   RRRRRR          DD   DD  III   SSSSS  KKKK             3333                 ??    ??    ??    ??          44  4               PPPPPP  RRRRRR  OO   OO FFFF     III    TTT     }}} 
DD   DD DD   DD CC    C {{{    11 ...         EE      RR  RR       SS   TTT   AAAAAAA   TTT           BB   BB OO   OO OO   OO   TTT   LL      OO   OO AAAAAAA DD   DD EE      RR  RR           2222   ...         KK KK  RR  RR    YYY   PP        TTT   EE      RR  RR          DD   DD  III       SS KK KK              333 ...           ??    ??    ??    ??          44444444 ...         PP      RR  RR  OO   OO FF       III    TTT     }}} 
DDDDDD  DDDDDD   CCCCC    {{  111 ... _______ EEEEEEE RR   RR  SSSSS    TTT   AA   AA   TTT   _______ BBBBBB   OOOO0   OOOO0    TTT   LLLLLLL  OOOO0  AA   AA DDDDDD  EEEEEEE RR   RR _______ 2222222 ... _______ KK  KK RR   RR   YYY   PP        TTT   EEEEEEE RR   RR _______ DDDDDD  IIIII  SSSSS  KK  KK _______ 333333  ... _______   ??    ??    ??    ??  _______    444   ... _______ PP      RR   RR  OOOO0  FF      IIIII   TTT    }}
</code>
</pre>
Which seems to be the flag, I was happy but at the same time it was painful to figure out what the exact format was. I opened up support ticket as I had tried multiple times to submit flag.

The issues I had was
* I first missed the dots that is needed in the flag
* I saw there were zero's and started mixing them in
* Unsure what was correct way to write the words in the flag.

After looking at my notes, I believe this is the correct flag.

```
DDC{1._ERSTAT_BOOTLOADER_2._KRYPTER_DISK_3._????_4._PROFIT}
```

Flag translated is

```
1. Replace bootloader
2. Encrypt disk
3. ????
4. Profit
```

## Final thoughts
I liked the challenge overall. There were new things I learned about ms-dos and I don't know if this solution is intended. I found it to be a unique challenge where I learned new things, and I got to challenge myself.

It was a bit annoying having found the flag, but no way to properly confirm it was correct in a offline way and having to submit the flags many times to the ctf platform and open up support ticket.

I opened a ticket to confirm if this was intended solve, as it seemed weird for the flag to be in a weird format and having to guess what letters are correct.

I got informed the flag is ASCII text art, and it was a way to prevent flag being easy extracted using grep command.

![[flag-ascii-art.png]]

It caused confusion for many, and I assume there might be some who figured it out it was ascii art. I'm not a fan of ascii art because of how it disrupts screen readers.

While it was an annoyance at the time, it does not take away what I learned from the challenge and how good of a challenge it is.

## TLDR
1. Use [AESKeyFind](https://github.com/makomk/aeskeyfind) on memory dump to get aes keys required for decryption
2. Do research on disk encryption methods to find aes cbc essiv
3. Decrypt disk using aes-cbc-essiv with a modified script of https://github.com/trounce1/Android-AES/blob/master/android_aes.py
	1. Header should not be included in the decryption which is 512 bytes
	2. The long_block_number should be block_number + 1 as first block is already decrypted
	3. Add the file header before the decrypted bytes when writing the file.
4. Get `_lag.txt` file from the fat12 partition/file in the disk using Autopsy or another tool.
5. Figure out the right flag from knowing it's danish and looking at what characters are most common
6. Win!