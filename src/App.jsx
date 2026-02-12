import React, { useState, useEffect } from 'react';

// --- ⚡ CONFIGURACIÓN MAESTRA PAMPLE (V23.0 - BASE V21.0) ---
const FIREBASE_DB_URL = "https://portal-creo-db-default-rtdb.firebaseio.com/docentes/"; 
const URL_SCRIPT_LOGS = "https://script.google.com/macros/s/AKfycbzME0D_wVP6l4AxLsZMFT4gIDJoD5LAlUhrQ1OL3Al1tAUZZvmiiF1VOlYmiUqY_DeL/exec";
const URL_TU_EXCEL_MAESTRO = "https://docs.google.com/spreadsheets/d/1fHgj_yep0s7955EeaRpFiJeBLJX_-PLtjOFxWepoprQ/edit";
const URL_FIREBASE_CONSOLE = "https://console.firebase.google.com/";
const WHATSAPP_NUMBER = "573106964025";
const ADMIN_PASS = "admincreo"; 

const Toast = ({ msg, show }) => (
  <div className={`toast-notification ${show ? 'show' : ''}`}>{msg}</div>
);

const App = () => {
  const [view, setView] = useState('user'); 
  const [passInput, setPassInput] = useState('');
  const [loading, setLoading] = useState(false); 
  const [searchTerm, setSearchTerm] = useState('');
  const [docente, setDocente] = useState(null); 
  const [selectedCursoIdx, setSelectedCursoIdx] = useState(0);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminResult, setAdminResult] = useState(null);
  const [fechaActual, setFechaActual] = useState(new Date());
  const [toast, setToast] = useState({ show: false, msg: '' });

  useEffect(() => {
    const timer = setInterval(() => setFechaActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatoFechaHora = () => {
    const opcionesFecha = { weekday: 'long', day: 'numeric', month: 'long' };
    const fecha = fechaActual.toLocaleDateString('es-CO', opcionesFecha);
    const hora = fechaActual.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    return { fecha: fecha.charAt(0).toUpperCase() + fecha.slice(1), hora: hora };
  };

  const showToast = (mensaje) => {
    setToast({ show: true, msg: mensaje });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const registrarLog = (documento, accion) => {
    try {
      const datosLog = { 
        fecha: new Date().toLocaleString('es-CO'), 
        doc: documento, 
        estado: `[LAB] ${accion}` 
      };
      fetch(URL_SCRIPT_LOGS, { 
        method: "POST", 
        mode: "no-cors", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(datosLog) 
      }).catch(err => console.log(err));
    } catch (e) { console.error(e); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const idBusqueda = searchTerm.replace(/\D/g, '');
    if (!idBusqueda) { showToast('❌ Documento inválido'); return; }
    setLoading(true);
    fetch(`${FIREBASE_DB_URL}${idBusqueda}.json`)
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data) {
          setDocente({ ...data, cursos: procesarCursos(data.cursos) });
          setSelectedCursoIdx(0);
          registrarLog(idBusqueda, '✅ Consulta Lab');
        } else {
          showToast('❌ No encontrado');
          registrarLog(idBusqueda, '❌ No encontrado Lab');
        }
      })
      .catch(() => { setLoading(false); showToast('⚠️ Error'); });
  };

  const handleAdminDiagnostico = (e) => {
    e.preventDefault();
    const idBusqueda = adminSearch.replace(/\D/g, '');
    if (!idBusqueda) return;
    setAdminResult('Cargando...');
    fetch(`${FIREBASE_DB_URL}${idBusqueda}.json`)
      .then(res => res.json())
      .then(data => {
        if(data) setAdminResult(`✅ NUBE: ${data.nombre}`);
        else setAdminResult(`❌ NO EXISTE.`);
      });
  };

  const procesarCursos = (cursos) => {
    return cursos.map(curso => {
      const semanasProcesadas = [];
      const semanasRaw = curso.semanasRaw || [];
      semanasRaw.forEach((texto, i) => {
         if (i >= 16) return; 
         if (!texto || texto.length < 5 || texto.startsWith("-") || texto.toLowerCase().includes("pendiente")) return;
         let tipo = 'ZOOM', displayTexto = '', ubicacion = '', finalLink = null;
         const textoUpper = texto.toUpperCase();
         if (textoUpper.includes("TRABAJO INDEPEN")) { tipo = 'INDEPENDIENTE'; displayTexto = "Trabajo Independiente"; } 
         else if (textoUpper.includes("PRESENCIAL")) { tipo = 'PRESENCIAL'; displayTexto = "Campus Principal"; }
         else {
             const idMatch = texto.match(/ID\s*[-:.]?\s*(\d{9,11})/i);
             if (idMatch) finalLink = `https://zoom.us/j/${idMatch[1]}`;
         }
         const horaMatch = texto.match(/(\d{1,2}\s*[aA]\s*\d{1,2})/i); 
         let horaDisplay = horaMatch ? horaMatch[0] : "Programada";
         const partes = texto.split('-');
         let fechaDisplay = partes[0] || `Semana ${i+1}`;
         fechaDisplay = fechaDisplay.replace(/^202[0-9]\s*\/\s*/, '').replace(/\s*\/\s*/g, '/');
         semanasProcesadas.push({ num: i + 1, fecha: fechaDisplay, hora: horaDisplay, tipo, displayTexto, zoomLink: finalLink });
      });
      return { ...curso, semanas: semanasProcesadas };
    });
  };

  // --- COMPONENTE ESTADÍSTICA ---
  const StatBar = ({ label, value, color, percent }) => (
    <div style={{marginBottom:'10px'}}>
      <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', marginBottom:'3px'}}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div style={{width:'100%', background:'#eee', height:'6px', borderRadius:'10px'}}>
        <div style={{width: `${percent}%`, background: color, height:'100%', borderRadius:'10px'}}></div>
      </div>
    </div>
  );

  if (view === 'admin') {
    return (
      <div style={{fontFamily:'Segoe UI', background:'#f4f6f8', minHeight:'100vh', padding:'20px', display:'flex', flexDirection:'column', alignItems:'center'}}>
        <div className="fade-in-up" style={{maxWidth:'850px', width:'100%', background:'white', padding:'30px', borderRadius:'30px', boxShadow:'0 20px 50px rgba(0,0,0,0.1)'}}>
          <h2 style={{color:'#003366', marginBottom:'20px', borderBottom:'2px solid #eee', paddingBottom:'10px'}}>DASHBOARD DE ANALÍTICA (PRUEBAS)</h2>
          
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'20px', marginBottom:'30px'}}>
            <div className="glass-panel" style={{padding:'20px', border:'1px solid #eee'}}>
              <h4 style={{marginTop:0}}>⏰ Horas Pico</h4>
              <StatBar label="Mañana (7-9 AM)" value="45" color="#3498db" percent={85} />
              <StatBar label="Noche (6-8 PM)" value="28" color="#e67e22" percent={60} />
            </div>
            <div className="glass-panel" style={{padding:'20px', border:'1px solid #eee'}}>
              <h4 style={{marginTop:0}}>🏆 Docente Estrella</h4>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:'2.5rem'}}>👤</div>
                <h3>Alberto Cantillo</h3>
              </div>
            </div>
            <div className="glass-panel" style={{padding:'20px', border:'1px solid #eee'}}>
              <h4 style={{marginTop:0}}>📅 Día Activo</h4>
              <StatBar label="Lunes" value="Max" color="#2ecc71" percent={95} />
            </div>
          </div>

          <div style={{display:'flex', gap:'15px'}}>
            <a href={URL_TU_EXCEL_MAESTRO} target="_blank" rel="noreferrer" style={{flex:1, padding:'15px', background:'#27ae60', color:'white', textDecoration:'none', borderRadius:'15px', fontWeight:'bold', textAlign:'center'}}>EXCEL MAESTRO</a>
            <button onClick={()=>setView('user')} style={{flex:1, padding:'15px', borderRadius:'15px', border:'none', background:'#eee', fontWeight:'bold', cursor:'pointer'}}>CERRAR</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-container">
      {/* 🚩 RAYA ROJA DE PRUEBAS SOLICITADA */}
      <div style={{background:'#e74c3c', color:'white', textAlign:'center', padding:'5px', fontSize:'0.7rem', fontWeight:'bold', position:'sticky', top:0, zIndex:1000}}>
        ⚠️ PORTAL DE PRUEBAS - ENTORNO DE EVOLUCIÓN (LINEA GRÁFICA V21.0)
      </div>

      <Toast msg={toast.msg} show={toast.show} />
      <style>{`
        :root { --primary: #003366; --secondary: #db9b32; --bg: #F0F2F5; --text: #1A1A1A; }
        body { margin: 0; font-family: 'Segoe UI', sans-serif; background: var(--bg); }
        .fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .glass-panel { background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
        .header { background: var(--primary); padding: 25px 0; color: white; }
        .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; }
        .brand h1 { margin: 0; color: var(--secondary); font-size: 1.8rem; font-weight: 800; } 
        .search-container { background: white; padding: 5px; border-radius: 50px; display: flex; box-shadow: 0 5px 20px rgba(0,0,0,0.2); }
        .search-input { padding: 10px 20px; border: none; outline: none; border-radius: 50px; width: 180px; }
        .btn-search { background: var(--secondary); color: var(--primary); border: none; padding: 10px 25px; border-radius: 50px; font-weight: bold; cursor: pointer; }
        .main-content { max-width: 1200px; margin: 40px auto; padding: 0 20px; display: grid; grid-template-columns: 320px 1fr; gap: 40px; }
        .sidebar { padding: 30px; height: fit-content; }
        .avatar { width: 90px; height: 90px; background: var(--secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: var(--primary); font-weight: bold; margin: 0 auto 15px; border: 4px solid white; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .course-btn { width: 100%; padding: 15px 20px; margin-bottom: 12px; border: none; background: transparent; text-align: left; border-radius: 15px; cursor:pointer; color: #666; }
        .course-btn.active { background: white; border: 1px solid var(--secondary); color: var(--primary); font-weight: bold; }
        .hero-card { background: linear-gradient(135deg, #003366 0%, #004080 100%); color: white; padding: 40px; border-radius: 30px; margin-bottom: 40px; box-shadow: 0 20px 40px rgba(0, 51, 102, 0.3); }
        .timeline-container { padding: 40px; background: white; border-radius: 30px; }
        .timeline-item { display: flex; gap: 20px; margin-bottom: 25px; position: relative; }
        .date-circle { width: 50px; height: 50px; border: 2px solid #eee; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 0.8rem; color: #999; flex-shrink:0; }
        .timeline-content { flex: 1; background: #fcfcfc; padding: 25px; border-radius: 20px; border: 1px solid #f0f0f0; }
        .zoom-mini-btn { display: inline-flex; align-items: center; gap: 8px; background: #2D8CFF; color: white; padding: 10px 20px; border-radius: 50px; text-decoration: none; font-size: 0.9rem; font-weight: bold; margin-top: 15px; }
        .whatsapp-btn { position: fixed; bottom: 30px; right: 30px; background: #25D366; color: white; padding: 15px 25px; border-radius: 50px; text-decoration: none; font-weight: bold; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }

        /* 📱 AJUSTES MOBILE COMPACTOS (SOLICITADOS) */
        @media (max-width: 900px) { 
          .main-content { grid-template-columns: 1fr; margin-top: 20px; } 
          .sidebar { order: -1; display: flex; overflow-x: auto; padding: 10px; gap: 10px; }
          .course-btn { min-width: 180px; padding: 10px !important; margin: 0; font-size: 0.8rem; }
          .avatar { width: 60px !important; height: 60px !important; font-size: 1.5rem !important; }
          .hero-card { padding: 20px !important; margin-bottom: 20px !important; }
          .hero-card h1 { font-size: 1.4rem !important; }
          .timeline-container { padding: 20px !important; }
          .timeline-content { padding: 15px !important; font-size: 0.85rem; }
          .date-circle { width: 40px !important; height: 40px !important; font-size: 0.65rem !important; }
        }
      `}</style>
      
      <header className="header">
        <div className="header-content">
          <div className="brand" onClick={() => setDocente(null)} style={{cursor:'pointer'}}>
            <h1>PORTAL CREO</h1>
            <small>SEGURIDAD Y SALUD EN EL TRABAJO</small>
          </div>
          {!docente && (
            <form onSubmit={handleSearch} className="search-container">
              <input placeholder="Cédula" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="search-input" />
              <button className="btn-search">CONSULTAR</button>
            </form>
          )}
        </div>
      </header>

      <main className="main-content">
        {!docente ? (
          <div className="glass-panel fade-in-up" style={{gridColumn:'1 / -1', textAlign:'center', padding:'100px 20px'}}>
            <h1 style={{fontSize:'3rem'}}>🧪</h1>
            <h2>Laboratorio de Pruebas</h2>
            <p>Evolución segura del Portal Docente.</p>
            <div style={{marginTop:'30px', fontWeight:'bold'}}>{formatoFechaHora().fecha}</div>
            <div style={{marginTop:'100px', opacity:0.1, cursor:'pointer'}} onClick={()=>setView('login')}>🔒 Admin</div>
          </div>
        ) : (
          <>
            <aside className="sidebar glass-panel">
              <div style={{textAlign:'center', marginBottom:'20px'}}>
                <div className="avatar">{docente.nombre.charAt(0)}</div>
                <h3 style={{margin:0, color:'var(--primary)'}}>{docente.nombre.split(' ')[0]}</h3>
              </div>
              {docente.cursos.map((c, i) => (
                <button key={i} onClick={()=>setSelectedCursoIdx(i)} className={`course-btn ${selectedCursoIdx === i ? 'active' : ''}`}>
                  {c.materia}
                </button>
              ))}
            </aside>

            <section className="dashboard-column">
              <div className="hero-card">
                <h1 style={{margin:0}}>{cursoActivo.materia}</h1>
                <p>{cursoActivo.grupo} | {cursoActivo.bloque}</p>
              </div>
              <div className="timeline-container glass-panel">
                <h3 style={{color:'var(--primary)', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>Cronograma</h3>
                {cursoActivo && cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="date-circle"><strong>{s.num}</strong></div>
                    <div className="timeline-content">
                      <div style={{fontWeight:'bold'}}>{s.fecha}</div>
                      <p style={{margin:'5px 0'}}>{s.displayTexto || 'Sesión Programada'}</p>
                      {s.zoomLink && <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-mini-btn">🎥 Zoom</a>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      
      {view === 'login' && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{background:'white', padding:'30px', borderRadius:'20px', textAlign:'center'}}>
            <h3>Admin Access</h3>
            <input type="password" value={passInput} onChange={e=>setPassInput(e.target.value)} style={{padding:'10px', width:'80%', marginBottom:'20px'}} />
            <button onClick={() => passInput === ADMIN_PASS ? setView('admin') : alert('X')} style={{padding:'10px 20px', background:'var(--primary)', color:'white', border:'none', borderRadius:'10px'}}>Entrar</button>
          </div>
        </div>
      )}
      <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="whatsapp-btn">💬 Ayuda</a>
    </div>
  );
};

export default App;