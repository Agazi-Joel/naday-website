"""Render the two-host podcast script to an MP3 with ElevenLabs (Eleven v3).

This is the "NotebookLM/Genspark-style" audio. It's optional: if the key or
voices aren't set, the pipeline just skips it and still gives you every text
output. Eleven v3 (text-to-dialogue) is in alpha, so if ElevenLabs changes the
endpoint, this is the one place to adjust.
"""

import requests

from . import config

DIALOGUE_URL = "https://api.elevenlabs.io/v1/text-to-dialogue"


def render_podcast(script: list[dict], out_path) -> bool:
    """Turn [{speaker, text}, ...] into an MP3. Returns True on success."""
    caps = config.capabilities()
    if not caps["audio"]:
        return False

    voice_for = {
        "HOST_A": config.ELEVENLABS_VOICE_A,
        "HOST_B": config.ELEVENLABS_VOICE_B,
    }
    inputs = [
        {"text": turn["text"], "voice_id": voice_for.get(turn["speaker"], config.ELEVENLABS_VOICE_A)}
        for turn in script
        if turn.get("text")
    ]
    if not inputs:
        return False

    try:
        resp = requests.post(
            DIALOGUE_URL,
            headers={
                "xi-api-key": config.ELEVENLABS_API_KEY,
                "content-type": "application/json",
            },
            json={"inputs": inputs, "model_id": "eleven_v3"},
            timeout=600,
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        print(f"  (audio step failed, continuing without MP3: {exc})")
        return False

    with open(out_path, "wb") as fh:
        fh.write(resp.content)
    return True
