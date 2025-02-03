---
title: "Stitching Dash Cam Footage"
date: "2022-04-26"
metaDesc: "Dash cams separate clips into short segments. With a simple script, I can seamlessly stitch them back together."
tags:
  - personal
  - notes
---

Since YouTube provides effectively unlimited video uploads, I have been archiving all of my dash camera footage there.
To prevent the chance of data corruption, dash cams often split long recordings into smaller files as they are recorded.
This way, if a file is corrupted, it only affects a small chunk rather than the entire recording.
My dash cam only supports chunks up to 10 minutes in size, far shorter than my typical drive.
For the sake of organization, I want my segments combined into a full-length trips so that I have one trip per video upload.
There are some solutions already available online, but none of the existing tools met my needs.
Implementing the desired segment joining was simple enough, so I wrote my own script.
At a broad level, it works by leveraging FFMPEG's concat feature.
It is tested on Windows, but should work on any platform with [FFMPEG](https://ffmpeg.org/) and Python 3.
I would have added YouTube upload API support as well, but [a policy](https://developers.google.com/youtube/v3/docs/videos/insert) established several years ago to cut down on spam forces all videos uploaded through the API to always be private.
The full script I wrote can be found below.

```python
"""This simple Python script is designed to seamlessly concatenate dash camera
footage segments into a single clip via FFMPEG.
"""

import os

# NOTE: Change these to suit your preferences.
# These folders and executables should exist before running the script.
# The input folder. All segments will be pulled from here.
INPUT_FOLDER = "./raw/"
# The output folder. All concatenated clips will be placed here.
OUTPUT_FOLDER = "./concat/"
# The full path to FFMPEG.
FFMPEG_PATH = "ffmpeg"
# The number of seconds expected between segments, which varies by dash cam
# configuration. The default is 2 minutes, just in case the 1 minute segment
# size I use somehow doesn't align perfectly in the saved dates.
SEGMENT_LENGTH = 2 * 60
# The extension of the individual video files.
EXTENSION = "TS"


# Prepare and run the FFMPEG concat command to combine all listed files.
def run_ffmpeg(files_list):
    num_files = len(files_list)
    # There are no files.
    if num_files == 0:
        # There is nothing to do.
        return
    # There is only one file.
    elif num_files == 1:
        # The name of the file is reused.
        # It effectively becomes a copy operation.
        path = OUTPUT_FOLDER + os.path.splitext(files_list[0].name)[0] + ".TS"
    # There is more than one file.
    else:
        # Naming has the first and last file names separated by a dash to
        # indicate the whole time range.
        path = OUTPUT_FOLDER + os.path.splitext(files_list[0].name)[0] + "-" \
               + os.path.splitext(files_list[-1].name)[0] + ".TS"
    # The clip we want to generate already exists.
    if os.path.isfile(path):
        # Do nothing. There is no need to redo already completed work.
        return
    # Set up our input file contents.
    # We need this to contain a list of files to concatenate,
    # as per FFMPEG concat documentation.
    file_contents = ""
    # Iterate over each file.
    for file in files_list:
        # Add the file to the list, in the right format for FFMPEG to parse.
        # https://trac.ffmpeg.org/wiki/Concatenate
        file_contents += "file '" + file.path + "'\n"
    # Write the contents to file.
    with open("./mylist.txt", "w+") as f:
        f.write(file_contents)
    # Run the actual command.
    os.system(FFMPEG_PATH + " -f concat -safe 0 -i mylist.txt -c copy " + path)
    return


def main():
    # Check the contents of the input folder, if it exists.
    with os.scandir(INPUT_FOLDER) as unsortedFiles:
        # Populate a list of all segments in the directory.
        files = []
        # Get each file from the iterator.
        # They are unsorted by default.
        for file in unsortedFiles:
            # Ignore non-video files.
            if not file.path.endswith("." + EXTENSION):
                continue
            files.append(file)
        # Sort the segments by name.
        # Since dashcam footage is named by timestamp,
        # this will effectively sort by date.
        files = sorted(files, key=lambda e: e.name)
        # This will be the date the current segment was modified.
        time = 0
        # This will be the date the previous segment was modified.
        old_time = 0
        # This is the list of all segments to concat with FFMPEG.
        files_list = []
        # Iterate over each segment.
        for file in files:
            # Set the old_time for the now-previous segment.
            old_time = time
            # Set the new time for the current segment.
            time = os.stat(file, follow_symlinks=False).st_mtime
            # If more than SEGMENT_LENGTH seconds have passed.
            # This segment is part of a new clip.
            if time > old_time + SEGMENT_LENGTH:
                # Run FFMPEG on the existing list of segments.
                run_ffmpeg(files_list)
                # Clear the list to prep for the next session of video segments.
                files_list.clear()
            # Add the segment to the list.
            files_list.append(file)
        # Run FFMPEG one final time, to make sure the last clip is concatenated.
        run_ffmpeg(files_list)


if __name__ == "__main__":
    main()
```