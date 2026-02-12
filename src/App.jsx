import React, { useState, useEffect } from 'react';

// --- ⚡ CONFIGURACIÓN MAESTRA (V21.0 - CON LOGS DE ERROR) ---

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
  
  // Estados Admin (Diagnóstico)
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

  // --- FUNCIÓN DE REGISTRO DE LOGS ---
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
      }).catch(err => console.log("Error enviando log:", err));
    } catch (e) { console.error("Error en registrarLog:", e); }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("📋 ¡ID copiado!");
  };

  const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "Buenos días";
    if (hora < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  // --- BÚSQUEDA PRINCIPAL (CON REGISTRO DE ÉXITOS Y ERRORES) ---
  const handleSearch = (e) => {
    e.preventDefault();
    const idBusqueda = searchTerm.replace(/\D/g, '');
    if (!idBusqueda) { showToast('❌ Documento inválido'); return; }

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
          // LOG: ✅ ÉXITO
          registrarLog(idBusqueda, '✅ Consulta Exitosa');
        } else {
          showToast('❌ No encontrado');
          // LOG: ❌ ERROR (Cédula no existe en Firebase)
          registrarLog(idBusqueda, '❌ ID No Encontrado');
        }
      })
      .catch(err => { 
        setLoading(false); 
        showToast('⚠️ Error de Red');
        // LOG: ⚠️ FALLO TÉCNICO
        registrarLog(idBusqueda, '⚠️ Error Crítico de Red');
      });
  };

  // --- BÚSQUEDA DIAGNÓSTICO (Admin) ---
  const handleAdminDiagnostico = (e) => {
    e.preventDefault();
    const idBusqueda = adminSearch.replace(/\D/g, '');
    if (!idBusqueda) return;
    
    setAdminResult('Cargando...');
    fetch(`${FIREBASE_DB_URL}${idBusqueda}.json`)
      .then(res => res.json())
      .then(data => {
        if(data) setAdminResult(`✅ ENCONTRADO EN NUBE:\nNombre: ${data.nombre}\nCursos: ${data.cursos.length}`);
        else setAdminResult(`❌ NO EXISTE EN FIREBASE.`);
      })
      .catch(() => setAdminResult('⚠️ Error de conexión'));
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
         let esTrabajoIndependiente = false;
         const textoUpper = texto.toUpperCase();

         if (textoUpper.includes("TRABAJO INDEPEN") || textoUpper.includes("TRABAJO AUTONOMO")) {
             tipo = 'INDEPENDIENTE';
             displayTexto = "Trabajo Independiente";
             ubicacion = "Estudio Autónomo";
             esTrabajoIndependiente = true;
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
             else {
               const linkMatch = texto.match(/https?:\/\/[^\s,]+/);
               if (linkMatch && linkMatch[0]) {
                  let cleanLink = linkMatch[0];
                  if (cleanLink.includes("-USUARIO")) cleanLink = cleanLink.split("-USUARIO")[0];
                  finalLink = cleanLink;
               }
             }
         }
         const horaMatch = texto.match(/(\d{1,2}\s*[aA]\s*\d{1,2})/i); 
         let horaDisplay = horaMatch ? horaMatch[0] : "Programada";
         if (esTrabajoIndependiente) horaDisplay = "Todo el día";

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
    else alert("Contraseña incorrecta");
  };

  const cursoActivo = docente && docente.cursos.length > 0 ? docente.cursos[selectedCursoIdx] : null;

  // --- VISTA ADMIN (CON DASHBOARD INTEGRADO) ---
  if (view === 'admin') {
    return (
      <div style={{fontFamily:'Segoe UI', background:'#f4f6f8', minHeight:'100vh', padding:'20px', display:'flex', flexDirection:'column', alignItems:'center'}}>
        <div className="fade-in-up" style={{maxWidth:'900px', width:'100%', background:'white', padding:'40px', borderRadius:'30px', boxShadow:'0 20px 50px rgba(0,0,0,0.1)'}}>
          
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px', borderBottom:'1px solid #eee', paddingBottom:'20px'}}>
            <div>
              <h2 style={{color:'#003366', margin:0}}>PANEL DE CONTROL</h2>
              <p style={{color:'#666', margin:'5px 0 0'}}>Estado: 🟢 Operativo | Logs: 🟢 Activos</p>
            </div>
            <button onClick={()=>setView('user')} style={{cursor:'pointer', padding:'10px 25px', borderRadius:'30px', border:'none', background:'#f0f0f0', fontWeight:'bold', color:'#333'}}>⬅ Volver</button>
          </div>

          {/* 📊 NUEVO BLOQUE DE ANALÍTICA (Fase Evolución) */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'20px', marginBottom:'40px'}}>
             <div style={{padding:'20px', background:'#fff', border:'1px solid #eee', borderRadius:'20px', boxShadow:'0 5px 15px rgba(0,0,0,0.02)'}}>
                <h4 style={{marginTop:0, color:'#555'}}>⏰ Horas Pico</h4>
                <div style={{fontSize:'0.8rem', marginBottom:'10px'}}>
                   <div style={{display:'flex', justifyContent:'space-between'}}><span>7-9 AM</span><strong>85%</strong></div>
                   <div style={{width:'100%', background:'#eee', height:'6px', borderRadius:'10px'}}><div style={{width:'85%', background:'#3498db', height:'100%', borderRadius:'10px'}}></div></div>
                </div>
                <div style={{fontSize:'0.8rem'}}>
                   <div style={{display:'flex', justifyContent:'space-between'}}><span>6-8 PM</span><strong>60%</strong></div>
                   <div style={{width:'100%', background:'#eee', height:'6px', borderRadius:'10px'}}><div style={{width:'60%', background:'#e67e22', height:'100%', borderRadius:'10px'}}></div></div>
                </div>
             </div>
             <div style={{padding:'20px', background:'#003366', color:'white', borderRadius:'20px', textAlign:'center'}}>
                <h4 style={{marginTop:0, opacity:0.8}}>🏆 Docente más Activo</h4>
                <div style={{fontSize:'2.5rem'}}>⭐</div>
                <h3 style={{margin:'10px 0'}}>Alberto C.</h3>
                <p style={{fontSize:'0.7rem', margin:0}}>124 Consultas</p>
             </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'30px'}}>
            <div style={{background:'#f5f9ff', padding:'25px', borderRadius:'20px', border:'1px solid #dbeafe'}}>
              <h3 style={{marginTop:0, color:'#1e40af'}}>🕵️‍♂️ Diagnóstico Rápido</h3>
              <p style={{fontSize:'0.85rem', color:'#555'}}>Verifica cédulas sin generar registros de asistencia.</p>
              <form onSubmit={handleAdminDiagnostico} style={{marginTop:'15px'}}>
                <input 
                  placeholder="Cédula a probar..." 
                  value={adminSearch}
                  onChange={e=>setAdminSearch(e.target.value)}
                  style={{width:'100%', padding:'10px', borderRadius:'10px', border:'1px solid #ccc', marginBottom:'10px', boxSizing:'border-box'}}
                />
                <button style={{width:'100%', padding:'10px', background:'#2563eb', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold', cursor:'pointer'}}>Consultar Nube</button>
              </form>
              {adminResult && (
                <pre style={{background:'white', padding:'10px', borderRadius:'10px', marginTop:'15px', fontSize:'0.85rem', border:'1px solid #ddd', whiteSpace:'pre-wrap', color:'#333'}}>
                  {adminResult}
                </pre>
              )}
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
              <h3 style={{marginTop:0, color:'#333'}}>🚀 Accesos Directos</h3>
              
              <a href={URL_TU_EXCEL_MAESTRO} target="_blank" rel="noreferrer" 
                 style={{display:'flex', alignItems:'center', gap:'15px', padding:'20px', background:'#27ae60', color:'white', textDecoration:'none', borderRadius:'15px', fontWeight:'bold', boxShadow:'0 5px 15px rgba(39, 174, 96, 0.3)'}}>
                 <span style={{fontSize:'1.5rem'}}>📊</span> 
                 <div>
                   <div>Abrir Excel Maestro</div>
                   <div style={{fontSize:'0.7rem', opacity:0.8}}>Gestión y Asistencia</div>
                 </div>
              </a>
              
              <a href={URL_FIREBASE_CONSOLE} target="_blank" rel="noreferrer" 
                 style={{display:'flex', alignItems:'center', gap:'15px', padding:'20px', background:'#f39c12', color:'white', textDecoration:'none', borderRadius:'15px', fontWeight:'bold', boxShadow:'0 5px 15px rgba(243, 156, 18, 0.3)'}}>
                 <span style={{fontSize:'1.5rem'}}>🔥</span>
                 <div>
                   <div>Consola Firebase</div>
                   <div style={{fontSize:'0.7rem', opacity:0.8}}>Base de Datos en Vivo</div>
                 </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA USUARIO ---
  return (
    <div className="portal-container">
      {/* 🚩 RAYA ROJA DE PRUEBAS (Fase Evolución) */}
      <div style={{background:'#e74c3c', color:'white', textAlign:'center', padding:'5px', fontSize:'0.75rem', fontWeight:'bold', position:'sticky', top:0, zIndex:2000}}>
        ⚠️ PORTAL DE PRUEBAS - ENTORNO DE EVOLUCIÓN (SST)
      </div>

      <Toast msg={toast.msg} show={toast.show} />
      <style>{`
        :root { --primary: #003366; --secondary: #db9b32; --bg: #F0F2F5; --text: #1A1A1A; }
        body { margin: 0; font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
        
        .fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        .glass-panel { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.08); border-radius: 20px; }
        
        .header { background: var(--primary); padding: 25px 0; position: relative; overflow: hidden; }
        .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 10; }
        .brand h1 { margin: 0; color: var(--secondary); font-size: 1.8rem; font-weight: 800; letter-spacing: -0.5px; } 
        .brand h2 { margin: 5px 0 0; font-size: 0.8rem; color: rgba(255,255,255,0.8); font-weight: 500; letter-spacing: 2px; text-transform: uppercase; }

        .search-container { background: white; padding: 5px; border-radius: 50px; display: flex; box-shadow: 0 5px 20px rgba(0,0,0,0.2); transition: transform 0.2s; }
        .search-form input { padding: 12px 20px; border-radius: 50px; border: none; outline: none; font-size: 1rem; width: 200px; }
        .btn-search { background: var(--secondary); color: var(--primary); border: none; padding: 10px 30px; font-weight: 800; border-radius: 50px; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; }

        .main-content { max-width: 1200px; margin: 40px auto; padding: 0 20px; display: grid; grid-template-columns: 320px 1fr; gap: 40px; }
        .sidebar { padding: 30px; height: fit-content; animation: fadeInUp 0.5s ease-out; }
        .profile-header { text-align: center; margin-bottom: 30px; }
        .avatar { width: 90px; height: 90px; background: var(--secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: var(--primary); font-weight: bold; margin: 0 auto 15px; box-shadow: 0 10px 20px rgba(212, 175, 55, 0.3); border: 4px solid white; }
        
        .course-btn { width: 100%; padding: 15px 20px; margin-bottom: 12px; border: none; background: transparent; text-align: left; border-radius: 15px; position: relative; transition: all 0.2s; color: #666; cursor:pointer; border: 1px solid transparent; }
        .course-btn.active { background: white; border-color: var(--secondary); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .course-btn.active .bloque-badge { background: var(--primary); color: white; }
        .bloque-badge { display: inline-block; font-size: 0.7rem; background: #eee; padding: 2px 8px; border-radius: 10px; margin-top: 5px; font-weight: bold; color: #555; }

        .hero-card { background: linear-gradient(135deg, #003366 0%, #004080 100%); color: white; padding: 40px; border-radius: 30px; position: relative; overflow: hidden; margin-bottom: 40px; box-shadow: 0 20px 40px rgba(0, 51, 102, 0.3); }
        .hero-info-grid { display: flex; gap: 20px; margin-top: 25px; flex-wrap: wrap; background: rgba(0,0,0,0.25); padding: 15px 20px; border-radius: 15px; backdrop-filter: blur(5px); }
        .hero-info-item { display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.95rem; }
        
        .timeline-container { padding: 40px; background: white; border-radius: 30px; }
        .timeline-item { display: flex; gap: 25px; margin-bottom: 30px; position: relative; }
        .timeline-line { position: absolute; left: 24px; top: 50px; bottom: -30px; width: 3px; background: #f0f0f0; }
        .date-circle { width: 50px; height: 50px; background: #fff; border: 3px solid #eee; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem; color: #aaa; z-index: 1; }
        
        .timeline-content { flex: 1; background: #fcfcfc; padding: 25px; border-radius: 20px; border: 1px solid #f0f0f0; transition: all 0.3s; }
        .timeline-content:hover { background: white; border-color: var(--secondary); box-shadow: 0 15px 30px rgba(0,0,0,0.06); }
        
        .zoom-mini-btn { display: inline-flex; align-items: center; gap: 8px; background: #2D8CFF; color: white; padding: 10px 20px; border-radius: 50px; text-decoration: none; font-size: 0.9rem; font-weight: bold; margin-top: 15px; }
        .copy-icon { cursor: pointer; opacity: 0.6; font-size: 1.1rem; }

        .offline-badge { display: inline-block; background: #e3f2fd; color: #1565c0; padding: 8px 15px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; margin-top: 10px; border: 1px solid rgba(21, 101, 192, 0.1); }
        .whatsapp-btn { position: fixed; bottom: 30px; right: 30px; background: #25D366; color: white; padding: 15px 25px; border-radius: 50px; text-decoration: none; font-weight: bold; box-shadow: 0 10px 30px rgba(37, 211, 102, 0.4); z-index: 100; }

        .toast-notification { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(100px); background: rgba(0,0,0,0.85); color: white; padding: 12px 24px; border-radius: 50px; font-weight: bold; opacity: 0; transition: all 0.3s; }
        .toast-notification.show { transform: translateX(-50%) translateY(0); opacity: 1; }

        /* 📱 AJUSTES MOBILE QUIRÚRGICOS (Fase Evolución) */
        @media (max-width: 900px) { 
          .main-content { display: flex; flex-direction: column; margin-top: 15px; } 
          .sidebar { order: -1; display: flex; overflow-x: auto; padding: 10px; gap: 10px; }
          .course-btn { min-width: 180px; padding: 10px !important; margin-bottom: 0; font-size: 0.8rem; }
          .avatar { width: 60px !important; height: 60px !important; font-size: 1.5rem !important; }
          .hero-card { padding: 20px !important; margin-bottom: 20px !important; }
          .hero-card h1 { font-size: 1.4rem !important; }
          .timeline-container { padding: 20px !important; }
          .timeline-content { padding: 15px !important; font-size: 0.85rem; }
          .date-circle { width: 40px !important; height: 40px !important; font-size: 0.65rem !important; }
        }
      `}</style>
      
      {/* LOGIN ADMIN */}
      {view === 'login' && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(5px)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <form onSubmit={handleLogin} className="glass-panel fade-in-up" style={{padding:'40px', width:'320px', textAlign:'center', background:'white'}}>
            <h3 style={{color:'var(--primary)', marginTop:0, fontSize:'1.5rem'}}>Acceso Admin</h3>
            <input type="password" placeholder="Contraseña" value={passInput} onChange={(e)=>setPassInput(e.target.value)} style={{width:'100%', padding:'15px', marginBottom:'20px', border:'1px solid #ddd', borderRadius:'12px', outline:'none', background:'#f9f9f9'}} autoFocus />
            <div style={{display:'flex', gap:'10px'}}>
              <button type="button" onClick={()=>setView('user')} className="rounded-btn" style={{flex:1, padding:'12px', background:'#f0f0f0', border:'none', color:'#666', fontWeight:'bold'}}>Cancelar</button>
              <button type="submit" className="rounded-btn" style={{flex:1, background:'var(--primary)', color:'white', border:'none', fontWeight:'bold'}}>Entrar</button>
            </div>
          </form>
        </div>
      )}

      <header className="header">
        <div className="header-content">
          <div className="brand" onClick={handleReset} style={{cursor:'pointer'}}>
            <h1>PORTAL DOCENTES</h1>
            <h2>PROGRAMA DE ADMINISTRACIÓN DE LA SEGURIDAD Y SALUD EN EL TRABAJO </h2>
          </div>
          <div className="actions">
            {!docente && (
              <form onSubmit={handleSearch} className="search-container">
                <input placeholder="Cédula del Docente" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="search-input" />
                <button className="btn-search rounded-btn">{loading ? '...' : 'CONSULTAR'}</button>
              </form>
            )}
            {docente && <button onClick={handleReset} className="btn-search rounded-btn" style={{fontSize:'0.75rem', padding:'10px 20px'}}>↺ Salir</button>}
          </div>
        </div>
      </header>

      <main className="main-content">
        {!docente ? (
          <div className="glass-panel fade-in-up" style={{gridColumn:'1 / -1', textAlign:'center', padding:'100px 20px'}}>
            <div style={{fontSize:'5rem', marginBottom:'20px'}}>👨‍🏫</div>
            <h1 style={{color:'var(--primary)', marginBottom:'15px', fontSize:'2.5rem'}}>Portal Docente</h1>
            <p style={{color:'#666', maxWidth:'600px', margin:'0 auto', fontSize:'1.1rem'}}>Gestiona tu programación académica de forma privada y segura.</p>
            <div style={{marginTop:'40px', fontSize:'1.2rem', color:'#333', fontWeight:'bold'}}>{formatoFechaHora().fecha}</div>
            <div style={{marginTop:'80px', cursor:'pointer', opacity:0.3, fontSize:'0.8rem'}} onClick={()=>setView('login')}>🔒 Acceso Administrativo</div>
          </div>
        ) : (
          <>
            <aside className="sidebar glass-panel">
              <div className="profile-header">
                <div className="avatar">{docente.nombre.charAt(0)}</div>
                <h3 style={{margin:0, color:'var(--primary)'}}>{getSaludo()},<br/>{docente.nombre.split(' ')[0]}</h3>
                <div style={{fontSize:'0.85rem', color:'#888', marginTop:'5px', background:'#f5f5f5', padding:'3px 10px', borderRadius:'10px'}}>ID: {docente.idReal}</div>
              </div>
              {docente.cursos.map((c, i) => (
                <button key={i} onClick={()=>setSelectedCursoIdx(i)} className={`course-btn ${selectedCursoIdx === i ? 'active' : ''}`}>
                  <div style={{fontWeight:'bold', fontSize:'0.95rem', color:'var(--primary)'}}>{c.materia}</div>
                  <div className="bloque-badge">{c.bloque}</div>
                </button>
              ))}
            </aside>

            <section className="dashboard-column">
              {cursoActivo && (
                <div className="hero-card">
                  <h1 style={{margin:'0 0 10px', fontSize:'2.2rem'}}>{cursoActivo.materia}</h1>
                  <div style={{fontSize:'1.1rem', opacity:0.9}}>{cursoActivo.grupo}</div>
                  <div className="hero-info-grid">
                    <div className="hero-info-item">📅 <strong>{cursoActivo.fInicio}</strong> (Inicio)</div>
                    <div className="hero-info-item">🏁 <strong>{cursoActivo.fFin}</strong> (Fin)</div>
                  </div>
                </div>
              )}

              <div className="timeline-container glass-panel">
                <h3 style={{color:'var(--primary)', marginBottom:'30px'}}>Cronograma de Actividades</h3>
                {cursoActivo && cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-line"></div>
                    <div className="date-circle">
                      <span style={{fontSize:'0.65rem'}}>SEM</span>
                      <span style={{fontSize:'1.3rem'}}>{s.num}</span>
                    </div>
                    <div className="timeline-content">
                      <div style={{fontWeight:'bold', fontSize:'1.1rem'}}>{s.fecha}</div>
                      {s.tipo === 'INDEPENDIENTE' ? (
                          <div className="offline-badge">🏠 {s.displayTexto}</div>
                      ) : s.tipo === 'PRESENCIAL' ? (
                          <div className="offline-badge">🏫 {s.displayTexto} <br/> ⏰ {s.hora}</div>
                      ) : (
                          <>
                            <div style={{color:'#666', marginTop:'5px'}}>⏰ {s.hora}</div>
                            {s.zoomLink && (
                              <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-mini-btn" onClick={()=>registrarLog(docente.idReal, `🎥 Zoom Sem ${s.num}`)}>🎥 Unirse a Zoom</a>
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