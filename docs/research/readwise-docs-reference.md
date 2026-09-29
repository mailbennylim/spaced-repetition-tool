# Readwise Reader + Readwise (Daily Review): UX / IA reference compiled from the official docs

Compiled 2026-09-27. Sources: the full text of the docs (`https://docs.readwise.io/reader/llms.txt` and `https://docs.readwise.io/readwise/llms.txt`, which are the machine-readable dumps of every docs page), the rendered doc pages, **the screenshots embedded in the docs** (downloaded and inspected; these supply most of the "where on screen" detail), the Aug 2026 and Dec 2025 update posts, the "Getting Started with Reader" onboarding post (blog.readwise.io, 11 Aug 2026), and the old Reader FAQ post.

Conventions:
- **[doc]** means the docs state it in text.
- **[screenshot: file]** means I observed it in an official docs screenshot (`https://docs.readwise.io/images/<file>`). Screenshots may be a few months older than the text.
- Button labels in "quotes" or **bold** are exact strings from the docs or screenshots.

---

## 1. Information architecture

### 1.1 Reader web app (read.readwise.io): left sidebar

Sources: https://docs.readwise.io/reader/docs/faqs/navigation , https://docs.readwise.io/reader/docs/faqs (Trash), https://docs.readwise.io/reader/guides/filtering/default-views , https://docs.readwise.io/reader/guides/ghostreader/global ; screenshots `trash_sidebar_web.png`, `library-subcategories_web.png`, `global-ghostreader_sidebar-entry.png`, `trash_delete-doc_web.gif`, `create-filtered-view_web.gif`, `search-example_web.gif`.

This is the sidebar from top to bottom, as the screenshots show it:

```
┌──────────────────────────────┐
│ Readwise/Reader wordmark  [▯] [⊕] │  ← top row: logo on the left; on the right a "collapse sidebar" icon (rectangle with a bar) and a circled "+" (Add: URL/upload/feed…)
│ ⌂  Home                      │  FIXED
│ 👻 Ghostreader               │  appears only when Global Ghostreader is on; sits "directly below Home", above Library
│ ˅ ||\ Library                │  FIXED. The caret to the left collapses or expands the sub-list
│     📄 Articles              │  default sub-views (filtered views with custom icons)
│     📖 Books                 │   = category:epub
│     ✉  Emails                │
│     ⤳ PDFs                   │
│     🐦 Tweets                │
│     ▶ Videos                 │
│     🎙 Podcasts              │  (newer; present in the 2026 screenshots)
│     🏷 Tags                  │  → Manage tags page
│ ›  ))) Feed                  │  FIXED; has a caret that expands to RSS folders / feed sources
│                              │
│ Pinned ˅                     │  section header with a caret
│   ⭐ Shortlist        34     │  pinned filtered views; the emoji is the first character of the view name; optional count badge at the right
│   📖 Continue reading        │
│   📥 Recently added          │
│   …user views…               │
│   → Manage views             │  small grey link at the end of the Pinned list
│                              │
│ 🗑 Trash                      │  below the Pinned section
│ … (spacer) …                 │
│ 🔍 Search                    │  FIXED, at the bottom-left (shortcut "/")
│ ⚙ Preferences                │
│ (avatar) User Name           │  account menu
└──────────────────────────────┘
```

- **Fixed (cannot be removed):** "Home, Library, Feed, and Search". [doc, navigation FAQ]
- **Configurable:** everything else. You "can reorder the views by dragging and dropping, unpin the views from the sidebar by clicking the down caret at the top of the view, and pin new views from the Manage views page" (read.readwise.io/views). [doc]
- Library sub-categories "have custom icons and can be hidden by toggling the arrow to the left of the Library heading". If you delete one, you can recreate it with the exact query (`category:article`, `category:epub`, `category:email`, `category:pdf`, `category:tweet`, `category:video`, `category:podcast`, with no space after the colon), and it "will re-adopt the default icon and will display in the Library section of the sidebar when Pinned". [doc, default-views]
- **Emoji icon rule:** "if you input an emoji as the first character of the saved name, this emoji will be used as a de facto icon in the left sidebar". [doc]
- **Count badge:** optional per view. It "will appear on top of the icon in the left sidebar", and you toggle it from the view-title dropdown via "Show count badge". The screenshots show the number right-aligned in the sidebar row (e.g. "Shortlist 34"). [doc + screenshot]
- **Trash:** "Navigate to the Trash in the left sidebar below the Pinned section". Inside Trash: hover a row to reveal the "Restore document" icon, and use "Restore all" in the lower-left corner. Trash is device-specific. [doc]
- **Feed folders:** RSS folders show in the sidebar under Feed. You drag feeds from Manage feeds onto sidebar folders, and `Shift+X` opens or closes all folders. [doc, organizing-content]
- **Default filtered views** (on the Manage views page; you can pin them): "⭐ Shortlist", "📥 Recently added", "✨ New in Feed", "📖 Continue reading", "⏱️ Quick reads", "⏳ Long reads", "💎 Recently highlighted". Queries are in §5. The screenshot also shows "Today's Daily Digest" as a view (query `id:… OR id:…`). [doc + screenshot `create-filtered-view_web.gif`]
- **Ghostreader (global):** "click Ghostreader in the left sidebar, directly below Home". [doc, global]

### 1.2 Library locations (tabs across the top of the Library list)

Source: https://docs.readwise.io/reader/guides/workflows/library-configuration ; screenshots `library-config_options_web.png`, `library-config_dropdown_web.png`, `doc-status-indicators_web.png`.

The Library header reads "||\ **Library** ˅" followed by uppercase text tabs: **INBOX · LATER · ARCHIVE**. The active tab is dark with an underline, and the others are grey. [screenshot]

There are three configurations, chosen in a "Library locations" modal (**Library** title dropdown → "Edit Library locations", or Preferences → "Library configuration" blue text). The modal title is "Library locations", the prompt is "Choose your desired workflow:", there is a radio button per option showing its icon tabs, and the buttons at the bottom-right are "Cancel" and "Update". [screenshot]

| Config | Tabs | Modal caption (exact) | Shortcuts |
|---|---|---|---|
| **Triage** (default) | Inbox → Later → Archive | "Saved documents go to Inbox. From there, triage items you want to defer into Later." | Inbox `Shift+E`, Later `L`, Archive `E` |
| **Shortlist** | Later → Shortlist → Archive | "Saved documents go to Later. From there, promote documents you want to focus on into Shortlist." | Later `L`, Shortlist `S`, Archive `E` |
| **Classic** | Later → Archive | "Nothing fancy. Classic read-it-later Instapaper or Pocket workflow." | Later `L`, Archive `E` |

Icons: Inbox is a tray, Later is a clock, Shortlist is a star, Archive is a box. Switching configuration shows a confirmation if documents would move. [doc]

In Triage mode, `S` adds the `shortlist` **tag** (which the default "⭐ Shortlist" view uses). In Shortlist mode, `S` moves the document to the Shortlist location. [doc]

### 1.3 Feed

Sources: https://docs.readwise.io/reader/docs/faqs/adding-new-content , https://docs.readwise.io/reader/docs/faqs/feed

- Feed "is where things go that are automatically pushed to you, such as RSS feed content, and it's divided into two locations: **Unseen** and **Seen**". Library "is where things go that you manually curate". [doc]
- The Feed tabs are Unseen and Seen. The Unseen tab has "**Mark all as seen**" in the bottom-left, and the Seen tab has "**Delete all**" in the bottom-left. [doc, query-examples "Clean out old Feed documents"]
- Feed sources are managed at read.readwise.io/feed/sources ("Manage feeds"), which has the tabs **Subscribed** and **Suggested** (Suggested carries an orange "New" pill in the screenshot) and an "**Add feed**" button at the top-right. [screenshot `manage-folders-dropdown_web.png`]

### 1.4 Other Reader web pages

