import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, Trash2, ClipboardList, Download, FileSpreadsheet, FileJson, FileText, ChevronDown } from 'lucide-react';
import { HistoryRecord } from '../../types';
import { formatTime } from '../../lib/utils';
import * as XLSX from 'xlsx';

interface HistoryViewProps {
  history: HistoryRecord[];
  onClear: () => void;
  key?: string;
}

export function HistoryView({ history, onClear }: HistoryViewProps) {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const formatDataForExport = () => {
    return history.map(record => ({
      'Date': new Date(record.startTime).toLocaleDateString(),
      'Time': new Date(record.startTime).toLocaleTimeString(),
      'Routine Name': record.routineName,
      'Reps Completed': record.repsCompleted,
      'Total Reps': record.totalReps,
      'Work Interval (s)': record.workTime,
      'Rest Interval (s)': record.restTime,
      'Total Session Time': formatTime(record.totalElapsed),
      'Total Seconds': record.totalElapsed,
      'Interrupted': record.wasPaused ? 'Yes' : 'No',
      'Pause Count': record.pausedCount,
      'Terminated Early': record.wasTerminated ? 'Yes' : 'No',
      'End Date': new Date(record.endTime).toLocaleDateString(),
      'End Time': new Date(record.endTime).toLocaleTimeString(),
    }));
  };

  const exportToExcel = () => {
    const data = formatDataForExport();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Journal");
    XLSX.writeFile(workbook, `tabatamode_journal_${new Date().toISOString().split('T')[0]}.xlsx`);
    setIsExportMenuOpen(false);
  };

  const exportToCSV = () => {
    const data = formatDataForExport();
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','))
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tabatamode_journal_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const exportToJSON = () => {
    const data = JSON.stringify(history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tabatamode_journal_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  return (
    <div className="p-8 lg:p-12 max-w-6xl mx-auto w-full">
      <header className="flex flex-col gap-4 mb-12">
        <div className="flex items-center justify-between">
          <h2 className="text-6xl lg:text-[8rem] font-display uppercase italic tracking-tighter leading-none">
            LOGS
          </h2>
          
          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <div className="relative">
                <button 
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="px-6 py-3 bg-zinc-900 border border-zinc-800 text-white rounded font-bold uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all flex items-center gap-2 group"
                >
                  <Download size={16} className="text-neon-lime group-hover:translate-y-0.5 transition-transform" />
                  Export
                  <ChevronDown size={14} className={`transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isExportMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsExportMenuOpen(false)} 
                      />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-48 bg-zinc-950 border border-zinc-900 rounded shadow-2xl z-20 overflow-hidden"
                      >
                        <button 
                          onClick={exportToExcel}
                          className="w-full px-4 py-3 text-left hover:bg-neon-lime/10 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                        >
                          <FileSpreadsheet size={16} className="text-neon-lime" /> Excel (.xlsx)
                        </button>
                        <button 
                          onClick={exportToCSV}
                          className="w-full px-4 py-3 text-left hover:bg-neon-lime/10 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                        >
                          <FileText size={16} className="text-neon-lime" /> CSV (.csv)
                        </button>
                        <button 
                          onClick={exportToJSON}
                          className="w-full px-4 py-3 text-left hover:bg-neon-lime/10 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                        >
                          <FileJson size={16} className="text-neon-lime" /> JSON (.json)
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            {history.length > 0 && (
              <div className="flex items-center gap-3">
                {showClearConfirm ? (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={onClear} 
                      className="px-6 py-3 bg-crimson-red text-white rounded font-bold uppercase tracking-widest text-xs transition-all shadow-lg shadow-crimson-red/20"
                    >
                      Confirm Wipe?
                    </button>
                    <button 
                      onClick={() => setShowClearConfirm(false)} 
                      className="px-6 py-3 bg-zinc-900 border border-zinc-800 text-white rounded font-bold uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowClearConfirm(true)} 
                    className="px-6 py-3 bg-crimson-red/10 border border-crimson-red/20 text-crimson-red rounded font-bold uppercase tracking-widest text-xs hover:bg-crimson-red hover:text-white transition-all flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Wipe Database
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-xs">Session telemetry database</p>
      </header>

      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-900 border-dashed rounded-lg p-20 flex flex-col items-center justify-center text-zinc-700">
            <ClipboardList size={48} className="mb-4 opacity-20" />
            <p className="font-mono text-xs uppercase tracking-widest font-bold">No Records Found</p>
          </div>
        ) : (
          history.slice().reverse().map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-zinc-950 border border-zinc-900 rounded-lg overflow-hidden group hover:border-zinc-800 transition-colors"
            >
              <div className="flex flex-col md:flex-row items-stretch md:items-center p-6 gap-6">
                <div className="flex flex-col gap-1 min-w-[200px]">
                  <span className="text-neon-lime font-mono text-xs font-bold uppercase tracking-widest">
                    {new Date(record.startTime).toLocaleDateString()}
                  </span>
                  <p className="text-white font-display text-3xl uppercase italic tracking-tighter">
                    {record.routineName}
                  </p>
                  <div className="flex gap-2">
                    {record.wasTerminated && (
                      <span className="text-sm font-bold text-white uppercase tracking-widest">Terminated</span>
                    )}
                    {record.wasPaused && (
                      <span className="text-sm font-bold text-white uppercase tracking-widest">
                        {record.pausedCount} Interruptions
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white uppercase tracking-[0.2em] mb-1">Outcome</span>
                    <span className="text-2xl font-mono text-white tabular-nums font-bold">
                      {record.repsCompleted} / {record.totalReps} <span className="text-xs text-zinc-700">RD</span>
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white uppercase tracking-[0.2em] mb-1">Configuration</span>
                    <span className="text-2xl font-mono text-white tabular-nums">{record.workTime} / {record.restTime} <span className="text-xs text-zinc-700">SEC</span></span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white uppercase tracking-[0.2em] mb-1">Total Time</span>
                    <span className="text-2xl font-mono text-white tabular-nums font-bold">
                      {formatTime(record.totalElapsed)}
                    </span>
                  </div>
                  <div className="flex flex-col justify-center items-end">
                    <div className="px-3 py-1 bg-zinc-900 rounded text-xs font-bold text-zinc-400 uppercase tracking-widest border border-zinc-800">
                      Telemetry_Synced
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
