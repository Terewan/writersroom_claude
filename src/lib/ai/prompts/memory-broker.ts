interface MemoryBrokerPromptInput {
  messageContent: string;
  agentName: string;
  topic: string;
}

export function buildMemoryBrokerPrompt({ messageContent, agentName, topic }: MemoryBrokerPromptInput): string {
  return `You are a memory extraction system for a TV writer's room. Your job is to read a single message from a discussion and extract any useful knowledge worth remembering.

## Context
Discussion topic: ${topic}
Message author: ${agentName}

## Message to Analyze
${messageContent}

## Extraction Rules

1. Extract **0 to 3** knowledge entries from this message. Quality over quantity — most messages will yield 0-1 entries.
2. Only extract genuinely useful information that would be valuable to recall in future discussions. Skip filler, pleasantries, and vague opinions.
3. Focus on these categories:
   - **character**: Character names, traits, backstory details, relationship dynamics, arc decisions
   - **plot**: Story beats, structural decisions, scene ideas, pacing notes, act breaks
   - **world**: Setting details, rules of the world, time period, locations, technology, culture
   - **theme**: Thematic statements, motifs, tonal agreements, what the show is "about"
   - **dialogue**: Specific dialogue lines proposed, voice notes, catchphrases, speech patterns

4. For each entry, assign an **importance** score from 1-10:
   - 1-3: Minor detail, nice-to-know (e.g., "maybe the bar should have neon lighting")
   - 4-6: Meaningful creative detail (e.g., "the protagonist grew up in foster care")
   - 7-9: Core creative decision (e.g., "the central relationship is a slow-burn rivalry")
   - 10: Foundational premise (e.g., "the show is set in a near-future where memory is a commodity")

5. If the message is purely conversational (agreements, transitions, generic reactions) with no extractable knowledge, return an empty entries array.

## Required Output Format

Respond with a JSON object and nothing else:

{
  "entries": [
    {
      "category": "<character | plot | world | theme | dialogue>",
      "keywords": ["<keyword1>", "<keyword2>", ...],
      "summary": "<1-2 sentence summary of the knowledge>",
      "importance": <1-10>
    }
  ]
}

If there is nothing worth extracting, respond with:

{
  "entries": []
}`;
}
