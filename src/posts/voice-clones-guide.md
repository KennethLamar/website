---
title: "A Guide to Voice Clones"
date: "2025-02-03"
metaDesc: "A master guide to the creation and use of voice clones."
tags:
  - personal
  - AI
---

I have been experimenting with [RVC](https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI/blob/main/docs/en/README.en.md) extensively, which provides tools for voice conversion from audio files as well as real-time conversions.
For a primer on voice cloning, you can read [my blog post on the matter](/posts/ai-voice-cloning.md).
Below I document what I consider best-practice to maximize voice clone quality while respecting the rights of voice owners.

## Training Tips
- Background sounds should be absent or removed. [UVR](https://ultimatevocalremover.com/) provides vocal separators, which tend to also work well for removing background noise, not only music. `MDX-Net Kim Vocal 1` is a good model starting point for vocal separation.
- All vocals from other people should be removed, isolating to a single speaker. If you intentionally mix datasets, you can create interesting vocal hybrids, but that task is better suited through the use of model merging.
- All non-vocal sounds should be removed. Non-verbal vocalizations can be kept and often enhance the voice quality for cases when such vocalizations are attempted by a voice puppeteer (though such vocalizations are often poor quality regardless).
- Reverb should be removed in the training set. You can do so with an AI reverb remover such as those offered by [UVR](https://ultimatevocalremover.com/). `UVR-DeEcho-DeReverb` has worked well for me. Ideally, the dataset doesn't have any reverb to begin with.
- Unless explicitly desired, clips with additional voice processing should typically be excluded from the training data set.
- All clips should be to the same quality. Mixing recordings produced with radically different microphones, different vocal effects applied, or various levels of file compression, as examples, will result in a model that sometimes picks from different qualities due to minor differences perceived in the audio to convert.
- If you are recording your dataset rather than using existing data, try to cover as broad a range of speaking styles as possible. This means recording both speaking and singing, covering the performer's complete vocal singing range, varying loudness, etc.
- Avoid using impersonation performances or fake accents in training, as they can contaminate the data set (unless those vocal stylings are the intention). The final voice clone will trend toward the same style. For instance, voices captured from audiobooks sound like they're reading.
- If possible, ensure all performances were recorded at the same gain levels, to ensure accurate loudness behaviors in the cloned voice.
- 10 minutes of training data may be adequate in some cases, 30 minutes often results in a very convincing voice, and 1 hour or more typically offers excellent voice clone quality. Providing much more than an hour results in diminishing returns, taking longer to train a voice without appreciable quality improvements. Note that low quality voices require less training data. For instance, it is not worth gathering more than 30 minutes of phone call quality data, while professional studio audio could benefit from an hour or more of input audio.
- Truncating extended periods of silence from recordings keeps the training data compact and focused, resulting in faster training as the model doesn't need to train on silence. [Audacity](https://www.audacityteam.org/) has a [tool](https://manual.audacityteam.org/man/truncate_silence.html) for this.
- Whenever possible, listen to every second of your training data before starting the training process. This will give you the opportunity to trim out sections with background noise, multiple speakers, or any other issues.
- To determine when to stop training, use TensorBoard. Go to the RVC folder and run `python3 -m tensorboard.main --logdir=logs`. Open the browser page for TensorBoard, go to scalers, and turn smoothing all the way up. Under loss, go to the last page of graphs and find `loss/g/total`. The inflection point in that graph, where the loss is no longer decreasing, is the right point to stop training. I save in 5 epoch intervals so I can keep only the optimal model, before the point of overtraining, deleting or archiving the rest. 

## Conversion Tips
- Louder input audio tends to work better for pronunciation quality. If the input is too quiet, then the voice starts to sound mumbly. If possible, amplify the input performance before processing, then reduce the converted output audio back down to get it in line with the original loudness. This is particularly important in cases where the audio input was reduced in post rather than being an actual quieter performance.
- Restrict input audio to single speaker. If you have multiple, then the pitch detector tends to bounce between the pitch of the most prominent speakers. While imperfect, you can often separate multiple vocal performances using a vocal remover tuned for karaoke in [UVR](https://ultimatevocalremover.com/). I've had good luck with `5_HP-Karaoke-UVR`. If the voices have any sort of stereo separation, you could also use tools such as Adobe Audition's [Center Channel Extractor](https://helpx.adobe.com/audition/using/stereo-imagery-effects.html) effect, which (unlike the name would suggest) can target sound from any phase of the audio, not just the center.
- Mispronunciations are minimized by speaking loudly, slowly, and clearly. This is often unrealistic depending on the performance you are attempting.
- Do not attempt non-verbal vocalizations. These sounds are too complex for the pitch and pronunciation detectors to follow. Common examples include laughter and sneezes.
- Using noise filters on the input, such as NVIDIA Broadcast, tends to result in the beginning syllable of sentences being cut off or mispronounced. Avoid them or draw out the sound as needed.

## Sourcing Audio Training Data

### Disclaimer

A persons' voice is a deeply personal part of themselves.
Stealing it wholesale is generally a bad idea.
[Don't be a sea witch](https://youtu.be/5Ru-gDcVNyU).
If you want to make a voice clone of a person or character privately, that's one thing, but if you want to post such a work publicly, it's best to seek out permission if possible, remove if asked, and examine (and respect) if they already have a preference.
Checking the [Uberduck blacklist](https://docs.google.com/spreadsheets/d/1n6KZpcahyckjmzgsH90ghgNs5pcEQ57baavbjAI_ed8/) is a good starting point for the latter.
If you wish to use a voice clone commercially, to make money, then you should have a contract with the original performer that explicitly permits this use.
On that front, BeyondWords provides an excellent [contract template](https://beyondwords.io/ai-voice-ethics/) suitable for TTS voice clones, easily adaptable to suit voice conversion tools as well.
Always clearly label your use of AI and respect the person's [personality rights](https://en.wikipedia.org/wiki/Personality_rights).
Most of my upcoming suggestions are only suitable for private use, for the development of skills making and using voice clones, though there are some interesting exceptions.

### Downloading Pre-Made Models

The easiest way, by far, to get a trained model, is to download one that someone else already made for you.
There are repositories such as [voice-models.com](https://voice-models.com/) that provide such downloads.
The issue with using these voices is the complete lack of control over the training process.
The vast majority of the voices on the platform do not take into account the best-practice training tips I suggest above, often using too little training data as input, using noisy data, overtraining the model, and various other oversights.
Ultimately, there is no way to know if a model found online is any good until you download it and try it for yourself.

### Vocal Stems

If you're trying to create a voice clone of a singer, it can be tempting to download fully-produced songs, then use a vocal isolation tool such as [UVR](https://ultimatevocalremover.com/).
That technique works in the general case, but it should be used solely as a last resort.
More desirable is to hunt down dry vocal stems.
These are the original vocalist recordings, with no processing or music mixed in.
They can be hard to come by, typically only showing up in stem leaks online, but they provide a meaningful improvement to voice clone quality when available.

Music rips from Guitar Hero and Rock Band typically include separated vocals as well.
These are almost never dry, but they serve as a better starting point than relying on an AI tool to separate the voice for you. 

### Video Game Rips

Video games are an excellent resource for high quality voice lines.
Newer, larger games tend to have a ton of dialogue for their characters, easily passing the 1 hour threshold suggested for the best quality clones.
For instance, Red Dead Redemption 2 [reportedly](https://www.vulture.com/2018/10/the-making-of-rockstar-games-red-dead-redemption-2.html) has about 500,000 lines of dialogue.
Zagreus from the game Hades has over 5 hours of dialogue alone.
Mixing often happens in-game, so the base lines are relatively clean and clear of music, background sound, or other distractions that would require filtering.
Character tie-in games that use the original actors are quite useful here as well, to source voices that are otherwise too difficult to isolate in other media.

You can often get access to these files via [The Sounds Resource](https://www.sounds-resource.com/), an online repository of sound rips from games.
If they're missing lines you want, you can rip them from the games yourself (the techniques vary for each game), then, since you're going through the painstaking work of organizing lines already, you can contribute them back to The Sounds Resource. 

### Audiobooks and Podcasts

Audiobooks and podcasts have the benefit of being long-form formats to capture someone's voice.
Focus on single-speaker sources without background music or sound effects.
The issue with these sources is that they often have poor vocal range, particularly if the speaker has a relatively monotone way of speaking; if you aren't careful when recording input lines to convert, you can easily fall outside of the voice clone's range.
I've also found that, if the audiobook narrator sounds like they're reading, the voice clone will often sound like they're reading as well.

#### LibriVox

[LibriVox](https://librivox.org/) is a community project to provide free, public-domain audiobooks of public-domain books.
When a creator provides their work as public-domain, they release all copyrights to the work.
What's interesting here is that this means you can legally clone voices contributed to this project and even use them commercially.
You only need to worry about rights that the narrators cannot release, such as [personality rights](https://en.wikipedia.org/wiki/Personality_rights).

It's worth keeping in mind that most of these books were narrated before voice cloning technology was any good; most of the readers may not realize that their voices could be used in this way.
For this reason, one should still exercise caution when attempting to use the audiobooks as a dataset and respect the wishes of the readers out of courtesy.

Due to the community-contributed nature of the works, most speakers are of very low quality.
You will need to sift through the various recordings to find voices you like at a reasonable quality standard.
I find it helpful to search for recommended reader voices suggested on Internet forums as a starting point.

### Mozilla Common Voice

[Common Voice](https://commonvoice.mozilla.org/) is a community-driven effort to provide high quality annotated speech datasets for use in the development of speech AI technologies, such as TTS and transcription.
All audio is released under a permissive [CC0](https://creativecommons.org/public-domain/cc0/) license, which effectively serves as a public-domain license and permits commercial use of the data, just like LibriVox.
Unlike LibriVox, the speakers in this dataset explicitly understand that a core use of the audio is AI models and research.

The data is freely available for download, but it comes with some major caveats in terms of quality and quantity of data.
Most audio is recorded using low-quality laptop microphones in noisy rooms.
Furthermore, any given speaker tends to have recorded no more than a minute or two of audio, which is insufficient for our use.
One could use this dataset to create a diverse vocal hybrid or focus on the voices with the longest recording sessions.
There are a few voices that reach the threshold of enough audio at high enough quality for use, but you'll need to download the full English dataset and organize them by speaker ID to track them down.

### Twitch

The [Just Chatting](https://www.twitch.tv/directory/category/just-chatting) section on [Twitch](https://www.twitch.tv/) can be a good resource for finding voices to clone.
Top creators tend to use high-quality microphones that make correspondingly high-quality voice clones possible.
They also spend lots of time yapping on the Internet.
You can find a trove of audio data if the creator is providing past broadcasts to view on demand, and they can be downloaded trivially via [yt-dlp](https://github.com/yt-dlp/yt-dlp), and as audio only using the `-x` flag.

Almost every professional streamer will have some sort of background music to keep things lively.
For our purposes, this is undesirable but can be removed.
However, there's a clever trick to getting clean spoken audio: In the last several years, streamers on Twitch have gotten DMCA takedown notices for using copyrighted audio in their streams.
Twitch now has strict [guidelines](https://www.twitch.tv/p/en/legal/community-guidelines/music/) on the use of music on stream.
In practice, copyright owners have only targeted VODs.
In response to this, Twitch permits streaming with [two separate tracks](https://obsproject.com/kb/twitch-vod-track-guide), a live track, which can (for now) contain copyrighted audio, and a VOD track, which is often music-free.
We can leverage this to capture raw audio of the streamer's voice, then trim out elements such as sound effects and keyboard noises.

### Discord Calls

If you want to record your friends, nothing beats the convenience of a Discord call.
You don't need to pester them to set up a microphone recording; just get them to join a call with [Craig](https://craig.chat/).
Craig provides multi-track voice recording for Discord.
You can set up your own instance of the bot easily using a Docker container that I put together [here](https://github.com/tomich/craig/pull/1).

Interestingly, while the [Discord developer policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy) explicitly disallows the collection of *message content* to train AI models, there is no such rule about voice data.
Thus, your main legal concern is getting the consent of your friends, not just for the creation of the model but also for recording the conversation itself (lest you run afoul of wiretapping laws).

The main issue with this technique is that Craig receives audio in the form processed by Discord.
That means the voice recordings will be affected by any processing the user has turned on, such as auto-gain, Krisp background noise suppression, noise gates, etc. as well as cutouts from network issues.
Audio will be compressed to the bitrate used by Discord, but even free tier Discord servers tend to use a high enough bitrate to achieve [transparency](https://en.wikipedia.org/wiki/Transparency_(data_compression)) for most voices.
I've also noticed slight audio artifacts around 16KHz on all recordings, visible in spectrograms.
They are faithfully reproduced by the voice clones, but I haven't been able to recognize them when listening.

### Text-To-Speech Voices

Text-to-speech has the benefit of scale: it is trivial to generate hours of audio data.
We can leverage that for the production of voice clones.
By providing reading content to a TTS system, we can produce an arbitrarily large training set to convert the text conversion model into a speech conversion model.
The generated audio should be as varied as possible, adjusting pitch, emotion, etc. controls as made available to the specific speech engine.
Cloning earlier speech technologies can provide a distinct and interesting voice clone sound.
I've had particular interest in voices such as the Speak & Spell toy, which used the Texas Instruments LPC [Speech Chip](https://en.wikipedia.org/wiki/Texas_Instruments_LPC_Speech_Chips) commonly added to consumer electronics in the late '70s and '80s, as well as the classic [MacInTalk](https://en.wikipedia.org/wiki/PlainTalk) voices used in '80s Macintosh computers (and which still exist in modern macOS today).

## Settings

The various RVC tools provide a variety of settings, but these settings are poorly documented, at least among English speakers.
In an effort to remedy this, I have put together a detailed explanation for every setting, what each setting is called for each tool, and what it does to improve the final conversion quality.

| [WebUI](https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI/blob/main/docs/en/README.en.md) | [Realtime](https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI/blob/main/docs/en/README.en.md) | [w-okada](https://github.com/w-okada/voice-changer/blob/master/README_en.md) | Description |
| - | - | - | - |
| Transpose | Pitch settings | TUNE | Offsets the input vocal pitch by some number of semitones. This should be adjusted until the cloned voice matches the typical pitch of the target speaker. Every multiple of 12 setting adjusts the voice pitch by an octave. Using whole octaves is primarily used to ensure the cloned voice sings in the same key as the input performance. |
| N/A | Response threshold | S. Threshold | Controls the noise gate. Any sound below the threshold is suppressed. This is used to prevent background noise and hiss from being turned into strange mumbling. |
| Search feature ratio | Index rate | INDEX | When an index file is provided, this slider augments the target voice by preserving more of its accent and less of the input voice (to reduce tone leakage). This is particularly useful for voices trained with little training data and a low epoch count. If set too high, it can cause strange pronunciation artifacts. I usually find something around 0.3-0.5 to sound good, but it varies by voice model. |
| Pitch extraction algorithm | Pitch detection algorithm | F0 Det. | The algorithm used to determine the pitch of the input voice, which is then used to drive the pitch of the cloned voice. Different algorithms are better at different things. `rmvpe` is the current state-of-the-art and works fastest and usually with the highest quality. |
| Volume envelope scaling | Loudness factor | N/A | How little to preserve the loudness of the input performance. At 0, the loudness of the cloned voice should match the loudness of the input voice. At 1, the cloned voice will always be at full loudness. 0 is useful if you want to distinguish between whispers, talking, screaming, etc. 1 is useful to have the cloned voice always speak loudly and clearly, as loud as the loudest things it was trained on (which can have artifacts such as mic clipping depending on the training set). Values in-between provide partial volume control biased toward being louder, the closer you get to 1. |
| Protect voiceless consonants | N/A | Protect  (advanced setting) | Reduces artifacts caused by consonants and breathing sounds. Higher levels provide more protection at the cost of voice cloning accuracy.
| N/A | Sample length | CHUNK | Realtime voice changers in RVC work by sending small chunks of audio for quick conversion, then stitching them together. Longer sample lengths feed in longer chunks, making the stitches less obvious and reducing GPU requirements but increasing output latency. On a low end GPU, setting this too low will make the GPU unable to keep up and produce stutters. On a high end GPU, setting this too low will cause warbling as an artifact of stitching many overly-short chunks together. 
| N/A | Extra inference time | EXTRA | How much old audio to load into each chunk. The extra context usually improves voice quality for the generated chunk but is more demanding for the GPU. |
| N/A | Input noise reduction | NOISE | Attempts to remove non-speech background noise from the input to prevent sounds from being turned into strange mumbling. |
| N/A | Number of CPUs | N/A | The number of CPUs used for the harvest pitch algorithm. Only relevant when `harvest` is chosen as the pitch detection algorithm. |
| N/A | Fade length | overlap (advanced setting) | The length between chunks to crossfade together. Longer reduces warbling artifacts at the cost of increased latency. |