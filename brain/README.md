# Ali Brain • System Manual & Architecture

> **Local-First Autonomous Personal Knowledge Base**  
> Current Version: **v2.8.69** • [Online App](index.html) • [HTML Documentation](readme.html) • [Changelog](changelog.html)

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
- **Dedicated Folder Recommended:** It is strongly recommended to store your library inside its own dedicated folder (e.g. `~/Documents/Brain/BrainLibrary.json`) rather than directly inside a crowded root or general folder.
- **Temporary Swap Files (`.crswap`):** Chromium-based browsers (Chrome, Edge, Brave) write data atomically by creating a temporary swap file (e.g., `*.crswap`) in the same directory before renaming it to your JSON file. If your folder is synced by cloud services like iCloud Drive, OneDrive, or Dropbox, the sync agent can temporarily lock these scratch files while uploading, leaving behind orphaned `.crswap` files. These files contain no final state and **can be safely deleted at any time**. Storing your library in a dedicated folder keeps them contained and prevents folder clutter.
- **IndexedDB Persistence:** File handles are retained via `idb-keyval` so you can resume your active workspace upon reload without picking the file again. An automatic backup snapshot is also written to IndexedDB on every save.
- **Safari Local File Sync Bridge (Fallback for Non-Chromium Browsers):** When the browser supports the native File System Access API (Chrome, Edge, Brave), Brain reads and writes directly to your local `.json` file. When `window.showOpenFilePicker` is unavailable (such as in Safari), Brain automatically activates a local file bridge client (`127.0.0.1:8765`) paired with a one-time downloadable macOS setup archive ([`Enable-Safari-Sync.zip`](Enable-Safari-Sync.zip) → [`Enable-Safari-Sync.command`](Enable-Safari-Sync.command)). Running the script installs a lightweight local Python LaunchAgent (`~/.alibrain/bridge.py`) that provides native macOS file pickers, in-place auto-saving, startup auto-resume, and 3-way external change polling in Safari.
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
- **Txt (Grey):** Dropped text and imported plain text snippets.
- **Seeds (Navy Blue):** AI prompt shortcuts and instructions (reusable prompts inspired by Gemini Gems). Seeds have no summaries and no key takeaways; their full content acts as an instant shortcut in the AI Assistant.
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
- **Sort Toggle:** A toggle at the top right of the entry list switches between date created and date modified order (newest first). Pinned notes always stay on top.
- **Type-Colored Interface:** The reader, editor and Focus Mode accent color follows the entry's type (Note amber, Txt grey, Media red, Web sky, Prompt green, AI Chat purple, Seed blue).

---

## 4. Inline Editing & Field Generators

The document editor delivers a seamless, in-place writing and curation workflow:

- **Double-Click Inline Editing:** Double-click any field — Title, Executive Summary, Answer Summary, or Takeaways — to edit it directly in place. Edits commit automatically on blur or <kbd>Enter</kbd>.
- **Targeted Field Generators & Auto-Metadata:** Independent refresh buttons beside each section trigger Gemini AI to re-extract or suggest content for only that specific field (Title, Taxonomy, Summary, or Key Takeaways) without affecting the rest of the document.
- **Automatic All-Fields Initial Metadata Generation:** When a user saves a note's content edit for the first time (via Done, clicking outside, or exiting Focus Mode), the system automatically synthesizes **all metadata fields in a single pass**—generating a descriptive Title, an Executive Summary, Key Takeaways (`shortVersion`), and contextual domain Taxonomies (projects, categories, tags) together.
- **Unified Instruction Registry (Single Source of Truth):** Both single-field margin refresh actions and combined initial background auto-generation derive from a centralized, DRY definition registry (`METADATA_FIELD_SPECS`). Field instructions, JSON schema property definitions, and sanitizers are defined in one place, ensuring 100% prompt consistency and eliminating prompt drift across individual and combined generations.
- **In-Place Taxonomy Editor:** Clicking the taxonomy badges in the note header opens an inline manager to add new tags, remove existing tags, or trigger AI auto-tagging.
- **Distraction-Free Focus Mode:** Double-clicking note content or clicking Edit opens an inline textarea editor with a flush-right **Edit** button (which becomes **Done** while editing) and a **Focus Mode** button that appears only while editing. Activating Focus Mode launches a centered distraction-free writing window. Exiting Focus Mode (via <kbd>Escape</kbd>, backdrop click, or close button) returns to the inline editor without saving or ending editing; click **Done** (or press <kbd>Escape</kbd> in the inline editor) to save.