- **Home**: "Welcome <Name>" at the top-left and a "**Configure** ˅" button at the top-right. The body is a vertical stack of horizontal carousels, one per chosen view (e.g. "📖 Currently Reading ˅", "Recommended ˅", "⭐ Shortlist ˅ Tagged `shortlist` and not yet archived (default view)"). Each row has the view title with a caret, the description in grey, pagination dots, and ‹ › arrows at the right. Cards show a cover image, an uppercase domain, the title, the author, and a progress ring with the time. [screenshot `configure-home_web.gif`, `highlight-tags_tab.gif`]
  - Configure: "click **Configure** in the top right and check the box to the left of the view you want to add. To change the order of the views, click and drag the dots to the right of a views name." Only the **first tab of a split view** shows on Home. [doc]
  - The Daily Digest on web: "Configure" dropdown → "Today's Daily Digest". [doc]
- **Manage views** (read.readwise.io/views): the page title is "Filtered views", with a "Find..." search box at the top-centre-right and an "**Add filtered view**" button at the top-right. The table columns are checkbox · NAME (icon + name) · DESCRIPTION · QUERY (monospace) · DOCUMENTS · LAST UPDATED. On row hover, pencil (edit), pin, and trash icons appear at the right. A "Count: N" pill sits at the bottom-right. [screenshot]
- **Manage tags** (read.readwise.io/tags) has a Views column for assigning tags to views. The **Highlights** tab (read.readwise.io/highlights-tags) lists highlight tags, and clicking one opens a notebook view of those highlights. [doc]
- **Manage feeds** (read.readwise.io/feed/sources): columns checkbox · NAME (favicon) · DESCRIPTION · DOCUMENTS · FOLDERS (folder chips) · LAST UPDATED ˅. Row hover shows the icons i (info), pencil, pin, and trash. The FOLDERS cell opens a "Manage folders..." dropdown: "Include documents from "<feed>" in the following folders", a checkbox list, and "⊕ Create a new folder from feed". [screenshot]
- **Preferences** (read.readwise.io/preferences) includes "Library configuration", "Side panel visibility by default", "Ghostreader Enabled", and a "Customize" link for shortcuts (read.readwise.io/preferences/shortcuts). The Ghostreader sub-page is /preferences/ghostreader. Other pages are /integrations, /add-to-library, /add-to-feed, and /profile ("Export account data" section). [doc]

### 1.5 Reader mobile IA

Sources: appearance, highlights-tags-notes, filtered-views, and basics FAQs; screenshots `reader-toolbar-layout_settings.png`, `customize-swipes_mark-all-seen_mobile.gif`.

- **Bottom tab bar (5):** **Home · Library · Feed · Search · Account**. Icons: house, ||\, RSS waves, magnifier, avatar. The active tab is blue. [screenshot]
- Library list header: a ☰ (three lines) icon at the top-left opens the **Browse** side panel (tags list, Document Tags, Highlight Tags with counts); ⊕ and ⋯ are at the top-right. There is a large title with a count ("Inbox 156"). A **floating segmented pill "Inbox | Later | Archive"** sits just above the tab bar. [screenshot + doc]
- Filtered views on mobile are under the **Search** tab (tap `+` at the top-right, enter a query, "Show", then "Save"). Trash is under Search → bottom → "Deleted documents" → "Trash". [doc]
- The Feed page has ☰ at the top-left for the feed sidebar/folders and `+` at the top-right ("Add new folder"). A "stack of cards" icon opens the card UI, which marks items seen as you scroll. [doc]

### 1.6 Readwise web app (readwise.io) navigation

Sources: https://docs.readwise.io/readwise/docs/faqs/finding-highlights , https://docs.readwise.io/readwise/docs/faqs/reviewing-highlights , https://docs.readwise.io/readwise/guides/themed-reviews ; screenshots `browse-highlights_web.png`, `chat-with-highlights.png`, `ft_*.png`.

- **Top nav bar (left to right):** "R" logo (black square) · **Connect & Sync** · **Browse** (dropdown) · **Chat** · **Resources**. On the right: a ⚡ streak count (e.g. "⚡ 554"), a 🔍 search icon, a 🔔 notifications bell, and an account avatar. [screenshot]
- **Browse dropdown:** "Everything", "Books", "Supplemental Books", "Articles", "Tweets", "Podcasts", "Highlight Tags", "Favorites". [screenshot]
- **Dashboard** (readwise.io/dashboard): a large "Daily Review" hero card at the top (dark blue, serif title, "✓ You reviewed N highlights from …" subline), with "‹ Previous" and dot pagination below it. Themed Reviews: "scrolling to the bottom of your Dashboard and selecting Themed Reviews". Due Themed Reviews "appear at the top of your Readwise dashboard". [doc + screenshot]
- **Search:** "click the magnifying glass icon in the top right to open the search field"; URL `readwise.io/search?q={query}`. [doc]
- **Account menu → Configure Reviews:** tabs **Email Preferences · Review Settings · Frequency Tuning** (readwise.io/configure, /configure/review, /configure/tune/books). [screenshot]
- **Library** (readwise.io/library): title "Library" with tabs **Everything · Books · Supplemental Books · Articles · Tweets · Podcasts** and a "Search Articles" box at the right. [screenshot `ft_library.png`]
- **Mastery dashboard:** readwise.io/mastery. **Themed Reviews:** readwise.io/themed_reviews. **Latest highlights:** readwise.io/latest. **Chat:** readwise.io/chat.
- **Readwise mobile (2.0, Aug 2026):** Home screen with review cards (Daily Review card, then the **Mastery** row "just below your Daily Review" showing the total card count and starting a session of up to 5 cards), and "a scrollable feed of recent or random highlights". It also has a Search tab ("Browse your content" categories), "Chat With Your Highlights" on Home, and a stats screen. [doc + update-aug2026]

---

## 2. Screen-by-screen layout

### 2.1 Reader library list view (web)

Sources: screenshots `trash_delete-doc_web.gif`, `search-example_web.gif`, `doc-status-indicators_web.png`, `reader-progress-bar_web-list-partially-read.png`, `bump-to-top.png`; basics FAQ.

The layout is three columns: **left sidebar | document list | right Info panel**. The right panel is visible in list view and shows the focused document's Info.

- **List header:** "||\ Library ˅" (the view title plus a caret dropdown), then the location tabs INBOX / LATER / ARCHIVE. On the far right is a sort control "↓ **Date moved** ˅". [screenshot]
- **Row anatomy (left to right):**
  - A **status dot** at the thumbnail's upper-left corner. **Dark blue** means unseen, **teal** means unseen and from RSS, **green** means saved more than once. It disappears on open. [doc + screenshot]
  - A square thumbnail of about 56px.
  - Line 1: **title** (bold, truncated).
  - Line 2: the grey **summary**, prefixed by an emoji (the Ghostreader summary).
  - Line 3: favicon · domain • author • reading time ("23 mins", or "27min left" when started) • document-tag chips (grey pills such as "#nonfiction", "wiseup").
  - At the far right, the date (e.g. "11:22 am", "Oct 9th", "Jun 3rd").
  - Under the row, a thin **progress bar** (light-grey track with a blue→purple gradient fill up to the reading progress, a darker grey segment for skimmed-ahead parts, and a small grey dot for the last location). [doc + screenshot]
- **Focused/hovered row:** a blue vertical bar on the left edge and a light-grey highlight. On hover, inline action icons appear at the right of the row: "**⋯**" (More actions), then **Inbox (tray) · Later (clock) · Archive (box)** icons in a small pill. [screenshot]
- **Row "⋯" menu (list context), items with shortcuts:** "Add document tag T", "Add document note Shift N", "Bump to top B", "Start text-to-speech", — "Mark as unseen Space", "Mark all as seen above", "Mark all as seen below", — "Edit metadata Shift M", "Reset reading progress Shift R", — "Open original O", "Copy document URL Shift C", "Send to Kindle", — "**Delete document** D" (red). [screenshot `bump-to-top.png`]
- **Footer:** "Count: 250" pill at the bottom-right of the list. [screenshot]
- **Right Info panel (in list view):** tabs "Info | Notebook [n] | Chat" and a "hide panel" icon at the top-right. Content: title (bold), domain (hover to reveal a copy button), author avatar + name + @handle, a full-width "⊛ **Subscribe**" pill button (or "Subscribed"/"Unsubscribe"), **SUMMARY** (emoji + text, and a "💬" pull-quote, then "Summarized by Ghostreader"), **DOCUMENT TAGS** (chips), and **METADATA** (key/value: Type, Domain, Published, Length "22 mins (5,597 words)", Saved, Progress "0% (22 mins left)", Language). At the bottom are "**Edit metadata**" and a "?" circle (which contains "Show getting started tips"). [screenshot + doc]
- Keyboard: ↑/↓ move the focus between rows. Shortcuts act on the focused document (T, E, L, Shift+E, S, D, B, Space, …). Enter or click opens the document (Enter is inferred, not stated).

