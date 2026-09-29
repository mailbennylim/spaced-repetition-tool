'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Tag } from 'lucide-react';
import Sheet from '@/components/ui/Sheet';
import TagPicker from '@/components/app/TagPicker';

interface Props {
  open: boolean;
  onClose: () => void;
  initialTab?: 'note' | 'tags';
  note: string;
  tags: string[];
  onSave: (v: { note: string; tags: string[] }) => void;
}

/**
 * Notes & tags sheet (docs/ux-spec.md §3.5 / §3.10): segmented [💬 Note | 🏷 Tags] control
 * centred in the header, "Done" on the right.
 */
export default function NotesAndTagsSheet({ open, onClose, initialTab = 'note', note, tags, onSave }: Props) {
  const [tab, setTab] = useState(initialTab);
  const [draftNote, setDraftNote] = useState(note);
  const [draftTags, setDraftTags] = useState(tags);

  useEffect(() => { if (open) { setTab(initialTab); setDraftNote(note); setDraftTags(tags); } }, [open, initialTab, note, tags]);

  const done = () => { onSave({ note: draftNote, tags: draftTags }); onClose(); };

  return (
    <Sheet
      open={open}
      onClose={done}
      tall
      title={undefined}
      right={<button onClick={done} className="text-[16px] font-medium text-accent">Done</button>}
      left={<span />}
    >
      <div className="-mt-11 mb-4 flex justify-center">
        <div className="inline-flex h-9 items-center rounded-full bg-surface-group p-1">
          <button onClick={() => setTab('note')} aria-label="Note" className={`flex h-7 w-12 items-center justify-center rounded-full ${tab === 'note' ? 'bg-surface-active text-ink' : 'text-ink-2'}`}><MessageSquare size={16} /></button>
          <button onClick={() => setTab('tags')} aria-label="Tags" className={`flex h-7 w-12 items-center justify-center rounded-full ${tab === 'tags' ? 'bg-surface-active text-ink' : 'text-ink-2'}`}><Tag size={16} /></button>
        </div>
      </div>
      {tab === 'note' ? (
        <textarea
          autoFocus
          value={draftNote}
          onChange={e => setDraftNote(e.target.value)}
          placeholder="Add a document note..."
          className="h-56 w-full resize-none bg-transparent text-[16px] leading-6 text-ink placeholder:text-ink-2 focus:outline-none"
        />
      ) : (
        <TagPicker selected={draftTags} onChange={setDraftTags} autoFocus />
      )}
    </Sheet>
  );
}
