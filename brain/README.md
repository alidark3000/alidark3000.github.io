# Ali Brain • System Manual & Architecture

> **Local-First Autonomous Personal Knowledge Base**  
> Current Version: **v2.8.40** • [Online App](index.html) • [HTML Documentation](readme.html)

---

## Table of Contents

1. [Architecture & Local-First Design](#1-architecture--local-first-design)
2. [Multi-Computer Non-Destructive Sync](#2-multi-computer-non-destructive-sync)
3. [Entry Types & Solo Filtering](#3-entry-types--solo-filtering)
4. [Inline Editing & Field Generators](#4-inline-editing--field-generators)
5. [Content Ingestion & Scrubbing](#5-content-ingestion--scrubbing)
6. [Gemini AI Synthesis & Prompt Generator](#6-gemini-ai-synthesis--prompt-generator)
7. [Unified AI Assistant & Chat Modes](#7-unified-ai-assistant--chat-modes)
8. [Backlinks & Decimal Numeric IDs](#8-backlinks--decimal-numeric-ids)
9. [Settings & Workspace Management](#9-settings--workspace-management)
10. [Keyboard Shortcuts & Gestures](#10-keyboard-shortcuts--gestures)

---

## 1. Architecture & Local-First Design

Ali Brain is an autonomous, serverless personal knowledge management system that runs entirely in the browser using standard web technologies. It stores your complete database directly on your local file system, providing instant load times, complete data ownership, and offline capability without relying on centralized databases or servers.

- **Single JSON Database File:** All entries, generated prompt questions, prompt reflection answers, taxonomies, assistant chat histories, and deletion tombstones are stored in a single JSON file on your computer.
- **IndexedDB Persistence:** File handles are retained via `idb-keyval` so you can resume your active workspace upon reload without picking the file again. An automatic backup snapshot is also written to IndexedDB on every save.
- **Privacy by Default:** Zero telemetry, zero analytics, zero external database servers. Communication occurs solely between your browser and the Google Gemini API when using AI features.

---

## 2. Multi-Computer Non-Destructive Sync

The synchronization engine ensures safe, concurrent multi-device usage over folder-sync tools like Dropbox, Google Drive, iCloud, or Syncthing. Rather than blindly overwriting entire files, Brain analyzes granular note timestamps to perform non-destructive merges, preserve simultaneous edits, and prevent accidental data loss.

- **Dirty-State Guard:** Computers left open in the background never blind-save stale memory snapshots. If no local changes have been made on that device, auto-save timers will not touch or overwrite the file on disk.
- **Read-Before-Write 3-Way Merge:** Before saving local modifications, Brain inspects the file on disk. If another computer wrote to the file, Brain reads and merges entries non-destructively using individual `updatedAt` timestamps.
- **Conflict Preservation:** If the exact same note was edited concurrently on two computers, the newer timestamp becomes primary, and the older edit is cloned non-destructively as a `[Conflict Copy]` note so nothing is lost.
- **Deletion Tombstones:** Deleted notes record a timestamped tombstone in the database (`tombstones: { [id]: timestamp }`). This prevents deleted notes from being resurrected by other computers. Tombstones older than 60 days are pruned automatically.
- **Live Focus & Background Pulling:** Switching to the Brain tab (or while idle) automatically polls the disk file. When remote changes are detected, the workspace reloads and updates the view seamlessly.

---

## 3. Entry Types & Taxonomy Solo Filtering

The taxonomy and organization system categorizes your knowledge base into distinct functional entry types alongside multi-dimensional tags, categories, and projects:

- **Notes (Yellow):** Manual user notes, outlines, and thoughts.
- **Prompts (Green):** AI-generated theme reflection notes and intellectual inquiries.
- **Media (Red):** Multimedia links (YouTube, Vimeo) with embedded synchronized player.
- **Web (Blue):** Scraped web pages, articles, and processed PDFs.
- **AI Chat (Purple):** Full-width, archived AI conversations across your whole knowledge base (hidden from the note list by default to reduce clutter).

### Filtering & Organization Capabilities:
- **Type Toggle:** Click any entry type badge to toggle that type on or off in the list.
- **Solo Filtering:** <kbd>Shift</kbd> + Click any type badge to solo it — hiding all other types in a single click. Shift-clicking the active solo type again restores all default types.
- **Multi-Dimensional Taxonomy:** Filter notes by Projects, Categories, and Tags. Drag notes directly onto taxonomy items in the sidebar to assign them instantly.
- **Taxonomy Management:** Hover over any project, category, or tag in the sidebar to reveal a delete button that removes the taxonomy across all notes in the database.
- **Pinning:** Pin essential notes to keep them anchored at the top of the list for fast reference.
- **Fast Search & Clear:** Real-time text search filters across titles and note contents. An inline clear button and <kbd>Escape</kbd> shortcut instantly reset your query.

---

## 4. Inline Editing & Field Generators

The document editor delivers a seamless, in-place writing and curation workflow:

- **Double-Click Inline Editing:** Double-click any field — Title, Executive Summary, Answer Summary, or Takeaways — to edit it directly in place. Edits commit automatically on blur or <kbd>Enter</kbd>.
- **Targeted Field Generators & Auto-Metadata:** Independent refresh buttons beside each section trigger Gemini AI to re-extract or suggest content for only that specific field (Title, Taxonomy, Summary, or Key Takeaways) without affecting the rest of the document.
- **Automatic Metadata Generation:** When a user finishes editing a note (via Done, clicking outside, or exiting Focus Mode), the system automatically synthesizes a descriptive title (if untitled), a substantive executive summary, and contextual domain taxonomies (projects, categories, tags) in the background. Key takeaways are generated on-demand when the user clicks the refresh action.
- **Unified Instruction Registry (Single Source of Truth):** Both single-field margin refresh actions and combined initial background auto-generation derive from a centralized, DRY definition registry (`METADATA_FIELD_SPECS`). Field instructions, JSON schema property definitions, token budgets (300 for titles, 600 for taxonomies, 800 for summaries/takeaways, and 1000 for combined synthesis), and sanitizers are defined in one place, ensuring 100% prompt consistency and eliminating prompt drift across individual and combined generations.
- **In-Place Taxonomy Editor:** Clicking the taxonomy badges in the note header opens an inline manager to add new tags, remove existing tags, or trigger AI auto-tagging.
- **Distraction-Free Focus Mode:** Double-clicking note content or clicking Edit opens an inline textarea editor with a visible Focus Mode link. Activating Focus Mode launches a centered distraction-free writing window. Exiting Focus Mode (via <kbd>Escape</kbd>, backdrop click, or close button) immediately finishes editing, saves all changes, and returns to the rendered Markdown reader view.

---

## 5. Content Ingestion & Scrubbing

The ingestion pipeline transforms raw web links, multimedia URLs, and pasted text into clean, structured knowledge entries:

- **Web Article Scraping:** Strips navigation bars, advertisements, cookie notices, and scripts using `turndown` to capture clean article text and formatting.
- **Media Embedding:** Automatically recognizes YouTube and Vimeo links to embed a responsive media player alongside synchronized note-taking capabilities.
- **Direct Substance Metadata Extraction:** Automatically synthesizes a concise title, a substantive executive summary (2–3 informative sentences articulating context, core arguments, and takeaways without throat-clearing preambles), and contextual domain taxonomies.

---

## 6. Gemini AI Synthesis & Theme Prompt Generator

The Theme Prompt Generator acts as an autonomous intellectual sparring partner. By analyzing themes, contradictions, and loose ends across your knowledge base, it generates thought-provoking reflection questions that prompt you to write new notes and deepen your understanding:

- **Synthesis Hierarchy:**
  1. *Primary Topics (Highest Weight):* Manual notes receive the highest priority, grounding questions in your original ideas and personal reflections.
  2. *Secondary Topics:* Previous prompt responses explore how your perspective has evolved over time.
  3. *Supporting Context:* Ingested external materials (Web, Media, PDF) provide background references.
- **Temporal Weighting:** Evaluates your complete knowledge base across all time, giving ~65% priority to notes created or modified in the last 4 months.
- **Configurable Prompt Settings:**
  - *Creativity Level (Temperature):* Slider from `0.0` (factual and precise) to `1.0` (exploratory and divergent), defaulting to `0.7`. Strictly governs temperature end-to-end across Round 1 scouting, Round 2 deep reasoning synthesis, and repair loops.
  - *Gemini Model Assignment:* Select model override or inherit workspace default.
  - *Number of Recent Notes:* Slider adjusting candidate pool size from `5` to `60` notes (default: `35`). Notes are selected strictly in chronological order (newest first), ensuring your freshest manual notes and reflections are prioritized before filling remaining slots with earlier history.
  - *Reset to Defaults:* Master one-click restore for temperature, model, and candidate note limits.
- **Summarized Entry Prerequisite & Exclusion:** Notes lacking both an executive summary and key takeaways are strictly excluded from the reflection prompt candidate pool and button prerequisites, guaranteeing only analyzed and structured notes are evaluated.
- **Two-Pass Synthesis & Complete Unabridged Notes:** Reflection prompts are generated via a two-round architecture: Round 1 scans candidate note profiles (titles, timestamps, roles, summaries, and key takeaways) to scout and isolate the core contradiction or paradox between 2–3 notes. Round 2 injects the 100% complete, unabridged content of those chosen notes into the deep reasoning prompt, ensuring full context awareness and eliminating mid-sentence character truncation glitches.
- **Organic Issue-Driven Inquiry Engine (No Formulaic Question Stems):** Prompt synthesis strictly bans formulaic, repetitive question stems (such as *"How do you explain..."*, *"Can you explain..."*, or *"How do you reconcile..."*) as well as all action-oriented, advice-seeking, or life-coaching questions (e.g. *"What is one tangible action you can anchor yourself in today?"*, *"What is one small step / action / shift..."*, *"How might you..."*). Instead, questions are constructed organically and directly out of the specific tension, contradiction, loose end, or juxtaposition identified across the notes (e.g., examining which force governs a collision, where a premise breaks down under pressure, or what allows opposing standards to coexist). Features runtime pattern detection, analytical repair loops, and deterministic fallback rephrasing to guarantee deep, organic intellectual inquiry.
- **Mandatory JSON Schema Contracts & 8,192 Token Reasoning Budget:** Enforces strict `responseSchema` definitions with required `title` and `content` properties across prompt synthesis and repair calls, backed by an expanded 8,192-token ceiling to prevent reasoning models (like `gemini-pro-latest` and `gemini-2.5-pro`) from truncating questions mid-sentence when thinking tokens consume generation budgets.
- **Candidate Pool Novelty & Anti-Repetition Engine:** In Round 1 scouting, candidate notes are dynamically partitioned so unexamined notes appear at the top of the candidate index, while previously paired notes are deprioritized. Enforces explicit novelty constraints to prevent models (like `gemini-flash-lite-latest`) from repeatedly retreading the same note pairs.

---

## 7. Unified AI Assistant & Chat Modes

The integrated AI Assistant provides conversational intelligence directly alongside your notes:

- **Current Entry Mode:** Injects the active note's full text, summary, takeaways, and source link alongside the summaries and takeaways of up to 10 same-category/project notes. Hosted in the right collapsible drawer.
- **Full-Width Whole Brain AI View:** Uses two-pass retrieval that scans one-line note summaries across the library to identify relevant entries, then injects the complete text of the top 5 matching notes for synthesis. Replaces the main view with a dedicated, borderless AI Chat interface.
- **Non-Destructive Archival & Natural Continuation:** Every message exchange is stored non-destructively directly on the active AI Chat entry. When you select an archived AI chat from the notes list, its entire conversational transcript is restored.
- **Auto-Focus on AI Chat Creation:** Creating a new Whole Brain AI chat session or navigating to an AI chat entry automatically focuses the chat input field.
- **Strict Assistant Drawer Segregation:** When in Whole Brain chat, the drawer is collapsed, keyboard shortcuts (<kbd>Cmd+J</kbd> / <kbd>Cmd+L</kbd> / <kbd>Ctrl+J</kbd>) are ignored, and the assistant drawer toggle is cleanly removed from the DOM.
- **Concise & Conversational Response Rules:** Capped at 50 words by default (and strict 100-word ceiling unless requested otherwise), calibrated at temperature 0.3, active voice, plain English, and clean source citations via `[[kb-ref:ID]]`.

---

## 8. Backlinks & Decimal Numeric IDs

- **Wiki Shortcodes:** Using `[[kb-ref:ENTRY_ID]]` establishes an interactive bi-directional link. Hovering renders an instant summary popover, while clicking navigates directly to the referenced note.
- **Drag to Reference:** Drag any note card from the sidebar list and drop it into the Markdown editor to insert a formatted reference shortcode.
- **Chronological Decimal IDs:** Notes use stable decimal identifiers (e.g. `#1`, `#2`, `#2.1`), permitting chronological insertions into intermediate timeline gaps while maintaining stable referencing.

---

## 9. Settings & Workspace Management

- **API Key Management:** Store and rotate multiple Google Gemini API keys to distribute usage across quotas.
- **Task-Specific Model Assignment:** Assign distinct Gemini models for Metadata & Summaries, Theme Prompts, and AI Assistant Copilot.
- **Live Model Discovery:** Dynamically fetch available models directly from Google AI Studio.
- **Workspace Merging:** Merge secondary JSON knowledge bases into your active workspace with automatic duplicate handling and conflict resolution.

---

## 10. Keyboard Shortcuts & Gestures

Ali Brain is built for high-speed, keyboard-driven navigation, writing, and curation.

### Global Navigation & Workspace Controls

| Shortcut | Description |
|---|---|
| <kbd>Alt</kbd> + <kbd>&larr;</kbd> &nbsp;/&nbsp; <kbd>Cmd</kbd> + <kbd>[</kbd> &nbsp;/&nbsp; <kbd>Ctrl</kbd> + <kbd>[</kbd> | Navigate backward in note selection history (triggers floating on-screen Back button) |
| <kbd>Alt</kbd> + <kbd>&rarr;</kbd> &nbsp;/&nbsp; <kbd>Cmd</kbd> + <kbd>]</kbd> &nbsp;/&nbsp; <kbd>Ctrl</kbd> + <kbd>]</kbd> | Navigate forward in note selection history (triggers floating on-screen Forward button) |
| <kbd>Cmd</kbd> + <kbd>Z</kbd> &nbsp;/&nbsp; <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo note modification or deletion (when not in a text input) |
| <kbd>Cmd</kbd> + <kbd>J</kbd> &nbsp;/&nbsp; <kbd>Cmd</kbd> + <kbd>L</kbd> &nbsp;/&nbsp; <kbd>Ctrl</kbd> + <kbd>J</kbd> | Toggle contextual AI Assistant drawer for the active note |

### Note Editing & Focus Mode

| Shortcut | Description |
|---|---|
| <kbd>Escape</kbd> | Exit Focus Mode or inline textarea editor; commits and saves changes, triggers background metadata synthesis, and restores Markdown view |
| <kbd>Tab</kbd> | Indent text by 2 spaces inside note editor textarea without losing focus |
| <kbd>Enter</kbd> | Confirm and commit single-line inline edit fields (Title, Summary, Takeaways). In taxonomy inputs (Projects, Categories, Tags), commits the entered item |
| <kbd>,</kbd> (Comma) | In taxonomy input fields, immediately adds the typed tag, project, or category |
| <kbd>Escape</kbd> | In single-line inline edit fields, cancels editing and reverts to previous text |

### AI Conversations & Search

| Shortcut | Description |
|---|---|
| <kbd>Enter</kbd> | Submit message to AI (in Whole Brain chat and Current Entry assistant drawer) |
| <kbd>Shift</kbd> + <kbd>Enter</kbd> | Insert newline in AI chat textarea without submitting |
| <kbd>Escape</kbd> | When search bar is focused with an active query, clears search text and restores note list |

### Mouse & Click Modifiers

| Gesture / Modifier | Description |
|---|---|
| <kbd>Shift</kbd> + Click Entry Type | **Solo Filter:** Isolates that entry type (Notes, Prompts, Media, Web, AI Chat), hiding all others. Shift-clicking active solo type restores defaults |
| <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> + Click Note | Toggle multi-selection of notes in the sidebar list |
| <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> + Click Taxonomy | Multi-select projects, categories, or tags in sidebar for composite filtering |
| Drag Note Card &rarr; Editor | Inserts formatted bi-directional reference link (`[[kb-ref:ID]]`) |
| Drag Note Card &rarr; Taxonomy | Assigns note to project, category, or tag immediately |
| Double-Click Text Field | Initiates inline editing directly on note title, summary, or content |

---

*Ali Brain • Documentation updated for **v2.8.40** • Local-First Autonomous Knowledge Base*
