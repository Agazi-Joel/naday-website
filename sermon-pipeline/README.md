# Naday Sermon Pipeline

Run a sermon (YouTube link or a recording) through one command and get back:

- **`sermon.md`** — the full sermon rewritten to read well (edited for flow, not verbatim, faithful to the message)
- **`summary.txt`** — a short summary
- **`captions.txt`** — social captions for Instagram, Facebook, X, and WhatsApp, plus the scriptures referenced
- **`podcast.txt`** — a two-host, conversational podcast script with emphasis cues
- **`podcast.mp3`** — that script rendered as an expressive two-voice podcast *(only if ElevenLabs is configured)*

This is v1: designed to work now and be fine-tuned later. The editorial voice
lives in one place (`pipeline/config.py` → `HOUSE_STYLE`) so you can dial in the
Naday style over time without touching the plumbing.

## Setup

```bash
cd sermon-pipeline
pip install -r requirements.txt          # Python 3.10+
# For videos without captions you also need ffmpeg on your PATH.
cp .env.example .env                      # then fill in your keys
```

## Keys — the pipeline degrades gracefully

| Key | What it unlocks | Required? |
|-----|-----------------|-----------|
| `ANTHROPIC_API_KEY` | Everything text: sermon, summary, captions, podcast script | **Yes** |
| `OPENAI_API_KEY` | Whisper transcription — only used when a video has no captions | Optional |
| `ELEVENLABS_API_KEY` + two voice IDs | Renders the `podcast.mp3` (two expressive voices) | Optional |

With just the Anthropic key you get the full content set except the audio file.
Add ElevenLabs to also get the podcast MP3.

## Run

```bash
python run.py "https://www.youtube.com/watch?v=XXXXXXXX"
# or a local file:
python run.py ./recording.m4a
```

Outputs land in `output/<slug>/`.

## How it works

```
YouTube link ─▶ transcript ─▶ Claude (house style) ─┬─ sermon.md
                (captions,      one structured call   ├─ summary.txt
                 else Whisper)                        ├─ captions.txt
                                                      └─ podcast.txt ─▶ ElevenLabs ─▶ podcast.mp3
```

- **`pipeline/ingest.py`** — captions first (free), Whisper fallback.
- **`pipeline/process.py`** — the one Claude call that produces every text output.
- **`pipeline/audio.py`** — renders the podcast (ElevenLabs Eleven v3 dialogue).
- **`pipeline/config.py`** — keys, tunables, and the **house-style spec** to edit.

## Tuning the style

Edit `HOUSE_STYLE` in `pipeline/config.py`, **or** drop a `house_style.md` file
in this folder to override it wholesale. That single spec controls the sermon
edit, the podcast host dynamic, and the emphasis cues.

## Not built yet (deliberate next steps)

- Auto-posting to social platforms (Ayrshare or Meta Graph API)
- Auto-send to WhatsApp groups (official WhatsApp Cloud API Groups)
- An approval step before anything publishes

The pipeline produces the content; wiring up publishing is the next phase.

## Note on model choice

Defaults to `claude-opus-5` for best rewrite quality. For lower cost/faster runs
set `SERMON_MODEL=claude-sonnet-5` in `.env`.
