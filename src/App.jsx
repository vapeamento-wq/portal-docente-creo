import React, { useState, useEffect } from 'react';

// --- ⚡ CONFIGURACIÓN MAESTRA (V23.0 BETA - LABORATORIO SEGURO) ---
const FIREBASE_DB_URL = "https://portal-creo-db-default-rtdb.firebaseio.com/docentes/"; 
const URL_SCRIPT_LOGS = "https://script.google.com/macros/s/AKfycbzME0D_wVP6l4AxLsZMFT4gIDJoD5LAlUhrQ1OL3Al1tAUZZvmiiF1VOlYmiUqY_DeL/exec";
const URL_TU_EXCEL_MAESTRO = "https://docs.google.com/spreadsheets/d/1fHgj_yep0s7955EeaRpFiJeBLJX_-PLtjOFxWepoprQ/edit";
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
      const datosLog = { fecha: new Date().toLocaleString('es-CO'), doc: documento, estado: `[TEST] ${accion}` };
      fetch(URL_SCRIPT_LOGS, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datosLog) });
    } catch (e) { console.error(e); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const idBusqueda = searchTerm.replace(/\D/g, '');
    if (!idBusqueda) { showToast('❌ Inválido'); return; }
    setLoading(true);
    fetch(`${FIREBASE_DB_URL}${idBusqueda}.json`).then(res => res.json()).then(data => {
      setLoading(false);
      if (data) {
        setDocente({ ...data, cursos: procesarCursos(data.cursos) });
        registrarLog(idBusqueda, '✅ Éxito Pruebas');
      } else {
        showToast('❌ No encontrado');
        registrarLog(idBusqueda, '❌ Error Pruebas');
      }
    }).catch(() => { setLoading(false); showToast('⚠️ Error'); });
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
         if (textoUpper.includes("TRABAJO")) { tipo = 'INDEPENDIENTE'; displayTexto = "Trabajo Independiente"; ubicacion = "Estudio Autónomo"; }
         else if (textoUpper.includes("PRESENCIAL")) { tipo = 'PRESENCIAL'; displayTexto = "Campus Principal - Presencial"; ubicacion = "Sede Principal"; }
         else {
            const idMatch = texto.match(/ID\s*[-:.]?\s*(\d{9,11})/i);
            if (idMatch) finalLink = `https://zoom.us/j/${idMatch[1]}`;
         }
         const horaMatch = texto.match(/(\d{1,2}\s*[aA]\s*\d{1,2})/i); 
         let horaDisplay = horaMatch ? horaMatch[0] : "Programada";
         const partes = texto.split('-');
         let fechaDisplay = partes[0] || `Semana ${i+1}`;
         fechaDisplay = fechaDisplay.replace(/^202[0-9]\s*\/\s*/, '').replace(/\s*\/\s*/g, '/');
         semanasProcesadas.push({ num: i + 1, fecha: fechaDisplay, hora: horaDisplay, tipo, displayTexto, ubicacion, zoomLink: finalLink });
      });
      return { ...curso, semanas: semanasProcesadas };
    });
  };

  const StatBar = ({ label, value, color, percent }) => (
    <div style={{marginBottom:'15px'}}>
      <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.85rem', marginBottom:'5px'}}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div style={{width:'100%', background:'#eee', height:'8px', borderRadius:'10px'}}>
        <div style={{width: `${percent}%`, background: color, height:'100%', borderRadius:'10px'}}></div>
      </div>
    </div>
  );

  if (view === 'admin') {
    return (
      <div style={{fontFamily:'Segoe UI', background:'#f4f6f8', minHeight:'100vh', padding:'20px'}}>
        <div className="fade-in-up" style={{maxWidth:'900px', margin:'0 auto', background:'white', padding:'30px', borderRadius:'25px', boxShadow:'0 20px 50px rgba(0,0,0,0.1)'}}>
          <h2 style={{color:'#003366', borderBottom:'2px solid #eee', paddingBottom:'15px'}}>📊 DASHBOARD DE ANALÍTICA</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'25px', marginTop:'20px'}}>
            <div className="glass-panel" style={{padding:'20px', border:'1px solid #eee', borderRadius:'20px'}}>
              <h4 style={{marginTop:0}}>⏰ Horas Pico de Entrada</h4>
              <StatBar label="7:00 AM - 9:00 AM" value="45 consultas" color="#3498db" percent={85} />
              <StatBar label="11:00 AM - 1:00 PM" value="12 consultas" color="#9b59b6" percent={30} />
              <StatBar label="6:00 PM - 8:00 PM" value="28 consultas" color="#e67e22" percent={60} />
            </div>
            <div className="glass-panel" style={{padding:'20px', border:'1px solid #eee', borderRadius:'20px'}}>
              <h4 style={{marginTop:0}}>📅 Día de más Consultas</h4>
              <StatBar label="Lunes" value="Nivel Alto" color="#2ecc71" percent={95} />
              <StatBar label="Miércoles" value="Nivel Medio" color="#f1c40f" percent={50} />
              <StatBar label="Sábado" value="Nivel Bajo" color="#95a5a6" percent={15} />
            </div>
            <div className="glass-panel" style={{padding:'20px', border:'1px solid #eee', background:'#003366', color:'white', borderRadius:'20px'}}>
              <h4 style={{marginTop:0}}>🏆 Docente más Activo</h4>
              <div style={{textAlign:'center', padding:'10px'}}>
                <div style={{fontSize:'3rem'}}>⭐</div>
                <h3 style={{margin:'10px 0'}}>Alberto G.</h3>
                <p style={{fontSize:'0.8rem', opacity:0.8}}>124 consultas registradas</p>
              </div>
            </div>
          </div>
          <div style={{marginTop:'30px', display:'flex', gap:'15px'}}>
            <button onClick={()=>window.open(URL_TU_EXCEL_MAESTRO)} style={{flex:1, padding:'15px', background:'#27ae60', color:'white', border:'none', borderRadius:'15px', fontWeight:'bold', cursor:'pointer'}}>EXCEL MAESTRO</button>
            <button onClick={()=>setView('user')} style={{flex:1, padding:'15px', background:'#eee', border:'none', borderRadius:'15px', fontWeight:'bold', cursor:'pointer'}}>VOLVER</button>
          </div>
        </div>
      </div>
    );
  }

  const cursoActivo = docente && docente.cursos.length > 0 ? docente.cursos[selectedCursoIdx] : null;

  return (
    <div className="portal-container">
      {/* 🚩 RAYA ROJA DE PRUEBAS */}
      <div style={{background:'#e74c3c', color:'white', textAlign:'center', padding:'5px', fontSize:'0.75rem', fontWeight:'bold', position:'sticky', top:0, zIndex:1000}}>
        ⚠️ PORTAL DE PRUEBAS - ENTORNO DE DESARROLLO (SOLO ALBERTO)
      </div>

      <Toast msg={toast.msg} show={toast.show} />
      <style>{`
        :root { --primary: #003366; --secondary: #D4AF37; --bg: #F0F2F5; }
        body { margin: 0; font-family: 'Segoe UI', sans-serif; background: var(--bg); }
        .fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .glass-panel { background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border-radius: 20px; }
        .header { background: var(--primary); padding: 25px 0; color: white; }
        .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; }
        .search-container { background: white; padding: 5px; border-radius: 50px; display: flex; }
        .search-input { padding: 10px 20px; border: none; outline: none; border-radius: 50px; width: 180px; }
        .btn-search { background: var(--secondary); color: var(--primary); border: none; padding: 10px 25px; border-radius: 50px; font-weight: bold; cursor: pointer; }
        .main-content { max-width: 1200px; margin: 40px auto; padding: 0 20px; display: grid; grid-template-columns: 320px 1fr; gap: 40px; }
        .sidebar { padding: 30px; }
        .avatar { width: 80px; height: 80px; background: var(--secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: var(--primary); margin: 0 auto 15px; font-weight: bold; border: 4px solid white; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .course-btn { width: 100%; padding: 15px; margin-bottom: 10px; border: 1px solid transparent; background: transparent; text-align: left; border-radius: 15px; cursor: pointer; color: #666; }
        .course-btn.active { background: white; border-color: var(--secondary); color: var(--primary); font-weight: bold; }
        .hero-card { background: linear-gradient(135deg, #003366 0%, #004080 100%); color: white; padding: 40px; border-radius: 30px; margin-bottom: 30px; }
        .timeline-container { background: white; padding: 40px; border-radius: 30px; }
        .timeline-item { display: flex; gap: 20px; margin-bottom: 25px; }
        .date-circle { width: 45px; height: 45px; border: 2px solid #eee; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 0.7rem; color: #999; flex-shrink: 0; }
        .timeline-content { flex: 1; background: #f9f9f9; padding: 20px; border-radius: 15px; border: 1px solid #eee; }
        .zoom-btn { display: inline-block; background: #2D8CFF; color: white; padding: 10px 20px; border-radius: 50px; text-decoration: none; font-weight: bold; margin-top: 10px; font-size: 0.9rem; }
        .whatsapp-btn { position: fixed; bottom: 30px; right: 30px; background: #25D366; color: white; padding: 15px 25px; border-radius: 50px; text-decoration: none; font-weight: bold; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        @media (max-width: 900px) { 
          .main-content { grid-template-columns: 1fr; margin-top: 20px; } 
          .sidebar { order: -1; display: flex; overflow-x: auto; padding: 15px; gap: 10px; } 
          .course-btn { min-width: 200px; padding: 10px !important; }
          .avatar { width: 60px !important; height: 60px !important; font-size: 1.5rem !important; }
        }
      `}</style>

      <header className="header">
        <div className="header-content">
          <div onClick={() => setDocente(null)} style={{cursor:'pointer'}}>
            <h1 style={{margin:0, fontSize:'1.6rem', color:'var(--secondary)'}}>PORTAL DOCENTES</h1>
            <small>ADMINISTRACIÓN S.S.T.</small>
          </div>
          {!docente && (
            <form onSubmit={handleSearch} className="search-container">
              <input placeholder="Cédula" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="search-input" />
              <button className="btn-search">BUSCAR</button>
            </form>
          )}
        </div>
      </header>

      <main className="main-content">
        {!docente ? (
          <div className="glass-panel fade-in-up" style={{gridColumn:'1 / -1', textAlign:'center', padding:'80px 20px'}}>
            <h1 style={{fontSize:'3rem'}}>👨‍🏫</h1>
            <h2>Portal Docente (Beta)</h2>
            <p>Evolución segura del sistema.</p>
            <div style={{marginTop:'30px', fontWeight:'bold'}}>{formatoFechaHora().fecha}</div>
            <div style={{marginTop:'100px', opacity:0.1, cursor:'pointer'}} onClick={()=>setView('login')}>🔒 Admin</div>
          </div>
        ) : (
          <>
            <aside className="sidebar glass-panel">
              <div style={{textAlign:'center', marginBottom:'30px'}}>
                <div className="avatar">{docente.nombre.charAt(0)}</div>
                <h3 style={{margin:0}}>{docente.nombre.split(' ')[0]}</h3>
              </div>
              {docente.cursos.map((c, i) => (
                <button key={i} onClick={()=>setSelectedCursoIdx(i)} className={`course-btn ${selectedCursoIdx === i ? 'active' : ''}`}>
                  {c.materia}
                </button>
              ))}
            </aside>
            <section>
              <div className="hero-card">
                <h1>{cursoActivo.materia}</h1>
                <p>{cursoActivo.grupo} | {cursoActivo.bloque}</p>
              </div>
              <div className="timeline-container glass-panel">
                {cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="date-circle"><strong>{s.num}</strong></div>
                    <div className="timeline-content">
                      <strong>{s.fecha}</strong>
                      <p>{s.displayTexto || 'Sesión Programada'}</p>
                      {s.zoomLink && <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-btn">Unirse a Zoom</a>}
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