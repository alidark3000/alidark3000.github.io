# Ali Brain • Release Notes & Changelog

> **Local-First Autonomous Personal Knowledge Base**  
> Current Version: **v2.8.69** • [Online App](index.html) • [System Manual](readme.html) • [HTML Changelog](changelog.html)

---

## v2.8.69 (2026-10-19) — *Latest*

- **In-Place Taxonomy Editing for AI Chats:** Added an interactive taxonomy row directly below the metadata subtitle in Whole Brain AI Chats. Clicking any badge or placeholder opens the full in-place taxonomy editor, allowing users to assign or remove projects, categories, and tags directly on AI chat sessions (with full support for auto-tag generation).
- **Unified Compact Button Height (`h-7`):** Standardized the entry list action bar (`+ Note`, `+ Chat`, and search input) to match the compact `h-7` height (28px) of the AI Chat view action buttons (`Summary`, `+ New Chat`, delete).
- **AI Chat Input & Output Token Tracking:** Added live `Tokens In: X | Out: Y` badges at the top of both the full-width **AI Chat** header and the **Current Entry AI Assistant** drawer header. Extracts exact prompt and completion token counts from Gemini API `usageMetadata` (summing across both passes when a chat escalates from summaries to takeaways/content) and persists cumulative session totals on each chat.
- **Safari Local File Sync Bridge (`Enable-Safari-Sync.command`):** When the native File System Access API is unavailable (Safari), Brain automatically falls back to a lightweight local macOS file bridge on `127.0.0.1:8765`. Includes a one-time downloadable `Enable-Safari-Sync.command` setup script on the Landing screen that installs a Python 3 LaunchAgent (`~/.alibrain/bridge.py`) for native macOS Finder file pickers, in-place auto-saving, startup auto-resume, and 3-way external change merging.
- **Single-Pass Theme Prompt Generator, In-Place Refresh & Pool Settings:** Generates concise reflection prompts (50 words max, `temperature: 1.0`) in a single API call using only candidate note summaries and key takeaways, isolating one concept from 1 or 2 notes and ending with an open-ended "Why" or "How" question. Added a refresh icon next to the **Write** button on generated prompt cards to roll a new prompt in place without dismissing, and reinstated the inline Prompt Pool Settings panel with **Date Range** (default 2 months, 1–24 months or All Time) and **Pool Size** (default 10 notes, 5–50 or All) sliders.
- **Scoped Whole Brain AI Chat (Uncapped Summaries & On-Demand Detail):** Dynamically names AI Chat sessions after active entry type and taxonomy filters, sends all matching Executive Summaries without artificial count caps, and answers in a single pass (`directReply`) when summaries suffice—escalating to Key Takeaways or Full Content in a second pass only when needed. Auto-selects the purple AI Chat entry type on open while excluding prior chats from new context.
- **Context-Aware Current Entry AI Drawer:** Switching notes automatically closes the single-entry AI Assistant drawer if the new note has no prior conversation, and automatically re-opens it for notes with an existing chat (`assistantChats[entry.id]`).
- **Unified First-Save All-Fields Metadata Generation:** Saving a note's content edit for the first time now synthesizes Title, Executive Summary, Key Takeaways, and Taxonomies (projects, categories, tags) together in a single pass via the centralized `METADATA_FIELD_SPECS` registry (4,096-token budget).
- **Standalone Changelog & Succinct Documentation:** Extracted the release history into its own standalone page (`changelog.html` / `CHANGELOG.md`) and streamlined Sections 6 & 7 in `readme.html` and `README.md`.

## v2.8.32 (2026-10-14)

- **Unified History Navigation Shortcuts:** Routed backward (<kbd>Alt+←</kbd> / <kbd>Cmd+[</kbd> / <kbd>Ctrl+[</kbd>) and forward (<kbd>Alt+→</kbd> / <kbd>Cmd+]</kbd> / <kbd>Ctrl+]</kbd>) shortcuts directly to the top navigation buttons.
- **Auto-Cleanup & Focus Polish:** Automatically prunes abandoned blank manual notes and empty AI chat placeholders when navigating away, auto-focuses the chat input on AI Chat creation, and adds a 200ms fade-in transition.

