"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LayoutDashboard, Users, UserPlus, LogOut, FileText, Send, MonitorSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MobileAdminDashboard } from '@/components/mobile/MobileAdminDashboard';
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

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', href: '/leads', icon: FileText },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Distribuir Leads', href: '/admin/leads', icon: Send });
    navItems.push({ name: 'Equipe (Admin)', href: '/admin/team', icon: Users });
    navItems.push({ name: 'Novo Usuário', href: '/admin/users/new', icon: UserPlus });
  }

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
          <div className="mobile-blocker" style={{ display: 'flex' }}>
            <MonitorSmartphone size={64} className="mb-6 text-primary" />
            <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
            <p className="text-muted text-base max-w-xs">
              O Invest Dream CRM foi projetado para oferecer a melhor experiência em telas maiores. Por favor, acesse através de um computador ou notebook.
            </p>
          </div>
        </div>
      )}

      {/* Desktop view */}
      <div className={`${styles.layout} desktop-only`}>
        <aside className={styles.sidebar}>
          <div className={styles.logo}>
            <Image src="/image.png" alt="Invest Dream Logo" width={30} height={30} />
            Invest Dream
          </div>
          
          <nav className={styles.nav}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                >
                  <Icon size={17} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className={styles.footer}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>{initials || '?'}</div>
              <div className={styles.userTexts}>
                <span className={styles.userName}>{displayName}</span>
                <span className={styles.userRole}>{isAdmin ? 'Administrador' : 'Corretor'}</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-danger" 
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut size={16} style={{ marginRight: '0.5rem' }} />
              Sair
            </Button>
          </div>
        </aside>

        <main className={styles.main}>
          <header className={styles.header}>
            <h1 className={styles.pageTitle}>{title}</h1>
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
