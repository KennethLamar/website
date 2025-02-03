---
title: "Intro to Modern Voice Conversion AI"
date: "2025-02-02"
metaDesc: "Discussing the state-of-the-art in voice conversion."
tags:
  - personal
  - AI
---

Voice conversion, also known as speech-to-speech, provides a means to take the vocal performance of one actor and apply that performance to the voice of another.
This is in contrast to related text-to-speech voice clones, which convert text into speech from a specific speaker.
While there is a long history of efforts to improve the quality of vocal clones, 2023 saw major breakthroughs in AI voice cloning, enabling anyone with a recent GPU to train and use their own AI voice models.
This month will mark the 1 year anniversary of my discovery and experimentation with voice conversion technology.

## A Brief History
Using a vocal performance to drive sound is nothing new.
Back in the 1930's, Disney used the [talk box](https://en.wikipedia.org/wiki/Talk_box) to [make a train whistle shout "all aboard"](https://youtu.be/TngjAdisWCE) in Dumbo and [a spring argue with Donald Duck](https://youtu.be/itA37G3k4dE) in Clock Cleaners.

As a more recent example, sound designer Ben Burtt produced a variety of robot voices in the 2008 Pixar film, WALL·E.
Of particular interest is AUTO, the ship's autopilot, which was the only robot voice that was created using a speech synthesizer, [MacInTalk](https://en.wikipedia.org/wiki/MacInTalk), instead of vocal filter chains.
Though MacInTalk gets the voice credit in the film, an [interview](https://web.archive.org/web/20090226031129id_/http://www.moviesonline.ca/movienews_14930.html) with Ben Burtt reveals that he used his own voice to guide the performance, referring to it as "audio puppeteering," which permitted him to adjust the pitch and timing of AUTO's synthetic voice.

> Q: Did you program MacInTalk to do Auto things?
>
> BEN BURTT: With Auto we started with typing, inputting the sound. I got the software for MacInTalk, then I could use a microphone and use my own voice to say a performance and that could be injected and twist and warp the MacInTalk voice to follow that performance. So it was a combination. Some of these things I refer to as audio puppeteering. You know, you’re kind of behind the scenes with whatever means you can to interact, whether it is your own voice, whether it is your hands, whether it’s running a piece of equipment. Somehow the output is sound and hopefully expressive sound and when it comes to character what are meant to be vocals.

More recently, in 2022, it was revealed that [Respeecher](https://www.respeecher.com/) was used to provide [modern voice acting for Darth Vader](https://arstechnica.com/information-technology/2022/09/james-earl-jones-signed-darth-vader-voice-rights-to-disney-for-ai-use/).
Disney continues to use this technology to bring back to life a variety of characters whose actors are deceased or have had their voice change too significantly, with full permission from the associated actor or estate.

## Modern Voice Clones

By 2023, [SO-VITS](https://github.com/svc-develop-team/so-vits-svc) released, which offered speech-to-speech conversion not just for spoken audio, but also singing.
It's an open-source project, unlike Respeecher, and is freely usable by anyone with a recent GPU and enough VRAM.
As an extension to this work, Retrieval-based Voice Conversion, known as [RVC](https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI/blob/main/docs/en/README.en.md) for short, now offers the current state-of-the-art local speech-to-speech converter.

RVC has been responsible for a massive influx of AI voice covers of popular songs.
Combined with AI vocal stemming with tools such as [Ultimate Vocal Remover](https://ultimatevocalremover.com/), it becomes possible to make any voice sing any song.
There are even [tools](https://github.com/SociallyIneptWeeb/AICoverGen) that fully automate this process end-to-end, though the quality may suffer without additional adjustments by hand.

These voice cloners also work in real-time, with projects such as [RVC Realtime](https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI/blob/main/docs/en/README.en.md), [w-okada](https://github.com/w-okada/voice-changer/blob/master/README_en.md), and [deiteris' fork](https://rentry.co/forkvoicechangerguide), making it possible to converse with someone in real-time using a voice clone.
On a 3070 Ti, I can produce a voice clone guided by my voice, with fewer than 300 ms of processing latency added to my mic setup.
Frankly, I didn't believe that this technology would get this good within my lifetime and expected it to be relegated to the realm of [sci-fi](https://youtu.be/k3jHNzg0DKY) for the foreseeable future.

## My Experiments

For nearly a year, I have found myself obsessed over working with voice clone technology.
I have been experimenting to learn the ins and outs, the technical limitations, and the features on offer.
To date, I have trained over 220 voice clones using RVC V2, created using personally curated and cleaned data sets.

When you first hear a voice clone, be it of your own voice, your own performance, or that of a friend, there is a surrealism to it.
A standout for me was how RVC seemingly manages to preserve minor vocal nuances of the cloned performer in the AI voice, even if they were never provided by the input performer.
For instance, I have a friend with a habit of taking in a sharp breath in after speaking, and the voice model reproduces this even if the voice puppeteer doesn't do so.
It means that the performer needs to put in very little effort to produce an accurate impersonation, focusing primarily on pitch, energy, and accent rather than the little quirks.

It even captures the quirks of the recording hardware, with [plosives](https://en.wikipedia.org/wiki/Plosive) faithfully recreated if the model was trained on speech made without a [pop filter](https://en.wikipedia.org/wiki/Pop_filter).
Likewise, mic clipping, if present in training, is accurately reproduced when the input voice speaks loudly.
Voice models generated from low-quality equipment or infrastructure, such as from telephone calls, reproduce a performance that sounds just like that equipment.
Excitingly, you can even go the other way: you can create a voice model in a professional recording studio and then guide the performance casually with a lower quality microphone (I have intentions to do this for my own voice at some point in the future).
I was also impressed at how well voice clones reproduce complex voice filters, such as the ["squid voice"](https://youtu.be/w0W2Tt4fzSU) used in Splatoon or filters used to make any number of robot voices.

This tech enables all sorts of interesting uses, from getting an audiobook narrated by anyone you want, to real-time conversion of live TV speakers to have the voice of another, to AI covers of popular songs.
One of my uses has been to "AI restore" dialogue in old video games.
Pajama Sam stores all of its voice lines at merely 11 KHz, resulting in low-quality dialogue akin to the low pass filter used in phone calls.
Training a voice model on dialogue from [Pajama Sam: Games to Play on Any Day](https://www.sounds-resource.com/pc_computer/pajamasamgamestoplayonanyday/), which used voice lines recorded at 22 KHz, produces a high-quality voice model that can be driven by the original low-quality lines from previous games, effectively restoring the lost detail.
There are minor pronunciation issues present in some of the lines, a common shortcoming of RVC exacerbated by the low-quality input voice, but it serves as an interesting experiment, nevertheless.

https://youtu.be/pNfoCMh4ufU

For me personally, I have found the exploration enlightening on better understanding aspects of speech and vocals that I had never seriously considered before.
For instance, it is important for singers to perform within their vocal range.
AI voice models retain a comparable vocal range to the actual person, with singing beyond that range resulting in terrible croaking sounds or a fallback to the base model, producing an unconvincing clone.
While I was aware of vocal range and the need to transpose, I now understand this at an intuitive level, being able to use voice models to simulate working with a variety of vocalists at a level that historically would have been reserved for professional music producers.

Voice clones have also served as jumping off point for my developing other tangential skills such as singing, voice acting, impressionism, and music production.
Improving these skills helps me produce more interesting and convincing voice clones.
I can only imagine the things real pros, these skills already in hand, could accomplish by adding this tool to their repertoire.

Voice models work best when trained on dry vocal samples (where no effects have been applied to the audio).
When an AI cover is created, the same dry vocal style is reproduced.
In produced songs, singing is often processed to create a distinctive sound profile, and these effects must be accurately recreated if an "authentic" voice clone cover is to be made.
Working with voice clone models has given me more of an ear for these effects and, while I don't really have the tools for many of them, I have at times worked to reproduce aspects such as matching reverb levels or recreating fades.
As an aside, it's noteworthy that voice clones can draw out "autotuned" vocals more prominently than the original performance.

This tech also allows me to separate someone's vocal performance from their underlying voice.
It's the whole point of these tools: separating pitch, energy, and pronunciation into discrete, independent components, to be mapped onto the voice clone's timbre.
It can be enlightening to realize that what you like about someone's voice aesthetics is not how they sound but the way they say things to begin with.
Making this separation would not have been practical historically.

## Ethical and Legal Concerns

The action of cloning someone else's voice is a legal and ethical minefield, an ever-present elephant in the room.
Like many AI technologies, we are currently in a Wild West scenario, where public understanding and legislation lag far behind the state-of-the-art.

During the last US Presidential election, AI voice cloning was used to impersonate Joe Biden in New Hampshire, leaving voicemails encouraging voters in the primaries to, "save your vote for the November election."
In response, Joe Biden's [2024 State of the Union Address](https://www.whitehouse.gov/briefing-room/speeches-remarks/2024/03/07/remarks-of-president-joe-biden-state-of-the-union-address-as-prepared-for-delivery-2/) suggested an intent to ban voice cloned impersonations.
> Harness the promise of A.I. and protect us from its peril. 
> Ban A.I. voice impersonation and more!
> 
> ~Joe Biden

Later, the FCC explicitly [noted](https://www.fcc.gov/document/fcc-makes-ai-generated-voices-robocalls-illegal) that voice clone robocalls were illegal, just as all unsolicited robocalls already are.

Though explicit legislation does not currently exist, and I am not a lawyer, it is my impression that the vast majority of general AI voice cloning legal and ethical norms are appropriately covered by existing [personality rights](https://en.wikipedia.org/wiki/Personality_rights) law.

In the United States, at least, personality rights generally disallow [passing off](https://en.wikipedia.org/wiki/Passing_off) a work as being made or backed by the person whose likeness is used.
With that in mind, it is crucial to always disclaim an AI generated voice as such using clear labels.
Last year, YouTube added a [requirement](https://blog.youtube/inside-youtube/our-approach-to-responsible-ai-innovation/) for all videos on their platform to disclose the use of AI-generated content.
Further, personality rights generally protect defamation; it is certainly not appropriate to put words in someone's mouth to hurt their reputation.

Personality rights also have a far-reaching history disallowing the use of one's likeness in commercial scenarios, particularly of endorsements.
This suggests that it is illegal to use AI voice clones in a commercial work without those voice rights being licensed by the voice's owner.
Recently, Tom Hanks [warned](https://www.instagram.com/p/Cx2MsH9rt7q/) of a deepfake using his likeness to promote a dental plan that he had no affiliation with, a clear violation of his personality rights. 

From an ethical point of view, it is also courteous to get permission from the voice owner before publishing anything with their likeness.
In lieu of being able to get in touch with them, removal upon request is best-practice, even if you are not strictly, legally obligated to do so.
High-profile misuse has damaged public perception of this technology; being a good steward of this technology is important to showcase positive, responsible uses of the tech.

There are also questions on the legality of the training data sourced.
OpenAI [maintains](https://openai.com/blog/openai-and-journalism) that the training of models (at least their text models) using publicly available data falls under fair use, being sufficiently transformative of the source material.
US legal precedent indicates that AI models [cannot be copyrighted](https://www.reuters.com/legal/ai-generated-art-cannot-receive-copyrights-us-court-says-2023-08-21/).
However, A.I. Hub, a Discord server where voice models, primarily of vocalists, were shared, was shut down by Discord under copyright grounds (likely because copyrighted music, performances, and training data were also being shared).
The moderators of that community believe that the models, being trained on but not directly containing the original copyrighted vocals, are not protected by that copyright.
It remains to be seen how future issues of voice cloning will be handled, but it is clear that we live in an exciting new time to see how these new technologies shake out.