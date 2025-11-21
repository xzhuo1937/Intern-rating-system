import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trophy, Sparkles, Users, Trash2, Activity, Zap, Calendar, Lock, LogOut, RefreshCw, Pencil } from 'lucide-react';
import { Intern, Evaluation, CriteriaKey, Gender } from './types';
import { StatsRadar } from './components/StatsRadar';
import { EvaluationModal } from './components/EvaluationModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AddInternModal } from './components/AddInternModal';
import { EditInternModal } from './components/EditInternModal';
import { generateInternSummary } from './services/geminiService';

// Helper to generate Q-style Asian avatars (using Adventurer style with specific seeds/features)
const getAvatarUrl = (avatarId: string) => {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${avatarId}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
};

const INITIAL_INTERNS: Intern[] = [
  {
    id: '1',
    name: '宋佳颖',
    role: '设计助理',
    joinDate: '11月20日',
    gender: 'female',
    avatarId: 'songjiaying_v1', 
    evaluations: [
      {
        id: 'e1',
        raterName: 'Lisa (设计)',
        date: '2023-11-25',
        scores: { communication: 8, efficiency: 9, selfLearning: 7, attitude: 9, quality: 8 },
        comment: '出图速度很快，审美在线！'
      }
    ]
  },
  {
    id: '2',
    name: '翁源Oric',
    role: '运营支持',
    joinDate: '11月20日',
    gender: 'male',
    avatarId: 'wengyuan_v2', 
    evaluations: [
      {
        id: 'e2',
        raterName: 'Mike (运营)',
        date: '2023-11-26',
        scores: { communication: 9, efficiency: 5, selfLearning: 6, attitude: 7, quality: 6 },
        comment: '性格很好，但是Excel处理有点慢，需要多教几次。'
      }
    ]
  }
];

const STORAGE_KEY = 'intern_stats_data_v1';

