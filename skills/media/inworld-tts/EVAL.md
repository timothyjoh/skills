# Eval: inworld-tts

## Triggers
- "Use Inworld TTS to say X"
- "Say this in Craig's voice"
- "I need a British narrator voice"
- "Use a premium voice for this"

## Test Cases

### Case 1: Basic voice selection
- **Input:** "Generate speech saying 'Welcome to the show' using a deep dramatic male voice"
- **Expect:** Selects an appropriate voice (Ronald for deep/dramatic male), uses the correct script `scripts/inworld-tts.sh`
- **Verify:** Picks Ronald or similar dramatic male voice, uses correct script path and syntax
- **Type:** llm-judge

### Case 2: Voice catalog knowledge
- **Input:** "What voices are available for a posh British female character?"
- **Expect:** Recommends Wendy (posh British female) from the voice catalog, may also suggest Elizabeth or Olivia with descriptions
- **Verify:** Recommends appropriate voices with accurate descriptions matching the catalog
- **Type:** llm-judge

### Case 3: Cost-aware routing
- **Input:** "Read this short sentence aloud"
- **Expect:** Suggests rita-tts for simple single-voice tasks instead of Inworld (~$5/million chars), unless premium quality or specific voice is needed
- **Verify:** Recommends rita-tts for simple tasks, explains cost difference
- **Type:** llm-judge

### Case 4: Piping long text
- **Input:** "Generate narration for this 2000-word story using Elizabeth's voice"
- **Expect:** Uses the pipe syntax (`echo "text" | scripts/inworld-tts.sh --voice Elizabeth`) for long text
- **Verify:** Uses pipe input method for long text, correct voice flag
- **Type:** llm-judge

## Quality Criteria
- [ ] Knows the voice catalog and can match voices to character descriptions
- [ ] Uses correct script path and CLI syntax
- [ ] Routes to rita-tts for simple tasks to save cost

## Anti-Patterns
- Using Inworld for simple single-voice TTS when rita-tts is free
- Recommending voices that don't match the requested characteristics
- Forgetting the `--voice` flag and defaulting to Olivia when a specific voice was requested
