/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Plus, X, Upload, Trash2, RotateCcw, Save } from 'lucide-react';

type ColorKey = 'blue' | 'orange' | 'emerald' | 'purple' | 'rose';

const COLOR_THEMES: Record<ColorKey, string> = {
  blue: 'bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-300',
  orange: 'bg-orange-50 border-orange-200 text-orange-900 placeholder-orange-300',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900 placeholder-emerald-300',
  purple: 'bg-purple-50 border-purple-200 text-purple-900 placeholder-purple-300',
  rose: 'bg-rose-50 border-rose-200 text-rose-900 placeholder-rose-300'
};

type Problem = {
  id: string;
  title: string;
  content: string;
  color: ColorKey;
};

type Touchpoint = {
  id: string;
  url: string;
};

type EmotionNode = {
  id: string;
  text: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
};

type Step = {
  id: string;
  stageName: string;
  behaviorName: string;
  width: number;
  problems: Problem[];
  touchpoints: Touchpoint[];
};

const defaultSteps: Step[] = [
  {
    id: "step-1",
    stageName: "用户认知阶段",
    behaviorName: "操作行为1",
    width: 320,
    problems: [
      { id: "p1", title: "认知不足", content: "用户对产品核心价值理解不够清晰，需要更直观的引导。", color: "blue" }
    ],
    touchpoints: [],
  },
  {
    id: "step-2",
    stageName: "用户认知阶段",
    behaviorName: "操作行为2",
    width: 320,
    problems: [
      { id: "p2", title: "信息过载", content: "首页展示信息过多，导致用户注意力分散。", color: "orange" }
    ],
    touchpoints: [],
  },
  {
    id: "step-3",
    stageName: "用户转化阶段",
    behaviorName: "操作行为3",
    width: 320,
    problems: [],
    touchpoints: [],
  }
];

const defaultIdealEmotions: EmotionNode[] = [
  { id: 'ie-1', text: '期待', x: 16, y: 30 },
  { id: 'ie-2', text: '开心', x: 50, y: 10 },
  { id: 'ie-3', text: '满意', x: 83, y: 30 },
];

const defaultCurrentEmotions: EmotionNode[] = [
  { id: 'ce-1', text: '困惑', x: 16, y: 70 },
  { id: 'ce-2', text: '平静', x: 50, y: 50 },
  { id: 'ce-3', text: '犹豫', x: 83, y: 50 },
];

const STORAGE_KEY = 'journey-map-data-v2';

