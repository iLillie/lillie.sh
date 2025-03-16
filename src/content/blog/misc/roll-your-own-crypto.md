---
title: Roll your own crypto
tags: [misc, base64, xor, nordics-ddc-ecsc-2025]
date: 2025-03-17 00:00:10
draft: false
heroImage: ./assets/cyberlandslaget-ddc.png
---

# Roll your own crypto

<style>
.basis-1\/5{flex-basis: 5% !important;}
.max-w-prose{max-width: 100ch !important;}
.prose{max-width: 100ch !important;}
</style>

```
Why make a new "cyberchef crypto" challenge every year, 
when we can make a "make a cyberchef crypto challenge" challenge instead!
```

## Initial thoughts
Looking at the code it seems that we need a way to do transformations on the flag that results in a known plaintext.  
There are some conditions:
* Each transformation output needs to be larger than flag length
* You can only xor 3 bytes
* Transformations needs to not fail
* Transformations are
	* base64 encode
	* base64 decode
	* xor bytestrings (max 3 bytes we can decide)
	* hex to bytes
	* bytes to hex
	* bytes to ascii
	* md5

### Theory
A theory I had is using transformations that will remove the parts after "DDC{"

Since then we could easily get the same cipher text.

An important part is looking at how the base64 encoding and encoding works here

```python
# base64 encodes a bytestring into base64
def make_b64enc(msg):
    # Real encoding crypto challenges don't care about padding, so neither should we
    try:
        return True, base64.b64encode(msg).rstrip(b"=")
    except:
        return False, "Something broke trying to base64 encode your message"

# base64 decodes a base64 encoded string or bytestring, might fail if illegal characters are present
def make_b64dec(msg):
    # Real encoding crypto challenges don't care about padding, so neither should we
    if isinstance(msg, bytes):
        padding = b'='
    else:
        padding = '='

    for padding_len in range(4):
        try:    
            return True, base64.b64decode(msg + padding * padding_len)
        except Exception:
            pass
    return False, "Something broke trying to base64 decode your message"
```

We can see how they remove and add padding, so it's possible to xor base64 and still have valid decode.

## Scripting
I spent time trying out transfomrations and for loops to figure out how I can affect the input.

During my testing I figured out these instructions often gave duplicate ciphertext
* X amount of base64 encodings
* Y amount of base64 decoding
* xor with a Z hex value
* 1 more base64 decoding


X will always be larger than Y
Z is always one byte hex value

I also knew the length between the flag format is 57, and most likely is ascii letters, digits and underscore.

So I used these variables, and did a lot of testing where I would try to get as many duplicate ciphertext as possible with the same X, Y and Z value but random flags.

```python
previous=[]
duplicates={}
for z in range(1):
    random_chars = ""
    for i in range(57):
        random_chars += random.choice(string.ascii_letters + string.digits + "_")

    FLAG = b"DDC{" + random_chars.encode() + b'}'
    print(f"ROUND {z} with flag: {FLAG}")
    for y in [84]:
        try:
            value = FLAG
            for i in range(34):
                value = make_b64enc(value)[1]
                print("b64encode")

            for i in range(10):
                if (i == 9):
                    value = make_xor(value, chr(y).encode())[1]
                    print("xor")
                value = make_b64dec(value)[1]
                print("b64decode")
            if value == "Something broke trying to base64 decode your message" or len(value) == 0:
                continue
            if value in previous:
                if y in duplicates.keys():
                    duplicates[y].append(value)
                else:
                    duplicates[y] = [value]
                print(f"{value.hex()}")
            previous.append(value)
        except:
            continue
```

These are the transformatons I got at the end of my testing.

* 34x base64 encode 
* 9x base64 decode
* 1x xor with hex 54
* 1x base64 decode
* bytes to hex

I don't know the exact details of why these transformations worked.

## Solve script
```python
	instructions = [
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64encode",
	"b64decode",
	"b64decode",
	"b64decode",
	"b64decode",
	"b64decode",
	"b64decode",
	"b64decode",
	"b64decode",
	"b64decode",
	"xor",
	"b64decode",
	"hex",
	]
	
	
	from socket import socket
	from telnetlib import Telnet
	import time
	
	sock = socket()
	sock.connect(('10.42.5.244', 9999))
	
	for i in range(1):
	    print(sock.recv(1024))
	
	print("here")
	for instruction in instructions:
	    sock.send(instruction.encode() + b"\n")
	    print(instruction.encode())
	    print(sock.recv(1024))
	    if (instruction == "xor"):
	        sock.send(b"54\n")
	        print(sock.recv(1024))
	    time.sleep(0.15)
	
	
	# Enter in done
	# and then post f5dd1ff1dd1ef2075eeb979ff3dd7aefcf3c69fe66f20f39d3de9e75ef3de5ef5d69f79fd39e75f7d79de9e79eea0d3977bf79f3af5df3a6bce7bf1a7bbf39e7dd397b97daf3df3a7fbf3c79e77debc6f9ee6e74e79e9ed3d79ee6677cf7d79aeb97bcd39e7cf5e7fae5ed35d3975f7f5f34d667daf39e9df5ae7b7b4d3ae79f39d74e
	t = Telnet()
	t.sock = sock
	t.interact()
	sock.close()
```


I then get the response
<pre class="astro-code github-dark" style="background-color:#24292e;color:#e1e4e8; overflow-x: auto; word-wrap: break-word; white-space: normal !important;">
    <code style="white-space: normal !important;">
    Nice! Lets deploy the challenge now, i wonder if they'll ever be able to recover b'DDC{base64_kinda_strange...Dare_you_to_try_with_one_byte_xor!}' from f5dd1ff1dd1ef2075eeb979ff3dd7aefcf3c69fe66f20f39d3de9e75ef3de5ef5d69f79fd39e75f7d79de9e79eea0d3977bf79f3af5df3a6bce7bf1a7bbf39e7dd397b97daf3df3a7fbf3c79e77debc6f9ee6e74e79e9ed3d79ee6677cf7d79aeb97bcd39e7cf5e7fae5ed35d3975f7f5f34d667daf39e9df5ae7b7b4d3ae79f39d74e :monkahmm:
    </code>
</pre>


## Flag

```
DDC{base64_kinda_strange...Dare_you_to_try_with_one_byte_xor!}
```

## Thoughts
It was very fun challenge and I did the extra challenge that was in the flag without knowing about it. I assume the author solve uses 2 or 3 byte xor?