import { useRef, useState } from 'react';

// Meet-Buckee scripted teaser — signup-first, NO public chat (same fix as Home).
// The marketing site deliberately never calls an AI endpoint: a public,
// unauthenticated Buckee would be an abuse/cost vector. Whatever the visitor
// asks, Buckee replies locally with an invitation to join and meet him in the
// app, then the input gives way to the Join/Open-the-app CTA.

export const BUCKEE_GREETING: Record<string, string> = {
  EN: "Hey, I'm Buckee 👋 Ask me anything about the city.",
  ES: '¡Hola! Soy Buckee 👋 Pregúntame lo que quieras sobre la ciudad.',
  FR: 'Salut, je suis Buckee 👋 Demandez-moi ce que vous voulez sur la ville.',
  PT: 'Oi, eu sou o Buckee 👋 Pergunte o que quiser sobre a cidade.',
};

// Buckee's one scripted reply: sign up free and meet him in the app.
const BUCKEE_REPLY: Record<string, string> = {
  EN: 'Please sign up for free and meet me in the app! The full me — trip planning, rides, reservations — lives there. 💛',
  ES: '¡Regístrate gratis y nos vemos en la app! El Buckee completo — planes, traslados, reservas — vive ahí. 💛',
  FR: "Inscrivez-vous gratuitement et retrouvez-moi dans l'appli ! Le vrai moi — voyages, trajets, réservations — vit là-bas. 💛",
  PT: 'Cadastre-se grátis e me encontre no app! O Buckee completo — viagens, corridas, reservas — mora lá. 💛',
};
// Signed-in members skip the signup pitch and get pointed straight at the app.
const BUCKEE_REPLY_MEMBER: Record<string, string> = {
  EN: "You're already in — open the app and I'm all yours! Trip planning, rides, reservations. 💛",
  ES: 'Ya eres miembro — ¡abre la app y estoy a tu disposición! Planes, traslados, reservas. 💛',
  FR: "Vous êtes déjà membre — ouvrez l'appli et je suis à vous ! Voyages, trajets, réservations. 💛",
  PT: 'Você já é membro — abra o app e estou à disposição! Viagens, corridas, reservas. 💛',
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

  // Mic is browser-local SpeechRecognition — it only fills the input, no network.
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

  const send = (text: string) => {
    const content = text.trim();
    if (!content || sending || gated) return;
    setMessages((m) => [...m, { role: 'user', content }]);
    setInput('');
    setSending(true);
    // Brief typing-dots beat so the scripted reply still feels like Buckee.
    setTimeout(() => {
      const reply = (hasSession ? BUCKEE_REPLY_MEMBER : BUCKEE_REPLY)[lang] || BUCKEE_REPLY.EN;
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
      setSending(false);
      setGated(true);
      setTimeout(() => scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 60);
    }, 900);
  };

  // Used by the Meet Buckee prompt-starter cards: open the chat and fire a prompt.
  const sendPrompt = (text: string) => { setOpen(true); send(text); };

  return {
    open, setOpen, messages, input, setInput, sending, gated, listening,
    inputRef, scrollRef, toggleMic, send, sendPrompt,
  };
}
