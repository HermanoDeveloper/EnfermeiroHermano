/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera,
  Upload,
  Edit2,
  Save,
  X,
  Search, 
  Bell, 
  Home, 
  Activity, 
  Stethoscope, 
  User, 
  ChevronRight, 
  ShieldCheck, 
  Syringe, 
  ArrowLeft,
  CheckCircle2,
  Pill,
  Wind,
  Thermometer,
  Menu,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Info,
  Layers,
  Microscope,
  AlertTriangle,
  HeartPulse,
  Briefcase,
  Phone,
  MapPin,
  ChevronDown,
  Calendar,
  Hash,
  Clock,
  AlertCircle
} from 'lucide-react';
import { cn } from './lib/utils';
import { Screen, Disease, Procedure, Medication } from './types';
import { DISEASES, PROCEDURES } from './constants';
import { DETAILED_PROCEDURES, DetailedProcedure } from './data/procedures';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { AIAssistantScreen } from './components/AIAssistantScreen';
import { FloatingBrain } from './components/FloatingBrain';
import { searchDiseaseAI, searchProcedureAI } from './services/gemini';

export default function App() {
  const isDev = import.meta.env.DEV;
  const [currentScreen, setCurrentScreen] = useState<Screen>(isDev ? 'home' : 'login');
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(isDev);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(isDev ? {
    full_name: 'Desenvolvedor (Modo Dev)',
    email: 'dev@exemplo.com',
    avatar_url: 'https://picsum.photos/seed/dev/200'
  } : null);
  const [diseases, setDiseases] = useState<Disease[]>(DISEASES);
  const [procedures, setProcedures] = useState<Procedure[]>(PROCEDURES);
  const [configError, setConfigError] = useState(!isSupabaseConfigured && !isDev);
  const [isInitializing, setIsInitializing] = useState(!isDev);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState<string | null>(null);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [isEnhancingProcedure, setIsEnhancingProcedure] = useState(false);
  const [isSelectingProcedureAI, setIsSelectingProcedureAI] = useState<string | null>(null);
  const [recentHistory, setRecentHistory] = useState<any[]>([]);

  const fetchHistory = async () => {
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) setRecentHistory(data);
    if (error) console.error('Error fetching history:', error);
  };

  const recordHistory = async (query: string, type: string = 'search', metadata: any = {}) => {
    if (!session?.user?.id) return;
    const { error } = await supabase
      .from('search_history')
      .insert({
        user_id: session.user.id,
        query,
        type,
        metadata
      });
    if (error) console.error('Error recording history:', error);
    else fetchHistory();
  };

  const handleSelectDisease = (d: Disease) => {
    setSelectedDisease(d);
    setCurrentScreen('disease-detail');
    recordHistory(d.name, 'view', { id: d.id, category: 'disease' });
  };

  const handleSelectProcedure = (p: Procedure) => {
    setSelectedProcedure(p);
    setCurrentScreen('procedure-detail');
    recordHistory(p.name, 'view', { id: p.id, category: 'procedure' });
  };

  const handleGlobalSearch = async () => {
    if (!searchQuery.trim()) return;
    
    recordHistory(searchQuery, 'search');

    // If we are on diseases screen or home, we can trigger AI search for diseases
    if (currentScreen === 'diseases' || currentScreen === 'home') {
      setIsSearchingAI(true);
      try {
        const result = await searchDiseaseAI(searchQuery);
        if (result) {
          setSelectedDisease(result);
          setCurrentScreen('disease-detail');
        }
      } catch (error) {
        console.error("Global AI Search failed", error);
      } finally {
        setIsSearchingAI(false);
      }
    } else if (currentScreen === 'procedures') {
      setIsSearchingAI(true);
      try {
        const result = await searchProcedureAI(searchQuery);
        if (result) {
          setSelectedProcedure(result);
          setCurrentScreen('procedure-detail');
        }
      } catch (error) {
        console.error("Global AI Procedure Search failed", error);
      } finally {
        setIsSearchingAI(false);
      }
    } else {
      // For other screens, just navigate to diseases with the query
      setCurrentScreen('diseases');
    }
  };

  const handleEnhanceProcedureAI = async (procedure: Procedure) => {
    setIsEnhancingProcedure(true);
    try {
      const result = await searchProcedureAI(procedure.name);
      if (result) {
        setSelectedProcedure(result);
      }
    } catch (error) {
      console.error("Enhance Procedure AI failed", error);
    } finally {
      setIsEnhancingProcedure(false);
    }
  };

  const handleSelectProcedureWithAI = async (procedure: Procedure) => {
    setIsSelectingProcedureAI(procedure.id);
    try {
      const result = await searchProcedureAI(procedure.name);
      if (result) {
        setSelectedProcedure(result);
      } else {
        // Fallback to local data if AI fails
        setSelectedProcedure(procedure);
      }
      setCurrentScreen('procedure-detail');
    } catch (error) {
      console.error("Select Procedure AI failed", error);
      setSelectedProcedure(procedure);
      setCurrentScreen('procedure-detail');
    } finally {
      setIsSelectingProcedureAI(null);
    }
  };

  // Auth Listener
  useEffect(() => {
    if (isDev) return;

    if (!isSupabaseConfigured) {
      console.error('Supabase configuration missing or invalid!');
      setConfigError(true);
      setIsInitializing(false);
      return;
    }

    const initSession = async () => {
      console.log('Initializing session...');
      const timeoutId = setTimeout(() => {
        if (isInitializing) {
          console.warn('Session initialization taking too long...');
          setTestError('Não foi possível conectar ao servidor. Por favor, tente novamente.');
          setTestStatus('error');
        }
      }, 10000);

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        clearTimeout(timeoutId);
        console.log('Session initialized:', !!session);
        if (error) throw error;
        setSession(session);
        setIsLoggedIn(!!session);
      } catch (err) {
        console.error('Failed to fetch session:', err);
        if (err instanceof Error && err.message.includes('fetch')) {
          setConfigError(true);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Profile
  useEffect(() => {
    if (session?.user) {
      fetchProfile();
      fetchHistory();
    } else {
      setProfile(null);
      setRecentHistory([]);
    }
  }, [session]);

  async function fetchProfile() {
    if (!isSupabaseConfigured || !session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (data) {
        setProfile({
          ...data,
          email: session.user.email
        });
      } else {
        // Fallback if profile record doesn't exist yet
        const fallbackProfile = {
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || 'Usuário',
          category: 'non-professional',
          phone: '',
          address: '',
          birth_date: '',
          other_category: ''
        };
        setProfile(fallbackProfile);
        
        // Try to create the profile record if it doesn't exist to avoid future missing data issues
        try {
          await supabase.from('profiles').upsert({
            id: fallbackProfile.id,
            full_name: fallbackProfile.full_name,
            category: fallbackProfile.category
          });
        } catch (upsertErr) {
          console.error('Error auto-creating profile:', upsertErr);
        }
      }
      if (error) console.error('Error fetching profile:', error.message);
    } catch (err) {
      console.error('Network error fetching profile:', err);
    }
  }

  // Fetch Data
  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  async function fetchData() {
    if (!isSupabaseConfigured) return;
    try {
      const { data: diseasesData, error: diseasesError } = await supabase.from('diseases').select('*');
      if (diseasesData) {
        setDiseases(diseasesData);
      } else if (diseasesError) {
        // Only log if it's not a network error, or if we are not in dev mode
        if (!diseasesError.message.includes('fetch') || !isDev) {
          console.error('Error fetching diseases:', diseasesError.message);
        }
      }

      const { data: proceduresData, error: proceduresError } = await supabase.from('procedures').select('*');
      if (proceduresData) {
        setProcedures(proceduresData);
      } else if (proceduresError) {
        if (!proceduresError.message.includes('fetch') || !isDev) {
          console.error('Error fetching procedures:', proceduresError.message);
        }
      }
    } catch (err) {
      // Network errors are caught here by supabase-js sometimes, or in the error object above
      if (err instanceof Error && !err.message.includes('fetch')) {
        console.error('Network error fetching data:', err);
      }
    }
  }

  // Redirect to login if not logged in
  useEffect(() => {
    if (!isLoggedIn && currentScreen !== 'signup' && currentScreen !== 'login') {
      setCurrentScreen('login');
    } else if (isLoggedIn && (currentScreen === 'login' || currentScreen === 'signup')) {
      setCurrentScreen('home');
    }
  }, [isLoggedIn, currentScreen]);

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const transition: any = {
    duration: 0.3,
    ease: [0.22, 1, 0.36, 1],
  };

  const testSupabaseConnection = async () => {
    setTestStatus('testing');
    setTestError(null);
    try {
      const { error } = await supabase.auth.getSession();
      if (error) throw error;
      setTestStatus('success');
      setConfigError(false);
    } catch (err: any) {
      console.error('Test connection failed:', err);
      setTestStatus('error');
      setTestError('Erro ao tentar reconectar. Verifique sua internet.');
    }
  };

  const renderScreen = () => {
    if (isInitializing) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
          <p className="text-on-surface-variant font-medium animate-pulse">Iniciando Biblioteca da Saúde...</p>
        </div>
      );
    }

    if (configError && !isDev) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-error/10 text-center">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-error" />
            </div>
            <h2 className="text-2xl font-headline font-bold text-on-surface mb-4">Ops! Algo deu errado</h2>
            
            <div className="p-4 bg-error/5 rounded-2xl mb-6 text-center border border-error/10">
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Não foi possível estabelecer uma conexão estável com o servidor no momento. Por favor, tente novamente em alguns instantes.
              </p>
            </div>
            
            <button 
              onClick={testSupabaseConnection}
              disabled={testStatus === 'testing'}
              className="w-full py-3 px-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {testStatus === 'testing' ? 'Tentando reconectar...' : 'Tentar Novamente'}
            </button>
          </div>
        </div>
      );
    }

    switch (currentScreen) {
      case 'home':
        return <HomeScreen diseases={diseases} onNavigate={setCurrentScreen} onSelectDisease={handleSelectDisease} profile={profile} recentHistory={recentHistory} />;
      case 'diseases':
        return <DiseasesScreen diseases={diseases} onNavigate={setCurrentScreen} onSelectDisease={handleSelectDisease} searchQuery={searchQuery} onSearch={setSearchQuery} />;
      case 'procedures':
        return (
          <ProceduresScreen 
            onNavigate={setCurrentScreen} 
            onSelectProcedure={async (p) => {
              await handleSelectProcedureWithAI(p);
              recordHistory(p.name, 'view', { id: p.id, category: 'procedure' });
            }}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            onGlobalSearch={handleGlobalSearch}
            isSearchingAI={isSearchingAI}
            isSelectingAI={isSelectingProcedureAI}
          />
        );
      case 'profile':
        return <ProfileScreen profile={profile} onLogout={async () => { await supabase.auth.signOut(); setIsLoggedIn(false); setCurrentScreen('login'); }} onRefreshProfile={fetchProfile} />;
      case 'disease-detail':
        return <DiseaseDetailScreen disease={selectedDisease} onBack={() => setCurrentScreen('diseases')} />;
      case 'procedure-detail':
        return (
          <ProcedureDetailScreen 
            procedure={selectedProcedure} 
            onBack={() => setCurrentScreen('procedures')} 
            onEnhanceAI={handleEnhanceProcedureAI}
            isEnhancing={isEnhancingProcedure}
          />
        );
      case 'ai-assistant':
        return (
          <AIAssistantScreen 
            onBack={() => setCurrentScreen('home')} 
            onNavigate={setCurrentScreen} 
            onShowDisease={(d) => { setSelectedDisease(d); setCurrentScreen('disease-detail'); }}
            onShowProcedure={(p) => { setSelectedProcedure(p); setCurrentScreen('procedure-detail'); }}
          />
        );
      case 'signup':
        return <SignupScreen onNavigate={setCurrentScreen} onLogin={() => setIsLoggedIn(true)} onRefreshProfile={fetchProfile} />;
      case 'login':
        return <LoginScreen onNavigate={setCurrentScreen} onLogin={() => setIsLoggedIn(true)} onRefreshProfile={fetchProfile} />;
      default:
        return <HomeScreen diseases={diseases} onNavigate={setCurrentScreen} onSelectDisease={handleSelectDisease} profile={profile} recentHistory={recentHistory} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col relative overflow-x-hidden">
      {/* Background Decorations - Lightened */}
      <div className="fixed top-0 right-0 -z-10 w-1/3 h-1/2 bg-gradient-to-bl from-primary-fixed/5 to-transparent blur-3xl opacity-20" />
      <div className="fixed bottom-0 left-0 -z-10 w-1/4 h-1/3 bg-gradient-to-tr from-secondary-container/5 to-transparent blur-3xl opacity-20" />

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-white/20 z-[60] backdrop-blur-[2px]"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-surface z-[70] shadow-2xl p-6 flex flex-col gap-8"
            >
              <div className="flex items-center justify-between">
                <span className="font-headline font-bold text-xl tracking-tighter text-primary">
                  Biblioteca da Saúde
                </span>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-full hover:bg-surface-container-low">
                  <ArrowLeft className="w-5 h-5 text-on-surface" />
                </button>
              </div>

              <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-primary-fixed overflow-hidden">
                  <img 
                    src={profile?.avatar_url || "https://picsum.photos/seed/doctor/200"} 
                    alt={profile?.full_name || "Usuário"} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <p className="font-bold text-on-surface">{profile?.full_name || "Usuário"}</p>
                  <p className="text-xs text-on-surface-variant">
                    {CATEGORIES.find(c => c.id === profile?.category)?.label || "Profissional de Saúde"}
                  </p>
                </div>
              </div>

              <nav className="flex-1 space-y-2">
                <SidebarItem icon={<Home className="w-5 h-5" />} label="Painel Principal" onClick={() => { setCurrentScreen('home'); setIsSidebarOpen(false); }} active={currentScreen === 'home'} />
                <SidebarItem icon={<Sparkles className="w-5 h-5" />} label="Assistente IA" onClick={() => { setCurrentScreen('ai-assistant'); setIsSidebarOpen(false); }} active={currentScreen === 'ai-assistant'} />
                <SidebarItem icon={<Activity className="w-5 h-5" />} label="Protocolos Clínicos" onClick={() => { setCurrentScreen('diseases'); setIsSidebarOpen(false); }} active={currentScreen === 'diseases'} />
                <SidebarItem icon={<Stethoscope className="w-5 h-5" />} label="Procedimentos" onClick={() => { setCurrentScreen('procedures'); setIsSidebarOpen(false); }} active={currentScreen === 'procedures'} />
                <SidebarItem icon={<ShieldCheck className="w-5 h-5" />} label="Segurança" onClick={() => setIsSidebarOpen(false)} />
              </nav>

              <div className="pt-6 border-t border-outline-variant/10">
                <button 
                  onClick={() => { setIsLoggedIn(false); setCurrentScreen('login'); setIsSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-error font-bold rounded-xl hover:bg-error-container/10 transition-colors"
                >
                  <LogIn className="w-5 h-5 rotate-180" />
                  Sair
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Top App Bar */}
      {currentScreen !== 'login' && currentScreen !== 'signup' && currentScreen !== 'ai-assistant' && (
        <header className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-outline-variant/10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              {/* Left: Sidebar or Back Button */}
              <div className="flex items-center">
                {currentScreen === 'disease-detail' ? (
                  <button onClick={() => setCurrentScreen('diseases')} className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
                    <ArrowLeft className="w-5 h-5 text-on-surface" />
                  </button>
                ) : (
                  <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
                    <Menu className="w-5 h-5 text-on-surface" />
                  </button>
                )}
              </div>

              {/* Center: Brand Name (Modern Typography) */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary/50 leading-none mb-0.5">Biblioteca da</span>
                <span className="font-headline font-black text-lg tracking-tighter text-primary leading-none">SAÚDE</span>
              </div>

              {/* Right: Notifications */}
              <div className="flex items-center">
                <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors relative">
                  <Bell className="w-5 h-5 text-on-surface-variant" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-surface" />
                </button>
              </div>
            </div>

            {/* Bottom Row: Search Input (Dynamic) */}
            {(currentScreen === 'home' || currentScreen === 'diseases') && (
              <div className="flex items-center gap-2">
                <div className="relative group flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
                    placeholder="Pesquisar protocolos, CID, exames..."
                    className="w-full h-11 pl-10 pr-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-surface outline-none transition-all text-sm text-on-surface placeholder:text-outline/60 shadow-inner-sm"
                  />
                </div>
                <button 
                  onClick={handleGlobalSearch}
                  disabled={isSearchingAI}
                  className="h-11 px-6 bg-primary text-on-primary rounded-2xl font-bold text-sm shadow-sm active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSearchingAI ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Pesquisar</span>
                </button>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1",
        currentScreen !== 'login' && currentScreen !== 'signup' ? 
          ((currentScreen === 'home' || currentScreen === 'diseases' || currentScreen === 'procedures') ? "pt-[140px] pb-28" : "pt-[80px] pb-28") 
          : ""
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={transition}
            className={cn("h-full", currentScreen === 'ai-assistant' && "fixed inset-0 z-[60]")}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      {currentScreen !== 'login' && currentScreen !== 'signup' && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-outline-variant/10 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 h-20 flex justify-between sm:justify-around items-center">
            <NavButton 
              icon={<Home className="w-6 h-6" />} 
              label="Início" 
              active={currentScreen === 'home'} 
              onClick={() => setCurrentScreen('home')} 
            />
            <NavButton 
              icon={<Activity className="w-6 h-6" />} 
              label="Doenças" 
              active={currentScreen === 'diseases' || currentScreen === 'disease-detail'} 
              onClick={() => setCurrentScreen('diseases')} 
            />
            
            {/* AI Brain Integrated in Navbar */}
            <FloatingBrain 
              onNavigate={setCurrentScreen} 
              onSearch={(q) => {
                setSearchQuery(q);
                setCurrentScreen('diseases');
              }}
              onShowDisease={(disease) => {
                setSelectedDisease(disease);
                setCurrentScreen('disease-detail');
              }}
              onShowProcedure={(procedure) => {
                setSelectedProcedure(procedure);
                setCurrentScreen('procedure-detail');
              }}
              currentScreen={currentScreen}
            />

            <NavButton 
              icon={<Stethoscope className="w-6 h-6" />} 
              label="Procedimentos" 
              active={currentScreen === 'procedures'} 
              onClick={() => setCurrentScreen('procedures')} 
            />
            <NavButton 
              icon={<User className="w-6 h-6" />} 
              label="Perfil" 
              active={currentScreen === 'profile'} 
              onClick={() => setCurrentScreen('profile')} 
            />
          </div>
        </nav>
      )}
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 px-2 sm:px-4 py-2 rounded-2xl transition-all duration-300",
        active ? "text-primary bg-primary-fixed/30" : "text-on-surface-variant hover:text-primary"
      )}
    >
      {icon}
      <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider truncate max-w-[64px] sm:max-w-none">{label}</span>
    </button>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-left",
        active ? "bg-primary-fixed text-on-primary-fixed shadow-sm" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
      )}
    >
      {icon}
      <span className="font-semibold text-sm">{label}</span>
    </button>
  );
}

// --- Screens ---

function HomeScreen({ diseases, onNavigate, onSelectDisease, profile, recentHistory }: { diseases: Disease[], onNavigate: (s: Screen) => void, onSelectDisease: (d: Disease) => void, profile: any, recentHistory: any[] }) {
  const getGreeting = () => {
    if (!profile) return 'Olá! Seja bem vindo.';
    const firstName = profile.full_name?.split(' ')[0] || '';
    const categoryObj = CATEGORIES.find(c => c.id === profile.category);
    const abbreviation = categoryObj?.abbreviation ? `${categoryObj.abbreviation} ` : '';
    return `Olá, ${abbreviation}${firstName}! Seja bem vindo.`;
  };

  // Map history items to displayable content
  const historyToDisplay = recentHistory.filter(h => h.type === 'view').map(h => {
    if (h.metadata?.category === 'disease') {
      return diseases.find(d => d.id === h.metadata.id);
    }
    return null;
  }).filter(Boolean) as Disease[];

  const displayItems = historyToDisplay.length > 0 ? historyToDisplay.slice(0, 3) : diseases.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-6 py-4 space-y-10">
      <div className="mb-2">
        <h2 className="font-headline text-2xl font-bold text-on-surface">{getGreeting()}</h2>
        <p className="text-on-surface-variant text-sm">O que você gostaria de consultar hoje?</p>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="col-span-2 bg-gradient-to-br from-primary-fixed to-secondary-fixed p-6 rounded-3xl ambient-shadow relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all">
          <div className="relative z-10">
            <Activity className="w-8 h-8 text-on-primary-fixed mb-4" />
            <h3 className="font-headline text-xl font-bold text-on-primary-fixed">Busca Rápida de Doenças</h3>
            <p className="text-on-primary-fixed/80 text-sm mt-1">Acesse mais de 1.200 protocolos clínicos</p>
          </div>
          <Search className="absolute -right-4 -bottom-4 w-32 h-32 text-on-primary-fixed/10" />
        </div>

        <div 
          onClick={() => onNavigate('ai-assistant')}
          className="col-span-2 bg-primary-fixed p-5 rounded-3xl flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all ambient-shadow"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/50 flex items-center justify-center shadow-sm">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-headline font-bold text-on-primary-fixed">Cérebro Central</h3>
            <p className="text-xs text-on-primary-fixed/70">Guia de medicamentos e ações do site</p>
          </div>
          <ChevronRight className="w-5 h-5 text-on-primary-fixed/50" />
        </div>

        <div 
          onClick={() => onNavigate('procedures')}
          className="col-span-2 md:col-span-1 bg-secondary-fixed p-5 rounded-3xl flex flex-col gap-3 cursor-pointer active:scale-[0.98] transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center shadow-sm">
            <Stethoscope className="w-6 h-6 text-on-secondary-fixed" />
          </div>
          <h3 className="font-headline font-bold text-on-secondary-fixed">Procedimentos de Enfermagem</h3>
        </div>

        <div className="col-span-2 md:col-span-1 bg-tertiary-fixed p-5 rounded-3xl flex flex-col gap-3 cursor-pointer active:scale-[0.98] transition-all">
          <div className="w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center shadow-sm">
            <Bell className="w-6 h-6 text-on-tertiary-fixed" />
          </div>
          <h3 className="font-headline font-bold text-on-tertiary-fixed">Últimas Atualizações</h3>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-xl font-bold text-on-surface">Visualizados Recentemente</h2>
          <button onClick={() => onNavigate('diseases')} className="text-primary font-bold text-sm">Ver tudo</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayItems.map((disease) => (
            <div 
              key={disease.id}
              onClick={() => onSelectDisease(disease)}
              className="bg-surface-container-lowest p-4 rounded-2xl flex items-center gap-4 relative ambient-shadow cursor-pointer hover:bg-surface-container-low transition-all"
            >
              <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-secondary rounded-full" />
              <div className="w-12 h-12 bg-surface-container-high rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-on-surface">{disease.name}</h4>
                <p className="text-xs text-on-surface-variant font-medium">Protocolo • Atualizado {disease.updatedAt}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-outline-variant" />
            </div>
          ))}
        </div>
      </section>

      <section className="p-8 rounded-3xl bg-surface-container-low text-center border border-outline-variant/10 max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-primary-fixed rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-headline font-bold text-on-surface mb-2">Prática Baseada em Evidências</h3>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          Todos os protocolos clínicos são revisados por nosso conselho médico para garantir os mais altos padrões de cuidado.
        </p>
      </section>
    </div>
  );
}

