# Ali Brain • Release Notes & Changelog

> **Local-First Autonomous Personal Knowledge Base**  
> Current Version: **v2.8.125** • [Online App](index.html) • [System Manual](readme.html) • [HTML Changelog](changelog.html)

---

## v2.8.125 (2026-10-22) — *Latest*

- **Action Buttons Non-Breaking Labels:** Added `whitespace-nowrap`, explicit normal wrapping (`[overflow-wrap:normal]`), and adjusted padding/gaps across the entry list action buttons (`+ Note`, `+ Prompt`, `+ Chat`, `+ Seed`) and global `button` styles to prevent narrow columns or word-break rules from splitting button labels across multiple lines (e.g. `Promp / t`).
- **Persistent Summary & Auto-Generation for Global AI Chat:** Added a persistent executive summary field to Whole Brain / Global AI Chat sessions (`aiChat`), mirroring standard note cards with direct in-place editing (`EditableText`) and an on-demand "Generate" button. Global AI chat sessions automatically generate an executive summary when navigating or clicking out of the entry if left unsummarized. In sidebar entry cards, the generated chat summary is displayed prominently as the card preview.
- **Auto-Generate Title After First AI Response:** In Whole Brain AI Chat, once the first response arrives from the model, an intelligent title generation request is automatically dispatched in the background to summarize the exchange into a punchy 3–6 word title, immediately replacing default or raw prompt placeholders without requiring manual title generation.

- **Universal Word Wrapping & Inner Entry-Card Overflow Hardening:** Hardened word-breaking and layout boundaries across the entire application to prevent long unbroken strings (unspaced URLs, cryptographic hashes, continuous alphanumeric strings, and inline tokens) from overflowing or breaking flex layouts. Applied universal `overflow-wrap: anywhere;` and `word-break: break-word;` across typography, tag badges, and global resets while preserving horizontal scrolling on `<pre>` code blocks. Reinforced entry cards with `min-w-0 max-w-full overflow-hidden break-words [overflow-wrap:anywhere]` across card headers, title headings, summary previews, and taxonomy chips, ensuring list items stay neatly contained and wrap cleanly in all views.
- **Links Open in New Tab by Default:** Configured the markdown engine (`marked.js`), HTML sanitizers, and link click delegation so all external web links across note contents, markdown views, prompt responses, and AI chat messages (both full-width AI Chat and the single-entry assistant drawer) open in a new browser tab by default (`target="_blank" rel="noopener noreferrer"`). Prevents accidental page navigation away from the active knowledge base workspace when exploring citations, sources, or external references.
- **On-Demand Web Search & External Knowledge Policy:** Clarified and enhanced AI web search capabilities across both the full-width **AI Chat** and the **Current Entry AI Assistant** drawer. By default, the AI assistant focuses strictly on synthesizing the user's local knowledge base library and does not perform web searches. When the user explicitly requests to look outside of the library or specifically requests a web search (e.g., "search the web", "look online", "search outside my library"), the app activates live Google Search grounding (`tools: [{ google_search: {} }]`), synthesizes up-to-date web results with clickable source links, and ensures the assistant never erroneously claims it is unable to perform web searches.
- **App-Centric AI Token Counter Labels (Out / In):** Aligned token counter naming with the application's perspective across both the full-width **AI Chat** view and the **Current Entry AI Assistant** drawer header. Tokens sent to the model (prompts) go out from the app and are now designated **Out**, while tokens received from the model (responses/completions) arrive into the app and are designated **In** (`Out: <prompt> | In: <response>`).
- **Secondary-Click (Right-Click) Entry Card Context Menu:** Added a desktop-style context menu triggered on secondary click (right-click or two-finger tap) on any note card in the list panel. Features instantaneous options to:
  - **Copy Reference (`[Ref: ID]`):** Copies the active reference tag (`[Ref: 12]`) directly to the clipboard for fast manual citation and linking.
  - **Pin / Unpin Note:** Toggles note pinning without needing to hover over small card icons.
  - **Delete Note:** Instantly deletes the note with full undo (`Cmd+Z`) and redo (`Cmd+Shift+Z`) support.
  - Preserves current note selection without switching active entries on secondary click, includes viewport-boundary collision detection, and dismisses smoothly on outside click, scroll, or <kbd>Esc</kbd>.
