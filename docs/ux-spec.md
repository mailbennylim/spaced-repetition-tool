# UX Spec: the app (modelled on Readwise Reader + Readwise)

**Version 8, 28 September 2026.**

**Where each part of the design comes from:**

1. **[ref]**: your phone screenshots in `reference/`. These are the top authority.
   - Home tab
   - Library tab
   - Feed tab
   - Highlight function
   - Share to Readwise flow
   - Bookmarklet (the browser extension)
   - Return to x%
   - TTS (Listen)
   - Finished review
2. **[web]**: observed live on read.readwise.io and readwise.io, with positions, fonts, colours and sizes measured from the page. Used for screens your screenshots don't cover, adapted to phone size.
3. **[doc only]**: from the Readwise docs alone. **Nothing** is left in this category.

**OURS** marks a deliberate difference from Readwise, based on your decisions.

---

## 0. Decisions

| # | Decision |
|---|---|
| D1 | One app in Reader's look. **Bottom tab bar: Home · Library · Feed · Review · Search** (§2.1). Review also appears at the top of Home. |
| D2 | The **phone app** is the design target. The web app fills in screens your screenshots don't cover. |
| D3 | Library has only **Inbox** and **Archive**. No "Later" anywhere, including the share screen and the bookmarklet. |
| D4 | **Five highlight colours, fully working:** Yellow, Green, Blue, Pink, Purple. They show in the article, EPUB and PDF readers, the Notebook, Review and the highlight lists. |
| D5 | Review keeps **your app's own system** (§3.7). No Mastery, Frequency Tuning, Themed Reviews or Bonus highlights. |
| D6 | **No AI at all.** This removes Ghostreader, "Ask anything…", "Invoke Ghostreader" and your existing AI "Test mode" with its OpenAI setting. |
| D7 | Content types: Articles, Books (EPUB), PDFs, Emails, and RSS in the Feed. No tweets, videos, podcasts, YouTube or Twitter lists (for now). |
| D8 | Saving: the **Android share sheet** (§3.10), and a **bookmarklet** on a computer that shows a bar like Reader's extension, **without auto-highlighting** (§3.11). |
| D9 | **Left out:** Feed card mode and ♡ Favourites. |
| D12 | **Listen (text-to-speech) is in**, using the **phone's built-in voices** (the browser's Web Speech API: free, no server). See §3.12. A local model on the Mac mini is a possible later upgrade. |
| D10 | **No tags on highlights.** Tags exist only on **documents**. Tags already on highlights imported from Readwise are shown read-only. |
| D11 | **No streaks anywhere.** |
| D13 | **Dark mode only.** There's no theme switch anywhere (no "Change theme", no Light/Dark/Auto choice). |
| D14 | **No counts next to list titles** ("Inbox", not "Inbox 260"). No "mark all as seen" button. No daily digest. |
| D15 | **RSS search inside the app**, like Reader: type a feed's name or a website address and subscribe from the results (§3.3.1). |

---

## 1. Visual language

### 1.1 Colours (dark mode only, D13)

| Token | Value | Source | Used for |
|---|---|---|---|
| `--bg` | `#0d1116` | [ref] | Page, tab bar |
| `--reader-bg` | `#000000` | [ref] | **Reading view background** (true black on the phone) |
| `--surface-1` | `#12171c` | [ref] | Band between rows, floating pill, Continue bar, drawer |
| `--surface-sheet` | `#161c22` | [ref] | Bottom sheets, reading-view floating buttons, "Return to X%" chip |
| `--surface-group` | `#282e35` | [ref] | Grouped rows in sheets, the ✕ circle on the Return chip |
| `--surface-active` | `#313942` | [ref] | Active segment of a pill or segmented control |
| `--surface-popover` | `#28313b` | [web] | Menus and popovers (computer) |
| `--overlay` | `#080a0d` | [ref] | Dim behind a sheet or drawer |
| `--accent` | `#7caeec` | [ref] | Active tab, Done/Add, unread dot, round floating buttons |
| `--progress` | `#a855f7` | [ref] | **Reading progress line** (purple, 4px), just above the reader's bottom toolbar |
| `--link` | lavender, underlined | [ref] | Links inside reading text |
| `--focus-bar` | `#2d75e5` | [web] | Paragraph focus bar (computer only) |
| `--text` | `#f0f1f2` | [web] | Titles, toolbar icons |
| `--text-body` | `#c1c7ce` | [ref + web] | Reading body text |
| `--text-ui` | `#e0e3e6` | [web] | UI text |
| `--text-2` | `#959faa` | [web] | Meta and secondary labels |
| `--chip` | `rgba(110,120,131,.15)` | [web] | Tag chips (4px radius), search field |
| `--search-match` | `rgba(0,114,255,.30)` | [web] | Matched words in search results |
| `--review-gradient` | `linear-gradient(121deg,#5278fe,#478cd0)` | [web] | Daily Review hero card |
| `--finish-bg` | `#161616` | [ref] | Review finished screen |
| `--finish-text` | `#efebdf` | [ref] | Review finished screen (warm off-white) |
| `--finish-close` | `#fbf9f3` | [ref] | Review finished screen, ✕ circle |

