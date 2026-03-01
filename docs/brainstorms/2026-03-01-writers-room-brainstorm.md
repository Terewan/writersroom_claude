---
date: 2026-03-01
topic: writers-room-conversation-system
---

# Writer's Room — Conversation System

## What We're Building

The core interactive experience: a real-time Writer's Room where AI agents have freeform conversations about the user's show, and the user (showrunner) can interject at any time. Agents surface proposals (characters, beats, plot points, world-building) as inline cards that the showrunner approves, rejects, or modifies. Approved proposals automatically populate the Beat Board, Characters, and Show Bible sections.

## Key Decisions

1. **Freeform conversation**: Agents respond to whoever spoke last, creating a natural back-and-forth. No rigid round structure.

2. **Auto-pause every 3-5 messages**: After a burst of agent discussion, the system pauses so the showrunner can read and react. The showrunner can also hit "Pause & Interject" at any time during agent conversation.

3. **Inline proposal cards**: When agents reach a decision point, a special "proposal" message appears in the chat with Approve/Reject/Modify buttons. No separate panel.

4. **Open-ended topics**: The showrunner types whatever they want to discuss. No guided flow or preset topics required.

5. **Persistent sessions**: Full conversation history saved. Users can start new sessions on different topics. Past sessions provide context.

6. **Approved proposals populate other sections**: Approved character → Characters page. Approved beat → Beat Board. Approved world-building/theme → Show Bible.

## User Flow

1. Showrunner enters Writer's Room, sees empty chat + input field
2. Types an opening prompt: "Let's develop our main character for the pilot"
3. Agents discuss in freeform (3-5 messages), then auto-pause
4. Showrunner reads, optionally types feedback, hits "Continue" or "Send"
5. If agent surfaces a proposal (e.g., character profile), it appears as an inline card
6. Showrunner approves → character saved to Characters section
7. Showrunner can start a new session or continue current one

## Open Questions

- How should agents decide WHEN to make a proposal vs. keep discussing?
- Should the system prompt guide agents to propose after a certain depth of discussion?
- How much context from previous sessions should be injected into new sessions?

## Next Steps

→ Plan implementation (data layer, API routes, UI components, streaming)
