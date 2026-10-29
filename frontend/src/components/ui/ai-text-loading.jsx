"use client";

/**
 * @author: @kokonutui
 * @description: AI Text Loading - Fast & Responsive
 * @version: 1.1.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

export default function AITextLoading({
  texts = [
    "Thinking...",
    "Analyzing...",
    "Responding...",
  ],
  className,
  interval = 1400,
}) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, interval);

    return () => clearInterval(timer);
  }, [interval, texts.length]);

  if (!texts || texts.length === 0) return null;

  return (
    <div className="relative inline-flex items-center overflow-hidden py-0.5 min-h-[22px]">
      <AnimatePresence mode="wait">
        <motion.span
          key={`${currentTextIndex}-${texts[currentTextIndex]}`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.16, ease: "easeInOut" }}
          className={cn(
            "text-xs font-semibold text-slate-700 select-none whitespace-nowrap",
            className
          )}
        >
          {texts[currentTextIndex]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
