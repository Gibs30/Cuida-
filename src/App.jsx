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
// --- FUNÇÃO DO MODO FÁCIL: LEITURA DE ECRÃ ---
  const falarTexto = (texto) => {
    if (profile.easyMode) { // Usa o seu estado real 'profile.easyMode'
      window.speechSynthesis.cancel(); // Para o áudio anterior para não encavalar
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'pt-PT'; // Define o idioma para português
      window.speechSynthesis.speak(utterance);
    }
  };
  // Sincronizar os estilos do HTML baseado nas Variáveis CSS do App.css
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', profile.theme);
    document.documentElement.setAttribute('data-dark', isDark.toString());
    document.documentElement.setAttribute('data-easy', profile.easyMode.toString());
    // Fix Dark Mode functionality - sync with document element
    if (profile.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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

  const openEdit = (reminder) => {
    setEditingId(reminder.id);
    setNewRemTitle(reminder.title);
    setNewRemDetail(reminder.detail || '');
    setNewRemTime(reminder.time);
    setNewRemType(reminder.type || 'Pill');
    setNewRemDays(reminder.days || []);
    setNewRemStock(reminder.stock ? reminder.stock.toString() : '');
    setCurrentView('add');
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
    <div className="app-container flex items-center justify-center w-full px-4">
      <div className="card-cuida w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary-light text-primary mb-4">
          <Heart size={64} className="animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Bem-vindo ao Cuida+</h1>
        <p className="text-text-muted text-lg mb-8">Controle seu tempo ❤️</p>
        
        <div className="form-field">
          <label className="text-left font-bold">Como quer ser chamado?</label>
          <input 
            type="text" className="input-cuida" placeholder="Insira o seu nome"
            value={onboardingName} onChange={e => setOnboardingName(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="text-left font-bold">Tipo de Perfil</label>
          <div className="flex gap-3">
            <button 
              onClick={() => setOnboardingRole('patient')}
              className={`scroll-btn flex-1 ${onboardingRole === 'patient' ? 'active' : ''}`}
            >
              Sou Paciente
            </button>
            <button 
              onClick={() => setOnboardingRole('monitor')}
              className={`scroll-btn flex-1 ${onboardingRole === 'monitor' ? 'active' : ''}`}
            >
              Sou Cuidador
            </button>
          </div>
        </div>

        <button 
          onClick={() => saveProfile(onboardingName, onboardingPhone, onboardingRole)}
          disabled={!onboardingName || !onboardingName.trim()}
          className={`btn-cuida btn-primary mt-4 ${
            !onboardingName || !onboardingName.trim() 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          Entrar na conta
        </button>
      </div>
    </div>
  );

  const renderEditProfile = () => (
    <div className="app-container w-full px-4 sm:px-6 md:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex-between" style={{ marginBottom: '32px' }}>
          <div className="flex-gap">
            <button onClick={() => setCurrentView('settings')} className="scroll-btn" style={{ padding: '12px' }}><ArrowLeft size={24} /></button>
            <h1>O Meu Perfil</h1>
          </div>
        </div>

        <div className="card-cuida w-full">
          <div className="form-field">
            <label>Nome Completo / Alcunha</label>
            <input 
              type="text" className="input-cuida"
              value={editName} onChange={e => setEditName(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Telemóvel (opcional)</label>
            <input 
              type="tel" className="input-cuida"
              value={editPhone} onChange={e => setEditPhone(e.target.value)}
            />
          </div>

          <button 
            onClick={() => { updateProfile({ name: editName, phone: editPhone }); showToast("Perfil atualizado!"); setCurrentView('settings'); }}
            className="btn-cuida btn-primary"
          >
            <Check size={20} /> Guardar Perfil
          </button>
        </div>
      </div>
    </div>
  );

  const renderPatientHome = () => (
    <div className="app-container w-full px-4 sm:px-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h1 className={`font-bold mb-1 ${profile.easyMode ? 'text-5xl md:text-6xl' : 'text-4xl md:text-5xl'}`}>Olá, {profile.name} 🌷</h1>
            <p className={`text-text-muted ${profile.easyMode ? 'text-xl' : 'text-lg'}`}>O que vamos fazer hoje?</p>
          </div>
          
          <button 
            onClick={() => {
              const newMode = !profile.easyMode;
              updateProfile({ easyMode: newMode });
              speak(newMode ? "Modo fácil ativado." : "Modo fácil desativado.");
            }}
            className={`scroll-btn ${profile.easyMode ? 'p-6' : 'p-4'} ${profile.easyMode ? 'active' : ''}`}
            onMouseEnter={() => falarTexto(profile.easyMode ? "Desativar modo fácil" : "Ativar modo fácil")}
          >
            <Volume2 size={profile.easyMode ? 32 : 24} />
          </button>
        </div>

        {/* Streak */}
        <div className="status-banner orange">
          <Flame size={36} />
          <div>
            <strong className="text-lg block">Dias Seguidos: {streakDays}</strong>
            <span>Estás a ir muito bem! Mantém o ritmo diário.</span>
          </div>
        </div>

        {/* Menu Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 ${profile.easyMode ? 'gap-6' : ''}`}>
          <button onClick={() => { setEditingId(null); setCurrentView('add'); }} className={`menu-btn flex flex-col items-center justify-center ${profile.easyMode ? 'py-8 px-6' : 'py-6 px-4'}`} onMouseEnter={() => falarTexto("Novo Aviso")}>
            <div className={`menu-btn-icon-wrapper mb-2 ${profile.easyMode ? 'text-5xl' : ''}`}><Plus size={profile.easyMode ? 40 : 32} /></div>
            <span className={`font-bold text-center ${profile.easyMode ? 'text-lg' : ''}`}>Novo Aviso</span>
          </button>

          <button onClick={() => setCurrentView('schedule')} className={`menu-btn flex flex-col items-center justify-center ${profile.easyMode ? 'py-8 px-6' : 'py-6 px-4'}`} onMouseEnter={() => falarTexto("Meus Horários")}>
            <div className={`menu-btn-icon-wrapper mb-2 ${profile.easyMode ? 'text-5xl' : ''}`}><ClipboardList size={profile.easyMode ? 40 : 32} /></div>
            <span className={`font-bold text-center ${profile.easyMode ? 'text-lg' : ''}`}>Meus Horários</span>
          </button>

          <button onClick={() => setCurrentView('family')} className={`menu-btn flex flex-col items-center justify-center ${profile.easyMode ? 'py-8 px-6' : 'py-6 px-4'}`} onMouseEnter={() => falarTexto("Família e Histórico")}>
            <div className={`menu-btn-icon-wrapper mb-2 ${profile.easyMode ? 'text-5xl' : ''}`}><Users size={profile.easyMode ? 40 : 32} /></div>
            <span className={`font-bold text-center ${profile.easyMode ? 'text-lg' : ''}`}>Família & Histórico</span>
          </button>

          <button onClick={() => setCurrentView('settings')} className={`menu-btn flex flex-col items-center justify-center ${profile.easyMode ? 'py-8 px-6' : 'py-6 px-4'}`} onMouseEnter={() => falarTexto("Ajustes")}>
            <div className={`menu-btn-icon-wrapper mb-2 ${profile.easyMode ? 'text-5xl' : ''}`}><Settings size={profile.easyMode ? 40 : 32} /></div>
            <span className={`font-bold text-center ${profile.easyMode ? 'text-lg' : ''}`}>Ajustes</span>
          </button>
        </div>

        {/* Widgets IA & Chat */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${profile.easyMode ? 'gap-6' : ''}`}>
          <button 
            onClick={() => setCurrentView('aiAssistant')}
            className={`btn-cuida bg-gradient-to-r from-purple to-indigo-500 text-white text-left justify-start flex flex-col sm:flex-row items-start sm:items-center gap-4 ${profile.easyMode ? 'p-8' : 'p-6'}`}
            onMouseEnter={() => falarTexto("Assistente de Saúde. Dicas de organização, remédios e saúde geral.")}
          >
            <Sparkles size={profile.easyMode ? 48 : 36} className="flex-shrink-0" />
            <div>
              <strong className={`block ${profile.easyMode ? 'text-2xl' : 'text-xl'}`}>Assistente de Saúde ✨</strong>
              <span className={`opacity-90 font-normal ${profile.easyMode ? 'text-lg' : ''}`}>Dicas de organização, remédios e saúde geral.</span>
            </div>
          </button>

          <button 
            onClick={() => setCurrentView('chat')}
            className={`btn-cuida btn-secondary text-left justify-start flex flex-col sm:flex-row items-start sm:items-center gap-4 border-2 border-gray-300 ${profile.easyMode ? 'p-8' : 'p-6'}`}
            onMouseEnter={() => falarTexto("Mensagens. Conversar com o familiar cuidador.")}
          >
            <MessageCircle size={profile.easyMode ? 48 : 36} className="text-primary flex-shrink-0" />
            <div>
              <strong className={`block ${profile.easyMode ? 'text-2xl' : 'text-xl'}`}>Mensagens 💬</strong>
              <span className={`text-text-muted font-normal ${profile.easyMode ? 'text-lg' : ''}`}>Conversar com o familiar cuidador.</span>
            </div>
          </button>
        </div>

      </div>
    </div>
  );

  const renderMonitorHome = () => {
    if (!profile.linkedPatientId) {
      return (
        <div className="app-container">
          <div className="max-width-wrapper" style={{ textAlign: 'center', padding: '40px 0' }}>
            <Users size={80} style={{ color: 'var(--text-muted)', marginBottom: '24px' }} />
            <h1 style={{ marginBottom: '16px' }}>Nenhum Paciente Vinculado</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '32px' }}>
              Introduza o código UID partilhado pelo paciente para aceder à monitorização em tempo real.
            </p>
            <div style={{ display: 'flex', gap: '12px', maxWidth: '500px', margin: '0 auto' }}>
              <input 
                type="text" className="input-cuida" placeholder="Código de 36 caracteres..."
                value={inviteInput} onChange={e => setInviteInput(e.target.value)}
              />
              <button onClick={acceptInvite} className="btn-cuida btn-primary" style={{ width: 'auto' }}>Vincular</button>
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
      <div className="app-container w-full px-4 sm:px-6 md:px-8">
        <div className="max-w-4xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Alerta de Falta de Movimento */}
          {isPatientInactive && (
            <div className="status-banner red-alert">
              <AlertTriangle size={40} />
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '1.3rem', display: 'block' }}>ALERTA: Falta de Movimento!</strong>
                <span>O paciente não interage com o aplicativo há mais de {profile.lackOfMovementHours} horas.</span>
              </div>
              <button onClick={() => showToast("A telefonar...")} className="btn-cuida btn-primary" style={{ width: 'auto', backgroundColor: 'white', color: 'var(--danger-text)' }}><Phone size={20} /> Ligar</button>
            </div>
          )}

          <div className="flex-between">
            <div>
              <h1>Painel de Monitorização 🩺</h1>
              <p style={{ color: 'var(--text-muted)' }}>Paciente vinculado: <span style={{ fontWeight: 'bold' }}>{profile.linkedPatientId}</span></p>
            </div>
            <button onClick={() => updateProfile({ linkedPatientId: '' })} className="scroll-btn" style={{ color: 'var(--danger)' }}>Desvincular</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-cuida">
              <h2 style={{ marginBottom: '16px' }}>Progresso Diário do Paciente</h2>
              
              {/* Gráfico de Progresso em CSS Puro */}
              <div style={{ marginBottom: '24px' }}>
                <div className="flex-between" style={{ marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>{todayLogs.length} de {todayReminders.length} tomados</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{progressPerc}%</span>
                </div>
                <div style={{ width: '100%', height: '14px', backgroundColor: 'var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(progressPerc, 100)}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.8s ease' }}></div>
                </div>
              </div>

              <h3>Logs das últimas 24h</h3>
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {todayLogs.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Nenhuma atividade hoje.</p> : todayLogs.map(log => (
                  <div key={log.id} className="flex-between" style={{ padding: '12px', borderRadius: 'var(--radius)', backgroundColor: 'var(--success-light)', color: 'var(--success-text)' }}>
                    <span>{log.title}</span>
                    <strong className="flex-gap"><Check size={18} /> Concluído</strong>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Configurador de Inatividade */}
              <div className="card-cuida">
                <h3>⏰ Detetor de Falta de Movimento</h3>
                <div className="flex-between" style={{ margin: '16px 0' }}>
                  <span>Ativar Alerta</span>
                  <input 
                    type="checkbox" checked={profile.checkLackOfMovement} style={{ width: '24px', height: '24px' }}
                    onChange={e => updateProfile({ checkLackOfMovement: e.target.checked })}
                  />
                </div>
                {profile.checkLackOfMovement && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[4, 8, 12, 24].map(hr => (
                      <button 
                        key={hr} onClick={() => updateProfile({ lackOfMovementHours: hr })}
                        className={`scroll-btn ${profile.lackOfMovementHours === hr ? 'active' : ''}`}
                        style={{ flex: 1 }}
                      >
                        {hr}h
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={() => { setEditingId(null); setCurrentView('add'); }} className="btn-cuida btn-primary"><Plus size={24} /> Adicionar Lembrete</button>
              <button onClick={() => setCurrentView('chat')} className="btn-cuida btn-secondary"><MessageCircle size={24} /> Chat com o Paciente</button>
              <button onClick={() => setCurrentView('schedule')} className="btn-cuida btn-secondary"><ClipboardList size={24} /> Listar Horários</button>
              <button onClick={() => setCurrentView('settings')} className="btn-cuida btn-secondary"><Settings size={24} /> Definições</button>
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
      <div className="app-container w-full px-4 sm:px-6 md:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex-gap mb-8">
            <button onClick={closeAddReminder} className="scroll-btn p-3"><ArrowLeft size={24} /></button>
            <h1 className="text-3xl font-bold">{editingId ? 'Editar Aviso' : 'Novo Lembrete'}</h1>
          </div>

          <div className="card-cuida flex flex-col gap-5">
            
            <div className="form-field">
              <label className="font-bold">O que é?</label>
              <div className="flex gap-3">
                <input 
                  type="text" className="input-cuida flex-1" placeholder={placeholderTexts[newRemType]}
                  value={newRemTitle} onChange={e => setNewRemTitle(e.target.value)}
                  onBlur={() => handleMedicationInputBlur(newRemTitle)}
                />
                <label className="scroll-btn flex items-center gap-2 cursor-pointer">
                  {isAnalyzingImage ? <Loader2 className="animate-spin text-purple" size={24} /> : <Camera size={24} />}
                  <span>Foto</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={recognizeMedicationFromImage} />
                </label>
              </div>
            </div>

            {/* Alerta IA de Conflito de Fármacos */}
            {newRemType === 'Pill' && (isCheckingInteractions || interactionWarning) && (
              <div className="status-banner red-alert m-0">
                <AlertTriangle size={32} />
                <div>
                  <strong className="block">Risco detetado pela IA!</strong>
                  <span>{isCheckingInteractions ? 'A examinar contraindicações...' : interactionWarning}</span>
                </div>
              </div>
            )}

            {newRemType === 'Pill' && (aiLoading || genericSuggestions) && (
              <div className="status-banner bg-purple-light border-2 border-purple text-purple-text m-0">
                <Sparkles size={32} />
                <div>
                  <strong className="block">Opções Genéricas (IA)</strong>
                  <span>{aiLoading ? 'A pesquisar base de dados...' : genericSuggestions}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
              <div className="form-field flex-1">
                <label className="font-bold">Instrução (opcional)</label>
                <input 
                  type="text" className={`input-cuida ${profile.easyMode ? 'text-lg py-3' : ''}`} placeholder="Ex: Tomar após a refeição"
                  value={newRemDetail} onChange={e => setNewRemDetail(e.target.value)}
                  onMouseEnter={() => falarTexto("Instrições opcionais, como tomar o medicamento")}
                />
              </div>

              {newRemType === 'Pill' && (
                <div className="form-field w-full sm:w-40">
                  <label className="font-bold">Em Stock</label>
                  <input 
                    type="number" className={`input-cuida ${profile.easyMode ? 'text-lg py-3' : ''}`} placeholder="30"
                    value={newRemStock} onChange={e => setNewRemStock(e.target.value)}
                    onMouseEnter={() => falarTexto("Quantidade de doses em stock")}
                  />
                </div>
              )}
            </div>

            <div className="form-field">
              <label className="font-bold">Horário</label>
              <input 
                type="time" className={`input-cuida text-center font-bold ${profile.easyMode ? 'text-3xl py-3' : 'text-2xl'}`}
                value={newRemTime} onChange={e => setNewRemTime(e.target.value)}
                onMouseEnter={() => falarTexto("Selecione o horário para o lembrete")}
              />
            </div>

            <div className="form-field">
              <label>Dias da Semana (Vazio = Diário)</label>
              <div className="scroll-row">
                {diasSemana.map((dia, idx) => (
                  <button 
                    key={dia} onClick={() => toggleDay(idx)}
                    className={`scroll-btn ${newRemDays.includes(idx) ? 'active' : ''}`}
                  >
                    {dia}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={saveReminder} className={`btn-cuida btn-primary ${profile.easyMode ? 'py-4 px-6 text-lg' : ''}`} style={{ marginTop: '24px' }} onMouseEnter={() => falarTexto("Guardar o lembrete")}>
              <Check size={profile.easyMode ? 32 : 24} /> Guardar Lembrete
            </button>

          </div>
        </div>
      </div>
    );
  };

  const renderSchedule = () => {
    const list = (profile.role === 'monitor' && profile.linkedPatientId) ? patientReminders : reminders;
    return (
      <div className="app-container w-full px-4 sm:px-6 md:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex-gap" style={{ marginBottom: '32px' }}>
            <button onClick={() => setCurrentView('home')} className="scroll-btn" style={{ padding: '12px' }}><ArrowLeft size={24} /></button>
            <h1>Horários Agendados</h1>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {list.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Nenhum horário registado.</p>
            ) : (
              list.map(rem => (
                <div key={rem.id} className="card-cuida flex-between" style={{ borderLeft: '8px solid var(--primary)' }}>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{rem.time}</span>
                    <h3 style={{ marginTop: '4px' }}>{rem.title}</h3>
                    {rem.detail && <p style={{ color: 'var(--text-muted)' }}>{rem.detail}</p>}
                    {rem.stock !== null && rem.stock !== undefined && <span style={{ fontSize: '0.9rem', color: 'var(--orange-text)' }}>Stock: {rem.stock} restante</span>}
                  </div>
                  <div className="flex-gap">
                    <button onClick={() => openEdit(rem)} className="scroll-btn"><Edit2 size={18} /></button>
                    <button onClick={() => deleteReminder(rem.id)} className="scroll-btn" style={{ color: 'var(--danger)' }}><Trash2 size={18} /></button>
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
    <div className="app-container w-full px-4 sm:px-6 md:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex-gap" style={{ marginBottom: '32px' }}>
          <button onClick={() => setCurrentView('home')} className="scroll-btn" style={{ padding: '12px' }}><ArrowLeft size={24} /></button>
          <h1>Família & Histórico</h1>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }} className="no-print flex-col sm:flex-row">
          <button onClick={shareWhatsApp} className={`btn-cuida btn-secondary ${profile.easyMode ? 'py-4 px-6 text-lg' : 'flex-1'}`} style={{ backgroundColor: '#25d366', color: 'white' }} onMouseEnter={() => falarTexto("Compartilhar atividades via WhatsApp")}><Share2 size={profile.easyMode ? 28 : 20} /> Compartilhar via WhatsApp</button>
          <button onClick={() => window.print()} className={`btn-cuida btn-primary ${profile.easyMode ? 'py-4 px-6 text-lg' : 'flex-1'}`} onMouseEnter={() => falarTexto("Imprimir relatório em PDF")}><Printer size={profile.easyMode ? 28 : 20} /> Imprimir PDF</button>
        </div>

        <div className="card-cuida print-area">
          <h2 style={{ marginBottom: '16px' }}>Últimas Atividades Concluídas</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {logs.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Nenhum log de atividade ainda.</p> : logs.map(log => {
               const d = new Date(log.timestamp);
               return (
                 <div key={log.id} className="flex-between" style={{ padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                   <div>
                     <strong>{log.title}</strong>
                     <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{d.toLocaleDateString()}</span>
                   </div>
                   <strong style={{ color: 'var(--success)', display: 'flex', gap: '8px', alignItems: 'center' }}><Check size={20} /> {d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>
                 </div>
               );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="app-container w-full px-4 sm:px-6 md:px-8">
      <div className="max-w-2xl mx-auto h-screen flex flex-col">
        <div className="flex-gap mb-6">
          <button onClick={() => setCurrentView('home')} className="scroll-btn p-3"><ArrowLeft size={24} /></button>
          <h1 className="text-3xl font-bold">Chat com Família</h1>
        </div>

        <div className="chat-box flex-1">
          {chatMessages.length === 0 ? (
             <p className="text-center text-text-muted m-auto">Nenhuma mensagem. Comece a conversa!</p>
          ) : chatMessages.map(msg => {
             const isMe = msg.sender_role === profile.role;
             return (
               <div key={msg.id} className={`chat-bubble ${isMe ? 'me' : 'other'}`}>
                 <span className="text-xs block opacity-80 mb-1">{msg.sender_name}</span>
                 <span>{msg.text}</span>
               </div>
             );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => startListening(setNewChatMessage)} className={`scroll-btn ${profile.easyMode ? 'p-6' : 'p-4'}`} onMouseEnter={() => falarTexto("Enviar mensagem de voz")}><Mic size={profile.easyMode ? 32 : 24} /></button>
          <input 
            type="text" className={`input-cuida flex-1 ${profile.easyMode ? 'text-lg py-3' : ''}`} placeholder="Escreva uma mensagem..."
            value={newChatMessage} onChange={e => setNewChatMessage(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && sendChatMessage()}
            onMouseEnter={() => falarTexto("Digite sua mensagem aqui")}
          />
          <button onClick={sendChatMessage} className={`btn-cuida btn-primary w-full sm:w-auto ${profile.easyMode ? 'py-3 px-6 text-lg' : ''}`} onMouseEnter={() => falarTexto("Enviar mensagem")}><Send size={profile.easyMode ? 32 : 24} /></button>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="app-container w-full px-4 sm:px-6 md:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex-gap mb-8">
          <button onClick={() => setCurrentView('home')} className="scroll-btn p-3"><ArrowLeft size={24} /></button>
          <h1 className="text-3xl font-bold">Ajustes do Sistema</h1>
        </div>

        <div className="card-cuida flex flex-col gap-6">
          <button onClick={() => setCurrentView('editProfile')} className={`btn-cuida btn-secondary ${profile.easyMode ? 'py-4 px-6 text-lg' : ''}`} onMouseEnter={() => falarTexto("Editar seu perfil")}><User size={profile.easyMode ? 28 : 20} /> Editar Perfil</button>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <strong className={profile.easyMode ? 'text-lg' : ''}>Modo Noturno</strong>
              <p className={`text-text-muted ${profile.easyMode ? 'text-lg' : ''}`}>Cores escuras ideais para a noite.</p>
            </div>
            <button onClick={() => updateProfile({ darkMode: !isDark })} className={`scroll-btn whitespace-nowrap ${profile.easyMode ? 'py-3 px-6 text-lg' : ''}`} onMouseEnter={() => falarTexto(isDark ? "Ativar modo claro" : "Ativar modo escuro")}>
               {isDark ? <Sun size={profile.easyMode ? 28 : 20} /> : <Moon size={profile.easyMode ? 28 : 20} />} {isDark ? 'Modo Claro' : 'Modo Escuro'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <strong className={profile.easyMode ? 'text-lg' : ''}>Modo Fácil (Acessibilidade)</strong>
              <p className={`text-text-muted ${profile.easyMode ? 'text-lg' : ''}`}>Ativa leitura de voz e aumenta botões.</p>
            </div>
            <input 
              type="checkbox" checked={profile.easyMode} className={`${profile.easyMode ? 'w-8 h-8' : 'w-6 h-6'}`}
              onChange={e => updateProfile({ easyMode: e.target.checked })}
              onMouseEnter={() => falarTexto(profile.easyMode ? "Desativar modo fácil" : "Ativar modo fácil")}
            />
          </div>

          <div className="border-t-2 border-gray-200 pt-6">
             {confirmLogout ? (
               <div className="text-center">
                 <p className="font-bold text-danger mb-4">Irá eliminar todas as suas configurações deste dispositivo. Continuar?</p>
                 <div className="flex gap-3">
                   <button onClick={() => setConfirmLogout(false)} className="btn-cuida btn-secondary flex-1">Cancelar</button>
                   <button onClick={logoutAccount} className="btn-cuida btn-primary flex-1 bg-danger">Confirmar Sair</button>
                 </div>
               </div>
             ) : (
               <button onClick={() => setConfirmLogout(true)} className="btn-cuida btn-secondary text-danger border-danger">Eliminar Conta Deste Dispositivo</button>
             )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAiAssistant = () => (
    <div className="app-container w-full px-4 sm:px-6 md:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex-gap" style={{ marginBottom: '32px' }}>
          <button onClick={() => { setCurrentView('home'); setAiResult(''); }} className="scroll-btn" style={{ padding: '12px' }}><ArrowLeft size={24} /></button>
          <h1>Assistente de Saúde ✨</h1>
        </div>

        <div className="scroll-row" style={{ marginBottom: '24px' }}>
          <button onClick={() => { setAiTab('explain'); setAiResult(''); }} className={`scroll-btn ${aiTab === 'explain' ? 'active' : ''}`}>Remédios 💊</button>
          <button onClick={() => { setAiTab('org'); setAiResult(''); }} className={`scroll-btn ${aiTab === 'org' ? 'active' : ''}`}>Organização 🏡</button>
          <button onClick={() => { setAiTab('health'); setAiResult(''); }} className={`scroll-btn ${aiTab === 'health' ? 'active' : ''}`}>Saúde Geral 🍎</button>
          <button onClick={() => { setAiTab('general'); setAiResult(''); }} className={`scroll-btn ${aiTab === 'general' ? 'active' : ''}`}>Perguntas Gerais 💬</button>
          <button onClick={() => { setAiTab('tip'); setAiResult(''); }} className={`scroll-btn ${aiTab === 'tip' ? 'active' : ''}`}>Dica Diária 💡</button>
        </div>

        <div className="card-cuida" style={{ minHeight: '300px' }}>
          {aiTab === 'explain' && (
             <div className="form-field">
                <label>Decifrar Medicamento</label>
                <input 
                  type="text" className="input-cuida" placeholder="Ex: Losartana"
                  value={medicationName} onChange={e => setMedicationName(e.target.value)}
                />
                <button onClick={() => askGeminiWithMode('explain', medicationName)} disabled={aiLoading} className="btn-cuida btn-primary" style={{ marginTop: '16px' }}>
                  {aiLoading ? <Loader2 className="animate-spin" /> : 'Explicar Remédio'}
                </button>
             </div>
          )}

          {aiTab === 'org' && (
             <div style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: '16px' }}>Arrumação e Segurança Doméstica</h3>
                <button onClick={() => askGeminiWithMode('org')} disabled={aiLoading} className="btn-cuida btn-primary" style={{ width: 'auto' }}>
                  {aiLoading ? <Loader2 className="animate-spin" /> : 'Sugerir Dica de Organização'}
                </button>
             </div>
          )}

          {aiTab === 'health' && (
             <div style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: '16px' }}>Conselhos Gerais de Saúde</h3>
                <button onClick={() => askGeminiWithMode('health')} disabled={aiLoading} className="btn-cuida btn-primary" style={{ width: 'auto' }}>
                  {aiLoading ? <Loader2 className="animate-spin" /> : 'Ver Conselho Preventivo'}
                </button>
             </div>
          )}

          {aiTab === 'general' && (
             <div className="form-field">
                <label>A sua Pergunta à IA</label>
                <input 
                  type="text" className="input-cuida" placeholder="Escreva a sua dúvida..."
                  value={generalQuestion} onChange={e => setGeneralQuestion(e.target.value)}
                />
                <button onClick={() => askGeminiWithMode('general', generalQuestion)} disabled={aiLoading} className="btn-cuida btn-primary" style={{ marginTop: '16px' }}>
                  {aiLoading ? <Loader2 className="animate-spin" /> : 'Perguntar'}
                </button>
             </div>
          )}

          {aiTab === 'tip' && (
             <div style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: '16px' }}>Dica Carinhosa do Dia</h3>
                <button onClick={() => askGeminiWithMode('tip')} disabled={aiLoading} className="btn-cuida btn-primary" style={{ width: 'auto' }}>
                  {aiLoading ? <Loader2 className="animate-spin" /> : 'Gerar Mensagem de Apoio'}
                </button>
             </div>
          )}

          {aiResult && (
             <div style={{ marginTop: '24px', padding: '20px', borderRadius: 'var(--radius)', backgroundColor: 'var(--purple-light)', border: '2px solid var(--purple)', color: 'var(--purple-text)' }}>
                <p style={{ fontSize: '1.25rem', lineHeight: '1.5' }}>{aiResult}</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderFloatingSOS = () => {
    if (currentView === 'onboarding' || currentView === 'loading' || profile.role !== 'patient') return null;
    return (
      <button onClick={() => showToast("A ligar para o S.O.S...")}
        className="sos-floating"
        title="Botão de Emergência">
        <Phone size={48} />
      </button>
    );
  };

  // Simple in-app toast renderer (fallback). Uses `toastMessage` state set by `showToast()`.
  const renderToast = () => {
    if (!toastMessage) return null;
    return (
      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', padding: '10px 16px', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.12)', zIndex: 9999 }}>
        {toastMessage}
      </div>
    );
  };

  return (
    <div className={`app-view-wrapper`}>
      {currentView === 'onboarding' && renderOnboarding()}
      {currentView === 'home' && renderHome()}
      {currentView === 'add' && renderAddReminder()}
      {currentView === 'schedule' && renderSchedule()}
      {currentView === 'family' && renderFamily()}
      {currentView === 'settings' && renderSettings()}
      {currentView === 'editProfile' && renderEditProfile()}
      {currentView === 'aiAssistant' && renderAiAssistant()}
      {currentView === 'chat' && renderChat()}

      {/* Alerta Overlay quando o Remédio Toca */}
      {activeAlert && (
         <div className="alert-overlay">
            <div className="alert-modal animate-slide-up">
               <div className="alert-icon-ring"><Pill size={64} /></div>
               <h1>Atenção, {profile.name}</h1>
               <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Chegou a hora do seu compromisso:</p>
               <div className="alert-highlight-box">
                  <h2 style={{ fontSize: '2rem' }}>{activeAlert.title}</h2>
                  {activeAlert.detail && <p style={{ marginTop: '8px' }}>{activeAlert.detail}</p>}
                  <strong style={{ display: 'block', marginTop: '16px', color: 'var(--primary)', fontSize: '1.4rem' }}>{activeAlert.time}</strong>
               </div>
               <div style={{ display: 'flex', gap: '16px' }}>
                  <button onClick={() => postponeAlert()} className="btn-cuida btn-secondary" style={{ flex: 1 }}>Adiar 10m</button>
                  <button onClick={() => markAsDone(activeAlert)} className="btn-cuida btn-primary" style={{ flex: 1 }}>Concluir ✅</button>
               </div>
            </div>
         </div>
      )}

      {/* Widget SOS Flutuante */}
      {renderFloatingSOS()}
      {renderToast()}
    </div>
  );
}