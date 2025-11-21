import React, { useState, useEffect } from 'react';
import { X, UserCog } from 'lucide-react';
import { Intern, Gender } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData: Intern;
  onSubmit: (id: string, updates: Partial<Intern>) => void;
}

export const EditInternModal: React.FC<Props> = ({ isOpen, onClose, initialData, onSubmit }) => {
  const [name, setName] = useState(initialData.name);
  const [role, setRole] = useState(initialData.role);
  const [gender, setGender] = useState<Gender>(initialData.gender);
  
  // Helper to parse "11月20日" back to YYYY-MM-DD for input
  const parseDateStr = (str: string) => {
    const match = str.match(/(\d+)月(\d+)日/);
    if (match) {
      const now = new Date();
      const year = now.getFullYear();
      const month = match[1].padStart(2, '0');
      const day = match[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return new Date().toISOString().split('T')[0];
  };

  const [dateInput, setDateInput] = useState(parseDateStr(initialData.joinDate));

  // Update state when initialData changes (e.g. switching interns while modal is open, though usually modal closes first)
  useEffect(() => {
    if (isOpen) {
        setName(initialData.name);
        setRole(initialData.role);
        setGender(initialData.gender);
        setDateInput(parseDateStr(initialData.joinDate));
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      // Format date from YYYY-MM-DD to M月D日
      const [y, m, d] = dateInput.split('-');
      const formattedDate = `${parseInt(m)}月${parseInt(d)}日`;

      const updates: Partial<Intern> = {
        name,
        role,
        gender,
        joinDate: formattedDate
      };
      
      // If gender changed, we should probably trigger a new avatar seed in the parent
      // to avoid a male-looking avatar for a female gender or vice versa.
      // We'll handle that logic here by checking if gender changed.
      if (gender !== initialData.gender) {
         updates.avatarId = `${name}_${Date.now()}`; // Force regen
      }

      onSubmit(initialData.id, updates);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCog size={20} /> 编辑资料
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">姓名</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">职位</label>
                <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
            </div>
            <div className="w-1/3">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">性别</label>
                <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                >
                    <option value="female">女生</option>
                    <option value="male">男生</option>
                </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">入职日期</label>
            <input 
                type="date"
                required
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none scheme-dark"
            />
          </div>

          <div className="pt-2 text-xs text-slate-500">
            提示: 修改性别会自动生成新的头像。
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold transition shadow-lg"
          >
            保存修改
          </button>
        </form>
      </div>
    </div>
  );
};