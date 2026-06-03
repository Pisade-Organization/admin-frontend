"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChartPie,
  ChevronDown,
  Settings,
  UsersRound,
  Dot,
  FileCheck2,
  WalletCards,
  FileWarning,

} from "lucide-react";
import { useState } from "react";
import Typography from "../base/Typography";

type SidebarLabel =
  | "Overview"
  | "Tutors & Students"
  | "Tutors"
  | "Students"
  | "Applications"
  | "Lessons"
  | "Transactions"
  | "Resolve Disputes"
  | "Settings";

type SidebarLinkItem = {
  label: SidebarLabel;
  href: string;
};

type SidebarGroupItem = {
  label: "Tutors & Students";
  children: [
    { label: "Tutors"; href: "/tutors" },
    { label: "Students"; href: "/students" },
  ];
};

export type SidebarItem = SidebarLinkItem | SidebarGroupItem;

type SidebarProps = {
  items: SidebarItem[];
};

export default function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();
  const iconMap: Record<SidebarLabel, typeof ChartPie> = {
    Overview: ChartPie,
    "Tutors & Students": UsersRound,
    Tutors: Dot,
    Students: Dot,
    Applications: FileCheck2,
    Lessons: CalendarDays,
    Transactions: WalletCards,
    "Resolve Disputes": FileWarning,
    Settings,
  } as const;
  const [isTutorsStudentsOpen, setIsTutorsStudentsOpen] = useState(
    pathname === "/tutors" || pathname === "/students",
  );

  return (
    <aside className="hidden w-55 flex-col bg-deep-royal-indigo-800 md:flex">
      <header className="flex items-center justify-between pl-3 py-3 pr-4">
        <Image
          width={81}
          height={25}
          src="/logos/pisade.svg"
          alt="Pisade logo"
        />
        <button
          type="button"
          disabled
          aria-disabled="true"
          aria-label="Notifications are not available yet"
          title="Notifications are not available yet"
          className="cursor-not-allowed rounded-[8px] border border-deep-royal-indigo-500 p-2 opacity-50"
        >
          <Bell className="w-4.5 h-4.5 text-white" />
        </button>
      </header>

      <nav className="flex flex-col gap-2 px-1.5">
        {items.map((item) => {
          if ("children" in item) {
            const GroupIcon = iconMap[item.label];
            const isGroupActive = item.children.some((child) => child.href === pathname);

            return (
              <div key={item.label} className="flex flex-col gap-1">
                <button
                  type="button"
                  aria-expanded={isTutorsStudentsOpen}
                  onClick={() => setIsTutorsStudentsOpen((current) => !current)}
                  className={`cursor-pointer rounded-xl py-2.5 px-3 flex w-full gap-2.5 items-center transition-all ${
                    isGroupActive || isTutorsStudentsOpen
                      ? "bg-deep-royal-indigo-700"
                      : "hover:bg-deep-royal-indigo-700"
                  }`}
                >
                  <GroupIcon className="w-4 h-4 text-white shrink-0" />
                  <Typography
                    variant="body-3"
                    color="white"
                    className="flex-1 text-left"
                  >
                    {item.label}
                  </Typography>
                  <ChevronDown
                    className={`w-4 h-4 text-white shrink-0 transition-transform ${
                      isTutorsStudentsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isTutorsStudentsOpen ? (
                  <div className="flex flex-col gap-1 pl-5">
                    {item.children.map((child) => {
                      const ChildIcon = iconMap[child.label];
                      const isChildActive = child.href === pathname;

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          aria-current={isChildActive ? "page" : undefined}
                          className={`rounded-xl py-2 px-3 flex gap-2.5 items-center transition-all ${
                            isChildActive
                              ? "bg-deep-royal-indigo-600"
                              : "hover:bg-deep-royal-indigo-700"
                          }`}
                        >
                          <ChildIcon className="w-4 h-4 text-white shrink-0" />
                          <Typography variant="body-4" color="white">
                            {child.label}
                          </Typography>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          }

          const Icon = iconMap[item.label];
          const isActive = item.href === pathname;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-xl py-2.5 px-3 flex gap-2.5 items-center transition-all ${
                isActive
                  ? "bg-deep-royal-indigo-700"
                  : "hover:bg-deep-royal-indigo-700"
              }`}
            >
              <Icon className="w-4 h-4 text-white" />
              <Typography variant="body-3" color="white">
                {item.label}
              </Typography>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
