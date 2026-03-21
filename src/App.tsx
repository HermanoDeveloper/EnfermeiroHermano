/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
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
  Briefcase,
  Phone,
  MapPin,
  ChevronDown,
  Calendar,
  Hash
} from 'lucide-react';
import { cn } from './lib/utils';
import { Screen, Disease, Procedure } from './types';
import { DISEASES, PROCEDURES } from './constants';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const transition = {
    duration: 0.3,
    ease: [0.22, 1, 0.36, 1],
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigate={setCurrentScreen} onSelectDisease={(d) => { setSelectedDisease(d); setCurrentScreen('disease-detail'); }} />;
      case 'diseases':
        return <DiseasesScreen onNavigate={setCurrentScreen} onSelectDisease={(d) => { setSelectedDisease(d); setCurrentScreen('disease-detail'); }} />;
      case 'procedures':
        return <ProceduresScreen onNavigate={setCurrentScreen} />;
      case 'profile':
        return <ProfileScreen onLogout={() => { setIsLoggedIn(false); setCurrentScreen('login'); }} />;
      case 'disease-detail':
        return <DiseaseDetailScreen disease={selectedDisease} onBack={() => setCurrentScreen('diseases')} />;
      case 'signup':
        return <SignupScreen onNavigate={setCurrentScreen} onLogin={() => setIsLoggedIn(true)} />;
      case 'login':
        return <LoginScreen onNavigate={setCurrentScreen} onLogin={() => setIsLoggedIn(true)} />;
      default:
        return <HomeScreen onNavigate={setCurrentScreen} onSelectDisease={(d) => { setSelectedDisease(d); setCurrentScreen('disease-detail'); }} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col max-w-7xl mx-auto relative overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed top-0 right-0 -z-10 w-1/3 h-1/2 bg-gradient-to-bl from-primary-fixed/20 to-transparent blur-3xl opacity-50" />
      <div className="fixed bottom-0 left-0 -z-10 w-1/4 h-1/3 bg-gradient-to-tr from-secondary-container/20 to-transparent blur-3xl opacity-50" />

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
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
                  Santuário Clínico
                </span>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-full hover:bg-surface-container-low">
                  <ArrowLeft className="w-5 h-5 text-on-surface" />
                </button>
              </div>

              <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-primary-fixed overflow-hidden">
                  <img 
                    src="https://picsum.photos/seed/doctor/200" 
                    alt="Dr. Carlos" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <p className="font-bold text-on-surface">Dr. Carlos Oliveira</p>
                  <p className="text-xs text-on-surface-variant">CRM 12345-SP</p>
                </div>
              </div>

              <nav className="flex-1 space-y-2">
                <SidebarItem icon={<Home className="w-5 h-5" />} label="Painel Principal" onClick={() => { setCurrentScreen('home'); setIsSidebarOpen(false); }} active={currentScreen === 'home'} />
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
      {currentScreen !== 'login' && currentScreen !== 'signup' && (
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
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary/50 leading-none mb-0.5">Santuário</span>
                <span className="font-headline font-black text-lg tracking-tighter text-primary leading-none">CLÍNICO</span>
              </div>

              {/* Right: Notifications */}
              <div className="flex items-center">
                <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors relative">
                  <Bell className="w-5 h-5 text-on-surface-variant" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-surface" />
                </button>
              </div>
            </div>

            {/* Bottom Row: Search Input */}
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar protocolos, CID, exames..."
                className="w-full h-11 pl-10 pr-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-surface outline-none transition-all text-sm text-on-surface placeholder:text-outline/60 shadow-inner-sm"
              />
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1",
        currentScreen !== 'login' && currentScreen !== 'signup' ? "pt-[124px] pb-24" : ""
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={transition}
            className="h-full"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      {currentScreen !== 'login' && currentScreen !== 'signup' && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-outline-variant/10 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="max-w-7xl mx-auto px-4 h-20 flex justify-around items-center">
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
        "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300",
        active ? "text-primary bg-primary-fixed/30" : "text-on-surface-variant hover:text-primary"
      )}
    >
      {icon}
      <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-left",
        active ? "bg-primary text-on-primary shadow-md" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
      )}
    >
      {icon}
      <span className="font-semibold text-sm">{label}</span>
    </button>
  );
}

