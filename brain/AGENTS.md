# Ali Brain • Instructions for AI Agents

## Release housekeeping (do this after every user-facing change)

1. **Bump the patch version** (e.g. `v2.8.71` → `v2.8.72`) in every place it appears:
   - `APP_VERSION` in `index.html`
   - "Current Version" line and latest heading in `CHANGELOG.md`
   - "Current Version" text, the timeline comment and the `<h2>` in `changelog.html`
   - Search with `grep -rn "<old version>" .` to confirm nothing is missed.
2. **Update the changelog** (`CHANGELOG.md` and `changelog.html`, kept in sync). Merge iterative tweaks into the latest entry as bullets rather than adding a new heading.
3. **Update the manual** (`README.md` and `readme.html`, kept in sync) when behavior, UI or workflows described there change.

## Changelog rollover protocol

Keep 3-digit versions (e.g. `v2.8.x`) only for the current active minor series. When bumping to a new two-digit minor version (e.g. `v2.9`), condense all 3-digit entries from the previous series into a single round two-digit entry (e.g. `v2.8`).

## Conventions

- Single-file React app in `index.html` (Tailwind CDN) with styles in `style.css`; theme colors are CSS variables (`--bg-main`, `--bg-pane`, `--accent`, ...).
- Entry types and their colors: Note amber, Txt grey, Media red, Web sky, Prompt green, AI Chat purple, Seed blue.
- Preserve existing comments and docstrings unrelated to your change.


# Gemini Agent Rules

## Adaptive Reasoning & Response Speed
- **Triage Complexity First**:
  - **Direct / Routine tasks** (e.g., CSS/styling adjustments, button icons, text changes, small UI tweaks, housekeeping): Decide immediately that extended reasoning is unnecessary. Bypass planning overhead, locate the exact target line with a single targeted `grep -n`, read at most 25–40 lines, and apply `replace_file_content` in the very first turn.
  - **Complex / Architectural tasks** (e.g., multi-component state management, local file bridges, API synchronization pipelines, structural schema migrations): Take the time needed to reason through dependencies, edge cases, and failure modes before touching code.
- **Context Hygiene**:
  - Never dump hundreds of lines from `index.html` into conversation context. Keep tool views strictly bounded (< 40 lines).
  - Restrict shell command outputs with `head`, `grep`, or line limiters to prevent context bloat and downstream generation latency.
- **Execution Over Monologue**:
  - Skip explanatory architectural preambles or blueprints for routine adjustments. Deliver working code immediately.
- **Mandatory Housekeeping On Edits**:
  - **Always bump the patch version** (`v2.8.x` → `v2.8.x+1`) automatically on any edit/code modification across `index.html`, `CHANGELOG.md`, and `changelog.html` without waiting to be prompted.
  - **Always update the manual** (`README.md` and `readme.html` in sync) whenever features, UI controls, default behaviors, or workflows are added, changed, or removed.

## Knowledge Epistemology & Entry Analysis
- When looking at entries for prompts and AI chats:
  - **User-Generated Content**: Assume ONLY the content of notes and prompt replies is user-generated content that reflects their own issues, projects, and personal knowledge.
  - **External / Contextual Knowledge**: Web, media, and text entries are assumed to be external and contextual third-hand knowledge.
  - **Ignored Content**: Seeds and AI are ignored.
