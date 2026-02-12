import React, { useState, useEffect } from 'react';

// --- ⚡ CONFIGURACIÓN DE PRODUCCIÓN (PORTAL MAIN) ---
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

  const showToast = (mensaje) => {
    setToast({ show: true, msg: mensaje });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const registrarLog = (documento, accion) => {
    try {
      const datosLog = { fecha: new Date().toLocaleString('es-CO'), doc: documento, estado: `[PROD] ${accion}` };
      fetch(URL_SCRIPT_LOGS, { method: "POST", mode: "no-cors", body: JSON.stringify(datosLog) });
    } catch (e) { console.error(e); }
  };

  const addToCalendar = (semana, materia, ubicacion) => {
    const baseUrl = "https://www.google.com/calendar/render?action=TEMPLATE";
    const title = encodeURIComponent(`Clase: ${materia}`);
    const details = encodeURIComponent(`Sesión programada en el Portal Docente.`);
    const location = encodeURIComponent(ubicacion || "Enlace Zoom / Sede");
    window.open(`${baseUrl}&text=${title}&details=${details}&location=${location}`, '_blank');
    registrarLog(docente.idReal, `📅 Calendario: ${materia}`);
  };

  const handlePrint = () => { window.print(); registrarLog(docente.idReal, '📄 PDF/Impresión'); };

  const handleSearch = (e) => {
    e.preventDefault();
    const idBusqueda = searchTerm.replace(/\D/g, '');
    if (!idBusqueda) { showToast('❌ Cédula inválida'); return; }
    setLoading(true);
    fetch(`${FIREBASE_DB_URL}${idBusqueda}.json`).then(res => res.json()).then(data => {
      setLoading(false);
      if (data) {
        setDocente({ ...data, cursos: procesarCursos(data.cursos) });
        registrarLog(idBusqueda, '✅ Ingreso Exitoso');
      } else {
        showToast('❌ No encontrado');
        registrarLog(idBusqueda, '❌ Intento Fallido (No existe)');
      }
    }).catch(() => { setLoading(false); showToast('⚠️ Error de Red'); });
  };

  const procesarCursos = (cursos) => {
    return cursos.map(curso => {
      const semanasProcesadas = [];
      (curso.semanasRaw || []).forEach((texto, i) => {
         if (i >= 16 || !texto || texto.length < 5) return;
         let tipo = 'ZOOM', ubicacion = 'Virtual', finalLink = null;
         const textoUpper = texto.toUpperCase();
         if (textoUpper.includes("TRABAJO")) { tipo = 'INDEPENDIENTE'; ubicacion = 'Autónomo'; }
         else if (textoUpper.includes("PRESENCIAL")) { tipo = 'PRESENCIAL'; ubicacion = 'Campus'; }
         else {
            const idMatch = texto.match(/ID\s*[-:.]?\s*(\d{9,11})/i);
            if (idMatch) finalLink = `https://zoom.us/j/${idMatch[1]}`;
         }
         semanasProcesadas.push({ num: i + 1, texto, tipo, ubicacion, zoomLink: finalLink });
      });
      return { ...curso, semanas: semanasProcesadas };
    });
  };

  const cursoActivo = docente && docente.cursos[selectedCursoIdx];

  if (view === 'admin') {
    return (
      <div style={{padding:'20px', background:'#f4f6f8', minHeight:'100vh', textAlign:'center'}}>
        <div style={{maxWidth:'600px', margin:'0 auto', background:'white', padding:'30px', borderRadius:'20px', boxShadow:'0 10px 30px rgba(0,0,0,0.1)'}}>
          <h2 style={{color:'#003366'}}>CENTRO DE CONTROL MAIN</h2>
          <button onClick={() => window.open(URL_TU_EXCEL_MAESTRO)} style={{width:'100%', padding:'15px', background:'#27ae60', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold', cursor:'pointer', marginBottom:'20px'}}>📊 ABRIR EXCEL MAESTRO</button>
          <button onClick={() => setView('user')} style={{width:'100%', padding:'15px', borderRadius:'10px', border:'1px solid #ddd', cursor:'pointer'}}>⬅ VOLVER</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Toast msg={toast.msg} show={toast.show} />
      <style>{`
        @media print { .no-print { display: none !important; } .main-content { display: block !important; margin:0; } }
        :root { --primary: #003366; --secondary: #D4AF37; }
        body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; margin: 0; }
        .header { background: var(--primary); color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
        .main-content { max-width: 1200px; margin: 20px auto; display: grid; grid-template-columns: 300px 1fr; gap: 20px; padding: 0 20px; }
        .sidebar { background: white; padding: 20px; border-radius: 20px; height: fit-content; }
        .hero-card { background: var(--primary); color: white; padding: 30px; border-radius: 20px; margin-bottom: 20px; }
        .timeline-container { background: white; padding: 30px; border-radius: 20px; }
        .course-btn { width: 100%; padding: 15px; margin-bottom: 10px; border: 1px solid #eee; border-radius: 12px; background: none; text-align: left; cursor: pointer; }
        .course-btn.active { border-color: var(--secondary); background: #fffdf5; }
        .pro-btn { padding: 8px 15px; border-radius: 50px; font-size: 0.8rem; font-weight: bold; cursor: pointer; border: none; }
        .toast-notification { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(100px); background: #333; color: white; padding: 10px 20px; border-radius: 50px; transition: 0.3s; opacity: 0; }
        .toast-notification.show { transform: translateX(-50%) translateY(0); opacity: 1; }
        .whatsapp-btn { position: fixed; bottom: 20px; right: 20px; background: #25d366; color: white; padding: 15px 25px; border-radius: 50px; text-decoration: none; font-weight: bold; z-index:1000; }
        @media (max-width: 900px) { .main-content { grid-template-columns: 1fr; } .sidebar { order: -1; display:flex; overflow-x:auto; gap:10px; } .course-btn { min-width:200px; } }
      `}</style>

      <header className="header no-print">
        <div onClick={() => setDocente(null)} style={{cursor:'pointer'}}>
          <h1 style={{margin:0, fontSize:'1.2rem', color:'var(--secondary)'}}>PORTAL CREO</h1>
          <small>DOCENTES S.S.T.</small>
        </div>
        {!docente ? (
          <form onSubmit={handleSearch} style={{display:'flex', gap:'5px'}}>
            <input placeholder="Cédula..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{padding:'8px', borderRadius:'50px', border:'none', width:'120px'}} />
            <button className="pro-btn" style={{background:'var(--secondary)', color:'var(--primary)'}}>OK</button>
          </form>
        ) : (
          <button onClick={handlePrint} className="pro-btn" style={{background:'#e74c3c', color:'white'}}>📄 PDF</button>
        )}
      </header>

      <main className="main-content">
        {!docente ? (
          <div style={{gridColumn:'1/-1', textAlign:'center', padding:'80px 20px'}}>
            <h1 style={{fontSize:'3rem', margin:0}}>👨‍🏫</h1>
            <h2>Bienvenido</h2>
            <p>Ingresa tu cédula para ver tu programación académica.</p>
            <div onClick={() => setView('login')} style={{marginTop:'100px', opacity:0.2, cursor:'pointer', fontSize:'0.7rem'}}>🔒 Admin</div>
          </div>
        ) : (
          <>
            <aside className="sidebar no-print">
              <h3 style={{marginTop:0}}>{docente.nombre}</h3>
              {docente.cursos.map((c, i) => (
                <button key={i} onClick={()=>setSelectedCursoIdx(i)} className={`course-btn ${selectedCursoIdx === i ? 'active' : ''}`}>
                  <strong>{c.materia}</strong><br/><small>{c.bloque}</small>
                </button>
              ))}
              <button onClick={()=>setDocente(null)} style={{width:'100%', padding:'10px', marginTop:'20px', background:'#eee', border:'none', borderRadius:'10px', cursor:'pointer'}}>↺ Salir</button>
            </aside>

            <section>
              <div className="hero-card">
                <h2 style={{margin:0}}>{cursoActivo.materia}</h2>
                <p>{cursoActivo.grupo} | {cursoActivo.bloque}</p>
                <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
                   <div style={{background:'rgba(255,255,255,0.2)', padding:'5px 10px', borderRadius:'10px', fontSize:'0.8rem'}}>Inicio: {cursoActivo.fInicio}</div>
                   <div style={{background:'rgba(255,255,255,0.2)', padding:'5px 10px', borderRadius:'10px', fontSize:'0.8rem'}}>Fin: {cursoActivo.fFin}</div>
                </div>
              </div>

              <div className="timeline-container">
                {cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} style={{marginBottom:'20px', paddingBottom:'15px', borderBottom:'1px solid #eee'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <strong>Semana {s.num}</strong>
                      <button onClick={() => addToCalendar(s, cursoActivo.materia, s.ubicacion)} className="pro-btn no-print" style={{background:'#3498db', color:'white'}}>📅 Calendario</button>
                    </div>
                    <p style={{margin:'10px 0', fontSize:'0.95rem'}}>{s.texto}</p>
                    {s.zoomLink && <a href={s.zoomLink} target="_blank" rel="noreferrer" style={{color:'#3498db', fontWeight:'bold', textDecoration:'none', fontSize:'0.9rem'}}>🎥 LINK CLASE ZOOM</a>}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="whatsapp-btn no-print">💬 Ayuda</a>

      {view === 'login' && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{background:'white', padding:'40px', borderRadius:'20px', textAlign:'center'}}>
            <h3>Admin Access</h3>
            <input type="password" value={passInput} onChange={e=>setPassInput(e.target.value)} style={{padding:'10px', width:'100%', marginBottom:'20px'}} />
            <button onClick={() => passInput === ADMIN_PASS ? setView('admin') : alert('Contraseña Incorrecta')} style={{padding:'10px 20px', background:'var(--primary)', color:'white', border:'none', borderRadius:'10px'}}>Entrar</button>
            <button onClick={() => setView('user')} style={{background:'none', border:'none', marginLeft:'10px', cursor:'pointer'}}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;