#!/usr/bin/env python3
"""House of Prayer Ministries sermon pipeline — one command, one YouTube link, a full content set.

    python run.py "https://www.youtube.com/watch?v=..."
    python run.py path/to/local-recording.m4a

Outputs land in ./output/<slug>/:
    sermon.md         edited, readable full sermon
    summary.txt       short summary
    captions.txt      social captions (IG / FB / X / WhatsApp)
    podcast.txt       the two-host script (with emphasis cues)
    podcast.mp3       the rendered audio (only if ElevenLabs is configured)
    result.json       everything, machine-readable
"""

import json
import re
import sys

from pipeline import audio, config, ingest, process


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return (slug or "sermon")[:60]


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2

    source = sys.argv[1]
    caps = config.capabilities()

    if not caps["rewrite"]:
        print("ERROR: ANTHROPIC_API_KEY is not set. Copy .env.example to .env "
              "and add your key. (That key alone gets you all the text outputs.)")
        return 1

    print("Capabilities this run:")
    print(f"  - text outputs (sermon/summary/captions/script): yes")
    print(f"  - transcribe when no captions (Whisper): {'yes' if caps['whisper_fallback'] else 'no'}")
    print(f"  - render podcast MP3 (ElevenLabs): {'yes' if caps['audio'] else 'no'}")
    print()

    print("1/3  Getting transcript ...")
    transcript = ingest.get_transcript(source)
    print(f"     got {len(transcript):,} characters")

    print("2/3  Writing sermon, summary, captions, podcast script ...")
    result = process.process(transcript)

    out_dir = config.OUTPUT_DIR / slugify(result["title"])
    out_dir.mkdir(parents=True, exist_ok=True)

    (out_dir / "sermon.md").write_text(
        f"# {result['title']}\n\n{result['full_sermon']}\n", encoding="utf-8")
    (out_dir / "summary.txt").write_text(result["summary"] + "\n", encoding="utf-8")

    caps_txt = "\n\n".join(f"[{k.upper()}]\n{v}" for k, v in result["social_captions"].items())
    scriptures = "\n".join(f"- {s}" for s in result["scriptures"])
    (out_dir / "captions.txt").write_text(
        caps_txt + "\n\n[SCRIPTURES]\n" + scriptures + "\n", encoding="utf-8")

    script_txt = "\n\n".join(f"{t['speaker']}: {t['text']}" for t in result["podcast_script"])
    (out_dir / "podcast.txt").write_text(script_txt + "\n", encoding="utf-8")

    (out_dir / "result.json").write_text(json.dumps(result, indent=2), encoding="utf-8")

    print("3/3  Rendering podcast audio ...")
    if audio.render_podcast(result["podcast_script"], out_dir / "podcast.mp3"):
        print("     podcast.mp3 written")
    else:
        print("     skipped (set ELEVENLABS_API_KEY + two voice IDs to enable)")

    print(f"\nDone. Everything is in: {out_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
