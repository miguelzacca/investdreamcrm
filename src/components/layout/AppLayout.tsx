"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LayoutDashboard, Users, UserPlus, LogOut, FileText, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === 'ADMIN';

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', href: '/leads', icon: FileText },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Todos os Leads', href: '/admin/leads', icon: LayoutList });
    navItems.push({ name: 'Equipe (Admin)', href: '/admin/team', icon: Users });
    navItems.push({ name: 'Novo Usuário', href: '/admin/users/new', icon: UserPlus });
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>Invest Dream CRM</div>
        
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
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{session?.user?.name || session?.user?.username}</span>
            <span className={styles.userRole}>{isAdmin ? 'Administrador' : 'Corretor'}</span>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-danger" 
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut size={18} className="mr-2" style={{marginRight: '0.5rem'}} />
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
    </div>
  );
}