### 1.2 Type [web + ref]

| Use | Font | Size | Other |
|---|---|---|---|
| UI | Inter | 14–16px | |
| Reading body | Source Serif 4 | 20px, line height 1.4 | `--text-body` |
| Reading title | Source Serif 4 | 40px / 46px bold on a computer, **30px / 36px on the phone** | |
| App list styles [ref] | | Screen title 28–30px bold + grey count · row title 17px semibold · meta 14px · small-caps domain 12px | |
| Review | Source Serif for highlight text (20px / 28px) and headings, Inter for UI | | OURS: replaces Readwise's Charter / Mulish, so the whole app matches |

### 1.3 Shapes and motion [ref]

- **Bottom sheets:**
  - A grab handle at the top.
  - Header: left action · centred title · blue "Done" on the right.
  - Grouped rows: 12px radius, 50px tall, label on the left and a line icon (or switch) on the right.
- **Drawer:** slides in from the left, about 88% of the screen width.
- **Floating segmented pill:** 44px tall, fully rounded.
- **Reading-view floating buttons:** 48px circles on `--surface-sheet`, with white line icons.
- **Vertical highlight toolbar:** a 48px-wide rounded column of icon buttons pinned to the right edge of the screen (§3.6).
- **Menus on a computer** [web]: `--surface-popover`, 32px rows with shortcut hints, destructive items in red.

---

## 2. Information architecture

### 2.1 Bottom tab bar

```
┌──────────────────────────────────────────────────────────┐
│   ⌂        ||\        )))        🔁 ⑩        🔍          │
│  Home    Library     Feed      Review      Search        │
└──────────────────────────────────────────────────────────┘
```

| Tab | What it's for |
|---|---|
| **Home** | Daily Review card + rows of documents. The ⚙ gear top-right opens Settings. |
| **Library** | What you saved: `Inbox \| Archive`. |
| **Feed** | What arrives by itself (RSS, newsletters): `Unseen \| Seen`. |
| **Review** | Daily Review + browsing highlights. The badge shows how many are due today. |
| **Search** | Search everything, plus Recent searches, Saved views and Trash. |

- Reader has **Account** in this slot [ref]. It moves behind the ⚙ gear on Home.
- The bar is **hidden** in the reading view and in a Review session.
- The **"Continue: <title> ⊗"** bar sits above the tab bar on Library and Feed [ref].
- On a computer the bar becomes a left rail (§6).

### 2.2 Screen map

```
Home ── ⚙ Settings · Daily Review card → Review session · document rows → Reading view
Library ── ☰ Browse · ⊕ Add document · ⋯ Library actions · pill Inbox|Archive · rows → Reading view
Feed ── ☰ Browse (feeds) · ⊕ Add (RSS search / folder) · ⋯ Feed actions · pill Unseen|Seen
Review ── Daily Review hero → Review session → Finished screen · Browse highlights (by document / by colour)
Search ── field · results · recent searches · saved views · Trash
Reading view ── ‹ back · ☰ Contents · ⓘ Info/Notebook · bottom toolbar · highlights
```

---

## 3. Screens

### 3.1 Home [ref + web]

```
┌───────────────────────────────────┐
│                               ⚙   │  gear → Settings [ref]
│ Home                              │  28px bold [ref]
│ ╭───────────────────────────────╮ │  OURS: Review hero, Readwise style [web]:
│ │ Daily Review                  │ │   --review-gradient, 10px radius, soft shadow
│ │ 10 highlights from Carmen     │ │   serif 26px bold white · 13px bold subtitle
│ │ Ansio, Kim Hana and more      │ │
│ │                    [ Start › ]│ │   white pill, blue text ("Continue ›" / "✓ Done for today")
│ ╰───────────────────────────────╯ │
│ 📖 Continue reading               │  [ref] rows of 100×100 covers, horizontal scroll,
│ [cover][cover][cover][co…         │   title 15px semibold (3 lines) + author 13px grey
│ 📥 Recently added                 │
│ ✨ New in Feed            • ◦ ◦ ◦ │  page dots [ref]
├───────────────────────────────────┤
│ Home  Library  Feed  Review Search│
└───────────────────────────────────┘
```