### 2.2 Reader document view (web)

Sources: screenshots `side-panel_close-left_web.png`, `side-panel_close-right_web.png`, `chat-side-panel.png`, `reader-return-to-position_web.png`, `reader-public-link_enable-web.png`, `pdf-snapshot_web.gif`; appearance, basics, and TTS FAQs.

```
┌ left panel (TOC) ─┬─────────── document column ───────────┬─ right panel ─────────────┐
│ [←] [˄][˅] [▯]    │ Aa                   [tray][⏲][▣]  ⋯ │ Info  Notebook 1  Chat [▯]│
│                   │                          [▶ Listen]   │                           │
│ Contents          │  Big serif TITLE                      │  (Info / Notebook / Chat) │
│  Heading 1 (blue= │  author/domain ………………… Mar 23rd       │                           │
│   current)        │  ───────────────────────────          │                           │
│  Heading 2        │  body text …                          │                           │
│  …                │                                (↑)    │ ← round "return" button   │
└───────────────────┴───────────────────────────────────────┴───────────────────────────┘
  thin reading-progress bar across the very top of the window (blue→purple gradient)
```

- **Top-left of the left panel:**
  - "←" back to the list, in a round grey button.
  - "˄ ˅" previous/next document, in a grouped pill.
  - The **Hide left panel** icon (a rectangle with a left bar), shortcut `[`. [screenshot + doc]
- **Left panel:**
  - Articles: a "**Contents**" heading (or the document title) followed by the TOC headings. The current section is shown in blue. [screenshot]
  - PDFs: page thumbnails with the page number, and the current page outlined in blue. [screenshot `pdf-snapshot_web.gif`]
- **Top of the document column, left:** "**Aa**" (the Appearance menu).
  - For PDFs the top toolbar reads: Aa · "Text view" icon · rotate icon · snapshot icon (a square with a plus) · zoom "160% ˅" · centred page counter "22 of 448". [screenshot]
  - Emails and videos have a "document icon" at the top-left that toggles original/clean view (email) or the enhanced transcript (video).
  - Videos have a "**Video settings**" menu and a globe (transcript language) at the top-left. [doc]
- **Top of the document column, right:** the triage icons **Inbox (tray) · Later (clock) · Archive (box)**, then "**⋯**" (More actions). [screenshot]
- **"▶ Listen"** pill button, top-right, "above the document's title" (starts TTS). [doc + screenshot]
- **Title block:** a large serif title, a byline row with the date right-aligned (e.g. "Mar 23rd", "Nov 11th 2025"), and a horizontal rule below. [screenshot]
- **Document "⋯" menu (doc context), with shortcuts:** "Add document tag Shift T", "Add document note Shift N", "Start text-to-speech", — "Edit metadata Shift M", "Reset reading progress Shift R", — "Open original O", "Copy document URL Shift C", "Enable public link Option S", — "Print with annotations Cmd P", "Send to Kindle", — "Delete document D" (red). PDFs also have "Download with annotations" (Shift+D). "Bump to top" (B) also exists. [screenshot `reader-public-link_enable-web.png` + doc]
- **After you enable a public link:** a **blue link icon** appears in the top bar, and clicking it gives "Copy link", "Disable public link" (with a confirm popup), and, for views, "Refresh public link". [doc]
- **Focus indicator:** a vertical **blue bar in the left margin** beside the focused paragraph. ↑/↓ move it paragraph by paragraph. (The docs call it "blue" in the FAQ and "purple" in the onboarding post; the screenshots show blue.) "Focus mode" greys out unfocused paragraphs (a bug-fix note mentions it; there is no doc on how to toggle it). [doc + screenshot + update-aug2026]
- **Return button:** "a round arrow button appears in the bottom right corner of the reading view" whenever the current location differs from the reading progress. "The arrow flips to point toward your reading position." [doc + screenshot]
- **Progress bar:** a thin bar spanning the top edge of the window, with a blue→purple gradient. [screenshot]
- **Right panel:** tabs "**Info** | **Notebook** [count badge] | **Chat**", plus the **Hide right panel** icon at the far top-right (shortcut `]`). Pressing backtick `` ` `` twice cycles between the panels. The panel is resizable (Aug 2026). The screenshot of an older PDF also shows a "Links [0]" tab. With Global Ghostreader on, the Chat tab is labelled "**Ghostreader**", and there is an expand icon at the top-right to open a full-screen chat. [doc + screenshot]
  - **Info tab:** described in §2.1. The ghost icon appears when you hover the summary (manual summarize). "Edit metadata" is at the bottom. Clicking the author gives a filtered view by author. Clicking "Source" gives a filtered view by feed. "Subscribe" / "Unsubscribe" (RSS) and "Unsubscribe" (email senders, which blocks the sender) also live here.
  - **Notebook tab:**
    - A "**Document note**" label with the field "Add a document note...".
    - A "**Highlights**" list of highlight cards (yellow background text).
    - Hovering a highlight shows a "⋯" menu, which includes "Share highlight as image".
    - Headings detected in the document appear in the Notebook view (Shift+1).
    - At the bottom: "**Export**" (menu: "Copy to clipboard" Shift+Option+C, "Download annotations" Shift+Option+D, "Edit export file"), "Open", and a "?" circle. [doc + screenshot]
  - **Chat tab:**
    - The "Ask anything..." input.
    - A model dropdown at the bottom of the input ("Fast" / "Thinking").
    - A "**Preset prompt**" dropdown at the bottom (with Global Ghostreader: a "**Skills**" dropdown; typing `/` gives slash commands).
    - "**Clear chat**" at the bottom of the panel.
    - Under each response: a notebook icon (saves to the document note) and a "**Copy**" icon.
    - Citations link to the text: hover to preview, click to jump. [doc]
- **Marginalia:** "If you have a wide enough screen—or hide the sidebars using `[` and `]`—these annotations (notes and tags) will appear in the right margin." With the panels open they are "compressed inline". [doc]
- **Default panel visibility:** Preferences → "Side panel visibility by default" offers both hidden, left hidden, right hidden, or "Both panels visible" (the default). The Command Palette also has "Hide side panels by default in reading view". [doc]

### 2.3 Highlight popover / annotation bar

Sources: screenshots `add-highlight-tag_web.png`, `add-highlight-tag.jpeg`; highlights-tags-notes FAQ; chat and default-prompts guides.

- **Web:** a small floating **rounded pill directly above the highlight**, horizontally near the top edge of the selection. It holds four icon buttons, left to right:
  1. a **circled ✕** (remove highlight; the circle has a yellow fill);
  2. a **speech bubble** (note, `N`);
  3. a **tag** (tag, `T`);
  4. **⋯** (more: "Copy text", "**Chat about this**" (Ghostreader, `G`), …). [screenshot + doc]
- **Highlight rendering:** a pale yellow background with a darker yellow underline on each line, and **round drag handles** at the start (top-left) and end (bottom-right). Dragging the handles resizes the highlight, and dragging one into another highlight merges them. The focused paragraph also shows the blue left-margin bar. [screenshot + doc]
- **Mobile:** tapping a highlight shows the "annotation bar" with a tag icon, a note icon, a ghost icon (opens chat with the highlight attached), a document icon in tag views (jump to context), and "⋯". The bar's position is dynamic on tablets. Double-tap highlights a paragraph. Long-pressing a word opens Quick Lookup (1–3 words). [doc + update posts]
- **Note field:** `Enter` saves and `Shift+Enter` inserts a newline. **Tag dialog:** a dropdown list with type-to-search; `Enter` applies and closes, and `Cmd/Ctrl+Enter` applies and keeps the dialog open. On mobile, typing a new name and tapping the row below the field creates the tag. [doc]
- **No colours:** "Reader doesn't support multiple colors of highlights." [doc]

### 2.4 Browser extension bar

Source: https://docs.readwise.io/reader/docs/saving-content ; screenshot `extension-features_shadow.png`.

A thin white bar **pinned to the top of the web page**, from left to right:
1. "**R Open in Reader ›**"
2. a yellow **highlight-count badge** (e.g. "0")
3. (right side) a toggle "**Auto highlighting**" (on by default)
4. a tag+ icon ("Add tags")
5. a speech-bubble icon ("Add a document note")
6. a location dropdown "**⏲ Later ˅**" (move to another section; the default is the first Library section)
7. "**˄**" to hide the bar

The shortcut is `Alt+R`. Saving also "scans the domain for the presence of an RSS feed".

### 2.5 Mobile share sheet (save screen)

Source: saving-content; screenshot `annotated-share-sheet_mobile.jpeg`.

A full-screen dark sheet with the Reader app icon centred and the text "**Saved to Reader**". Near the bottom is a wide "**Read Now**" button, with "Tap anywhere to dismiss" beneath it. Below that is a row of 5 round icon buttons: **Delete** (trash) · **Add tags** (tag) · **Add a document note** (speech bubble, "bottom center") · **Move to Later** (clock; a **star** for Shortlist in the Shortlist config) · **Move to Archive** (box).

### 2.6 Add-content flows (web)

Sources: adding-new-content, feed, email-newsletters, importing-content.

- The **blue "+" button**: the circled + at the top of the sidebar (screenshot). The email FAQ calls it "the blue `+` button in the bottom left", with "**More import options...**", which goes to the import page read.readwise.io/add-to-library. The exact position differs between doc revisions. [doc + screenshot]
- **Add URL:** `A` ("Add URL" option; paste a URL; goes to the first Library section). You can also use `https://wise.readwise.io/save?url=<url>`. [doc]
- **Upload:** `U` opens the "Upload dialog", or drag a file anywhere onto the app. Accepted: PDF, EPUB, Markdown, OPML, CSV (bulk URLs, needs a "URL" column and an optional "Title" column), and the Pocket zip (on Integrations). Limits: 500 MB, Markdown 10 MB. [doc]
- **Add feed:** `Shift+A` ("Add feeds" / "Add Feed dialogue": "search for or manually input a domain or RSS feed"). YouTube channel URLs add the 5 most recent videos. Other routes: the auto-detected "**Subscribe**" button in the right sidebar of any saved document, the "Suggested" tab ("High signal feeds" section), and OPML upload. [doc]
- **Email addresses:** there are two: `…@library.readwise.io` (read.readwise.io/add-to-library) and `…@feed.readwise.io` (read.readwise.io/add-to-feed). "**Personalize email addresses**" is on the Add to Library page. If the Email section is empty, the right sidebar shows your address; otherwise use the "?" menu at the bottom-right of the right sidebar → "Show getting started tips". [doc]
- **Mobile:** tap `+` at the top-right of Library → "Upload a file". There is also "Save File to Reader" in the Files share sheet, and "⋯" at the top-right of Feeds → "Add feed". [doc]
- **Integrations** page: Instapaper "Connect", Pocket zip upload, Twitter routing, Kindle, and the OpenAI key. Instapaper import sends the 10 most recent unarchived items → Inbox, other unarchived items → Later, and archived items → Archive. [doc]

