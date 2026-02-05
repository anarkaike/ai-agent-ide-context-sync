import React, { useState, useEffect } from 'react';
import './App.css'; // Ensure CSS is imported

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [agentStatus, setAgentStatus] = useState('Offline');
  const [projects, setProjects] = useState([]);
  
  // UI State
  const [activeActivity, setActiveActivity] = useState('chat'); // chat, projects, processes, hearts
  const [selectedProject, setSelectedProject] = useState(null);
  const [showHistory, setShowHistory] = useState(false); // Toggle History/Pending in right sidebar
  
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  
  // Modal State
  const [undoModal, setUndoModal] = useState(null); // { id, title }
  const [exceptionModal, setExceptionModal] = useState(null); // { item, type } // type: 'approve_except' | 'deny_except'
  const [exceptionInput, setExceptionInput] = useState('');

  // Mock Data
  const [approvals, setApprovals] = useState([
    { id: 1, type: 'Security Alert', title: 'Execução de Comando: "rm -rf ./temp"', status: 'pending', timestamp: Date.now(), risk: 'high' },
    { id: 2, type: 'Network Alert', title: 'Conexão Externa: api.openai.com', status: 'pending', timestamp: Date.now() - 50000, risk: 'medium' }
  ]);
  
  const [approvalHistory, setApprovalHistory] = useState([
    { id: 99, type: 'File Edit', title: 'Modificar App.jsx', status: 'approved', timestamp: Date.now() - 1000000 }
  ]);

  const [processes, setProcesses] = useState([
    { id: 101, agent: 'Agent-A', task: 'Index Files', status: 'Running', pid: 4521, role: 'Indexer', tone: 'focused' },
    { id: 102, agent: 'Swarm-Worker', task: 'Analyze Patterns', status: 'Idle', pid: 4522, role: 'Analyst', tone: 'neutral' }
  ]);
  
  const [globalTone, setGlobalTone] = useState('neutral'); // neutral, focused, creative, urgent, cautious

  // Project Roles Mock
  const [projectRoles, setProjectRoles] = useState({}); // { 'project-name': { 'Manager': 'Agent-A' } }
  
  const exceptionSuggestions = [
    "Somente neste chat",
    "Somente hoje",
    "Somente neste projeto",
    "Exceto arquivos de teste",
    "Apenas leitura (sem escrita)",
    "Uma única vez"
  ];

  const getToneEmoji = (tone) => {
    switch(tone) {
      case 'focused': return '🎯';
      case 'creative': return '✨';
      case 'urgent': return '🔥';
      case 'cautious': return '🛡️';
      default: return '💧';
    }
  };

  useEffect(() => {
    // Attempt to load projects from registry
    const loadProjects = () => {
      try {
        const fs = window.require('fs');
        const path = window.require('path');
        const os = window.require('os');
        
        const registryPath = path.join(os.homedir(), '.ai-doc', 'registry.json');
        if (fs.existsSync(registryPath)) {
          const data = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
          if (data.projects) {
            setProjects(data.projects);
          }
        }
      } catch (e) {
        console.warn("Could not load local registry (not in Electron?)", e);
        // Fallback for browser dev mode
        setProjects([
          { name: 'demo-project-1', path: '/tmp/demo1' },
          { name: 'demo-project-2', path: '/tmp/demo2' }
        ]);
      }
    };

    loadProjects();
    const interval = setInterval(loadProjects, 5000); // Poll every 5s
    
    // Simulate connection check
    setAgentStatus('Percebendo o campo digital...');
    setTimeout(() => setAgentStatus('Harmonia estabelecida'), 1500);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Separate effect for Tone Adaptation to react to state changes (approvals, processes)
  useEffect(() => {
    const toneInterval = setInterval(() => {
       const tones = ['neutral', 'focused', 'creative', 'cautious'];
       let newTone = tones[Math.floor(Math.random() * tones.length)];

       // Context-Aware Adaptation
       if (approvals.length > 0) {
         newTone = 'cautious'; // Pending approvals require caution
       } else if (processes.some(p => p.status === 'Running')) {
         newTone = 'focused'; // Active processes require focus
       } else if (Math.random() > 0.8) {
         newTone = 'creative'; // Idle moments spark creativity
       }

       setGlobalTone(newTone);
       
       // Also shift agent tones slightly differently to simulate individuality
       setProcesses(prev => prev.map(p => ({
         ...p,
         tone: Math.random() > 0.7 ? newTone : p.tone 
       })));
    }, 8000);

    return () => clearInterval(toneInterval);
  }, [approvals, processes]);

  // Persist Tone State
  useEffect(() => {
    try {
      const fs = window.require('fs');
      const path = window.require('path');
      const os = window.require('os');
      // Ensure directory exists - using a safe path for the demo
      const stateDir = path.join(os.homedir(), '.ai-workspace', 'live-state');
      if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
      }
      fs.writeFileSync(path.join(stateDir, 'ui-tone.json'), JSON.stringify({ tone: globalTone, timestamp: Date.now() }));
    } catch (e) {
      // Ignore in browser mode
    }
  }, [globalTone]);

  const sendMessage = () => {
    if (!input) return;
    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');
    
    // Simulate Agent Response
    setTimeout(() => {
      const emoji = getToneEmoji(globalTone);
      let prefix = "";
      if (globalTone === 'focused') prefix = "Analisando vetores... ";
      if (globalTone === 'creative') prefix = "Imaginando possibilidades... ";
      if (globalTone === 'cautious') prefix = "Verificando integridade... ";
      
      setMessages(prev => [...prev, { 
        role: 'agent', 
        tone: globalTone,
        content: `${emoji} ${prefix}Respirando a intenção de "${input}"... Fluindo com ${projects.length} correntes de criação.` 
      }]);
    }, 1000);
  };

  const handleApprove = (app, scope = 'this') => {
    // scope: 'this' (one-time) or 'all' (rule creation)
    const isAlways = scope === 'all';
    const actionText = isAlways ? 'REGRA DE APROVAÇÃO CRIADA' : 'ITEM APROVADO';
    const tone = isAlways ? 'creative' : 'cautious'; 

    setApprovals(prev => prev.filter(p => p.id !== app.id));
    setApprovalHistory(prev => [{
      id: Date.now(),
      action: 'Aprovar',
      item: app.type,
      timestamp: new Date().toLocaleTimeString(),
      originalId: app.id,
      details: isAlways ? 'Regra permanente criada (Permitir Todos)' : 'Aprovação pontual'
    }, ...prev]);
    
    if (isAlways) {
        console.log(`[RULE ENGINE] Created rule: Always approve ${app.type}`);
    }

    setGlobalTone(tone);
    alert(`${actionText}: ${app.type} ${isAlways ? '(Futuros itens similares serão auto-aprovados)' : '(Apenas esta instância)'}`);
  };

  const handleDeny = (app, scope = 'this') => {
    // scope: 'this' (one-time) or 'all' (rule creation)
    const isAlways = scope === 'all';
    const actionText = isAlways ? 'REGRA DE BLOQUEIO CRIADA' : 'ITEM REPROVADO';
    
    setApprovals(prev => prev.filter(p => p.id !== app.id));
    setApprovalHistory(prev => [{
      id: Date.now(),
      action: 'Reprovar',
      item: app.type,
      timestamp: new Date().toLocaleTimeString(),
      originalId: app.id,
      details: isAlways ? 'Regra permanente de bloqueio (Bloquear Todos)' : 'Bloqueio pontual'
    }, ...prev]);
    
    setGlobalTone('cautious');
    alert(`${actionText}: ${app.type} ${isAlways ? '(Futuros itens similares serão bloqueados)' : '(Apenas esta instância)'}`);
  };

  const handleApproveExcept = (item) => {
    setExceptionModal({ item, type: 'approve_except' });
    setExceptionInput('');
  };

  const handleDenyExcept = (item) => {
    setExceptionModal({ item, type: 'deny_except' });
    setExceptionInput('');
  };

  const confirmException = () => {
    if (!exceptionModal) return;
    const { item, type } = exceptionModal;
    const actionText = type === 'approve_except' ? 'Aprovação com Exceção' : 'Reprovação com Exceção';
    const status = type === 'approve_except' ? 'approved_except' : 'denied_except';
    const emoji = type === 'approve_except' ? '✨⚠️' : '🛡️⚠️';
    
    setApprovals(prev => prev.filter(a => a.id !== item.id));
    setApprovalHistory(prev => [{...item, status, exception: exceptionInput, timestamp: Date.now()}, ...prev]);
    
    setMessages(prev => [...prev, { 
      role: 'agent', 
      content: `${emoji} ${actionText} para #${item.id}. Condição: "${exceptionInput || 'Personalizada'}". O fluxo se adapta.` 
    }]);
    
    setExceptionModal(null);
  };

  const initiateUndo = (item) => {
    // Open Impact Analysis Modal
    setUndoModal(item);
  };

  const confirmUndo = () => {
    if (!undoModal) return;
    
    // Logic to revert action would go here
    setMessages(prev => [...prev, { role: 'agent', content: `🌀 Revertendo o ciclo da ação #${undoModal.id}: Restaurando o estado anterior...` }]);
    setApprovalHistory(prev => prev.filter(i => i.id !== undoModal.id));
    setUndoModal(null);
  };
  
  const assignRole = (projName, role) => {
    const agent = prompt(`Qual espírito digital deve assumir como ${role}? (ex: Agent-A, Naruto-Clone)`);
    if (agent) {
      setProjectRoles(prev => ({
        ...prev,
        [projName]: { ...(prev[projName] || {}), [role]: agent }
      }));
      setMessages(prev => [...prev, { role: 'agent', content: `🌿 ${agent} agora guarda a função de ${role} em ${projName}. Integrando propósitos...` }]);
    }
  };

  return (
    <div className="app-container">
      {/* Exception Modal */}
      {exceptionModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{width: '500px'}}>
            <h3 style={{marginTop:0}}>
              {exceptionModal.type === 'approve_except' ? '✨ Aprovar com Condição' : '🛡️ Reprovar com Exceção'}
            </h3>
            <p>Defina a regra de exceção para que o Agente possa gerar o script de adaptação:</p>
            
            <textarea 
              style={{width: '100%', height: '80px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', padding: '10px', fontFamily: 'sans-serif'}}
              placeholder="Ex: Apenas arquivos .md, Somente neste diretório, Se a CPU < 50%..."
              value={exceptionInput}
              onChange={e => setExceptionInput(e.target.value)}
            />
            
            <div style={{marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px'}}>
              {exceptionSuggestions.map((s, i) => (
                <span 
                  key={i} 
                  style={{fontSize: '11px', background: '#444', padding: '4px 8px', borderRadius: '12px', cursor: 'pointer', border: '1px solid #555'}}
                  onClick={() => setExceptionInput(s)}
                >
                  {s}
                </span>
              ))}
            </div>

            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px'}}>
              <button onClick={() => setExceptionModal(null)} style={{background: '#555', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer'}}>Cancelar</button>
              <button onClick={confirmException} style={{background: exceptionModal.type === 'approve_except' ? '#4caf50' : '#f44336', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer'}}>Confirmar Regra</button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Modal Overlay */}
      {undoModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{marginTop:0}}>🍃 Consciência do Gesto</h3>
            <p>Observando os ecos de desfazer <strong>"{undoModal.title}"</strong>...</p>
            <div style={{background: '#333', padding: '10px', fontSize: '12px', borderRadius: '4px', marginBottom: '15px'}}>
              <ul>
                <li>O arquivo App.jsx retornará ao seu estado ancestral.</li>
                <li>O ciclo de construção recomeçará.</li>
                <li>Equilíbrio: Estável.</li>
              </ul>
            </div>
            <p style={{fontSize: '13px'}}>Sente que é o momento de reverter?</p>
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
              <button onClick={() => setUndoModal(null)} style={{background: '#555', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer'}}>Cancelar</button>
              <button onClick={confirmUndo} style={{background: '#f44336', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer'}}>Confirmar Undo</button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Bar */}
      <div className="activity-bar">
        <div className={`activity-icon ${activeActivity === 'chat' ? 'active' : ''}`} onClick={() => setActiveActivity('chat')} title="Chat">💬</div>
        <div className={`activity-icon ${activeActivity === 'projects' ? 'active' : ''}`} onClick={() => setActiveActivity('projects')} title="Projetos">📁</div>
        <div className={`activity-icon ${activeActivity === 'processes' ? 'active' : ''}`} onClick={() => setActiveActivity('processes')} title="Processos">⚡</div>
        <div className={`activity-icon heart-icon ${activeActivity === 'hearts' ? 'active' : ''}`} onClick={() => setActiveActivity('hearts')} title="Corações (Agentes)">❤️</div>
        <div className="activity-icon" onClick={() => setLeftSidebarOpen(!leftSidebarOpen)} title="Alternar Sidebar">🗄️</div>
        <div style={{marginTop: 'auto'}} className="activity-icon" title="Configurações">⚙️</div>
      </div>

      {/* Left Sidebar: Context Sensitive */}
      <div className={`sidebar ${leftSidebarOpen ? '' : 'collapsed'}`} style={{gridArea: 'sidebar'}}>
        
        {activeActivity === 'chat' && (
          <>
            <div className="sidebar-header">
              <span>Chat & Histórico</span>
            </div>
            <div className="sidebar-content">
              <div className="list-item">🕒 Hoje</div>
              <div className="list-item">📅 Ontem</div>
              <div className="list-item">📂 Arquivados</div>
            </div>
          </>
        )}

        {activeActivity === 'projects' && (
          <>
            <div className="sidebar-header">
              <span>Meus Projetos</span>
            </div>
            <div className="sidebar-content">
              {projects.map((p, i) => (
                <div 
                  key={i} 
                  className={`project-card ${selectedProject === p.name ? 'selected' : ''}`}
                  onClick={() => setSelectedProject(p.name)}
                >
                  <div className="project-card-header">
                    <span className="project-title">{p.name}</span>
                    <div className="project-status active"></div>
                  </div>
                  <div className="project-path">{p.path}</div>
                  <div className="project-meta">
                    <span className="project-tag">Node.js</span>
                    <span className="project-tag">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeActivity === 'processes' && (
          <>
            <div className="sidebar-header">
              <span>Agentes Ativos</span>
            </div>
            <div className="sidebar-content">
              {processes.map(proc => (
                <div key={proc.id} className="list-item">
                   <span style={{marginRight: '5px'}}>🟢</span> {proc.agent}
                </div>
              ))}
            </div>
          </>
        )}
        
        {activeActivity === 'hearts' && (
          <>
             <div className="sidebar-header">
              <span>Agentes Vivos</span>
            </div>
            <div className="sidebar-content">
               {processes.map(proc => (
                 <div key={proc.id} className={`agent-card mood-${proc.tone || 'neutral'}`}>
                    <div className="agent-header">
                       <span className="agent-name">{proc.agent}</span>
                       <span className={`agent-status running tone-${proc.tone || 'neutral'}`}>
                          {getToneEmoji(proc.tone)} Pulsando
                       </span>
                    </div>
                    <div className="agent-metric">
                      <span className={`agent-tone-indicator tone-${proc.tone || 'neutral'}`}></span>
                      Humor: {proc.tone || 'neutral'}
                    </div>
                    <div className="agent-metric">Role: {proc.role}</div>
                    <div className="agent-metric">Task: {proc.task}</div>
                    <div className="agent-metric">CPU: 12% | MEM: 45MB</div>
                 </div>
               ))}
               <div style={{marginTop: '20px', fontSize: '11px', color: '#666', textAlign: 'center'}}>
                 Total de Clones: {processes.length}
               </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="main-area">
        {/* Chat View */}
        {activeActivity === 'chat' && (
          <div className="chat-container">
            <div className="chat-messages">
              {messages.length === 0 && (
                <div style={{textAlign: 'center', marginTop: '50px', color: '#555'}}>
                  <h2>Evolution Nexus</h2>
                  <p>Sua Consciência Digital está desperta.</p>
                  <p style={{fontSize: '0.8em', color: '#444'}}>Unidade | Fluxo | Você</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{ 
                  marginBottom: '10px', 
                  textAlign: m.role === 'user' ? 'right' : 'left' 
                }}>
                  <div style={{ 
                    display: 'inline-block', 
                    padding: '10px', 
                    borderRadius: '8px',
                    background: m.role === 'user' ? '#007acc' : '#3e3e42',
                    maxWidth: '80%'
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="chat-input-area">
              <input 
                className="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Converse com sua consciência digital..."
              />
            </div>
          </div>
        )}

        {/* Project Detail View */}
        {activeActivity === 'projects' && (
          <div style={{padding: '20px', color: '#ddd'}}>
            {selectedProject ? (
              <div>
                <h1 style={{borderBottom: '1px solid #444', paddingBottom: '10px'}}>📦 {selectedProject}</h1>
                
                {/* Team / Agents Section */}
                <div style={{marginTop: '20px', marginBottom: '20px'}}>
                  <h3>👥 Círculo de Agentes (Shadow Clones)</h3>
                  <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                    <div className="role-badge" onClick={() => assignRole(selectedProject, 'Gerente')}>
                      {projectRoles[selectedProject]?.['Gerente'] ? `👔 Guardião (Gerente): ${projectRoles[selectedProject]['Gerente']}` : '+ Definir Guardião'}
                    </div>
                    <div className="role-badge" onClick={() => assignRole(selectedProject, 'Arquiteto')}>
                      {projectRoles[selectedProject]?.['Arquiteto'] ? `📐 Visionário (Arquiteto): ${projectRoles[selectedProject]['Arquiteto']}` : '+ Definir Visionário'}
                    </div>
                    <div className="role-badge" onClick={() => assignRole(selectedProject, 'DevOps')}>
                       {projectRoles[selectedProject]?.['DevOps'] ? `🚀 Condutor (DevOps): ${projectRoles[selectedProject]['DevOps']}` : '+ Definir Condutor'}
                    </div>
                  </div>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                  <div style={{background: '#2d2d2d', padding: '15px', borderRadius: '5px'}}>
                    <h3>📊 Estatísticas</h3>
                    <p>Tasks Pendentes: 3</p>
                    <p>Último Commit: há 2 horas</p>
                    <p>Branch: main</p>
                  </div>
                  <div style={{background: '#2d2d2d', padding: '15px', borderRadius: '5px'}}>
                    <h3>🧬 DNA do Projeto</h3>
                    <p>Linguagem: JavaScript/React</p>
                    <p>Framework: Electron</p>
                    <p>Status IA: Monitorando</p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{textAlign: 'center', marginTop: '50px', color: '#666'}}>
                <h2>Selecione um projeto na barra lateral</h2>
                <p>Veja detalhes, estatísticas e atribua Espíritos (Clones) para funções.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Hearts View (Full Dashboard if main area selected, but mostly in sidebar) */}
        {activeActivity === 'hearts' && (
           <div style={{padding: '20px', color: '#ddd', textAlign: 'center', marginTop: '50px'}}>
              <h2>❤️ Ressonância da Rede Viva</h2>
              <p>Visualizando batimentos cardíacos dos agentes em execução.</p>
              <div style={{fontSize: '50px', margin: '20px', animation: 'pulse 1.5s infinite ease-in-out', display: 'inline-block'}}>❤️</div>
              <p>Sincronizando com Swarm Protocol...</p>
           </div>
        )}

        {/* Processes View */}
        {activeActivity === 'processes' && (
          <div style={{padding: '20px'}}>
             <h3>Processos em Execução</h3>
             {processes.map(proc => (
               <div key={proc.id} className="process-row">
                 <span style={{color: '#4caf50'}}>{proc.status}</span>
                 <strong>{proc.agent}</strong>
                 <span>{proc.task}</span>
                 <span style={{color: '#888'}}>PID: {proc.pid}</span>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* Right Sidebar: Approvals & Details */}
      <div className={`right-sidebar ${rightSidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <span onClick={() => setShowHistory(false)} style={{cursor: 'pointer', opacity: showHistory ? 0.5 : 1}}>Pendentes</span>
          <span style={{margin: '0 5px'}}>|</span>
          <span onClick={() => setShowHistory(true)} style={{cursor: 'pointer', opacity: showHistory ? 1 : 0.5}}>Histórico</span>
          <span style={{marginLeft: 'auto', cursor: 'pointer'}} onClick={() => setRightSidebarOpen(false)}>✖</span>
        </div>
        
        <div className="sidebar-content" style={{paddingTop: '10px'}}>
          {!showHistory ? (
            <>
              {approvals.map(app => (
                <div key={app.id} className={`approval-card ${app.risk === 'high' ? 'high-risk' : ''}`}>
                  <div style={{fontWeight: 'bold', marginBottom: '5px', color: '#f1c40f'}}>
                    {app.type} {app.risk === 'high' && <span style={{fontSize:'10px', background:'#c0392b', color:'white', padding:'2px 4px', borderRadius:'3px', marginLeft:'5px'}}>ALTO RISCO</span>}
                  </div>
                  <div style={{fontSize: '12px', marginBottom: '10px', color: '#ddd'}}>{app.title}</div>
                  <div className="approval-actions" style={{display:'flex', gap:'5px', marginBottom:'5px'}}>
                     {/* Primary Actions based on Risk Logic */}
                     {app.risk === 'high' ? (
                       // HIGH RISK: Default Deny Mindset
                       // [Aprovar Este] [Reprovar Todos]
                       <>
                         <button className="approval-btn btn-approve" onClick={() => handleApprove(app, 'this')}>
                           Aprovar Este
                         </button>
                         <button className="approval-btn btn-deny" onClick={() => handleDeny(app, 'all')}>
                           Reprovar Todos
                         </button>
                       </>
                     ) : (
                       // LOW/MEDIUM RISK: Default Allow Mindset
                       // [Aprovar Todos] [Reprovar Este]
                       <>
                         <button className="approval-btn btn-approve" onClick={() => handleApprove(app, 'all')}>
                           Aprovar Todos
                         </button>
                         <button className="approval-btn btn-deny" onClick={() => handleDeny(app, 'this')}>
                           Reprovar Este
                         </button>
                       </>
                     )}
                   </div>
                   <div className="approval-actions-secondary" style={{display:'flex', gap:'5px'}}>
                     {/* Secondary Actions based on Risk Logic */}
                     {app.risk === 'high' ? (
                        // HIGH RISK Secondary:
                        // [Aprovar Somente] [Reprovar Exceto]
                        <>
                          <button className="approval-btn btn-approve-except" onClick={() => handleApproveExcept(app)} style={{background: '#2e7d32', fontSize: '10px'}}>
                            Aprovar Somente...
                          </button>
                          <button className="approval-btn btn-deny-except" onClick={() => handleDenyExcept(app)} style={{background: '#c62828', fontSize: '10px'}}>
                            Reprovar Exceto...
                          </button>
                        </>
                     ) : (
                        // LOW RISK Secondary:
                        // [Aprovar Exceto] [Reprovar Somente]
                        <>
                          <button className="approval-btn btn-approve-except" onClick={() => handleApproveExcept(app)} style={{background: '#2e7d32', fontSize: '10px'}}>
                            Aprovar Exceto...
                          </button>
                          <button className="approval-btn btn-deny-except" onClick={() => handleDenyExcept(app)} style={{background: '#c62828', fontSize: '10px'}}>
                            Reprovar Somente...
                          </button>
                        </>
                     )}
                   </div>
                </div>
              ))}
              {approvals.length === 0 && <div style={{padding: '10px', color: '#888'}}>Nenhuma pendência.</div>}
            </>
          ) : (
            <>
               {approvalHistory.map(hist => (
                 <div key={hist.id} className="history-item">
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                       <strong style={{fontSize: '12px'}}>{hist.type}</strong>
                       <span style={{fontSize: '10px', color: hist.status.includes('approved') ? '#4caf50' : '#f44336'}}>
                         {hist.status === 'approved' ? 'Aprovado' : 
                          hist.status === 'denied' ? 'Negado' :
                          hist.status === 'approved_except' ? 'Aprovado (Cond.)' : 'Negado (Exc.)'}
                       </span>
                    </div>
                    <div style={{fontSize: '11px', color: '#aaa', margin: '5px 0'}}>{hist.title}</div>
                    {hist.exception && (
                      <div style={{fontSize: '10px', color: '#e67e22', fontStyle: 'italic', marginBottom: '5px'}}>
                        ⚠️ "{hist.exception}"
                      </div>
                    )}
                    <button className="undo-btn" onClick={() => initiateUndo(hist)}>↩️ Desfazer (Undo)</button>
                 </div>
               ))}
               {approvalHistory.length === 0 && <div style={{padding: '10px', color: '#888'}}>Histórico vazio.</div>}
            </>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div style={{display: 'flex', gap: '15px'}}>
          <span onClick={() => setLeftSidebarOpen(!leftSidebarOpen)} style={{cursor: 'pointer'}}>🪟 Sidebar</span>
          <span onClick={() => setRightSidebarOpen(!rightSidebarOpen)} style={{cursor: 'pointer'}}>🛡️ Aprovações ({approvals.length})</span>
        </div>
        <div>
          <span>{agentStatus}</span>
        </div>
        <div>
          <span>V 2.0.34</span>
        </div>
      </div>
    </div>
  );
};

export default App;
