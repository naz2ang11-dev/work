import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, get } from 'firebase/database';
import Sortable from 'sortablejs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  Users, 
  Briefcase, 
  Settings, 
  LogOut, 
  Plus, 
  RotateCcw, 
  Play, 
  Save, 
  Printer, 
  Trash2, 
  Lock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Star,
  GripVertical,
  Calendar as CalendarIcon
} from 'lucide-react';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD9ZpyfttAuALb0NUuNOVsV5u8D984t0s",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "person1work.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://person1work-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "person1work",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "person1work.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "54816920239",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:54816920239:web:483a9c62a69017b94917ca"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

interface Student {
  id: number;
  name: string;
  authCode: string;
  priority: number;
}

interface Job {
  name: string;
  desc: string;
  limit: number;
  salary: number | string;
  condition?: string;
  students: string[];
}

export default function App() {
  const priorityZonesRef = useRef<(HTMLDivElement | null)[]>([]);
  const [activeTab, setActiveTab] = useState<'apply' | 'salary' | 'jobs' | 'admin'>('apply');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminPassword, setAdminPassword] = useState('1234');
  const [adminInput, setAdminInput] = useState('');
  const [intendedTab, setIntendedTab] = useState<'jobs' | 'admin' | null>(null);

  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [currentJobs, setCurrentJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Record<string, string[]>>({});
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  
  const [showJobForm, setShowJobForm] = useState(false);
  const [newJob, setNewJob] = useState({ name: '', desc: '', limit: 1, salary: 400, condition: '' });
  
  const [applyForm, setApplyForm] = useState({ studentId: '', authCode: '', prefs: ['', '', '', '', ''] });
  const [statusMsg, setStatusMsg] = useState({ text: '시스템 가동 중...', color: '#00c853' });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean, title: string, msg: string, onConfirm: () => void } | null>(null);

  const dropZonesRef = useRef<(HTMLDivElement | null)[]>([]);
  const waitingListRef = useRef<HTMLDivElement | null>(null);
  const priorityListRef = useRef<HTMLDivElement | null>(null);
  const sortableInstances = useRef<Sortable[]>([]);

  // Calculate total capacity
  const totalCapacity = currentJobs.reduce((sum, job) => sum + (Number(job.limit) || 0), 0);

  useEffect(() => {
    // Initial data fetch
    const studentsRef = ref(db, 'class_job_data/students');
    onValue(studentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setStudentsData(data);
      } else {
        // Default students if none exist
        const defaultStudents = [
          { id: 1, name: "강서진", authCode: "1234", priority: 3 }, { id: 2, name: "강준서", authCode: "1234", priority: 3 },
          { id: 3, name: "공유진", authCode: "1234", priority: 3 }, { id: 4, name: "김려완", authCode: "1234", priority: 3 },
          { id: 5, name: "김민결", authCode: "1234", priority: 3 }, { id: 6, name: "김민서", authCode: "1234", priority: 3 },
          { id: 7, name: "김상원", authCode: "1234", priority: 3 }, { id: 8, name: "김승호", authCode: "1234", priority: 3 },
          { id: 9, name: "김시현", authCode: "1234", priority: 3 }, { id: 10, name: "김채민", authCode: "1234", priority: 3 },
          { id: 11, name: "노슬우", authCode: "1234", priority: 3 }, { id: 12, name: "박나율", authCode: "1234", priority: 3 },
          { id: 13, name: "박라희", authCode: "1234", priority: 3 }, { id: 14, name: "박예은", authCode: "1234", priority: 3 },
          { id: 15, name: "신시은", authCode: "1234", priority: 3 }, { id: 16, name: "신예은", authCode: "1234", priority: 3 },
          { id: 17, name: "신하주", authCode: "1234", priority: 3 }, { id: 18, name: "염세현", authCode: "1234", priority: 3 },
          { id: 19, name: "우아영", authCode: "1234", priority: 3 }, { id: 20, name: "이다은", authCode: "1234", priority: 3 },
          { id: 21, name: "이서준", authCode: "1234", priority: 3 }, { id: 22, name: "이승열", authCode: "1234", priority: 3 },
          { id: 23, name: "이하늘", authCode: "1234", priority: 3 }, { id: 24, name: "임경한", authCode: "1234", priority: 3 },
          { id: 25, name: "정예설", authCode: "1234", priority: 3 }, { id: 26, name: "최세현", authCode: "1234", priority: 3 },
          { id: 27, name: "함지원", authCode: "1234", priority: 3 }
        ];
        setStudentsData(defaultStudents);
      }
    });

    const adminPwRef = ref(db, 'class_config/adminPassword');
    onValue(adminPwRef, (snapshot) => {
      if (snapshot.exists()) setAdminPassword(snapshot.val());
    });
  }, []);

  useEffect(() => {
    // Fetch jobs and applications for the selected date
    const historyRef = ref(db, `job_history/${selectedYear}_${selectedMonth}`);
    onValue(historyRef, (snapshot) => {
      const data = snapshot.val() || {};
      const jobs = data.jobs || [];
      setApplications(data.applications || {});
      
      if (jobs.length === 0) {
        get(ref(db, 'class_job_data/jobs')).then((s) => {
          const template = s.val() || [];
          setCurrentJobs(template.map((j: any) => ({ ...j, students: j.students || [] })));
        });
      } else {
        setCurrentJobs(jobs.map((j: any) => ({ ...j, students: j.students || [] })));
      }
    });
  }, [selectedYear, selectedMonth]);

  // Priority Drag & Drop Initialization
  useEffect(() => {
    if (activeTab === 'admin' && isAuthorized) {
      const sortables: Sortable[] = [];
      
      // Initialize 5 priority zones
      for (let i = 1; i <= 5; i++) {
        const el = priorityZonesRef.current[i];
        if (el) {
          const s = new Sortable(el, {
            group: 'priority-students',
            animation: 150,
            ghostClass: 'bg-blue-50',
            onEnd: (evt) => {
              // 1. Read the new state from DOM before undoing
              const newState: {id: number, priority: number}[] = [];
              for (let p = 1; p <= 5; p++) {
                const zone = priorityZonesRef.current[p];
                if (zone) {
                  Array.from(zone.children).forEach(child => {
                    const htmlChild = child as HTMLElement;
                    const id = Number(htmlChild.getAttribute('data-id'));
                    if (id) newState.push({ id, priority: p });
                  });
                }
              }

              // 2. Undo the DOM change immediately to prevent React from crashing
              if (evt.from !== evt.to) {
                evt.from.appendChild(evt.item);
              } else if (evt.newIndex !== undefined && evt.oldIndex !== undefined) {
                const children = Array.from(evt.from.children);
                if (evt.oldIndex < children.length) {
                  evt.from.insertBefore(evt.item, children[evt.oldIndex]);
                } else {
                  evt.from.appendChild(evt.item);
                }
              }

              // 3. Update state in a timeout to be safe
              setTimeout(() => {
                setStudentsData(prev => {
                  let changed = false;
                  const next = prev.map(s => {
                    const update = newState.find(item => item.id === s.id);
                    if (update && (s.priority || 3) !== update.priority) {
                      changed = true;
                      return { ...s, priority: update.priority };
                    }
                    return s;
                  });
                  return changed ? next : prev;
                });
              }, 0);
            }
          });
          sortables.push(s);
        }
      }

      return () => sortables.forEach(s => s.destroy());
    }
  }, [activeTab, isAuthorized]);

  // Handle SortableJS initialization for Jobs
  useEffect(() => {
    if (activeTab === 'jobs' && isAuthorized) {
      // Clear previous instances
      sortableInstances.current.forEach(inst => inst.destroy());
      sortableInstances.current = [];

      const options: Sortable.Options = {
        group: 'shared',
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: (evt) => {
          // 1. Read new state from DOM
          const newJobStudents: string[][] = dropZonesRef.current.map(dz => {
            if (!dz) return [];
            return Array.from(dz.children).map(child => {
              const htmlChild = child as HTMLElement;
              const num = htmlChild.querySelector('.tag-num')?.textContent;
              const name = htmlChild.querySelector('.tag-name')?.textContent;
              return `${num} ${name}`;
            });
          });

          // 2. Undo DOM change
          if (evt.from !== evt.to) {
            evt.from.appendChild(evt.item);
          } else if (evt.newIndex !== undefined && evt.oldIndex !== undefined) {
            const children = Array.from(evt.from.children);
            if (evt.oldIndex < children.length) {
              evt.from.insertBefore(evt.item, children[evt.oldIndex]);
            } else {
              evt.from.appendChild(evt.item);
            }
          }

          // 3. Update state
          setTimeout(() => {
            setCurrentJobs(prevJobs => {
              const next = prevJobs.map((job, idx) => ({
                ...job,
                students: newJobStudents[idx] || []
              }));
              return next;
            });
          }, 0);
        }
      };

      dropZonesRef.current.forEach(dz => {
        if (dz) sortableInstances.current.push(new Sortable(dz, options));
      });

      if (waitingListRef.current) {
        sortableInstances.current.push(new Sortable(waitingListRef.current, options));
      }
    }
    
    return () => {
      sortableInstances.current.forEach(inst => inst.destroy());
      sortableInstances.current = [];
    };
  }, [activeTab, isAuthorized, currentJobs.length]);

  const showMsg = (text: string, color = "#00c853") => {
    setStatusMsg({ text, color });
    setTimeout(() => setStatusMsg({ text: "시스템 동기화 완료", color: "#00c853" }), 3000);
  };

  const handleTabSwitch = (tab: any) => {
    if (tab === 'admin' || tab === 'jobs') {
      if (isAuthorized) {
        setActiveTab(tab);
      } else {
        setIntendedTab(tab);
        setActiveTab('admin'); // Show auth screen
      }
    } else {
      setActiveTab(tab);
    }
  };

  const checkAdminAuth = () => {
    if (adminInput === adminPassword) {
      setIsAuthorized(true);
      setAdminInput('');
      if (intendedTab) {
        setActiveTab(intendedTab);
        setIntendedTab(null);
      }
    } else {
      showMsg("비밀번호 불일치", "#ff5252");
    }
  };

  const logoutAdmin = () => {
    setIsAuthorized(false);
    setActiveTab('apply');
  };

  const addNewJob = () => {
    if (!newJob.name) return;
    const updated = [...currentJobs, { ...newJob, students: [] }];
    setCurrentJobs(updated);
    setShowJobForm(false);
    setNewJob({ name: '', desc: '', limit: 1, salary: 400, condition: '' });
  };

  const changeLimit = (idx: number, delta: number) => {
    const updated = [...currentJobs];
    updated[idx].limit = Math.max(0, (updated[idx].limit || 0) + delta);
    setCurrentJobs(updated);
  };

  const requestAutoAssign = () => {
    setConfirmModal({
      show: true,
      title: "배정 시작",
      msg: "자동 배정할까요? 우선순위가 같을 경우 무작위로 배정됩니다.",
      onConfirm: () => {
        let tempJobs = JSON.parse(JSON.stringify(currentJobs));
        tempJobs.forEach((j: any) => j.students = []);
        
        // Shuffle students first to handle equal priorities randomly
        const shuffledStudents = [...studentsData].sort(() => Math.random() - 0.5);
        
        // Sort by priority level (1: Highest, 5: Lowest)
        const studentsToAssign = shuffledStudents.sort((a, b) => (a.priority || 3) - (b.priority || 3));
        
        studentsToAssign.forEach(s => {
          const nameTag = `${s.id} ${s.name}`;
          const app = applications[s.id] || [];
          let assigned = false;
          
          // Try to assign based on preferences
          for (let wish of app) {
            let job = tempJobs.find((j: any) => j.name === wish && (j.students || []).length < j.limit);
            if (job) {
              job.students.push(nameTag);
              assigned = true;
              break;
            }
          }
          
          // If not assigned by preference, assign to any available job
          if (!assigned) {
            let available = tempJobs.filter((j: any) => (j.students || []).length < j.limit);
            if (available.length > 0) {
              // Shuffle available jobs to randomize when capacities are equal
              available.sort(() => Math.random() - 0.5);
              // Pick the job with the most remaining spots
              available.sort((a: any, b: any) => (b.limit - b.students.length) - (a.limit - a.students.length));
              available[0].students.push(nameTag);
              assigned = true;
            }
          }
        });
        
        setCurrentJobs(tempJobs);
        setConfirmModal(null);
        showMsg("무작위 자동 배정 완료!");
      }
    });
  };

  const saveToFirebase = () => {
    const historyRef = ref(db, `job_history/${selectedYear}_${selectedMonth}/jobs`);
    set(historyRef, currentJobs).then(() => showMsg("저장 성공!"));
  };

  const submitApplication = () => {
    const student = studentsData.find(s => s.id === Number(applyForm.studentId));
    if (!student || student.authCode !== applyForm.authCode) {
      return showMsg("인증 정보 오류", "#ff5252");
    }
    
    const validPrefs = applyForm.prefs.filter(p => p !== '');
    if (validPrefs.length === 0) return showMsg("직업을 선택하세요.", "orange");
    
    const appRef = ref(db, `job_history/${selectedYear}_${selectedMonth}/applications/${applyForm.studentId}`);
    set(appRef, validPrefs).then(() => {
      showMsg("지원 완료!");
      setApplyForm({ ...applyForm, authCode: '', prefs: ['', '', '', '', ''] });
    });
  };

  const printJobResults = () => {
    const doc = new jsPDF();
    
    // Add font support for Korean if needed (using default for now)
    doc.setFontSize(20);
    doc.text(`${selectedYear} Year ${selectedMonth} Month Class Job Assignment Results`, 105, 15, { align: 'center' });
    
    const tableData = currentJobs.map(job => [
      job.name,
      job.desc,
      job.limit.toString(),
      job.students.join(', '),
      job.salary.toString(),
      job.condition || ''
    ]);

    (doc as any).autoTable({
      startY: 25,
      head: [['Job', 'Description', 'Limit', 'Students', 'Salary', 'Condition']],
      body: tableData,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 123, 255] }
    });

    doc.save(`job_results_${selectedYear}_${selectedMonth}.pdf`);
    showMsg("PDF 저장 완료");
  };

  const renderStudentTag = (fullName: string) => {
    const [num, ...nameParts] = fullName.split(' ');
    const name = nameParts.join(' ');
    return (
      <div key={fullName} className="student-tag flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing">
        <span className="bg-slate-100 text-slate-500 px-2 py-1 text-[10px] font-bold border-r border-slate-200 tag-num">{num}</span>
        <span className="px-3 py-1 text-xs font-semibold text-slate-700 tag-name">{name}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] p-4 font-sans text-[#333]">
      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border-t-4 border-[#007bff] animate-in fade-in zoom-in duration-200">
            <h3 className="mb-2 text-lg font-bold text-[#2c3e50]">{confirmModal.title}</h3>
            <p className="text-sm text-[#666] leading-relaxed">{confirmModal.msg}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                className="rounded-lg border border-[#e0e6ed] px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                onClick={() => setConfirmModal(null)}
              >
                취소
              </button>
              <button 
                className="rounded-lg bg-[#007bff] px-4 py-2 text-sm font-medium text-white hover:bg-[#0069d9] transition-colors"
                onClick={confirmModal.onConfirm}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mx-auto max-w-[1250px] mb-4 flex justify-end gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'apply', label: '🙋 학생 지원창', icon: Users },
          { id: 'salary', label: '💰 직업 확인', icon: Briefcase },
          { id: 'jobs', label: '📅 직업 배정', icon: CalendarIcon },
          { id: 'admin', label: '⚙️ 관리자 설정', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabSwitch(tab.id)}
            className={`flex items-center gap-2 rounded-t-xl border border-[#e0e6ed] px-5 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id || (tab.id === 'admin' && activeTab === 'admin' && !isAuthorized)
                ? 'bg-white text-[#007bff] border-b-white z-10 -mb-[1px]' 
                : 'bg-slate-50 text-[#666] hover:bg-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <main className="mx-auto max-w-[1250px] min-h-[650px] rounded-2xl bg-white p-6 shadow-lg border border-[#e0e6ed]">
        
        {/* Tab: Apply */}
        {activeTab === 'apply' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left: Apply Form */}
            <div className="w-full max-w-[550px] mx-auto rounded-[30px] border-t-8 border-[#007bff] bg-white p-8 shadow-xl">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e3f2fd] text-[#007bff]">
                  <Users size={40} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-[#1a237e]">STUDENT APPLY</h2>
                <p className="mt-2 text-sm text-[#718096]">이름을 선택하고 본인의 인증번호를 입력하세요.</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#a0aec0]">CHOOSE YOUR NAME</label>
                  <select 
                    className="w-full rounded-xl border-2 border-[#edf2f7] bg-[#f8fafc] p-3.5 text-sm outline-none transition-all focus:border-[#007bff] focus:bg-white"
                    value={applyForm.studentId}
                    onChange={(e) => setApplyForm({ ...applyForm, studentId: e.target.value })}
                  >
                    <option value="">본인 선택</option>
                    {studentsData.map(s => (
                      <option key={s.id} value={s.id}>{s.id} {s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#a0aec0]">YOUR VERIFICATION CODE</label>
                  <input 
                    type="password" 
                    placeholder="인증번호 4자리 입력"
                    className="w-full rounded-xl border-2 border-[#edf2f7] bg-[#f8fafc] p-3.5 text-sm outline-none transition-all focus:border-[#007bff] focus:bg-white"
                    value={applyForm.authCode}
                    onChange={(e) => setApplyForm({ ...applyForm, authCode: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {applyForm.prefs.map((pref, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="text-[10px] font-bold text-[#a0aec0]">{idx + 1}순위 지망</label>
                      <select 
                        className="w-full rounded-xl border-2 border-[#edf2f7] bg-[#f8fafc] p-3 text-sm outline-none transition-all focus:border-[#007bff] focus:bg-white"
                        value={pref}
                        onChange={(e) => {
                          const newPrefs = [...applyForm.prefs];
                          newPrefs[idx] = e.target.value;
                          setApplyForm({ ...applyForm, prefs: newPrefs });
                        }}
                      >
                        <option value="">직업 선택</option>
                        {currentJobs.map(j => (
                          <option key={j.name} value={j.name}>{j.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={submitApplication}
                  className="mt-4 w-full rounded-2xl bg-[#007bff] py-4 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#0069d9] active:translate-y-0"
                >
                  SUBMIT APPLICATION
                </button>
              </div>
            </div>

            {/* Right: Job Info Table */}
            <div className="rounded-2xl border border-[#e0e6ed] bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#2c3e50]">
                <Briefcase size={20} className="text-[#007bff]" />
                직업 정보 안내
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f8f9fa] text-[#666]">
                    <tr>
                      <th className="p-3 font-semibold">직업</th>
                      <th className="p-3 font-semibold">하는 일</th>
                      <th className="p-3 font-semibold text-center">인원</th>
                      <th className="p-3 font-semibold text-right">월급</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentJobs.map((job, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-bold text-[#007bff]">{job.name}</td>
                        <td className="p-3 text-[#666] text-xs">{job.desc}</td>
                        <td className="p-3 font-medium text-center">{job.limit}명</td>
                        <td className="p-3 font-bold text-[#d69e2e] text-right">{job.salary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Salary / Job Confirmation */}
        {activeTab === 'salary' && (
          <div>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#2c3e50]">직업 확인 명부</h1>
                <p className="mt-1 text-sm font-semibold text-[#a0aec0]">{selectedYear}년 {selectedMonth}월 집계 결과</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {studentsData.map(s => {
                const job = currentJobs.find(j => j.students.some(st => st.startsWith(`${s.id} `)));
                return (
                  <div key={s.id} className="group rounded-2xl border border-[#edf2f7] bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                    <div className="mb-1 text-[11px] font-bold text-[#3182ce]">{s.id}번</div>
                    <div className="mb-2 text-lg font-bold text-[#2d3748]">{s.name}</div>
                    <div className="mb-3 inline-block rounded-full border border-[#e2e8f0] bg-[#f7fafc] px-3 py-1 text-[11px] text-[#718096]">
                      {job ? job.name : "미배정"}
                    </div>
                    <div className="text-xl font-extrabold text-[#d69e2e]">
                      {job ? Number(job.salary).toLocaleString() : 0}
                      <small className="ml-0.5 text-xs text-[#a0aec0]">달란트</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Jobs Management */}
        {activeTab === 'jobs' && isAuthorized && (
          <div>
            <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#2c3e50]">학급 직업 관리</h1>
                <div className="mt-2 flex items-center gap-2">
                  <select 
                    className="rounded-lg border border-[#ddd] bg-white px-2 py-1 text-xs font-bold outline-none"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                  >
                    {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>{y}년</option>)}
                  </select>
                  <select 
                    className="rounded-lg border border-[#ddd] bg-white px-2 py-1 text-xs font-bold outline-none"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}월</option>)}
                  </select>
                  <div className="ml-4 flex items-center gap-2 rounded-full bg-[#e3f2fd] px-4 py-1.5 text-sm font-bold text-[#007bff]">
                    <Briefcase size={14} />
                    총 필요 인원: {totalCapacity}명 / 학생 수: {studentsData.length}명
                    {totalCapacity !== studentsData.length && (
                      <AlertCircle size={14} className="text-red-500" />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowJobForm(!showJobForm)} className="flex items-center gap-1.5 rounded-lg border border-[#e0e6ed] px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors">
                  <Plus size={14} /> 직업 추가
                </button>
                <button onClick={requestAutoAssign} className="flex items-center gap-1.5 rounded-lg bg-[#007bff] px-3 py-2 text-xs font-medium text-white hover:bg-[#0069d9] transition-colors">
                  <Play size={14} /> 배정 시작
                </button>
                <button onClick={() => {
                  setConfirmModal({
                    show: true,
                    title: "초기화",
                    msg: "모든 배정을 취소하시겠습니까?",
                    onConfirm: () => {
                      const updated = currentJobs.map(j => ({ ...j, students: [] }));
                      setCurrentJobs(updated);
                      setConfirmModal(null);
                    }
                  });
                }} className="flex items-center gap-1.5 rounded-lg border border-[#e0e6ed] px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors">
                  <RotateCcw size={14} /> 초기화
                </button>
                <button onClick={saveToFirebase} className="flex items-center gap-1.5 rounded-lg bg-[#00bcd4] px-3 py-2 text-xs font-medium text-white hover:bg-[#00acc1] transition-colors">
                  <Save size={14} /> 저장
                </button>
                <button onClick={printJobResults} className="flex items-center gap-1.5 rounded-lg bg-[#00c853] px-3 py-2 text-xs font-medium text-white hover:bg-[#00b24a] transition-colors">
                  <Printer size={14} /> 결과 출력
                </button>
              </div>
            </div>

            {showJobForm && (
              <div className="mb-6 grid grid-cols-2 md:grid-cols-6 gap-2 rounded-xl bg-[#f8f9fa] p-4 border border-[#eee] items-end animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">직업명</label>
                  <input type="text" placeholder="직업명" className="w-full rounded-lg border border-[#ddd] p-2 text-xs outline-none focus:border-[#007bff]" value={newJob.name} onChange={e => setNewJob({...newJob, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">하는 일</label>
                  <input type="text" placeholder="하는 일" className="w-full rounded-lg border border-[#ddd] p-2 text-xs outline-none focus:border-[#007bff]" value={newJob.desc} onChange={e => setNewJob({...newJob, desc: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">인원</label>
                  <input type="number" className="w-full rounded-lg border border-[#ddd] p-2 text-xs outline-none focus:border-[#007bff]" value={newJob.limit} onChange={e => setNewJob({...newJob, limit: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">월급</label>
                  <input type="number" className="w-full rounded-lg border border-[#ddd] p-2 text-xs outline-none focus:border-[#007bff]" value={newJob.salary} onChange={e => setNewJob({...newJob, salary: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">조건</label>
                  <input type="text" placeholder="조건" className="w-full rounded-lg border border-[#ddd] p-2 text-xs outline-none focus:border-[#007bff]" value={newJob.condition} onChange={e => setNewJob({...newJob, condition: e.target.value})} />
                </div>
                <button onClick={addNewJob} className="rounded-lg bg-[#007bff] p-2 text-xs font-bold text-white hover:bg-[#0069d9] transition-colors">추가</button>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-[#e0e6ed]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] text-left text-[12px] text-[#666]">
                    <th className="p-4 border-b font-bold">직업</th>
                    <th className="p-4 border-b font-bold">하는 일</th>
                    <th className="p-4 border-b font-bold text-center">인원</th>
                    <th className="p-4 border-b font-bold bg-[#00a8ff] text-center text-white">담당 학생 (Drag & Drop)</th>
                    <th className="p-4 border-b font-bold text-right">월급</th>
                    <th className="p-4 border-b font-bold">조건</th>
                    <th className="p-4 border-b font-bold text-center">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f0]">
                  {currentJobs.map((job, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3">
                        <div 
                          className="rounded p-1 text-sm font-bold text-[#007bff] hover:bg-white border border-transparent hover:border-slate-200 outline-none"
                          contentEditable 
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const updated = [...currentJobs];
                            updated[idx].name = e.currentTarget.innerText;
                            setCurrentJobs(updated);
                          }}
                        >{job.name}</div>
                      </td>
                      <td className="p-3">
                        <div 
                          className="rounded p-1 text-xs text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 outline-none"
                          contentEditable 
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const updated = [...currentJobs];
                            updated[idx].desc = e.currentTarget.innerText;
                            setCurrentJobs(updated);
                          }}
                        >{job.desc}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => changeLimit(idx, -1)} className="h-6 w-6 rounded-full border border-[#cbd5e1] bg-white text-xs hover:bg-slate-100 flex items-center justify-center">-</button>
                          <span className={`text-sm font-bold ${job.students.length > job.limit ? 'text-red-500' : 'text-slate-700'}`}>
                            {job.limit}
                          </span>
                          <button onClick={() => changeLimit(idx, 1)} className="h-6 w-6 rounded-full border border-[#cbd5e1] bg-white text-xs hover:bg-slate-100 flex items-center justify-center">+</button>
                        </div>
                      </td>
                      <td className="p-3 min-w-[250px]">
                        <div 
                          ref={el => dropZonesRef.current[idx] = el}
                          className="flex min-h-[80px] flex-wrap items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#cbd5e1] bg-slate-50/50 p-3 transition-all hover:border-[#007bff] hover:bg-[#f0f7ff] cursor-default"
                          data-idx={idx}
                        >
                          {job.students.map(renderStudentTag)}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div 
                          className="rounded p-1 text-sm font-bold text-[#d69e2e] hover:bg-white border border-transparent hover:border-slate-200 outline-none"
                          contentEditable 
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const updated = [...currentJobs];
                            updated[idx].salary = e.currentTarget.innerText;
                            setCurrentJobs(updated);
                          }}
                        >{job.salary}</div>
                      </td>
                      <td className="p-3">
                        <div 
                          className="rounded p-1 text-[10px] text-slate-400 hover:bg-white border border-transparent hover:border-slate-200 outline-none"
                          contentEditable 
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const updated = [...currentJobs];
                            updated[idx].condition = e.currentTarget.innerText;
                            setCurrentJobs(updated);
                          }}
                        >{job.condition || ''}</div>
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => {
                            setConfirmModal({
                              show: true,
                              title: "직업 삭제",
                              msg: `'${job.name}' 직업을 삭제하시겠습니까?`,
                              onConfirm: () => {
                                const updated = currentJobs.filter((_, i) => i !== idx);
                                setCurrentJobs(updated);
                                setConfirmModal(null);
                              }
                            });
                          }}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-500">
                <Users size={16} /> 👥 배정 대기 명단 (미배정 학생)
              </h3>
              <div 
                ref={waitingListRef}
                className="flex min-h-[80px] flex-wrap items-center gap-3 rounded-xl p-2 transition-all hover:bg-white/50"
              >
                {studentsData
                  .filter(s => !currentJobs.some(j => j.students.some(st => st.startsWith(`${s.id} `))))
                  .map(s => renderStudentTag(`${s.id} ${s.name}`))
                }
                {studentsData.filter(s => !currentJobs.some(j => j.students.some(st => st.startsWith(`${s.id} `)))).length === 0 && (
                  <div className="w-full text-center py-4 text-slate-400 text-sm">모든 학생이 배정되었습니다.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Admin Auth */}
        {activeTab === 'admin' && !isAuthorized && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-full max-w-[400px] rounded-[35px] bg-white p-12 text-center shadow-2xl border border-slate-100">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                <Lock size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">관리자 인증</h2>
              <p className="mt-2 mb-8 text-sm leading-relaxed text-slate-400">접속을 위해 관리자 비밀번호를 입력하세요.</p>
              <input 
                type="password" 
                placeholder="비밀번호 입력"
                className="mb-5 w-full rounded-2xl bg-slate-50 p-4 text-center text-lg outline-none transition-all focus:bg-slate-100 border border-transparent focus:border-slate-200"
                value={adminInput}
                onChange={(e) => setAdminInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkAdminAuth()}
              />
              <button 
                onClick={checkAdminAuth}
                className="w-full rounded-2xl bg-slate-800 py-4 text-lg font-semibold text-white transition-all hover:bg-slate-900 shadow-lg"
              >
                관리자 페이지 접속
              </button>
              <div className="mt-6 text-xs text-slate-400">초기 비밀번호는 <span className="font-bold text-slate-500">1234</span>입니다.</div>
            </div>
          </div>
        )}

        {/* Tab: Admin Settings */}
        {activeTab === 'admin' && isAuthorized && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">관리자 설정</h1>
                <p className="text-sm text-slate-400">시스템 환경 및 학생 데이터를 관리합니다.</p>
              </div>
              <button onClick={logoutAdmin} className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                <LogOut size={18} /> 로그아웃
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Password Change */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">비밀번호 변경</h3>
                    <p className="text-[11px] text-slate-400">관리자 인증 암호를 설정합니다.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="password" 
                    placeholder="새 비밀번호" 
                    className="flex-1 rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[#007bff] transition-all"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                  <button 
                    onClick={() => {
                      set(ref(db, 'class_config/adminPassword'), adminPassword).then(() => showMsg("비밀번호 변경 완료"));
                    }}
                    className="rounded-xl bg-[#007bff] px-6 py-3 text-xs font-bold text-white hover:bg-[#0069d9] shadow-md transition-all"
                  >
                    변경
                  </button>
                </div>
              </div>

              {/* Data Management */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-400 shadow-sm">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">데이터 초기화</h3>
                    <p className="text-[11px] text-slate-400">모든 지원 및 배정 내역을 삭제합니다.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setConfirmModal({
                        show: true,
                        title: "전체 초기화",
                        msg: "이번 달의 모든 지원 및 배정 데이터를 삭제하시겠습니까?",
                        onConfirm: () => {
                          set(ref(db, `job_history/${selectedYear}_${selectedMonth}`), {}).then(() => {
                            showMsg("데이터 초기화 완료", "#ff5252");
                            setConfirmModal(null);
                          });
                        }
                      });
                    }}
                    className="w-full rounded-xl border border-red-200 bg-white py-3 text-xs font-bold text-red-500 hover:bg-red-50 transition-all"
                  >
                    현재 월 데이터 전체 삭제
                  </button>
                </div>
              </div>
            </div>

            {/* Priority Group Management */}
            <div className="rounded-2xl border border-slate-100 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500 shadow-sm">
                    <Star size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">배정 우선순위 관리 (드래그)</h3>
                    <p className="text-[11px] text-slate-400">학생을 드래그하여 1~5순위 그룹에 배치하세요. (1순위가 가장 높음)</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(p => (
                  <div key={p} className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50/30 p-3">
                    <div className="mb-3 flex items-center justify-between px-1">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{p}순위</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-400 shadow-sm">
                        {studentsData.filter(s => (s.priority || 3) === p).length}명
                      </span>
                    </div>
                    <div 
                      ref={el => priorityZonesRef.current[p] = el}
                      data-priority={p}
                      className="flex min-h-[120px] flex-col gap-2 rounded-xl p-1 transition-colors"
                    >
                      {studentsData
                        .filter(s => (s.priority || 3) === p)
                        .map(s => (
                          <div 
                            key={s.id} 
                            data-id={s.id}
                            className="flex cursor-grab items-center justify-between rounded-lg border border-white bg-white p-2 shadow-sm hover:border-blue-200 hover:shadow active:cursor-grabbing transition-all"
                          >
                            <span className="text-[11px] font-bold text-slate-700">{s.id}. {s.name}</span>
                            <GripVertical size={12} className="text-slate-300" />
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Student List Management */}
            <div className="rounded-2xl border border-slate-100 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500 shadow-sm">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">학생 명단 및 암호 관리</h3>
                    <p className="text-[11px] text-slate-400">학생들의 이름과 개인 인증번호를 관리합니다.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const nextId = studentsData.length > 0 ? Math.max(...studentsData.map(s => s.id)) + 1 : 1;
                      setStudentsData([...studentsData, { id: nextId, name: '새 학생', authCode: '1234', priority: 3 }]);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-black transition-all"
                  >
                    <Plus size={14} /> 학생 추가
                  </button>
                  <button 
                    onClick={() => {
                      set(ref(db, 'class_job_data/students'), studentsData).then(() => showMsg("명단 저장 완료"));
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-[#007bff] px-4 py-2 text-xs font-bold text-white hover:bg-[#0069d9] shadow-md transition-all"
                  >
                    <Save size={14} /> 명단 저장
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {studentsData.map(s => (
                  <div key={s.id} className="group relative rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-300">{s.id}번</span>
                      <button 
                        onClick={() => {
                          setConfirmModal({
                            show: true,
                            title: "학생 삭제",
                            msg: `${s.name} 학생을 삭제하시겠습니까?`,
                            onConfirm: () => {
                              setStudentsData(studentsData.filter(st => st.id !== s.id));
                              setConfirmModal(null);
                            }
                          });
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <input 
                      className="mb-2 w-full border-b border-transparent text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:bg-blue-50/30 rounded px-1 transition-all"
                      value={s.name}
                      onChange={(e) => {
                        const updated = studentsData.map(st => st.id === s.id ? { ...st, name: e.target.value } : st);
                        setStudentsData(updated);
                      }}
                    />
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex-1">
                        <div className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter mb-1">Passcode</div>
                        <input 
                          className="w-full text-xs text-slate-400 outline-none bg-slate-50 rounded px-1 py-0.5"
                          value={s.authCode}
                          onChange={(e) => {
                            const updated = studentsData.map(st => st.id === s.id ? { ...st, authCode: e.target.value } : st);
                            setStudentsData(updated);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Application Status Table */}
            <div className="rounded-2xl border border-slate-100 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 shadow-sm">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">학생 지원 현황판</h3>
                    <p className="text-[11px] text-slate-400">실시간 학생들의 지원 상태를 확인합니다.</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setConfirmModal({
                      show: true,
                      title: "지원내역 초기화",
                      msg: "모든 학생의 지원 내역을 삭제하시겠습니까?",
                      onConfirm: () => {
                        set(ref(db, `job_history/${selectedYear}_${selectedMonth}/applications`), {}).then(() => {
                          showMsg("초기화 완료", "#ff5252");
                          setConfirmModal(null);
                        });
                      }
                    });
                  }}
                  className="rounded-lg border border-red-100 px-3 py-1.5 text-[10px] font-bold text-red-400 hover:bg-red-50 transition-all"
                >
                  지원내역 전체 삭제
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-400">
                    <tr>
                      <th className="p-4 font-bold uppercase tracking-wider">이름</th>
                      <th className="p-4 font-bold uppercase tracking-wider">1지망</th>
                      <th className="p-4 font-bold uppercase tracking-wider">2지망</th>
                      <th className="p-4 font-bold uppercase tracking-wider">3지망</th>
                      <th className="p-4 font-bold uppercase tracking-wider">4지망</th>
                      <th className="p-4 font-bold uppercase tracking-wider">5지망</th>
                      <th className="p-4 font-bold uppercase tracking-wider text-center">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {studentsData.map(s => {
                      const app = applications[s.id] || [];
                      const isAssigned = currentJobs.some(j => j.students.some(st => st.startsWith(`${s.id} `)));
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-bold text-slate-700">{s.name}</td>
                          {[0, 1, 2, 3, 4].map(i => (
                            <td key={i} className="p-4 text-slate-400">{app[i] || '-'}</td>
                          ))}
                          <td className="p-4">
                            <div className="flex justify-center">
                              {isAssigned ? (
                                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-500">
                                  <CheckCircle2 size={10} /> 배정완료
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold text-red-400">
                                  <AlertCircle size={10} /> 미배정
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Status Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-full bg-slate-900/90 backdrop-blur-md px-6 py-3 text-[11px] font-bold text-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: statusMsg.color }}></div>
        <span className="tracking-wide">{statusMsg.text}</span>
      </div>
    </div>
  );
}