- **Exposed AI System Instructions & User Context in Settings:** Added a dedicated **AI Instructions & Context** section in Settings. Users can now view, modify, and fine-tune the system instructions for **Theme Prompts** (reflection questions, tension exploration, concept isolation) and **AI Chat Rules** (knowledge provenance, concise writing style, constraints), as well as provide their own **User Context & Profile** (background, current research/projects, and style preferences) which is prepended into prompt syntheses and conversational chat copilots. Provided instant **Reset to Default** buttons for each instruction category and synced custom instructions into local JSON library saves and browser storage. Quick metadata extraction instructions (titles, summaries, takeaways, and taxonomies) remain deliberately fixed to guarantee fast, deterministic cataloging.
- **Entry Action Button Order (Seed Last):** Repositioned the action buttons at the top of the entry list panel to place the Seed button last (`+ Note`, `+ Prompt`, `+ Chat`, `+ Seed`), aligning with the primary workflow where manual notes, prompts, and chats are the most frequently triggered entry creations.
- **Eliminated Truncated Summaries & Trailing Ellipses:** Resolved an issue where AI-generated executive summaries were prematurely truncated mid-sentence and appended with trailing ellipses (`...` or `…`) due to an aggressive proportional word cap on shorter notes. Removed the premature slicing cap in `cleanExecutiveSummary`, instructed the generation prompts and schema to mandate complete sentences and prohibit ellipses, and added automatic repair logic to trim existing truncated summaries back to the last complete sentence terminating in full punctuation (`.`, `!`, `?`).
- **Rolled Back AI Note Content Auto-Editing:** Completely removed the AI assistant's ability to edit, update, or auto-apply changes to note content. The assistant is now strictly conversational, dedicated entirely to answering questions, brainstorming, synthesizing, and discussing notes within the chat drawer without modifying user documents. Removed `updatedContent` from API schemas, removed diff highlighting styles and markers, and pruned related modification state tracking.
- **Suppressed Self-References in Current Entry Assistant:** Resolved broken link tags (`[Broken Link: ...]`) caused when the AI generated circular reference tags (`[[kb-ref:ID]]` or `[Ref: ID]`) pointing back to the active document itself. Instructed the assistant across prompts and schemas to never insert citation tags for the currently open note (referring to it naturally in plain English without brackets). Added an automatic sanitizer (`stripSelfReferences`) and reference injector safeguard that normalizes any circular or relative self-references (`current`, `this note`, `self`) into natural text.
- **Full Redo Support & History Keyboard Shortcuts:** Added a comprehensive redo stack (`future`) alongside existing undo capabilities. Users can now redo actions via `Cmd+Shift+Z` / `Ctrl+Shift+Z` or `Ctrl+Y` (`Cmd+Z` / `Ctrl+Z` for undo) and access the new "Redo (Cmd+Shift+Z)" button in the workspace options menu, maintaining up to 25 historical snapshots.

- **Single-Entry AI Assistant Content Access & On-Demand Cross-Note Escalation:** Enhanced the single-entry AI assistant drawer to guarantee direct access to the active entry's full `content` field (`fullContent`, `.content`, or live staged editor text) on every turn. Added a two-pass on-demand escalation engine allowing the single-entry assistant to dynamically request and inspect the full `content` fields of other notes across the knowledge base whenever cross-document comparison, verification, or multi-note synthesis is required.

- **Prompt Reflection Question Sent to AI Chat Models:** Ensured that for Theme Prompt entries, the reflection question (`promptQuestion`) is always passed to Gemini across both Current Entry AI Assistant chats and Whole Brain AI syntheses (Pass 1 summaries and Pass 2 on-demand details). Active prompt chat system instructions, primary document contexts, and related-entry taxonomies now explicitly ground discussions on the reflection question alongside user replies.

- **Responsive Taxonomy Auto-Collapse on AI Drawer Toggle:** Limited automatic collapsing of the taxonomy sidebar when opening the AI assistant drawer to viewport widths under 1800px. On wider screens (1800px+), the taxonomy sidebar remains open alongside the AI drawer for uninterrupted multi-column viewing.

