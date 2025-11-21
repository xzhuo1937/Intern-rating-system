import React, { useState } from 'react';
import { CriteriaKey, CRITERIA_LABELS, Evaluation } from '../types';
import { X, Save, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (evalData: Omit<Evaluation, 'id' | 'date'>) => void;
  internName: string;
}

export const EvaluationModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, internName }) => {
  const [raterName, setRaterName] = useState('');
  const [scores, setScores] = useState<Record<CriteriaKey, number>>({
    [CriteriaKey.COMMUNICATION]: 6,
    [CriteriaKey.EFFICIENCY]: 6,
    [CriteriaKey.SELF_LEARNING]: 6,
    [CriteriaKey.ATTITUDE]: 6,
    [CriteriaKey.QUALITY]: 6,
  });
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleRangeChange = (key: CriteriaKey, value: string) => {
    setScores(prev => ({ ...prev, [key]: parseInt(value, 10) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      raterName: raterName || '匿名同事',
      scores,
      comment
    });
    setRaterName('');
    setComment('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-slate-900/90 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-300" /> 
            <span>评价: {internName}</span>
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition p-1 hover:bg-white/10 rounded-full">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rater Info */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">你的昵称 (需求部门)</label>
            <input
              type="text"
              required
              value={raterName}
              onChange={e => setRaterName(e.target.value)}
              placeholder="例如: 设计部-阿强"
              className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder-slate-500"
            />
          </div>

          {/* Sliders */}
          <div className="space-y-5">
            {(Object.entries(CRITERIA_LABELS) as [CriteriaKey, string][]).map(([key, label]) => (
              <div key={key} className="bg-slate-800/30 p-3 rounded-xl border border-white/5">
                <div className="flex justify-between mb-2 items-center">
                  <label className="text-sm font-bold text-slate-200">{label}</label>
                  <span className={`text-sm font-black px-2 py-0.5 rounded ${
                    scores[key] >= 8 ? 'bg-green-500/20 text-green-400' : scores[key] <= 4 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {scores[key]} 分
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={scores[key]}
                  onChange={(e) => handleRangeChange(key, e.target.value)}
                  className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
                />
              </div>
            ))}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">一句话简评 (选填)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="TA的表现有什么亮点或槽点？"
              className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-white h-24 resize-none focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder-slate-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl font-bold transition shadow-lg shadow-purple-500/30 flex justify-center items-center gap-2"
            >
              <Save size={18} />
              提交评分
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};