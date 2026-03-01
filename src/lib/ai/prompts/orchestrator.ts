interface OrchestratorPromptInput {
  topic: string;
  agents: Array<{ id: string; name: string; role: string; expertise: string }>;
  recentMessages: Array<{ agentName: string; content: string }>;
  messageCount: number;
}

export function buildOrchestratorPrompt({ topic, agents, recentMessages, messageCount }: OrchestratorPromptInput): string {
  const agentList = agents
    .map((a) => `- ID: "${a.id}" | Name: ${a.name} | Role: ${a.role} | Expertise: ${a.expertise}`)
    .join("\n");

  const recentContext = recentMessages
    .map((m) => `[${m.agentName}]: ${m.content}`)
    .join("\n\n");

  const recentSpeakers = recentMessages.map((m) => m.agentName);
  const recentSpeakerNote = recentSpeakers.length > 0
    ? `Recent speakers (in order): ${recentSpeakers.join(" -> ")}`
    : "No messages yet — this is the opening of the discussion.";

  return `You are the orchestrator for a TV writer's room discussion. Your job is to read the conversation and decide which writer should speak next, based on natural conversational dynamics — NOT rigid round-robin rotation.

## Current Discussion Topic
${topic}

## Available Writers
${agentList}

## Conversation State
Messages so far: ${messageCount}
${recentSpeakerNote}

## Recent Messages
${recentContext || "(No messages yet — pick who should open the discussion.)"}

## Your Decision Criteria

1. **Relevance**: Who has the most relevant expertise for the current thread of conversation? If someone just raised a character question, the character specialist should probably respond.
2. **Freshness**: Who hasn't spoken recently and might have a valuable perspective to add? Avoid letting the same 1-2 voices dominate.
3. **Conversational flow**: Does the last message ask a direct question, challenge someone's idea, or open a new thread? Route accordingly.
4. **Natural dynamics**: Real writer's rooms have interruptions, rebuttals, and building-on. Pick the agent whose response would feel most natural here.

## Proposal Detection

Set \`should_propose\` to true when:
- Writers have converged on a concrete character definition, story beat, or bible entry
- A specific creative decision has been articulated clearly enough to capture
- There is meaningful consensus or a well-formed suggestion worth presenting to the showrunner

Set \`proposal_category\` to one of: "character", "beat", or "bible" when \`should_propose\` is true.

## Pause Signal

${messageCount >= 3 ? `The conversation has reached ${messageCount} messages. If the writers have covered enough ground on the current thread, set \`should_pause\` to true so the showrunner (the human user) can interject, redirect, or approve proposals. Use your judgment — if the conversation is at a natural breaking point or has produced actionable ideas, pause. If writers are mid-debate on a critical point, let it continue a bit longer.` : "The conversation is still young. Let the writers build momentum before pausing."}

## Required Output Format

Respond with a JSON object and nothing else:

{
  "next_agent_id": "<id of the agent who should speak next>",
  "reasoning": "<1-2 sentences explaining why this agent should go next>",
  "should_propose": <true or false>,
  "proposal_category": "<'character' | 'beat' | 'bible' | null>",
  "should_pause": <true or false>
}`;
}