---

## 5. Content Ingestion & Scrubbing

The ingestion pipeline transforms raw web links, multimedia URLs, and pasted text into clean, structured knowledge entries:

- **Web Article Scraping:** Strips navigation bars, advertisements, cookie notices, and scripts using `turndown` to capture clean article text and formatting.
- **Media Embedding:** Automatically recognizes YouTube and Vimeo links to embed a responsive media player alongside synchronized note-taking capabilities.
- **Direct Substance Metadata Extraction:** Automatically synthesizes a concise title, a substantive executive summary (1–2 informative sentences articulating context, core arguments, and takeaways without throat-clearing preambles), 3–5 insightful key takeaways, and contextual domain taxonomies in one go. Powered by a 4,096-token ceiling and multi-layer extraction fallbacks to guarantee uninterrupted completion across reasoning models (Gemini 2.5 Flash / Pro).

---

## 6. Gemini AI Synthesis & Theme Prompt Generator

The Theme Prompt Generator analyzes your notes to surface connections, contradictions, and open questions that prompt new reflection notes:

- **Filter-Scoped Candidate Pool:** Draws with equal weight from whatever notes are currently visible in your list (based on active Entry Types, Projects, Categories, Tags, and Search filters) that have an Executive Summary or Key Takeaways.
- **Theme Prompt Pool Settings (in General Settings):** Configured inside the **Settings** modal (<i class="fa-solid fa-gear"></i>) under *Theme Prompt Pool Settings*:
  - **Date Range (`dateRangeMonths`):** Defaults to **2 months** (adjustable from `1` to `24` months, or **All Time**). Restricts the pool to notes created or updated within that timeframe.
  - **Pool Size (`poolSize`):** Defaults to **10 notes** (adjustable from `5` to `50` in steps of 5, with the final step set to **All**). Controls how many eligible notes are randomly sampled (or all sent when set to **All**) in the request.
