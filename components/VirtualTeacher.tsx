'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Square, Lightbulb, RotateCcw, Eye, EyeOff, Volume2, CheckCircle2, Sparkles, AlertTriangle, Check } from 'lucide-react';
import { displayArabic } from '@/lib/hifz/arabic-display';
import {
  buildTeacherTargets,
  evaluateSpokenTokens,
  type WordEvalState,
} from '@/lib/hifz/virtual-teacher';
import type { Verse } from '@/lib/hifz/types';
import type { Rating } from '@/lib/hifz/progress';

interface WebSpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((ev: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type WebkitBridgeWindow = Window & {
  webkit?: {
    messageHandlers?: {
      hifzNative?: {
        postMessage: (msg: Record<string, unknown>) => void;
      };
    };
  };
  SpeechRecognition?: new () => WebSpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => WebSpeechRecognitionInstance;
};

function postNativeMsg(msg: Record<string, unknown>) {
  try {
    (window as unknown as WebkitBridgeWindow).webkit?.messageHandlers?.hifzNative?.postMessage(msg);
  } catch {
    // No-op outside native WebView
  }
}

type Props = {
  title: string;
  verses: Verse[];
  onPlayReference: (verse: Verse) => void;
  onStopReference: () => void;
  onSaveMastery?: (rating: Rating) => void;
};

export default function VirtualTeacher({
  title,
  verses,
  onPlayReference,
  onStopReference,
  onSaveMastery,
}: Props) {
  const targets = useMemo(() => buildTeacherTargets(verses), [verses]);

  const [blindMode, setBlindMode] = useState(true);
  const [localeMode, setLocaleMode] = useState<'ar-SA' | 'tr-TR'>('ar-SA');
  const [cursor, setCursor] = useState(0);
  const [wordStates, setWordStates] = useState<Record<number, WordEvalState>>({});
  const [hesitations, setHesitations] = useState<Record<number, number>>({});
  const [status, setStatus] = useState<'idle' | 'listening' | 'permission-denied' | 'unavailable' | 'error'>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [liveHeard, setLiveHeard] = useState('');
  const [mismatchHint, setMismatchHint] = useState<string | null>(null);
  const [savedRating, setSavedRating] = useState<Rating | null>(null);

  const cursorRef = useRef(0);
  const processedWordCountRef = useRef(0);
  const lastSessionIdRef = useRef<number>(-1);
  const webRecRef = useRef<WebSpeechRecognitionInstance | null>(null);
  const activeWordElRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    cursorRef.current = cursor;
    activeWordElRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [cursor]);

  const stopListening = useCallback(() => {
    const win = window as unknown as WebkitBridgeWindow;
    if (win.webkit?.messageHandlers?.hifzNative) {
      postNativeMsg({ action: 'stopTeacher' });
    }
    if (webRecRef.current) {
      try {
        webRecRef.current.onend = null;
        webRecRef.current.stop();
      } catch {}
      webRecRef.current = null;
    }
    setStatus((s) => (s === 'listening' ? 'idle' : s));
    setAudioLevel(0);
  }, []);

  const resetTeacher = useCallback(() => {
    stopListening();
    setCursor(0);
    cursorRef.current = 0;
    processedWordCountRef.current = 0;
    setWordStates({});
    setHesitations({});
    setLiveHeard('');
    setMismatchHint(null);
    setSavedRating(null);
  }, [stopListening]);

  // Reset when Surah/verses change
  useEffect(() => {
    resetTeacher();
  }, [targets.length, title, resetTeacher]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  const processTranscript = useCallback(
    (fullTranscript: string, sessionId = 0) => {
      if (sessionId !== lastSessionIdRef.current) {
        lastSessionIdRef.current = sessionId;
        processedWordCountRef.current = 0;
      }
      const allSpoken = fullTranscript.trim().split(/\s+/u).filter(Boolean);
      setLiveHeard(allSpoken.slice(-5).join(' '));
      if (!allSpoken.length) return;

      // Handle cumulative partial transcripts by slicing unseen tail (with 1-token overlap safety)
      const startIdx = Math.max(0, Math.min(processedWordCountRef.current, allSpoken.length - 1));
      const newTokens = allSpoken.slice(startIdx);
      if (!newTokens.length) return;

      const cur = cursorRef.current;
      if (cur >= targets.length) return;

      const step = evaluateSpokenTokens(newTokens, targets, cur, localeMode);
      processedWordCountRef.current = allSpoken.length;

      if (step.newlyMatchedIndices.length > 0) {
        postNativeMsg({ action: 'haptic', style: 'selection' });
        setWordStates((prev) => {
          const next = { ...prev };
          for (const idx of step.newlyMatchedIndices) {
            if (!next[idx]) {
              next[idx] = hesitations[idx] ? 'mistake-corrected' : 'correct';
            }
          }
          return next;
        });
        setMismatchHint(null);
        cursorRef.current = step.nextCursor;
        setCursor(step.nextCursor);

        if (step.nextCursor >= targets.length) {
          postNativeMsg({ action: 'haptic', style: 'success' });
          stopListening();
        }
      } else if (step.detectedMismatchWord) {
        setHesitations((prev) => {
          const count = (prev[cur] || 0) + 1;
          if (count === 2) {
            postNativeMsg({ action: 'haptic', style: 'warning' });
          }
          return { ...prev, [cur]: count };
        });
        setMismatchHint(step.detectedMismatchWord);
      }
    },
    [targets, localeMode, hesitations, stopListening]
  );

  // Subscribe to Native Swift HifzVirtualTeacherEngine events
  useEffect(() => {
    const onNativeTranscript = (e: Event) => {
      const detail = (e as CustomEvent<{ text?: string; sessionId?: number }>).detail;
      if (typeof detail?.text === 'string') {
        processTranscript(detail.text, detail.sessionId ?? 1);
      }
    };
    const onNativeStatus = (e: Event) => {
      const detail = (e as CustomEvent<{ state?: string }>).detail;
      const st = detail?.state;
      if (st === 'listening') setStatus('listening');
      else if (st === 'stopped') {
        setStatus('idle');
        setAudioLevel(0);
      } else if (st === 'permission-denied') setStatus('permission-denied');
      else if (st === 'unavailable') setStatus('unavailable');
      else if (st === 'error') setStatus('error');
    };
    const onNativeLevel = (e: Event) => {
      const detail = (e as CustomEvent<{ level?: number }>).detail;
      if (typeof detail?.level === 'number') {
        setAudioLevel(detail.level);
      }
    };

    window.addEventListener('hifz:teacher-transcript', onNativeTranscript);
    window.addEventListener('hifz:teacher-status', onNativeStatus);
    window.addEventListener('hifz:teacher-level', onNativeLevel);
    return () => {
      window.removeEventListener('hifz:teacher-transcript', onNativeTranscript);
      window.removeEventListener('hifz:teacher-status', onNativeStatus);
      window.removeEventListener('hifz:teacher-level', onNativeLevel);
    };
  }, [processTranscript]);

  const startListening = () => {
    onStopReference();
    window.dispatchEvent(new Event('hifz-stop-recording'));
    if (cursorRef.current >= targets.length) {
      resetTeacher();
    }
    setMismatchHint(null);
    processedWordCountRef.current = 0;

    const win = window as unknown as WebkitBridgeWindow;
    if (win.webkit?.messageHandlers?.hifzNative) {
      setStatus('listening');
      postNativeMsg({ action: 'startTeacher', locale: localeMode });
      return;
    }

    const SpeechCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechCtor) {
      setStatus('unavailable');
      return;
    }

    try {
      const rec = new SpeechCtor();
      rec.lang = localeMode;
      rec.continuous = true;
      rec.interimResults = true;
      const sessionStamp = Date.now();
      rec.onstart = () => setStatus('listening');
      rec.onresult = (ev) => {
        let combined = '';
        for (let i = 0; i < ev.results.length; i++) {
          combined += ' ' + ev.results[i][0].transcript;
        }
        setAudioLevel(0.45 + Math.random() * 0.45);
        processTranscript(combined, sessionStamp);
      };
      rec.onerror = (ev) => {
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
          setStatus('permission-denied');
        } else {
          setStatus('error');
        }
      };
      rec.onend = () => {
        setStatus((s) => (s === 'listening' ? 'idle' : s));
        setAudioLevel(0);
      };
      webRecRef.current = rec;
      rec.start();
    } catch {
      setStatus('error');
    }
  };

  // "Fetih Ver" — Hoca gives a 1-word hint when learner gets stuck
  const giveFetihHint = () => {
    if (cursor >= targets.length) return;
    postNativeMsg({ action: 'haptic', style: 'medium' });
    setWordStates((prev) => ({ ...prev, [cursor]: 'hinted' }));
    setMismatchHint(null);
    const next = cursor + 1;
    cursorRef.current = next;
    setCursor(next);
    if (next >= targets.length) {
      stopListening();
    }
  };

  // Manual step forward (for silent environments or manual verification)
  const markCurrentCorrectManually = () => {
    if (cursor >= targets.length) return;
    postNativeMsg({ action: 'haptic', style: 'light' });
    setWordStates((prev) => ({ ...prev, [cursor]: 'correct' }));
    setMismatchHint(null);
    const next = cursor + 1;
    cursorRef.current = next;
    setCursor(next);
    if (next >= targets.length) {
      postNativeMsg({ action: 'haptic', style: 'success' });
      stopListening();
    }
  };

  const completed = targets.length > 0 && cursor >= targets.length;
  const statesArr = Object.values(wordStates);
  const hintedCount = statesArr.filter((s) => s === 'hinted').length;
  const correctedCount = statesArr.filter((s) => s === 'mistake-corrected').length;
  const pureCorrectCount = statesArr.filter((s) => s === 'correct').length;
  const accuracyPct = targets.length
    ? Math.max(0, Math.round(((pureCorrectCount + correctedCount * 0.7) / targets.length) * 100))
    : 100;

  // Group targets back by verseNumber for clean Mushaf rendering
  const groupedByVerse = useMemo(() => {
    const map = new Map<number, typeof targets>();
    for (const t of targets) {
      const list = map.get(t.verseNumber) || [];
      list.push(t);
      map.set(t.verseNumber, list);
    }
    return Array.from(map.entries());
  }, [targets]);

  return (
    <section className="virtual-teacher-panel" aria-label="Sanal Hafız Hocası">
      {/* Top Banner */}
      <div className="vt-header">
        <div className="vt-title-group">
          <span className="vt-badge">
            <Sparkles size={13} /> Sanal Hafız Hocası · Canlı Ezber Kontrolü
          </span>
          <h2>{title} — Hocaya Ezber Ver</h2>
          <p>
            Mikrofonu açıp ezberden oku; doğru telaffuz ettiğin her kelime anında yeşil yanarak açılır. Takıldığın yerde{' '}
            <strong>“💡 Fetih Ver”</strong> düğmesiyle tıpkı gerçek hafızlık dersindeki gibi tek kelimelik ipucu alabilirsin.
          </p>
        </div>

        <div className="vt-mode-pills">
          <button
            type="button"
            className={blindMode ? 'active' : ''}
            aria-pressed={blindMode}
            onClick={() => setBlindMode(true)}
          >
            <EyeOff size={15} />
            <span>Ezberden (Gizli)</span>
          </button>
          <button
            type="button"
            className={!blindMode ? 'active' : ''}
            aria-pressed={!blindMode}
            onClick={() => setBlindMode(false)}
          >
            <Eye size={15} />
            <span>Yüzünden Takip</span>
          </button>
        </div>
      </div>

      {/* Recognition Language & Progress Strip */}
      <div className="vt-toolbar">
        <div className="vt-lang-switch" role="group" aria-label="Algılama dili">
          <button
            type="button"
            className={localeMode === 'ar-SA' ? 'active' : ''}
            onClick={() => {
              stopListening();
              setLocaleMode('ar-SA');
            }}
          >
            🇸🇦 Arapça Kıraat
          </button>
          <button
            type="button"
            className={localeMode === 'tr-TR' ? 'active' : ''}
            onClick={() => {
              stopListening();
              setLocaleMode('tr-TR');
            }}
          >
            🇹🇷 Türkçe Okunuş
          </button>
        </div>

        <div className="vt-progress-pill">
          <strong>
            {Math.min(cursor, targets.length)} / {targets.length}
          </strong>{' '}
          kelime · %{targets.length ? Math.round((Math.min(cursor, targets.length) / targets.length) * 100) : 0}
        </div>
      </div>

      {/* Primary Mic + Fetih Action Bar */}
      <div className="vt-controls">
        {status === 'listening' ? (
          <button type="button" className="vt-mic-btn listening" onClick={stopListening}>
            <Square size={18} />
            <span>Dinlemeyi Durdur</span>
            <span className="vt-wave" aria-hidden="true">
              {[0.5, 1.0, 0.75, 0.9, 0.6].map((mult, idx) => (
                <i
                  key={idx}
                  style={{
                    height: `${Math.max(6, Math.round(6 + audioLevel * 18 * mult))}px`,
                  }}
                />
              ))}
            </span>
          </button>
        ) : (
          <button type="button" className="vt-mic-btn" onClick={startListening}>
            <Mic size={19} />
            <span>{completed ? 'Tekrar Dinlet' : cursor > 0 ? 'Okumaya Devam Et' : 'Mikrofonu Aç & Ezber Ver'}</span>
          </button>
        )}

        <button
          type="button"
          className="vt-secondary-btn fetih"
          disabled={completed}
          onClick={giveFetihHint}
          title="Takıldığın tek kelimeyi açar (Hoca ipucu)"
        >
          <Lightbulb size={17} />
          <span>Fetih Ver (İpucu)</span>
        </button>

        <button
          type="button"
          className="vt-secondary-btn"
          disabled={completed}
          onClick={markCurrentCorrectManually}
          title="Sessiz ortamda kelimeyi okudum olarak işaretle"
        >
          <Check size={17} />
          <span>Okudum Geç</span>
        </button>

        <button type="button" className="vt-icon-btn" aria-label="Sıfırla" onClick={resetTeacher}>
          <RotateCcw size={17} />
        </button>
      </div>

      {/* Live Status / Feedback Alerts */}
      {status === 'listening' && (
        <div className="vt-live-strip" role="status">
          <span className="vt-pulse-dot" />
          <span>
            Sanal Hoca dinliyor…{' '}
            {liveHeard ? (
              <em dir={localeMode === 'ar-SA' ? 'rtl' : 'ltr'}>“{liveHeard}”</em>
            ) : (
              'Sıradaki kelimeden itibaren net sesle okumaya başla.'
            )}
          </span>
        </div>
      )}

      {mismatchHint && !completed && (
        <div className="vt-warning-strip" role="alert">
          <AlertTriangle size={16} />
          <span>
            Bu kelimede ufak bir takılma algılandı. Kelimeyi tekrar oku veya <strong>“Fetih Ver”</strong> ile hocadan ipucu al.
          </span>
        </div>
      )}

      {status === 'permission-denied' && (
        <div className="vt-warning-strip" role="alert">
          <AlertTriangle size={16} />
          <span>
            Mikrofon veya Konuşma Tanıma izni kapalı. iOS Ayarlar &gt; Hıfz menüsünden izinleri açabilir veya <strong>“Okudum Geç / Fetih Ver”</strong> butonlarıyla sessiz modda çalışabilirsin.
          </span>
        </div>
      )}

      {status === 'unavailable' && (
        <div className="vt-warning-strip" role="status">
          <AlertTriangle size={16} />
          <span>
            Bu cihazda canlı ses tanıma şu an hazır değil; <strong>“Okudum Geç”</strong> ve <strong>“Fetih Ver”</strong> düğmeleriyle kelime kelime ezber kontrolü yapabilirsin.
          </span>
        </div>
      )}

      {/* Mushaf Word-by-Word Interactive Sheet */}
      <div className="vt-mushaf-sheet">
        {groupedByVerse.map(([verseNum, vTargets]) => {
          const verseObj = verses.find((v) => v.number === verseNum);
          return (
            <div key={verseNum} className="vt-verse-block">
              <div className="vt-verse-meta">
                <span>{verseNum}. Ayet / Bölüm</span>
                {verseObj && (
                  <button
                    type="button"
                    className="vt-listen-ref"
                    onClick={() => {
                      stopListening();
                      onPlayReference(verseObj);
                    }}
                  >
                    <Volume2 size={14} />
                    <span>Hocadan Dinle</span>
                  </button>
                )}
              </div>

              <div className="vt-words-rtl" dir="rtl" lang="ar">
                {vTargets.map((t) => {
                  const st = wordStates[t.index];
                  const isCurrent = t.index === cursor;
                  const isRevealed = !!st || !blindMode;
                  return (
                    <span
                      key={t.index}
                      ref={isCurrent ? activeWordElRef : null}
                      onClick={() => {
                        if (isCurrent) giveFetihHint();
                      }}
                      className={[
                        'vt-word-chip',
                        st ? `state-${st}` : 'state-pending',
                        isCurrent ? 'is-current' : '',
                        blindMode && !st ? 'is-masked' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <span className="vt-word-ar">
                        {isRevealed ? displayArabic(t.displayArabic) : '••••'}
                      </span>
                      {isRevealed && t.readingTr && (
                        <small className="vt-word-tr" dir="ltr">
                          {t.readingTr}
                        </small>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Report Card */}
      {completed && (
        <div className="vt-report-card" role="region" aria-label="Sanal Hoca Ezber Karnesi">
          <div className="vt-report-top">
            <CheckCircle2 size={28} className="vt-report-icon" />
            <div>
              <h3>
                {accuracyPct >= 92 && hintedCount === 0
                  ? '🌟 Maşallah! Eksiksiz Ezber Verdın'
                  : accuracyPct >= 75
                  ? '👏 Güzel Okuyuş! Küçük Rötuşlarla Tamamdır'
                  : '📖 Gayretli Başlangıç! Birkaç Tekrarla Oturtalım'}
              </h3>
              <p>
                Doğruluk Skoru: <strong>%{accuracyPct}</strong> · Tek Seferde Doğru: <strong>{pureCorrectCount}</strong> kelime · Fetih (İpucu):{' '}
                <strong>{hintedCount}</strong> · Düzeltilen Takılma: <strong>{correctedCount}</strong>
              </p>
            </div>
          </div>

          {onSaveMastery && (
            <div className="vt-report-actions">
              <button
                type="button"
                className="vt-save-btn solid"
                onClick={() => {
                  const r: Rating = accuracyPct >= 90 && hintedCount === 0 ? 'solid' : accuracyPct >= 70 ? 'learning' : 'again';
                  onSaveMastery(r);
                  setSavedRating(r);
                }}
              >
                {savedRating
                  ? '✓ Ezber Karnene Kaydedildi!'
                  : accuracyPct >= 90 && hintedCount === 0
                  ? '🌟 Sağlam Olarak Karneme Kaydet'
                  : '📅 Tekrar Planıma Kaydet'}
              </button>
              <button type="button" className="vt-secondary-btn" onClick={resetTeacher}>
                <RotateCcw size={16} />
                <span>Tekrar Ezber Ver</span>
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
