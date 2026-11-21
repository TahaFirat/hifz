'use client';
import { useState } from 'react';
import { Eye, EyeOff, Play, Pause, Repeat2, Target } from 'lucide-react';
import { displayArabic } from '@/lib/hifz/arabic-display';
import { unitCue, unitLabel, type StudyUnit } from '@/lib/hifz/segments';

type Props = {
  unit: StudyUnit;
  stage: number;
  opened: boolean;
  active: boolean;
  blocked: boolean;
  hard: boolean;
  arabic: boolean;
  reading: boolean;
  meaning: boolean;
  wordByWord?: boolean;
  loopBadge?: string | null;
  canPlay: boolean;
  playing: { repeat: boolean; phase: string } | null;
  onReveal: () => void;
  onMark: () => void;
  onPlay: (repeat: boolean) => void;
};

export default function StudyUnitCard(p: Props) {
  const { unit, stage, opened } = p;
  const hidden = !opened;
  const pausing = p.playing?.phase === 'pause';
  const onlyAnchor = hidden && (stage === 4 || stage === 0);
  const [tally, setTally] = useState(0);
  const [peekedWordIdx, setPeekedWordIdx] = useState<Record<number, boolean>>({});

  const line = (kind: 'arabic' | 'reading') => {
    const text = kind === 'arabic' ? unit.arabic : unit.reading;
    if (!text) return null;
    if (!hidden) return kind === 'arabic' ? displayArabic(text) : text;
    if (stage === 3) return <span className="masked-block" aria-hidden="true" />;
    const cue = unitCue(unit, kind, stage === 2 ? 2 : 1);
    return (
      <>
        <span>{kind === 'arabic' ? displayArabic(cue.start) : cue.start}</span>
        {cue.masked && <span className="masked-block cue-mask" aria-hidden="true" />}
        {cue.end && <span>{kind === 'arabic' ? displayArabic(cue.end) : cue.end}</span>}
      </>
    );
  };

  const label = unitLabel(unit);
  const words = unit.total === 1 && unit.parent.words && unit.parent.words.length > 1 ? unit.parent.words : null;

  return (
    <article
      className={`verse-card unit-card ${p.hard ? 'difficult' : ''} ${p.active ? 'ayah-active' : ''} ${onlyAnchor ? 'anchor-only' : ''}`}
      aria-label={`${label} · ${unit.anchor}`}
    >
      <div className="verse-header">
        <button
          className="meaning-anchor"
          disabled={p.blocked}
          onClick={p.onReveal}
          aria-label={`${label}: ${unit.anchor}; ${hidden ? 'aç' : 'gizle'}`}
        >
          <span>{unit.total > 1 ? unit.part : unit.number}.</span> {unit.anchor}
        </button>

        <div className="verse-actions">
          <button
            type="button"
            className={`tally-pill ${tally > 0 ? 'counted' : ''}`}
            onClick={() => setTally((t) => (t >= 33 ? 0 : t + 1))}
            onDoubleClick={() => setTally(0)}
            title="Tekrar sayacı (dokun: +1)"
            aria-label={`Tekrar sayacı: ${tally}`}
          >
            {tally > 0 ? `${tally}×` : '+1'}
          </button>

          <button
            className="icon-button"
            aria-label={p.playing && !p.playing.repeat ? 'Durdur' : unit.total > 1 ? 'Bölümü seslendir' : 'Ayeti dinle'}
            disabled={!p.canPlay}
            onClick={() => p.onPlay(false)}
          >
            {p.playing && !p.playing.repeat ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            className="icon-button"
            aria-label="Dinle ve tekrar et"
            aria-pressed={!!p.playing?.repeat}
            disabled={!p.canPlay}
            onClick={() => p.onPlay(true)}
          >
            <Repeat2 size={19} />
          </button>
          <button
            className="icon-button"
            aria-label={hidden ? 'Aç' : 'Gizle'}
            disabled={p.blocked}
            onClick={p.onReveal}
          >
            {hidden ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
          <button
            className={`icon-button ${p.hard ? 'active' : ''}`}
            aria-label={p.hard ? 'Zor işaretini kaldır' : 'Zorlandım'}
            aria-pressed={p.hard}
            onClick={p.onMark}
          >
            <Target size={19} />
          </button>
        </div>
      </div>

      {p.loopBadge && p.playing && <span className="shadow-cue">{p.loopBadge}</span>}
      {pausing && (
        <span className="shadow-cue" role="status">
          🎙️ Şimdi Sen Tekrar Et
        </span>
      )}

      {onlyAnchor ? (
        <button className="unit-recall" disabled={p.blocked} aria-label={`${label} aç`} onClick={p.onReveal} />
      ) : (
        <button
          className="ayah-lines"
          disabled={p.blocked}
          onClick={p.onReveal}
          aria-label={`${label} ${hidden ? 'aç' : 'gizle'}`}
        >
          {p.arabic && (
            <span className="ayah-arabic" lang="ar" dir="rtl">
              {line('arabic')}
            </span>
          )}
          {p.reading && unit.reading && (
            <span className="ayah-reading" lang="tr" dir="ltr">
              {line('reading')}
            </span>
          )}
          {p.meaning && unit.meaning && (
            <span className="ayah-meaning" lang="tr" dir="ltr">
              {hidden ? <span className="masked-block" aria-hidden="true" /> : unit.meaning}
            </span>
          )}
        </button>
      )}

      {/* Word-by-Word Interactive Meaning Row */}
      {p.wordByWord && words && (
        <div className="wbw-grid" dir="rtl" aria-label="Kelime kelime anlam">
          {words.map((w, idx) => {
            const showWord = !hidden || !!peekedWordIdx[idx];
            return (
              <button
                key={idx}
                type="button"
                className={`wbw-chip ${!showWord ? 'wbw-masked' : ''}`}
                onClick={() => {
                  if (hidden) {
                    setPeekedWordIdx((prev) => ({ ...prev, [idx]: !prev[idx] }));
                  }
                }}
              >
                <span className="wbw-ar" lang="ar">
                  {showWord ? displayArabic(w.arabic) : '•••'}
                </span>
                {showWord && w.reading && (
                  <small className="wbw-tr" dir="ltr">
                    {w.reading}
                  </small>
                )}
                {w.meaning && (
                  <em className="wbw-meaning" dir="ltr">
                    {w.meaning}
                  </em>
                )}
              </button>
            );
          })}
        </div>
      )}
    </article>
  );
}
