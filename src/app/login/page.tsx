"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [showIntro, setShowIntro] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const hasPlayed = sessionStorage.getItem('introPlayed');
    if (hasPlayed) {
      setShowIntro(false);
    } else {
      const timer = setTimeout(() => {
        setShowIntro(false);
        sessionStorage.setItem('introPlayed', 'true');
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (showIntro && isClient) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showIntro, isClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Ocorreu um erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient) return null;

  return (
    <>
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="intro-curtain"
            initial={{ y: 0 }}
            exit={{ y: "-100vh" }}
            transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: '#050505',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <Image 
                src="/image.png" 
                alt="Invest Dream Logo" 
                width={80} 
                height={80} 
                style={{ marginBottom: '2rem' }} 
                priority 
              />
              <div style={{ display: 'flex', overflow: 'hidden' }}>
                {"INVEST DREAM".split("").map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.05, duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] }}
                    style={{
                      color: '#ffffff',
                      fontSize: '1.25rem',
                      fontWeight: 300,
                      letterSpacing: '0.4em',
                      textTransform: 'uppercase',
                      marginRight: char === ' ' ? '1rem' : '0'
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </div>
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 1.2, duration: 1.2, ease: "easeInOut" }}
                style={{
                  marginTop: '1.5rem',
                  width: '100px',
                  height: '1px',
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  originX: 0.5
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className={styles.container}
        initial={!showIntro ? false : { opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: showIntro ? 2.8 : 0, duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
      >
        <motion.div 
          className={styles.loginCard}
          initial={!showIntro ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: showIntro ? 3.2 : 0, duration: 0.8, ease: "easeOut" }}
        >
          <div className={styles.logo}>
            <Image src="/image.png" alt="Invest Dream Logo" width={40} height={40} style={{ marginBottom: '1rem' }} />
            <h1 className={styles.logoTitle}>Invest Dream CRM</h1>
            <p className={styles.logoSubtitle}>Gestão Exclusiva de Aluguéis Anuais</p>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Usuário"
              type="text"
              placeholder="Digite seu usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
            <Input
              label="Senha"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            <Button
              type="submit"
              className={styles.submitBtn}
              size="lg"
              isLoading={isLoading}
            >
              Entrar
            </Button>
          </form>
        </motion.div>
      </motion.div>
    </>
  );
}
