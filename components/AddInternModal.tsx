import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Gender } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, role: string, gender: Gender, joinDate: string) => void;
}

export const AddInternModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('实习生');
  const [gender, setGender] = useState<Gender>('female');
  
  // Default to today's date in YYYY-MM-DD format
  const [dateInput, setDateInput] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      // Format date from YYYY-MM-DD to M月D日 for display consistency
      const [y, m, d] = dateInput.split('-');
      const formattedDate = `${parseInt(m)}月${parseInt(d)}日`;

      onSubmit(name, role, gender, formattedDate);
      
      // Reset fields
      setName('');
      setRole('实习生');
      
      // Reset date to today
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      setDateInput(`${year}-${month}-${day}`);
      
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserPlus size={20} /> 新增成员
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
              placeholder="例如: 李小明"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">职位</label>
                <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>
            <div className="w-1/3">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">性别</label>
                <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none scheme-dark"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-4 bg-white text-indigo-900 hover:bg-indigo-50 py-3 rounded-lg font-bold transition shadow-lg"
          >
            确认添加
          </button>
        </form>
      </div>
    </div>
  );
};