- **New 'Txt' Entry Type with Slate Grey Color:** Introduced a distinct `txt` entry type with a dedicated slate grey theme color (`#94a3b8`) for dropped text and imported text snippets. Operates identically to manual notes for editing, takeaways, and AI synthesis while visually distinguishing dropped/imported text snippets from handwritten user thoughts in list cards, filter chips, and epistemology provenance.

- **Text & Markdown File Multi-Select Library Merge:** The Merge External Library function now supports selecting multiple files at once and importing plain text (`.txt`) and Markdown (`.md`) files directly into your active workspace. Imported notes preserve their original file modification and creation timestamps (`createdAt` and `updatedAt`), set their note titles from the filename, and automatically generate executive summaries using Gemini.

- **Fixed Manual Note Deletion on Navigation:** Fixed a critical state/ref synchronization bug where navigating away from a newly saved manual note (or clicking another entry while editing) caused the empty-note cleanup routine to read stale state or the next note's editor value and delete the note.

- **Streamlined AI Models to Direct Google Latest Aliases:** Removed the API model discovery network query and discovery error banners. Settings now provides instant dropdown selections for Google's official stable aliases (`gemini-flash-lite-latest` as default, `gemini-flash-latest`, and `gemini-pro-latest`) which automatically route to Google's newest live releases without configuration.
- **Documentation on Dedicated Library Folders & `.crswap` Files:** Added clear guidance in the System Manual (`README.md` and `readme.html`) advising users to store their library within its own dedicated folder (e.g. `~/Documents/Brain/`) and clarifying that browser temporary write files (`.crswap`) created during atomic saves can be safely deleted if orphaned by cloud sync services.
- **Theme Prompt Defaults Confirmed for Fresh Libraries:** Ensured fresh libraries initialize with candidate timeframe defaulting to 2 months and sample pool size defaulting to 10 notes across state initialization, new file creation, and schema migration fallbacks.
- **Matched Candidate Timeframe Slider to Legend Stops:** Aligned the candidate timeframe range slider in Settings so its stops match the 6 discrete legend ticks (`1 mo`, `2 mos`, `6 mos`, `1 yr`, `2 yrs`, `All Time`), snapping accurately across indices.
- **System Manual Link in Welcome Note:** Added a direct link to the user manual (`readme.html`) in both the summary highlights and full content of the initial onboarding welcome note.
- **Simplified Embedded Reference Syntax `[Ref: 23]`:** Updated the reference parser and drag-and-drop generator so that embedded citations match the displayed label exactly (e.g. `[Ref: 23]` or lowercase `[ref: 23]`), while preserving full backwards compatibility for legacy `[[kb-ref:ID]]` tags.
- **Updated Welcome Note & Getting Started Guide:** Overhauled the initial welcome note to explain scoped Whole Brain chat (focusing by active types, categories, and projects), introduced Notes, Seeds, and Prompts with instructions to create them via the top entry list buttons, noted that notes must be added before Theme Prompts can run, and included instructions plus direct link for obtaining a Google Gemini API key. Fixed the reference link to correctly cite this note (`[Ref: 1]`).
- **PWA Support & Install Setting:** Added PWA support: web app manifest, icons, and a service worker that caches the app shell and CDN libraries for offline launch (AI API calls and the Safari sync bridge are never cached). Settings has a new Install as App section with an Install button (Chrome/Edge), Safari macOS Add to Dock instructions, and offline-cache status.
- **Seed Chips Label Removed:** Removed the redundant "Seeds:" label before the assistant seed chips (the seed icon on each chip is enough).
- **Seeds Below Assistant Input:** Moved the Seeds shortcut chips in the Entry AI Assistant pane from above the text input to directly below it.
- **Field Order Swap:** Swapped the order of the search field and the quick-add URL/text field (URL/text field now sits above search).
- **Standardised 15px Spacing:** Standardised the vertical spacing between the entry buttons, search field, URL field, generated prompt, sort toggle and first card to 15px.
- **Darker Search & URL Fields (Dark Mode):** Made the search field and quick-add URL field slightly darker in dark mode (new `--field-bg` theme variable; light mode unchanged).
- **Assistant Drawer Toggle Removed:** Removed the redundant Whole Brain / Current Entry scope toggle from the top of the Entry AI Assistant drawer (Whole Brain chat remains available via the purple Chat button).
- **Key Takeaways Refresh Cleanup:** Removed the redundant header refresh link and vertically centered the margin refresh button on hover.
- **Edit / Focus Mode Buttons:** Edit is a flush-right button that becomes Done while editing; the Focus Mode button appears only while editing (left of Done) and never swaps positions. Exiting Focus Mode returns to the inline editor without saving or ending editing; use Done or Escape in the inline editor to save.

