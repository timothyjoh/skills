# Eval: storytime

## Triggers
- "Storytime!"
- "Read this story aloud"
- "Make an audio drama of this"
- "Turn this into a multi-voice story"

## Test Cases

### Case 1: Script conversion from prose
- **Input:** "Convert this story into a storytime script: 'The old wizard spoke softly. \"You must go,\" he said. The narrator described the dark forest ahead.'"
- **Expect:** Converts prose to tagged script format with [NARRATOR] for descriptions and [CHARACTER] for dialogue. One tag per line, faithful to original text.
- **Verify:** Output uses correct `[TAG] text` format, narration goes to [NARRATOR], dialogue goes to character tags
- **Type:** llm-judge

### Case 2: Cast file creation with appropriate voices
- **Input:** "Cast voices for a story with: a narrator, a young British woman, an old villain, and a quirky sidekick"
- **Expect:** Creates JSON cast file mapping character names to appropriate Inworld voices (e.g., Elizabeth for narrator, Wendy for Rita, Hades for villain, Julia for quirky sidekick)
- **Verify:** Voice selections match character descriptions based on the Inworld voice catalog
- **Type:** llm-judge

### Case 3: Full pipeline knowledge
- **Input:** "I have a story.script and cast.json ready. How do I render?"
- **Expect:** Knows the render command: `scripts/storytime.sh story.script cast.json -o story.mp3`, understands pause flag for pacing, knows to deliver via message send with filePath
- **Verify:** Correct script path, syntax, and delivery method
- **Type:** llm-judge

### Case 4: Pacing recommendations
- **Input:** "This is a bedtime story for kids" vs "This is a fast action scene"
- **Expect:** Recommends `--pause 600` for bedtime (slower pace) and `--pause 250` for rapid dialogue
- **Verify:** Pacing recommendations match the documented guidelines
- **Type:** llm-judge

## Quality Criteria
- [ ] Correctly converts prose to tagged script format (one tag per line, faithful to text)
- [ ] Matches Inworld voices to character descriptions appropriately
- [ ] Knows the full pipeline: script → cast → render → deliver

## Anti-Patterns
- Rewriting the story instead of just tagging it for voices
- Assigning voices that don't match character descriptions
- Forgetting to split long narration into multiple short [NARRATOR] lines
