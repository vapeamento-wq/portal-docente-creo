import React, { useState, useEffect, useMemo } from 'react';

// --- CONFIGURACIÓN DE LABORATORIO 🧪 ---
const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQqVxPhQsuX9SKXsPSj9P5iaL__B0eAt7jzVj8HMnxKW6QTkD6IUuS9eFYTwYep2G6x2rn8uKlfnvsO/pub?output=csv";
const URL_SCRIPT_APPS = "https://script.google.com/macros/s/AKfycbxXAXa1VXPf8mKv0x_yZ__dnRNIMP9yZrIWO1xXvN24V76WWs9jt6O6T5ut_HLPVtyI/exec";
const URL_TU_EXCEL_LOGS = "https://docs.google.com/spreadsheets/d/1flqOTBYG-cvXSR0xVv-0ilTP6i4MNoSdk5aVKQCKaSY/edit?gid=0#gid=0";
const URL_EMBED_LOGS = "https://docs.google.com/spreadsheets/d/1flqOTBYG-cvXSR0xVv-0ilTP6i4MNoSdk5aVKQCKaSY/preview?gid=0";

const WHATSAPP_NUMBER = "573106964025";
const ADMIN_PASS = "admincreo"; 

// --- COMPONENTE TOAST (NOTIFICACIÓN FLOTANTE) ---
const Toast = ({ msg, show }) => (
  <div className={`toast-notification ${show ? 'show' : ''}`}>
    {msg}
  </div>
);

