interface ProposalExtractorPromptInput {
  recentMessages: Array<{ agentName: string; content: string }>;
  category: "character" | "beat" | "bible";
  topic: string;
  approvedTitles?: string[];
}

export function buildProposalExtractorPrompt({ recentMessages, category, topic, approvedTitles }: ProposalExtractorPromptInput): string {
  const conversationText = recentMessages
    .map((m) => `[${m.agentName}]: ${m.content}`)
    .join("\n\n");

  const categoryInstructions: Record<string, string> = {
    character: `Extract character definitions. For each character proposed or discussed in detail, capture:
- **name**: The character's name
- **role**: Their role in the story (protagonist, antagonist, supporting, recurring)
- **traits**: Key personality traits (array of strings)
- **backstory**: Relevant backstory details the writers discussed
- **arc**: The character's intended arc or transformation
- **relationships**: Any relationships to other characters mentioned

Shape the \`proposed_content\` as:
{
  "name": "<string>",
  "role": "<string>",
  "traits": ["<string>", ...],
  "backstory": "<string>",
  "arc": "<string>",
  "relationships": ["<string>", ...]
}`,

    beat: `Extract story beats. For each concrete story moment or plot point the writers converged on, capture:
- **title**: A short label for the beat
- **description**: What happens in this beat (2-3 sentences)
- **emotional_tone**: The emotional register of this beat (e.g., "tense", "hopeful", "devastating")
- **characters_involved**: Which characters are in this beat
- **act_placement**: Where in the story this beat belongs, if discussed (e.g., "cold open", "act 2 midpoint", "climax")

Shape the \`proposed_content\` as:
{
  "title": "<string>",
  "description": "<string>",
  "emotional_tone": "<string>",
  "characters_involved": ["<string>", ...],
  "act_placement": "<string or null>"
}`,

    bible: `Extract show bible entries. For each world-building rule, tone guide, or structural decision the writers agreed on, capture:
- **section_type**: The type of bible section (e.g., "premise", "tone", "world_rules", "structure", "themes", "visual_style")
- **title**: A clear title for this section
- **content**: The actual content of the bible entry — a concise, authoritative statement of what was decided

Shape the \`proposed_content\` as:
{
  "section_type": "<string>",
  "title": "<string>",
  "content": "<string>"
}`,
  };

  const approvedSection = approvedTitles && approvedTitles.length > 0
    ? `\n## Already Approved (DO NOT re-propose)\n${approvedTitles.map((t) => `- ${t}`).join("\n")}\n`
    : "";

  return `You are a proposal extraction system for a TV writer's room. The orchestrator has flagged that the writers have reached a point where a concrete "${category}" proposal can be captured from their discussion. Your job is to distill their conversation into structured proposals for the showrunner to review.

## Discussion Topic
${topic}

## Proposal Category: ${category.toUpperCase()}
${approvedSection}
## Recent Conversation
${conversationText}

## Extraction Instructions

${categoryInstructions[category]}

## Rules

1. Only extract proposals where the writers have made **concrete, specific suggestions** — not vague ideas or questions still being debated.
2. **Extract exactly ONE proposal** — the single best synthesis of the writers' discussion. If multiple writers contributed, merge their ideas into one coherent proposal. If they proposed competing alternatives, pick the strongest one.
3. The proposal needs a clear **title** (short, descriptive) and **description** (1-2 sentences summarizing the proposal in plain language).
4. Capture the spirit of what the writers intended, even if they didn't articulate every field explicitly. Use the conversation context to fill in reasonable details, but do not invent major elements the writers never discussed.
5. **Showrunner Authority:** The Showrunner is the boss. If the Showrunner makes a definitive declarative statement (e.g., "His name is X"), treat this as the winning proposal and override any writers who disagreed. If the Showrunner only asked a question (e.g., "What do you think of X?"), then weigh all the writers' opinions normally.
6. **Never re-propose already-approved items.** If a character, beat, or bible entry is listed under "Already Approved", do not extract it again — even if writers are still referencing it. Only extract genuinely NEW proposals.

## Required Output Format

Respond with a JSON object and nothing else:

{
  "proposals": [
    {
      "category": "${category}",
      "title": "<short descriptive title>",
      "description": "<1-2 sentence plain-language summary>",
      "proposed_content": { ... }
    }
  ]
}

If no concrete proposals can be extracted (the conversation was too vague or still unresolved), respond with:

{
  "proposals": []
}`;
}
