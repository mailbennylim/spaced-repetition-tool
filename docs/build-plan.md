# Build plan

This plan builds [ux-spec.md](ux-spec.md) (v8) in phases. Each phase ends with something you can open and use on your phone.

## Phase 1: Foundation and app shell ✅
- [x] Back up the database (`backups/`)
- [x] New data model:
  - Documents (Inbox / Archive / Feed, seen, progress, note, trash)
  - Document tags
  - Feeds and folders
  - One Highlight table with colour, position and note, linked to its document
- [x] Move existing data across: 5 documents, 2 reader highlights, 53 review highlights and their schedules
- [x] Remove AI Test mode, the OpenAI setting and the `openai` package
- [x] Dark-only design system: colour tokens, Inter + Source Serif 4, line icons
- [x] App shell:
  - Bottom tab bar (Home · Library · Feed · Review · Search)
  - Bottom sheets, left drawer, toasts with Undo
- [x] Library:
  - Inbox | Archive pill, list rows, swipe to archive/delete, sort
  - ⊕ Add document (link, paste, upload), ⋯ Library actions
  - ☰ Browse drawer (types, tags, Trash)
  - Document actions sheet (tags, note, metadata, archive, delete)
- [x] Home: Daily Review card + document rows
- [x] Installable app (PWA manifest, icons)

## Phase 2: Reading view
- [x] Short-form layout (floating buttons + bottom toolbar) and long-form layout (tap to show bars)
- [x] Article, EPUB and PDF readers in the new chrome
- [x] Highlighting:
  - Pen button → vertical toolbar
  - Five colours drawn in all three readers
  - Notes, delete, Actions sheet
- [x] Info / Notebook sheet, Contents sheet, Appearance sheet
- [x] Reading progress, Continue bar, "Return to X%"
- [x] Listen (text-to-speech), from the prototype in `docs/prototypes/tts-test.html`

## Phase 3: Feed
- [x] Feed tab (Unseen | Seen, unread dots, swipes, save to Library)
- [x] RSS feed search (Feedly search + site address discovery) and subscribe
- [x] Background checks for new items, folders, Manage feeds, OPML import
- [x] Email newsletters and email forwarding. This needs the Mac mini to be reachable from the internet (Phase 7), but it's built here.

## Phase 4: Review
- [x] Review tab (hero, browse by document / colour, recently highlighted)
- [x] Review session in the new card design (Prev · More often · Less often · Next, swipes)
- [x] Finished screen
- [x] Highlight lists

## Phase 5: Search, saved views, Trash, Settings
- [x] Search tab: full text, highlights, notes; recent searches
- [x] Filter query engine and saved views
- [x] Trash with restore
- [x] Settings screens

## Phase 6: Getting content in and out
- [x] Android share target + "Saved to Inbox" sheet
- [x] Bookmarklet (opens the Save screen with tags, note, Inbox/Archive; a top bar on the page needs a browser extension)
- [x] One-time import from Readwise (Reader documents + all highlights)
- [x] Export (Markdown / CSV)

## Phase 7: Mac mini
- [x] Sign-in (single user)
- [ ] Production build under `pm2` / `launchd`, auto-restart
- [ ] Cloudflare Tunnel + your domain (HTTPS), inbound email routing
- [ ] Nightly database backups

## Verification notes (29 Sep 2026)
- Checked in the built-in browser at phone width against `reference/` and `docs/ux-spec.md`: Library list, Browse drawer, Add/Actions sheets, article reader (chrome, highlight toolbar, colours, notes, delete+Undo), EPUB long-form layout, Review session card, Feed empty state.
- Still to verify visually: PDF reader, Listen player in the app, Feed with real subscriptions, Save screen from Android, sign-in on the Mac mini.
- Known gaps: no Find in EPUB across sections (current section only); PDF highlights are box overlays (no text underline); Home "Recently highlighted" row shows documents, not highlight snippets.