function DiseasesScreen({ diseases, onNavigate, onSelectDisease, searchQuery, onSearch }: { diseases: Disease[], onNavigate: (s: Screen) => void, onSelectDisease: (d: Disease) => void, searchQuery: string, onSearch: (q: string) => void }) {
  const [filter, setFilter] = useState('Todas');
  const categories = ['Todas', 'Crônicas', 'Infecciosas', 'Neurológicas'];

  const typeLabels: Record<string, string> = {
    'Chronic': 'Crônica',
    'Infectious': 'Infecciosa',
    'Neurological': 'Neurológica'
  };

  const filteredDiseases = diseases.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         d.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'Todas' || d.type === (filter === 'Crônicas' ? 'Chronic' : filter === 'Infecciosas' ? 'Infectious' : 'Neurological');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-4 space-y-8">
      <section className="-mx-6 px-6 overflow-x-auto no-scrollbar flex gap-3 justify-start md:justify-center">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "px-6 py-2.5 rounded-full text-sm font-semibold transition-all shrink-0",
              filter === cat 
                ? "bg-primary text-on-primary shadow-md" 
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            {cat}
          </button>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-outline">Condições Comuns</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDiseases.length > 0 ? (
            filteredDiseases.map((disease) => (
              <div 
                key={disease.id}
                onClick={() => onSelectDisease(disease)}
                className="bg-surface-container-lowest p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-surface-container-low transition-all ambient-shadow relative overflow-hidden transform-gpu"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-r-full" />
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded",
                      disease.type === 'Chronic' ? "bg-secondary-container/20 text-secondary" :
                      disease.type === 'Infectious' ? "bg-tertiary-fixed/30 text-tertiary" :
                      "bg-surface-container-high text-on-surface-variant"
                    )}>
                      {typeLabels[disease.type] || disease.type}
                    </span>
                    <h3 className="font-headline font-bold text-on-surface">{disease.name}</h3>
                  </div>
                  <p className="text-sm text-on-surface-variant line-clamp-1">{disease.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-outline-variant group-hover:text-primary transition-colors" />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-outline" />
              </div>
              <div>
                <p className="text-on-surface font-medium">Nenhuma doença encontrada localmente</p>
                <p className="text-sm text-on-surface-variant">Use o botão de pesquisar na barra superior para buscar na web.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ProceduresScreen({ 
  onNavigate, 
  onSelectProcedure,
  searchQuery,
  onSearch,
  onGlobalSearch,
  isSearchingAI,
  isSelectingAI
}: { 
  onNavigate: (s: Screen) => void, 
  onSelectProcedure: (p: Procedure) => void,
  searchQuery: string,
  onSearch: (q: string) => void,
  onGlobalSearch: () => void,
  isSearchingAI: boolean,
  isSelectingAI: string | null
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredProcedures = DETAILED_PROCEDURES.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-4 space-y-8">
      <section className="max-w-2xl mx-auto text-center md:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Procedimentos</h1>
        <p className="text-on-surface-variant text-sm leading-relaxed">Técnicas de enfermagem baseadas em evidências e protocolos clínicos.</p>
      </section>

      <section className="max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onGlobalSearch()}
              placeholder="Buscar procedimentos médicos..."
              className="w-full h-14 pl-12 pr-4 bg-surface-container-high border-none rounded-full focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-outline ambient-shadow"
            />
          </div>
          <button 
            onClick={onGlobalSearch}
            disabled={isSearchingAI}
            className="h-14 px-6 bg-primary text-on-primary rounded-full font-bold text-sm shadow-sm active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSearchingAI ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            <span className="hidden sm:inline">Pesquisar</span>
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-on-surface">Todos os Procedimentos</h2>
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Manual 2017</span>
        </div>
        
        <div className="flex flex-col gap-3">
          {filteredProcedures.length > 0 ? (
            filteredProcedures.map((proc) => (
              <div 
                key={proc.id}
                className="bg-surface-container-lowest rounded-2xl overflow-hidden ambient-shadow border-l-4 border-secondary transition-all"
              >
                <div 
                  onClick={() => setExpandedId(expandedId === proc.id ? null : proc.id)}
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-surface-container-low group transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-secondary-container/20 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary-container/40 transition-colors">
                    {proc.icon === 'ShieldCheck' ? <ShieldCheck className="w-6 h-6 text-secondary" /> : 
                     proc.icon === 'Syringe' ? <Syringe className="w-6 h-6 text-secondary" /> :
                     proc.icon === 'Activity' ? <Activity className="w-6 h-6 text-secondary" /> :
                     proc.icon === 'Thermometer' ? <Thermometer className="w-6 h-6 text-secondary" /> :
                     proc.icon === 'Microscope' ? <Microscope className="w-6 h-6 text-secondary" /> :
                     <Stethoscope className="w-6 h-6 text-secondary" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{proc.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] font-bold text-outline uppercase tracking-widest">{proc.category}</p>
                      <span className="w-1 h-1 bg-outline-variant rounded-full" />
                      <p className="text-[10px] text-on-surface-variant">{proc.steps} Passos • {proc.duration}</p>
                    </div>
                  </div>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-outline transition-transform duration-300",
                    expandedId === proc.id && "rotate-180 text-primary"
                  )} />
                </div>

                <AnimatePresence>
                  {expandedId === proc.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-6 pt-2 border-t border-outline-variant/10 space-y-6">
                        <div className="space-y-2">
                          <h5 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <Info className="w-3 h-3" /> Conceito
                          </h5>
                          <p className="text-sm text-on-surface-variant leading-relaxed">{proc.concept}</p>
                        </div>

                        <div className="space-y-3">
                          <h5 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <Layers className="w-3 h-3" /> Materiais Necessários
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {proc.materials.map((item, idx) => (
                              <span key={idx} className="px-3 py-1 bg-surface-container-high rounded-full text-[11px] font-medium text-on-surface-variant">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h5 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Passo a Passo
                          </h5>
                          <div className="space-y-3">
                            {proc.procedureSteps.map((step, idx) => (
                              <div key={idx} className="flex gap-3">
                                <span className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <p className="text-sm text-on-surface leading-snug">{step}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {proc.observations && proc.observations.length > 0 && (
                          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 shadow-sm">
                            <h5 className="text-xs font-bold uppercase tracking-widest text-amber-700 flex items-center gap-2 mb-2">
                              <AlertCircle className="w-3 h-3" /> Observações Críticas
                            </h5>
                            <ul className="space-y-2">
                              {proc.observations.map((obs, idx) => (
                                <li key={idx} className="text-xs text-amber-900 font-medium leading-relaxed flex gap-2">
                                  <span className="text-amber-500">•</span>
                                  {obs}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <button 
                          onClick={() => onSelectProcedure(proc)}
                          disabled={isSelectingAI !== null}
                          className="w-full py-3 bg-surface-container-high text-primary rounded-xl text-xs font-bold hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isSelectingAI === proc.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              Buscando informações na web...
                            </>
                          ) : (
                            <>
                              Ver Guia Completo <ArrowRight className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-outline" />
              </div>
              <div>
                <p className="text-on-surface font-medium">Nenhum procedimento encontrado localmente</p>
                <p className="text-sm text-on-surface-variant">Use o botão "Pesquisar" para buscar no manual oficial.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DiseaseDetailScreen({ disease, onBack }: { disease: Disease | null, onBack: () => void }) {
  if (!disease) return null;

  const typeLabels: Record<string, string> = {
    'Chronic': 'Crônica',
    'Infectious': 'Infecciosa',
    'Neurological': 'Neurológica'
  };

  const sections = [
    { label: 'Descrição', content: disease.description, icon: <Info className="w-5 h-5" />, color: 'text-blue-500', bg: 'bg-blue-50' },
    { 
      label: 'Contexto Local (Moçambique)', 
      content: disease.localHistory || null, 
      icon: <MapPin className="w-5 h-5" />, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50',
      show: !!disease.localHistory 
    },
    { 
      label: 'Tipos / Subtipos', 
      content: disease.subtypes || null, 
      icon: <Layers className="w-5 h-5" />, 
      color: 'text-cyan-500', 
      bg: 'bg-cyan-50',
      show: !!disease.subtypes 
    },
    { label: 'Sintomas', content: disease.symptoms, icon: <Activity className="w-5 h-5" />, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Causas', content: disease.causes, icon: <Microscope className="w-5 h-5" />, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Diagnóstico', content: disease.diagnosis, icon: <Stethoscope className="w-5 h-5" />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Tratamento', content: disease.treatment, icon: <Activity className="w-5 h-5" />, color: 'text-rose-500', bg: 'bg-rose-50' },
    { 
      label: 'Medicamentos', 
      content: disease.medications || null, 
      icon: <Pill className="w-5 h-5" />, 
      color: 'text-pink-500', 
      bg: 'bg-pink-50',
      isMedication: true,
      show: true 
    },
    { label: 'Complicações', content: disease.complications, icon: <AlertTriangle className="w-5 h-5" />, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Cuidados de enfermagem', content: disease.nursingCare, icon: <HeartPulse className="w-5 h-5" />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Prevenção', content: disease.prevention, icon: <ShieldCheck className="w-5 h-5" />, color: 'text-teal-500', bg: 'bg-teal-50' },
  ].filter(s => s.show !== false);

  return (
    <div className="max-w-7xl mx-auto px-6 py-4 space-y-8 pb-32">
      {/* Header Image with Floating Badge */}
      <section className="relative max-w-4xl mx-auto w-full isolate">
        <div className="relative overflow-hidden rounded-[2.5rem] aspect-[16/10] md:aspect-[21/9] ambient-shadow group will-change-transform transform-gpu">
          <img 
            src={`https://picsum.photos/seed/${disease.name}/1200/600`} 
            alt={disease.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 will-change-transform"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
          
          <div className="absolute top-6 left-6">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-2 bg-black/20 backdrop-blur-sm border border-white/20 rounded-2xl"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">
                {typeLabels[disease.type] || disease.type}
              </span>
            </motion.div>
          </div>

          <div className="absolute bottom-8 left-8 right-8">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-headline text-4xl md:text-6xl font-black text-white tracking-tighter leading-none mb-2"
            >
              {disease.name}
            </motion.h2>
            <div className="flex items-center gap-2 text-white/60 text-xs font-bold uppercase tracking-widest">
              <span className="w-8 h-[1px] bg-white/30" />
              Protocolo Clínico Verificado
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section, idx) => (
          <motion.section 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={cn(
              "group bg-surface-container-lowest p-6 rounded-[2rem] ambient-shadow border border-outline-variant/5 hover:border-primary/20 transition-all duration-300 transform-gpu",
              section.isMedication ? "md:col-span-2 lg:col-span-3" : ""
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300",
                section.bg,
                section.color
              )}>
                {section.icon}
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-outline group-hover:text-primary transition-colors">
                  {section.label}
                </h3>
                {section.isMedication ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {(section.content as Medication[] || []).length > 0 ? (
                      (section.content as Medication[]).map((med, i) => (
                        <div key={i} className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 space-y-3 hover:bg-surface-container transition-colors duration-200">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 rounded-full bg-pink-500" />
                            <h4 className="font-bold text-on-surface text-base tracking-tight">{med.name}</h4>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="flex gap-3">
                              <div className="w-px bg-outline-variant/30" />
                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-outline/80">Posologia</span>
                                <p className="text-sm text-on-surface-variant font-medium leading-snug">{med.posology}</p>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <div className="w-px bg-rose-500/20" />
                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-500/70">Contraindicação</span>
                                <p className="text-sm text-on-surface-variant font-medium italic leading-snug">{med.contraindications}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full p-8 bg-surface-container-low rounded-[2rem] border border-dashed border-outline-variant/30 text-center space-y-2">
                        <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center mx-auto">
                          <Pill className="w-6 h-6 text-outline" />
                        </div>
                        <p className="text-on-surface font-bold text-sm">Nenhum medicamento encontrado no FNM</p>
                        <p className="text-xs text-on-surface-variant max-w-[240px] mx-auto">
                          Para esta condição, não foram encontrados medicamentos correspondentes no Formulário Nacional de Medicamentos de Moçambique.
                        </p>
                      </div>
                    )}
                  </div>
                ) : Array.isArray(section.content) ? (
                  <ul className="list-disc pl-4 space-y-1.5">
                    {section.content.map((item, i) => (
                      <li key={i} className="text-on-surface-variant leading-relaxed text-sm font-medium">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : typeof section.content === 'object' && section.content !== null ? (
                  <div className="space-y-4">
                    {Object.entries(section.content as Record<string, string[]>).map(([subtype, items], i) => (
                      <div key={i} className="space-y-2">
                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded inline-block">
                          {subtype}
                        </h4>
                        <ul className="list-disc pl-4 space-y-1.5">
                          {items.map((item, j) => (
                            <li key={j} className="text-on-surface-variant leading-relaxed text-sm font-medium">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-on-surface-variant leading-relaxed text-sm font-medium">
                    {section.content as string}
                  </p>
                )}
              </div>
            </div>
          </motion.section>
        ))}
      </div>

      {/* Action Card */}
      <motion.section 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-primary p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden max-w-2xl mx-auto"
      >
        <div className="absolute -top-10 -right-10 opacity-10 rotate-12">
          <ShieldCheck className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-headline text-2xl font-black mb-3 tracking-tight">Protocolo de Segurança</h3>
          <p className="text-white/70 text-sm mb-8 max-w-[280px] mx-auto leading-relaxed">
            Este guia segue rigorosamente as diretrizes da OMS e do Ministério da Saúde.
          </p>
          <button className="w-full py-5 bg-white text-primary font-black rounded-2xl text-xs uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl hover:shadow-white/10">
            Baixar PDF Completo
          </button>
        </div>
      </motion.section>
    </div>
  );
}

function ProcedureDetailScreen({ procedure, onBack, onEnhanceAI, isEnhancing }: { 
  procedure: Procedure | null, 
  onBack: () => void,
  onEnhanceAI: (p: Procedure) => void,
  isEnhancing: boolean
}) {
  if (!procedure) return null;

  const sections = [
    { title: 'Conceito', content: procedure.concept, icon: Info, show: !!procedure.concept, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Materiais Necessários', content: procedure.materials, icon: ShieldCheck, show: !!procedure.materials?.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Etapas do Procedimento', content: procedure.procedureSteps, icon: Activity, show: !!procedure.procedureSteps?.length, isSteps: true, color: 'text-primary', bg: 'bg-primary/5' },
    { title: 'Observações Importantes', content: procedure.observations, icon: AlertCircle, show: !!procedure.observations?.length, isObservations: true, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  ];

  return (
    <div className="flex-1 p-6 space-y-10 pb-32 max-w-4xl mx-auto w-full">
      {/* Header */}
      <header className="flex items-center gap-6">
        <button 
          onClick={onBack}
          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-on-surface active:scale-90 transition-all hover:bg-surface-container-low"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest rounded-full">
              {procedure.category}
            </span>
            <span className="text-[10px] font-bold text-outline uppercase tracking-widest flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Manual 2017
            </span>
          </div>
          <h1 className="font-headline text-4xl font-black text-on-surface tracking-tight leading-none">{procedure.name}</h1>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-outline-variant/10 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Complexidade</p>
            <p className="text-sm font-black text-on-surface">{procedure.steps} Passos</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-outline-variant/10 flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Tempo Médio</p>
            <p className="text-sm font-black text-on-surface">{procedure.duration}</p>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-8">
        {sections.filter(s => s.show).map((section, index) => (
          <motion.section 
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "bg-white rounded-[3rem] p-8 shadow-sm border border-outline-variant/5 relative overflow-hidden",
              section.isObservations && "bg-amber-50/50 border-amber-200"
            )}
          >
            <div className="flex gap-6">
              <div className={cn(
                "w-14 h-14 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-inner",
                section.bg,
                section.color
              )}>
                <section.icon className="w-7 h-7" />
              </div>
              <div className="flex-1 pt-2">
                <h2 className={cn(
                  "font-headline text-xl font-black mb-6 tracking-tight flex items-center gap-2",
                  section.color || "text-on-surface"
                )}>
                  {section.title}
                </h2>
                
                {section.isSteps && Array.isArray(section.content) ? (
                  <div className="space-y-6 relative">
                    <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-primary/10" />
                    {section.content.map((step, i) => (
                      <div key={i} className="flex gap-6 relative">
                        <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 z-10">
                          {i + 1}
                        </div>
                        <p className="text-on-surface-variant leading-relaxed text-sm font-medium pt-1">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : section.isObservations && Array.isArray(section.content) ? (
                  <ul className="space-y-3">
                    {section.content.map((obs, i) => (
                      <li key={i} className="flex gap-3 p-4 bg-white rounded-2xl border border-amber-100 shadow-sm">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        <p className="text-amber-900 text-sm font-semibold leading-relaxed">
                          {obs}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : Array.isArray(section.content) ? (
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.content.map((item, i) => (
                      <li key={i} className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                        <span className="text-on-surface-variant text-sm font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-on-surface-variant leading-relaxed text-sm font-medium">
                    {section.content as string}
                  </p>
                )}
              </div>
            </div>
          </motion.section>
        ))}
      </div>

      {/* Footer Disclaimer */}
      <div className="p-8 bg-surface-container-low rounded-[3rem] border border-outline-variant/20 text-center space-y-3">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <p className="text-on-surface font-bold text-sm">Fonte: Manual de Procedimentos (2017) + Pesquisa IA em Tempo Real</p>
        <p className="text-xs text-on-surface-variant max-w-[320px] mx-auto leading-relaxed">
          Este guia foi enriquecido com informações da internet via Inteligência Artificial. Siga sempre os protocolos específicos da sua unidade de saúde.
        </p>
      </div>
    </div>
  );
}

const COUNTRIES = [
  { code: '+55', name: 'Brasil', flag: '🇧🇷' },
  { code: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: '+244', name: 'Angola', flag: '🇦🇴' },
  { code: '+258', name: 'Moçambique', flag: '🇲🇿' },
  { code: '+238', name: 'Cabo Verde', flag: '🇨🇻' },
  { code: '+239', name: 'São Tomé e Príncipe', flag: '🇸🇹' },
  { code: '+245', name: 'Guiné-Bissau', flag: '🇬🇼' },
  { code: '+670', name: 'Timor-Leste', flag: '🇹🇱' },
  { code: '+240', name: 'Guiné Equatorial', flag: '🇬🇶' },
];

const CATEGORIES = [
  { id: 'doctor', label: 'Médico(a)', abbreviation: 'Dr(a).' },
  { id: 'nurse', label: 'Enfermeiro(a)', abbreviation: 'Enf.' },
  { id: 'technician', label: 'Técnico(a) de Enfermagem', abbreviation: 'Téc.' },
  { id: 'general-medicine-tech', label: 'Técnico(a) de Medicina Geral', abbreviation: 'TMG.' },
  { id: 'lab-tech', label: 'Técnico(a) de Laboratório', abbreviation: 'Téc. Lab.' },
  { id: 'physiotherapist', label: 'Fisioterapeuta', abbreviation: 'Fis.' },
  { id: 'pharmacist', label: 'Farmacêutico(a)', abbreviation: 'Far.' },
  { id: 'student', label: 'Estudante', abbreviation: 'Est.' },
  { id: 'non-professional', label: 'Não sou profissional de saúde', abbreviation: '' },
  { id: 'other', label: 'Outro (especificar)', abbreviation: '' },
];

const MONTHS = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

const YEARS = Array.from({ length: 121 }, (_, i) => (new Date().getFullYear() - i).toString());

function SignupScreen({ onNavigate, onLogin, onRefreshProfile }: { onNavigate: (s: Screen) => void, onLogin: () => void, onRefreshProfile: () => Promise<void> }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Masculino');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');
  const [otherCategory, setOtherCategory] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const categoryRef = useRef<HTMLDivElement>(null);
  const countryRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Signup attempt started for:', email);
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      console.log('Calling supabase.auth.signUp...');
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });
      console.log('supabase.auth.signUp response:', { data, error: signupError });

      if (signupError) {
        setError('Erro ao tentar criar conta. Por favor, verifique sua conexão.');
        setLoading(false);
        return;
      }

      if (data.user) {
        // Update profile with extra info
        const birthDate = birthYear && birthMonth && birthDay ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}` : null;
        
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: fullName,
            gender,
            birth_date: birthDate,
            category,
            other_category: otherCategory,
            phone: `${selectedCountry.code} ${phone}`,
            address,
          });

        if (profileError) {
          console.error('Error updating profile:', profileError.message);
          // Don't block the user if profile update fails, but log it
        }
        
        await onRefreshProfile();
        onLogin();
        onNavigate('home');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError('Ocorreu um erro ao criar sua conta. Tente novamente.');
      setLoading(false);
    }
  };

  useEffect(() => {
    const day = parseInt(birthDay);
    const month = parseInt(birthMonth);
    const year = parseInt(birthYear);

    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const birth = new Date(year, month - 1, day);
      const today = new Date();
      
      // Basic check for valid date (e.g. not Feb 31st)
      if (birth.getFullYear() === year && birth.getMonth() === month - 1 && birth.getDate() === day) {
        let calculatedAge = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          calculatedAge--;
        }
        setAge(calculatedAge >= 0 ? calculatedAge : null);
      } else {
        setAge(null);
      }
    } else {
      setAge(null);
    }
  }, [birthDay, birthMonth, birthYear]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
      if (monthRef.current && !monthRef.current.contains(event.target as Node)) {
        setIsMonthDropdownOpen(false);
      }
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setIsYearDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-12 bg-surface">
      <div className="grid lg:grid-cols-2 gap-12 max-w-6xl w-full items-center">
        <div className="hidden lg:flex flex-col gap-8 pr-12">
          <div className="space-y-4">
            <h1 className="font-headline text-5xl font-extrabold tracking-tight text-primary leading-tight">
              Capacitando a Saúde <br />Através da Precisão.
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-md">
              Junte-se ao nosso santuário digital projetado para profissionais que valorizam a clareza clínica e o cuidado centrado no paciente.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-surface-container-low rounded-3xl space-y-2 border-l-4 border-secondary">
              <ShieldCheck className="w-6 h-6 text-secondary" />
              <h3 className="font-headline font-bold text-on-surface">Registros Seguros</h3>
              <p className="text-sm text-on-surface-variant">Criptografia de dados em conformidade com HIPAA em cada ponto de contato.</p>
            </div>
            <div className="p-6 bg-surface-container-low rounded-3xl space-y-2">
              <Activity className="w-6 h-6 text-secondary" />
              <h3 className="font-headline font-bold text-on-surface">Sinais Vitais em Tempo Real</h3>
              <p className="text-sm text-on-surface-variant">Sincronização instantânea em todos os ambientes clínicos.</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="bg-surface-container-lowest p-6 lg:p-8 rounded-[2rem] ambient-shadow relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary" />
            <div className="mb-8">
              <h2 className="font-headline text-xl font-bold text-on-surface mb-1">Criar Conta</h2>
              <p className="text-on-surface-variant text-xs font-medium">Por favor, insira seus dados para começar.</p>
            </div>
            <form className="space-y-5" onSubmit={handleSignup}>
              {error && (
                <div className="p-4 bg-error-container/10 border border-error/20 rounded-2xl text-error text-sm font-medium flex flex-col gap-2">
                  <p>{error}</p>
                  {error.includes('Supabase') && (
                    <button 
                      type="button"
                      onClick={() => {
                        // We can't force the warning screen if variables exist, 
                        // but we can at least tell the user to check them.
                        alert('Por favor, verifique se a URL e a Chave Anon estão corretas no menu Settings > Environment Variables.');
                      }}
                      className="text-xs underline hover:text-error/80 transition-all font-bold text-left"
                    >
                      Como configurar o Supabase?
                    </button>
                  )}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                  <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="João Silva"
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-high border-none rounded-2xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all placeholder:text-outline"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">Gênero</label>
                <div className="flex gap-4">
                  <label className="flex-1 flex items-center gap-2 p-3 bg-surface-container-high rounded-2xl cursor-pointer hover:bg-surface-container-highest transition-all">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="Masculino" 
                      checked={gender === 'Masculino'}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-on-surface">Masculino</span>
                  </label>
                  <label className="flex-1 flex items-center gap-2 p-3 bg-surface-container-high rounded-2xl cursor-pointer hover:bg-surface-container-highest transition-all">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="Feminino" 
                      checked={gender === 'Feminino'}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-on-surface">Feminino</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">Data de Nascimento</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="relative">
                      <input 
                        type="text" 
                        inputMode="numeric"
                        placeholder="Dia"
                        maxLength={2}
                        value={birthDay}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                          setBirthDay(val);
                        }}
                        className="w-full px-4 py-3 bg-surface-container-high border-none rounded-2xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all text-on-surface text-sm placeholder:text-outline text-center"
                      />
                    </div>
                    <div className="relative" ref={monthRef}>
                      <button
                        type="button"
                        onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                        className="w-full px-3 py-3 bg-surface-container-high border-none rounded-2xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all text-on-surface text-sm flex items-center justify-between"
                      >
                        <span className={!birthMonth ? "text-outline flex-1 text-center" : "flex-1 text-center"}>
                          {birthMonth ? MONTHS.find(m => m.value === birthMonth)?.label : "Mês"}
                        </span>
                        <ChevronDown className={cn("w-4 h-4 text-on-surface-variant transition-transform shrink-0", isMonthDropdownOpen && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {isMonthDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute z-50 left-0 right-0 mt-2 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto"
                          >
                            {MONTHS.map((m) => (
                              <button
                                key={m.value}
                                type="button"
                                onClick={() => {
                                  setBirthMonth(m.value);
                                  setIsMonthDropdownOpen(false);
                                }}
                                className={cn(
                                  "w-full px-4 py-2 text-left text-sm transition-colors hover:bg-surface-container-high",
                                  birthMonth === m.value ? "bg-primary/10 text-primary font-semibold" : "text-on-surface"
                                )}
                              >
                                {m.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="relative" ref={yearRef}>
                      <button
                        type="button"
                        onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                        className="w-full px-3 py-3 bg-surface-container-high border-none rounded-2xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all text-on-surface text-sm flex items-center justify-between"
                      >
                        <span className={!birthYear ? "text-outline flex-1 text-center" : "flex-1 text-center"}>
                          {birthYear || "Ano"}
                        </span>
                        <ChevronDown className={cn("w-4 h-4 text-on-surface-variant transition-transform shrink-0", isYearDropdownOpen && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {isYearDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute z-50 left-0 right-0 mt-2 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto"
                          >
                            {YEARS.map((y) => (
                              <button
                                key={y}
                                type="button"
                                onClick={() => {
                                  setBirthYear(y);
                                  setIsYearDropdownOpen(false);
                                }}
                                className={cn(
                                  "w-full px-4 py-2 text-left text-sm transition-colors hover:bg-surface-container-high",
                                  birthYear === y ? "bg-primary/10 text-primary font-semibold" : "text-on-surface"
                                )}
                              >
                                {y}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">Idade</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={age !== null ? `${age} anos` : '--'}
                      readOnly
                      className="w-full px-4 py-3 bg-surface-container-low border-none rounded-2xl text-on-surface text-sm font-medium cursor-default"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5" ref={categoryRef}>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">Categoria Profissional</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="w-full pl-12 pr-10 py-3 bg-surface-container-high border-none rounded-2xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all text-left text-on-surface flex items-center justify-between"
                  >
                    <span className={!category ? "text-outline" : ""}>
                      {category ? CATEGORIES.find(c => c.id === category)?.label : "Selecione sua categoria"}
                    </span>
                    <ChevronDown className={cn("w-5 h-5 text-on-surface-variant transition-transform", isCategoryDropdownOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isCategoryDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute z-50 left-0 right-0 mt-2 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto"
                      >
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setCategory(cat.id);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full px-4 py-3 text-left text-sm transition-colors hover:bg-surface-container-high",
                              category === cat.id ? "bg-primary/10 text-primary font-semibold" : "text-on-surface"
                            )}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {category === 'other' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-1.5"
                >
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">Especifique sua Profissão</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                    <input 
                      type="text" 
                      value={otherCategory}
                      onChange={(e) => setOtherCategory(e.target.value)}
                      placeholder="Ex: Nutricionista"
                      className="w-full pl-12 pr-4 py-3 bg-surface-container-high border-none rounded-2xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all placeholder:text-outline"
                    />
                  </div>
                </motion.div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="você@gmail.com"
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-high border-none rounded-2xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all placeholder:text-outline"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">Telefone</label>
                <div className="flex gap-2">
                  <div className="relative w-32 shrink-0" ref={countryRef}>
                    <button
                      type="button"
                      onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                      className="w-full pl-4 pr-10 py-3 bg-surface-container-high border-none rounded-2xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all text-left text-on-surface flex items-center justify-between text-sm font-medium"
                    >
                      <span>{selectedCountry.flag} {selectedCountry.code}</span>
                      <ChevronDown className={cn("w-4 h-4 text-on-surface-variant transition-transform", isCountryDropdownOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                      {isCountryDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute z-50 left-0 w-64 mt-2 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto"
                        >
                          {COUNTRIES.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(c);
                                setIsCountryDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full px-4 py-3 text-left text-sm transition-colors hover:bg-surface-container-high flex items-center gap-3",
                                selectedCountry.code === c.code ? "bg-primary/10 text-primary font-semibold" : "text-on-surface"
                              )}
                            >
                              <span className="text-lg">{c.flag}</span>
                              <span className="flex-1">{c.name}</span>
                              <span className="text-on-surface-variant text-xs">{c.code}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98765-4321"
                      className="w-full pl-12 pr-4 py-3 bg-surface-container-high border-none rounded-2xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all placeholder:text-outline"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">Endereço</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua das Flores, 123 - São Paulo, SP"
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-high border-none rounded-2xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all placeholder:text-outline"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-surface-container-high border-none rounded-2xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all placeholder:text-outline"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">Confirmar Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-surface-container-high border-none rounded-2xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all placeholder:text-outline"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Criando Conta...' : 'Criar Conta'}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
            </form>
            <div className="mt-8 pt-6 border-t border-surface-container-high flex flex-col items-center gap-4">
              <p className="text-sm text-on-surface-variant">Já tem uma conta?</p>
              <button 
                onClick={() => onNavigate('login')}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-secondary-fixed text-on-secondary-fixed font-semibold rounded-2xl hover:bg-secondary-fixed-dim transition-colors text-sm"
              >
                <LogIn className="w-4 h-4" />
                Entrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({ profile, onLogout, onRefreshProfile }: { profile: any, onLogout: () => void, onRefreshProfile: () => Promise<void> }) {
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [editedData, setEditedData] = useState({
    full_name: '',
    gender: '',
    phone: '',
    address: '',
    birth_date: '',
    category: '',
    other_category: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile) {
      setEditedData({
        full_name: profile.full_name || '',
        gender: profile.gender || 'Masculino',
        phone: profile.phone || '',
        address: profile.address || '',
        birth_date: profile.birth_date || '',
        category: profile.category || '',
        other_category: profile.other_category || ''
      });
    }
  }, [profile, isEditing]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: base64String })
          .eq('id', profile.id);

        if (error) throw error;
        await onRefreshProfile();
        setMessage({ type: 'success', text: 'Foto de perfil atualizada!' });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar a foto. Tente novamente.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.id) {
      setMessage({ type: 'error', text: 'Sessão inválida. Por favor, faça login novamente.' });
      return;
    }
    
    setLoading(true);
    try {
      // Prepare data, ensuring we don't send empty strings for dates
      // and providing fallback for required fields if any
      const updateData = {
        id: profile.id,
        full_name: editedData.full_name?.trim() || null,
        gender: editedData.gender || null,
        phone: editedData.phone?.trim() || null,
        address: editedData.address?.trim() || null,
        birth_date: editedData.birth_date || null,
        category: editedData.category || null,
        other_category: editedData.other_category?.trim() || null,
      };

      console.log('Attempting to update profile data:', updateData);

      const { error, data, status } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          status
        });
        throw error;
      }
      
      console.log('Profile saved successfully:', data);
      
      await onRefreshProfile();
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (error: any) {
      console.error('Full error object:', error);
      
      let errorText = 'Erro ao atualizar o perfil.';
      if (error.code === '42501') {
        errorText = 'Erro de permissão: Você não tem autorização para atualizar este perfil.';
      } else if (error.message) {
        errorText = `Erro: ${error.message}`;
      }
      
      setMessage({ type: 'error', text: `${errorText} Tente novamente.` });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Não informada';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-4 space-y-8 pb-32">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm",
              message.type === 'success' ? "bg-primary text-on-primary" : "bg-error text-on-error"
            )}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="text-center relative">
        <div className="absolute top-0 right-0">
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="p-3 bg-surface-container-high text-primary rounded-2xl hover:bg-primary hover:text-on-primary transition-all shadow-sm"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditing(false)}
                className="p-3 bg-surface-container-high text-on-surface-variant rounded-2xl hover:bg-surface-container-highest transition-all shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="p-3 bg-primary text-on-primary rounded-2xl hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>

        <div className="relative w-32 h-32 mx-auto mb-6 group">
          <div className="w-full h-full rounded-full bg-primary-fixed overflow-hidden border-4 border-white shadow-xl relative">
            <img 
              src={profile?.avatar_url || `https://picsum.photos/seed/${profile?.id || 'doc'}/400`} 
              alt={profile?.full_name || "Perfil"} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <button 
            onClick={handleAvatarClick}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 active:scale-95 transition-all z-10"
          >
            <Camera className="w-5 h-5" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        
        {isEditing ? (
          <div className="max-w-xs mx-auto space-y-4">
            <input 
              type="text"
              value={editedData.full_name}
              onChange={(e) => setEditedData({ ...editedData, full_name: e.target.value })}
              placeholder="Nome Completo"
              className="w-full px-4 py-2 bg-surface-container-high border-none rounded-xl focus:ring-2 focus:ring-primary text-center font-headline text-xl font-bold text-on-surface"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditedData({ ...editedData, gender: 'Masculino' })}
                className={cn(
                  "flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all",
                  editedData.gender === 'Masculino' ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"
                )}
              >
                Masculino
              </button>
              <button
                type="button"
                onClick={() => setEditedData({ ...editedData, gender: 'Feminino' })}
                className={cn(
                  "flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all",
                  editedData.gender === 'Feminino' ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"
                )}
              >
                Feminino
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="font-headline text-3xl font-black text-on-surface tracking-tight">{profile?.full_name || 'Carregando...'}</h2>
            <p className="text-primary font-bold uppercase tracking-[0.2em] text-xs mt-2">
              {CATEGORIES.find(c => c.id === profile?.category)?.label || 'Profissional'} 
              {profile?.other_category ? ` (${profile.other_category})` : ''}
            </p>
          </>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="font-headline text-lg font-bold text-on-surface px-2">Informações da Conta</h3>
        <div className="bg-surface-container-lowest rounded-[2rem] p-6 ambient-shadow border border-outline-variant/10 space-y-6">
          <ProfileField icon={<Mail className="w-5 h-5" />} label="E-mail" value={profile?.email || 'Não informado'} />
          
          {isEditing ? (
            <>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">Telefone</p>
                  <input 
                    type="text"
                    value={editedData.phone}
                    onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-surface-container-high border-none rounded-xl focus:ring-2 focus:ring-primary text-sm text-on-surface"
                  />
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">Endereço</p>
                  <input 
                    type="text"
                    value={editedData.address}
                    onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
                    className="w-full px-4 py-2 bg-surface-container-high border-none rounded-xl focus:ring-2 focus:ring-primary text-sm text-on-surface"
                  />
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">Data de Nascimento</p>
                  <input 
                    type="date"
                    value={editedData.birth_date}
                    onChange={(e) => setEditedData({ ...editedData, birth_date: e.target.value })}
                    className="w-full px-4 py-2 bg-surface-container-high border-none rounded-xl focus:ring-2 focus:ring-primary text-sm text-on-surface"
                  />
                </div>
              </div>

              <div className="flex items-start gap-4" ref={categoryRef}>
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">Categoria</p>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="w-full px-4 py-2 bg-surface-container-high border-none rounded-xl focus:ring-2 focus:ring-primary text-left text-sm text-on-surface flex items-center justify-between"
                    >
                      <span>
                        {editedData.category ? CATEGORIES.find(c => c.id === editedData.category)?.label : "Selecione sua categoria"}
                      </span>
                      <ChevronDown className={cn("w-4 h-4 transition-transform", isCategoryDropdownOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                      {isCategoryDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute z-50 left-0 right-0 mt-2 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto"
                        >
                          {CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setEditedData({ ...editedData, category: cat.id });
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full px-4 py-3 text-left text-sm transition-colors hover:bg-surface-container-high",
                                editedData.category === cat.id ? "bg-primary/10 text-primary font-semibold" : "text-on-surface"
                              )}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {editedData.category === 'other' && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">Especifique sua Profissão</p>
                    <input 
                      type="text"
                      value={editedData.other_category}
                      onChange={(e) => setEditedData({ ...editedData, other_category: e.target.value })}
                      placeholder="Ex: Nutricionista"
                      className="w-full px-4 py-2 bg-surface-container-high border-none rounded-xl focus:ring-2 focus:ring-primary text-sm text-on-surface"
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <ProfileField icon={<User className="w-5 h-5" />} label="Gênero" value={profile?.gender || 'Não informado'} />
              <ProfileField icon={<Phone className="w-5 h-5" />} label="Telefone" value={profile?.phone || 'Não informado'} />
              <ProfileField icon={<MapPin className="w-5 h-5" />} label="Endereço" value={profile?.address || 'Não informado'} />
              <ProfileField icon={<Calendar className="w-5 h-5" />} label="Data de Nascimento" value={formatDate(profile?.birth_date)} />
              <ProfileField 
                icon={<Briefcase className="w-5 h-5" />} 
                label="Categoria" 
                value={
                  profile?.category === 'other' 
                    ? `Outro (${profile?.other_category || 'Não especificado'})`
                    : (CATEGORIES.find(c => c.id === profile?.category)?.label || 'Não informada')
                } 
              />
            </>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-container-low p-6 rounded-3xl flex items-center gap-4 cursor-pointer hover:bg-surface-container-high transition-all ambient-shadow border border-outline-variant/5">
          <div className="w-12 h-12 rounded-2xl bg-secondary-fixed/30 flex items-center justify-center">
            <Bell className="w-6 h-6 text-secondary" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-on-surface">Notificações</h4>
            <p className="text-xs text-on-surface-variant">Alertas de protocolos e atualizações</p>
          </div>
          <ChevronRight className="w-5 h-5 text-outline-variant" />
        </div>
        <div className="bg-surface-container-low p-6 rounded-3xl flex items-center gap-4 cursor-pointer hover:bg-surface-container-high transition-all ambient-shadow border border-outline-variant/5">
          <div className="w-12 h-12 rounded-2xl bg-tertiary-fixed/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-tertiary" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-on-surface">Segurança</h4>
            <p className="text-xs text-on-surface-variant">Senha e autenticação de dois fatores</p>
          </div>
          <ChevronRight className="w-5 h-5 text-outline-variant" />
        </div>
      </section>

      <section className="pt-8 max-w-md mx-auto">
        <button 
          onClick={onLogout}
          className="w-full py-5 bg-error-container/20 text-error font-headline font-black rounded-2xl shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-[0.2em]"
        >
          <LogIn className="w-5 h-5 rotate-180" />
          Sair da Conta
        </button>
      </section>
    </div>
  );
}
function ProfileField({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { 
          className: cn((icon.props as any).className, "text-primary") 
        }) : icon}
      </div>
      <div className="flex-1 border-b border-outline-variant/10 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">{label}</p>
        <p className="text-on-surface font-medium">{value}</p>
      </div>
    </div>
  );
}

function LoginScreen({ onNavigate, onLogin, onRefreshProfile }: { onNavigate: (s: Screen) => void, onLogin: () => void, onRefreshProfile: () => Promise<void> }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt started for:', email);
    setLoading(true);
    setError(null);

    try {
      console.log('Calling supabase.auth.signInWithPassword...');
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('supabase.auth.signInWithPassword response:', { error });

      if (error) {
        setError('Erro ao tentar entrar na conta. Por favor, verifique suas credenciais e conexão.');
        setLoading(false);
      } else {
        await onRefreshProfile();
        onLogin();
        onNavigate('home');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Erro ao fazer login. Tente novamente em instantes.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-12 bg-surface">
      <div className="grid lg:grid-cols-2 gap-12 max-w-6xl w-full items-center">
        <div className="hidden lg:flex flex-col gap-8 pr-12">
          <div className="space-y-4">
            <h1 className="font-headline text-5xl font-extrabold tracking-tight text-primary leading-tight">
              A cura começa <br />com a precisão.
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-md">
              Acesse seu painel clínico com a segurança de um santuário. Gestão de saúde contínua projetada para clareza.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="p-6 bg-surface-container-low rounded-3xl space-y-1 flex-1 border-l-4 border-secondary">
              <span className="text-secondary font-bold font-headline uppercase text-xs tracking-widest">Confiança</span>
              <p className="text-on-surface font-semibold">Conformidade HIPAA</p>
            </div>
            <div className="p-6 bg-surface-container-low rounded-3xl space-y-1 flex-1">
              <span className="text-on-surface-variant font-bold font-headline uppercase text-xs tracking-widest">Suporte</span>
              <p className="text-on-surface font-semibold">Cuidado Clínico 24/7</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="bg-surface-container-lowest p-8 lg:p-10 rounded-[2rem] ambient-shadow relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary" />
            <div className="mb-8">
              <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">Bem-vindo de volta</h2>
              <p className="text-on-surface-variant text-sm font-medium">Por favor, insira suas credenciais para continuar</p>
            </div>
            <form className="space-y-5" onSubmit={handleLogin}>
              {error && (
                <div className="p-4 bg-error-container/10 border border-error/20 rounded-2xl text-error text-sm font-medium flex flex-col gap-2">
                  <p>{error}</p>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">Endereço de E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="você@gmail.com"
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-high border-none rounded-2xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all placeholder:text-outline"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-surface-container-high border-none rounded-2xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all placeholder:text-outline"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" />
                  <span className="text-on-surface-variant group-hover:text-on-surface transition-colors font-medium">Lembrar de mim</span>
                </label>
                <button type="button" className="text-primary font-bold hover:underline underline-offset-4">Esqueceu a senha?</button>
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                  {!loading && <LogIn className="w-5 h-5" />}
                </button>
              </div>
            </form>
            <div className="mt-8 pt-6 border-t border-surface-container-high flex flex-col items-center gap-4">
              <p className="text-sm text-on-surface-variant font-medium">Não tem uma conta?</p>
              <button 
                onClick={() => onNavigate('signup')}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-secondary-fixed text-on-secondary-fixed font-semibold rounded-2xl hover:bg-secondary-fixed-dim transition-colors text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Criar uma conta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
