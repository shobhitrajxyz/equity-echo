import React from 'react';
import { DrawingToolType } from '../types/chart';

interface DrawingSidebarProps {
  activeTool: DrawingToolType;
  onSelectTool: (tool: DrawingToolType) => void;
  isMagnetActive: boolean;
  onToggleMagnet: () => void;
  areDrawingsVisible: boolean;
  onToggleDrawingsVisibility: () => void;
  onClearAllDrawings: () => void;
  isDarkMode: boolean;
}

export const DrawingSidebar: React.FC<DrawingSidebarProps> = ({
  activeTool,
  onSelectTool,
  isMagnetActive,
  onToggleMagnet,
  areDrawingsVisible,
  onToggleDrawingsVisibility,
  onClearAllDrawings,
  isDarkMode,
}) => {
  const getToolBtnClass = (tool: DrawingToolType) => {
    const isSelected = activeTool === tool;
    if (isSelected) {
      return isDarkMode
        ? 'bg-blue-600/30 text-blue-400 border-blue-500/50'
        : 'bg-blue-100 text-blue-600 border-blue-300';
    }
    return isDarkMode
      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100';
  };

  return (
    <aside
      className={`w-12 border-r flex flex-col items-center py-2 select-none z-20 shrink-0 ${
        isDarkMode ? 'bg-[#1a1f2c] border-[#2a3142]' : 'bg-white border-slate-200'
      }`}
    >
      {/* 1. Cursor Select Tool (Default) */}
      <button
        onClick={() => onSelectTool('none')}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
          activeTool === 'none'
            ? 'bg-blue-500/20 text-blue-500 font-bold shadow-sm'
            : getToolBtnClass('none')
        }`}
        title="Cursor / Select Mode"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={activeTool === 'none' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          <path d="M13 13l6 6" />
        </svg>
      </button>

      <div className="w-6 h-[1px] bg-slate-700/40 my-1.5" />

      {/* 2. Trend Line */}
      <button
        onClick={() => onSelectTool('trendline')}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${getToolBtnClass('trendline')}`}
        title="Trend Line Tool"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="19" x2="19" y2="5" />
          <circle cx="5" cy="19" r="2.5" fill="currentColor" />
          <circle cx="19" cy="5" r="2.5" fill="currentColor" />
        </svg>
      </button>

      {/* 3. Horizontal Line */}
      <button
        onClick={() => onSelectTool('horizontal')}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${getToolBtnClass('horizontal')}`}
        title="Horizontal Line Tool"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" />
        </svg>
      </button>

      {/* 4. Rectangle / Box Tool */}
      <button
        onClick={() => onSelectTool('rectangle')}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${getToolBtnClass('rectangle')}`}
        title="Rectangle / Box Tool"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="1" />
          <circle cx="4" cy="4" r="2" fill="currentColor" />
          <circle cx="20" cy="4" r="2" fill="currentColor" />
          <circle cx="20" cy="20" r="2" fill="currentColor" />
          <circle cx="4" cy="20" r="2" fill="currentColor" />
        </svg>
      </button>

      {/* 5. Parallel Channel */}
      <button
        onClick={() => onSelectTool('channel')}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${getToolBtnClass('channel')}`}
        title="Parallel Channel Tool"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="14" x2="16" y2="6" />
          <line x1="8" y1="18" x2="20" y2="10" />
          <circle cx="4" cy="14" r="1.8" fill="currentColor" />
          <circle cx="16" cy="6" r="1.8" fill="currentColor" />
          <circle cx="8" cy="18" r="1.8" fill="currentColor" />
          <circle cx="20" cy="10" r="1.8" fill="currentColor" />
        </svg>
      </button>

      {/* 6. Ray / Arrow Pitchfork */}
      <button
        onClick={() => onSelectTool('ray')}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${getToolBtnClass('ray')}`}
        title="Ray / Arrow Tool"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 19L19 5" />
          <path d="M12 5h7v7" />
        </svg>
      </button>

      {/* 7. Brush / Pen Tool */}
      <button
        onClick={() => onSelectTool('brush')}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${getToolBtnClass('brush')}`}
        title="Freehand Brush Tool"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <circle cx="5" cy="5" r="1" fill="currentColor" />
        </svg>
      </button>

      {/* 8. Text Tool */}
      <button
        onClick={() => onSelectTool('text')}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${getToolBtnClass('text')}`}
        title="Text Annotation Tool"
      >
        <span className="font-serif font-bold text-base leading-none">T</span>
      </button>

      <div className="w-6 h-[1px] bg-slate-700/40 my-1.5" />

      {/* 9. Icons Submenu Dropdown Arrow */}
      <button
        className={`w-9 h-6 rounded flex items-center justify-center transition-all ${
          isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
        }`}
        title="Shapes & Emojis"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div className="w-6 h-[1px] bg-slate-700/40 my-1.5" />

      {/* 10. Ruler / Measure Tool */}
      <button
        onClick={() => onSelectTool('measure')}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${getToolBtnClass('measure')}`}
        title="Ruler / Measurement Tool"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="7" width="18" height="10" rx="2" transform="rotate(-30 12 12)" />
          <line x1="7" y1="9" x2="8.5" y2="11.5" />
          <line x1="11" y1="7" x2="12.5" y2="9.5" />
          <line x1="15" y1="5" x2="16.5" y2="7.5" />
        </svg>
      </button>

      <div className="w-6 h-[1px] bg-slate-700/40 my-1.5" />

      {/* 11. Magnet Mode Tool */}
      <button
        onClick={onToggleMagnet}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
          isMagnetActive
            ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40'
            : isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
        }`}
        title={`Magnet Mode (${isMagnetActive ? 'ON' : 'OFF'}) - Snaps to OHLC values`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 15v-7a6 6 0 1 1 12 0v7" />
          <path d="M6 15h4v4H6z" />
          <path d="M14 15h4v4h-4z" />
        </svg>
      </button>

      {/* 12. Hide / Show Drawings (Eye) */}
      <button
        onClick={onToggleDrawingsVisibility}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
          !areDrawingsVisible
            ? 'bg-rose-500/20 text-rose-400 font-bold'
            : isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
        }`}
        title={areDrawingsVisible ? 'Hide Drawings' : 'Show Drawings'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {areDrawingsVisible ? (
            <>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </>
          ) : (
            <>
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </>
          )}
        </svg>
      </button>

      {/* 13. Trash / Delete All Drawings */}
      <button
        onClick={onClearAllDrawings}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
          isDarkMode ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
        }`}
        title="Clear All Drawings"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>
    </aside>
  );
};