## v2.8.10 (2026-10-11)

- **Full-Width AI Chat View & Dedicated Entry Type:** Introduced the purple *AI Chat* entry type (`#a855f7`) with a full-width conversational view, non-destructive session archival, and strict separation from the Current Entry drawer.
- **Inline Content Editing & Focus Mode:** Double-clicking note content opens an inline editor with an optional distraction-free Focus Mode that auto-saves and returns to Markdown view on exit.
- **Merged Web & PDF Type:** Combined Web and PDF entries into a single sky-blue *Web* entry type (`#38bdf8`).

## v2.7 (2026-10-11)

- **Auto-Resume Workspace & Filter-Driven Prompts:** Automatically loads the most recent knowledge base file from IndexedDB on startup, and derives the theme prompt candidate pool from active list view filters with inline `[[kb-ref:ID]]` citations.
- **Gemini Flash-Lite Default & UI Refinements:** Set `gemini-flash-lite-latest` as the fast default across tasks, extracted CSS to `brain/style.css` inside `/brain/`, and added top-docked view/assistant toggles, fluoro-green prompt accents (`#10e567`), and red-orange brand styling (`#e73624`).

## v2.6 (2026-10-09)

- **Task-Specific AI Model Routing & Live Discovery:** Assign distinct Gemini models for Metadata, Theme Prompts, and AI Assistant, with one-click live model discovery filtered to `latest` aliases.
- **Floating View Toggles & Active Card Elevation:** Positioned collapsible sidebar toggles in the top padding zone, added 8px borders for pinned notes, separated subject-matter taxonomies from entry types, and added one-click search clearing.

## v2.5 (2026-10-07)

- **Inline Double-Click Editing & Margin Field Generators:** Replaced full-page edit mode with in-place double-click editing across all fields, right-margin AI refresh icons, and an inline taxonomy editor.
- **Smooth Panel Transitions & Scoped Prompts:** Added 300ms animated column transitions, persistent view state storage, container-responsive prompt layouts, and automatic taxonomy inheritance when writing from a scoped prompt.

## v2.4 (2026-10-07)

- **Global Taxonomy Deletion:** Added hover delete actions on sidebar projects, categories, and tags to remove a taxonomy across all notes in a single click.

## v2.3 (2026-10-04)

- **Non-Destructive Multi-Device Sync:** Implemented read-before-write 3-way merging, 60-day deletion tombstones, conflict copy preservation (`[Conflict Copy]`), dirty-state guards, and live focus/background file polling.
- **Entry Type Soloing & Standalone Manual:** Added <kbd>Shift</kbd> + Click solo filtering on entry type badges and standalone system documentation (`readme.html`).

## v2.2 (2026-09-30)

- **Theme Prompt Generator & Auto-Save Pipeline:** Introduced AI theme prompt generation with dedicated Answer Summaries, automatic saving on blur/navigation/Focus exit, and 15-second background sync.
- **Borderless 3-Pane Layout & Dual AI Modes:** Adopted borderless 3-column layout with color-coded entry stripes, in-app changelog, auto-metadata on save, and separate Whole Brain vs. Current Entry assistant contexts.

## v2.1 (2026-09-14)

- **File System Access & Bidirectional Backlinks:** Added native local file persistence via File System Access API, `[[kb-ref:ID]]` backlink detection with hover previews, and <kbd>Cmd+J</kbd> / <kbd>Ctrl+J</kbd> assistant shortcuts.

## v2.0 (2026-09-10)

- **Initial Local-First Release:** Launched serverless browser-based personal knowledge base with URL/media ingestion and automated Gemini AI summarization.
