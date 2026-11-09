"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type { ThemeName } from "@/lib/palette";

/**
 * Fragments of the product for a loader to sit inside.
 *
 * A loader on a blank card tells you what it looks like; it does not tell you
 * whether it works. These put each one where it would actually run — in a
 * message, in a status pill, in the slot an image will fill — using the chat's
 * own surfaces and type so the judgement is the real one.
 */

const ink = (day: boolean) => (day ? "text-black/85" : "text-white/85");
const dim = (day: boolean) => (day ? "text-black/40" : "text-white/40");
const hair = (day: boolean) => (day ? "border-black/8" : "border-white/10");
const slot = (day: boolean) => (day ? "bg-black/[0.04]" : "bg-white/[0.045]");

/** An assistant turn: a line of copy with something happening inside it. */
export function TurnUsage({
  theme,
  children,
  caption,
}: {
  theme: ThemeName;
  children: ReactNode;
  caption?: string;
}) {
  const day = theme === "day";
  return (
    <div className="w-full px-[20px] py-[18px]">
      <div className="flex items-center gap-[10px]">{children}</div>
      {caption && (
        <p className={`mt-[10px] text-[11px] leading-[16px] ${dim(day)}`}>
          {caption}
        </p>
      )}
    </div>
  );
}

/** The slot an image will fill, with its caption underneath. */
export function ImageSlotUsage({
  theme,
  children,
}: {
  theme: ThemeName;
  children: ReactNode;
}) {
  const day = theme === "day";
  return (
    <div className="w-full px-[20px] py-[18px]">
      <div
        className={`grid aspect-square w-[108px] place-items-center rounded-[14px] border ${hair(
          day,
        )} ${slot(day)}`}
      >
        {children}
      </div>
      <p className={`mt-[10px] text-[12px] font-medium ${ink(day)}`}>
        Boarding pass preview
      </p>
      <p className={`mt-[2px] text-[11px] leading-[16px] ${dim(day)}`}>
        Generating · 1 of 4
      </p>
    </div>
  );
}

/** The status pill the whole project is built around. */
export function PillUsage({
  theme,
  children,
}: {
  theme: ThemeName;
  children: ReactNode;
}) {
  const day = theme === "day";
  return (
    <div className="grid w-full place-items-center px-[20px] py-[18px]">
      <span
        className={`flex h-[44px] items-center rounded-[60px] pl-[20px] pr-[10px] ${
          day
            ? "border border-[#e7e3db] bg-white"
            : "border border-white/10 bg-[#141414]"
        }`}
      >
        {children}
        <span className="ml-[12px] mr-[7px]" />
        <span className="flex size-[18px] items-center justify-center">
          <Image
            src="/icons/chevron.svg"
            alt=""
            width={18}
            height={18}
            className="-rotate-90"
          />
        </span>
      </span>
    </div>
  );
}

/** A user bubble above, and the answer still being written below it. */
export function AnswerUsage({
  theme,
  children,
}: {
  theme: ThemeName;
  children: ReactNode;
}) {
  const day = theme === "day";
  return (
    <div className="flex w-full flex-col gap-[12px] px-[20px] py-[18px]">
      <span
        className={`ml-auto max-w-[80%] rounded-[16px] border px-[12px] py-[8px] text-[12px] leading-[17px] ${hair(
          day,
        )} ${slot(day)} ${ink(day)}`}
      >
        What&rsquo;s the cheapest fare?
      </span>
      <div className="pr-[20px]">{children}</div>
    </div>
  );
}
