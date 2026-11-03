## Run contract

Done when: `ffprobe -v error -show_entries format=duration:stream=codec_type,codec_name,width,height,pix_fmt -of json out/final.mp4` shows an h264 video stream at {{width}}x{{height}} in yuv420p or yuvj420p, an aac audio stream, and a duration from {{minSeconds}} to {{maxSeconds}} seconds; `out/poster.png` exists; BUILD-LOG.md has all 10 sections.
Stop and ask only if: the skill cannot work without a paid service, API key, account or login; an install would write outside this folder beyond package and model caches; or the skill cannot produce a video at all. Never merge, deploy, force push or delete data without asking.
Report with: Blocked on me (open questions) / Changed (files and folders created) / Found (check result lines, residual risks, and your verdict on the skill).
