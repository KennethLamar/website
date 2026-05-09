---
title: "Constraining LLM Output"
date: "2026-05-08"
metaDesc: "Using GGML Backus-Naur Form to constrain LLM outputs."
tags:
  - personal
  - AI
---

Last year I was reading [The Em Dash Dilemma: How a Punctuation Mark Became AI’s Stubborn Signature](https://medium.com/@brentcsutoras/the-em-dash-dilemma-how-a-punctuation-mark-became-ais-stubborn-signature-684fbcc9f559), as recommended to me by [Tom Scott's newsletter](https://www.tomscott.com/newsletter/).
The author told a story where they couldn't get an AI model to avoid using the em dash.
Below is my comment responding to this post, which details exactly how to constrain the model.

If you must absolutely and consistently constrain an LLM to avoid or exclusively generate certain characters, structures, etc., you can enforce this on any model using a grammar file in [GBNF](https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md) format.
Since LLMs are based on sampling from token probabilities, it can generate a list of candidate tokens, then use your provided grammar rules to filter out undesirable options.
In this case, the em dash.
What remains may be some highly improbable tokens, which can set some models off in strange directions (especially smaller models), but the point is that we can control these outputs, without even having to ask the model at all.

For instance, I request the following from Qwen3:
>"Write a list using the em dash for bullets."

It outputs the following:
>Here’s a list using the em dash (—) as bullets:  
>— Item one  
>— Item two  
>— Item three  
>— A longer item with additional details  
>— Another bullet point with a note—like this!

I then add the following grammar, which disallows the unicode \u2014 (em dash) from being used:

>root ::= content*  
>content ::= allowedchar  
>allowedchar ::= [\u0000-\u2013\u2015-\uFFFF]

And make the exact same request:

>"Write a list using the em dash for bullets."

It now outputs the following:

>– Item one  
>– Item two  
>– Item three  
>– Item four  
>– Item five

Note here that, as a substitute, Qwen is now using the en dash (–).
It's interesting how it will try for the nearest substitute to best accommodate my request.
I filtered out the en dash, then it used the horizontal bar (―).
I filtered out the horizontal bar, then it used two hyphens next to each other (--).

Constraining an LLM to a specific grammar is a really useful tool.
The most common case is to require the LLM to generate valid JSON, for parsing its outputs by a traditional program.
You can even specify the names, structure, and output format for the fields, to ensure that the LLM writes something valid (and hopefully meaningful) in each required field.