- **Single-Pass Synthesis & In-Place Refresh:** Sends only the **Title**, **Date**, **Executive Summary**, and **Key Takeaways** of the sampled notes in a single API call. The model isolates one specific idea from 1 or 2 notes, links them with `[[kb-ref:ID]]` citations, and asks one open-ended "Why" or "How" reflection question (capped at 50 words). Generated prompts feature a **Write** button to capture responses directly into new reflection notes, alongside a refresh icon (`fa-rotate-right`) to roll a new prompt in place.
- **Model & Default Temperature (`1.0`):** Uses the Theme Prompts model configured in Settings (`taskModels.prompts`) with a fixed default temperature of `1.0` (Google's recommended default for Gemini 2.5 reasoning models and associative synthesis across disparate ideas).
- **Knowledge Provenance & User Perspective:** Prompts strictly assume only manual Notes and Prompt replies represent user-generated content reflecting their own issues, projects, and personal knowledge. Web, media, and text documents are treated as external and contextual third-hand knowledge (articles, videos, secondary research). Seeds and AI chats are ignored.
- **Animated Top Placement Above Search Bar:** When generated, theme prompts smoothly expand between the entry creation buttons and the search bar, transitioning the search bar and note cards downward. Dismissing or saving the prompt smoothly glides the list layout back into position.

---

## 7. Unified AI Assistant & Chat Modes

The AI Assistant lets you chat with either a single open note or your broader knowledge base:

- **Current Entry Chat (Right Drawer):**
  - **Conversational Synthesis & Active Note Discussion:** Discussions, brainstorming, questions, and feedback remain strictly within the chat conversation. The assistant has direct access to the active document's full content and context, answering queries without modifying user documents. When discussing the active note, circular self-references are suppressed so links remain clean and valid.
  - **Context & On-Demand Cross-Note Content Access:** Sends the active note's full Content field (including live staged editor text), summary, takeaways, and source URL (as well as its reflection question for Theme Prompts). Other notes in your knowledge base are summarized with on-demand availability; the assistant dynamically requests and inspects the full Content fields of other notes in a second pass whenever cross-document comparison, reference verification, or multi-note synthesis is needed.
  - **Auto-Close & Auto-Reopen:** Switching notes automatically closes the drawer if the new note has no prior chat, and automatically re-opens it if the note already has a saved conversation (`assistantChats[entry.id]`). Toggle manually anytime with <kbd>Cmd+J</kbd> / <kbd>Ctrl+J</kbd>.
- **Whole Brain / Scoped AI Chat (Full-Width Purple View):**
  - **Dynamic Scope, Inline Editing & Title Auto-Generation:** Named automatically after your active Entry Type and Taxonomy filters (e.g., `Whole Brain AI Chat` or `Project: X AI Chat`), with double-click inline editing and an on-hover auto-generate refresh button beside the title to synthesize a descriptive title from the conversation transcript.
  - **Uncapped Summaries First, Details On Demand:** Sends **all** matching note **Executive Summaries** (`summary`) with no artificial count limit—you control the scope via your type and taxonomy selections. If summaries are enough to answer, the AI replies in a **single pass** (`directReply`). If deeper detail is required, it automatically fetches **Key Takeaways** (`takeawayIds`) or **Full Content** (`contentIds`) for specific notes in a second pass.
  - **Auto-Selected Type & Excluded Prior Chats:** Clicking the purple **Chat** / **New Chat** button automatically enables the `AI Chat` entry type in the list so your chat sessions are visible, while strictly excluding previous `AI Chat` entries from being fed into context for new chats.
  - **Persistent & Self-Cleaning:** Conversations save automatically to their `AI Chat` entry and resume when clicked. Empty chats that you navigate away from without sending a message are pruned automatically.
  - **In-Place Taxonomy Editing:** Includes an interactive taxonomy row directly below the metadata subtitle. Clicking anywhere on the row opens the standard in-place taxonomy editor to assign or remove Projects, Categories, and Tags (or auto-generate tags via Gemini) for the chat session.
- **Cumulative Input & Output Token Tracking:** Both the full-width **AI Chat** header and the **Current Entry AI Assistant** drawer header display a live `Tokens In: X | Out: Y` counter that records and increments prompt input tokens and generated output tokens (`usageMetadata.promptTokenCount` and `candidatesTokenCount` / `thoughtsTokenCount`) across every turn (including two-pass escalations).
- **Response Style & Temperature (`0.3`):** Uses a focused temperature of `0.3` for factual accuracy, plain conversational English, a 50-word default target (100-word ceiling unless asked for detail), and inline `[[kb-ref:ID]]` source citations.
- **Knowledge Provenance Grounding & Prompt Questions:** In both Current Entry and Whole Brain chat modes, the AI strictly assumes only Notes and Prompt replies are user-generated content reflecting personal thinking, projects, and issues. For Theme Prompt entries, the reflection question is automatically supplied to the model alongside the user's answer so discussions remain grounded on the original question. Web, Media, and Text documents provide external third-hand context, while Seeds and prior AI chats are never used as knowledge context.

---

## 8. Backlinks & Decimal Numeric IDs

- **Interactive Backlinks & Citations:** Using `[Ref: 23]` (or lowercase `[ref: 23]`, as well as legacy `[[kb-ref:ENTRY_ID]]`) establishes an interactive bi-directional citation. The syntax matches the rendered display text exactly. Hovering renders an instant summary popover, while clicking navigates directly to the referenced note.
- **Drag to Reference:** Drag any note card from the sidebar list and drop it into the Markdown editor to insert a clean `[Ref: ID]` reference tag.
- **Chronological Decimal IDs:** Notes use stable decimal identifiers (e.g. `#1`, `#2`, `#2.1`), permitting chronological insertions into intermediate timeline gaps while maintaining stable referencing.

---

## 9. Settings & Workspace Management

- **API Key Management:** Store and rotate multiple Google Gemini API keys to distribute usage across quotas.
- **Task-Specific Model Assignment:** Assign distinct Gemini models for Metadata & Summaries, Theme Prompts, and AI Assistant Copilot.
- **AI Instructions & User Context:** Customize system instructions and inject personal profile background:
  - **User Context & Profile:** Provide your personal background, ongoing research/projects, and communication preferences (automatically prepended into Theme Prompts and conversational AI chats).
  - **Theme Prompts Instructions:** Fine-tune the underlying prompt instructions controlling tension exploration, concept isolation, question style, and word limits.
  - **AI Chat Rules:** Customize conversational rules, knowledge provenance assumptions, and style constraints for both Whole Brain and Single-Entry assistant chats.
  - **Reset to Default:** Instant one-click reset buttons for each instruction category.
  - *Note:* Quick metadata extraction instructions (titles, summaries, takeaways, and taxonomies) remain fixed for deterministic cataloging.
- **Live Model Discovery:** Dynamically fetch available models directly from Google AI Studio.
- **Install as App (PWA):** The **Install as App** section in Settings installs Ali Brain as a standalone app (Install button in Chrome/Edge; File > Add to Dock in Safari on macOS) and shows offline-cache status. A service worker caches the app files and CDN libraries so the app launches offline (AI calls and the Safari sync bridge are never cached; the offline cache needs the app served over http/https). Safari still needs the Local Sync Bridge to read and write your notes file.
- **Workspace Merging & Text File Import:** Merge secondary JSON knowledge bases or import multiple plain text (`.txt`) and Markdown (`.md`) files directly into your active workspace. Imported text files preserve their original file modification and creation timestamps (`createdAt` and `updatedAt`), name notes after the filename, and automatically generate executive summaries with Gemini. Multiple files can be selected simultaneously.

---

## 10. Keyboard Shortcuts & Gestures

Ali Brain is built for high-speed, keyboard-driven navigation, writing, and curation.

### Global Navigation & Workspace Controls

| Shortcut | Description |
|---|---|
| <kbd>Alt</kbd> + <kbd>&larr;</kbd> &nbsp;/&nbsp; <kbd>Cmd</kbd> + <kbd>[</kbd> &nbsp;/&nbsp; <kbd>Ctrl</kbd> + <kbd>[</kbd> | Navigate backward in note selection history (triggers floating on-screen Back button) |
| <kbd>Alt</kbd> + <kbd>&rarr;</kbd> &nbsp;/&nbsp; <kbd>Cmd</kbd> + <kbd>]</kbd> &nbsp;/&nbsp; <kbd>Ctrl</kbd> + <kbd>]</kbd> | Navigate forward in note selection history (triggers floating on-screen Forward button) |
| <kbd>Cmd</kbd> + <kbd>Z</kbd> &nbsp;/&nbsp; <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo note modification or deletion (when not in a text input) |
| <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> &nbsp;/&nbsp; <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> &nbsp;/&nbsp; <kbd>Ctrl</kbd> + <kbd>Y</kbd> | Redo previously undone note modification (when not in a text input) |
| <kbd>Cmd</kbd> + <kbd>J</kbd> &nbsp;/&nbsp; <kbd>Cmd</kbd> + <kbd>L</kbd> &nbsp;/&nbsp; <kbd>Ctrl</kbd> + <kbd>J</kbd> | Toggle contextual AI Assistant drawer for the active note |

### Note Editing & Focus Mode

| Shortcut | Description |
|---|---|
| <kbd>Escape</kbd> | In Focus Mode: return to the inline editor (keeps editing). In the inline editor: commits and saves changes, triggers background metadata synthesis, and restores Markdown view |
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

*Ali Brain • Documentation updated for **v2.8.116** • Local-First Autonomous Knowledge Base*
