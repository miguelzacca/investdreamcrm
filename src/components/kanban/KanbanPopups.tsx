"use client";

import React, { useState, useEffect, useCallback } from 'react';
import styles from './KanbanPopups.module.css';

/* ─────────────────────────────────────────
   Helpers de localStorage para controle de tempo
───────────────────────────────────────── */
const FEEDBACK_KEY   = 'kanban_feedback_last_shown';
const AICHAT_KEY     = 'kanban_aichat_last_shown';
const FEEDBACK_DISMISSED_KEY = 'kanban_feedback_dismissed_until';
const AICHAT_DISMISSED_KEY   = 'kanban_aichat_dismissed_until';

// Intervalo mínimo entre exibições (ms)
const FEEDBACK_MIN_INTERVAL = 3 * 24 * 60 * 60 * 1000; // 3 dias
const AICHAT_MIN_INTERVAL   = 1 * 24 * 60 * 60 * 1000; // 1 dia

// Delay inicial antes do primeiro popup aparecer (ms)
const INITIAL_DELAY_FEEDBACK = 90_000;  // 1.5 min de uso
const INITIAL_DELAY_AICHAT   = 40_000; // 40s de uso

function shouldShow(key: string, dismissKey: string, interval: number): boolean {
  try {
    const dismissed = localStorage.getItem(dismissKey);
    if (dismissed && Date.now() < Number(dismissed)) return false;
    const last = localStorage.getItem(key);
    if (!last) return true;
    return Date.now() - Number(last) > interval;
  } catch {
    return false;
  }
}

function markShown(key: string) {
  try { localStorage.setItem(key, String(Date.now())); } catch {}
}

function dismissFor(dismissKey: string, ms: number) {
  try { localStorage.setItem(dismissKey, String(Date.now() + ms)); } catch {}
}

/* ─────────────────────────────────────────
   Feedback Popup
───────────────────────────────────────── */
interface FeedbackPopupProps {
  onClose: () => void;
}

