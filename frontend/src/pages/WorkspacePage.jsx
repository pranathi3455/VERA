import React, { useState } from 'react';
import {
  FolderOpen,
  FileText,
  FileUp,
  Bookmark,
  Calendar,
  Plus,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  Trash2
} from 'lucide-react';

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState('Files');
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [uploading, setUploading] = useState(false);

  const tabs = ['Files', 'Notes', 'Saved Insights', 'Plans'];

  const handleFileUpload = (e) => {
    const uploaded = Array.from(e.target.files || []);
    if (uploaded.length === 0) return;
    setUploading(true);
    setTimeout(() => {
      setFiles((prev) => [
        ...prev,
        ...uploaded.map((f) => ({
          name: f.name,
          size: `${(f.size / 1024).toFixed(1)} KB`,
          date: new Date().toLocaleDateString()
        }))
      ]);
      setUploading(false);
    }, 500);
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNotes((prev) => [
      { text: newNote.trim(), date: new Date().toLocaleTimeString() },
      ...prev
    ]);
    setNewNote('');
  };

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#17213D] tracking-tight">
          Workspace
        </h1>
        <p className="text-xs sm:text-sm text-[#5E6882]">
          Organize your research, files and ideas.
        </p>
      </div>

      {/* Tabs Row (Files, Notes, Saved Insights, Plans) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-xs font-semibold shrink-0 transition-all ${
                active
                  ? 'bg-[#EEF0FD] text-[#7B61FF] border border-[#DDD6FE]'
                  : 'bg-white text-[#5E6882] border border-[#E2E6F5] hover:bg-[#F8F9FE]'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Files */}
      {activeTab === 'Files' && (
        <>
          {files.length === 0 ? (
            /* Empty State Matching Screen 7 */
            <div className="min-h-[420px] bg-white/80 rounded-3xl border border-[#E2E6F5] flex flex-col items-center justify-center p-8 text-center space-y-4 shadow-sm">
              <div className="w-20 h-20 rounded-2xl bg-[#EEF0FD] border border-[#DDD6FE] flex items-center justify-center text-[#7B61FF] shadow-sm">
                <FolderOpen className="w-10 h-10" />
              </div>

              <div className="space-y-1.5 max-w-md">
                <h2 className="text-xl font-bold text-[#17213D] tracking-tight">
                  Your workspace is empty
                </h2>
                <p className="text-xs text-[#5E6882] leading-relaxed">
                  Upload files, save notes and organize your research for better decisions.
                </p>
              </div>

              <label className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#7B61FF] to-[#6366F1] hover:from-[#6D52F7] hover:to-[#5558E6] text-white text-xs font-semibold shadow-md shadow-indigo-500/20 cursor-pointer transition-all">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>+ Upload a file</span>
                <input type="file" multiple className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5E6882]">
                  {files.length} uploaded files in workspace
                </span>
                <label className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#EEF0FD] text-[#7B61FF] text-xs font-semibold cursor-pointer hover:bg-[#E0E7FF] transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Upload more
                  <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((f, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-[#E2E6F5] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#EEF0FD] text-[#7B61FF] flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#17213D] truncate max-w-[150px]">{f.name}</p>
                        <p className="text-[10px] text-[#7C849A]">{f.size} • {f.date}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                      className="p-1.5 text-[#7C849A] hover:text-[#A87979] rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab 2: Notes */}
      {activeTab === 'Notes' && (
        <div className="bg-white rounded-3xl p-6 border border-[#E2E6F5] space-y-4 shadow-sm">
          <form onSubmit={handleAddNote} className="space-y-3">
            <textarea
              rows={3}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Jot down a quick note, constraint, or hypothesis..."
              className="w-full p-4 rounded-2xl bg-[#F8F9FE] border border-[#D5DAEA] focus:border-[#7B61FF] focus:bg-white text-xs text-[#17213D] focus:outline-none transition-all"
            />
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#6366F1] text-white text-xs font-semibold shadow-sm"
            >
              Add Note
            </button>
          </form>

          {notes.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-[#F0F2FA]">
              {notes.map((n, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#F8F9FE] border border-[#E2E6F5] flex items-center justify-between text-xs">
                  <span className="text-[#17213D]">{n.text}</span>
                  <span className="text-[10px] text-[#7C849A]">{n.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Saved Insights */}
      {activeTab === 'Saved Insights' && (
        <div className="bg-white rounded-3xl p-8 border border-[#E2E6F5] text-center space-y-3 shadow-sm">
          <Bookmark className="w-8 h-8 text-[#7B61FF] mx-auto" />
          <h3 className="text-sm font-bold text-[#17213D]">No saved insights yet</h3>
          <p className="text-xs text-[#5E6882] max-w-sm mx-auto">
            Pin trade-off summaries and risk assessments from decision results to view them here anytime.
          </p>
        </div>
      )}

      {/* Tab 4: Plans */}
      {activeTab === 'Plans' && (
        <div className="bg-white rounded-3xl p-8 border border-[#E2E6F5] text-center space-y-3 shadow-sm">
          <Calendar className="w-8 h-8 text-[#7B61FF] mx-auto" />
          <h3 className="text-sm font-bold text-[#17213D]">No implementation plans</h3>
          <p className="text-xs text-[#5E6882] max-w-sm mx-auto">
            Once a decision alternative is selected, generate an actionable rollout roadmap and track milestones here.
          </p>
        </div>
      )}
    </div>
  );
}
