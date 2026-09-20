"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Delay in ms, so a group of elements can cascade in */
  delay?: number;
  className?: string;
  as?: ElementType;
};

/**
 * Fades its children in when they scroll into view.
 *
 * Uses IntersectionObserver (built into the browser, no library) and
 * disconnects as soon as the element has appeared, so nothing keeps
 * listening. The animation itself lives in globals.css under `[data-reveal]`,
 * which is also where `prefers-reduced-motion` is honoured.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      data-visible={visible ? "true" : "false"}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      className={className}
    >
      {children}
    </Tag>
  );
}
