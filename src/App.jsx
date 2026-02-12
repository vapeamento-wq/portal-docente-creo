import React, { useState, useEffect } from 'react';

// --- ⚡ CONFIGURACIÓN MAESTRA (V21.0 - ESTABLE Y COMPROBADA) ---

// 1. LECTURA (Firebase)
const FIREBASE_DB_URL = "https://portal-creo-db-default-rtdb.firebaseio.com/docentes/"; 

// 2. ESCRITURA DE LOGS (Tu Script de Google)
const URL_SCRIPT_LOGS = "https://script.google.com/macros/s/AKfycbzME0D_wVP6l4AxLsZMFT4gIDJoD5LAlUhrQ1OL3Al1tAUZZvmiiF1VOlYmiUqY_DeL/exec";

// 3. ACCESO AL EXCEL MAESTRO
const URL_TU_EXCEL_MAESTRO = "https://docs.google.com/spreadsheets/d/1fHgj_yep0s7955EeaRpFiJeBLJX_-PLtjOFxWepoprQ/edit";

const URL_FIREBASE_CONSOLE = "https://console.firebase.google.com/";
const WHATSAPP_NUMBER = "573106964025";
const ADMIN_PASS = "admincreo"; 

// --- COMPONENTE TOAST ---
const Toast = ({ msg, show }) => (
  <div className={`toast-notification ${show ? 'show' : ''}`}>{msg}</div>
);