const App = () => {
  const [view, setView] = useState('user'); 
  const [passInput, setPassInput] = useState('');
  const [state, setState] = useState({ loading: true, teachers: {}, error: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCursoIdx, setSelectedCursoIdx] = useState(0);
  
  // Estado para las notificaciones
  const [toast, setToast] = useState({ show: false, msg: '' });

  // --- FUNCIÓN PARA MOSTRAR NOTIFICACIÓN ---
  const showToast = (mensaje) => {
    setToast({ show: true, msg: mensaje });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  // --- LOGS CON FEEDBACK ---
  const registrarLog = (documento, accion) => {
    showToast(`🚀 Registrando: ${accion}...`);
    try {
      const datosLog = { fecha: new Date().toLocaleString('es-CO'), doc: documento, estado: `[TEST] ${accion}` };
      fetch(URL_SCRIPT_APPS, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datosLog) }).catch(err => console.log(err));
    } catch (e) { console.error(e); }
  };

  // --- COPIAR AL PORTAPAPELES ---
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("📋 ¡ID copiado al portapapeles!");
  };

  // --- FECHA Y SALUDO INTELIGENTE ---
  const getFechaHoy = () => {
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha = new Date().toLocaleDateString('es-CO', opciones);
    return fecha.charAt(0).toUpperCase() + fecha.slice(1);
  };

  const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "Buenos días";
    if (hora < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  // --- CARGA DE DATOS ---
  useEffect(() => {
    fetch(URL_CSV).then(res => res.text()).then(csvText => {
        const filas = csvText.split(/\r?\n/);
        const diccionario = {};
        
        filas.forEach((fila) => {
          const c = fila.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          if (c.length < 60) return; 

          const materia = c[9]?.replace(/"/g, '').trim();
          if (!materia || materia.toUpperCase().includes("PENDIENTE") || materia === "ASIGNATURA") return;

          const nombre = c[6]?.replace(/"/g, '').trim();   
          let rawId = c[7]?.replace(/"/g, '').trim(); 
          const id = rawId ? rawId.split('.')[0] : null;

          const grupo = c[11]?.replace(/"/g, '').trim();
          const bloqueRaw = c[19]?.replace(/"/g, '').trim(); 
          const bloque = bloqueRaw && bloqueRaw.toLowerCase().includes("bloque") ? bloqueRaw : "Bloque General";
          const fInicio = c[53]?.replace(/"/g, '').trim() || "Por definir";
          const fFin = c[54]?.replace(/"/g, '').trim() || "Por definir";

          const semanas = [];
          
          for (let i = 0; i < 16; i++) { 
            const colIndex = 55 + i; 
            const texto = c[colIndex]?.replace(/"/g, '').trim() || "";
            
            if (texto && texto.length > 5 && !texto.startsWith("-") && !texto.toLowerCase().includes("pendiente")) {
              
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

                  if (zoomId) {
                    finalLink = `https://zoom.us/j/${zoomId}`;
                  } else {
                    const linkMatch = texto.match(/https?:\/\/[^\s,]+/);
                    if (linkMatch) {
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

              semanas.push({
                num: i + 1,
                fecha: fechaDisplay,
                hora: horaDisplay,
                tipo: tipo,
                displayTexto: displayTexto,
                ubicacion: ubicacion,
                zoomId: zoomId, 
                zoomLink: finalLink
              });
            }
          }

          if (id && !isNaN(id)) {
             if (!diccionario[id]) diccionario[id] = { nombre, idReal: id, cursos: [] };
             if (semanas.length > 0) {
               diccionario[id].cursos.push({ materia, grupo, bloque, fInicio, fFin, semanas });
             }
          }
        });
        setState({ loading: false, teachers: diccionario, error: null });
      })
      .catch(err => setState(s => ({ ...s, loading: false, error: "Error leyendo datos." })));
  }, []);

  const docente = useMemo(() => selectedId ? state.teachers[selectedId] : null, [selectedId, state.teachers]);
  const cursoActivo = docente && docente.cursos.length > 0 ? docente.cursos[selectedCursoIdx] : null;

  const proximaClase = useMemo(() => {
    if (!cursoActivo) return null;
    return cursoActivo.semanas[0]; 
  }, [cursoActivo]);

  const handleSearch = (e) => {
    e.preventDefault();
    const idBusqueda = searchTerm.replace(/\D/g, '');
    if (state.teachers[idBusqueda] && state.teachers[idBusqueda].cursos.length > 0) {
      setSelectedId(idBusqueda);
      setSelectedCursoIdx(0);
      showToast('✅ ¡Bienvenido! Cargando sus datos...');
      registrarLog(idBusqueda, '✅ Consulta Exitosa');
    } else { 
      if(state.teachers[idBusqueda]) alert("Docente encontrado pero SIN asignación visible.");
      else showToast('❌ Documento no encontrado');
    }
  };

  const handleReset = () => { setSelectedId(null); setSearchTerm(''); setSelectedCursoIdx(0); };
  
  const handleLogin = (e) => {
    e.preventDefault();
    if (passInput === ADMIN_PASS) setView('admin');
    else alert("Contraseña incorrecta");
  };

  if (view === 'admin') {
    return (
      <div style={{fontFamily:'Segoe UI', background:'#f4f6f8', minHeight:'100vh', padding:'20px', display:'flex', flexDirection:'column', alignItems:'center'}}>
        <div className="fade-in-up" style={{maxWidth:'1000px', width:'100%', background:'white', padding:'30px', borderRadius:'20px', boxShadow:'0 20px 50px rgba(0,0,0,0.1)'}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
            <h2 style={{color:'#003366', margin:0}}>PANEL ADMIN (LABORATORIO)</h2>
            <div style={{display:'flex', gap:'10px'}}>
               <a href={URL_TU_EXCEL_LOGS} target="_blank" rel="noreferrer" style={{background:'#27ae60', color:'white', textDecoration:'none', padding:'10px 20px', borderRadius:'30px', fontWeight:'bold'}}>Abrir Excel</a>
               <button onClick={()=>setView('user')} style={{cursor:'pointer', padding:'10px 20px', borderRadius:'30px', border:'1px solid #ddd'}}>⬅ Salir</button>
            </div>
          </div>
          <iframe src={URL_EMBED_LOGS} style={{width:'100%', height:'500px', border:'none', borderRadius:'10px', background:'#f9f9f9'}} title="Logs"></iframe>
        </div>
      </div>
    );
  }

  if (state.loading) return <div className="loading-screen"><div className="spinner"></div><p style={{marginTop:'20px', color:'#666'}}>Iniciando Portal Seguro...</p></div>;
  if (state.error) return <div className="error-screen">{state.error}</div>;

  return (
    <div className="portal-container">
      <Toast msg={toast.msg} show={toast.show} />
      
      <style>{`
        :root { --primary: #003366; --secondary: #D4AF37; --orange: #FF6600; --bg: #F0F2F5; --text: #1A1A1A; --card-bg: #FFFFFF; --shadow: 0 10px 30px rgba(0,0,0,0.08); }
        body { margin: 0; font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
        
        /* ANIMACIONES */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        
        /* TOAST */
        .toast-notification {
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(100px);
            background: rgba(0,0,0,0.85); color: white; padding: 12px 24px; borderRadius: 50px;
            font-weight: bold; z-index: 9999; opacity: 0; transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3); backdrop-filter: blur(5px); display: flex; align-items: center; gap: 10px;
        }
        .toast-notification.show { transform: translateX(-50%) translateY(0); opacity: 1; }

        .glass-panel { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); box-shadow: var(--shadow); border-radius: 20px; }
        .rounded-btn { border-radius: 50px; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
        .rounded-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        
        .test-banner { background: linear-gradient(90deg, #111, #333); color: var(--secondary); text-align: center; padding: 10px; font-weight: bold; font-size: 0.85rem; letter-spacing: 1px; }
        
        .header { background: var(--primary); padding: 25px 0; position: relative; overflow: hidden; }
        .header::after { content:''; position: absolute; top:-50%; right:-10%; width: 600px; height: 600px; background: radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, rgba(0,0,0,0) 70%); border-radius: 50%; pointer-events: none; }
        .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 10; }
        .brand h1 { margin: 0; color: var(--secondary); font-size: 1.8rem; font-weight: 800; letter-spacing: -0.5px; } 
        .brand h2 { margin: 5px 0 0; font-size: 0.8rem; color: rgba(255,255,255,0.8); font-weight: 500; letter-spacing: 2px; text-transform: uppercase; }

        .search-container { background: white; padding: 5px; border-radius: 50px; display: flex; box-shadow: 0 5px 20px rgba(0,0,0,0.2); transition: transform 0.2s; }
        .search-container:hover { transform: scale(1.02); }
        .search-form input { padding: 12px 20px; border-radius: 50px; border: none; outline: none; font-size: 1rem; width: 200px; }
        .btn-search { background: var(--secondary); color: var(--primary); border: none; padding: 10px 30px; font-weight: 800; border-radius: 50px; text-transform: uppercase; letter-spacing: 1px; }

        .main-content { max-width: 1200px; margin: 40px auto; padding: 0 20px; display: grid; grid-template-columns: 320px 1fr; gap: 40px; }
        
        .sidebar { padding: 30px; height: fit-content; animation: fadeInUp 0.5s ease-out; }
        .profile-header { text-align: center; margin-bottom: 30px; }
        .avatar { width: 90px; height: 90px; background: var(--secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: var(--primary); font-weight: bold; margin: 0 auto 15px; box-shadow: 0 10px 20px rgba(212, 175, 55, 0.3); border: 4px solid white; }
        
        .course-btn { width: 100%; padding: 15px 20px; margin-bottom: 12px; border: none; background: transparent; text-align: left; border-radius: 15px; position: relative; transition: all 0.2s; color: #666; cursor:pointer; border: 1px solid transparent; }
        .course-btn:hover { background: white; border-color: #eee; transform: translateX(5px); }
        .course-btn.active { background: white; border-color: var(--secondary); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .course-btn.active::before { content:''; position:absolute; left:0; top:15%; height:70%; width:4px; background: var(--secondary); border-radius: 0 4px 4px 0; }
        .course-btn.active .grupo-text { color: #888; }
        .course-btn.active .bloque-badge { background: var(--primary); color: white; }
        
        .bloque-badge { display: inline-block; font-size: 0.7rem; background: #eee; padding: 2px 8px; border-radius: 10px; margin-top: 5px; font-weight: bold; color: #555; transition: background 0.2s; }

        @media (max-width: 900px) { 
          .main-content { display: flex; flex-direction: column; gap: 20px; margin-top: 20px; } 
          .sidebar { order: -1; padding: 15px; display: flex; overflow-x: auto; gap: 15px; background: transparent; box-shadow: none; border: none; scrollbar-width: none; animation: none; }
          .sidebar::-webkit-scrollbar { display: none; }
          .profile-header { display: none; }
          .course-btn { min-width: 240px; background: white; box-shadow: 0 5px 15px rgba(0,0,0,0.05); margin-bottom: 0; white-space: normal; padding: 15px; }
          .course-btn.active { transform: scale(1.02); border: 2px solid var(--secondary); }
          .course-btn.active::before { display: none; }
        }

        .hero-card { background: linear-gradient(135deg, #003366 0%, #004080 100%); color: white; padding: 40px; border-radius: 30px; position: relative; overflow: hidden; margin-bottom: 40px; box-shadow: 0 20px 40px rgba(0, 51, 102, 0.3); animation: fadeInUp 0.6s ease-out; }
        .hero-info-grid { display: flex; gap: 20px; margin-top: 25px; flex-wrap: wrap; background: rgba(0,0,0,0.25); padding: 15px 20px; border-radius: 15px; backdrop-filter: blur(5px); }
        .hero-info-item { display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.95rem; color: rgba(255,255,255,0.9); }
        
        .big-btn { background: var(--secondary); color: var(--primary); text-decoration: none; padding: 15px 40px; border-radius: 50px; font-weight: 800; font-size: 1.1rem; box-shadow: 0 10px 30px rgba(212, 175, 55, 0.4); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: transform 0.2s; }
        
        .timeline-container { padding: 40px; background: white; border-radius: 30px; animation: fadeInUp 0.7s ease-out; }
        .timeline-item { display: flex; gap: 25px; margin-bottom: 30px; position: relative; }
        .timeline-line { position: absolute; left: 24px; top: 50px; bottom: -30px; width: 3px; background: #f0f0f0; z-index: 0; }
        .timeline-item:last-child .timeline-line { display: none; }
        .date-circle { width: 50px; height: 50px; background: #fff; border: 3px solid #eee; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem; color: #aaa; z-index: 1; flex-shrink: 0; transition: all 0.3s; }
        .timeline-item.active .date-circle { border-color: var(--secondary); color: var(--primary); background: #fffdf5; box-shadow: 0 0 0 6px rgba(212, 175, 55, 0.15); transform: scale(1.1); }
        .timeline-content { flex: 1; background: #fcfcfc; padding: 25px; border-radius: 20px; border: 1px solid #f0f0f0; transition: all 0.3s; }
        .timeline-item.active .timeline-content { background: white; border-color: var(--secondary); box-shadow: 0 15px 30px rgba(0,0,0,0.06); transform: translateX(5px); }
        
        .zoom-mini-btn { display: inline-flex; align-items: center; gap: 8px; background: #2D8CFF; color: white; padding: 10px 20px; border-radius: 50px; text-decoration: none; font-size: 0.9rem; font-weight: bold; margin-top: 15px; box-shadow: 0 5px 15px rgba(45, 140, 255, 0.3); transition: transform 0.2s; }
        .zoom-mini-btn:hover { transform: translateY(-2px); }
        
        .copy-icon { cursor: pointer; opacity: 0.6; transition: opacity 0.2s; font-size: 1.1rem; }
        .copy-icon:hover { opacity: 1; transform: scale(1.1); }

        .offline-badge { display: inline-block; background: #e3f2fd; color: #1565c0; padding: 8px 15px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; margin-top: 10px; border: 1px solid rgba(21, 101, 192, 0.1); }

        .whatsapp-btn { position: fixed; bottom: 30px; right: 30px; background: #25D366; color: white; padding: 15px 25px; border-radius: 50px; text-decoration: none; font-weight: bold; box-shadow: 0 10px 30px rgba(37, 211, 102, 0.4); z-index: 100; display: flex; align-items: center; gap: 10px; transition: transform 0.2s; }
        .whatsapp-btn:hover { transform: translateY(-5px); }
        
        .loading-screen, .error-screen { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg); }
        .spinner { border: 4px solid rgba(0, 51, 102, 0.1); border-top: 4px solid var(--secondary); border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
      
      {/* LOGIN ADMIN */}
      {view === 'login' && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(5px)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <form onSubmit={handleLogin} className="glass-panel fade-in-up" style={{padding:'40px', width:'320px', textAlign:'center', background:'white'}}>
            <h3 style={{color:'var(--primary)', marginTop:0, fontSize:'1.5rem'}}>Acceso Admin</h3>
            <p style={{color:'#666', fontSize:'0.9rem', marginBottom:'20px'}}>Solo personal autorizado</p>
            <input type="password" placeholder="Contraseña" value={passInput} onChange={(e)=>setPassInput(e.target.value)} style={{width:'100%', padding:'15px', marginBottom:'20px', border:'1px solid #ddd', borderRadius:'12px', outline:'none', boxSizing:'border-box', background:'#f9f9f9'}} autoFocus />
            <div style={{display:'flex', gap:'10px'}}>
              <button type="button" onClick={()=>setView('user')} className="rounded-btn" style={{flex:1, padding:'12px', background:'#f0f0f0', border:'none', color:'#666', fontWeight:'bold'}}>Cancelar</button>
              <button type="submit" className="rounded-btn" style={{flex:1, background:'var(--primary)', color:'white', border:'none', fontWeight:'bold'}}>Entrar</button>
            </div>
          </form>
        </div>
      )}

      <div className="test-banner">💎 EDICIÓN PREMIUM v12.0 (Toasts + Copy + Animaciones)</div>

      <header className="header">
        <div className="header-content">
          <div className="brand" onClick={handleReset} style={{cursor:'pointer'}}>
            <h1>PORTAL DOCENTES</h1>
            <h2>ADMINISTRACIÓN S.S.T.</h2>
          </div>
          <div className="actions">
            {!docente && (
              <form onSubmit={handleSearch} className="search-container">
                <input placeholder="Cédula del Docente" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="search-input" />
                <button className="btn-search rounded-btn">CONSULTAR</button>
              </form>
            )}
            {docente && <button onClick={handleReset} className="btn-search rounded-btn" style={{fontSize:'0.75rem', padding:'10px 20px'}}>↺ Salir</button>}
          </div>
        </div>
      </header>

      <main className="main-content">
        {!docente ? (
          <div className="glass-panel fade-in-up" style={{gridColumn:'1 / -1', textAlign:'center', padding:'100px 20px', position:'relative', overflow:'hidden'}}>
             <div style={{position:'absolute', top:'-50px', left:'50%', transform:'translateX(-50%)', width:'300px', height:'300px', background:'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, rgba(0,0,0,0) 70%)', borderRadius:'50%'}}></div>
            <div style={{fontSize:'5rem', marginBottom:'20px', animation:'fadeInUp 1s'}}>👨‍🏫</div>
            <h1 style={{color:'var(--primary)', marginBottom:'15px', fontSize:'2.5rem'}}>Portal Docente</h1>
            <p style={{color:'#666', maxWidth:'600px', margin:'0 auto', fontSize:'1.1rem', lineHeight:'1.6'}}>
              Gestiona tu programación académica, accede a tus aulas virtuales y consulta tus grupos de forma centralizada.
            </p>
            <div style={{marginTop:'40px', fontSize:'0.9rem', color:'#888'}}>
              {getFechaHoy()}
            </div>
            <div style={{marginTop:'80px', cursor:'pointer', opacity:0.3, fontSize:'0.8rem'}} onClick={()=>setView('login')}>🔒 Acceso Administrativo</div>
          </div>
        ) : (
          <>
            {/* SIDEBAR */}
            <aside className="sidebar glass-panel">
              <div className="profile-header">
                <div className="avatar">{docente.nombre.charAt(0)}</div>
                <h3 style={{margin:0, color:'var(--primary)'}}>{getSaludo()},<br/>{docente.nombre.split(' ')[0]}</h3>
                <div style={{fontSize:'0.85rem', color:'#888', marginTop:'5px', background:'#f5f5f5', display:'inline-block', padding:'3px 10px', borderRadius:'10px'}}>
                  ID: {docente.idReal}
                </div>
              </div>
              
              <div className="profile-header" style={{height:'1px', background:'#eee', margin:'20px 0'}}></div>

              {docente.cursos.map((c, i) => (
                <button key={i} onClick={()=>setSelectedCursoIdx(i)} className={`course-btn ${selectedCursoIdx === i ? 'active' : ''}`}>
                  <div style={{fontWeight:'bold', fontSize:'0.95rem', color:'var(--primary)'}}>{c.materia}</div>
                  
                  <div className="grupo-text" style={{fontSize:'0.75rem', marginTop:'5px', color:'#666'}}>
                    {c.grupo}
                  </div>
                  <div className="bloque-badge">
                    {c.bloque}
                  </div>
                </button>
              ))}
            </aside>

            {/* DASHBOARD */}
            <section className="dashboard-column">
              
              {/* HERO CARD DETALLADA */}
              {cursoActivo && (
                <div className="hero-card">
                  <div className="hero-content">
                    <div style={{flex:1}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                         <span className="hero-badge" style={{background:'var(--secondary)', color:'var(--primary)', padding:'5px 12px', borderRadius:'20px', fontWeight:'bold', fontSize:'0.8rem'}}>🌟 Asignatura Actual</span>
                         <span style={{background:'rgba(255,255,255,0.2)', padding:'5px 15px', borderRadius:'15px', fontSize:'0.8rem', fontWeight:'bold', border:'1px solid rgba(255,255,255,0.3)'}}>
                           {cursoActivo.bloque}
                         </span>
                      </div>
                      
                      <h1 style={{margin:'15px 0', fontSize:'2.2rem', lineHeight:'1.2', textShadow:'0 2px 10px rgba(0,0,0,0.2)'}}>{cursoActivo.materia}</h1>
                      
                      <div style={{fontSize:'1.1rem', opacity:0.9, marginBottom:'25px'}}>
                        {cursoActivo.grupo}
                      </div>

                      <div className="hero-info-grid">
                        <div className="hero-info-item">📅 <strong>{cursoActivo.fInicio}</strong> <span style={{opacity:0.6, fontSize:'0.8rem'}}> (Inicio)</span></div>
                        <div style={{width:'1px', height:'20px', background:'rgba(255,255,255,0.3)'}}></div>
                        <div className="hero-info-item">🏁 <strong>{cursoActivo.fFin}</strong> <span style={{opacity:0.6, fontSize:'0.8rem'}}> (Fin)</span></div>
                      </div>
                    </div>

                    {/* Botón Principal Animado */}
                    {proximaClase && proximaClase.zoomLink && (
                        <div style={{marginTop:'20px', textAlign:'center'}}>
                          <a href={proximaClase.zoomLink} target="_blank" rel="noreferrer" className="big-btn rounded-btn" onClick={()=>registrarLog(docente.idReal, `🎥 Zoom Hero ${proximaClase.num}`)}>
                            <span>ENTRAR A CLASE</span>
                          </a>
                          <div style={{marginTop:'10px', fontSize:'0.8rem', opacity:0.8}}>
                            Sala de Videoconferencia
                          </div>
                        </div>
                    )}
                  </div>
                </div>
              )}

              {/* TIMELINE */}
              <div className="timeline-container glass-panel">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #eee', paddingBottom:'20px', marginBottom:'30px'}}>
                  <h3 style={{color:'var(--primary)', margin:0, fontSize:'1.3rem'}}>Cronograma de Actividades</h3>
                  <div style={{fontSize:'0.8rem', color:'#888'}}>16 Semanas</div>
                </div>
                
                {cursoActivo && cursoActivo.semanas.map((s, idx) => {
                  const isActive = idx === 0; 
                  return (
                    <div key={idx} className={`timeline-item ${isActive ? 'active' : ''}`}>
                      <div className="timeline-line"></div>
                      <div className="date-circle">
                        <span style={{fontSize:'0.65rem', textTransform:'uppercase'}}>Sem</span>
                        <span style={{fontSize:'1.3rem', lineHeight:'1'}}>{s.num}</span>
                      </div>
                      <div className="timeline-content">
                        <div style={{display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'10px'}}>
                           <div style={{fontWeight:'bold', fontSize:'1.1rem', color: isActive ? 'var(--primary)' : '#444'}}>
                             {s.fecha}
                           </div>
                           {isActive && <span style={{background:'var(--secondary)', color:'var(--primary)', fontSize:'0.7rem', padding:'2px 8px', borderRadius:'5px', fontWeight:'bold', height:'fit-content'}}>HOY</span>}
                        </div>
                        
                        {/* TIPOS DE CLASE */}
                        {s.tipo === 'INDEPENDIENTE' ? (
                            <div className="offline-badge" style={{background:'#f9fbe7', color:'#827717', border:'1px solid #e6ee9c'}}>
                              🏠 {s.displayTexto}
                            </div>
                        ) : s.tipo === 'PRESENCIAL' ? (
                            <div className="offline-badge">
                              🏫 {s.displayTexto} <br/>
                              <small style={{fontWeight:'normal', opacity:0.8}}>{s.ubicacion}</small>
                            </div>
                        ) : (
                            <>
                              <div style={{color:'#666', marginTop:'5px', fontSize:'0.95rem'}}>⏰ {s.hora}</div>
                              {s.zoomLink && (
                                <div style={{display:'flex', alignItems:'center', flexWrap:'wrap', gap:'15px'}}>
                                  <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-mini-btn" onClick={()=>registrarLog(docente.idReal, `🎥 Zoom Sem ${s.num}`)}>
                                    🎥 Unirse a Zoom
                                  </a>
                                  
                                  {/* ID CON BOTÓN DE COPIAR */}
                                  {s.zoomId && (
                                    <div style={{display:'flex', alignItems:'center', gap:'5px', background:'#eee', padding:'5px 10px', borderRadius:'15px', fontSize:'0.8rem', color:'#555'}}>
                                      <span>ID: {s.zoomId}</span>
                                      <span 
                                        className="copy-icon" 
                                        title="Copiar ID"
                                        onClick={()=>copyToClipboard(s.zoomId)}
                                      >
                                        📋
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
      
      <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="whatsapp-btn">
        <span style={{fontSize:'1.5rem'}}>💬</span> <span style={{display:'none', '@media(min-width:768px)':{display:'inline'}}}>Ayuda</span>
      </a>
    </div>
  );
};

export default App;