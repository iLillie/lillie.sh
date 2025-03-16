---
title: DDC Admin Bot
tags: [misc, discord-bot, python, discord-py, nordics-ddc-ecsc-2025]
date: 2025-03-17 00:00:01
draft: false
heroImage: ./assets/cyberlandslaget-ddc.png
---

# DDC Admin Bot

<style>
.basis-1\/5{flex-basis: 5% !important;}
.max-w-prose{max-width: 100ch !important;}
.prose{max-width: 100ch !important;}
</style>

```
We made a super cool discord server for all the DDC (danish cyber championship) admins! To make it easier to add new admins I've made a discord bot!

Here's a link to the server.

You can also have the bot's source code so you can see how it works!

files: Dockerfile, bot.py, requirements.txt, README.md, docker-compose.yml
```
## First look

### Discord server
The server has 2 public channels and 2 private channels. Public channel names are `welcome` and `bot-spam`. Private channel names are`verification` and `challenge-writeups`. The role `member` can see the channel `challenge-writeups`.  `verification` channel is restricted to moderator and DDC Admin bot role. So we can assume we need to get the role `member` and the flag is available in the channel.

I can see this information from a third-party client like [Vencord](https://vencord.dev/) that has modifications, but it can also be done using Discord in the browser and finding the right api responses.

In the `bot-spam` channel we can see people writing the command `!verifyme` and DDC Admin Bot responding with `@user-who-ran-command, your verification request has been sent to the moderators.`
### Source code
The discord bot is written in Python and using the main discord library and has a simple docker setup. In the code there is only one command that is `!verifyme` and there seems to be no arguments from the users. 

So we can assume the logic within the command will be important.
## Bot behaviour
So Discord bots by default can be invited by anyone if you do not change any default settings. You need to have the correct url and the id from the bot to invite it to your own server. So it's important to hardcode to make sure your bot only responds to actions on your server.

When looking at the code for `!verifyme` command, I saw it does not use [[snowflake id]] when checking entities.

```python
def check(reaction, reactor):
        return (
            str(reaction.emoji) == "✅"
            and reaction.message.content == msg
            and reaction.message.channel.name == VERIFICATION_CHANNEL_NAME
            and any([r.name == MODERATOR_ROLE_NAME for r in reactor.roles])
        )
```

This only checks for message content, channel name, and if role the person reacting has.
The check is used in following code

```python
 try:
        # Wait for a moderator to react with the correct emoji
        reaction, moderator = await bot.wait_for('reaction_add', check=check)
        # Assign the "member" role to the user after verification
        member_role = discord.utils.get(guild.roles, name=MEMBER_ROLE_NAME)
        if member_role is None:
            await ctx.send("Member role not found in the server.")
        else:
            await user.add_roles(member_role)
            await verification_channel.send(
                f"{user.mention} has been verified by {moderator.mention} and given the {member_role.name} role."
            )
```

We can then assume the bot is waiting for `reaction_add` event across servers.

This means that we can get the member role in **DDC Admin Server** if we
* Create our own discord server that includes
	* member role
	* moderator role
	* verification channel
* Assign role moderator to ourselves.
* Invite the discord bot to our server using discord bot invitation url
* Replicate the message required for the check to be true and post it in the verification channel
* Run `!verifyme` role in the **DDC Admin Server**
* React to our own replicated message in **our** Discord

## Testing out the theory.
### Crafting the message
Looking at the code above the check, we can see this is the message sent to the verification channel, and we can see the variable is the same as the one being checked.

```python
 # Send the verification request to the verification channel
    msg = f"{user.mention} has requested verification. Moderators with {mod_role.mention}, please verify."
    verification_msg = await verification_channel.send(msg)
```

Discord mention uses the [[snowflake id]] in the mention format, so the message would actually be 

```
<@1234567890> has requested verification. Moderators with <@&0987654321>, please verify.
```

This information can be found online, or if you have used Discord for a few years.

You can read discord's [Where can I find my User/Server/Message ID?](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID) guide on how to find the ID's. The role id can be tricky, but if you open up the moderator user profile and right click the admin you will get the right id.

So if I was testing for getting the role on DDC Admin Server I would need to send following message in my own verification channel

```
<@874739814887456788> has requested verification. Moderators with <@&1293636473291014184>, please verify.
```

### Sanity check
I decided to use my own bot to do the testing as this allows me to print out the check conditions and confirm if I do it correct. I will not go into details on how to setup a Discord bot as there are many resources online.

I made 2 dummy servers and invited the bot to both of them, both had the same structure.
I'm have the **moderator** role in **dummy1** but not in **dummy2**. **dummy2** would be the DDC Admin Server, where I do not have any roles and I want to get the **member** role. 

First I send out the message with the correct mention id's in the **dummy1 verification channel** and then send out `!verifyme` in the general/bot-spam channel in **dummy** and now the Discord bot is looking for a reaction with the conditions mentioned earlier.

So I react with checkmark on the message I sent in the **dummy1** server and I can see I got the member role in **dummy2**

## Getting the flag
I use [Discord Permissions Calculator](https://discordapi.com/permissions.html#0) to invite the bot with copying the bot id and using it as client id. Giving it administrator role.

And it works
![[admin-bot-joins.png]]

I post the following message in the verification channel

![[requested-verification.png]]

Next step is now to send `!verifyme` in the DDC Admin Server bot-spam channel

![[verifyme-command-admin-server.png]]

I go to my server and add the checkmark and hope for the best. 

![[checkmark-verification.png]]

I go back to the server and I see myself under the member role!

![[member_list.png]]

And now we have access to the challenge-writeups channel and there is the message with the flag!

```
Hey gutter! Jeg har lige lavet en ny challenge. Sender filerne om lidt, men kan I ikke oprette den på CTFd? Flaget er `DDC{d1sc0rd_b0t5_4r3_h4rd}`
```