const App = () => {
  const [view, setView] = useState('user'); 
  const [passInput, setPassInput] = useState('');
  
  // Estados Usuario
  const [loading, setLoading] = useState(false); 
  const [searchTerm, setSearchTerm] = useState('');
  const [docente, setDocente] = useState(null); 
  const [selectedCursoIdx, setSelectedCursoIdx] = useState(0);
  
  // Estados Admin
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
        estado: `[APP] ${accion}` 
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
    if (!idBusqueda) { showToast('❌ Cédula inválida'); return; }

    setLoading(true);
    setDocente(null);

    fetch(`${FIREBASE_DB_URL}${idBusqueda}.json`)
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data) {
          const cursosProcesados = procesarCursos(data.cursos);
          setDocente({ ...data, cursos: cursosProcesados });
          setSelectedCursoIdx(0);
          registrarLog(idBusqueda, '✅ Consulta Exitosa');
        } else {
          showToast('❌ No encontrado');
          registrarLog(idBusqueda, '❌ ID No Encontrado');
        }
      })
      .catch(err => { 
        setLoading(false); 
        showToast('⚠️ Error de Red');
        registrarLog(idBusqueda, '⚠️ Error de Conexión');
      });
  };

  const handleAdminDiagnostico = (e) => {
    e.preventDefault();
    const idBusqueda = adminSearch.replace(/\D/g, '');
    if (!idBusqueda) return;
    
    setAdminResult('Cargando...');
    fetch(`${FIREBASE_DB_URL}${idBusqueda}.json`)
      .then(res => res.json())
      .then(data => {
        if(data) setAdminResult(`✅ ENCONTRADO:\n${data.nombre}`);
        else setAdminResult(`❌ NO EXISTE EN FIREBASE.`);
      })
      .catch(() => setAdminResult('⚠️ Error'));
  };

  const procesarCursos = (cursos) => {
    return cursos.map(curso => {
      const semanasProcesadas = [];
      const semanasRaw = curso.semanasRaw || [];
      semanasRaw.forEach((texto, i) => {
         if (i >= 16) return; 
         if (!texto || texto.length < 5 || texto.startsWith("-") || texto.toLowerCase().includes("pendiente")) return;

         let tipo = 'ZOOM';
         let displayTexto = '';
         let ubicacion = '';
         let finalLink = null;
         let zoomId = null;
         const textoUpper = texto.toUpperCase();

         if (textoUpper.includes("TRABAJO INDEPEN") || textoUpper.includes("TRABAJO AUTONOMO")) {
             tipo = 'INDEPENDIENTE';
             displayTexto = "Trabajo Independiente";
             ubicacion = "Estudio Autónomo";
         } 
         else if (textoUpper.includes("PRESENCIAL") || textoUpper.includes("CAMPUS")) {
             tipo = 'PRESENCIAL';
             displayTexto = "Campus Principal - Presencial";
             ubicacion = "Sede Principal";
             if (texto.includes("Salón") || texto.includes("Aula")) ubicacion = texto;
         }
         else {
             const idMatch = texto.match(/ID\s*[-:.]?\s*(\d{9,11})/i);
             zoomId = idMatch ? idMatch[1] : null;
             if (zoomId) finalLink = `https://zoom.us/j/${zoomId}`;
         }
         const horaMatch = texto.match(/(\d{1,2}\s*[aA]\s*\d{1,2})/i); 
         let horaDisplay = horaMatch ? horaMatch[0] : "Programada";

         const partes = texto.split('-');
         let fechaDisplay = partes[0] || `Semana ${i+1}`;
         fechaDisplay = fechaDisplay.replace(/^202[0-9]\s*\/\s*/, '').replace(/\s*\/\s*/g, '/');

         semanasProcesadas.push({
           num: i + 1, fecha: fechaDisplay, hora: horaDisplay,
           tipo: tipo, displayTexto: displayTexto, ubicacion: ubicacion,
           zoomId: zoomId, zoomLink: finalLink
         });
      });
      return { ...curso, semanas: semanasProcesadas };
    });
  };

  const handleReset = () => { setDocente(null); setSearchTerm(''); setSelectedCursoIdx(0); };
  
  const handleLogin = (e) => {
    e.preventDefault();
    if (passInput === ADMIN_PASS) setView('admin');
    else alert("Incorrecto");
  };

  const cursoActivo = docente && docente.cursos.length > 0 ? docente.cursos[selectedCursoIdx] : null;

  if (view === 'admin') {
    return (
      <div style={{fontFamily:'Segoe UI', background:'#f4f6f8', minHeight:'100vh', padding:'20px', display:'flex', flexDirection:'column', alignItems:'center'}}>
        <div className="fade-in-up" style={{maxWidth:'800px', width:'100%', background:'white', padding:'40px', borderRadius:'30px', boxShadow:'0 20px 50px rgba(0,0,0,0.1)'}}>
          <h2 style={{color:'#003366'}}>PANEL DE CONTROL</h2>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'30px'}}>
            <div style={{background:'#f5f9ff', padding:'25px', borderRadius:'20px'}}>
              <h3 style={{marginTop:0}}>🕵️‍♂️ Diagnóstico</h3>
              <form onSubmit={handleAdminDiagnostico}>
                <input placeholder="Cédula..." value={adminSearch} onChange={e=>setAdminSearch(e.target.value)} style={{width:'100%', padding:'10px', borderRadius:'10px', border:'1px solid #ccc', marginBottom:'10px'}} />
                <button style={{width:'100%', padding:'10px', background:'#2563eb', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold'}}>Consultar</button>
              </form>
              {adminResult && <pre style={{marginTop:'15px'}}>{adminResult}</pre>}
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
              <a href={URL_TU_EXCEL_MAESTRO} target="_blank" rel="noreferrer" style={{padding:'20px', background:'#27ae60', color:'white', textDecoration:'none', borderRadius:'15px', fontWeight:'bold', textAlign:'center'}}>📊 ABRIR EXCEL MAESTRO</a>
              <a href={URL_FIREBASE_CONSOLE} target="_blank" rel="noreferrer" style={{padding:'20px', background:'#f39c12', color:'white', textDecoration:'none', borderRadius:'15px', fontWeight:'bold', textAlign:'center'}}>🔥 CONSOLA FIREBASE</a>
            </div>
          </div>
          <button onClick={()=>setView('user')} style={{marginTop:'30px', padding:'10px 20px', borderRadius:'20px', border:'none', background:'#eee', cursor:'pointer'}}>⬅ Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-container">
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
        .search-input { padding: 10px 20px; border: none; outline: none; border-radius: 50px; width: 200px; }
        .btn-search { background: var(--secondary); color: var(--primary); border: none; padding: 10px 25px; border-radius: 50px; font-weight: bold; cursor: pointer; }
        .main-content { max-width: 1200px; margin: 40px auto; padding: 0 20px; display: grid; grid-template-columns: 320px 1fr; gap: 40px; }
        .sidebar { padding: 30px; }
        .avatar { width: 80px; height: 80px; background: var(--secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: var(--primary); margin: 0 auto 15px; font-weight: bold; border: 4px solid white; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .course-btn { width: 100%; padding: 15px; margin-bottom: 10px; border: 1px solid transparent; background: transparent; text-align: left; border-radius: 15px; cursor: pointer; color: #666; }
        .course-btn.active { background: white; border-color: var(--secondary); color: var(--primary); font-weight: bold; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
        .hero-card { background: linear-gradient(135deg, #003366 0%, #004080 100%); color: white; padding: 40px; border-radius: 30px; margin-bottom: 30px; }
        .timeline-container { background: white; padding: 40px; border-radius: 30px; }
        .timeline-item { display: flex; gap: 20px; margin-bottom: 25px; }
        .date-circle { width: 45px; height: 45px; border: 2px solid #eee; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 0.7rem; color: #999; flex-shrink: 0; }
        .timeline-content { flex: 1; background: #f9f9f9; padding: 20px; border-radius: 15px; border: 1px solid #eee; }
        .zoom-btn { display: inline-block; background: #2D8CFF; color: white; padding: 10px 20px; border-radius: 50px; text-decoration: none; font-weight: bold; margin-top: 10px; font-size: 0.9rem; }
        .offline-badge { background: #e3f2fd; color: #1565c0; padding: 8px 15px; border-radius: 20px; display: inline-block; font-size: 0.85rem; font-weight: bold; }
        .whatsapp-btn { position: fixed; bottom: 30px; right: 30px; background: #25D366; color: white; padding: 15px 25px; border-radius: 50px; text-decoration: none; font-weight: bold; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .toast-notification { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(100px); background: #333; color: white; padding: 10px 20px; border-radius: 50px; transition: 0.3s; opacity: 0; }
        .toast-notification.show { transform: translateX(-50%) translateY(0); opacity: 1; }
        @media (max-width: 900px) { .main-content { grid-template-columns: 1fr; } .sidebar { order: -1; display: flex; overflow-x: auto; gap: 10px; padding: 15px; } .course-btn { min-width: 220px; } }
      `}</style>

      <header className="header">
        <div className="header-content">
          <div onClick={handleReset} style={{cursor:'pointer'}}>
            <h1 style={{margin:0, fontSize:'1.6rem', color:'var(--secondary)'}}>PORTAL DOCENTES</h1>
            <small style={{letterSpacing:'1px'}}>ADMINISTRACIÓN S.S.T.</small>
          </div>
          {!docente && (
            <form onSubmit={handleSearch} className="search-container">
              <input placeholder="Número de Cédula" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="search-input" />
              <button className="btn-search">{loading ? '...' : 'ENTRAR'}</button>
            </form>
          )}
        </div>
      </header>

      <main className="main-content">
        {!docente ? (
          <div className="glass-panel fade-in-up" style={{gridColumn:'1 / -1', textAlign:'center', padding:'100px 20px'}}>
            <div style={{fontSize:'4rem', marginBottom:'20px'}}>👨‍🏫</div>
            <h1 style={{color:'var(--primary)', marginBottom:'10px'}}>Acceso Docente</h1>
            <p style={{color:'#666'}}>Consulta tu programación académica de forma segura.</p>
            <div style={{marginTop:'30px', fontWeight:'bold', color:'#333'}}>{formatoFechaHora().fecha}</div>
            <div style={{marginTop:'60px', opacity:0.2, cursor:'pointer', fontSize:'0.8rem'}} onClick={()=>setView('login')}>🔒 Admin</div>
          </div>
        ) : (
          <>
            <aside className="sidebar glass-panel">
              <div style={{textAlign:'center', marginBottom:'30px'}}>
                <div className="avatar">{docente.nombre.charAt(0)}</div>
                <h3 style={{margin:0, color:'var(--primary)'}}>Buenas tardes,<br/>{docente.nombre.split(' ')[0]}</h3>
                <small style={{color:'#888'}}>ID: {docente.idReal}</small>
              </div>
              {docente.cursos.map((c, i) => (
                <button key={i} onClick={()=>setSelectedCursoIdx(i)} className={`course-btn ${selectedCursoIdx === i ? 'active' : ''}`}>
                  {c.materia} <br/><small style={{fontWeight:'normal'}}>Bloque 1</small>
                </button>
              ))}
              <button onClick={handleReset} style={{width:'100%', padding:'10px', marginTop:'20px', background:'#eee', border:'none', borderRadius:'10px', cursor:'pointer'}}>↺ Salir</button>
            </aside>

            <section>
              <div className="hero-card">
                <h1 style={{margin:'0 0 10px', fontSize:'2.2rem'}}>{cursoActivo.materia}</h1>
                <p style={{fontSize:'1.1rem', opacity:0.9}}>Semestre I - {cursoActivo.grupo}</p>
                <div style={{display:'flex', gap:'20px', marginTop:'20px', background:'rgba(0,0,0,0.15)', padding:'10px 20px', borderRadius:'15px', fontSize:'0.9rem'}}>
                  <div>📅 {cursoActivo.fInicio} (Inicio)</div>
                  <div>🏁 {cursoActivo.fFin} (Fin)</div>
                </div>
              </div>

              <div className="timeline-container glass-panel">
                <h3 style={{color:'var(--primary)', marginBottom:'30px', borderBottom:'1px solid #eee', paddingBottom:'15px'}}>Cronograma de Actividades</h3>
                {cursoActivo && cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="date-circle">
                      <span style={{fontSize:'0.6rem'}}>SEM</span>
                      <strong>{s.num}</strong>
                    </div>
                    <div className="timeline-content">
                      <div style={{fontWeight:'bold', fontSize:'1.1rem', color:'#444', marginBottom:'5px'}}>{s.fecha}</div>
                      {s.tipo === 'INDEPENDIENTE' ? (
                        <div className="offline-badge">🏠 {s.displayTexto}</div>
                      ) : s.tipo === 'PRESENCIAL' ? (
                        <div className="offline-badge">🏫 {s.displayTexto} <br/> <small>⏰ {s.hora}</small></div>
                      ) : (
                        <>
                          <div style={{color:'#666', fontSize:'0.95rem'}}>⏰ {s.hora}</div>
                          {s.zoomLink && (
                            <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-btn" onClick={()=>registrarLog(docente.idReal, `🎥 Zoom Sem ${s.num}`)}>Unirse a Zoom</a>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="whatsapp-btn">💬 Ayuda</a>
    </div>
  );
};

export default App;