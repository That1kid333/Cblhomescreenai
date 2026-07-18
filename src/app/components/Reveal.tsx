/**
 * Reveal — reusable scroll/load entrance-motion primitives for the CBL site.
 *
 * Purely presentational: these wrap markup in a Framer Motion (`motion`) element
 * that fades + rises into place. They never change layout at rest — once revealed,
 * an element sits at opacity:1 / translateY:0, identical to no animation at all.
 *
 * Built as a small shared system so the same entrance language can be rolled out
 * site-wide later (trial started on /concierge).
 *
 *   <Stagger on="load">…</Stagger>        hero: children cascade in on mount
 *   <Stagger>…</Stagger>                  section: children cascade in on scroll (once)
 *   <StaggerItem>…</StaggerItem>          a child of a Stagger
 *   <Reveal>…</Reveal>                    a single element that reveals itself on scroll
 *
 * Accessibility: honors prefers-reduced-motion — transforms are dropped and only a
 * gentle opacity fade remains. Progressive-safe: whileInView(once) guarantees every
 * section reveals as it is scrolled into view; nothing is left stuck hidden.
 */

import type { ComponentProps, ElementType, ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';

// Premium ease-out (easeOutQuint-ish) — decisive settle, no bounce.
const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const DUR = 0.4; // 400ms, within the 200–400ms brief
const VIEWPORT = { once: true, amount: 0.15 } as const;

type Trigger = 'scroll' | 'load' | 'inherit';

function triggerProps(on: Trigger) {
  if (on === 'load') return { initial: 'hidden', animate: 'show' } as const;
  if (on === 'inherit') return {} as const; // inherit variant state from a parent Stagger
  return { initial: 'hidden', whileInView: 'show', viewport: VIEWPORT } as const;
}

// ── Single self-revealing element ──────────────────────────────────────────
type RevealProps = {
  as?: ElementType;
  children?: ReactNode;
  /** rise distance in px (default 20) */
  y?: number;
  /** extra delay in seconds */
  delay?: number;
  /** 'scroll' (default) reveals on view, 'load' on mount */
  on?: Extract<Trigger, 'scroll' | 'load'>;
} & Omit<ComponentProps<'div'>, 'ref'>;

export function Reveal({ as = 'div', children, y = 20, delay = 0, on = 'scroll', ...rest }: RevealProps) {
  const reduce = useReducedMotion();
  const Tag = (motion as unknown as Record<string, ElementType>)[as as string] ?? motion.div;
  const variants: Variants = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3, delay } } }
    : { hidden: { opacity: 0, y }, show: { opacity: 1, y: 0, transition: { duration: DUR, ease: EASE_OUT, delay } } };
  return (
    <Tag variants={variants} {...triggerProps(on)} {...rest}>
      {children}
    </Tag>
  );
}

// ── Stagger container: orchestrates its children's entrance ─────────────────
type StaggerProps = {
  as?: ElementType;
  children?: ReactNode;
  /** gap between children in seconds (default 0.07 = 70ms) */
  gap?: number;
  /** delay before the first child in seconds */
  delayChildren?: number;
  /** 'scroll' (default) on view · 'load' on mount · 'inherit' from a parent Stagger */
  on?: Trigger;
} & Omit<ComponentProps<'div'>, 'ref'>;

export function Stagger({ as = 'div', children, gap = 0.07, delayChildren = 0, on = 'scroll', ...rest }: StaggerProps) {
  const Tag = (motion as unknown as Record<string, ElementType>)[as as string] ?? motion.div;
  // Container itself has no visual change — it only sequences its children.
  const variants: Variants = { hidden: {}, show: { transition: { staggerChildren: gap, delayChildren } } };
  return (
    <Tag variants={variants} {...triggerProps(on)} {...rest}>
      {children}
    </Tag>
  );
}

// ── Stagger child: fades + rises when its parent Stagger fires ──────────────
type StaggerItemProps = {
  as?: ElementType;
  children?: ReactNode;
  /** rise distance in px (default 18) */
  y?: number;
} & Omit<ComponentProps<'div'>, 'ref'>;

export function StaggerItem({ as = 'div', children, y = 18, ...rest }: StaggerItemProps) {
  const reduce = useReducedMotion();
  const Tag = (motion as unknown as Record<string, ElementType>)[as as string] ?? motion.div;
  // No initial/animate here — the child inherits its state from the parent Stagger.
  const variants: Variants = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3 } } }
    : { hidden: { opacity: 0, y }, show: { opacity: 1, y: 0, transition: { duration: DUR, ease: EASE_OUT } } };
  return (
    <Tag variants={variants} {...rest}>
      {children}
    </Tag>
  );
}