function FeedbackPopup({ onClose }: FeedbackPopupProps) {
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [suggestion, setSuggestion] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stars) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stars, suggestion }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      markShown(FEEDBACK_KEY);
      setTimeout(onClose, 2200);
    } catch {
      setStatus('error');
    }
  }

  function handleDismiss() {
    dismissFor(FEEDBACK_DISMISSED_KEY, 7 * 24 * 60 * 60 * 1000); // snooze 7 dias
    markShown(FEEDBACK_KEY);
    onClose();
  }

  const displayStar = hoveredStar || stars;

  return (
    <div className={styles.overlay} onClick={handleDismiss}>
      <div
        className={styles.popupCard}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Popup de feedback"
      >
        {/* Dismiss */}
        <button className={styles.closeBtn} onClick={handleDismiss} aria-label="Fechar">×</button>

        {status === 'success' ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>🎉</div>
            <h3 className={styles.successTitle}>Obrigado pelo feedback!</h3>
            <p className={styles.successText}>Sua opinião nos ajuda a melhorar o sistema.</p>
          </div>
        ) : (
          <>
            <div className={styles.popupHeader}>
              <div className={styles.popupIconWrap}>
                <span className={styles.popupIcon}>💡</span>
              </div>
              <div>
                <h3 className={styles.popupTitle}>Como está sua experiência?</h3>
                <p className={styles.popupSubtitle}>
                  Avalie o sistema e sugira melhorias — leva menos de 1 minuto!
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Stars */}
              <div className={styles.starsSection}>
                <p className={styles.starsLabel}>Avaliação UX</p>
                <div className={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`${styles.starBtn} ${s <= displayStar ? styles.starActive : ''}`}
                      onMouseEnter={() => setHoveredStar(s)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setStars(s)}
                      aria-label={`${s} estrelas`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {1 > 0 && (
                  <p className={styles.starsHint}>
                    {displayStar === 5 ? '🎉 Incrível! Que ótimo!' :
                     displayStar === 4 ? '👍 Muito bom!' :
                     displayStar === 3 ? '😐 Ok, pode melhorar' :
                     displayStar === 2 ? '😕 Está difícil de usar...' :
                     '😞 Precisamos melhorar muito'}
                  </p>
                )}
              </div>

              {/* Suggestion */}
              <div className={styles.suggestionSection}>
                <label className={styles.suggestionLabel} htmlFor="feedback-suggestion">
                  💬 Tem alguma sugestão ou ideia? (opcional)
                </label>
                <textarea
                  id="feedback-suggestion"
                  className={styles.suggestionTextarea}
                  placeholder="Ex: Queria poder filtrar leads por data, ou um relatório semanal..."
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  rows={3}
                />
              </div>

              {status === 'error' && (
                <p className={styles.errorMsg}>⚠️ Erro ao enviar. Tente novamente.</p>
              )}

              <div className={styles.popupActions}>
                <button type="button" className={styles.snoozeBtn} onClick={handleDismiss}>
                  Agora não
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={!stars || status === 'loading'}
                >
                  {status === 'loading' ? 'Enviando...' : 'Enviar feedback ✉️'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   AI Chat Popup (mini toast)
───────────────────────────────────────── */
interface AIChatPopupProps {
  onClose: () => void;
}

function AIChatPopup({ onClose }: AIChatPopupProps) {
  function handleDismiss() {
    dismissFor(AICHAT_DISMISSED_KEY, 2 * 24 * 60 * 60 * 1000); // snooze 2 dias
    markShown(AICHAT_KEY);
    onClose();
  }

  function handleAction() {
    markShown(AICHAT_KEY);
    dismissFor(AICHAT_DISMISSED_KEY, 5 * 24 * 60 * 60 * 1000);
    // Acionar o botão do chat IA para abri-lo
    const chatBtn = document.querySelector('[data-chat-trigger]') as HTMLButtonElement | null;
    if (chatBtn) {
      chatBtn.click();
    }
    onClose();
  }

  return (
    <div className={styles.aiChatToast} role="complementary" aria-label="Dica: Chat IA">
      <button className={styles.aiChatClose} onClick={handleDismiss} aria-label="Fechar dica">×</button>

      <div className={styles.aiChatContent}>
        <div className={styles.aiChatIconWrap}>
          <span className={styles.aiChatIcon}>🤖</span>
          <span className={styles.aiChatPulse} />
        </div>

        <div className={styles.aiChatText}>
          <p className={styles.aiChatTitle}>Já testou o Chat IA?</p>
          <p className={styles.aiChatDesc}>
            Seu assistente inteligente está aqui! Tire dúvidas, peça análises e muito mais.
          </p>
        </div>
      </div>

      <button className={styles.aiChatBtn} onClick={handleAction}>
        Testar agora →
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   Controlador dos Popups
   
   🧪 MODO DE PREVIEW (para testar):
   ?popup=feedback  → força o popup de avaliação UX
   ?popup=aichat    → força o toast do Chat IA
───────────────────────────────────────── */
export function KanbanPopups() {
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAIChat, setShowAIChat]     = useState(false);

  // Montar os timers: um de cada vez, em momentos distintos
  useEffect(() => {
    // ── Modo preview via query string ──────────────────────
    // ?popup=feedback  →  abre o popup de feedback imediatamente
    // ?popup=aichat    →  abre o toast do Chat IA imediatamente
    const params = new URLSearchParams(window.location.search);
    const preview = params.get('popup');
    if (preview === 'feedback') {
      setShowFeedback(true);
      return; // não monta os timers normais em preview
    }
    if (preview === 'aichat') {
      setShowAIChat(true);
      return;
    }

    // ── Fluxo normal com delays ────────────────────────────
    // 1) AI Chat aparece primeiro — ~40s de uso na tela
    const aiTimer = setTimeout(() => {
      if (shouldShow(AICHAT_KEY, AICHAT_DISMISSED_KEY, AICHAT_MIN_INTERVAL)) {
        setShowAIChat(true);
      }
    }, INITIAL_DELAY_AICHAT);

    // 2) Feedback aparece mais tarde — ~1.5 min
    //    Se o AI Chat ainda estiver aberto nesse momento, aguarda mais um pouco
    const feedbackTimer = setTimeout(() => {
      setShowAIChat(current => {
        if (!current && shouldShow(FEEDBACK_KEY, FEEDBACK_DISMISSED_KEY, FEEDBACK_MIN_INTERVAL)) {
          setShowFeedback(true);
        }
        return current;
      });
    }, INITIAL_DELAY_FEEDBACK);

    return () => {
      clearTimeout(aiTimer);
      clearTimeout(feedbackTimer);
    };
  }, []);

  // Quando o AI Chat fecha, agenda feedback em 1–3 min se ainda não foi mostrado
  const handleAIChatClose = useCallback(() => {
    setShowAIChat(false);
    // Em modo preview não reagenda
    const params = new URLSearchParams(window.location.search);
    if (params.get('popup') === 'aichat') return;
    const delay = 60_000 + Math.random() * 120_000;
    setTimeout(() => {
      if (shouldShow(FEEDBACK_KEY, FEEDBACK_DISMISSED_KEY, FEEDBACK_MIN_INTERVAL)) {
        setShowFeedback(true);
      }
    }, delay);
  }, []);

  const handleFeedbackClose = useCallback(() => {
    setShowFeedback(false);
  }, []);

  return (
    <>
      {showFeedback && <FeedbackPopup onClose={handleFeedbackClose} />}
      {showAIChat   && <AIChatPopup  onClose={handleAIChatClose}   />}
    </>
  );
}
