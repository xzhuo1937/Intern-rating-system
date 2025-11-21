import React, { useState, useMemo } from 'react';
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

export default function App() {
  const [interns, setInterns] = useState<Intern[]>(INITIAL_INTERNS);
  const [selectedInternId, setSelectedInternId] = useState<string>(INITIAL_INTERNS[0].id);
  
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
          aiSummary: undefined // Clear old summary as data changed
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

  const handleGenerateSummary = async () => {
    if (!selectedIntern) return;
    setIsGeneratingAI(true);
    const summary = await generateInternSummary(selectedIntern);
    setInterns(prev => prev.map(i => i.id === selectedIntern.id ? { ...i, aiSummary: summary } : i));
    setIsGeneratingAI(false);
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
                aiSummary: undefined // Clear AI summary as data changed
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
                className={`group relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border-2 ${
                  isSelected 
                    ? 'bg-white/10 border-indigo-500/50 shadow-lg' 
                    : 'bg-white/5 border-transparent hover:bg-white/10 hover:scale-[1.02]'
                }`}
              >
                <div className={`flex items-center justify-center w-7 h-7 rounded-lg font-black text-sm ${
                   isTop ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-yellow-500/50' : 
                   isBottom ? 'bg-slate-700 text-slate-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {index + 1}
                </div>
                
                <div className="relative">
                  <img 
                    src={getAvatarUrl(intern.avatarId)} 
                    alt="Avatar" 
                    className="w-12 h-12 rounded-full bg-slate-200 border-2 border-white/20"
                  />
                  {isTop && <div className="absolute -top-2 -right-1 text-lg">👑</div>}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h3 className={`font-bold truncate text-sm ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {intern.name}
                    </h3>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                        {intern.joinDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full shadow-sm ${
                            intern.average >= 8 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 
                            intern.average <= 5 ? 'bg-gradient-to-r from-red-500 to-pink-600' : 
                            'bg-gradient-to-r from-indigo-400 to-blue-500'
                        }`} 
                        style={{ width: `${intern.average * 10}%` }}
                      />
                    </div>
                    <span className={`text-xs font-black ${
                        intern.average >= 8 ? 'text-green-400' : 
                        intern.average <= 5 ? 'text-red-400' : 
                        'text-indigo-400'
                    }`}>
                      {intern.average}
                    </span>
                  </div>
                </div>

                {/* Delete button (Admin Only) */}
                {isAdmin && (
                  <button 
                    onClick={(e) => handleDeleteIntern(intern.id, e)}
                    title="删除成员"
                    className="absolute right-2 top-8 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition z-10"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Admin Login Toggle */}
        <div className="p-4 border-t border-white/5 flex justify-center">
          {isAdmin ? (
            <button 
              onClick={() => setIsAdmin(false)} 
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 opacity-50 hover:opacity-100 transition"
            >
              <LogOut size={12} /> 退出管理员
            </button>
          ) : (
            <button 
              onClick={() => setIsAdminModalOpen(true)} 
              className="text-xs text-slate-600 hover:text-slate-400 flex items-center gap-1 transition"
            >
              <Lock size={12} /> 管理员登录
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-slate-900">
        {/* Decorative background blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[10%] left-[10%] w-72 h-72 bg-blue-600/20 rounded-full blur-3xl"></div>
        </div>

        {selectedIntern ? (
          <div className="relative z-10 max-w-6xl mx-auto p-6 md:p-10">
            
            {/* Header Card */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl relative group/header">
              {isAdmin && (
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="absolute top-4 right-4 md:top-6 md:right-6 text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition opacity-0 group-hover/header:opacity-100"
                    title="编辑资料"
                  >
                    <Pencil size={18} />
                  </button>
              )}

              <div className="flex items-center gap-6">
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                    <img 
                      src={getAvatarUrl(selectedIntern.avatarId)} 
                      className="relative w-24 h-24 rounded-full border-4 border-white/20 bg-slate-100 shadow-2xl transform group-hover:scale-105 transition object-cover"
                    />
                    {isAdmin && (
                      <button 
                        onClick={handleRegenerateAvatar}
                        title="随机切换形象/性别"
                        className="absolute bottom-0 right-0 bg-slate-800 text-white p-1.5 rounded-full shadow border border-white/20 hover:bg-indigo-600 transition z-10"
                      >
                        <RefreshCw size={12} />
                      </button>
                    )}
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-sm flex items-center gap-3">
                    {selectedIntern.name}
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      selectedIntern.gender === 'male' 
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' 
                        : 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                    }`}>
                      {selectedIntern.gender === 'male' ? '♂' : '♀'}
                    </span>
                  </h1>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="bg-indigo-500/20 text-indigo-200 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/30 flex items-center gap-1">
                        <Users size={12} /> {selectedIntern.role}
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                        <Calendar size={12} /> 入职: {selectedIntern.joinDate}
                    </span>
                    <span className="bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full text-xs font-bold border border-slate-600 flex items-center gap-1">
                        📝 {selectedIntern.evaluations.length} 条评价
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsEvalModalOpen(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-500/30 transition transform hover:-translate-y-1 hover:shadow-xl flex items-center gap-2 min-w-[160px] justify-center"
              >
                <Zap size={20} fill="currentColor" /> 去打分
              </button>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Radar Chart Card (Left - 5 cols) */}
              <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-white/10 shadow-lg flex flex-col">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Activity size={20} className="text-indigo-400"/> 五维能力雷达
                </h3>
                <div className="flex-1 min-h-[300px] relative">
                    {averageScores ? (
                    <StatsRadar averageScores={averageScores} />
                    ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 font-medium">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-3">
                             <Activity className="opacity-30" size={32}/>
                        </div>
                        暂无数据，快去打分吧！
                    </div>
                    )}
                </div>
              </div>

              {/* Right Column (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* AI Card */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-1 border border-white/10 shadow-lg">
                  <div className="bg-slate-900/50 rounded-[22px] p-6 h-full backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles size={18} className="text-yellow-400 fill-yellow-400" /> AI 综合评价
                        </h3>
                        <button 
                        onClick={handleGenerateSummary}
                        disabled={isGeneratingAI || !averageScores}
                        className="text-xs bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 px-4 py-1.5 rounded-full transition disabled:opacity-50 font-bold"
                        >
                        {isGeneratingAI ? '正在分析...' : '生成分析报告'}
                        </button>
                    </div>
                    
                    <div className="text-sm text-slate-300 leading-relaxed bg-slate-950/30 p-4 rounded-xl border border-white/5 min-h-[100px]">
                        {selectedIntern.aiSummary ? (
                        <p className="animate-in fade-in slide-in-from-bottom-2 duration-500 whitespace-pre-wrap">{selectedIntern.aiSummary}</p>
                        ) : (
                        <p className="text-slate-500 italic text-center py-4">点击右上角按钮，AI 导师将根据五维数据生成犀利点评。</p>
                        )}
                    </div>
                  </div>
                </div>

                {/* Recent Reviews List */}
                <div className="glass-panel rounded-3xl p-6 border border-white/10 flex-1 flex flex-col min-h-[300px]">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Users size={18} className="text-emerald-400" /> 近期评价
                  </h3>
                  <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                    {selectedIntern.evaluations.length === 0 && (
                      <div className="text-slate-500 text-sm text-center py-10">这里空空如也，快来给 TA 提点建议吧~</div>
                    )}
                    {selectedIntern.evaluations.map(ev => (
                      <div key={ev.id} className="bg-white/5 hover:bg-white/10 transition p-4 rounded-2xl border border-white/5 relative group">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                                {ev.raterName.charAt(0)}
                             </div>
                             <span className="font-bold text-indigo-200 text-sm">{ev.raterName}</span>
                          </div>
                          <span className="text-slate-500 text-xs font-medium bg-slate-900/50 px-2 py-1 rounded">{new Date(ev.date).toLocaleDateString('zh-CN')}</span>
                        </div>
                        
                        {/* Mini Score Bars */}
                        <div className="grid grid-cols-5 gap-1 mb-3 opacity-80">
                           {(Object.entries(ev.scores) as [string, number][]).map(([key, score]) => (
                              <div key={key} className="flex flex-col gap-1 group/bar">
                                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${score >= 8 ? 'bg-emerald-400' : score <= 4 ? 'bg-rose-400' : 'bg-amber-400'}`} 
                                        style={{ width: `${score*10}%` }}
                                    ></div>
                                </div>
                              </div>
                           ))}
                        </div>

                        <p className="text-slate-300 text-sm bg-black/20 p-3 rounded-xl italic">
                            "{ev.comment || "暂无评论"}"
                        </p>

                        {/* Admin: Delete Evaluation */}
                        {isAdmin && (
                          <button 
                            onClick={() => handleDeleteEvaluation(ev.id)}
                            title="删除评价"
                            className="absolute top-2 right-2 p-1.5 bg-slate-800/80 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 relative z-10">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Users size={48} className="opacity-50" />
            </div>
            <p className="text-lg font-medium">请在左侧选择一名实习生查看详情</p>
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