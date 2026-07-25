"""Turn a YouTube link (or local audio file) into a plain-text transcript.

Strategy, cheapest first:
  1. If the video already has captions, pull them with yt-dlp (free, fast).
  2. Otherwise download the audio and transcribe with Whisper (needs OPENAI_API_KEY).

You can also pass a local audio/video file path instead of a URL.
"""

import re
import subprocess
import tempfile
from pathlib import Path

from . import config


def _run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True)


def _clean_vtt(vtt: str) -> str:
    """Strip WEBVTT timestamps/markup and collapse the rolling-caption dupes."""
    lines: list[str] = []
    for raw in vtt.splitlines():
        line = raw.strip()
        if not line or line == "WEBVTT" or "-->" in line:
            continue
        if line.startswith(("Kind:", "Language:", "NOTE")):
            continue
        line = re.sub(r"<[^>]+>", "", line)  # inline <c> timing tags
        line = re.sub(r"\s+", " ", line).strip()
        if line and (not lines or lines[-1] != line):
            lines.append(line)
    # de-dup consecutive repeats that survive across cue boundaries
    deduped: list[str] = []
    for line in lines:
        if not deduped or deduped[-1] != line:
            deduped.append(line)
    return " ".join(deduped)


def _fetch_captions(url: str, workdir: Path) -> str | None:
    """Return caption text if the video has (manual or auto) English captions."""
    out = workdir / "subs"
    _run([
        "yt-dlp", "--skip-download",
        "--write-sub", "--write-auto-sub",
        "--sub-lang", "en.*", "--sub-format", "vtt",
        "-o", str(out) + ".%(ext)s", url,
    ])
    vtts = sorted(workdir.glob("subs*.vtt"))
    if not vtts:
        return None
    text = _clean_vtt(vtts[0].read_text(encoding="utf-8", errors="ignore"))
    return text or None


def _download_audio(url: str, workdir: Path) -> Path:
    """Download best audio as m4a (needs ffmpeg on PATH)."""
    out = workdir / "audio.%(ext)s"
    _run([
        "yt-dlp", "-f", "bestaudio",
        "--extract-audio", "--audio-format", "m4a",
        "-o", str(out), url,
    ])
    audio = sorted(workdir.glob("audio.*"))
    if not audio:
        raise RuntimeError("Could not download audio. Is ffmpeg installed?")
    return audio[0]


def _whisper(audio_path: Path) -> str:
    """Transcribe an audio file with Whisper via the OpenAI API."""
    if not config.OPENAI_API_KEY:
        raise RuntimeError(
            "This video has no captions, so we need to transcribe the audio. "
            "Set OPENAI_API_KEY in .env (or provide a video that has captions)."
        )
    from openai import OpenAI

    client = OpenAI(api_key=config.OPENAI_API_KEY)
    with open(audio_path, "rb") as fh:
        result = client.audio.transcriptions.create(model="whisper-1", file=fh)
    return result.text


def get_transcript(source: str) -> str:
    """Main entry: `source` is a YouTube URL or a local audio/video file path."""
    local = Path(source)
    if local.exists():  # a file was handed to us directly
        return _whisper(local)

    with tempfile.TemporaryDirectory() as tmp:
        workdir = Path(tmp)
        captions = _fetch_captions(source, workdir)
        if captions and len(captions) > 400:  # got usable captions
            return captions
        # No captions -> download + transcribe
        audio = _download_audio(source, workdir)
        return _whisper(audio)
