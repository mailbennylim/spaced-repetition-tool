'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioLines, Pause, Play } from 'lucide-react';
import Sheet, { SheetGroup } from '@/components/ui/Sheet';
import type { ReaderHandle } from '@/lib/reader-types';

interface Props {
  handle: ReaderHandle;
  voiceName: string | null;
  rate: number;
  onSettings: (patch: { ttsVoice?: string; ttsRate?: number }) => void;
  onStop: () => void;
  /** Extra bottom offset when a bottom bar is showing under the player. */
  bottomOffset?: number;
}

const WPM = 170;
const fmt = (s: number) => { s = Math.max(0, Math.round(s)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
const NOVELTY = /Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Albert|Fred|Junior|Kathy|Ralph|Grandma|Grandpa|Rocko|Shelley|Flo|Eddy|Reed|Sandy/;
const LANG_NAMES: Record<string, string> = { 'en-US': 'English (US)', 'en-GB': 'English (UK)', 'en-AU': 'English (Australia)', 'en-IN': 'English (India)', 'en-IE': 'English (Ireland)', 'en-ZA': 'English (South Africa)', 'en-SG': 'English (Singapore)' };

const Icon = {
  back: <svg width="30" height="30" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 11A9 9 0 1 1 5 16" /><path d="M6 5.5V11h5.5" /><text x="14" y="18" fontSize="9" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="system-ui">¶</text></svg>,
  fwd: <svg width="30" height="30" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 11A9 9 0 1 0 23 16" /><path d="M22 5.5V11h-5.5" /><text x="14" y="18" fontSize="9" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="system-ui">¶</text></svg>,
  ret: <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="20" height="20" rx="5" /><path d="M9 11a4.5 4.5 0 1 1 1 5" /><path d="M8.5 8v3.5H12" /></svg>,
  jump: <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="20" height="20" rx="5" /><path d="M13 8v10M9 12l4-4 4 4" /></svg>,
};

/**
 * Listen player (docs/ux-spec.md §3.12): built-in voices, one sentence at a time,
 * paragraph skip, Return / Jump when you scroll away, Voice and Speed sheets.
 */
export default function ListenPlayer({ handle, voiceName, rate, onSettings, onStop, bottomOffset = 0 }: Props) {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const paragraphs = useMemo(() => handle.getParagraphs(), [handle]);
  const sentences = useMemo(() => paragraphs.map(p => { const out: { off: number; text: string }[] = []; (p.text.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [p.text]).reduce((off, s) => { out.push({ off, text: s }); return off + s.length; }, 0); return out; }), [paragraphs]);
  const words = useMemo(() => paragraphs.map(p => p.text.split(/\s+/).filter(Boolean).length), [paragraphs]);
  const total = words.reduce((a, b) => a + b, 0);

  const [pi, setPi] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [following, setFollowing] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [sheet, setSheet] = useState<'voice' | 'speed' | null>(null);
  const state = useRef({ pi: 0, si: 0, playing: false, startedAt: 0, token: {} as object, rate, voiceName });
  state.current.rate = rate; state.current.voiceName = voiceName;

  useEffect(() => {
    if (!synth) return;
    const load = () => setVoices(synth.getVoices().filter(v => v.lang.startsWith('en') && !NOVELTY.test(v.name)));
    load(); synth.onvoiceschanged = load;
    return () => { synth.onvoiceschanged = null; };
  }, [synth]);

  const speak = useCallback(() => {
    const s = state.current;
    if (!synth || s.pi >= paragraphs.length) { onStop(); return; }
    const token = {}; s.token = token;
    const sent = sentences[s.pi][s.si];
    const u = new SpeechSynthesisUtterance(sent.text.trim());
    const v = synth.getVoices().find(x => x.name === s.voiceName); if (v) u.voice = v;
    u.rate = s.rate;
    u.onstart = () => { if (s.si === 0) s.startedAt = Date.now(); setPi(s.pi); handle.setSpokenRange(paragraphs[s.pi].id, sent.off, sent.off + sent.text.trim().length); };
    u.onboundary = e => { if (e.name && e.name !== 'word') return; const start = sent.off + e.charIndex; const len = e.charLength || (sent.text.slice(e.charIndex).match(/^\S+/)?.[0].length ?? 1); handle.setSpokenRange(paragraphs[s.pi].id, start, start + len); };
    u.onend = () => { if (!s.playing || s.token !== token) return; s.si++; if (s.si >= sentences[s.pi].length) { s.si = 0; s.pi++; } speak(); };
    synth.speak(u);
  }, [synth, paragraphs, sentences, handle, onStop]);

  const restart = useCallback(() => { synth?.cancel(); if (state.current.playing) setTimeout(speak, 60); }, [synth, speak]);
  const play = () => { state.current.playing = true; setPlaying(true); if (synth?.paused) synth.resume(); else restart(); };
  const pause = () => { state.current.playing = false; setPlaying(false); synth?.pause(); };
  const goTo = (i: number) => { state.current.pi = Math.max(0, Math.min(paragraphs.length - 1, i)); state.current.si = 0; setPi(state.current.pi); setFollowing(true); restart(); };
  const back = () => { const s = state.current; goTo(Date.now() - s.startedAt < 2000 ? s.pi - 1 : s.pi); };
  const fwd = () => goTo(state.current.pi + 1);

  // Start from the paragraph nearest the top of the screen.
  useEffect(() => {
    const first = nearestParagraph(paragraphs.map(p => p.id));
    state.current.pi = first; setPi(first);
    state.current.playing = true; setPlaying(true);
    setTimeout(speak, 100);
    return () => { synth?.cancel(); handle.setSpokenRange(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the spoken paragraph in view; if the reader scrolls away, offer Return / Jump.
  useEffect(() => {
    if (following) handle.scrollToParagraph(paragraphs[pi]?.id);
  }, [pi, following, handle, paragraphs]);
  useEffect(() => {
    let userScroll = false;
    const mark = () => { userScroll = true; };
    const onScroll = () => {
      if (!userScroll) return;
      const el = document.querySelector(`[data-para-id="${CSS.escape(paragraphs[state.current.pi]?.id ?? '')}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 60 || r.top > window.innerHeight - 160) setFollowing(false);
    };
    window.addEventListener('touchstart', mark, { passive: true }); window.addEventListener('wheel', mark, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('touchend', () => setTimeout(() => { userScroll = false; }, 600));
    return () => { window.removeEventListener('touchstart', mark); window.removeEventListener('wheel', mark); window.removeEventListener('scroll', onScroll); };
  }, [paragraphs]);

  const before = words.slice(0, pi).reduce((a, b) => a + b, 0);
  const sec = (w: number) => (w / (WPM * rate)) * 60;
  const byLang = voices.reduce<Record<string, SpeechSynthesisVoice[]>>((acc, v) => { (acc[v.lang] ||= []).push(v); return acc; }, {});
  const selectedVoice = voiceName ?? voices.find(v => v.default)?.name ?? voices[0]?.name ?? null;

  return (
    <>
      <div className="fixed inset-x-0 z-40 bg-reader-bg" style={{ bottom: bottomOffset }}>
        <div className="h-[3px] w-full bg-transparent"><div className="h-full bg-progress transition-[width]" style={{ width: `${total ? (before / total) * 100 : 0}%` }} /></div>
        <div className="flex justify-between px-4 pt-1 text-[11px] tabular-nums text-ink-2"><span>{fmt(sec(before))}</span><span>{fmt(sec(total))}</span></div>
        <div className="grid grid-cols-[48px_1fr_64px] items-center px-3 pb-2">
          <button onClick={() => setSheet('voice')} aria-label="Voice" className="flex h-11 w-11 items-center justify-center text-ink-2"><AudioLines size={24} /></button>
          <div className="flex items-center justify-center gap-7">
            <button onClick={following ? back : () => { setFollowing(true); handle.scrollToParagraph(paragraphs[pi]?.id); }} aria-label={following ? 'Previous paragraph' : 'Return'} className="flex h-11 w-11 flex-col items-center justify-center text-ink">
              {following ? Icon.back : <>{Icon.ret}<span className="text-[10px]">Return</span></>}
            </button>
            <button onClick={() => (playing ? pause() : play())} aria-label={playing ? 'Pause' : 'Play'} className="flex h-12 w-12 items-center justify-center text-ink">
              {playing ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" />}
            </button>
            <button onClick={following ? fwd : () => goTo(nearestParagraph(paragraphs.map(p => p.id)))} aria-label={following ? 'Next paragraph' : 'Jump'} className="flex h-11 w-11 flex-col items-center justify-center text-ink">
              {following ? Icon.fwd : <>{Icon.jump}<span className="text-[10px]">Jump</span></>}
            </button>
          </div>
          <button onClick={() => setSheet('speed')} aria-label="Speed" className="text-right text-[18px] text-ink-2">{rate}×</button>
        </div>
      </div>

      <Sheet open={sheet === 'voice'} onClose={() => setSheet(null)} title="Voice" closeIcon>
        {Object.entries(byLang).map(([lang, vs]) => (
          <div key={lang}>
            <div className="mb-1.5 mt-3 flex justify-between px-1 text-[11px] uppercase tracking-wide text-ink-2"><span>{LANG_NAMES[lang] || lang}</span><span>{vs[0].localService ? 'On this device' : 'Online'}</span></div>
            <SheetGroup>
              {vs.map(v => (
                <button key={v.name} onClick={() => { onSettings({ ttsVoice: v.name }); state.current.voiceName = v.name; restart(); }} className="flex h-12 w-full items-center justify-between border-t border-[#1d2329] px-4 text-left text-[16px] text-ink first:border-t-0">
                  <span>{v.name.replace(/ \(.*\)$/, '').replace(/^(Google|Microsoft) /, '')}</span>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full ${v.name === selectedVoice ? 'bg-accent' : 'border-[1.5px] border-[#4a525b]'}`}>{v.name === selectedVoice && <svg width="12" height="12" viewBox="0 0 20 20"><path d="M5.5 10.5l3 3 6-7" fill="none" stroke="#161c22" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}</span>
                </button>
              ))}
            </SheetGroup>
          </div>
        ))}
        {voices.length === 0 && <p className="py-6 text-center text-[14px] text-ink-2">No voices found on this device.</p>}
      </Sheet>

      <Sheet open={sheet === 'speed'} onClose={() => setSheet(null)} title="Speed" closeIcon>
        <p className="my-2 text-center text-[30px] font-semibold text-accent">{rate}×</p>
        <input type="range" min={0.5} max={3} step={0.05} value={rate} onChange={e => { const r = +(+e.target.value).toFixed(2); onSettings({ ttsRate: r }); state.current.rate = r; restart(); }} aria-label="Speed" className="w-full accent-accent" />
        <div className="mb-4 flex justify-between text-[11px] text-ink-2"><span>0.5</span><span>1</span><span>1.5</span><span>2</span><span>2.5</span><span>3</span></div>
        <div className="flex gap-2">
          {[1, 1.25, 1.5, 1.75, 2].map(r => <button key={r} onClick={() => { onSettings({ ttsRate: r }); state.current.rate = r; restart(); }} className={`h-10 flex-1 rounded-full text-[15px] ${rate === r ? 'bg-surface-active text-ink' : 'bg-surface-group text-ink'}`}>{r}</button>)}
        </div>
      </Sheet>
    </>
  );
}

function nearestParagraph(ids: string[]): number {
  let best = 0, d = Infinity;
  ids.forEach((id, i) => {
    const el = document.querySelector(`[data-para-id="${CSS.escape(id)}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dd = r.top < 80 ? 80 - r.bottom : r.top - 80; // first paragraph at or below the top edge
    const score = dd < 0 ? Math.abs(dd) + 10000 : dd;
    if (score < d) { d = score; best = i; }
  });
  return best;
}