export default function App() {
  // Initialize interns from local storage or fallback to initial data
  const [interns, setInterns] = useState<Intern[]>(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      return savedData ? JSON.parse(savedData) : INITIAL_INTERNS;
    } catch (error) {
      console.error("Failed to load data from storage", error);
      return INITIAL_INTERNS;
    }
  });

  const [selectedInternId, setSelectedInternId] = useState<string>(() => {
    // Try to preserve selection or default to first
    return interns.length > 0 ? interns[0].id : '';
  });
  
  // Modals
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // States
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const selectedIntern = useMemo(() => 
    interns.find(i => i.id === selectedInternId), 
  [interns, selectedInternId]);

  // Persist data whenever interns state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(interns));
  }, [interns]);

  // Ensure selectedInternId is valid (in case data loaded from storage has different IDs or was deleted)
  useEffect(() => {
    if (interns.length > 0 && !interns.find(i => i.id === selectedInternId)) {
      setSelectedInternId(interns[0].id);
    }
  }, [interns, selectedInternId]);

  // Calculate average scores for the selected intern
  const averageScores: Record<CriteriaKey, number> | null = useMemo(() => {
    if (!selectedIntern || selectedIntern.evaluations.length === 0) return null;
    
    const totals = {
      communication: 0,
      efficiency: 0,
      selfLearning: 0,
      attitude: 0,
      quality: 0,
    };

    selectedIntern.evaluations.forEach(ev => {
      (Object.keys(totals) as CriteriaKey[]).forEach(key => {
        totals[key] += ev.scores[key];
      });
    });

    const count = selectedIntern.evaluations.length;
    const averages: any = {};
    (Object.keys(totals) as CriteriaKey[]).forEach(key => {
      averages[key] = parseFloat((totals[key] / count).toFixed(1));
    });

    return averages;
  }, [selectedIntern]);

  // Auto-generate AI summary if missing
  useEffect(() => {
    let isMounted = true;

    const autoGenerate = async () => {
      if (selectedIntern && 
          !selectedIntern.aiSummary && 
          selectedIntern.evaluations.length > 0 && 
          !isGeneratingAI
      ) {
        setIsGeneratingAI(true);
        try {
          const summary = await generateInternSummary(selectedIntern);
          if (isMounted) {
            setInterns(prev => prev.map(i => i.id === selectedIntern.id ? { ...i, aiSummary: summary } : i));
          }
        } catch (error) {
          console.error("Auto-generation failed", error);
        } finally {
          if (isMounted) setIsGeneratingAI(false);
        }
      }
    };

    autoGenerate();

    return () => { isMounted = false; };
  }, [selectedInternId, selectedIntern?.evaluations, selectedIntern?.aiSummary]);

  // Calculate global ranking based on total average score
  const rankedInterns = useMemo(() => {
    return [...interns].map(intern => {
      if (intern.evaluations.length === 0) return { ...intern, average: 0 };
      const sum = intern.evaluations.reduce((acc, ev) => {
        return acc + Object.values(ev.scores).reduce((a: number, b: number) => a + b, 0);
      }, 0);
      // Normalize to 0-10 scale
      const avg = (sum / (intern.evaluations.length * 5)); 
      return { ...intern, average: parseFloat(avg.toFixed(1)) };
    }).sort((a, b) => b.average - a.average);
  }, [interns]);

  const handleAddEvaluation = (evalData: Omit<Evaluation, 'id' | 'date'>) => {
    if (!selectedIntern) return;
    
    const newEvaluation: Evaluation = {
      ...evalData,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };

    setInterns(prev => prev.map(intern => {
      if (intern.id === selectedInternId) {
        return {
          ...intern,
          evaluations: [newEvaluation, ...intern.evaluations],
          aiSummary: undefined // Clear old summary as data changed, triggers useEffect to regenerate
        };
      }
      return intern;
    }));
  };

  const handleAddIntern = (name: string, role: string, gender: Gender, joinDate: string) => {
    const newIntern: Intern = {
      id: Date.now().toString(),
      name,
      role,
      gender,
      joinDate: joinDate,
      // Use timestamp + name to create unique seed, append gender specific suffix for manual tuning if needed
      avatarId: `${name}_${Date.now()}`, 
      evaluations: []
    };
    setInterns([...interns, newIntern]);
    setSelectedInternId(newIntern.id);
  };

  const handleUpdateIntern = (id: string, updates: Partial<Intern>) => {
    setInterns(prev => prev.map(intern => {
      if (intern.id === id) {
        return { ...intern, ...updates };
      }
      return intern;
    }));
  };

  const handleForceGenerateSummary = async () => {
    if (!selectedIntern) return;
    setIsGeneratingAI(true);
    try {
      const summary = await generateInternSummary(selectedIntern);
      setInterns(prev => prev.map(i => i.id === selectedIntern.id ? { ...i, aiSummary: summary } : i));
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleDeleteIntern = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    if (window.confirm('确定要移除这位实习生吗？')) {
      const newInterns = interns.filter(i => i.id !== id);
      setInterns(newInterns);
      if (selectedInternId === id && newInterns.length > 0) {
        setSelectedInternId(newInterns[0].id);
      }
    }
  };

  const handleDeleteEvaluation = (evalId: string) => {
    if (!selectedIntern || !isAdmin) return;
    if (window.confirm('确定要删除这条评价吗？')) {
      setInterns(prev => prev.map(intern => {
        if (intern.id === selectedInternId) {
            return {
                ...intern,
                evaluations: intern.evaluations.filter(e => e.id !== evalId),
                aiSummary: undefined // Clear AI summary to trigger regeneration
            };
        }
        return intern;
      }));
    }
  };

  const handleRegenerateAvatar = () => {
    if (!selectedIntern || !isAdmin) return;
    
    // Toggle gender or just refresh seed
    const newGender = selectedIntern.gender === 'female' ? 'male' : 'female';
    const newSeed = Math.random().toString(36).substring(7);

    setInterns(prev => prev.map(i => {
      if (i.id === selectedIntern.id) {
        return { ...i, gender: newGender, avatarId: newSeed };
      }
      return i;
    }));
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden font-sans bg-[#0f172a] text-slate-200">
      
      {/* Sidebar: Leaderboard & Selection */}
      <aside className="w-full md:w-80 bg-slate-900/80 backdrop-blur-xl border-r border-white/5 flex flex-col h-screen z-20 shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-gradient-to-b from-indigo-900/20 to-transparent">
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 italic">
            <Trophy className="text-yellow-400 fill-yellow-400" />
            实习生<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">排行榜</span>
          </h1>
          <p className="text-slate-400 text-xs mt-2 font-medium opacity-80">🔥 末位淘汰挑战进行中...</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex justify-between items-center mb-2 px-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">成员列表 ({rankedInterns.length})</span>
            {isAdmin && (
              <button 
                onClick={() => setIsAddModalOpen(true)} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-full font-bold transition shadow-lg shadow-indigo-500/20 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} strokeWidth={3} /> 新增
              </button>
            )}
          </div>

          {rankedInterns.map((intern, index) => {
            const isSelected = intern.id === selectedInternId;
            const isTop = index === 0;
            const isBottom = index === rankedInterns.length - 1 && rankedInterns.length > 1;
            
            return (
              <div 
                key={intern.id}
                onClick={() => setSelectedInternId(intern.id)}
                className={`relative p-3 rounded-xl cursor-pointer transition-all duration-300 border group ${
                  isSelected 
                    ? 'bg-white/10 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]' 
                    : 'bg-slate-800/30 border-transparent hover:bg-slate-800/60 hover:border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                    isTop ? 'bg-yellow-400 text-yellow-900' : 
                    index === 1 ? 'bg-slate-300 text-slate-900' :
                    index === 2 ? 'bg-amber-700 text-amber-100' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {index + 1}
                  </div>
                  
                  <img 
                    src={getAvatarUrl(intern.avatarId)} 
                    alt={intern.name}
                    className="w-10 h-10 rounded-full bg-indigo-100 border border-white/10"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-bold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {intern.name}
                      </h3>
                      <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                         <Calendar size={10} /> {intern.joinDate}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-slate-500 truncate max-w-[80px]">{intern.role}</span>
                      <span className={`text-xs font-mono font-bold ${
                        intern.average >= 8 ? 'text-green-400' : intern.average <= 5 ? 'text-red-400' : 'text-indigo-400'
                      }`}>
                        {intern.average}分
                      </span>
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <button 
                      onClick={(e) => handleDeleteIntern(intern.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                      title="移除成员"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {isBottom && (
                    <div className="absolute -right-1 -top-1">
                         <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/5">
          {!isAdmin ? (
            <button 
              onClick={() => setIsAdminModalOpen(true)}
              className="w-full py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition flex items-center justify-center gap-2 text-sm font-bold"
            >
              <Lock size={16} /> 管理员登录
            </button>
          ) : (
            <div className="flex gap-2">
                <div className="flex-1 bg-indigo-900/30 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-300 text-xs font-bold">
                    已获管理员权限
                </div>
                <button 
                  onClick={() => setIsAdmin(false)}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                  title="退出管理模式"
                >
                  <LogOut size={18} />
                </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto h-screen scroll-smooth p-4 md:p-8 lg:p-12">
        {selectedIntern ? (
          <div className="max-w-5xl mx-auto space-y-8 pb-20">
            
            {/* Header Card */}
            <div className="bg-slate-800/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              
              {/* Avatar Section */}
              <div className="relative group shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl">
                  <img 
                    src={getAvatarUrl(selectedIntern.avatarId)} 
                    alt={selectedIntern.name}
                    className="w-full h-full rounded-full bg-indigo-50" 
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full border border-slate-700 shadow-lg flex items-center gap-1">
                  {selectedIntern.gender === 'female' ? '♀' : '♂'} {selectedIntern.role}
                </div>
                {isAdmin && (
                  <div className="absolute top-0 right-0 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={handleRegenerateAvatar}
                        className="p-2 bg-slate-800 text-white rounded-full hover:bg-indigo-600 shadow-lg border border-white/10"
                        title="更换/刷新头像"
                    >
                        <RefreshCw size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="flex-1 text-center md:text-left w-full">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight flex items-center gap-3 justify-center md:justify-start">
                      {selectedIntern.name}
                      {isAdmin && (
                        <button 
                          onClick={() => setIsEditModalOpen(true)}
                          className="text-slate-500 hover:text-indigo-400 transition"
                        >
                          <Pencil size={20} />
                        </button>
                      )}
                    </h1>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                      <span className="px-3 py-1 rounded-lg bg-slate-700/50 text-slate-300 text-sm font-medium border border-white/5 flex items-center gap-1.5">
                        <Calendar size={14} className="text-indigo-400"/> 入职: {selectedIntern.joinDate}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-slate-700/50 text-slate-300 text-sm font-medium border border-white/5 flex items-center gap-1.5">
                        <Activity size={14} className="text-emerald-400"/> 收到评价: {selectedIntern.evaluations.length}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsEvalModalOpen(true)}
                    className="bg-white hover:bg-indigo-50 text-indigo-900 px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/10 transition transform hover:-translate-y-1 active:translate-y-0 flex items-center gap-2"
                  >
                    <Sparkles size={18} />
                    写评价
                  </button>
                </div>

                {/* AI Summary - Auto Generated */}
                <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-2xl p-5 border border-indigo-500/20 relative group">
                  <div className="flex items-center gap-2 mb-2 text-indigo-300 font-bold text-sm uppercase tracking-wider">
                    <Zap size={16} className="fill-indigo-300" /> AI 综合画像
                    {selectedIntern.aiSummary && (
                        <button 
                            onClick={handleForceGenerateSummary}
                            disabled={isGeneratingAI}
                            className="ml-auto p-1.5 text-indigo-400 hover:text-white hover:bg-indigo-500/20 rounded-lg transition disabled:opacity-50"
                            title="重新生成评价"
                        >
                            <RefreshCw size={14} className={isGeneratingAI ? 'animate-spin' : ''} />
                        </button>
                    )}
                  </div>
                  <div className="text-indigo-100 leading-relaxed text-sm md:text-base min-h-[60px]">
                    {isGeneratingAI ? (
                      <div className="space-y-2 animate-pulse">
                        <div className="h-4 bg-indigo-500/20 rounded w-3/4"></div>
                        <div className="h-4 bg-indigo-500/20 rounded w-full"></div>
                        <div className="h-4 bg-indigo-500/20 rounded w-5/6"></div>
                      </div>
                    ) : (
                      selectedIntern.aiSummary || (
                         <span className="text-indigo-400/60 italic">等待足够数据生成分析...</span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats & History Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              
              {/* Radar Chart */}
              <div className="bg-slate-800/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Activity className="text-indigo-400" /> 能力雷达
                </h3>
                <div className="flex-1 flex items-center justify-center min-h-[300px]">
                  {averageScores ? (
                    <StatsRadar averageScores={averageScores} />
                  ) : (
                    <div className="text-slate-500 text-center py-12">
                      <div className="text-4xl mb-4">📊</div>
                      暂无评分数据
                    </div>
                  )}
                </div>
              </div>

              {/* History List */}
              <div className="bg-slate-800/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex flex-col h-[500px]">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Users className="text-purple-400" /> 评价记录
                </h3>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {selectedIntern.evaluations.length > 0 ? (
                    selectedIntern.evaluations.map(evaluation => (
                      <div key={evaluation.id} className="bg-slate-700/30 border border-white/5 rounded-xl p-4 hover:bg-slate-700/50 transition group relative">
                         {isAdmin && (
                            <button 
                                onClick={() => handleDeleteEvaluation(evaluation.id)}
                                className="absolute top-3 right-3 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="删除评价"
                            >
                                <Trash2 size={14} />
                            </button>
                         )}
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-300">{evaluation.raterName}</span>
                            <span className="text-xs text-slate-500">{evaluation.date.split('T')[0]}</span>
                          </div>
                          <div className="flex gap-1">
                            {Object.entries(evaluation.scores).slice(0,3).map(([key, score]) => (
                              <span key={key} className={`text-[10px] px-1.5 py-0.5 rounded ${
                                score >= 8 ? 'bg-green-500/20 text-green-400' : 'bg-slate-600 text-slate-300'
                              }`}>
                                {score}
                              </span>
                            ))}
                            {Object.keys(evaluation.scores).length > 3 && <span className="text-[10px] text-slate-500 px-1">...</span>}
                          </div>
                        </div>
                        {evaluation.comment && (
                          <p className="text-slate-300 text-sm leading-relaxed">"{evaluation.comment}"</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-500 py-10">
                      <p>还没有人评价过 TA 呢 ~</p>
                      <button 
                        onClick={() => setIsEvalModalOpen(true)}
                        className="mt-4 text-indigo-400 text-sm hover:underline"
                      >
                        抢沙发
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <div className="text-6xl mb-4 opacity-50">👋</div>
            <p className="text-xl">请选择一位实习生查看详情</p>
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedIntern && (
        <>
          <EvaluationModal 
            isOpen={isEvalModalOpen} 
            onClose={() => setIsEvalModalOpen(false)} 
            onSubmit={handleAddEvaluation}
            internName={selectedIntern.name}
          />
          <EditInternModal 
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            initialData={selectedIntern}
            onSubmit={handleUpdateIntern}
          />
        </>
      )}
      
      <AdminLoginModal 
        isOpen={isAdminModalOpen} 
        onClose={() => setIsAdminModalOpen(false)} 
        onLogin={() => setIsAdmin(true)} 
      />

      <AddInternModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSubmit={handleAddIntern} 
      />
    </div>
  );
}