"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  LogOut,
  FileText,
  Send,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { MobileAdminDashboard } from '@/components/mobile/MobileAdminDashboard';
import { MobileUserDashboard } from '@/components/mobile/MobileUserDashboard';
import { AiChat } from '@/components/ai/AiChat';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === 'ADMIN';
  const displayName = session?.user?.name || session?.user?.username || '';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  // Nav structure
  const mainNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', href: '/leads', icon: FileText },
  ];

  const adminNavItems = isAdmin
    ? [
        { name: 'Métricas', href: '/admin/metrics', icon: BarChart3 },
        { name: 'Distribuir Leads', href: '/admin/leads', icon: Send },
        { name: 'Equipe', href: '/admin/team', icon: Users },
        { name: 'Novo Usuário', href: '/admin/users/new', icon: UserPlus },
      ]
    : [];

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

      {/* Desktop view */}
      <div className={`${styles.layout} desktop-only`}>
        {/* ── Sidebar ── */}
        <aside className={styles.sidebar}>

          {/* Logo */}
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <Image src="/image.png" alt="Invest Dream Logo" width={22} height={22} />
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoName}>InvestDream</span>
              <span className={styles.logoSub}>CRM Pro</span>
            </div>
          </div>

          {/* Main nav */}
          <nav className={styles.nav}>
            <span className={styles.navSection}>Principal</span>

            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                >
                  <Icon size={17} className={styles.navIcon} />
                  {item.name}
                </Link>
              );
            })}

            {/* Admin section */}
            {isAdmin && adminNavItems.length > 0 && (
              <>
                <div className={styles.navDivider} />
                <span className={styles.navSection}>Administração</span>
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                    >
                      <Icon size={17} className={styles.navIcon} />
                      {item.name}
                      {item.href === '/admin/metrics' && (
                        <span className={styles.navBadge}>Pro</span>
                      )}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* Footer / User */}
          <div className={styles.footer}>
            <div className={styles.userCard}>
              <div className={`${styles.userAvatar} ${styles.userAvatarOnline}`}>
                {initials || '?'}
              </div>
              <div className={styles.userTexts}>
                <span className={styles.userName}>{displayName}</span>
                <span className={styles.userRole}>{isAdmin ? 'Administrador' : 'Corretor'}</span>
              </div>
            </div>
            <button
              className={styles.logoutBtn}
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut size={15} />
              Sair da conta
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className={styles.main}>
          {/* Top header bar */}
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              {/* Breadcrumb path */}
              <div className={styles.headerBreadcrumb}>
                <span>InvestDream</span>
                <ChevronRight size={13} className={styles.headerBreadcrumbSep} />
                <span style={{ color: 'var(--text-secondary)' }}>{title}</span>
              </div>
            </div>

            <div className={styles.headerRight}>
              {/* Live indicator */}
              <div className={styles.headerLivePill}>
                <span className={styles.headerLiveDot} />
                Ao vivo
              </div>

              {/* User chip */}
              <div className={styles.headerUserChip}>
                <div className={styles.headerUserAvatar}>{initials || '?'}</div>
                <span className={styles.headerUserName}>{displayName}</span>
              </div>
            </div>
          </header>

          <div className={styles.content}>
            {children}
          </div>
        </main>

        <AiChat />
      </div>
    </>
  );
}
