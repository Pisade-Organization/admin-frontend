"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChartPie,
  Ellipsis,
  FileCheck2,
  FileWarning,
  Menu,
  Settings,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import Typography from "@/shared/components/base/Typography";
import type { SidebarItem } from "@/shared/components/layout/Sidebar";
import type { AdminShellUser } from "@/shared/lib/adminSession";

type MobileDashboardHeaderProps = {
  items: SidebarItem[];
  user: AdminShellUser;
};

const iconMap = {
  Overview: ChartPie,
  "Tutors & Students": UsersRound,
  Tutors: UsersRound,
  Students: UsersRound,
  Applications: FileCheck2,
  Lessons: CalendarDays,
  Transactions: WalletCards,
  "Resolve Disputes": FileWarning,
  Settings,
} as const;

export default function MobileDashboardHeader({
  items,
  user,
}: MobileDashboardHeaderProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const notificationButton = (
    <button
      type="button"
      disabled
      aria-disabled="true"
      aria-label="Notifications are not available yet"
      title="Notifications are not available yet"
      className="cursor-not-allowed rounded-[8px] p-2 opacity-50"
    >
      <Bell className="h-5 w-5 text-white" />
    </button>
  );

  return (
    <>
      <header className="flex items-center justify-between bg-deep-royal-indigo-800 px-4 py-2 md:hidden">
        <Image
          width={91}
          height={30}
          src="/logos/pisade.svg"
          alt="Pisade logo"
        />

        <div className="flex items-center gap-3">
          {notificationButton}
          <button
            type="button"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setIsOpen((current) => !current)}
            className="rounded-[8px] border border-deep-royal-indigo-400 p-2"
          >
            {isOpen ? (
              <X className="h-5 w-5 text-white" />
            ) : (
              <Menu className="h-5 w-5 text-white" />
            )}
          </button>
        </div>
      </header>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-deep-royal-indigo-800 md:hidden">
          <header className="flex items-center justify-between px-4 py-2">
            <Image
              width={91}
              height={30}
              src="/logos/pisade.svg"
              alt="Pisade logo"
            />

            <div className="flex items-center gap-3">
              {notificationButton}
              <button
                type="button"
                aria-expanded={isOpen}
                aria-label="Close navigation menu"
                onClick={() => setIsOpen(false)}
                className="rounded-[8px] border border-deep-royal-indigo-400 p-2"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </header>

          <div className="flex flex-1 flex-col px-4 pb-4 pt-1">
            <nav className="flex h-full flex-col gap-2">
              {items.map((item) => {
                if ("children" in item) {
                  return item.children.map((child) => {
                    const Icon = iconMap[child.label];
                    const isActive = child.href === pathname;

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-[10px] rounded-xl px-3 py-[10px] transition-all ${
                          isActive
                            ? "bg-deep-royal-indigo-600"
                            : "hover:bg-deep-royal-indigo-700"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-white" />
                        <Typography variant="body-3" color="white">
                          {child.label}
                        </Typography>
                      </Link>
                    );
                  });
                }

                const Icon = iconMap[item.label];
                const isActive = item.href === pathname;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-[10px] rounded-xl px-3 py-[10px] transition-all ${
                      isActive
                        ? "bg-deep-royal-indigo-700"
                        : "hover:bg-deep-royal-indigo-700"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-white" />
                    <Typography variant="body-3" color="white">
                      {item.label}
                    </Typography>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-[10px] rounded-[8px] border border-deep-royal-indigo-400 px-3 py-[10px]">
              {user.avatarSrc ? (
                <Image
                  width={36}
                  height={36}
                  src={user.avatarSrc}
                  alt={user.name}
                  className="rounded-full"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-deep-royal-indigo-400 text-label-3 text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-1 flex-col">
                <Typography variant="label-3" className="text-white/50">
                  {user.name}
                </Typography>
                <Typography variant="body-4" className="text-white/70">
                  {user.email}
                </Typography>
              </div>
              <Ellipsis className="h-4 w-4 text-deep-royal-indigo-50" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
