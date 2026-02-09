import React, { useState, useEffect } from 'react';

// --- CONFIGURACIÓN DIRECTA (PARA EVITAR ERRORES) ---
const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSx9XNRqhtDX7dlkfBTeMWPoZPwG3LW0rn3JT_XssQUu0vz1llFjNlx1lKr6krkJt-lbVryTzn8Dpyn/pub?gid=1271152041&single=true&output=csv";

const WHATSAPP_NUMBER = "573106964025";
const ADMIN_PASS = "admincreo"; 

const App = () => {
  // --- ESTADOS ---
  const [view, setView] = useState('user'); 
  const [passInput, setPassInput] = useState('');
  
  const [state, setState] = useState({ loading: true, teachers: {}, error: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCursoIdx, setSelectedCursoIdx] = useState(0);

  // --- MEMORIA LOCAL (PARA EVITAR FALLOS DE NUBE) ---
  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('backup_logs_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  // --- CARGA DE DATOS ---
  useEffect(() => {
    fetch(URL_CSV)
      .then(res => res.text())
      .then(csvText => {
        const filas = csvText.split(/\r?\n/);
        const diccionario = {};
        
        filas.forEach((fila) => {
          const c = fila.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          if (c.length < 25) return;
          
          const materia = c[3]?.replace(/"/g, '').trim();
          if (!materia || materia.toUpperCase().includes("PENDIENTE")) return;

          const nombre = c[0]?.replace(/"/g, '').trim();   
          const id = c[1]?.replace(/"/g, '').trim();       
          const grupo = c[5]?.replace(/"/g, '').trim();    
          const creditos = c[7]?.replace(/"/g, '').trim(); 
          const fInicio = c[12]?.replace(/"/g, '').trim(); 

          const semanas = [];
          for (let i = 14; i <= 29; i++) { 
            const texto = c[i]?.replace(/"/g, '').trim() || "";
            if (texto && texto !== "-" && texto !== "0" && !texto.toLowerCase().includes("pendiente")) {
              const zoomId = texto.match(/\d{9,11}/)?.[0];
              const horaMatch = texto.match(/(\d{1,2}\s*A\s*\d{1,2})/i);
              const partes = texto.split('-');
              
              semanas.push({
                num: i - 13,
                fecha: partes[0] ? partes[0].trim() : "Programada",
                hora: horaMatch ? horaMatch[0] : (partes[1] ? partes[1].trim() : "Por definir"),
                zoomId: zoomId,
                zoomLink: zoomId ? `https://zoom.us/j/${zoomId}` : null
              });
            }
          }

          if (id && !isNaN(id)) {
            const idLimpio = id.split('.')[0]; 
            if (!diccionario[idLimpio]) diccionario[idLimpio] = { nombre, idReal: idLimpio, cursos: [] };
            if (semanas.length > 0) {
              diccionario[idLimpio].cursos.push({ materia, grupo, creditos, fInicio, semanas });
            }
          }
        });
        setState({ loading: false, teachers: diccionario, error: null });
      })
      .catch(err => setState(s => ({ ...s, loading: false, error: "Error de conexión." })));
  }, []);

  // --- BÚSQUEDA ---
  const handleSearch = (e) => {
    e.preventDefault();
    const idBusqueda = searchTerm.replace(/\D/g, '');
    const encontrado = !!state.teachers[idBusqueda];
    
    const nuevoLog = {
      fecha: new Date().toLocaleString('es-CO'),
      doc: idBusqueda || "Vacío",
      estado: encontrado ? '✅ Éxito' : '❌ Fallido'
    };
    
    const nuevosLogs = [nuevoLog, ...logs].slice(0, 50);
    setLogs(nuevosLogs);
    localStorage.setItem('backup_logs_v2', JSON.stringify(nuevosLogs));

    if (encontrado) {
      setSelectedId(idBusqueda);
      setSelectedCursoIdx(0);
    } else { alert("Identificación no encontrada."); }
  };

  const clearLogs = () => {
    if(window.confirm("¿Borrar historial?")) {
      setLogs([]);
      localStorage.removeItem('backup_logs_v2');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passInput === ADMIN_PASS) setView('admin');
    else alert("Clave incorrecta");
  };

  const handleReset = () => { setSelectedId(null); setSearchTerm(''); setSelectedCursoIdx(0); };

  // --- VISTA ADMIN ---
  if (view === 'admin') {
    return (
      <div style={{fontFamily:'Segoe UI, sans-serif', background:'#f4f6f8', minHeight:'100vh', padding:'20px'}}>
        <div style={{maxWidth:'1000px', margin:'0 auto'}}>
          <header style={{background:'#2c3e50', color:'white', padding:'20px', borderRadius:'10px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
            <div>
              <h2 style={{margin:0}}>PANEL DE CONTROL</h2>
              <small style={{color:'#f1c40f'}}>SISTEMA ACTIVO</small>
            </div>
            <div style={{display:'flex', gap:'10px'}}>
              <button onClick={clearLogs} style={{background:'rgba(231,76,60,0.2)', color:'#ffadad', border:'1px solid #e74c3c', padding:'8px', borderRadius:'5px', cursor:'pointer'}}>Borrar</button>
              <button onClick={()=>setView('user')} style={{background:'white', border:'none', padding:'8px 15px', borderRadius:'5px', cursor:'pointer', fontWeight:'bold', color:'#2c3e50'}}>SALIR</button>
            </div>
          </header>
          
          <div style={{background:'white', borderRadius:'10px', padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
            <h3 style={{marginTop:0, borderBottom:'1px solid #eee', paddingBottom:'15px'}}>Historial</h3>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.9rem'}}>
              <thead>
                <tr style={{background:'#f8f9fa', textAlign:'left'}}>
                  <th style={{padding:'10px'}}>Fecha</th>
                  <th style={{padding:'10px'}}>Documento</th>
                  <th style={{padding:'10px'}}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={i} style={{borderBottom:'1px solid #eee'}}>
                    <td style={{padding:'10px'}}>{l.fecha}</td>
                    <td style={{padding:'10px'}}><b>{l.doc}</b></td>
                    <td style={{padding:'10px', color: l.estado.includes('Éxito')?'green':'red'}}>{l.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA USUARIO ---
  if (state.loading) return <div className="loading-screen"><div className="spinner"></div><p>Cargando Portal...</p></div>;
  if (state.error) return <div className="error-screen"><h3>⚠️ Error</h3><p>{state.error}</p></div>;

  return (
    <div className="portal-container">
      <style>{`
        :root { --primary: #003366; --secondary: #D4AF37; --orange: #FF6600; --bg: #f4f6f8; --text: #333; }
        body { margin: 0; font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); }
        .header { background: var(--primary); padding: 15px 0; border-bottom: 4px solid var(--secondary); position: sticky; top: 0; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
        .brand h1 { margin: 0; font-size: 1.6rem; font-weight: 800; color: var(--orange); text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
        .brand h2 { margin: 5px 0 0; font-size: 0.75rem; color: white; font-weight: 600; letter-spacing: 1px; opacity: 0.9; }
        .actions { display: flex; gap: 10px; }
        .search-form { display: flex; background: rgba(255,255,255,0.15); padding: 4px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); }
        .search-form input { background: transparent; border: none; padding: 8px; outline: none; color: white; width: 160px; font-weight: 500; }
        .btn-search { background: var(--secondary); color: var(--primary); border: none; padding: 8px 20px; border-radius: 4px; font-weight: bold; cursor: pointer; }
        .btn-reset { background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; }
        .main-content { max-width: 1200px; margin: 30px auto; padding: 0 20px; display: flex; flex-direction: column; gap: 30px; }
        .welcome-box { grid-column: 1/-1; text-align: center; padding: 60px 20px; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border-top: 5px solid var(--orange); }
        .welcome-title { color: var(--primary); font-size: 1.8rem; margin-bottom: 20px; font-weight: 700; }
        .welcome-text { font-size: 1.1rem; color: #555; line-height: 1.6; max-width: 800px; margin: 0 auto; }
        .welcome-note { margin-top: 25px; font-size: 0.95rem; color: #888; font-style: italic; background: #f8fafc; display: inline-block; padding: 10px 20px; border-radius: 50px; }
        .sidebar { background: white; border-radius: 10px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .prof-info h3 { margin: 0; color: var(--primary); font-size: 1.2rem; }
        .nav-title { font-size: 0.7rem; color: var(--secondary); font-weight: 800; text-transform: uppercase; margin: 20px 0 10px; display: block; }
        .courses-nav { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; }
        .course-btn { min-width: 220px; text-align: left; background: #fff; border: 1px solid #e0e0e0; padding: 15px; border-radius: 8px; cursor: pointer; position: relative; }
        .course-btn.active { background: #fdfcf5; border-color: var(--secondary); border-left: 5px solid var(--secondary); }
        .dashboard { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05); flex: 1; }
        .dash-head { background: var(--primary); color: white; padding: 25px 30px; }
        .stats-bar { display: grid; grid-template-columns: repeat(3, 1fr); background: #f9f9f9; border-bottom: 1px solid #eee; }
        .stat { padding: 20px; text-align: center; border-right: 1px solid #eee; }
        .stat span { font-size: 1.1rem; color: var(--primary); font-weight: 700; }
        .weeks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; padding: 30px; }
        .week-card { border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; background: #fff; transition: 0.3s; }
        .week-card:hover { transform: translateY(-3px); border-color: var(--secondary); }
        .week-tag { font-size: 0.7rem; font-weight: 800; color: var(--secondary); text-transform: uppercase; margin-bottom: 10px; display: block; }
        .date { font-size: 0.95rem; font-weight: 600; color: #333; margin-bottom: 5px; }
        .time { font-size: 0.85rem; color: #666; margin-bottom: 15px; display: flex; align-items: center; gap: 5px; }
        .zoom-area { background: #f0f4f8; padding: 15px; border-radius: 8px; text-align: center; border: 1px dashed #cbd5e1; }
        .zoom-link { display: block; background: #2D8CFF; color: white; padding: 10px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 0.85rem; }
        .whatsapp-btn { position: fixed; bottom: 25px; right: 25px; background: #25D366; color: white; padding: 12px 24px; border-radius: 50px; text-decoration: none; font-weight: bold; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4); z-index: 9999; display: flex; align-items: center; gap: 10px; }
        .loading-screen, .error-screen { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--primary); font-weight: bold; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid var(--secondary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 15px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @media (min-width: 900px) {
          .main-content { flex-direction: row; align-items: flex-start; }
          .sidebar { width: 300px; flex-shrink: 0; position: sticky; top: 100px; }
          .courses-nav { flex-direction: column; overflow-x: visible; }
        }
      `}</style>

      {view === 'login' && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <form onSubmit={handleLogin} style={{background:'white', padding:'30px', borderRadius:'10px', width:'300px', textAlign:'center'}}>
            <h3 style={{color:'var(--primary)', marginTop:0}}>Acceso Admin</h3>
            <input type="password" placeholder="Contraseña..." value={passInput} onChange={(e)=>setPassInput(e.target.value)} style={{width:'100%', padding:'10px', marginBottom:'15px', border:'1px solid #ddd', borderRadius:'5px'}} autoFocus />
            <div style={{display:'flex', gap:'10px'}}>
              <button type="button" onClick={()=>setView('user')} style={{flex:1, padding:'10px', cursor:'pointer'}}>Cancelar</button>
              <button type="submit" style={{flex:1, background:'var(--primary)', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'}}>Entrar</button>
            </div>
          </form>
        </div>
      )}

      <header className="header">
        <div className="header-content">
          <div className="brand" onClick={handleReset} style={{cursor: 'pointer'}}>
            <h1>PORTAL DOCENTES CREO</h1>
            <h2>ADMINISTRACIÓN DE LA SEGURIDAD Y SALUD EN EL TRABAJO</h2>
          </div>
          <div className="actions">
            {docente && <button onClick={handleReset} className="btn-reset">Nueva Consulta ↺</button>}
            {!docente && (
              <form onSubmit={handleSearch} className="search-form">
                <input type="text" placeholder="Documento..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
                <button type="submit" className="btn-search">BUSCAR</button>
              </form>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        {!docente ? (
          <div className="welcome-box">
            <h2 className="welcome-title">Bienvenido a la consulta de sus asignaciones y horarios docente de programa</h2>
            <p className="welcome-text">Ingrese su número de documento en la parte superior para acceder a su programación académica, enlaces de conexión y detalles de grupos asignados.</p>
            <div className="welcome-note">Si tienes algún error en su asignación porfavor escribir a mesa de ayuda.</div>
            <div style={{marginTop:'40px', opacity:0.3, cursor:'pointer'}} onClick={()=>setView('login')} title="Admin">🔒</div>
          </div>
        ) : (
          <>
            <aside className="sidebar">
              <div className="prof-info">
                <h3>{docente.nombre}</h3>
                <span>ID: {docente.idReal}</span>
              </div>
              <span className="nav-title">ASIGNATURAS</span>
              <div className="courses-nav">
                {docente.cursos.map((c, i) => (
                  <button key={i} onClick={()=>setSelectedCursoIdx(i)} className={`course-btn ${selectedCursoIdx === i ? 'active' : ''}`}>
                    <b>{c.materia}</b>
                    <span>Grupo {c.grupo}</span>
                  </button>
                ))}
              </div>
            </aside>
            <section className="dashboard">
              <div className="dash-head"><h3>{cursoActivo.materia}</h3></div>
              <div className="stats-bar">
                <div className="stat"><label>Grupo</label><span>{cursoActivo.grupo}</span></div>
                <div className="stat"><label>Créditos</label><span>{cursoActivo.creditos}</span></div>
                <div className="stat"><label>Inicio</label><span>{cursoActivo.fInicio}</span></div>
              </div>
              <div className="weeks-grid">
                {cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} className="week-card">
                    <span className="week-tag">SEMANA {s.num}</span>
                    <div className="date">📅 {s.fecha}</div>
                    <div className="time">⏰ {s.hora}</div>
                    {s.zoomId ? (
                      <div className="zoom-area">
                        <span className="zoom-id">ID: {s.zoomId}</span>
                        <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-link">ENTRAR A CLASE</a>
                      </div>
                    ) : (
                      <div style={{marginTop:'15px', fontStyle:'italic', color:'#aaa', fontSize:'0.8rem', textAlign:'center'}}>Sin sala asignada</div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="whatsapp-btn">
        <span style={{fontSize:'1.2rem'}}>💬</span> Mesa de Ayuda
      </a>
    </div>
  );
};

export default App;