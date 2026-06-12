"use client";

import React, { useState, useEffect } from "react";
import { LogOut, Phone, Home, MessageSquare, Clock, CheckCircle2, Inbox } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { getActiveLeads } from "@/app/leads/actions";
import { Lead } from "@prisma/client";
import styles from "./MobileUserDashboard.module.css";

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 3600;
  if (interval > 24) return Math.floor(interval / 24) + " dias atrás";
  if (interval >= 1) return Math.floor(interval) + "h atrás";
  interval = seconds / 60;
  if (interval >= 1) return Math.floor(interval) + "m atrás";
  return "Agora mesmo";
}

export function MobileUserDashboard() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveLeads()
      .then(setLeads)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const newLeads = leads.filter(l => l.funnelStage === "NEW_LEAD");
  const inProgressLeads = leads.filter(l => l.funnelStage !== "NEW_LEAD" && l.funnelStage !== "CLOSED_WON" && l.funnelStage !== "CLOSED_LOST");

  const firstName = session?.user?.name?.split(" ")[0] || "Corretor";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Invest Dream</h1>
        <button
          className={styles.logoutBtn}
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sair"
        >
          <LogOut size={18} />
        </button>
      </header>

      <main className={styles.content}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          Olá, {firstName} 👋
        </h2>
        <p className={styles.description}>
          Aqui estão seus leads aguardando o primeiro contato.
        </p>

        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{newLeads.length}</span>
            <span className={styles.statLabel}>Novos</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{inProgressLeads.length}</span>
            <span className={styles.statLabel}>Em Andamento</span>
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--primary-light)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontWeight: 500 }}>Buscando leads...</span>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : newLeads.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className={styles.emptyStateTitle}>Tudo em dia!</h3>
              <p className={styles.emptyStateText}>
                Você não tem novos leads na fila no momento. Aproveite para focar nos atendimentos em andamento.
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.leadsList}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Inbox size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Caixa de Entrada</h3>
            </div>
            
            {newLeads.map(lead => (
              <div key={lead.id} className={styles.leadCard}>
                <div className={styles.leadHeader}>
                  <h4 className={styles.leadName}>{lead.name}</h4>
                  <span className={styles.leadTime}>{formatTimeAgo(lead.createdAt)}</span>
                </div>
                
                <div className={styles.leadDetails}>
                  <div className={styles.detailRow}>
                    <Home size={15} className={styles.detailIcon} />
                    <span>{lead.interest || 'Interesse não especificado'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <MessageSquare size={15} className={styles.detailIcon} />
                    <span>Origem: <span className={styles.badge}>{lead.source || 'Geral'}</span></span>
                  </div>
                </div>
                
                <a 
                  href={`https://wa.me/${lead.whatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${lead.name}, sou ${firstName} corretor(a) da Invest Dream. Vi que você tem interesse em ${lead.interest || 'nossos imóveis'}. Como posso ajudar?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.whatsappBtn}
                >
                  <Phone fill="currentColor" size={18} />
                  Chamar no WhatsApp
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