### 2.7 Feed view

- The layout matches the Library list, with tabs **Unseen / Seen** (a split by "Seen"). Unseen RSS items have a **teal** dot. "Mark all as seen" is at the bottom-left of Unseen, and "Delete all" is at the bottom-left of Seen. Row menu: "Mark all as seen above / below". Clicking **Source** in the Info panel gives a filtered view of that feed. [doc]
- "Reader doesn't have a way to automatically mark items as seen as you scroll", except on mobile with the card-stack UI (the "stack of cards" icon). [doc]
- Opening a document marks it seen (the dot disappears). Feed items are **not** full-text searchable until they are moved to the Library. [doc]

### 2.8 Filtered view editor

Sources: organizing-content, filtered-views, query-examples; screenshots `split-view_web.png`, `add-filtered-view_web.png`.

- **Create:** Manage views → "**Add filtered view**" (top-right), or `Shift+F` from anywhere. Enter the query → "**Filter by query**" → the list previews → "**Save view**" → name it. [doc]
- **Edit an existing view:** press `Shift+F` while in the view. This opens the "filtered view's editing dialog" with the query prefilled. [doc]
- **View title dropdown** (caret next to the title in the list header). Menu items: "**Edit filter**", "**Split view** \\", "**Enable public link**", — "**Mark all as seen**", "**Apply bulk action** Shift B", — "**Pin to sidebar**", "**Show count badge**", — "**Delete view**" (red). [screenshot]
- **Split view** (`\`): choose **Location** (Inbox/Later/Archive tabs) or **Seen** (Unseen/Seen tabs). [doc]
- **Bulk actions** (`Shift+B`): a palette-like menu where you type to find e.g. "Delete all documents". It acts on every document in the current list. There is no multi-select. [doc]
- **Clicking any tag, author, or Source** creates an unsaved filtered view that you can then save. [doc]
- **Mobile:** Search tab → `+` → query → "Show" → "Save". The split option is in the view's "⋯" menu. [doc]

### 2.9 Search

Sources: https://docs.readwise.io/reader/docs/faqs/searching ; screenshot `reader-better-search_toggle-web.png`.

- **Web:** click 🔍 **Search** at the bottom-left of the sidebar, or press `/`. A full-width search bar sits at the top, with a "**Better Search (beta)**" toggle at its right end and an ✕ to close. [doc + screenshot]
- **Results rows:** thumbnail · title with the matched terms highlighted · URL • domain • time • tag chips · a snippet with highlighted matches · the location label ("INBOX") right-aligned in grey caps. [screenshot]
- **Scope:** full text, titles, and authors of the Library (not the Feed). Filtered views and search are separate. In-document search is `Cmd/Ctrl+F`, or mobile "⋯" → "Find in document". [doc]
- **Mobile:** Search tab. The field is at the top, the toggle sits below the field when it is empty, recent searches have an ✕, and filtered views and "Deleted documents → Trash" are further down. [doc]

### 2.10 Appearance panel

Source: https://docs.readwise.io/reader/docs/faqs/appearance

- Web: the "**Aa**" button at the top-left of the document column. Mobile: "⋯" → "**Appearance**" (also a big "Aa Appearance" tile in the Actions sheet). In long-form view, Appearance moves to the top-right, replacing Listen. [doc + screenshot]
- Controls:
  - Typeface (serif/sans list incl. "Atkinson Hyperlegible", "OpenDyslexic").
  - Font size 14–80px, default 20 (`Shift+-` / `Shift+=`).
  - Line spacing, default 1.4 (`Shift+:` / `Shift+"`).
  - Line width (web only), default medium (`Shift+,` / `Shift+.`).
  - Theme Light / Dark / Auto (`Cmd/Ctrl+Option+T`).
  - "**Paged scroll**" (vertical pagination; tap the left/right margins to turn the page; default on for EPUB).
  - "**Horizontal pagination**" in a **Pagination** section (tablet, landscape, two-column).
  - "**More style options**" → "Text direction", "Justify text".
  - Web RTL: Command Palette "Change text direction to RTL". [doc]
- Reading progress display for EPUBs: percent / page number / time left in chapter / time left in book / hidden (Aug 2026). [update-aug2026]
- Account settings: "Paged scrolling defaults" (per document type), "Long-form reading view" (per type; EPUB on by default; hides the action-heavy bottom bar), "Change app icon", "E-ink Mode" (Reduce motion, Reduce page animations, High contrast, Use volume buttons to turn pages), "Toolbar layout", "Quick lookup", "Keep screen awake", "Show clock", "Return indicator", "Tap-to-open UI", "Customize swipes", "Offline documents", "Headphone gestures", "Default view", "Library configuration", "Enable Daily Digest", "Enable Ghostreader (AI)". [doc + screenshot]

### 2.11 Mobile document view and differences

Sources: appearance (toolbar layouts), chat, TTS, basics; screenshots `reader-toolbar-layout_settings.png`, `appearance-options.png`.

- **Top-right:** a "▶" Play (TTS) button, or the Appearance button in long-form view. There is also an "i" button that opens the Info / Notebook panel. [doc]
- **Bottom toolbar**, which has two layouts (Account → Reading View → **Toolbar layout**, set separately for **Short form** and **Long form**):
  - **Short-form Modern:**
    - "Ask anything... 👻" pill on the left, then a divider.
    - A comment+tag icon (notes and tags).
    - A tray icon with an up/down chevron ("**Change triage status**" menu).
    - A "⋯" circle.
    - Swiping horizontally across the toolbar moves to the next or previous document. [screenshot + doc]
  - **Short-form Classic:** "Individual triage buttons": Inbox · Later · Archive | comment+tag · ⋯. [screenshot]
  - **Long-form Modern:** "33%" progress · "Ask anything..." · ⋯. **Long-form Classic:** "33%" centred · ⋯ ("Ghostreader hidden"). [screenshot]
  - Modern requires Ghostreader to be enabled.
- **Progress** shows as a thin line above the bottom toolbar. The "**Return to [X]%**" button near the bottom (with an X to dismiss) resets progress to the current location. [doc]
- **"⋯" Actions sheet** (bottom-right), titled "Actions" with "Done" at the top-right. [screenshot]
  - A top row of three tiles: "**Aa Appearance**", "**Ghostreader**", "**↗ Open**".
  - A list: "Toggle autohighlighting" (switch), "Share document", "Find in document", "Edit metadata", "Support and feedback".
  - A separate red "**Delete document**".
  - Other docs mention "View original", "View as text" (PDF), "View enhanced transcript", "Captions language", "Listen using text-to-speech" (long-form), and "Notes and tags".
- **List swipes:** left and right, each with short and long variants, customizable at Account → "**Customize swipes**". A default short left-to-right swipe opens the tagging menu. One option is "mark all above as seen". Long-pressing a list item or tapping the card's ⋯ → "Notes and tags" edits document tags. [doc]
- **Chat on mobile:** a sheet that slides up over the document. Close it with a swipe down or ✕ at the top-right. A trash icon at the top-left clears it. There is a **Prompts** dropdown at the bottom. [doc]
- **Quick Lookup** (1–3 words selected): a panel slides up with tabs **Define / Lookup / Translate**. Its footer has "⋯" ("Disable Quick lookup"), "**Copy**", and "**Highlight**" (which saves the highlight with the result as its note). [doc]
- **Tablets:** sticky left sidebar, two-column view, native stylus highlighting ("Highlights will initiate as soon as your stylus touches the text"; scroll by swiping in the margins). [doc + update-dec2025]
- **Undo:** iOS shake-to-undo, plus the "undo" button in the toast. [doc]

### 2.12 TTS player

Source: text-to-speech FAQ.

- Start it with "▶ Listen" (web, top-right above the title), the Play button (mobile, top-right), or the palette "tts". Playback starts "at whichever paragraph is roughly centered on your screen". [doc]
- A playback control bar with the **pause button in the middle**, 15s back/forward, and a square **stop** icon at the top-right. When you scroll away, the 15s buttons become "**return**" and "**jump**". A **waveform icon** on the left of the bar changes the voice and language ("View all languages"). Auto-scroll follows the speech until you scroll. [doc]

### 2.13 Readwise Daily Review card (web)

Sources: reviewing-highlights FAQ, mastery guide; screenshots `daily-review_scroll-mode.gif`, `ft_review.png`, `mastery-button.png`, `bonus-highlight_daily-review_web.png`, `daily-review-tts_playback-bar_web.png`.

```
 ‹                          Daily Review                         3 of 11      (older)
 ‹                          Daily Review                     (▶) (☰)          (newer: play + list icons)
      ┌──────────────────────────────────────────────────────────────┐
  ←   │ •  [cover] Book/Article Title  🏷2                  [💬💬] ˅ │
      │            Author                                            │
      │                                                              │
      │   Highlight text in a large serif …                          │
      │                                                              │
      │   [soul-words ×]                         🏷   ♡   ✎   ⇪     │
      └──────────────────────────────────────────────────────────────┘
              (✕)          (🧠)       (⏲)            (✓ blue filled)
            Discard       Master    Feedback          Keep / Done
```

- **Header bar:** "‹" back at the left. "**Daily Review**" is the centred title. On the right, either a progress counter "**3 of 11**" (older screenshot) or a "**▶ play icon**" (audio review) and a "**list icon**" (switch to Scroll Mode) (newer). [screenshot + doc]
- **Left of the card:** a light-blue "←" previous-highlight arrow (it counts as a skip). [screenshot]
- **Card header:**
  - A small dot at the left (possibly an unseen or first-review marker; not documented).
  - The cover thumbnail.
  - The **title** (bold) with a tag-count "🏷 2".
  - The author below.
- **Card header, top-right:** the "**overlapping speech bubble**" icon ("find related highlights"; opens Chat With Highlights with an autofilled prompt) and a "**˅**" down-arrow menu. [doc + screenshot]
- **Down-arrow menu:** "View original highlight" (or "View in [Source]", e.g. "View in Instapaper"), "Copy highlight text", "Edit document metadata", "Add document tags", "**Show this doc more often**", "**Show this doc less often**", "**Never show this doc again**", plus "Edit Mastery Flashcard" / "Delete Mastery Flashcard" on Mastery cards. Older wording is "Show this article more often" and so on. [screenshot]
- **Card body:** the highlight text in a large serif. Highlight tags appear as blue chips with "×" at the bottom-left. [screenshot]
- **Card footer, bottom-right icons:** 🏷 tag (`t`) · ♡ favorite (`f`; filled when favorited) · ✎ edit (`e`) · ⇪ share (`s`). [screenshot]
- **Action row below the card (centred):**
  - "**Discard**": circle outline with ✕, `d`.
  - "**Master**": brain icon, `m`.
  - "**Feedback**": clock icon, `` ` ``.
  - "**Keep**" (or "**Done**" in other screenshots): a large filled blue circle with ✓. `Enter` means "Done (Mark highlight as read and move to next)".
  - Labels sit under each icon. [screenshot + doc]
- **Bonus Highlight** (last card):
  - A grey banner above the card: "Based on your highlights, we think you'll love this book recommendation...".
  - The action row is Discard · "**View on Amazon**" (blue pill) · "**Next**" (✓).
  - Turn it off with "Receive Bonus Highlights". [screenshot + doc]
- **Review Mode vs Scroll Mode:**
  - Review Mode is one card at a time and is the default for Daily and Themed reviews. Scroll Mode is all highlights on one page and is the default for single-document pages. Toggle with the "list icon" (review → scroll) or the "grid icon" (document page → review); `ll` also toggles.
  - Arrow navigation counts as a "skip", so the highlight is not processed. Only Discard or Keep processes it.
  - Review Mode on a document "prioritizes highlights that haven't been processed". [doc]
- **Audio review:** the ▶ at the top-right starts it. A bottom playback bar shows "R" logo · "Daily Review for June 30" · centred ⟲15 · ❚❚ · 15⟳ over a progress track with elapsed "03:20" / remaining "-00:33" · volume slider · "1x" speed · ✕ close at the far right. [screenshot]
- **Streak:** ⚡ count in the top nav. Themed Reviews also count toward the streak. [doc]
- **Readwise mobile (2.0) review card:**
  - Header: ✕ top-left, "**Daily Review**" title, and a row of progress dots ending in ✓ below the title.
  - Card header: cover · title · author, a "🏷 2" pill, and "⋯" at the top-right.
  - Card footer icons: share · ghost (chat) · ♡ · tag · note (notepad with pencil).
  - Bottom action bar: "**Discard**" (✕ pill) · "**Master**" · "**Frequency**" (clock) · "**Kept**" (blue ✓ pill; shows as Kept once processed).
  - Aug 2026 added "an indicator for highlights being reviewed for the first time" and "kept the feedback buttons visible throughout". [screenshot `rw-mastery_mobile-review-option.png` + update-aug2026]

### 2.14 Mastery card and editor

Sources: https://docs.readwise.io/readwise/guides/mastery , reviewing-highlights FAQ; screenshots `mastery-qa-tab.png`, `mastery-feedback.png`, `rw-mastery_web-edit-delete.png`.

- **Create:** the "**Master**" button (`M`) below a review card, or the Mastery icon in a highlight's own view, or on mobile "⋯" → "**Master highlight**". [doc]
- **Editor** (a dark navy panel overlaying the card; the highlight text shows below it):
  - Two tabs across the top: "**Cloze Deletion**" (the default tab) | "**Question & Answer**".
  - **Q&A tab:** the prompt "🧠 **Phrase this highlight as a question.** We'll quiz you on it later, helping you master the idea." Then a "**Question**" input (placeholder "What is the meaning of life?"), an "**Answer**" textarea (placeholder "Fourty two."), a link "**Use highlight text as Answer**" at the bottom-left, and "**Cancel**" and "**Save Flashcard**" at the bottom-right.
  - **Cloze tab:** select a word or phrase in the highlight, then "Save". On mobile, tap a word, or press, hold, and drag for up to 12 words. All instances are hidden. "Undo selection" clears it. [doc + screenshot]
- **Reviewing a Q&A card:** the card shows "**Q:** …" and a dark "**Show Answer**" button. After reveal it shows "**A:** …" and "**Original Highlight:** …" (grey). A white panel below the card reads "🧠 **Show** this highlight again:" with four buttons: "**Never**" (red text) · "**Soon**" · "**Later**" · "**Someday**". [screenshot]
- **Algorithm:** a half-life decay. The initial half-life is 7d for Soon, 14d for Later, and 28d for Someday. A card whose recall probability is at or below 50% becomes a candidate for "the latter half of your Daily Review", with the lowest probability first. The Daily Review is split into a first half (unprocessed, never-reviewed highlights) and a second half (Mastery cards). [doc]
- **Edit/Delete:** the card's "˅" menu → "Edit Mastery Flashcard" / "Delete Mastery Flashcard". Deleting the card doesn't delete the highlight. [doc]
- **Mastery-only review:** readwise.io/mastery (lists cards, half-lives, and recall probabilities). On mobile, the Home → **Mastery** row runs sessions of up to 5 cards. [doc]
- **Action tags** create cards from Reader: a note `.qa [QUESTION?][ANSWER]`. [doc]

### 2.15 Frequency tuning UI

Sources: reviewing-highlights FAQ; screenshots `ft_settings.png`, `ft_library.png`, `ft_review.png`.

- **Configure → Frequency Tuning tab:**
  - The page title is a big serif "**Configure**", with tabs Email Preferences · Review Settings · **Frequency Tuning** (active, blue underline) and "🔍 Search Articles" at the right.
  - Sentence: "Set the frequency of resurfacing highlights f[rom] **[Articles ˅]**", a source-type dropdown (books, articles, podcasts, supplemental books…).
  - Next to it, a **global slider for that type**, with stops labelled "**Never · Less · Normally · More**" and an (i) icon.
  - A table: Title ▲ · Author ▾ · Highlights ▲ · 📅 date ▾ · "**Review Frequency** (i) ▾". Each row has its own slider. [screenshot]
- **Library row:** a "˅" at the far right expands the row into "**REVIEW FREQUENCY**" (the same 4-stop slider), "DOCUMENT TAGS" (chips + "Add Document Tags"), and the actions "Edit Metadata", "Export Highlights", "Delete Article". Also "Refresh Highlights". [screenshot + doc]
- **Review card "˅" menu:** "Show this doc more often / less often / Never show this doc again". [screenshot]
- **Probability model:** "If you have 500 total highlights … a single document contains 100 highlights, there's a 20% chance". "Each time a highlight is shown, its probability of resurfacing is significantly decreased." [doc]
- **Configure → Review Settings:** the header "Adjust the number and recency of highlights in your Daily Review", then "**Highlights Per Day**" slider (1–15, default shown 10), "**Highlight Recency** (i)" slider (Older ↔ Newer), "**Receive Bonus Highlights** (i)" toggle, "**Highlight Quality Filter** (i)" toggle (on by default; "the last option on the page"), and "Next ›" at the top-right of the tabs. [screenshot + doc]
- **Email Preferences:** Email Frequency (including "Never") and the email send time (push notifications arrive within an hour of the send time). [doc]

### 2.16 Themed Review setup

Sources: https://docs.readwise.io/readwise/guides/themed-reviews ; screenshots `themed-review_add.png`, `themed-review_auto-select.png`, `themed-review_config.png`.

- **List page:** a big serif title "**Themed Reviews**" with a "BETA" pill at the top-right. Tabs "**Manage Themes**" | "**+ Add New Theme**". A table: Name ▲ (emoji + name) · Frequency (e.g. "Thursdays", "Mon / Wed / Fri", "Tuesdays") · Next ▲ (date) · Highlights ▲ (count) · "•••" per row ("Delete"). Clicking a row edits it. [screenshot + doc]
- **Create form (top to bottom):**
  1. "**Name**" input (placeholder "Name of your themed review") with a **colour dot** to its right (the card colour on the dashboard). Hint: "Tip: Try starting with an emoji to spice up your theme 🎉".
  2. "**Auto Select Sources** (i)" toggle.
  3. When the toggle is on: "**Theme** (i)" input (placeholder "Describe your theme"; hint "We will automatically select relevant highlights based on this theme"), suggestion chips (e.g. "🎨 Creativity in Modern Media", "🍽 Culinary Thoughts"), and a live preview of matching highlights.
  4. When the toggle is off: a "**Sources**" field (books, articles, tweets, notes, tags).
  5. "**Highlights Per Review**" slider (1–15, default 5).
  6. "**Review Frequency**": a dropdown ("Every day"; the docs' default is "Daily", with weekdays, weekends, specific days, monthly…) "at" a time dropdown ("8:00am").
  7. "**Send Emails** (i)" toggle.
  8. "**Add New Theme**" (primary) and "**Cancel**" (outline). [screenshot + doc]
- **Themed Connections:** a weekly (Saturday) AI theme, enabled from the Themed Reviews section. [update-dec2025]

### 2.17 Highlight browse / management pages (Readwise)

- **Browse** → category → a document list (Title, Author, Highlights, date, and an expand "˅" per row; see §2.15). Clicking a document opens its highlights page in **Scroll Mode** by default. The "grid icon" at the top-right switches to Review Mode. [doc]
- **Discard** is a soft delete; there is no hard delete. A "Discards" section exists in the library (mobile). [doc + update-aug2026]
- **Formatting in highlights:** `__text__` hyperhighlight, `*italic*`, `**bold**`. [doc]
- **Action tags in Readwise:** `.h1`–`.h3` headings (a TOC appears at the left if there is at least one `.h1`), `.c1 .c2 …` concatenation (joined with "…"), `.tagname` inline tags, and `.qa` flashcards. [doc]
- **Chat With Highlights:** a chat box with the enter key or an arrow to submit, suggestion chips, a "Toggle sidebar" of previous chats, and a model dropdown "in the left corner of the chat box". The thread title dropdown has "Rename" and a red "Delete" (with "Confirm"). Below each answer: "**Relevant Highlights**", split into "**Referenced Highlights**" and "**Other Relevant Highlights**", plus "**See more**", which opens a side panel. [doc]
- **Reader tag highlight view** (read.readwise.io/highlights-tags → tag): a notebook-style list. ↑/↓ move between highlights, and the right sidebar shows the parent document. The left TOC lists document titles with their highlights nested. "⋯" at the top-right: "Copy to clipboard", "Download annotations", "Edit export file"/"Edit export template", "Print". [doc]

---

## 3. Keyboard shortcuts

Sources: all the Reader FAQs cited above, the menu screenshots, library-configuration, default-views, favorites guide, chat and global guides, https://docs.readwise.io/readwise/docs/faqs/reviewing-highlights

**Caveat:** Readwise does **not** publish the complete Reader shortcut list. The in-app `?` overlay and read.readwise.io/preferences/shortcuts are the only full references, and all shortcuts are user-remappable. The table below is everything the docs and screenshots mention.

### 3.1 Reader web (global / navigation)

| Key | Action |
|---|---|
| `Cmd/Ctrl+K` | Command Palette (nearly every action; shows each action's shortcut) |
| `?` | Keyboard shortcut reference overlay |
| `/` | Search |
| `↑` / `↓` | Move the focus: between rows in lists, between paragraphs in a document, between highlights in tag views |
| `[` / `]` | Hide or show the left panel (TOC) / right panel (Info, Notebook, Chat) |
| `` ` `` `` ` `` (twice) | Cycle the right-panel tabs (open Chat) |
| `Z` | Undo (repeat to step back further) |
| `Shift+F` | New filtered view, or edit the current view's filter |
| `\` | Split the current view (Location / Seen) |
| `Shift+B` | Bulk actions on the current list |
| `Shift+X` | Open or close all sidebar feed folders |
| `A` | Add URL |
| `U` | Upload dialog (PDF, EPUB, MD, OPML, CSV) |
| `Shift+A` | Add feed |
| `Cmd/Ctrl+Shift+O` | See all Ghostreader conversations (Global Ghostreader) |
| `Cmd/Ctrl+R` | Browser refresh (forces a feed refresh) |
| `Alt+R` | (Browser extension) save the current page to Reader |

### 3.2 Reader web (document triage / actions; list-focused or open document)

| Key | Action |
|---|---|
| `E` | Move to Archive |
| `L` | Move to Later |
| `Shift+E` | Move to Inbox (Triage config) |
| `S` | Shortlist: adds the `shortlist` tag (Triage) or moves to Shortlist (Shortlist config) |
| `F` | Apply the `favorite` tag |
| `D` | Delete document (goes to Trash) |
| `B` | Bump to top (visible only when sorted by "Date moved") |
| `Space` | Mark as unseen (shown in the list "⋯" menu) |
| `T` | List view: add a document tag. Document view: tag the selected highlight |
| `Shift+T` | Document view: add a document tag |
| `Shift+N` | Add a document note (opens the Notebook) |
| `Shift+M` | Edit metadata |
| `Shift+R` | Reset reading progress to the current location |
| `O` | Open the original in a new tab |
| `Shift+C` | Copy the document URL |
| `Option/Alt+S` | Enable public link |
| `Cmd/Ctrl+P` | Print with annotations |
| `Shift+D` | Download the annotated PDF (PDFs) |
| `Shift+Option+C` | Copy all annotations to the clipboard (Notebook → Export) |
| `Shift+Option+D` | Download annotations as Markdown |
| `Shift+1` | Notebook view (headings are detected automatically) |
| `Cmd/Ctrl+F` | Find in document |

### 3.3 Reader web (reading and highlighting)

| Key | Action |
|---|---|
| `H` | Highlight the focused paragraph or image |
| `Shift+H` | Toggle auto-highlighting |
| `N` | Highlight the focused paragraph and open its note; with a highlight selected, edit its note |
| `Enter` / `Shift+Enter` | In a note: save / insert a line break |
| `Enter` / `Cmd/Ctrl+Enter` | In the tag dialog: apply and close / apply and keep open |
| hold `Alt`/`Option` | Temporarily disable auto-highlight so you can select text |
| `Cmd/Ctrl+C` | Copy the focused paragraph or selection |
| `G` | Ghostreader on the selection or focused paragraph (preset prompts / "Chat about this") |
| `Shift+G` | Ghostreader document-level prompts / Chat |
| `Shift+-` / `Shift+=` | Font size down / up |
| `Shift+:` / `Shift+"` | Line spacing down / up |
| `Shift+,` / `Shift+.` | Line width down / up |
| `Cmd/Ctrl+Option+T` | Cycle theme (light / dark / auto) |
| `Cmd/Ctrl +` / `Cmd/Ctrl -` | PDF zoom |

### 3.4 Reader TTS and video

| Key | Action |
|---|---|
| `P` | TTS play/pause |
| `Shift+P` | TTS stop |
| `←` / `→` | TTS skip through content; video −/+15s |
| `Shift+↑` / `Shift+↓` | TTS volume |
| `,` / `.` | Slower / faster (TTS and video) |
| `Space` | Video play/pause |
| `Shift+Enter` | Video: toggle transcript autoscroll |
| `Cmd/Ctrl+Enter` | Video: re-sync the transcript to the playhead |

### 3.5 Readwise web review (exact list from the docs)

| Key | Action |
|---|---|
| `←` | Previous highlight |
| `→` | Next highlight (counts as a skip) |
| `ENTER` | "Done (Mark highlight as read and move to next)" |
| `t` | Tag |
| `m` | Master |
| `` ` `` | Feedback (spaced repetition) |
| `f` | Favorite |
| `d` | Discard |
| `e` | Edit |
| `n` | Note |
| `s` | Share |
| `cc` | Copy highlight to clipboard |
| `ll` | Switch to card view / list view (individual document review) |

---

## 4. Key interaction behaviors

Sources: the navigation, basics, highlights-tags-notes, feed, parsing, and misc FAQs; library-configuration; chat guide; Readwise reviewing-highlights and mastery.

1. **Auto-highlighting is ON by default** (web app and extension). "converts any selected text into a highlight immediately" (i.e. on mouseup). Turn it off with `Shift+H`, the palette "Toggle auto-highlighting", or mobile "⋯" → "Toggle autohighlighting". It is not available in the original PDF view; switch to Text view. When it is off, you make a selection into a highlight via the annotation menu. [doc]
2. **Keyboard highlighting is paragraph-level only.** `H` highlights the whole focused paragraph, and `N` highlights and opens a note. Sub-paragraph keyboard highlighting is "on our roadmap". [doc]
3. **Triage from reading view:** "By default, if you move a document while in its reading view, you'll be returned to previous document list." The palette toggle "Toggle auto-advance" (a mobile setting) makes it auto-advance to the next document instead. [doc]
4. **Toasts with undo** follow many actions, and `Z` steps back through a multi-level undo stack. [doc]
5. **New saves land in the first Library location** (Inbox in Triage, Later in Shortlist/Classic). Re-saving an existing URL moves it "to the top of your Library" and shows a **green dot**. De-duplication is by exact URL only. [doc]
6. **Seen/unseen:** opening a document removes the dot (it becomes seen). "Mark as unseen" (Space) re-adds it. The Feed has no scroll-to-mark-seen on web. [doc]
7. **Moving Feed items to the Library** (Inbox/Later/Shortlist/Archive) makes them searchable and eligible for Kindle digests. Feed items are not auto-summarized (unless you bring your own OpenAI key); manual saves are auto-summarized by default, and the summary shows in the list row and the Info panel. [doc]
8. **Reading progress vs last location:** tracked separately. Progress only advances when you read steadily (pace detection) and never moves backward. Skimming only moves the last location. A return button appears whenever they differ, and `Shift+R` sets progress to the current location. [doc]
9. **Bump to top** only affects the order under the "Date moved" sort. [doc]
10. **Sorting:** the list sort control ("Date moved" is the default in the screenshots). Other sorts mentioned: date published, author, progress, and Random (pull-to-refresh reshuffles). The full sort list is not documented. [doc + update-aug2026]
11. **Tags:** document tags and highlight tags are separate namespaces with no inheritance. Clicking a tag anywhere opens a filtered view. Ghostreader auto-tags are prefixed "#" (e.g. `#tech`) but match the plain tag. [doc]
12. **Split views** show only their first tab when placed on Home. "✨ New in Feed" is split by Seen and sorted by Date saved descending, so Home shows unseen items, newest first. [doc]
13. **Highlights flow into Readwise:** "Every highlight you make in Reader instantly syncs with Readwise and then from Readwise to your note-taking apps." The two share a database, so edits and deletions sync (deleting a Reader document deletes its highlights in Readwise; archive instead). Sync is one-way: Kindle and other highlights don't appear in Reader. Document notes don't show in Readwise yet but do export. Highlight notes starting with `.` are action tags processed in Readwise (`.h1`, `.c1`, `.qa`, `.tag`). [doc]
14. **Daily Review composition:**
    - Random weighted sampling by the document's share of highlights, times the frequency-tuning weight.
    - The probability of resurfacing drops after each showing.
    - The default is 10 per day (screenshot), adjustable 1–15, with a recency slider and the quality filter.
    - The first half is unprocessed highlights, and the second half is due Mastery cards (recall at or below 50%).
    - An optional Bonus Highlight comes last.
    - Only Discard or Keep "processes" a highlight; arrows skip. [doc + screenshot]
15. **Mastery feedback** sets the half-life: Soon 7d, Later 14d, Someday 28d. "Never" removes the card. [doc]
16. **Themed Review delivery** follows the frequency pattern. It appears at the top of the dashboard on matching days, is optionally emailed, and counts toward the streak. [doc]
17. **Filtered views are live queries** over "one flat database of documents"; clicking an author, tag, or source is just a filtered view. [doc]
18. **Shared bundles** (public filtered views) don't auto-update; you use "Refresh public link". The recipient's "Open in Reader" creates a view in their own account. [doc]
19. **Paged scroll** is vertical pagination. Tap the left or right margin to page. It is the default for EPUB. Long-form reading view (default for EPUB) hides the triage bottom bar. [doc]
20. **Default view on mobile open:** Account → General → "Default view" (e.g. "Currently reading" opens the last document directly). [doc]
21. **Trash** is per-device. Restore returns the document with its highlights. [doc]

---

## 5. Filter query language

Source: https://docs.readwise.io/reader/guides/filtering/syntax-guide , https://docs.readwise.io/reader/guides/filtering/default-views , https://docs.readwise.io/reader/guides/filtering/query-examples , searching FAQ, favorites guide.

**Grammar:** `param:value` terms, optionally with an operator suffix `param__op:value`. They combine with `AND` / `OR` (uppercase in all examples) and nest with `( )`. Multi-word values go in double quotes. There is no space after the colon (this is required for the default category views to be recognized). Dates are absolute (`2024-09-15`) or relative in quotes (`"1 week ago"`, `"2 weeks ago"`). There is no bare `NOT`; negate with `__not`.

**Parameters:**

| Type | Param | Values / notes |
|---|---|---|
| Date | `saved` | date saved |
| Date | `last_opened` | most recent open |
| Date | `published` | publish date |
| Date | `last_status` | most recent action (e.g. a move) |
| Text | `tag` | document tag |
| Text | `domain` | e.g. `nytimes.com` |
| Text | `url` | full URL |
| Text | `category` / `type` | `article` `epub` `email` `pdf` `tweet` `rss` `video` `podcast` |
| Text | `rss_source` / `rssSource` | feed source ID, e.g. `rssSource:"01hgtw5y55damt0gjn4pw5ghwz"` (find it via Source → Shift+F) |
| Text | `author` | author name |
| Text | `location` / `in` | Triage: `inbox` `later` `archive`. Shortlist: `later` `shortlist` `archive` |
| Text | `title` | title |
| Text | `saved_using` | contains-match, case-insensitive: `Readwise web highlighter`, `Reader Share Sheet iOS`, `Reader Share Sheet Android`, `Reader add from import URL`, `Reader add from clipboard`, `Reader in app link save`, `File Upload`, `Reader RSS`, `api`, `reader_mcp`, `pocket`, `instapaper`, `instapaper_csv`, `matter_csv`, `omnivore_zip`, `custom_csv`. `__exact` is case-sensitive. Emails have no value |
| Text | `id` | document id (seen in the "Today's Daily Digest" view query; not in the syntax guide) |
| Bool | `feed` | `true`/`false` |
| Bool | `seen` | `true`/`false` |
| Bool | `shared` | public link enabled |
| Number | `words` | word count |
| Number | `progress` | reading % |
| Number | `highlights` | highlight count |
| Number | `minutes` | estimated read time |
| Number | `saved_count` | times saved |
| Other | `has` | `highlights`, `tags`, `notes` (document note) |

**Operators:** `__gt`, `__lt`, `__gte`, `__lte` (numbers); `__contains`, `__exact` (text); `__before`, `__after` (dates); `__not` (any). The default views also use `__gt` / `__lt` on dates (`saved__gt:"1 week ago"`), so the numeric comparators evidently work on dates too.

**Examples (verbatim from the docs):**
```
title:Getting Started
author:Paul Graham
tag:news AND published__after:"1 week ago"
tag:news OR tag:tech
(tag:one OR tag:two) AND saved__after:"2 weeks ago"
tag:football OR (feed:true AND domain:footballnews)
tag:shortlist AND (in:inbox OR in:later)                       # ⭐ Shortlist
saved__gt:"1 week ago" AND (in:inbox OR in:later)              # 📥 Recently added
feed:true                                                      # ✨ New in Feed (split by Seen)
progress__gt:5 AND last_opened__after:"1 week ago" AND (in:inbox OR in:later)   # 📖 Continue reading
minutes__lt:10 AND (in:inbox OR in:later)                      # ⏱️ Quick reads
minutes__gt:30 AND (in:inbox OR in:later)                      # ⏳ Long reads
has:highlights AND last_opened__gt:"1 week ago"                # 💎 Recently highlighted
minutes__lt:10 AND in:later
progress__gt:5 AND last_opened__after:"1 week ago" AND in__not:archive
saved_using:pocket AND highlights:0
has__not:tags
feed:true AND type:email
feed:true AND saved__lt:"1 week ago"
category:video AND minutes__gt:2
progress__gt:3 AND minutes__gt:20 AND (in:inbox OR in:later OR in:shortlist)
feed:true AND title__contains:"search term"
highlights__gt:5
(highlights__gt:5 AND words__lt:20000) OR (highlights__gt:10 AND words__gt:20000)
(highlights__gt:5 AND type__not:epub) OR (highlights__gt:10 AND type:epub)
(highlights__gt:5 AND words__lt:20000) OR (highlights__gt:10 AND words__gt:20000) OR tag:favorite
saved_using__exact:"Reader Share Sheet iOS"
tag:"type-fonts" OR tag:"design"
shared:true
saved_using:matter
```

---

## 6. Explicit gaps (need live observation)

1. **The full Reader shortcut list.** The `?` overlay content and the default bindings on /preferences/shortcuts are not published. Undocumented: Enter/Esc to open or close a document, j/k (if any), jumping between locations (e.g. a `g`-chord), next/previous-document keys (the ˄˅ buttons exist, but their keys aren't documented), the shortcut to open Home or Feed, and the tag-dialog keyboard navigation.
2. **Command Palette UI:** layout, grouping, how shortcuts are rendered, and the full action list.
3. **Exact pixel metrics:** sidebar width, row height, thumbnail size, the content max-width for narrow/medium/wide, and typography (the screenshots suggest a serif body and sans UI, but the font names are unknown).
4. **Feed view specifics:** there is no Feed screenshot in the docs. Unknown: whether the Feed tabs are styled like the Library tabs, where the folder tree renders, the default sort, and whether opening a Feed item auto-moves it or only marks it seen (the docs imply only "seen").
5. **Sort menu options** and the group-by/list-vs-grid display options for list views. Only "Date moved", published date, author, progress, and Random are mentioned.
6. **Behavior after archiving from the list:** does the focus move to the next row? Is there an animation? What does the toast text say?
7. **Highlight popover details:** the full contents of "⋯" beyond Copy text and Chat about this; whether the popover appears on hover of an existing highlight or only on click; the note editor's position (inline vs margin); the tag dropdown styling.
8. **The Add ("+") menu contents on web:** the sidebar ⊕ vs the "blue + bottom-left" (the docs conflict) and its exact options (Add URL / Upload / Add feed / More import options...).
9. **Appearance panel on web:** the layout of the Aa popover (the order of controls, typeface list, width presets). Only the mobile Actions sheet screenshot was available.
10. **Info panel "Links" tab** (seen in a PDF screenshot); whether it still exists and what it shows.
11. **Readwise web Dashboard layout** below the Daily Review hero (stats, Themed Review cards, "Add highlights" CTA), and the Readwise web **Highlights/Library document page** layout (Scroll Mode card design, the Mastery icon position in the "highlight view").
12. **Daily Review web header:** it changed between screenshots ("3 of 11" vs the play/list icons); the current version needs checking. Also the meaning of the small dot left of the cover, and whether the primary button currently says "Keep" or "Done".
13. **Readwise completion screen** (end of review / streak screen) and the mobile Home review card design (Readwise 2.0). Neither is described beyond the Aug 2026 marketing copy.
14. **Frequency Tuning slider granularity:** only 4 labels (Never/Less/Normally/More). It may be continuous or have 5+ stops.
15. **Mastery review flow for cloze cards** (the reveal button label) and the web Mastery dashboard table layout.
16. **Themed Review "Sources" picker UI** in manual mode (a multi-select typeahead?).
17. **Mobile Reader list swipes:** the defaults for each of the four swipe slots (only "short left→right = tag" is documented) and the full list of assignable actions.
18. **Global Ghostreader full-screen view** layout (history sidebar? position of the suggestion chips).
19. **"Focus mode"** (greys out unfocused paragraphs) is mentioned only in a bug fix. How to toggle it is unknown.
20. **Reading themes:** only light, dark, and auto exist today. Sepia and true black are "coming".
