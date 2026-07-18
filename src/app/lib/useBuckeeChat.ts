import { useEffect, useRef, useState } from 'react';
import { BUCKEE_PUBLIC_URL, SUPABASE_ANON_KEY } from './constants';

// Free teaser chat shared by the Home hero bar and the Meet Buckee page.
// One localStorage key => the 5-message limit is shared SITE-WIDE (handoff §5b.3).
export const BUCKEE_MAX = 5;
const COUNT_KEY = 'buckee_teaser_count';

export const BUCKEE_GREETING: Record<string, string> = {
  EN: "Hey, I'm Buckee 👋 Ask me anything about the city.",
  ES: '¡Hola! Soy Buckee 👋 Pregúntame lo que quieras sobre la ciudad.',
  FR: 'Salut, je suis Buckee 👋 Demandez-moi ce que vous voulez sur la ville.',
  PT: 'Oi, eu sou o Buckee 👋 Pergunte o que quiser sobre a cidade.',
};
export const BUCKEE_GATE_LINE: Record<string, string> = {
  EN: "I'd love to keep helping — join free and I'm all yours. 💛",
  ES: 'Me encantaría seguir ayudándote: únete gratis y estoy a tu disposición. 💛',
  FR: "J'adorerais continuer à vous aider — inscrivez-vous gratuitement et je suis à vous. 💛",
  PT: 'Adoraria continuar ajudando — cadastre-se grátis e estou à disposição. 💛',
};
const LANG_LOCALE: Record<string, string> = { EN: 'en-US', ES: 'es-ES', FR: 'fr-FR', PT: 'pt-BR' };

export type BuckeeMessage = { role: 'user' | 'assistant'; content: string };

export function useBuckeeChat(lang: string, hasSession?: boolean) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<BuckeeMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [gated, setGated] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasSession) {
      setGated(false);
    } else if (Number(localStorage.getItem(COUNT_KEY) || '0') >= BUCKEE_MAX) {
      setGated(true);
    }
  }, [hasSession]);

  const startMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { inputRef.current?.focus(); return; } // graceful fallback: focus the input
    try {
      const rec = new SR();
      rec.lang = LANG_LOCALE[lang] || 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e: any) => {
        const t = e.results?.[0]?.[0]?.transcript || '';
        setInput((prev) => (prev ? prev + ' ' : '') + t);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recognitionRef.current = rec;
      setListening(true);
      rec.start();
    } catch { setListening(false); inputRef.current?.focus(); }
  };

  const toggleMic = () => {
    setOpen(true);
    if (listening) { recognitionRef.current?.stop?.(); setListening(false); return; }
    startMic();
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending || gated) return;
    const prevCount = Number(localStorage.getItem(COUNT_KEY) || '0');
    if (!hasSession && prevCount >= BUCKEE_MAX) { setGated(true); return; }

    const next = [...messages, { role: 'user' as const, content }];
    setMessages(next);
    setInput('');
    setSending(true);
    const newCount = prevCount + 1;
    if (!hasSession) {
      localStorage.setItem(COUNT_KEY, String(newCount));
    }

    let replyText = '';
    let limit = false;
    try {
      const res = await fetch(BUCKEE_PUBLIC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ messages: next, language: lang }),
      });
      const data = await res.json();
      replyText = data?.message || '…';
      limit = !!data?.limitReached;
    } catch {
      replyText = "I'm just warming up — I'll have real answers the moment we go live. What else are you curious about? 😊";
    }
    setMessages((m) => [...m, { role: 'assistant', content: replyText }]);
    setSending(false);
    if (!hasSession && (limit || newCount >= BUCKEE_MAX)) setGated(true);
    setTimeout(() => scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 60);
  };

  // Used by the Meet Buckee prompt-starter cards: open the chat and fire a prompt.
  const sendPrompt = (text: string) => { setOpen(true); send(text); };

  return {
    open, setOpen, messages, input, setInput, sending, gated, listening,
    inputRef, scrollRef, toggleMic, send, sendPrompt,
  };
}