// --- Screens ---

function HomeScreen({ onNavigate, onSelectDisease }: { onNavigate: (s: Screen) => void, onSelectDisease: (d: Disease) => void }) {
  return (
    <div className="px-6 py-4 space-y-10">
      <section>
        <h1 className="font-headline text-[2.75rem] font-extrabold leading-tight tracking-tight text-on-surface">
          Bem-vindo de volta,<br />
          <span className="text-primary">Dr. Carlos</span>
        </h1>
        <p className="text-on-surface-variant font-medium mt-2">Segunda-feira, 12 de Junho • 4 Revisões Agendadas</p>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="col-span-2 bg-gradient-to-br from-primary to-primary-container p-6 rounded-3xl ambient-shadow relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all">
          <div className="relative z-10">
            <Activity className="w-8 h-8 text-white mb-4" />
            <h3 className="font-headline text-xl font-bold text-white">Busca Rápida de Doenças</h3>
            <p className="text-white/80 text-sm mt-1">Acesse mais de 1.200 protocolos clínicos</p>
          </div>
          <Search className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
        </div>

        <div 
          onClick={() => onNavigate('procedures')}
          className="bg-secondary-fixed p-5 rounded-3xl flex flex-col gap-3 cursor-pointer active:scale-[0.98] transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center shadow-sm">
            <Stethoscope className="w-6 h-6 text-on-secondary-fixed" />
          </div>
          <h3 className="font-headline font-bold text-on-secondary-fixed">Procedimentos de Enfermagem</h3>
        </div>

        <div className="bg-tertiary-fixed p-5 rounded-3xl flex flex-col gap-3 cursor-pointer active:scale-[0.98] transition-all">
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
        <div className="space-y-4">
          {DISEASES.slice(0, 3).map((disease) => (
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

      <section className="p-8 rounded-3xl bg-surface-container-low text-center border border-outline-variant/10">
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

function DiseasesScreen({ onNavigate, onSelectDisease }: { onNavigate: (s: Screen) => void, onSelectDisease: (d: Disease) => void }) {
  const [filter, setFilter] = useState('Todas');
  const categories = ['Todas', 'Crônicas', 'Infecciosas', 'Neurológicas'];

  const typeLabels: Record<string, string> = {
    'Chronic': 'Crônica',
    'Infectious': 'Infecciosa',
    'Neurological': 'Neurológica'
  };

  const filteredDiseases = filter === 'Todas' 
    ? DISEASES 
    : DISEASES.filter(d => d.type === (filter === 'Crônicas' ? 'Chronic' : filter === 'Infecciosas' ? 'Infectious' : 'Neurological'));

  return (
    <div className="px-6 py-4 space-y-8">
      <section>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
          <input 
            type="text" 
            placeholder="Buscar doenças, sintomas..."
            className="w-full h-14 pl-12 pr-4 bg-surface-container-high border-none rounded-full focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-outline ambient-shadow"
          />
        </div>
      </section>

      <section className="-mx-6 px-6 overflow-x-auto no-scrollbar flex gap-3">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "px-6 py-2.5 rounded-full text-sm font-semibold transition-all",
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
        <h2 className="text-xs font-bold uppercase tracking-widest text-outline mb-4">Condições Comuns</h2>
        <div className="space-y-4">
          {filteredDiseases.map((disease) => (
            <div 
              key={disease.id}
              onClick={() => onSelectDisease(disease)}
              className="bg-surface-container-lowest p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-surface-container-low transition-all ambient-shadow relative overflow-hidden"
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
          ))}
        </div>
      </section>
    </div>
  );
}

function ProceduresScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <div className="px-6 py-4 space-y-8">
      <section>
        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Procedimentos</h1>
        <p className="text-on-surface-variant text-sm leading-relaxed">Técnicas de enfermagem baseadas em evidências e protocolos clínicos.</p>
      </section>

      <section>
        <div className="relative flex items-center">
          <Search className="absolute left-4 text-outline w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar procedimentos médicos..."
            className="w-full h-14 pl-12 pr-4 bg-surface-container-high border-none rounded-full focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-outline ambient-shadow"
          />
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-on-surface">Categorias</h2>
          <span className="text-xs font-semibold uppercase tracking-widest text-primary cursor-pointer">Ver Tudo</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {PROCEDURES.map((proc) => (
            <div 
              key={proc.id}
              className="bg-surface-container-low rounded-3xl p-5 border-l-4 border-secondary flex flex-col justify-between aspect-square group active:scale-95 transition-all cursor-pointer"
            >
              <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center text-on-secondary-container shadow-sm">
                {proc.icon === 'ShieldCheck' ? <ShieldCheck className="w-6 h-6" /> : 
                 proc.icon === 'Syringe' ? <Syringe className="w-6 h-6" /> :
                 proc.icon === 'Activity' ? <Activity className="w-6 h-6" /> :
                 <Stethoscope className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-bold text-on-surface leading-tight">{proc.name}</h3>
                <p className="text-[11px] text-on-surface-variant mt-1">{proc.guideCount} Guias</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-on-surface">Procedimentos Comuns</h2>
        <div className="space-y-3">
          <div className="bg-surface-container-lowest rounded-2xl p-4 flex items-center gap-4 ambient-shadow border-l-4 border-secondary active:scale-[0.98] transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center flex-shrink-0">
              <Activity className="w-6 h-6 text-secondary" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-on-surface">Medição Manual de PA</h4>
              <p className="text-xs text-on-surface-variant">Sinais Vitais • 6 Passos • 5 min</p>
            </div>
            <ChevronRight className="w-5 h-5 text-outline" />
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-4 flex items-center gap-4 ambient-shadow border-l-4 border-tertiary active:scale-[0.98] transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-tertiary-fixed/30 flex items-center justify-center flex-shrink-0">
              <Syringe className="w-6 h-6 text-tertiary" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-on-surface">Técnica de Injeção IM</h4>
              <p className="text-xs text-on-surface-variant">Medicação • 12 Passos • 10 min</p>
            </div>
            <ChevronRight className="w-5 h-5 text-outline" />
          </div>
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

  return (
    <div className="px-6 py-4 space-y-10">
      <section>
        <div className="relative overflow-hidden rounded-[2rem] aspect-[4/3] mb-6 ambient-shadow">
          <img 
            src={`https://picsum.photos/seed/${disease.name}/800/600`} 
            alt={disease.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <span className="inline-block px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-widest rounded-full mb-2">
              Doença {typeLabels[disease.type] || disease.type}
            </span>
            <h2 className="font-headline text-2xl font-extrabold text-white tracking-tight">{disease.name}</h2>
          </div>
        </div>
        <p className="text-on-surface-variant leading-relaxed text-sm">
          {disease.description}
        </p>
      </section>

      <section>
        <div className="flex justify-between items-end mb-5">
          <h3 className="font-headline text-lg font-bold text-on-surface">Apresentação Clínica</h3>
          <span className="text-primary text-xs font-semibold">4 Indicadores Principais</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-2xl ambient-shadow flex flex-col items-start gap-3 border-l-4 border-secondary">
            <Thermometer className="w-6 h-6 text-secondary" />
            <div>
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Febre</p>
              <p className="text-sm font-bold text-on-surface">38.5°C - 40°C</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-5 rounded-2xl ambient-shadow flex flex-col items-start gap-3 border-l-4 border-secondary">
            <Wind className="w-6 h-6 text-secondary" />
            <div>
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Dispneia</p>
              <p className="text-sm font-bold text-on-surface">Falta de ar</p>
            </div>
          </div>
          <div className="col-span-2 bg-surface-container-lowest p-5 rounded-2xl ambient-shadow flex items-center justify-between border-l-4 border-secondary">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Tosse Produtiva</p>
              <p className="text-sm font-bold text-on-surface">Muco amarelo, verde ou com sangue</p>
            </div>
            <Menu className="w-6 h-6 text-secondary rotate-90" />
          </div>
        </div>
      </section>

      <section className="bg-primary p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Stethoscope className="w-32 h-32" />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-6 h-6 text-secondary-container" />
          <h3 className="font-headline text-xl font-bold">Plano de Cuidados de Enfermagem</h3>
        </div>
        <ul className="space-y-4 relative z-10">
          <li className="flex gap-3">
            <CheckCircle2 className="w-4 h-4 text-secondary-container mt-1 shrink-0" />
            <p className="text-sm font-medium"><span className="font-bold">Manejo das Vias Aéreas:</span> Incentive mudanças frequentes de posição e exercícios de respiração profunda.</p>
          </li>
          <li className="flex gap-3">
            <CheckCircle2 className="w-4 h-4 text-secondary-container mt-1 shrink-0" />
            <p className="text-sm font-medium"><span className="font-bold">Balanço Hídrico:</span> Mantenha a hidratação para ajudar a fluidificar as secreções pulmonares para facilitar a expectoração.</p>
          </li>
        </ul>
        <button className="mt-6 w-full py-4 bg-secondary-container text-on-secondary-container font-bold rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-transform">
          Marcar como Lido
        </button>
      </section>
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
  { id: 'doctor', label: 'Médico(a)' },
  { id: 'nurse', label: 'Enfermeiro(a)' },
  { id: 'technician', label: 'Técnico(a) de Enfermagem' },
  { id: 'general-medicine-tech', label: 'Técnico(a) de Medicina Geral' },
  { id: 'lab-tech', label: 'Técnico(a) de Laboratório' },
  { id: 'physiotherapist', label: 'Fisioterapeuta' },
  { id: 'pharmacist', label: 'Farmacêutico(a)' },
  { id: 'non-professional', label: 'Não sou profissional de saúde' },
  { id: 'other', label: 'Outro (especificar)' },
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

function SignupScreen({ onNavigate, onLogin }: { onNavigate: (s: Screen) => void, onLogin: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  
  const categoryRef = useRef<HTMLDivElement>(null);
  const countryRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

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
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
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
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onLogin(); onNavigate('home'); }}>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="João Silva"
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-high border-none rounded-2xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all placeholder:text-outline"
                  />
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
                  className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Criar Conta
                  <ArrowRight className="w-5 h-5" />
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

function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="px-6 py-4 space-y-8">
      <section className="text-center">
        <div className="w-24 h-24 rounded-full bg-primary-fixed mx-auto mb-4 overflow-hidden border-4 border-white shadow-md">
           <img 
            src="https://picsum.photos/seed/doctor/200" 
            alt="Dr. Carlos" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <h2 className="font-headline text-2xl font-bold text-on-surface">Dr. Carlos Oliveira</h2>
        <p className="text-on-surface-variant font-medium">Médico Clínico Geral • CRM 12345-SP</p>
      </section>

      <section className="space-y-4">
        <div className="bg-surface-container-low p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-surface-container-high transition-all">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed/30 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-on-surface">Dados Pessoais</h4>
            <p className="text-xs text-on-surface-variant">Nome, CRM, Especialidade</p>
          </div>
          <ChevronRight className="w-5 h-5 text-outline-variant" />
        </div>
        <div className="bg-surface-container-low p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-surface-container-high transition-all">
          <div className="w-10 h-10 rounded-xl bg-secondary-fixed/30 flex items-center justify-center">
            <Bell className="w-5 h-5 text-secondary" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-on-surface">Notificações</h4>
            <p className="text-xs text-on-surface-variant">Alertas de protocolos e atualizações</p>
          </div>
          <ChevronRight className="w-5 h-5 text-outline-variant" />
        </div>
        <div className="bg-surface-container-low p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-surface-container-high transition-all">
          <div className="w-10 h-10 rounded-xl bg-tertiary-fixed/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-tertiary" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-on-surface">Segurança</h4>
            <p className="text-xs text-on-surface-variant">Senha e autenticação de dois fatores</p>
          </div>
          <ChevronRight className="w-5 h-5 text-outline-variant" />
        </div>
      </section>

      <section className="pt-4">
        <button 
          onClick={onLogout}
          className="w-full py-4 bg-error-container/20 text-error font-headline font-bold rounded-2xl shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <LogIn className="w-5 h-5 rotate-180" />
          Sair da Conta
        </button>
      </section>
    </div>
  );
}

function LoginScreen({ onNavigate, onLogin }: { onNavigate: (s: Screen) => void, onLogin: () => void }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
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
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onLogin(); onNavigate('home'); }}>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">Endereço de E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                  <input 
                    type="email" 
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
                  className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Entrar
                  <LogIn className="w-5 h-5" />
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
