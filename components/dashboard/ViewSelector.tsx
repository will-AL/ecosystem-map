'use client';

import { useRef, useState } from 'react';
import { DashboardView } from '@/lib/types';
import { ChevronDown, Plus, Save } from 'lucide-react';

interface ViewSelectorProps {
  views: DashboardView[];
  activeViewId: string;
  onViewChange: (viewId: string) => void;
  onSaveView: (view: Partial<DashboardView>) => void;
  onSaveAsNew: (name: string) => void;
  onDeleteView: (viewId: string) => void;
  onRenameView: (viewId: string, newName: string) => void;
  onDuplicateView: (viewId: string) => void;
}

export default function ViewSelector({
  views,
  activeViewId,
  onViewChange,
  onSaveView,
  onSaveAsNew,
  onDeleteView,
  onRenameView,
  onDuplicateView,
}: ViewSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeView = views.find((v) => v.id === activeViewId) || views[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface2)] transition-all"
        >
          {activeView?.name || 'View'}
          <ChevronDown size={14} className={isOpen ? 'rotate-180' : ''} />
        </button>
        <button
          onClick={() => onSaveView({})}
          className="p-1.5 text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--accentSoft)] rounded-lg transition-all"
        >
          <Save size={16} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-1 text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider mb-1">
            Saved Views
          </div>
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => {
                onViewChange(view.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-all ${
                view.id === activeViewId
                  ? 'bg-[var(--accentSoft)] text-[var(--accent)] font-bold'
                  : 'text-[var(--text)] hover:bg-[var(--surface2)]'
              }`}
            >
              {view.name}
            </button>
          ))}
          <div className="h-px bg-[var(--border)] my-2 mx-2" />
          <button
            onClick={() => {
              const name = prompt('New view name:');
              if (name) onSaveAsNew(name);
              setIsOpen(false);
            }}
            className="w-full text-left px-5 py-2 text-xs font-bold text-[var(--accent)] hover:bg-[var(--accentSoft)] transition-all flex items-center gap-2"
          >
            <Plus size={14} /> Save as New View
          </button>
        </div>
      )}
    </div>
  );
}
