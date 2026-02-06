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
    { 
      id: 99, 
      type: 'File Creation', 
      title: 'Create test-rollback.txt', 
      status: 'approved', 
      timestamp: Date.now() - 60000,
      operationId: 'OP-1770344976847-ac5800a1'
    },
    { id: 98, type: 'File Edit', title: 'Modificar App.jsx', status: 'approved', timestamp: Date.now() - 1000000 }
  ]);

  const [processes, setProcesses] = useState([
    { id: 101, agent: 'Agent-A', task: 'Index Files', status: 'Running', pid: 4521, role: 'Indexer', tone: 'focused' },
    { id: 102, agent: 'Swarm-Worker', task: 'Analyze Patterns', status: 'Idle', pid: 4522, role: 'Analyst', tone: 'neutral' }
  ]);
  
  const [globalTone, setGlobalTone] = useState('neutral'); // neutral, focused, creative, urgent, cautious

  // Project Roles Mock
  const [projectRoles, setProjectRoles] = useState({}); // { 'project-name': { 'Manager': 'Agent-A' } }
  
  const [sbts, setSbts] = useState([
    { id: 1, title: 'Early Adopter', type: 'ACHIEVEMENT', description: 'First connection to the Hive Mind', timestamp: new Date().toISOString() }
  ]);
  
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
      details: isAlways ? 'Regra permanente criada (Permitir Todos)' : 'Aprovação pontual',
      // Simulate snapshot for undo
      snapshot: {
          file: '/tmp/test-file-created-by-approval.txt',
          content: 'This file was created by the approval action.'
      }
    }, ...prev]);
    
    // Simulate File Creation for Undo Demo
    try {
        const fs = window.require('fs');
        fs.writeFileSync('/tmp/test-file-created-by-approval.txt', 'This file was created by the approval action.');
        console.log('Simulated file creation: /tmp/test-file-created-by-approval.txt');
    } catch (e) { console.error('Simulated file creation failed', e); }
    
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
    
    setMessages(prev => [...prev, { role: 'agent', content: `🌀 Revertendo o ciclo da ação #${undoModal.id}: Restaurando o estado anterior...` }]);
    
    if (undoModal.operationId) {
      try {
        const path = window.require('path');
        const os = window.require('os');
        // Hardcoded path for demo environment consistency
        const journalPath = path.join(os.homedir(), 'Documents/PROJETOS/ai-agent-ide-context-sync/packages/cli/core/reliability/ExecutionJournal.js');
        
        if (window.require('fs').existsSync(journalPath)) {
          const ExecutionJournal = window.require(journalPath);
          const projectRoot = path.join(os.homedir(), 'Documents/PROJETOS/ai-agent-ide-context-sync');
          const journal = new ExecutionJournal(projectRoot);
          
          // Execute rollback asynchronously but we are in a sync handler, so we just trigger it
          journal.rollback(undoModal.operationId).then(success => {
             if (success) {
               // Update UI only on success
               setApprovalHistory(prev => prev.filter(i => i.id !== undoModal.id));
               alert(`Rollback Realizado: O arquivo criado/modificado foi restaurado.`);
             } else {
               alert(`Falha no Rollback: Snapshot não encontrado.`);
             }
          });
          setUndoModal(null);
          return;
        }
      } catch (e) {
        console.error("Rollback Error:", e);
      }
    }

    // Mock fallback
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

      {/* Undo Modal */}
      {undoModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{marginTop:0}}>🌀 Complex Undo</h3>
            <p>Você está prestes a reverter a ação: <strong>{undoModal.title}</strong></p>
            
            <div style={{background: '#222', padding: '10px', borderRadius: '4px', margin: '15px 0', fontSize: '12px', border: '1px solid #444'}}>
              <div style={{marginBottom:'5px'}}><strong>Impact Analysis:</strong></div>
              <ul style={{paddingLeft: '20px', margin: 0, color: '#aaa'}}>
                <li>File {undoModal.snapshot?.file || 'unknown'} will be deleted.</li>
                <li>State in memory will be reverted.</li>
                <li>No other side effects detected.</li>
              </ul>
            </div>

            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
              <button onClick={() => setUndoModal(null)} style={{background: '#555', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer'}}>Cancelar</button>
              <button onClick={confirmUndo} style={{background: '#f44336', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer'}}>Confirmar Reversão</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="sidebar left-sidebar" style={{width: leftSidebarOpen ? '250px' : '0', opacity: leftSidebarOpen ? 1 : 0}}>
        <div className="sidebar-header">
           <h3 style={{margin:0}}>🧬 Nexus</h3>
           <div className="status-dot" style={{background: agentStatus.includes('Harmonia') ? '#4caf50' : '#ff9800'}} title={agentStatus}></div>
        </div>
        
        <div className="menu-item" onClick={() => setActiveActivity('chat')}>💬 Consciência (Chat)</div>
        <div className="menu-item" onClick={() => setActiveActivity('projects')}>📂 Projetos (Registry)</div>
        <div className="menu-item" onClick={() => setActiveActivity('processes')}>⚙️ Processos (Swarm)</div>
        <div className="menu-item" onClick={() => setActiveActivity('hearts')}>❤️ Vault (Souls)</div>
        
        <div style={{marginTop: 'auto', padding: '10px', fontSize: '10px', color: '#666'}}>
          Tone: {globalTone.toUpperCase()} <br/>
          Status: {agentStatus}
        </div>
      </div>

      <div className="main-content">
        <button className="toggle-btn" style={{left: '10px'}} onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}>☰</button>
        <button className="toggle-btn" style={{right: '10px'}} onClick={() => setRightSidebarOpen(!rightSidebarOpen)}>☰</button>

        {activeActivity === 'chat' && (
          <>
            <div className="chat-history">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <div className="message-content">
                    {msg.content}
                  </div>
                  {msg.tone && <div className="message-tone" title={`Tone: ${msg.tone}`}>{getToneEmoji(msg.tone)}</div>}
                </div>
              ))}
            </div>
            
            <div className="chat-input-area">
              <input 
                type="text" 
                className="chat-input" 
                placeholder="Converse com a colmeia..." 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage()}
              />
              <button className="send-btn" onClick={sendMessage}>Enviar</button>
            </div>
          </>
        )}

        {activeActivity === 'projects' && (
          <div className="projects-view" style={{padding: '20px'}}>
            <h2>Registry de Projetos</h2>
            <div className="project-grid">
              {projects.map(p => (
                <div key={p.path} className="project-card" onClick={() => setSelectedProject(p)}>
                  <h3>{p.name}</h3>
                  <p>{p.path}</p>
                  <div className="role-tags">
                     {projectRoles[p.name] && Object.entries(projectRoles[p.name]).map(([role, agent]) => (
                       <span key={role} className="role-tag" title={agent}>{role}: {agent.substring(0,2)}..</span>
                     ))}
                     <button className="add-role-btn" onClick={(e) => { e.stopPropagation(); assignRole(p.name, 'Manager'); }}>+ Role</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeActivity === 'processes' && (
          <div className="processes-view" style={{padding: '20px'}}>
             <h2>Atividade da Colmeia (Swarm)</h2>
             <table style={{width: '100%', borderCollapse: 'collapse'}}>
               <thead>
                 <tr style={{textAlign: 'left', color: '#888'}}>
                   <th>Agent</th>
                   <th>Role</th>
                   <th>Task</th>
                   <th>Tone</th>
                   <th>Status</th>
                 </tr>
               </thead>
               <tbody>
                 {processes.map(p => (
                   <tr key={p.id} style={{borderBottom: '1px solid #333'}}>
                     <td style={{padding: '10px 0'}}>{p.agent}</td>
                     <td>{p.role}</td>
                     <td>{p.task}</td>
                     <td>{getToneEmoji(p.tone)} {p.tone}</td>
                     <td><span className={`status-badge ${p.status.toLowerCase()}`}>{p.status}</span></td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}
        
        {activeActivity === 'hearts' && (
          <div className="vault-view" style={{padding: '20px'}}>
             <h2>Soul Vault (SBTs)</h2>
             <div className="sbt-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'15px'}}>
                {sbts.map(sbt => (
                  <div key={sbt.id} style={{background: '#333', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #9c27b0'}}>
                     <div style={{display:'flex', justifyContent:'space-between'}}>
                         <strong style={{color: '#e1bee7'}}>{sbt.title}</strong>
                         <span style={{fontSize:'10px', background:'#4a148c', padding:'2px 6px', borderRadius:'10px'}}>{sbt.type}</span>
                     </div>
                     <p style={{fontSize:'12px', color:'#bbb', margin: '10px 0'}}>{sbt.description}</p>
                     <div style={{fontSize:'10px', color:'#666'}}>Issued: {new Date(sbt.timestamp).toLocaleDateString()}</div>
                     <button style={{width:'100%', marginTop:'10px', background:'transparent', border:'1px solid #9c27b0', color:'#e1bee7', cursor:'pointer'}}>
                         📡 Ressonar (Broadcast)
                     </button>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      <div className="sidebar right-sidebar" style={{width: rightSidebarOpen ? '300px' : '0', opacity: rightSidebarOpen ? 1 : 0, borderLeft: '1px solid #333'}}>
        <div className="sidebar-header">
           <h3 style={{margin:0}}>Fluxo de Decisão</h3>
           <button onClick={() => setShowHistory(!showHistory)} style={{background:'transparent', border:'none', color:'#888', cursor:'pointer'}}>
             {showHistory ? 'Ver Pendentes' : 'Ver Histórico'}
           </button>
        </div>

        <div className="approvals-list">
          {!showHistory ? (
            <>
              {approvals.length === 0 && <div style={{padding:'20px', textAlign:'center', color:'#666'}}>Tudo flui. Nenhuma pendência.</div>}
              {approvals.map(app => (
                <div key={app.id} className={`approval-card ${app.risk}`}>
                  <div className="card-header">
                    <span className="type">{app.type}</span>
                    <span className="risk-badge">{app.risk} risk</span>
                  </div>
                  <div className="card-title">{app.title}</div>
                  <div className="card-actions">
                    {app.risk === 'high' ? (
                      <>
                        <button className="approval-btn btn-approve" onClick={() => handleApprove(app, 'this')}>Aprovar Este</button>
                        <button className="approval-btn btn-deny" onClick={() => handleDeny(app, 'all')}>Reprovar Todos</button>
                        <button className="approval-btn btn-approve-except" onClick={() => handleApproveExcept(app)}>Aprovar Somente</button>
                        <button className="approval-btn btn-deny-except" onClick={() => handleDenyExcept(app)}>Reprovar Exceto</button>
                      </>
                    ) : (
                      <>
                        <button className="approval-btn btn-approve" onClick={() => handleApprove(app, 'all')}>Aprovar Todos</button>
                        <button className="approval-btn btn-deny" onClick={() => handleDeny(app, 'this')}>Reprovar Este</button>
                        <button className="approval-btn btn-approve-except" onClick={() => handleApproveExcept(app)}>Aprovar Exceto</button>
                        <button className="approval-btn btn-deny-except" onClick={() => handleDenyExcept(app)}>Reprovar Somente</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="history-list">
              {approvalHistory.map(item => (
                <div key={item.id} className="history-item">
                   <div style={{display:'flex', justifyContent:'space-between'}}>
                     <strong>{item.item}</strong>
                     <span className={`status ${item.status === 'approved' ? 'green' : 'red'}`}>{item.action}</span>
                   </div>
                   <div style={{fontSize:'11px', color:'#888'}}>{item.details}</div>
                   <div style={{fontSize:'10px', color:'#555', marginTop:'4px'}}>
                     {item.timestamp}
                     {item.exception && <div style={{color:'#e91e63'}}>Exceção: {item.exception}</div>}
                   </div>
                   <button onClick={() => initiateUndo(item)} style={{marginTop:'5px', fontSize:'10px', background:'transparent', border:'1px solid #555', color:'#aaa', cursor:'pointer', width:'100%'}}>
                     ↺ Desfazer (Undo)
                   </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