- Rows can be shown, hidden and reordered in Settings → Home [web]. The default order is: Continue reading · Recently added · New in Feed · Recently highlighted · Books · PDFs.
- Long-press a card to open the document actions sheet (§3.4).

### 3.2 Library [ref]

- **Toolbar:** ☰ · ⊕ · ⋯. Title "**Inbox**" (or "**Archive**"), with no count (D14).
- **Row:**
  - Favicon + small-caps domain (or "PDF"), with ⋯ at the far right.
  - Title in 17px semibold, with document tag chips inline.
  - "Sep 25th · excerpt…" on two lines.
  - "Author · 5 mins", or "1 hr 14 mins left" once started.
  - A thin progress bar.
  - An 84×84 thumbnail on the right. Rows are separated by 6px bands.
- **Floating pill** `Inbox | Archive`, plus the Continue bar.
- **⊕ Add document** [ref]:
  - Header: Cancel · "Add document" · Add.
  - "Add link" field.
  - Paste from clipboard · Upload a file.
- **⋯ Library actions** [ref]:
  - Manage tags
  - Sort documents · Bulk actions
  - Settings (replaces Reader's "Change theme" and "Support and feedback")
- **Sort** [web]:
  - Sort by: Date saved (default) · Date published · Date last opened · Title · Author · Length · Progress · Random.
  - Order: Recent → Old / Old → Recent.
- **☰ Browse drawer** [ref]:
  - Library ›
  - Types ⌄: Articles, Books, Emails, PDFs
  - Trash ›
  - Tags ⌄: "Find tag" field, then DOCUMENT TAGS.
  - OURS: no highlight-tags section (D10).
- **Swipes** (OURS, my choice as you asked):

| Swipe | In Inbox | In Archive |
|---|---|---|
| Right → | **Archive** (green, box icon) | **Move to Inbox** |
| ← Left | **Delete** (red, bin icon; the row slides away with an Undo toast) | **Delete** |

  - Swipes act on release, with a short haptic tick.
  - There are no long-swipe variants and no swipe settings, to keep it simple.

### 3.3 Feed [ref]

- Title "**Unseen**" (or "**Seen**"), with no count (D14).
- Blue unread dot in the left margin. The small-caps line shows the feed name. Today's items show a time ("8:36 pm").
- **Floating control:** only the pill `Unseen | Seen`, centred. Reader's ✓ mark-all-as-seen button (left) and ▤ card-mode button (right) are removed (D9, D14).
- **⊕ Add** [ref]: Subscribe to RSS feed (→ the feed search, §3.3.1) · Add new folder.
- **⋯ Feed actions** [ref]: Manage feeds · Sort · Bulk actions · Settings.
- **☰ Browse drawer** [ref]: Feed › · folders · "All feeds" with "Find feed" · a list of feeds.
- Opening an item marks it seen [web].
- **Swipes** (OURS):
  - Right → **Save to Library** (moves it to Inbox).
  - ← Left → **Mark seen / unseen**.
- **Manage feeds** [web]: a list of feeds (favicon · name · item count · last updated). Tap a feed to Rename, Move to folder or Unsubscribe. Also [Add feed] and Import OPML.

#### 3.3.1 Subscribe to RSS feed (search) [web: Reader's "Add feed" dialog]

On the phone this opens as a full-height sheet; on a computer as a centred dialog:

```
 ╭───────────────────────────────────────────╮
 │ 🔍 stratechery                  Clear   ✕ │  field: "Start typing the name or URL of your RSS feed"
 │───────────────────────────────────────────│
 │ FEEDS                                     │  small caps section label
 │ (⊕) [ic] **Stratechery** by Ben Thompson  │  (⊕) = subscribe · feed icon · name, with the typed word in bold
 │          On the business, strategy, and…  │  description, 1 line, --text-2
 │          Very popular · Updated 3 hours   │  popularity · last updated · feed address
 │          ago · stratechery.com/feed       │
 │ (⊕) [ic] Stratechery Daily Update…        │
 │ …                                         │
 ╰───────────────────────────────────────────╯
```

- **Results appear as you type** (after a short pause), up to about 10.
- **Tap (⊕) to subscribe.** It turns into a ✓, a toast says "Subscribed to <name>", and the newest items start arriving in Feed. Tapping ✓ again unsubscribes.
- **Popularity label** from subscriber count: **Very popular** (10,000+) · **Popular** (1,000+) · **Somewhat popular** (100+) · nothing below that.
- Results for feeds you already follow show ✓ straight away.
- **Pasting a website address** (e.g. `nngroup.com`) also works. The app reads that site and lists the feeds it advertises, plus common addresses such as `/feed`, `/rss` and Substack and Medium feeds.
- **Where results come from** (OURS): Feedly's public feed search, which I checked works without an account. It returns the name, description, icon, subscriber count and last update. It's free but unofficial and could change, so pasting a website address always works as a fallback. Your search words are sent to Feedly; nothing else is.

### 3.4 Document actions (row ⋯ or long-press) [web]

```
 Add document tag
 Add document note
 ─────────────
 Edit metadata
 Reset reading progress
 ─────────────
 Open original
 Copy document URL
 Share
 ─────────────
 Archive / Move to Inbox
 ─────────────
 Delete document            (red → Trash, Undo toast)
```

### 3.5 Reading view [ref: "Return to x%" screen]

```
┌───────────────────────────────────┐
│ DESK — from the desk of van Sch…  │  source line: accent, underlined, links to the original
│ (‹) (☰)                  (▶) (ⓘ)  │  48px floating circles on --surface-sheet, over the text
│ Title in serif 30px bold …        │   ‹ back to list · ☰ Contents · ▶ Listen (§3.12) · ⓘ Info/Notebook
│ Author · 5 mins · Sep 25          │
│                                   │
│ Body text, serif 20px/1.4,        │  --text-body on --reader-bg (#000)
│ links lavender + underlined …     │
│                                   │
│      ╭──────────────────────╮(✕)  │  "Return to 100%" chip [ref]: --surface-sheet pill with
│      │ ⟲ Return to 100%     │     │   an icon + 17px text, and a separate ✕ circle on --surface-group
│      ╰──────────────────────╯     │
├▔▔▔▔▔▔▔▔▔▔▔▔ 4px purple progress ▔▔▔┤  --progress, full width, left → right
│  [💬🏷]        [▭ ⌃⌄]        (⋯)  │  bottom toolbar [ref, minus "Ask anything… 👻"]:
└───────────────────────────────────┘   notes & tags · triage (Inbox/Archive) · more
```

- **Floating buttons** fade out as you scroll down and come back when you scroll up or tap [ref layout; the fade is my choice].
- **Bottom toolbar** [ref]. Reader's Modern layout, with the "Ask anything…" AI field removed (D6):
  - **💬🏷 Notes & tags:** opens a sheet with a segmented control [💬 Note | 🏷 Tags] and Done.
    - Note tab: "Add a document note…".
    - Tags tab: the **document** tag picker (§3.10 has the same design).
  - **▭ ⌃⌄ Triage:** shows the current location. Tap to toggle Inbox ↔ Archive, with an Undo toast.
  - **(⋯) More:** opens the **Actions sheet** (below).
- **Return to X%** [ref]: appears when your current position differs from your furthest progress. Tap it to jump back; tap ✕ to dismiss.

**Long-form layout (books and PDFs)** [ref: TTS screenshots]. EPUBs and PDFs use a quieter layout:

```
┌───────────────────────────────────┐
│ ‹  ☰    Your House is Like a…  Aa ▯│  top bar: back · Contents · document title (13px, centred) ·
│                                   │   Appearance · Info/Notebook panel. Shown only after a tap.
│ …text, full screen …              │
│                                   │
├▔▔▔▔▔▔▔▔▔▔▔ purple progress ▔▔▔▔▔▔▔┤
│ 36%                           (⋯) │  bottom bar: progress % · more. Shown only after a tap.
└───────────────────────────────────┘   (Reader's "Ask anything…" in the middle is removed, D6)
```

- **Tap the text** to show or hide both bars [ref: "Tap > top and bottom bars appear"].
- Articles, emails and RSS use the short-form layout drawn above, with floating buttons and the toolbar.

**Actions sheet** (⋯) [ref]:

```
                    Actions                  Done
 ┌──────────────┬──────────────┐
 │   ▭ Inbox    │  ▣ Archive   │     triage tiles; the current location is greyed out
 └──────────────┴──────────────┘     (Reader has three: Inbox · Later · Archive; Later removed, D3)
 ┌───────────────────────────────────────────┐
 │ Toggle autohighlighting              ( ○) │
 │ Share document                          ⇪ │
 │ Listen using text-to-speech            🔊 │  → starts Listen (§3.12); reads "Stop text-to-speech" while playing
 │ Find in document                        🔍 │
 │ Appearance                              Aa │  OURS: added for short-form (long-form has Aa in the top bar)
 │ Edit metadata                           ✎ │
 │ Note and tags                         💬🏷 │
 └───────────────────────────────────────────┘
 ┌───────────────────────────────────────────┐
 │            Delete document  (red)         │
 └───────────────────────────────────────────┘
```

Removed from Reader's sheet: "Chat about document" (D6) and "Support and feedback".
- **☰ Contents** [web]: a sheet listing headings (EPUB chapters, PDF outline). The current section is in `--accent`.
- **ⓘ Info / Notebook** [web]: a sheet with the tabs **Info · Notebook `n`**.
  - **Info:** title, domain, author, DOCUMENT TAGS, and METADATA rows (Type, Domain, Published, Length "6 mins (1,504 words)", Saved, Progress "16% (5 mins left)", Language), plus [Edit metadata].
  - **Notebook:** "Add a document note…", then "Highlights (n)" (each in its colour, with its note), then [Export] (Markdown).
- **Appearance** [web]: "Text styles" rows, each with [−][+]: Typeface, Font size (20px), Line spacing (1.4), Line width (Medium). Reader's "System theme" tiles (Light / Dark / Auto) are removed (D13).

### 3.6 Highlighting [ref: "Highlight function"] with five colours (D4)

**Flow on the phone** [ref]. Auto-highlight is **OFF** by default, as in your screenshot. There is a switch for it in ⋯ → "Toggle autohighlighting".

```
1. Select text                        2. Tap the pen → highlight created
   (native selection, teal handles)      (toolbar changes)
   │ …text text text│ ┌──┐                │ …text text text│ ┌──┐
   │ selected text  │ │✎●│ ← pen (in the  │ ▓highlighted▓  │ │⋯ │ more
   │ selected text  │ └──┘   current      │ ▓highlighted▓  │ │💬│ note
                             colour)       │                │ │● │ colour  ← OURS
                                           │                │ │✕ │ delete (red)
                                                               └──┘
```

- **Vertical toolbar** [ref]: a rounded dark column pinned to the **right edge**, level with the selection.
  - Reader's has: ⋯ · 👻 Ghostreader · 💬 Note · 🏷 Tag · ✕ (red).
  - **OURS:** 👻 is removed (D6) and 🏷 is removed (D10). **● Colour** is added.
  - Tapping ● opens **five dots in a row to its left**. Tap one to recolour instantly. The toolbar's pen uses the last-used colour.
- **Note** [ref]: a sheet with "Add a highlight note…", keyboard open, and Done on the right. OURS: Reader's [💬 | 🏷] switcher is removed; only the note remains.
- **⋯ Actions** [ref]: Share text · Copy text · Share as image · Toggle autohighlighting (switch). "Invoke Ghostreader" is removed.
- **Tap an existing highlight** to bring back the same vertical toolbar.
- **Look** [web]: Reader draws a highlight as a **tinted background plus a 2px underline in the same colour**, with round drag handles at both ends to resize.

```
background: linear-gradient(0deg, <underline> 0 2px, <tint> 2px 100%)
tint = hsl(H 100% 50% / 15%)  · tapped = / 30%  · underline = / 80%  · text #fff
```

| Colour | Hue H |
|---|---|
| Yellow (default, Reader's exact colour) | 50 |
| Green | 140 |
| Blue | 210 |
| Pink | 330 |
| Purple | 270 |

- **Everywhere:** article, EPUB and PDF readers (translucent boxes on PDF pages), the Notebook, Review cards (a 3px left bar + tinted quote) and highlight lists.
- **On a computer** [web]: the same actions appear as a horizontal pill above the highlight: (colours) · ⊗ · 💬 · ⋯.

### 3.7 Review (OURS: your system, in Readwise's look)

**Your logic stays** (`src/app/api/review/route.ts`):
- 10 a day: 8 overdue or new (at most 2 per document) + 2 of the newest.
- Shuffled so neighbours come from different documents.
- "Next review in N days": default 30, and **More often / Less often** changes it by 10 (range 1–365).

#### 3.7.1 Review tab [web: Readwise Dashboard]

```
┌───────────────────────────────────┐
│ Review                            │
│ ╭───────────────────────────────╮ │  hero, larger than on Home:
│ │ Daily Review                  │ │   serif 32px bold white, --review-gradient
│ │ 10 highlights from …          │ │
│ │        [Settings] [ Start › ] │ │   outline pill + white pill
│ ╰───────────────────────────────╯ │
│ Browse Highlights                 │  serif 22px section title
│ (●) By document          36 books │  32px round icon · 16px label · count in blue
│ (●) By colour                   › │
│ Recently highlighted              │  the latest highlight cards
├───────────────────────────────────┤
│ Home  Library  Feed  Review Search│
└───────────────────────────────────┘
```

#### 3.7.2 Review session [ref for the header, web for the card]

```
 (✕)            Daily Review                   header [ref]: ✕ in a light circle top-left,
               ● ● ● ○ ○ ○ ○ ○ ○ ✓              title + one dot per card ending in ✓
╭─────────────────────────────────────────────────╮
│ ▌[cover] Document title                    ˅    │  [web] title 16px bold · author --text-2
│ ▌        Author                                 │  ▌ highlight colour bar (OURS)
│   Highlight text, serif 20px/28px …             │  [web]
│                                   ✎     ⇪       │  [web] icon row: Edit note · Share
│─────────────────────────────────────────────────│
│ NOTE                                            │  11px caps --text-2
│ note text …                                     │
╰─────────────────────────────────────────────────╯  card on --surface-group, 8px radius
      (‹)          (＋)          (－)          (✓)    [web] 54px round buttons, labels below;
      Prev     More often    Less often      Next     Next = filled accent circle
          Next review in 30 days · default             your existing hint
```

- **Swipe** the card left for Next and right for Prev.
- **˅ card menu:** View in document · Open original · Copy text · Edit note · Change colour.
- Tags on imported highlights show as read-only chips under the text (D10).

#### 3.7.3 Finished screen [ref: "finished review"]

```
┌───────────────────────────────────┐
│ (✕)        Daily Review           │  --finish-close circle · title
│            ● ● ● ● ● ✓            │
│                                   │
│           Great job!              │  40px bold --finish-text
│   You just reviewed 10 highlights │  17px --finish-text
│   and completed your Daily Review.│
│                                   │
│   [ painted landscape, fading up  │  full-bleed artwork; the top fades into --finish-bg
│     from the bottom half ]        │  OURS: a small bundled set of public-domain
│                                   │  landscape paintings, one per day
│  ╭─────────────────────────────╮  │
│  │            Done             │  │  full-width pill, --finish-bg, --finish-text
│  ╰─────────────────────────────╯  │
│      Review more highlights →     │  text link: loads another batch of 10
└───────────────────────────────────┘
```

- **OURS:** Readwise's "Daily streak" row (the weekday circles) is removed (D11).

#### 3.7.4 Highlight lists [web: Readwise document page]

- **By document:** cover · title · author · highlight count · last highlighted. Tap one to see its highlights as cards (the §3.7.2 card without the action row), with [Open in reader].
- **By colour:** five coloured rows with counts. Tap one to see those highlights across all documents.

### 3.8 Search [web + OURS]

```
┌───────────────────────────────────┐
│ ╭ 🔍 Search your library      ✕ ╮ │  36px field, --chip background, 8px radius [web]
│ ╰───────────────────────────────╯ │
│ RECENT                    Clear   │  empty state (OURS): last 5 searches, each with ✕
│ 🕘 design systems             ✕  │
│ SAVED VIEWS                   +   │  ⏱ Quick reads · ⏳ Long reads · your own
│ ⏱ Quick reads               ›    │  (+ creates one with the filter syntax, Appendix B)
│ 🗑 Trash                     ›    │
├───────────────────────────────────┤
│ Home  Library  Feed  Review Search│
└───────────────────────────────────┘
```

- **Results** [web]:
  - Normal list rows. Matched words get the `--search-match` background.
  - The location label (INBOX / ARCHIVE / FEED) is right-aligned in 10px caps.
  - A snippet shows the text around the match, with "Count: n" at the bottom.
- **Scope** (OURS): titles, authors, full text, highlights and notes. Highlight matches appear under a "Highlights" heading as highlight cards.

### 3.9 Settings (⚙ on Home) [web: Reader Preferences]

- **Home:** show, hide and reorder rows.
- **Reading:** Auto-advance ("Proceed to the next document after taking an action, instead of returning to the list.") · Auto-highlight (off by default) · Default highlight colour.
- **Add to Library:**
  - Add from URL
  - Upload file
  - **Forward email**: "To import any email to your Inbox, forward to: `<addr>` [Copy]"
  - **Bookmarklet**: a drag-to-bookmarks-bar button + instructions
- **Add to Feed:**
  - Add RSS subscription
  - Upload OPML
  - **Newsletter address**: "…subscribe to newsletters using your custom email address: `<addr>` [Copy]"
- **Listen:** default voice (English voices on this device, novelty voices hidden) · default speed.
- **Review:** reminder time on/off · highlights per day.
- **Import from Readwise** · **Export** · **Sign out**.

### 3.10 Sharing from Android [ref: "Share to Readwise Flow"]

1. In Chrome: ⋮ menu → **Share…**. The app's icon shows as a direct-share shortcut on the right of that row, or pick it from the share sheet.
2. **The saved sheet** slides up over the page, dark, nearly full height:

```
 ╭───────────────────────────────────────────╮
 │                                       (✕) │  ✕ top-right
 │                  [app icon]               │
 │               Saved to Inbox              │  OURS wording (Reader: "Saved to Reader")
 │            (Moved to Archive)             │  subtitle appears after tapping Archive
 │                                           │
 │  ╭─────────────────────────────────────╮  │
 │  │              Read now               │  │  wide dark pill → opens the reading view
 │  ╰─────────────────────────────────────╯  │
 │           Tap anywhere to dismiss         │  12px grey
 │      (🗑)     (🏷)     (💬)     (▭)        │  48px round buttons [ref]; Reader has a 5th
 ╰───────────────────────────────────────────╯   "Later" (🕘) button, removed (D3)
```

- **🗑 Delete** unsaves the page and closes the sheet.
- **🏷 Tags:** the sheet switches to [💬 | 🏷] (Tags active) · Done. It shows a "🔍 Select or enter a tag..." field and a list of all your document tags (tag icon + name). Tap to toggle; typing a new name offers "Create "…"".
- **💬 Note:** [💬 | 🏷] (Note active) · Done, with "Add a document note…" and the keyboard open.
- **▭ Archive:** the button fills with an accent ring and the subtitle "Moved to Archive" appears. Tapping it again moves it back to Inbox.

### 3.11 Bookmarklet (computer) [ref: "Bookmarklet"]

Clicking the bookmarklet saves the page and pins a **thin bar across the top of the page** (about 32px), in the style of Reader's extension. Reader's bar is white; **ours is dark** (`--surface-sheet`) to match the app (D13):

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ [R] Open in app ›                                    🏷+    💬+    ▭ Inbox ▾   ^ │
└───────────────────────────────────────────────────────────────────────────────┘
```

- **Removed:** Reader's highlight-count badge and its "Auto highlighting" switch. There is no highlighting on web pages (your note: "No need this switch. Should not have auto highlight").
- **🏷+ Tags:** a dropdown under the icon (about 340px wide, `--surface-sheet`, soft shadow).
  - A "Find or create document tag..." field on top.
  - Below it, a vertical list of tag chips (small grey pills).
  - Click to add; type a new name and press Enter to create.
- **💬+ Note:** a popover with an "Add document note..." textarea and [Cancel] [Save].
- **▭ Inbox ▾ Location:** tooltip "Move document (currently in Inbox)". Menu: ✓ Inbox · Archive · — · **Delete** (red). "Later" is removed.
- **^** hides the bar. The document stays saved.

### 3.12 Listen (text-to-speech) [ref: "TTS" wireflow; OURS: built-in voices, paragraph skip]

**Starting it:**
- Short-form: the **(▶)** floating button [ref: Return to x%].
- Any document: ⋯ Actions → **"Listen using text-to-speech"** [ref: TTS].
- Computer: `P`.

Reading **starts at the paragraph at the top of the screen**. The **word being spoken gets a rounded blue box** [ref], and the page scrolls to keep it in view.

**Player** [ref], docked at the very bottom on `--reader-bg`, with no background panel:

```
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔ purple progress line (3px) ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
04:19                                                              05:39   elapsed · total, 11px --text-2
 |||||           (⟲¶)          ❚❚          (¶⟳)               0.75×        voice · back · play/pause · forward · speed
```

- **||||| (waveform), far left:** opens the **Voice sheet**.
- **⟲ / ⟳:** Reader's icons are circular arrows with "15" inside [ref]. **OURS: skip by paragraph**, so the icons show "¶".
  - **Back:** if the current paragraph started less than 2 seconds ago, go to the previous paragraph. Otherwise restart the current one, like a music player's back button.
  - **Forward:** next paragraph.
- **❚❚ / ▶:** about 48px, solid white.
- **"0.75×", far right:** 18px, `--text-2`. Opens the **Speed sheet**.
- **Scrolled away from what's being read** [ref: "Scroll elsewhere"]:
  - The back button becomes **Return** (a square icon with a return arrow, labelled "Return"). It scrolls back to the spoken paragraph.
  - The forward button becomes **Jump** (a square icon with an up arrow, labelled "Jump"). It moves the reading voice to the paragraph you're now looking at.
  - Auto-scroll pauses until you tap one of them.
- **Tap the text** while listening [ref]: the top bar and the bottom bar (36% · ⋯) appear, with the player staying above the bottom bar.
- **Stopping:** ⋯ Actions → "Stop text-to-speech". Leaving the document also stops it. (Reader's player has no ✕ [ref].)

**Voice sheet** [ref]:
- A bottom sheet titled "Voice", with a ✕ circle on the right.
- Voices are grouped under small caps headers. Reader's headers are "ENGLISH - V8 - BETA" with "Powered by Unreal Speech" in pink on the right.
  - **OURS:** group by accent ("ENGLISH (US)", "ENGLISH (UK)", "ENGLISH (SINGAPORE)"…), with **"On this device"** on the right. Novelty voices are hidden.
- Each group is a set of rounded rows: the voice name on the left, and a radio circle on the right. The selected voice has a **filled blue check**.

**Speed sheet** [ref]:
- A bottom sheet titled "Speed", with a ✕ circle on the right.
- The current value is shown **large in blue** ("0.75×").
- Below it is a **ruler slider** from 0.5× to 3× in 0.05 steps. A small blue triangle marks the value, and 0.5 / 0.75 / 1 … are labelled.
- A row of **preset pills**: 1 · 1.25 · 1.5 · 1.75 · 2.

**How it works (for the build):**
- Each paragraph is spoken one sentence at a time, so long passages don't get cut off. The next sentence is queued as each one ends.
- Changing voice or speed restarts the current sentence.
- Times are estimated from word count ÷ (170 words a minute × speed). The progress line moves by paragraph.
- Works for **articles, emails, RSS and EPUB** (current chapter). **PDF:** reads the page's text, and may read headers and page numbers aloud.

**Tested:**
- `docs/prototypes/tts-test.html` works on a Mac browser in phone view:
  - Paragraph back and forward, including the quick-back to the previous paragraph.
  - Return and Jump after scrolling away.
  - The speed sheet and presets, and the voice sheet grouped by accent.
  - Word highlighting.
- **You confirmed the first version works on your Android phone.**

---

## 4. Behaviours

1. New saves go to Inbox. Re-saving a URL moves it back to the top without duplicating.
2. Every archive, delete or move shows a toast with Undo.
3. Feed items, and Library items not yet opened, show an unread dot.
4. Reading progress saves continuously and never goes backwards. It feeds the Continue bar and "Return to X%".
5. Tags are document-only (D10).
6. Every list is a filtered view: types, Home rows, tags and metadata links share one query engine.
7. Secondary actions open bottom sheets (phone) or popovers (computer).
8. Deleting a document sends it to Trash. Its highlights stay in Review until Trash is emptied.
9. Auto-advance (a setting): after archiving from the reader, open the next document.

## 5. Keyboard shortcuts (computer only) [web, trimmed]

| Action | Key |
|---|---|
| Home / Library / Feed / Review / Search | 1 / 2 / 3 / 4 / `/` |
| Next / previous document | J / K |
| Archive / Move to Inbox | E / Shift E |
| Delete | D |
| Seen/unseen | Space |
| Highlight focused paragraph | H |
| Highlight note | N |
| Colour 1–5 | Option 1…5 |
| Document note / tag | Shift N / Shift T |
| Open original | O |
| Find | Cmd F |
| Add URL / Upload / RSS | A / U / Shift A |
| Undo | Z |
| Review: Prev / Next | ← / → |
| Review: More / Less often | + / - |
| Listen: play/pause · stop | P · Shift P |
| Listen: previous / next paragraph | ← / → (while playing) |
| Listen: slower / faster | , / . |

## 6. Wider screens

On screens wider than 768px:
- The tab bar becomes a left rail.
- Lists sit in a centred column (max 720px).
- The reading view gains side panels (Contents on the left, Info/Notebook on the right) as on read.readwise.io.
- Sheets become popovers.

## 7. Open questions

None. The spec is ready for your review notes.

## Appendix B: Filter syntax (saved views)

**Grammar:**
- Terms are `field:value` or `field__op:value`, combined with `AND` / `OR` and grouped with `( )`.
- Put multi-word values in `"quotes"`. Negate with `__not`.
- Dates are absolute (`2026-09-15`) or relative (`"1 week ago"`).

**Fields and operators:**

| Kind | Fields |
|---|---|
| Date | `saved` `last_opened` `published` |
| Text | `tag` `domain` `author` `title` `type` (article, epub, pdf, email, rss) `in` (inbox, archive) `feed_source` |
| Boolean | `feed` `seen` |
| Number | `words` `progress` `highlights` `minutes` |
| `has` | `highlights` `tags` `notes` |
| Operators | `__gt` `__lt` · `__contains` · `__before` `__after` · `__not` |

**Default views:**

| View | Query |
|---|---|
| 📖 Continue reading | `progress__gt:5 AND last_opened__after:"1 week ago" AND in:inbox` |
| 📥 Recently added | `saved__gt:"1 week ago" AND in:inbox` |
| ✨ New in Feed | `feed:true AND seen:false` |
| 💎 Recently highlighted | `has:highlights AND last_opened__gt:"1 week ago"` |
| ⏱ Quick reads | `minutes__lt:10 AND in:inbox` |
| ⏳ Long reads | `minutes__gt:30 AND in:inbox` |
| Types | `type:epub` / `type:pdf` / `type:article` / `type:email` |
