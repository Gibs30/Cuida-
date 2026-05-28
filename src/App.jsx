import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Pill, Calendar, ShoppingCart, Droplets, Clock, Users, 
  Brain, Settings, Plus, ClipboardList, Check, Volume2, 
  ArrowLeft, Phone, AlertTriangle, Heart, Sparkles, Loader2,
  Trash2, X, Activity, Edit2, Share2, Moon, Sun, Flame,
  Music, User, Camera, MessageCircle, Send, Info, Mic, Printer
} from 'lucide-react';

// --- CONEXÃO REAL COM O SUPABASE ---
import { createClient } from '@supabase/supabase-js';
// Temporarily hardcode Supabase credentials to avoid broken deploy while environment variables are fixed.
// WARNING: Hardcoding credentials is insecure — remove this as soon as Vercel env vars work.
const supabaseUrl = 'https://vaszaiekhclhcjimzecu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhc3phaWVraGNsaGNqaW16ZWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3ODMwMzIsImV4cCI6MjA5NTM1OTAzMn0.bgJ1DfBTJsqJULaK9-MvyneIUJs0qHJaOLLVAvQt7U8';

console.warn('Supabase client using hardcoded credentials — remove after deploy fix.');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

function Sidebar({ currentView, setCurrentView, profile, user }) {
  const navItems = profile.role === 'monitor' 
    ? [
        { id: 'home', label: 'Dashboard', icon: <Activity size={20} /> },
        { id: 'schedule', label: 'Horários', icon: <Calendar size={20} /> },
        { id: 'chat', label: 'Chat', icon: <MessageCircle size={20} /> },
        { id: 'settings', label: 'Ajustes', icon: <Settings size={20} /> },
      ]
    : [
        { id: 'home', label: 'Início', icon: <Heart size={20} /> },
        { id: 'add', label: 'Novo Aviso', icon: <Plus size={20} /> },
        { id: 'schedule', label: 'Horários', icon: <Calendar size={20} /> },
        { id: 'family', label: 'Histórico', icon: <ClipboardList size={20} /> },
        { id: 'aiAssistant', label: 'IA Saúde', icon: <Sparkles size={20} /> },
        { id: 'chat', label: 'Mensagens', icon: <MessageCircle size={20} /> },
        { id: 'settings', label: 'Ajustes', icon: <Settings size={20} /> },
      ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white p-6 flex flex-col shadow-2xl overflow-y-auto">
      {/* Logo/Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Heart size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Cuida+</h1>
            <p className="text-xs text-slate-400">Saúde</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              currentView === item.id
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User Profile Footer */}
      <div className="border-t border-slate-700 pt-4">
        <button
          onClick={() => setCurrentView('editProfile')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
        >
          <User size={20} />
          <div className="text-left text-sm">
            <p className="font-medium text-white">{profile.name || 'Utilizador'}</p>
            <p className="text-xs text-slate-400">{profile.role === 'monitor' ? 'Cuidador' : 'Paciente'}</p>
          </div>
        </button>
      </div>
    </aside>
  );
}

export default function App() {
  // --- ESTADOS DO USUÁRIOO ---
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ 
    name: '', phone: '', easyMode: false, theme: 'blue', 
    darkMode: false, role: 'patient', alarmSound: 'bell', linkedPatientId: '',
    checkLackOfMovement: false, lackOfMovementHours: 8
  });
  
  // --- ESTADOS DE DADOS (PACIENTE LOCAL) ---
  const [reminders, setReminders] = useState([]);
  const [logs, setLogs] = useState([]); 
  const [family, setFamily] = useState([]);

  // --- ESTADOS DE DADOS (MONITOR SINCRONIZADO) ---
  const [patientReminders, setPatientReminders] = useState([]);
  const [patientLogs, setPatientLogs] = useState([]);
  
  // --- ESTADOS DE CHAT ---
  const [chatMessages, setChatMessages] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState('');

  // --- ESTADOS DE UI ---
  const [currentView, setCurrentView] = useState('loading');
  const [activeAlert, setActiveAlert] = useState(null);
  const [triggeredAlarms, setTriggeredAlarms] = useState([]); 
  const [toastMessage, setToastMessage] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Estados Form Lembrete
  const [editingId, setEditingId] = useState(null);
  const [newRemTitle, setNewRemTitle] = useState('');
  const [newRemDetail, setNewRemDetail] = useState('');
  const [newRemTime, setNewRemTime] = useState('');
  const [newRemType, setNewRemType] = useState('Pill');
  const [newRemDays, setNewRemDays] = useState([]); 
  const [newRemStock, setNewRemStock] = useState(''); 
  const [genericSuggestions, setGenericSuggestions] = useState(''); 
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false); 

  // IA de Prevenção de Inações
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const [interactionWarning, setInteractionWarning] = useState('');

  // Reconhecimento de Voz
  const [isListening, setIsListening] = useState(false);

  // Estados Editar Perfil
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Estados de Onboarding
  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingPhone, setOnboardingPhone] = useState('');
  const [onboardingRole, setOnboardingRole] = useState('patient');

  // Estado Convite Familiar
  const [inviteInput, setInviteInput] = useState('');

  // Estados IA
  const [aiTab, setAiTab] = useState('explain');
  const [medicationName, setMedicationName] = useState('');
  const [generalQuestion, setGeneralQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');

  // --- MAPAS DE ESTILOS E ÍCONES ---
  const colorMap = {
    blue: { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-100', border: 'border-blue-600' },
    green: { bg: 'bg-green-600', text: 'text-green-600', light: 'bg-green-100', border: 'border-green-600' },
    purple: { bg: 'bg-purple-600', text: 'text-purple-600', light: 'bg-purple-100', border: 'border-purple-600' },
    red: { bg: 'bg-red-600', text: 'text-red-600', light: 'bg-red-100', border: 'border-red-600' },
  };
  const theme = colorMap[profile.theme] || colorMap.blue;
  const isDark = profile.darkMode;

  const iconMap = { Pill, Calendar, ShoppingCart, Droplets, Clock, Brain };
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Sincronizar os estilos do HTML baseado nas Variáveis CSS do App.css
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', profile.theme);
    document.documentElement.setAttribute('data-dark', isDark.toString());
    document.documentElement.setAttribute('data-easy', profile.easyMode.toString());
  }, [profile, isDark]);

  // --- ACESSIBILIDADE, ÁUDIO E VOZ ---
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-PT';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    if(profile.easyMode) speak(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const startListening = (setterFunc) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Reconhecimento de voz não suportado neste dispositivo.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-PT';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setterFunc(prev => prev ? prev + ' ' + transcript : transcript);
      showToast("Voz reconhecida!");
    };
    recognition.onerror = (e) => {
       console.error(e);
       showToast("Erro ao escutar. Tente novamente.");
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const playChime = useCallback(() => {
    if (profile.alarmSound === 'vibrate' && navigator.vibrate) {
      navigator.vibrate([500, 300, 500]);
      return;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (profile.alarmSound === 'birds') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2000, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(3000, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
      } else if (profile.alarmSound === 'electronic') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.3);
        osc.start(); osc.stop(ctx.currentTime + 0.4);
      } else { 
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
        osc.start(); osc.stop(ctx.currentTime + 1);
      }
    } catch (e) { console.log('Áudio não suportado', e); }
  }, [profile.alarmSound]);

  // --- AUTENTICAÇÃO ANÓNIMA SUPABASE ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
        } else {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
          setUser(data.user);
        }
      } catch (error) {
        console.error("Erro na autenticação anónima do Supabase", error);
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
        setCurrentView('loading');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- ESCUTA ATIVA DOS DADOS (SUPABASE) ---
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar perfil", error);
        return;
      }

      if (data) {
        setProfile(prev => ({ ...prev, ...data }));
        setEditName(data.name || '');
        setEditPhone(data.phone || '');
        setCurrentView(prev => prev === 'loading' ? 'home' : prev);
      } else {
        setCurrentView('onboarding');
      }
    };

    fetchProfile();

    const fetchReminders = async () => {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id);

      if (!error && data) {
        const sortedData = [...data].sort((a, b) => a.time.localeCompare(b.time));
        setReminders(sortedData);
      }
    };

    fetchReminders();

    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (!error && data) setLogs(data);
    };

    fetchLogs();

    const profileChannel = supabase.channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => {
        fetchProfile();
      })
      .subscribe();

    const remindersChannel = supabase.channel('reminders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders', filter: `user_id=eq.${user.id}` }, () => {
        fetchReminders();
      })
      .subscribe();

    const logsChannel = supabase.channel('logs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logs', filter: `user_id=eq.${user.id}` }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(remindersChannel);
      supabase.removeChannel(logsChannel);
    };
  }, [user]);

  // --- ESCUTA ATIVA DO CHAT (SUPABASE) ---
  useEffect(() => {
    if (!user) return;
    const targetUid = (profile.role === 'monitor' && profile.linkedPatientId) ? profile.linkedPatientId : user.id;

    const fetchChat = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel_id', targetUid)
        .order('timestamp', { ascending: true });

      if (!error && data) setChatMessages(data);
    };

    fetchChat();

    const chatChannel = supabase.channel('chat-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${targetUid}` }, (payload) => {
        setChatMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [user, profile.role, profile.linkedPatientId]);

  // --- ESCUTA DE DADOS DO PACIENTE VINCULADO (CUIDADOR) ---
  useEffect(() => {
    if (!user || profile.role !== 'monitor' || !profile.linkedPatientId) {
      setPatientLogs([]);
      setPatientReminders([]);
      return;
    }

    const pid = profile.linkedPatientId;

    const fetchPatientData = async () => {
      const { data: rems } = await supabase.from('reminders').select('*').eq('user_id', pid);
      if (rems) setPatientReminders(rems.sort((a, b) => a.time.localeCompare(b.time)));

      const { data: logList } = await supabase.from('logs').select('*').eq('user_id', pid).order('timestamp', { ascending: false });
      if (logList) setPatientLogs(logList);
    };

    fetchPatientData();

    const patientChannel = supabase.channel('patient-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders', filter: `user_id=eq.${pid}` }, () => fetchPatientData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logs', filter: `user_id=eq.${pid}` }, () => fetchPatientData())
      .subscribe();

    return () => {
      supabase.removeChannel(patientChannel);
    };
  }, [user, profile.role, profile.linkedPatientId]);

  // Alarme + Som Constante
  useEffect(() => {
    if (!user || profile.role === 'monitor' || reminders.length === 0) return;
    const interval = setInterval(() => {
      const now = new Date();
      const currentDay = now.getDay();
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      reminders.forEach(rem => {
        const triggerKey = `${rem.id}_${currentTimeStr}_${now.toDateString()}`;
        const runsToday = !rem.days || rem.days.length === 0 || rem.days.includes(currentDay);
        
        if (runsToday && rem.time === currentTimeStr && !activeAlert && !triggeredAlarms.includes(triggerKey)) {
          setActiveAlert(rem);
          setTriggeredAlarms(prev => [...prev, triggerKey]);
          if(profile.easyMode) speak(`Atenção, ${profile.name}. Hora de: ${rem.title}.`);
        }
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [reminders, activeAlert, triggeredAlarms, profile.easyMode, profile.name, user, profile.role]);

  // --- DETEÇÃO DE INATIVIDADE (FALTA DE MOVIMENTO) ---
  const isPatientInactive = useMemo(() => {
    if (profile.role !== 'monitor' || !profile.checkLackOfMovement || !profile.linkedPatientId || patientLogs.length === 0) return false;
    
    const sortedLogs = [...patientLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const latestLog = sortedLogs[0];
    if (!latestLog) return false;

    const lastLogTime = new Date(latestLog.timestamp);
    const msPassed = new Date() - lastLogTime;
    const hoursPassed = msPassed / (1000 * 60 * 60);

    return hoursPassed > profile.lackOfMovementHours;
  }, [profile.role, profile.checkLackOfMovement, profile.linkedPatientId, profile.lackOfMovementHours, patientLogs]);

  // --- LÓGICA DE GAMIFICAÇÃO (STREAKS) ---
  const streakDays = useMemo(() => {
    const targetLogs = profile.role === 'monitor' && profile.linkedPatientId ? patientLogs : logs;
    if (!targetLogs.length) return 0;
    const dates = [...new Set(targetLogs.map(l => new Date(l.timestamp).toDateString()))];
    dates.sort((a,b) => new Date(b) - new Date(a));

    let streak = 0;
    let curr = new Date();
    curr.setHours(0,0,0,0);

    for (let i=0; i<dates.length; i++) {
      const d = new Date(dates[i]);
      d.setHours(0,0,0,0);
      const diffDays = Math.floor((curr - d) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0 && i === 0) streak++;
      else if (diffDays === 1 || (diffDays === 0 && streak > 0)) {
        streak++;
        curr = d;
      } else break;
    }
    return streak;
  }, [logs, patientLogs, profile.role, profile.linkedPatientId]);

  // --- FUNÇÕES DE AÇÃO ---
  const saveProfile = async (name, phone, role = 'patient') => {
    if(!user || !name) return;
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        name,
        phone,
        role,
        easy_mode: profile.easyMode,
        theme: profile.theme,
        dark_mode: profile.darkMode,
        alarm_sound: profile.alarmSound,
        linked_patient_id: profile.linkedPatientId,
        check_lack_of_movement: profile.checkLackOfMovement,
        lack_of_movement_hours: profile.lackOfMovementHours
      });
      if (error) throw error;
      showToast("Bem-vindo(a)!");
      setCurrentView('home');
    } catch(err) { console.error(err); }
  };

  const updateProfile = async (updates) => {
    if(!user) return;
    try {
      const mappedUpdates = {};
      if (updates.easyMode !== undefined) mappedUpdates.easy_mode = updates.easyMode;
      if (updates.darkMode !== undefined) mappedUpdates.dark_mode = updates.darkMode;
      if (updates.theme !== undefined) mappedUpdates.theme = updates.theme;
      if (updates.alarmSound !== undefined) mappedUpdates.alarm_sound = updates.alarmSound;
      if (updates.linkedPatientId !== undefined) mappedUpdates.linked_patient_id = updates.linkedPatientId;
      if (updates.checkLackOfMovement !== undefined) mappedUpdates.check_lack_of_movement = updates.checkLackOfMovement;
      if (updates.lackOfMovementHours !== undefined) mappedUpdates.lack_of_movement_hours = updates.lackOfMovementHours;
      if (updates.name !== undefined) mappedUpdates.name = updates.name;
      if (updates.phone !== undefined) mappedUpdates.phone = updates.phone;
      if (updates.role !== undefined) mappedUpdates.role = updates.role;

      const { error } = await supabase
        .from('profiles')
        .update(mappedUpdates)
        .eq('id', user.id);
        
      if (error) throw error;
      setProfile(prev => ({ ...prev, ...updates }));
    } catch(err) { console.error(err); }
  };

  const logoutAccount = async () => {
    if(!user) return;
    try {
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.auth.signOut();
      setProfile({ 
        name: '', phone: '', easyMode: false, theme: 'blue', 
        darkMode: false, role: 'patient', alarmSound: 'bell', linkedPatientId: '',
        check_lack_of_movement: false, lackOfMovementHours: 8
      });
      setConfirmLogout(false);
      setCurrentView('onboarding');
      showToast("Conta terminada com sucesso.");
    } catch(err) { console.error(err); }
  };

  const saveReminder = async () => {
    if(!user || !newRemTitle || !newRemTime) {
      showToast("Preencha título e horário!");
      return;
    }
    const targetUid = (profile.role === 'monitor' && profile.linkedPatientId) ? profile.linkedPatientId : user.id;
    
    try {
      const data = { 
        user_id: targetUid,
        title: newRemTitle, 
        detail: newRemDetail, 
        time: newRemTime, 
        type: newRemType, 
        days: newRemDays,
        stock: newRemStock ? parseInt(newRemStock) : null
      };

      if (editingId) {
        const { error } = await supabase.from('reminders').update(data).eq('id', editingId);
        if (error) throw error;
        showToast("Lembrete atualizado!");
      } else {
        const { error } = await supabase.from('reminders').insert([data]);
        if (error) throw error;
        showToast("Lembrete guardado!");
      }
      resetForm();
    } catch(err) { console.error(err); }
  };

  const resetForm = () => {
    setNewRemTitle(''); setNewRemDetail(''); setNewRemTime(''); 
    setNewRemType('Pill'); setNewRemDays([]); setEditingId(null);
    setNewRemStock(''); setGenericSuggestions(''); setInteractionWarning('');
    setCurrentView('schedule');
  };

  const closeAddReminder = () => {
    setNewRemTitle(''); setNewRemDetail(''); setNewRemTime(''); 
    setNewRemType('Pill'); setNewRemDays([]); setEditingId(null);
    setNewRemStock(''); setGenericSuggestions(''); setInteractionWarning('');
    setCurrentView('home');
  };
  
  const placeholderTexts = {
    Pill: "Ex: Remédio Pressão",
    Droplets: "Ex: Beber 1 copo de água",
    Calendar: "Ex: Consulta no Cardiologista",
    Clock: "Ex: Hora do Lanche",
    ShoppingCart: "Ex: Comprar pão e leite",
    Brain: "Ex: Leitura diária"
  };

  const deleteReminder = async (id) => {
    try {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) throw error;
      showToast("Lembrete apagado");
    } catch(err) { console.error(err); }
  };

  const markAsDone = async (reminder) => {
    if(!user) return;
    try {
      const { error } = await supabase.from('logs').insert([{
        user_id: user.id,
        reminder_id: reminder.id,
        title: reminder.title,
        status: 'done'
      }]);
      if (error) throw error;

      if (reminder.stock && reminder.stock > 0) {
         const newStock = reminder.stock - 1;
         await supabase.from('reminders').update({ stock: newStock }).eq('id', reminder.id);
         if (newStock <= 5 && newStock > 0) {
            showToast(`Atenção: Restam apenas ${newStock} doses!`);
         } else if (newStock === 0) {
            showToast(`${reminder.title} acabou! Avise a farmácia.`);
         } else {
            showToast("Muito bem! Guardado no histórico.");
         }
      } else {
         showToast("Muito bem! Guardado no histórico.");
      }

      setActiveAlert(null);
    } catch(err) { console.error(err); }
  };

  const postponeAlert = async () => {
    if(!user || !activeAlert) return;
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);
    const newTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    try {
      const { error } = await supabase.from('reminders').insert([{
        user_id: user.id,
        title: activeAlert.title + " (Adiado)",
        detail: activeAlert.detail,
        time: newTime,
        type: activeAlert.type,
        days: [now.getDay()], 
      }]);
      if (error) throw error;
      setActiveAlert(null);
      showToast(`Adiado para as ${newTime}.`);
    } catch(err) { console.error(err); }
  };

  const inviteFamilyMember = () => {
    const inviteCode = user ? user.id : 'CUIDA+';
    const text = `🩺 *Olá!* Estou a usar a aplicação *Cuida+* para acompanhar a minha rotina de saúde.\n\nO meu código de paciente é:\n*${inviteCode}*\n\nCopia este código e insere na tua aplicação na aba Família para me acompanhares! ❤️`;
    
    if (navigator.share) {
      navigator.share({ title: 'Código Cuida+', text: text }).catch(err => console.log('Partilha cancelada', err));
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
    }
  };

  const acceptInvite = async () => {
    if(!user || inviteInput.length < 5) {
      showToast("Código inválido. Insira o código completo de 36 caracteres.");
      return;
    }
    try {
      if (profile.role === 'monitor') {
        await updateProfile({ linkedPatientId: inviteInput.trim() });
        showToast("Paciente sincronizado com sucesso!");
      } else {
        showToast("Código recebido! Cuidador adicionado.");
      }
      setInviteInput('');
    } catch(err) { console.error(err); }
  };

  const shareWhatsApp = () => {
    let text = `🩺 *Relatório de Saúde - ${profile.name}*\n\n`;
    text += `🔥 Sequência Atual: ${streakDays} dia(s) a cumprir a rotina!\n\n`;
    text += `*Últimos registos:*\n`;
    const logsToPrint = profile.role === 'monitor' ? patientLogs : logs;
    logsToPrint.slice(0, 10).forEach(log => {
       const d = new Date(log.timestamp);
       text += `✅ ${d.toLocaleDateString()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')} - ${log.title}\n`;
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  const sendChatMessage = async () => {
    if(!user || !newChatMessage.trim()) return;
    const targetUid = (profile.role === 'monitor' && profile.linkedPatientId) ? profile.linkedPatientId : user.id;
    try {
      const { error } = await supabase.from('chat_messages').insert([{
        channel_id: targetUid,
        text: newChatMessage,
        sender_name: profile.name || 'Utilizador',
        sender_role: profile.role
      }]);
      if (error) throw error;
      setNewChatMessage('');
    } catch(err) { console.error("Erro a enviar mensagem", err); }
  };

  const recognizeMedicationFromImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsAnalyzingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result.split(',')[1];
      const apiKey = "";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{
          role: "user",
          parts: [
            { text: "Analise a imagem deste medicamento. Responda estritamente num formato JSON com duas chaves: 'nome' (o nome principal do remédio) e 'detalhe' (a dosagem, ex: 50mg, ou formato, ex: xarope). Se não for um medicamento, deixe as chaves vazias." },
            { inlineData: { mimeType: file.type, data: base64String } }
          ]
        }],
        generationConfig: { responseMimeType: "application/json" }
      };

      try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if(jsonText) {
          const result = JSON.parse(jsonText);
          if (result.nome) {
            setNewRemTitle(result.nome);
            if (result.detalhe) setNewRemDetail(result.detalhe);
            showToast("Medicamento reconhecido pela foto!");
            if(profile.easyMode) speak(`Reconheci o medicamento: ${result.nome}.`);
            fetchGenerics(result.nome);
            checkDrugInteractions(result.nome);
          } else {
            showToast("Não consegui identificar o medicamento na foto.");
          }
        }
      } catch (err) {
        showToast("Erro ao processar imagem.");
      } finally {
        setIsAnalyzingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- INTELIGÊNCIA IA DE PREVENÇÃO DE INTERAÇÕES ---
  const checkDrugInteractions = async (medName) => {
    if (!medName) return;
    
    const targetReminders = profile.role === 'monitor' ? patientReminders : reminders;
    const medsList = targetReminders
      .filter(r => r.type === 'Pill' && r.id !== editingId)
      .map(r => r.title)
      .join(', ');

    if (!medsList) return;

    setIsCheckingInteractions(true);
    setInteractionWarning('');
    const apiKey = "";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    const userText = `Analise se o medicamento "${medName}" possui interações perigosas, contraindicações severas ou riscos elevados de saúde quando tomado juntamente com os seguintes medicamentos: ${medsList}. Responda estritamente em formato JSON com duas chaves: 'interage' (boolean) e 'mensagem' (uma mensagem curta de até duas frases, muito simples e acolhedora em português de Portugal explicando o risco).`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userText }] }],
          systemInstruction: { parts: [{ text: "És um farmacêutico carinhoso e focado na segurança de idosos. Fornece apenas o formato JSON requisitado." }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await res.json();
      const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (jsonText) {
        const result = JSON.parse(jsonText);
        if (result.interage) {
          setInteractionWarning(result.mensagem);
          speak("Atenção! Detetei uma possível interação perigosa com os seus medicamentos.");
          playChime();
        }
      }
    } catch (e) {
      console.error("Erro a testar interações", e);
    } finally {
      setIsCheckingInteractions(false);
    }
  };

  const fetchGenerics = async (medName) => {
    if(!medName) return;
    setAiLoading(true);
    setGenericSuggestions('');
    const apiKey = ""; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    let sysText = "És um assistente de saúde útil. Mantém a resposta muito curta, máxima de 3 linhas. Foca-te em ajudar na economia e acesso.";
    let userText = `Para o medicamento "${medName}", sugere 1 ou 2 opções de princípios ativos (genéricos) que o paciente pode procurar na farmácia. Menciona também brevemente se é comum ser feito em farmácia de manipulação.`;

    try {
      const res = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: userText }] }], systemInstruction: { parts: [{ text: sysText }] } })
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setGenericSuggestions(text || "Sem sugestões de genéricos no momento.");
    } catch (err) { setGenericSuggestions("Erro ao procurar genéricos."); } 
    finally { setAiLoading(false); }
  };

  const handleMedicationInputBlur = (title) => {
    if (newRemType === 'Pill' && title) {
      fetchGenerics(title);
      checkDrugInteractions(title);
    }
  };

  const askGeminiWithMode = async (promptType, input = '') => {
    setAiLoading(true); setAiResult('');
    const apiKey = ""; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    let sysText = "És o assistente Cuida+, muito carinhoso e focado em idosos e familiares de Portugal. Responde com frases curtas e palavras fáceis. Máximo 2 a 3 frases.";
    let userText = "";

    switch(promptType) {
      case 'explain':
        userText = `Explica de forma simples para que serve o medicamento: ${input}. Não dês conselhos médicos estritos, termina com: "Segue sempre a orientação médica."`;
        break;
      case 'tip':
        userText = `Dá uma dica curta, amigável e carinhosa de bem-estar diária ou incentivo de saúde geral para hoje.`;
        break;
      case 'org':
        userText = `Dá uma sugestão prática de organização de rotina, organização dos remédios ou de segurança da casa (para evitar quedas de idosos).`;
        break;
      case 'health':
        userText = `Dá uma dica de saúde geral preventiva muito fácil sobre hidratação, sono correto, alimentação ou exercício leve para o bem-estar diário.`;
        break;
      case 'general':
        userText = `Responde de forma amigável, acolhedora e muito clara à seguinte pergunta de um utilizador do Cuida+: "${input}"`;
        break;
      default:
        userText = "Dá-me uma palavra de carinho e incentivo para hoje.";
    }

    try {
      const res = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: userText }] }], systemInstruction: { parts: [{ text: sysText }] } })
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Falha na ligação ao assistente. Tenta mais tarde.";
      setAiResult(text);
      if (profile.easyMode) speak(text);
    } catch (err) { 
      setAiResult("Erro de ligação ao assistente virtual."); 
    } finally { 
      setAiLoading(false); 
    }
  };

  // --- ELEMENTOS DE RENDER DO TEMPLATE ---

  const renderOnboarding = () => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center">
              <Heart size={48} className="text-white animate-pulse" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-center text-slate-900 mb-2">Bem-vindo ao Cuida+</h1>
          <p className="text-center text-slate-600 text-lg mb-8">Controle seu tempo ❤️</p>

          <div className="space-y-6">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Como quer ser chamado?</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 outline-none transition-all text-lg"
                placeholder="Insira o seu nome"
                value={onboardingName} 
                onChange={e => setOnboardingName(e.target.value)}
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Tipo de Perfil</label>
              <div className="flex gap-3">
                <button 
                  onClick={() => setOnboardingRole('patient')}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                    onboardingRole === 'patient'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-700 border-2 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  Sou Paciente
                </button>
                <button 
                  onClick={() => setOnboardingRole('monitor')}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                    onboardingRole === 'monitor'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-700 border-2 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  Sou Cuidador
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              onClick={() => saveProfile(onboardingName, onboardingPhone, onboardingRole)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg mt-4"
            >
              Aceder ao Painel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEditProfile = () => (
    <div className="ml-64 min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setCurrentView('settings')} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <ArrowLeft size={24} className="text-slate-700" />
          </button>
          <h1 className="text-3xl font-bold text-slate-900">O Meu Perfil</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 max-w-2xl">
          {/* Name Field */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-slate-900 mb-2">Nome Completo / Alcunha</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 outline-none transition-all"
              value={editName} 
              onChange={e => setEditName(e.target.value)}
            />
          </div>

          {/* Phone Field */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-slate-900 mb-2">Telemóvel (opcional)</label>
            <input 
              type="tel" 
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 outline-none transition-all"
              value={editPhone} 
              onChange={e => setEditPhone(e.target.value)}
            />
          </div>

          {/* Save Button */}
          <button 
            onClick={() => { updateProfile({ name: editName, phone: editPhone }); showToast("Perfil atualizado!"); setCurrentView('settings'); }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Check size={20} /> Guardar Perfil
          </button>
        </div>
      </div>
    </div>
  );

  const renderPatientHome = () => (
    <div className="ml-64 min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header with Easy Mode Toggle */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-5xl font-bold text-slate-900 mb-2">Olá, {profile.name} 🌷</h1>
            <p className="text-lg text-slate-600">O que vamos fazer hoje?</p>
          </div>
          
          <button 
            onClick={() => {
              const newMode = !profile.easyMode;
              updateProfile({ easyMode: newMode });
              speak(newMode ? "Modo fácil ativado." : "Modo fácil desativado.");
            }}
            className={`p-3 rounded-2xl font-medium transition-all shadow-sm ${
              profile.easyMode 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300'
            }`}
          >
            <Volume2 size={24} />
          </button>
        </div>

        {/* Streak Card */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-orange-200 flex items-center justify-center">
            <Flame size={32} className="text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">SEQUÊNCIA ATUAL</p>
            <h2 className="text-3xl font-bold text-slate-900">{streakDays} dias seguidos</h2>
            <p className="text-slate-600">Estás a ir muito bem! Mantém o ritmo diário.</p>
          </div>
        </div>

        {/* Quick Action Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => { setEditingId(null); setCurrentView('add'); }} 
            className="bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
              <Plus size={24} className="text-indigo-600" />
            </div>
            <p className="font-bold text-slate-900">Novo Aviso</p>
          </button>

          <button 
            onClick={() => setCurrentView('schedule')} 
            className="bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Calendar size={24} className="text-green-600" />
            </div>
            <p className="font-bold text-slate-900">Horários</p>
          </button>

          <button 
            onClick={() => setCurrentView('family')} 
            className="bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
              <ClipboardList size={24} className="text-purple-600" />
            </div>
            <p className="font-bold text-slate-900">Histórico</p>
          </button>

          <button 
            onClick={() => setCurrentView('settings')} 
            className="bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Settings size={24} className="text-slate-600" />
            </div>
            <p className="font-bold text-slate-900">Ajustes</p>
          </button>
        </div>

        {/* AI & Chat Widgets */}
        <div className="grid lg:grid-cols-2 gap-6">
          <button 
            onClick={() => setCurrentView('aiAssistant')}
            className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-8 text-white text-left hover:shadow-xl transition-shadow"
          >
            <Sparkles size={32} className="mb-3" />
            <h3 className="text-2xl font-bold mb-1">Assistente de Saúde ✨</h3>
            <p className="text-purple-100">Dicas de organização, remédios e saúde geral.</p>
          </button>

          <button 
            onClick={() => setCurrentView('chat')}
            className="bg-white rounded-2xl p-8 text-left border-2 border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all"
          >
            <MessageCircle size={32} className="text-indigo-600 mb-3" />
            <h3 className="text-2xl font-bold text-slate-900 mb-1">Mensagens 💬</h3>
            <p className="text-slate-600">Conversar com o familiar cuidador.</p>
          </button>
        </div>

      </div>
    </div>
  );

  const renderMonitorHome = () => {
    if (!profile.linkedPatientId) {
      return (
        <div className="ml-64 min-h-screen bg-slate-50 p-8 flex items-center justify-center">
          <div className="max-w-2xl w-full text-center">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                <Users size={40} className="text-slate-400" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-4">Nenhum Paciente Vinculado</h1>
              <p className="text-slate-600 text-lg mb-8">
                Introduza o código UID partilhado pelo paciente para aceder à monitorização em tempo real.
              </p>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 outline-none"
                  placeholder="Código de 36 caracteres..."
                  value={inviteInput} 
                  onChange={e => setInviteInput(e.target.value)}
                />
                <button onClick={acceptInvite} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl transition-colors">
                  Vincular
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const todayLogs = patientLogs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString());
    const currentDay = new Date().getDay();
    const todayReminders = patientReminders.filter(r => !r.days || r.days.length === 0 || r.days.includes(currentDay));
    const progressPerc = todayReminders.length > 0 ? Math.round((todayLogs.length / todayReminders.length) * 100) : 100;

    return (
      <div className="ml-64 min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Inactivity Alert */}
          {isPatientInactive && (
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900">ALERTA: Falta de Movimento</h3>
                <p className="text-red-700 mt-1">O paciente não interage com o aplicativo há mais de {profile.lackOfMovementHours} horas.</p>
              </div>
              <button onClick={() => showToast("A telefonar...")} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-xl transition-colors flex items-center gap-2 flex-shrink-0">
                <Phone size={18} /> Ligar
              </button>
            </div>
          )}

          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Painel de Monitorização 🩺</h1>
            <p className="text-slate-600">Paciente vinculado: <span className="font-semibold text-slate-900">{profile.linkedPatientId}</span></p>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Daily Progress Card */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Progresso Diário do Paciente</h2>
              
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-slate-700">{todayLogs.length} de {todayReminders.length} tarefas concluídas</span>
                  <span className="text-2xl font-bold text-indigo-600">{progressPerc}%</span>
                </div>
                <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                    style={{ width: `${Math.min(progressPerc, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-4">Atividades nas últimas 24h</h3>
                <div className="space-y-3">
                  {todayLogs.length === 0 ? (
                    <p className="text-slate-500 py-4">Nenhuma atividade registada hoje.</p>
                  ) : (
                    todayLogs.map(log => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                        <span className="text-slate-700">{log.title}</span>
                        <div className="flex items-center gap-2 text-green-700 font-semibold">
                          <Check size={18} /> Concluído
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Actions */}
            <div className="space-y-4">
              {/* Inactivity Detector */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4">⏰ Detetor de Inatividade</h3>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-700">Ativar Alerta</span>
                  <input 
                    type="checkbox" 
                    checked={profile.checkLackOfMovement}
                    onChange={e => updateProfile({ checkLackOfMovement: e.target.checked })}
                    className="w-6 h-6 rounded accent-indigo-600 cursor-pointer"
                  />
                </div>
                {profile.checkLackOfMovement && (
                  <div className="flex gap-2 flex-wrap">
                    {[4, 8, 12, 24].map(hr => (
                      <button 
                        key={hr} 
                        onClick={() => updateProfile({ lackOfMovementHours: hr })}
                        className={`flex-1 px-3 py-2 rounded-lg font-semibold transition-all ${
                          profile.lackOfMovementHours === hr
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {hr}h
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <button 
                onClick={() => { setEditingId(null); setCurrentView('add'); }} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Adicionar Lembrete
              </button>

              <button 
                onClick={() => setCurrentView('chat')} 
                className="w-full bg-white border-2 border-slate-200 hover:border-indigo-500 text-slate-900 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} /> Chat com Paciente
              </button>

              <button 
                onClick={() => setCurrentView('schedule')} 
                className="w-full bg-white border-2 border-slate-200 hover:border-indigo-500 text-slate-900 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Calendar size={20} /> Horários
              </button>

              <button 
                onClick={() => setCurrentView('settings')} 
                className="w-full bg-white border-2 border-slate-200 hover:border-indigo-500 text-slate-900 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Settings size={20} /> Definições
              </button>

              <button 
                onClick={() => updateProfile({ linkedPatientId: '' })} 
                className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-bold py-3 rounded-xl transition-colors"
              >
                Desvincular Paciente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHome = () => {
    if (profile.role === 'monitor') return renderMonitorHome();
    return renderPatientHome();
  };

  const renderAddReminder = () => {
    const toggleDay = (idx) => {
      if(newRemDays.includes(idx)) setNewRemDays(newRemDays.filter(d => d !== idx));
      else setNewRemDays([...newRemDays, idx]);
    };

    return (
      <div className="ml-64 min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={closeAddReminder} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
              <ArrowLeft size={24} className="text-slate-700" />
            </button>
            <h1 className="text-3xl font-bold text-slate-900">{editingId ? 'Editar Aviso' : 'Novo Lembrete'}</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
            
            {/* Title with Camera */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">O que é?</label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 outline-none text-lg"
                  placeholder={placeholderTexts[newRemType]}
                  value={newRemTitle} 
                  onChange={e => setNewRemTitle(e.target.value)}
                  onBlur={() => handleMedicationInputBlur(newRemTitle)}
                />
                <label className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700 cursor-pointer transition-colors">
                  {isAnalyzingImage ? <Loader2 className="animate-spin text-purple-600" size={24} /> : <Camera size={24} />}
                  <span>Foto</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={recognizeMedicationFromImage} />
                </label>
              </div>
            </div>

            {/* Drug Interaction Warning */}
            {newRemType === 'Pill' && (isCheckingInteractions || interactionWarning) && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex gap-3">
                <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Risco detetado pela IA!</p>
                  <p className="text-red-700 text-sm mt-1">{isCheckingInteractions ? 'A examinar contraindicações...' : interactionWarning}</p>
                </div>
              </div>
            )}

            {/* Generic Suggestions */}
            {newRemType === 'Pill' && (aiLoading || genericSuggestions) && (
              <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-4 flex gap-3">
                <Sparkles size={24} className="text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-purple-900">Opções Genéricas (IA)</p>
                  <p className="text-purple-700 text-sm mt-1">{aiLoading ? 'A pesquisar base de dados...' : genericSuggestions}</p>
                </div>
              </div>
            )}

            {/* Instruction & Stock */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-900 mb-2">Instrução (opcional)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 outline-none"
                  placeholder="Ex: Tomar após a refeição"
                  value={newRemDetail} 
                  onChange={e => setNewRemDetail(e.target.value)}
                />
              </div>

              {newRemType === 'Pill' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Em Stock</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 outline-none"
                    placeholder="30"
                    value={newRemStock} 
                    onChange={e => setNewRemStock(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Horário</label>
              <input 
                type="time" 
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 outline-none text-center text-2xl font-bold"
                value={newRemTime} 
                onChange={e => setNewRemTime(e.target.value)}
              />
            </div>

            {/* Days Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">Dias da Semana (Vazio = Diário)</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {diasSemana.map((dia, idx) => (
                  <button 
                    key={dia} 
                    onClick={() => toggleDay(idx)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
                      newRemDays.includes(idx)
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 border-2 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {dia}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button 
              onClick={saveReminder} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 mt-8"
            >
              <Check size={22} /> Guardar Lembrete
            </button>

          </div>
        </div>
      </div>
    );
  };

  const renderSchedule = () => {
    const list = (profile.role === 'monitor' && profile.linkedPatientId) ? patientReminders : reminders;
    return (
      <div className="ml-64 min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setCurrentView('home')} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
              <ArrowLeft size={24} className="text-slate-700" />
            </button>
            <h1 className="text-3xl font-bold text-slate-900">Horários Agendados</h1>
          </div>

          {/* Schedule List */}
          <div className="space-y-4">
            {list.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                <p className="text-slate-500 text-lg">Nenhum horário registado ainda.</p>
              </div>
            ) : (
              list.map(rem => (
                <div 
                  key={rem.id} 
                  className="bg-white rounded-2xl shadow-sm border-l-4 border-l-indigo-600 border border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl font-bold text-indigo-600">{rem.time}</span>
                        {rem.stock !== null && rem.stock !== undefined && (
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            rem.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            Stock: {rem.stock}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{rem.title}</h3>
                      {rem.detail && <p className="text-slate-600">{rem.detail}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openEdit(rem)} 
                        className="p-3 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <Edit2 size={20} className="text-slate-600" />
                      </button>
                      <button 
                        onClick={() => deleteReminder(rem.id)} 
                        className="p-3 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 size={20} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFamily = () => (
    <div className="ml-64 min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setCurrentView('home')} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <ArrowLeft size={24} className="text-slate-700" />
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Família & Histórico</h1>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8 no-print">
          <button 
            onClick={shareWhatsApp} 
            className="flex-1 flex items-center justify-center gap-2 bg-[#25d366] hover:bg-[#20a853] text-white font-bold py-3 rounded-xl transition-colors"
          >
            <Share2 size={20} /> Partilhar WhatsApp
          </button>
          <button 
            onClick={() => window.print()} 
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            <Printer size={20} /> Imprimir PDF
          </button>
        </div>

        {/* History List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 print-area">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Últimas Atividades Concluídas</h2>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Nenhum log de atividade ainda.</p>
            ) : (
              logs.map(log => {
                const d = new Date(log.timestamp);
                return (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{log.title}</p>
                      <p className="text-sm text-slate-500">{d.toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 text-green-600 font-semibold">
                      <Check size={20} /> {d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="ml-64 min-h-screen bg-slate-50 p-8 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setCurrentView('home')} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <ArrowLeft size={24} className="text-slate-700" />
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Chat com Família</h1>
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {chatMessages.length === 0 ? (
              <p className="text-center text-slate-500 my-auto py-8">Nenhuma mensagem. Comece a conversa!</p>
            ) : (
              chatMessages.map(msg => {
                const isMe = msg.sender_role === profile.role;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs ${isMe ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900'} rounded-2xl px-4 py-3`}>
                      <p className={`text-xs mb-1 ${isMe ? 'text-indigo-100' : 'text-slate-500'}`}>{msg.sender_name}</p>
                      <p className="break-words">{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Area */}
          <div className="flex gap-3">
            <button 
              onClick={() => startListening(setNewChatMessage)} 
              className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Mic size={22} className="text-slate-700" />
            </button>
            <input 
              type="text" 
              className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 outline-none"
              placeholder="Escreva uma mensagem..."
              value={newChatMessage} 
              onChange={e => setNewChatMessage(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendChatMessage()}
            />
            <button 
              onClick={sendChatMessage} 
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="ml-64 min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setCurrentView('home')} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <ArrowLeft size={24} className="text-slate-700" />
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Ajustes do Sistema</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
          {/* Edit Profile Button */}
          <button 
            onClick={() => setCurrentView('editProfile')} 
            className="w-full flex items-center gap-3 px-6 py-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition-colors border-2 border-indigo-200"
          >
            <User size={22} /> Editar Perfil
          </button>

          {/* Dark Mode */}
          <div className="border-t border-slate-200 pt-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Modo Noturno</h3>
                <p className="text-slate-600">Cores escuras ideais para a noite.</p>
              </div>
              <button 
                onClick={() => updateProfile({ darkMode: !isDark })} 
                className={`p-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  isDark 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {isDark ? <Sun size={22} /> : <Moon size={22} />}
                {isDark ? 'Modo Claro' : 'Modo Escuro'}
              </button>
            </div>
          </div>

          {/* Easy Mode */}
          <div className="border-t border-slate-200 pt-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Modo Fácil (Acessibilidade)</h3>
                <p className="text-slate-600">Ativa leitura de voz e aumenta botões.</p>
              </div>
              <input 
                type="checkbox" 
                checked={profile.easyMode}
                onChange={e => updateProfile({ easyMode: e.target.checked })}
                className="w-6 h-6 rounded accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Color Theme */}
          <div className="border-t border-slate-200 pt-8">
            <h3 className="font-bold text-slate-900 text-lg mb-4">Cor Principal</h3>
            <div className="flex gap-4">
              {['blue', 'green', 'purple', 'red'].map(col => (
                <button 
                  key={col}
                  onClick={() => updateProfile({ theme: col })}
                  className={`w-14 h-14 rounded-full transition-all shadow-md ${
                    col === 'blue' ? 'bg-blue-600' : 
                    col === 'green' ? 'bg-green-600' : 
                    col === 'purple' ? 'bg-purple-600' : 
                    'bg-red-600'
                  } ${profile.theme === col ? 'ring-4 ring-offset-2 ring-slate-900' : ''}`}
                  title={col}
                />
              ))}
            </div>
          </div>

          {/* Logout Section */}
          <div className="border-t border-slate-200 pt-8">
            {confirmLogout ? (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                <p className="font-bold text-red-900 text-center mb-4">Irá eliminar todas as suas configurações deste dispositivo. Continuar?</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setConfirmLogout(false)} 
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={logoutAccount} 
                    className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
                  >
                    Confirmar Sair
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setConfirmLogout(true)} 
                className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl transition-colors border-2 border-red-200"
              >
                Eliminar Conta Deste Dispositivo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAiAssistant = () => (
    <div className="ml-64 min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => { setCurrentView('home'); setAiResult(''); }} 
            className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft size={24} className="text-slate-700" />
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Assistente de Saúde ✨</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto mb-8 pb-2">
          {[
            { id: 'explain', label: 'Remédios 💊' },
            { id: 'org', label: 'Organização 🏡' },
            { id: 'health', label: 'Saúde Geral 🍎' },
            { id: 'general', label: 'Perguntas 💬' },
            { id: 'tip', label: 'Dica Diária 💡' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => { setAiTab(tab.id); setAiResult(''); }} 
              className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
                aiTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 min-h-96">
          {aiTab === 'explain' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Decifrar Medicamento</h2>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 outline-none"
                placeholder="Ex: Losartana"
                value={medicationName} 
                onChange={e => setMedicationName(e.target.value)}
              />
              <button 
                onClick={() => askGeminiWithMode('explain', medicationName)} 
                disabled={aiLoading} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {aiLoading ? <Loader2 className="animate-spin" size={20} /> : 'Explicar Remédio'}
              </button>
            </div>
          )}

          {aiTab === 'org' && (
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Arrumação e Segurança Doméstica</h2>
              <button 
                onClick={() => askGeminiWithMode('org')} 
                disabled={aiLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                {aiLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sugerir Dica de Organização'}
              </button>
            </div>
          )}

          {aiTab === 'health' && (
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Conselhos Gerais de Saúde</h2>
              <button 
                onClick={() => askGeminiWithMode('health')} 
                disabled={aiLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                {aiLoading ? <Loader2 className="animate-spin" size={20} /> : 'Ver Conselho Preventivo'}
              </button>
            </div>
          )}

          {aiTab === 'general' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">A sua Pergunta à IA</h2>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 outline-none"
                placeholder="Escreva a sua dúvida..."
                value={generalQuestion} 
                onChange={e => setGeneralQuestion(e.target.value)}
              />
              <button 
                onClick={() => askGeminiWithMode('general', generalQuestion)} 
                disabled={aiLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {aiLoading ? <Loader2 className="animate-spin" size={20} /> : 'Perguntar'}
              </button>
            </div>
          )}

          {aiTab === 'tip' && (
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Dica Carinhosa do Dia</h2>
              <button 
                onClick={() => askGeminiWithMode('tip')} 
                disabled={aiLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                {aiLoading ? <Loader2 className="animate-spin" size={20} /> : 'Gerar Mensagem de Apoio'}
              </button>
            </div>
          )}

          {/* AI Result */}
          {aiResult && (
            <div className="mt-8 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-2xl">
              <p className="text-lg leading-relaxed text-slate-900">{aiResult}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const openEdit = (reminder) => {
    setEditingId(reminder.id);
    setNewRemTitle(reminder.title);
    setNewRemDetail(reminder.detail || '');
    setNewRemTime(reminder.time);
    setNewRemType(reminder.type);
    setNewRemDays(reminder.days || []);
    setNewRemStock(reminder.stock || '');
    setCurrentView('add');
  };

  const renderFloatingSOS = () => {
    if (currentView === 'onboarding' || currentView === 'loading' || profile.role !== 'patient') return null;
    return (
      <button 
        onClick={() => showToast("A ligar para o S.O.S...")}
        className="fixed bottom-8 right-8 w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl animate-pulse hover:animate-none transition-all z-50 border-4 border-red-400"
        title="Botão de Emergência"
      >
        <Phone size={32} />
      </button>
    );
  };

  const renderToast = () => {
    if (!toastMessage) return null;
    return (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl z-50 font-medium">
        {toastMessage}
      </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Sidebar */}
      {currentView !== 'onboarding' && currentView !== 'loading' && <Sidebar currentView={currentView} setCurrentView={setCurrentView} profile={profile} user={user} />}

      {/* Main Views */}
      {currentView === 'onboarding' && renderOnboarding()}
      {currentView === 'home' && renderHome()}
      {currentView === 'add' && renderAddReminder()}
      {currentView === 'schedule' && renderSchedule()}
      {currentView === 'family' && renderFamily()}
      {currentView === 'settings' && renderSettings()}
      {currentView === 'editProfile' && renderEditProfile()}
      {currentView === 'aiAssistant' && renderAiAssistant()}
      {currentView === 'chat' && renderChat()}

      {/* Alert Overlay */}
      {activeAlert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 md:p-12 text-center animate-slide-up">
            {/* Icon */}
            <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
              <Pill size={56} className="text-indigo-600" />
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-2">Atenção, {profile.name}</h1>
            <p className="text-lg text-slate-600 mb-6">Chegou a hora do seu compromisso:</p>

            {/* Highlight Box */}
            <div className="bg-indigo-50 border-2 border-indigo-300 rounded-2xl p-8 mb-8">
              <h2 className="text-4xl font-bold text-slate-900 mb-2">{activeAlert.title}</h2>
              {activeAlert.detail && <p className="text-slate-600 mt-2 text-lg">{activeAlert.detail}</p>}
              <p className="text-2xl font-bold text-indigo-600 mt-4">{activeAlert.time}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button 
                onClick={() => postponeAlert()} 
                className="flex-1 py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-colors text-lg"
              >
                Adiar 10m
              </button>
              <button 
                onClick={() => markAsDone(activeAlert)} 
                className="flex-1 py-4 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors text-lg flex items-center justify-center gap-2"
              >
                <Check size={22} /> Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating SOS Button & Toast */}
      {renderFloatingSOS()}
      {renderToast()}
    </div>
  );
}