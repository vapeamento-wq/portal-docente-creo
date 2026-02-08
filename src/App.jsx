import React, { useState, useEffect, useMemo } from 'react';

// --- CONFIGURACIÓN ---
const URL_CSV = 
  import.meta.env?.VITE_SHEET_URL || 
  process.env?.VITE_SHEET_URL || 
  process.env?.REACT_APP_SHEET_URL || 
  ""; 
const WHATSAPP_NUMBER = "573106964025";
const ADMIN_PASS = "admincreo"; // Contraseña del Administrador

const App = () => {
  // --- ESTADOS DE LA APP ---
  const [view, setView] = useState('user'); // 'user' o 'admin'
  const [adminAuth, setAdminAuth] = useState(false);
  const [passInput, setPassInput] = useState('');
  
  const [state, setState] = useState({ loading: true, teachers: {}, error: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCursoIdx, setSelectedCursoIdx] = useState(0);

  // Simulación de Logs (En el futuro esto vendrá de una base de datos real)
  const [logs, setLogs] = useState([
    { fecha: '08/02/2026 14:30', doc: '85467800', estado: '✅ Éxito', ip: '192.168.1.1' },
    { fecha: '08/02/2026 14:35', doc: '12345678', estado: '❌ No encontrado', ip: '186.14.22.10' },
    { fecha: '08/02/2026 15:00', doc: '1090444907', estado: '✅ Éxito', ip: '201.20.10.5' },
  ]);

  useEffect(() => {
    if (!URL_CSV) {
      setState(s => ({ ...s, loading: false, error: "Error: Variable de entorno no configurada." }));
      return;
    }
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
            if (semanas.length > 0) diccionario[idLimpio].cursos.push({ materia, grupo, creditos, fInicio, semanas });
          }
        });
        setState({ loading: false, teachers: diccionario, error: null });
      })
      .catch(err => setState(s => ({ ...s, loading: false, error: "Error de conexión." })));
  }, []);

  const docente = useMemo(() => selectedId ? state.teachers[selectedId] : null, [selectedId, state.teachers]);
  const cursoActivo = docente ? docente.cursos[selectedCursoIdx] : null;

  const handleSearch = (e) => {
    e.preventDefault();
    const idBusqueda = searchTerm.replace(/\D/g, '');
    
    // LOGICA DE REGISTRO (Aquí se guardaría en la base de datos real)
    const nuevoLog = {
      fecha: new Date().toLocaleString(),
      doc: idBusqueda,
      estado: state.teachers[idBusqueda] ? '✅ Éxito' : '❌ No encontrado',
      ip: 'Usuario'
    };
    setLogs(prev => [nuevoLog, ...prev]);

    if (state.teachers[idBusqueda]) {
      setSelectedId(idBusqueda);
      setSelectedCursoIdx(0);
    } else { alert("Identificación no encontrada."); }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passInput === ADMIN_PASS) {
      setAdminAuth(true);
      setView('admin');
    } else {
      alert("Acceso Denegado");
    }
  };

  const handleReset = () => { setSelectedId(null); setSearchTerm(''); setSelectedCursoIdx(0); };

  // --- VISTA ADMINISTRADOR ---
  if (view === 'admin' && adminAuth) {
    return (
      <div style={{fontFamily: 'Segoe UI, sans-serif', background: '#f4f6f8', minHeight: '100vh'}}>
        <header style={{background: '#2c3e50', padding: '15px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h2 style={{margin:0}}>PANEL ADMINISTRATIVO</h2>
            <small style={{color: '#f1c40f'}}>CONTROL DE ACCESO Y AUDITORÍA</small>
          </div>
          <button onClick={() => setView('user')} style={{background: 'white', color: '#2c3e50', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'}}>⬅ Volver al Portal</button>
        </header>

        <main style={{maxWidth: '1000px', margin: '30px auto', padding: '0 20px'}}>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px'}}>
            <div style={{background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderLeft: '5px solid #2ecc71'}}>
              <h3 style={{margin: '0 0 10px 0', color: '#7f8c8d', fontSize: '0.8rem'}}>ESTADO DEL SISTEMA</h3>
              <b style={{fontSize: '1.2rem', color: '#2ecc71'}}>EN LÍNEA ✅</b>
            </div>
            <div style={{background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderLeft: '5px solid #3498db'}}>
              <h3 style={{margin: '0 0 10px 0', color: '#7f8c8d', fontSize: '0.8rem'}}>TOTAL CONSULTAS (HOY)</h3>
              <b style={{fontSize: '1.5rem', color: '#2c3e50'}}>{logs.length}</b>
            </div>
            <div style={{background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderLeft: '5px solid #e74c3c'}}>
              <h3 style={{margin: '0 0 10px 0', color: '#7f8c8d', fontSize: '0.8rem'}}>ERRORES DE BÚSQUEDA</h3>
              <b style={{fontSize: '1.5rem', color: '#e74c3c'}}>{logs.filter(l => l.estado.includes('No')).length}</b>
            </div>
          </div>

          <div style={{background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
            <div style={{padding: '20px', borderBottom: '1px solid #eee'}}>
              <h3 style={{margin: 0, color: '#2c3e50'}}>📋 Registro de Actividad Reciente</h3>
            </div>
            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem'}}>
              <thead style={{background: '#f8f9fa'}}>
                <tr>
                  <th style={{padding: '15px', textAlign: 'left', color: '#7f8c8d'}}>FECHA / HORA</th>
                  <th style={{padding: '15px', textAlign: 'left', color: '#7f8c8d'}}>DOCUMENTO BUSCADO</th>
                  <th style={{padding: '15px', textAlign: 'left', color: '#7f8c8d'}}>RESULTADO</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} style={{borderBottom: '1px solid #eee'}}>
                    <td style={{padding: '15px'}}>{log.fecha}</td>
                    <td style={{padding: '15px'}}><b>{log.doc}</b></td>
                    <td style={{padding: '15px'}}>
                      <span style={{
                        background: log.estado.includes('Éxito') ? '#e8f8f5' : '#fdedec',
                        color: log.estado.includes('Éxito') ? '#27ae60' : '#c0392b',
                        padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold'
                      }}>
                        {log.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    );
  }

  // --- VISTA USUARIO (PORTAL NORMAL) ---
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
        .search-form input::placeholder { color: rgba(255,255,255,0.7); }
        .btn-search { background: var(--secondary); color: var(--primary); border: none; padding: 8px 20px; border-radius: 4px; font-weight: bold; cursor: pointer; transition: 0.2s; }
        .btn-search:hover { background: white; }
        .btn-reset { background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; }
        .main-content { max-width: 1200px; margin: 30px auto; padding: 0 20px; display: flex; flex-direction: column; gap: 30px; }
        .welcome-box { grid-column: 1/-1; text-align: center; padding: 60px 20px; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border-top: 5px solid var(--orange); }
        .welcome-title { color: var(--primary); font-size: 1.8rem; margin-bottom: 20px; font-weight: 700; }
        .welcome-text { font-size: 1.1rem; color: #555; line-height: 1.6; max-width: 800px; margin: 0 auto; }
        .welcome-note { margin-top: 25px; font-size: 0.95rem; color: #888; font-style: italic; background: #f8fafc; display: inline-block; padding: 10px 20px; border-radius: 50px; }
        .sidebar { background: white; border-radius: 10px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .prof-info h3 { margin: 0; color: var(--primary); font-size: 1.2rem; }
        .prof-info span { font-size: 0.8rem; color: #666; display: block; margin-top: 5px; }
        .nav-title { font-size: 0.7rem; color: var(--secondary); font-weight: 800; text-transform: uppercase; margin: 20px 0 10px; display: block; }
        .courses-nav { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; }
        .course-btn { min-width: 220px; text-align: left; background: #fff; border: 1px solid #e0e0e0; padding: 15px; border-radius: 8px; cursor: pointer; transition: 0.2s; position: relative; }
        .course-btn.active { background: #fdfcf5; border-color: var(--secondary); border-left: 5px solid var(--secondary); }
        .course-btn b { display: block; color: var(--primary); font-size: 0.9rem; margin-bottom: 5px; }
        .dashboard { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05); flex: 1; }
        .dash-head { background: var(--primary); color: white; padding: 25px 30px; }
        .dash-head h3 { margin: 0; font-size: 1.3rem; font-weight: 600; text-transform: uppercase; }
        .stats-bar { display: grid; grid-template-columns: repeat(3, 1fr); background: #f9f9f9; border-bottom: 1px solid #eee; }
        .stat { padding: 20px; text-align: center; border-right: 1px solid #eee; }
        .stat label { display: block; font-size: 0.65rem; color: #888; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; }
        .stat span { font-size: 1.1rem; color: var(--primary); font-weight: 700; }
        .weeks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; padding: 30px; }
        .week-card { border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; background: #fff; transition: 0.3s; }
        .week-card:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.05); border-color: var(--secondary); }
        .week-tag { font-size: 0.7rem; font-weight: 800; color: var(--secondary); text-transform: uppercase; margin-bottom: 10px; display: block; }
        .date { font-size: 0.95rem; font-weight: 600; color: #333; margin-bottom: 5px; }
        .time { font-size: 0.85rem; color: #666; margin-bottom: 15px; display: flex; align-items: center; gap: 5px; }
        .zoom-area { background: #f0f4f8; padding: 15px; border-radius: 8px; text-align: center; border: 1px dashed #cbd5e1; }
        .zoom-id { display: block; font-size: 0.8rem; color: var(--primary); font-weight: 700; margin-bottom: 8px; }
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

      {/* LOGIN MODAL PARA ADMIN (SOLO VISIBLE SI view ES 'login') */}
      {view === 'login' && (
        <div style={{position: 'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <form onSubmit={handleLogin} style={{background:'white', padding:'30px', borderRadius:'10px', textAlign:'center', width:'300px'}}>
            <h3 style={{color: 'var(--primary)', marginTop:0}}>Acceso Administrativo</h3>
            <input type="password" placeholder="Contraseña..." value={passInput} onChange={(e)=>setPassInput(e.target.value)} style={{width:'100%', padding:'10px', marginBottom:'15px', border:'1px solid #ccc', borderRadius:'5px'}} autoFocus />
            <div style={{display:'flex', gap:'10px'}}>
              <button type="button" onClick={()=>setView('user')} style={{flex:1, padding:'10px', background:'#ccc', border:'none', borderRadius:'5px', cursor:'pointer'}}>Cancelar</button>
              <button type="submit" style={{flex:1, padding:'10px', background:'var(--primary)', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'}}>Entrar</button>
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
            {docente && (
              <button onClick={handleReset} className="btn-reset">
                Nueva Consulta ↺
              </button>
            )}
            {!docente && (
              <form onSubmit={handleSearch} className="search-form">
                <input type="text" placeholder="Documento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
            <p className="welcome-text">
              Ingrese su número de documento en la parte superior para acceder a su programación académica, enlaces de conexión y detalles de grupos asignados.
            </p>
            <div className="welcome-note">
              Si tienes algún error en su asignación porfavor escribir a mesa de ayuda.
            </div>
            
            {/* BOTÓN CANDADO PARA ENTRAR A ADMIN */}
            <div style={{marginTop: '40px', opacity: 0.3, cursor: 'pointer'}} onClick={() => setView('login')} title="Acceso Administrativo">
              🔒
            </div>
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
                  <button key={i} onClick={() => setSelectedCursoIdx(i)} className={`course-btn ${selectedCursoIdx === i ? 'active' : ''}`}>
                    <b>{c.materia}</b>
                    <span>Grupo {c.grupo}</span>
                  </button>
                ))}
              </div>
            </aside>

            <section className="dashboard">
              <div className="dash-head">
                <h3>{cursoActivo.materia}</h3>
              </div>
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
                      <div style={{marginTop:'15px', fontStyle:'italic', color:'#aaa', fontSize:'0.8rem', textAlign:'center'}}>
                        Sin sala asignada
                      </div>
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