"""The brain: transcript -> edited sermon, summary, captions, podcast script.

One Claude call, structured JSON out. This is where the house style lives and
where 80% of the quality comes from.
"""

import json

import anthropic

from . import config

# JSON shape we force the model to return. Structured-output schemas can't use
# min/maxLength etc., so keep it to types + required + additionalProperties.
SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "title": {"type": "string"},
        "summary": {"type": "string"},
        "full_sermon": {"type": "string"},
        "scriptures": {"type": "array", "items": {"type": "string"}},
        "social_captions": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "instagram": {"type": "string"},
                "facebook": {"type": "string"},
                "x": {"type": "string"},
                "whatsapp": {"type": "string"},
            },
            "required": ["instagram", "facebook", "x", "whatsapp"],
        },
        "podcast_script": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "speaker": {"type": "string", "enum": ["HOST_A", "HOST_B"]},
                    "text": {"type": "string"},
                },
                "required": ["speaker", "text"],
            },
        },
    },
    "required": [
        "title", "summary", "full_sermon", "scriptures",
        "social_captions", "podcast_script",
    ],
}


def _prompt(transcript: str) -> str:
    return f"""\
Below is the raw transcript of a recorded sermon. Produce the full content set.

Deliverables:
- title: a short, compelling title for this message.
- summary: 3-5 sentences capturing the heart of the message.
- full_sermon: the sermon rewritten as clean, readable prose (Markdown). Edited
  for flow — NOT verbatim — but faithful to the whole message and its essence.
- scriptures: every Bible reference mentioned, quoted verbatim with citation.
- social_captions: one caption each for instagram, facebook, x, and whatsapp
  (whatsapp = a short warm note to a church group with a call to listen).
- podcast_script: a ~{config.PODCAST_MINUTES}-minute two-host conversation
  (HOST_A teacher, HOST_B reflector) covering the essence of the message, with
  emphasis cues in [square brackets] as described in the house style.

--- HOUSE STYLE ---
{config.house_style()}

--- SERMON TRANSCRIPT ---
{transcript}
"""


def process(transcript: str) -> dict:
    client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
    # Stream: the combined output (full sermon + script) is large, and streaming
    # avoids HTTP timeouts on long generations.
    with client.messages.stream(
        model=config.MODEL,
        max_tokens=32000,
        output_config={"format": {"type": "json_schema", "schema": SCHEMA}},
        messages=[{"role": "user", "content": _prompt(transcript)}],
    ) as stream:
        message = stream.get_final_message()

    if message.stop_reason == "refusal":
        raise RuntimeError("The model declined this request.")
    text = next(b.text for b in message.content if b.type == "text")
    return json.loads(text)