const EmotionGraph = ({ nodes, setNodes, type }: { nodes: EmotionNode[], setNodes: (nodes: EmotionNode[]) => void, type: 'ideal' | 'current' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === id);
    if (!node || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startNodeX = node.x;
    const startNodeY = node.y;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      const newX = Math.max(0, Math.min(100, startNodeX + (deltaX / containerRect.width) * 100));
      const newY = Math.max(0, Math.min(100, startNodeY + (deltaY / containerRect.height) * 100));

      setNodes(nodes.map(n => n.id === id ? { ...n, x: newX, y: newY } : n));
    };

    const onPointerUp = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  const handleAddNode = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newNode: EmotionNode = {
      id: `en-${Date.now()}`,
      text: '新情绪',
      x,
      y
    };
    setNodes([...nodes, newNode]);
  };

  const deleteNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes(nodes.filter(n => n.id !== id));
  };

  const sortedNodes = [...nodes].sort((a, b) => a.x - b.x);

  return (
    <div ref={containerRef} className="w-full h-48 relative cursor-crosshair" onDoubleClick={handleAddNode}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        {sortedNodes.length > 1 && (
          <polyline
            points={sortedNodes.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={type === 'ideal' ? '#3b82f6' : '#8b5cf6'}
            strokeWidth="2"
            strokeDasharray={type === 'current' ? '6 4' : 'none'}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {nodes.map(node => (
        <div
          key={node.id}
          className="absolute flex items-center gap-2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-slate-200 rounded-full px-4 py-1.5 shadow-sm hover:border-indigo-400 transition-colors z-10 group cursor-move"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          onPointerDown={(e) => handlePointerDown(e, node.id)}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <input
            value={node.text}
            onChange={e => setNodes(nodes.map(n => n.id === node.id ? { ...n, text: e.target.value } : n))}
            className="bg-transparent outline-none text-sm font-medium text-center w-20 text-slate-700 cursor-text"
            placeholder="情绪"
            onPointerDown={e => e.stopPropagation()}
          />
          <button 
            onClick={(e) => deleteNode(node.id, e)} 
            className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-200"
            onPointerDown={e => e.stopPropagation()}
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <div className="absolute bottom-2 right-2 text-xs text-slate-400 pointer-events-none">
        双击空白处添加节点
      </div>
    </div>
  );
};

export default function App() {
  const [title, setTitle] = useState("用户体验旅程地图");
  const [steps, setSteps] = useState<Step[]>([]);
  const [idealEmotions, setIdealEmotions] = useState<EmotionNode[]>([]);
  const [currentEmotions, setCurrentEmotions] = useState<EmotionNode[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTitle(parsed.title || "用户体验旅程地图");
        setSteps(parsed.steps || defaultSteps);
        setIdealEmotions(parsed.idealEmotions || defaultIdealEmotions);
        setCurrentEmotions(parsed.currentEmotions || defaultCurrentEmotions);
      } catch (e) {
        console.error("Failed to parse saved data", e);
        setSteps(defaultSteps);
        setIdealEmotions(defaultIdealEmotions);
        setCurrentEmotions(defaultCurrentEmotions);
      }
    } else {
      setSteps(defaultSteps);
      setIdealEmotions(defaultIdealEmotions);
      setCurrentEmotions(defaultCurrentEmotions);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ title, steps, idealEmotions, currentEmotions }));
    }
  }, [title, steps, idealEmotions, currentEmotions, isLoaded]);

  const groupedStages = steps.reduce((acc, step, index) => {
    const last = acc[acc.length - 1];
    if (last && last.name === step.stageName) {
      last.count += 1;
    } else {
      acc.push({ id: `group-${index}`, name: step.stageName, count: 1, firstStepIndex: index });
    }
    return acc;
  }, [] as { id: string, name: string, count: number, firstStepIndex: number }[]);

  const updateStageName = (group: { firstStepIndex: number, count: number }, newName: string) => {
    const newSteps = [...steps];
    for (let i = group.firstStepIndex; i < group.firstStepIndex + group.count; i++) {
      newSteps[i].stageName = newName;
    }
    setSteps(newSteps);
  };

  const updateStep = (id: string, updates: Partial<Step>) => {
    setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addStep = () => {
    const lastStep = steps[steps.length - 1];
    const newStep: Step = {
      id: `step-${Date.now()}`,
      stageName: lastStep ? lastStep.stageName : "新阶段",
      behaviorName: "新行为",
      width: 320,
      problems: [],
      touchpoints: [],
    };
    setSteps([...steps, newStep]);
  };

  const deleteStep = (id: string) => {
    if (steps.length === 1) {
      alert("至少保留一个节点");
      return;
    }
    setSteps(steps.filter(s => s.id !== id));
  };

  const handleResizeStart = (e: React.PointerEvent, stepId: string) => {
    e.preventDefault();
    const startX = e.clientX;
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    const startWidth = step.width;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(200, startWidth + delta);
      updateStep(stepId, { width: newWidth });
    };

    const onPointerUp = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  const addProblem = (stepId: string) => {
    const newProblem: Problem = {
      id: `p-${Date.now()}`,
      title: "",
      content: "",
      color: "blue"
    };
    setSteps(steps.map(s => s.id === stepId ? { ...s, problems: [...s.problems, newProblem] } : s));
  };

  const updateProblem = (stepId: string, problemId: string, updates: Partial<Problem>) => {
    setSteps(steps.map(s => {
      if (s.id === stepId) {
        return {
          ...s,
          problems: s.problems.map(p => p.id === problemId ? { ...p, ...updates } : p)
        };
      }
      return s;
    }));
  };

  const deleteProblem = (stepId: string, problemId: string) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, problems: s.problems.filter(p => p.id !== problemId) } : s));
  };

  const handleImageUpload = async (stepId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    
    const newTouchpoints = await Promise.all(files.map(file => {
      return new Promise<Touchpoint>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            id: Math.random().toString(36).substr(2, 9),
            url: event.target?.result as string
          });
        };
        reader.readAsDataURL(file);
      });
    }));

    setSteps(steps.map(s => s.id === stepId ? { ...s, touchpoints: [...s.touchpoints, ...newTouchpoints] } : s));
  };

  const deleteTouchpoint = (stepId: string, tpId: string) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, touchpoints: s.touchpoints.filter(tp => tp.id !== tpId) } : s));
  };

  if (!isLoaded) return null;

  const gridTemplateColumns = `120px ${steps.map(s => `${s.width}px`).join(' ')} 120px`;

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm z-10 relative">
        <div className="flex items-center gap-4 w-1/2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
            JM
          </div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="text-2xl font-bold text-slate-800 bg-transparent outline-none hover:bg-slate-50 focus:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors w-full"
            placeholder="输入旅程地图名称..."
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-500 flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            <Save size={14} />
            自动保存
          </div>
          <button onClick={() => {
            if (confirm("确定要清空所有数据并恢复默认模板吗？")) {
              setSteps(defaultSteps);
              setIdealEmotions(defaultIdealEmotions);
              setCurrentEmotions(defaultCurrentEmotions);
              setTitle("用户体验旅程地图");
            }
          }} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
            <RotateCcw size={16} />
            重置数据
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 bg-slate-100/50 custom-scrollbar">
        <div className="min-w-max pb-10">
          <div className="grid gap-4" style={{ gridTemplateColumns }}>
            
            {/* Row 1: Stages */}
            <div className="bg-slate-100 border border-slate-200 flex items-center justify-center font-bold rounded-xl p-3 text-center text-slate-700 shadow-sm">
              交互链路
            </div>
            {groupedStages.map(group => (
              <div key={group.id} style={{ gridColumn: `span ${group.count}` }} className="bg-slate-100 border border-slate-200 p-3 rounded-xl flex items-center justify-center shadow-sm">
                <input
                  value={group.name}
                  onChange={e => updateStageName(group, e.target.value)}
                  className="bg-transparent text-center font-bold outline-none w-full text-slate-800"
                  placeholder="阶段名称"
                />
              </div>
            ))}
            <div className="row-span-6 flex items-center justify-center">
              <button onClick={addStep} className="w-full h-full min-h-[400px] border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50 flex flex-col items-center justify-center gap-2 transition-all">
                <Plus size={28} />
                <span className="font-medium">添加节点</span>
              </button>
            </div>

            {/* Row 2: Behaviors */}
            <div className="bg-slate-100 border border-slate-200 flex items-center justify-center font-bold rounded-xl p-3 text-center text-slate-700 shadow-sm">
              操作行为
            </div>
            {steps.map(step => (
              <div key={step.id} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-center shadow-sm relative group">
                <input
                  value={step.behaviorName}
                  onChange={e => updateStep(step.id, { behaviorName: e.target.value })}
                  className="bg-transparent text-center font-medium outline-none w-full text-slate-700 pr-4"
                  placeholder="行为名称"
                />
                <button onClick={() => deleteStep(step.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-200 z-20">
                  <Trash2 size={14} />
                </button>
                <div
                  className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-indigo-500/20 z-10 rounded-r-xl"
                  onPointerDown={(e) => handleResizeStart(e, step.id)}
                />
              </div>
            ))}

            {/* Row 3: Ideal Emotion */}
            <div className="bg-blue-50 border border-blue-100 flex items-center justify-center font-bold rounded-xl p-3 text-center text-blue-800 shadow-sm">
              理想<br/>用户情绪
            </div>
            <div style={{ gridColumn: `span ${steps.length}` }} className="bg-slate-50/50 rounded-xl border border-slate-200">
              <EmotionGraph nodes={idealEmotions} setNodes={setIdealEmotions} type="ideal" />
            </div>

            {/* Row 4: Problems */}
            <div className="bg-orange-50 border border-orange-100 flex items-center justify-center font-bold rounded-xl p-3 text-center text-orange-800 shadow-sm">
              问题<br/>梳理
            </div>
            {steps.map(step => (
              <div key={`prob-${step.id}`} className="bg-white border border-slate-200 p-4 rounded-xl flex gap-3 overflow-x-auto shadow-sm min-h-[220px] items-start custom-scrollbar relative">
                {step.problems.map(problem => (
                  <div key={problem.id} className={`flex-shrink-0 w-56 p-4 rounded-xl shadow-sm relative group border transition-colors ${COLOR_THEMES[problem.color]}`}>
                    <button onClick={() => deleteProblem(step.id, problem.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-black/40 hover:text-red-500 transition-opacity"><X size={16}/></button>
                    <input
                      value={problem.title}
                      onChange={e => updateProblem(step.id, problem.id, { title: e.target.value })}
                      className="font-bold text-sm bg-transparent outline-none w-full mb-2 placeholder-current opacity-80"
                      placeholder="问题标题"
                    />
                    <textarea
                      value={problem.content}
                      onChange={e => updateProblem(step.id, problem.id, { content: e.target.value })}
                      className="text-sm bg-transparent outline-none w-full resize-none h-24 placeholder-current opacity-70 custom-scrollbar"
                      placeholder="可编辑文本贴，可放大展开..."
                    />
                    <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(Object.keys(COLOR_THEMES) as ColorKey[]).map(c => (
                        <button 
                          key={c} 
                          onClick={() => updateProblem(step.id, problem.id, { color: c })} 
                          className={`w-5 h-5 rounded-full border-2 ${problem.color === c ? 'border-black/30' : 'border-transparent'} ${COLOR_THEMES[c].split(' ')[0]} hover:scale-110 transition-transform`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={() => addProblem(step.id)} className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-500 transition-colors">
                  <Plus size={24} />
                  <span className="text-xs mt-1 font-medium">添加</span>
                </button>
                <div
                  className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-indigo-500/20 z-10 rounded-r-xl"
                  onPointerDown={(e) => handleResizeStart(e, step.id)}
                />
              </div>
            ))}

            {/* Row 5: Touchpoints */}
            <div className="bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold rounded-xl p-3 text-center text-emerald-800 shadow-sm">
              触点<br/>现状
            </div>
            {steps.map(step => (
              <div key={`tp-${step.id}`} className="bg-white border border-slate-200 p-4 rounded-xl flex gap-3 overflow-x-auto shadow-sm min-h-[440px] items-start custom-scrollbar relative">
                {step.touchpoints.map(tp => (
                  <div key={tp.id} className="flex-shrink-0 h-[400px] relative group rounded-lg border border-slate-200 shadow-sm bg-slate-50 flex items-center justify-center cursor-zoom-in" onClick={() => setSelectedImage(tp.url)}>
                    <img src={tp.url} alt="touchpoint" className="h-full w-auto object-contain rounded-lg" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg pointer-events-none" />
                    <button onClick={(e) => { e.stopPropagation(); deleteTouchpoint(step.id, tp.id); }} className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 hover:scale-110 transition-all shadow-sm z-10">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                ))}
                <label className="flex-shrink-0 w-64 h-[400px] border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-500 transition-colors cursor-pointer group">
                  <div className="p-3 bg-slate-100 rounded-full group-hover:bg-slate-200 transition-colors mb-3">
                    <Upload size={24} />
                  </div>
                  <span className="text-sm font-medium">上传图片</span>
                  <span className="text-xs mt-1 opacity-70">支持多张</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleImageUpload(step.id, e)} />
                </label>
                <div
                  className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-indigo-500/20 z-10 rounded-r-xl"
                  onPointerDown={(e) => handleResizeStart(e, step.id)}
                />
              </div>
            ))}

            {/* Row 6: Current Emotion */}
            <div className="bg-purple-50 border border-purple-100 flex items-center justify-center font-bold rounded-xl p-3 text-center text-purple-800 shadow-sm">
              现状<br/>用户情绪
            </div>
            <div style={{ gridColumn: `span ${steps.length}` }} className="bg-slate-50/50 rounded-xl border border-slate-200">
              <EmotionGraph nodes={currentEmotions} setNodes={setCurrentEmotions} type="current" />
            </div>

          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-all">
            <X size={24} />
          </button>
          <img src={selectedImage} alt="Enlarged touchpoint" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

