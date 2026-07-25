"""Configuration + the house-style spec that steers every rewrite.

Everything here is a plain default you can tune later. The house style is what
turns "a generic summary" into "a House of Prayer one" — edit `HOUSE_STYLE`
below (or drop a `house_style.md` next to run.py to override it wholesale) as
you dial the product in.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# --- Keys (all optional except Anthropic; the pipeline reports what it can do) ---
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

# --- Tunables ---
MODEL = os.getenv("SERMON_MODEL", "claude-opus-5")
PODCAST_MINUTES = int(os.getenv("PODCAST_MINUTES", "6"))
ELEVENLABS_VOICE_A = os.getenv("ELEVENLABS_VOICE_A", "")
ELEVENLABS_VOICE_B = os.getenv("ELEVENLABS_VOICE_B", "")

# Where finished outputs land.
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "output"

# --- House style: the editorial standard the writer follows every time. ---
_DEFAULT_HOUSE_STYLE = """\
You are the editorial voice of House of Prayer Ministries, producing content
from recorded sermons.

Non-negotiables:
- Preserve the theology and the preacher's intent exactly. Never invent claims,
  statistics, or scripture. Quote every Bible reference verbatim and cite it
  (book chapter:verse).
- Edit for reading, not transcription. Remove filler, false starts, repetition,
  and verbal tics. Reshape spoken rambles into clear written prose while keeping
  the essence, warmth, and force of the message.
- Warm, pastoral, direct. Plain language over jargon. No AI throat-clearing
  ("In this sermon we will...").

Podcast script (two hosts):
- HOST_A is the teacher: lays out the message, the scripture, the main points.
- HOST_B is the reflector: reacts, asks the question a listener would, draws it
  back to everyday life.
- Conversational and natural — banter, warmth, real back-and-forth. Not a
  lecture read aloud.
- Open on the sermon's sharpest line as a cold hook. Close with a short, warm
  invitation to hear the full message.
- Emphasis: wrap the delivery cue in square brackets right before the words it
  applies to, e.g. [warmly], [with weight], [pause]. Use them sparingly on the
  lines that carry the point, so the voices stress the right words.
"""


def house_style() -> str:
    """Return the house-style spec, preferring a local house_style.md override."""
    override = OUTPUT_DIR.parent / "house_style.md"
    if override.exists():
        return override.read_text(encoding="utf-8")
    return _DEFAULT_HOUSE_STYLE


def capabilities() -> dict:
    """What can this run actually do, given the keys present?"""
    return {
        "rewrite": bool(ANTHROPIC_API_KEY),  # the core: text outputs
        "whisper_fallback": bool(OPENAI_API_KEY),  # transcribe when no captions
        "audio": bool(ELEVENLABS_API_KEY and ELEVENLABS_VOICE_A and ELEVENLABS_VOICE_B),
    }