## v2.8.82 (2026-10-20)

- **Dark Mode Created / Modified Sort Toggle Visibility:** Slightly increased the contrast and surface definition of the Created / Modified sort toggle track and active sliding pill in dark mode (`--sort-toggle-bg`, `--sort-toggle-border`, `--sort-toggle-pill-bg`, `--sort-toggle-pill-border`).
- **AI Chat Title Auto-Generate Refresh Button:** Added an on-hover auto-generate refresh button beside the title of AI Chat entries that synthesizes a descriptive title from the conversation transcript using the unified metadata generator (`handleSuggestTitle`).

## v2.8.80 (2026-10-20)

- **Animated Theme Prompt Placement Above Search Bar:** Relocated the generated theme prompt card and loading spinner from within the scrollable notes list to sit directly below the entry creation row and above the search bar. Uses a `ResizeObserver`-measured pixel height and margin transition so that lower elements smoothly animate downward both when the loading state appears and when the "generating" section expands into the full generated prompt card (or regenerates), and smoothly glide back up when dismissed or written.

## v2.8.78 (2026-10-20)

- **Search Field Cancel Cross Button:** Added a dedicated cross button (`fa-xmark`) at the right end of the search input field that clears active search queries and exits search focus to cancel search completely (also triggering on <kbd>Escape</kbd>), styled symmetrically with the quick ingestion input.

## v2.8.77 (2026-10-20)

- **Quick Ingestion & Search Field Vertical Alignment:** Centered the submit arrow button, processing spinner, and link icon in the quick add URL/text input bar, as well as the magnifying glass icon and clear button in the search bar, using `top-1/2 -translate-y-1/2` and standardized `h-7` input heights.

## v2.8.76 (2026-10-20)

