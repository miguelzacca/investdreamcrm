"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  LogOut,
  FileText,
  Send,
  BarChart3,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { MobileAdminDashboard } from "@/components/mobile/MobileAdminDashboard";
import { MobileUserDashboard } from "@/components/mobile/MobileUserDashboard";
import { AiChat } from "@/components/ai/AiChat";
import { usePageTransition } from "@/lib/TransitionContext";
import {
  sidebarReveal,
  headerReveal,
  contentReveal,
  contentItemReveal,
  reducedSidebarReveal,
  reducedContentReveal,
  reducedItemReveal,
} from "@/hooks/useDashboardReveal";
import styles from "./AppLayout.module.css";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { onDashboardMount } = usePageTransition();
  const prefersReducedMotion = useReducedMotion();

  const isAdmin = session?.user?.role === "ADMIN";
  const displayName = session?.user?.name || session?.user?.username || "";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  /* ── Act 3: notify the transition system that the dashboard is ready ── */
  useEffect(() => {
    onDashboardMount();
    // onDashboardMount is stable (useCallback), safe to include
  }, [onDashboardMount]);

  /* ── Nav structure ── */
  const mainNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Leads", href: "/leads", icon: FileText },
  ];

  const adminNavItems = isAdmin
    ? [
        { name: "Métricas",         href: "/admin/metrics",    icon: BarChart3 },
        { name: "Distribuir Leads", href: "/admin/leads",      icon: Send },
        { name: "Equipe",           href: "/admin/team",       icon: Users },
        { name: "Novo Usuário",     href: "/admin/users/new",  icon: UserPlus },
        { name: "WhatsApp Bot",     href: "/admin/whatsapp",   icon: MessageCircle },
      ]
    : [];

  /* ── Pick variant sets based on motion preference ── */
  const sidebar    = prefersReducedMotion ? reducedSidebarReveal : sidebarReveal;
  const content    = prefersReducedMotion ? reducedContentReveal : contentReveal;
  const item       = prefersReducedMotion ? reducedItemReveal    : contentItemReveal;

  return (
    <>
      {/* Mobile view for ADMIN */}
      {isAdmin && (
        <div className="mobile-only">
          <MobileAdminDashboard />
        </div>
      )}

      {/* Mobile view for USER */}
      {!isAdmin && (
        <div className="mobile-only">
          <MobileUserDashboard />
        </div>
      )}

      {/* ── Desktop shell ── */}
      <motion.div
        className={`${styles.layout} desktop-only`}
        variants={content}
        initial="hidden"
        animate="show"
      >
        {/* ── Sidebar — slides in from left with spring ── */}
        <motion.aside
          variants={sidebar}
          className={styles.sidebar}
        >
          {/* Logo */}
          <motion.div
            className={styles.logo}
            variants={item}
          >
            <div className={styles.logoIcon}>
              <Image src="/image.png" alt="Invest Dream Logo" width={22} height={22} />
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoName}>InvestDream</span>
              <span className={styles.logoSub}>CRM Pro</span>
            </div>
          </motion.div>

          {/* Main nav */}
          <nav className={styles.nav}>
            <motion.span variants={item} className={styles.navSection}>
              Principal
            </motion.span>

            {mainNavItems.map((navItem, i) => {
              const Icon = navItem.icon;
              const isActive =
                pathname === navItem.href ||
                (navItem.href !== "/dashboard" && pathname.startsWith(navItem.href));
              return (
                <motion.div key={navItem.href} variants={item}>
                  <Link
                    href={navItem.href}
                    className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                  >
                    <Icon size={17} className={styles.navIcon} />
                    {navItem.name}
                  </Link>
                </motion.div>
              );
            })}

            {/* Admin section */}
            {isAdmin && adminNavItems.length > 0 && (
              <>
                <motion.div variants={item} className={styles.navDivider} />
                <motion.span variants={item} className={styles.navSection}>
                  Administração
                </motion.span>
                {adminNavItems.map((navItem) => {
                  const Icon = navItem.icon;
                  const isActive = pathname.startsWith(navItem.href);
                  return (
                    <motion.div key={navItem.href} variants={item}>
                      <Link
                        href={navItem.href}
                        className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                      >
                        <Icon size={17} className={styles.navIcon} />
                        {navItem.name}
                        {navItem.href === "/admin/metrics" && (
                          <span className={styles.navBadge}>Pro</span>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </>
            )}
          </nav>

          {/* Footer / User */}
          <motion.div variants={item} className={styles.footer}>
            <div className={styles.userCard}>
              <div className={`${styles.userAvatar} ${styles.userAvatarOnline}`}>
                {initials || "?"}
              </div>
              <div className={styles.userTexts}>
                <span className={styles.userName}>{displayName}</span>
                <span className={styles.userRole}>
                  {isAdmin ? "Administrador" : "Corretor"}
                </span>
              </div>
            </div>
            <button
              className={styles.logoutBtn}
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut size={15} />
              Sair da conta
            </button>
          </motion.div>
        </motion.aside>

        {/* ── Main content ── */}
        <main className={styles.main}>
          {/* Top header bar — drops from above */}
          <motion.header variants={headerReveal} className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.headerBreadcrumb}>
                <span>InvestDream</span>
                <ChevronRight size={13} className={styles.headerBreadcrumbSep} />
                <span style={{ color: "var(--text-secondary)" }}>{title}</span>
              </div>
            </div>

            <div className={styles.headerRight}>
              <div className={styles.headerLivePill}>
                <span className={styles.headerLiveDot} />
                Ao vivo
              </div>

              <div className={styles.headerUserChip}>
                <div className={styles.headerUserAvatar}>{initials || "?"}</div>
                <span className={styles.headerUserName}>{displayName}</span>
              </div>
            </div>
          </motion.header>

          {/* Content — staggered children via contentReveal */}
          <motion.div variants={item} className={styles.content}>
            {children}
          </motion.div>
        </main>

        <AiChat />
      </motion.div>
    </>
  );
}