- **Knowledge Provenance & User Perspective Modeling for Prompts & AI Chats:** Configured prompts and AI chats across the entire application to distinguish primary user-generated knowledge from external contextual information:
  - **User-Generated First-Hand Knowledge:** Strictly assumes only the content of manual Notes and Prompt replies is user-generated content that reflects the user's own issues, projects, and personal knowledge.
  - **External Contextual Knowledge:** Assumes Web, Media, and Text documents represent external, contextual third-hand knowledge (articles, videos, audio, and reference documents collected for context rather than the user's personal thoughts or creations).
  - **Ignored Content:** Strictly ignores Seeds (prompt instructions/shortcuts) and AI chats from prompt generation and AI synthesis pools.
- **Provenance-Aware Context Feeds:** Candidate entries fed to reflection prompt generation, Single-Document AI Assistant chat, and Whole Brain synthesis now include explicit provenance metadata tags and distinguish prompt questions from user replies.

## v2.8.75 (2026-10-20)

- **Streamlined Entry Action Buttons:** Cleaned up the creation action buttons (`+ Note`, `+ Seed`, `+ Prompt`, `+ Chat`) by removing secondary type icons (seedling, brain, comment dots), creating a clean, consistent design with a uniform `+` prefix across all four buttons.
- **Theme Prompt Generation Settings in General Settings:** Moved the prompt candidate timeframe (`dateRangeMonths`) and sample pool size (`poolSize`) configuration from the entry list directly into the General Settings modal under *Theme Prompt Pool Settings*, keeping the feed uncluttered while retaining instant reset to defaults.
- **Scrollable Settings Modal with Fixed Header & Footer:** Redesigned the General Settings modal so the header and footer remain pinned in place while the body scrolls vertically with smooth overflow handling.
- **+ Prompt Button in Entry Creation Bar:** Prompts now originate from a dedicated `+ Prompt` button in the note list action bar alongside `+ Note`, `+ Seed`, and `+ Chat`.
- **Muted Emerald Accent for Prompts:** Refined the prompt accent color from bright neon to a legible, balanced emerald (`#059669`) with matching dark/light mode contrast.
- **Segmented Created vs Modified Sort Switch:** Replaced the previous sort toggle with a clear, labeled segmented toggle directly above the cards for intuitive one-click switching between *Created* and *Modified* dates without re-rendering or unmounting cards.

- **New "Seeds" Entry Type (Gemini Gem Shortcuts):** Introduced a 6th top-level entry type called **Seeds** (`#3b82f6`, Muted Navy Blue with `fa-seedling` icon). Seeds share the same structure as manual notes, but intentionally have **no summaries and no key takeaways** (the Executive Summary and Key Takeaways cards are omitted in the document reader and skipped during auto-metadata generation). Like AI Chats, Seeds have their visibility/type filter **off by default** in the main notes list to avoid cluttering core note streams, and appear last in the entry types order: **Notes > Media > Web > Prompts > AI Chats > Seeds**.
- **Seeds Replace Generic Prompts in AI Assistant:** In the single-entry AI Assistant drawer, generic quick prompt chips (*Summarize*, *Key Takeaways*, *Action Items*, *Connections*) are replaced with matching Seed prompt shortcuts. Seeds with matching Projects or Categories appear on notes sharing those taxonomies, while **uncategorized Seeds** (no assigned project or category) serve as universal / global prompt shortcuts and appear everywhere across all notes. Seed chips feature high-contrast, bold text with vivid seedling icons and dark/light mode readability. Clicking a Seed chip directly executes its prompt text as the user message against the active note.
- **Lateral Space Auto-Toggling for Single-Entry AI View:** When opening the single-entry AI Assistant drawer (via `Cmd+J`, the magic wand button, or switching to an entry with existing chat), the left Taxonomy/Library sidebar is automatically collapsed if open to maximize lateral reading and editing room. When closing the AI view or navigating to an entry without an active chat drawer, the taxonomy view is automatically restored to its previous state.
- **AI View Background Differentiation:** The single-entry AI Assistant drawer uses a white background in light mode, with AI answers in a subtle purple tint and user messages differentiated by background only (no borders). Full-width AI Chat keeps the same background as the content view it replaces.
- **Entry List Sort Toggle:** A toggle (same style as the view toggles) at the top right of the entry list switches between date created and date modified sorting, most recent first in both. Pinned notes stay on top and the choice persists between sessions.
- **Animated List Filtering:** Entries now collapse and fade in and out when filters or search change, matching the taxonomy sidebar animation. All entries stay mounted; the 20px card gap lives inside the collapsing wrapper so hidden cards leave no gaps.
- **Entry-Type Accent Colors:** The red accent in the content reader, editor and Focus Mode now follows the open entry's type color (Note amber, Media red, Web sky, Prompt green, AI Chat purple, Seed blue). The `+ Note` button uses the amber note color.
- **Light-Mode Pane Backgrounds:** The Taxonomy sidebar shares the content view background (`#f7f7f9`) in light mode; the entry list stays white.
- **Entry List Header Ergonomics:** Positioned the creation action buttons (`+ Note`, `+ Seed`, `+ Chat`) directly above the search input in the note list view for immediate access and clean visual separation.
- **In-Place Taxonomy Editing for AI Chats:** Added an interactive taxonomy row directly below the metadata subtitle in Whole Brain AI Chats. Clicking any badge or placeholder opens the full in-place taxonomy editor, allowing users to assign or remove projects, categories, and tags directly on AI chat sessions (with full support for auto-tag generation).
- **Unified Compact Button Height (`h-7`):** Standardized the entry list action bar (`+ Note`, `+ Seed`, `+ Chat`, and search input) to match the compact `h-7` height (28px) of the AI Chat view action buttons.
- **MacOS LaunchAgent Rebranding ("Ali Brain Link"):** Replaced the generic `python3` process label in macOS Login Items & Background Items with `Ali Brain Link` using a native wrapper script (`~/.alibrain/Ali Brain Link`), verified via `sfltool dumpbtm`.
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
