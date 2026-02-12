import React, { useState, useEffect, useMemo } from 'react';

// --- CONFIGURACIÓN DE LABORATORIO 🧪 ---
const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQqVxPhQsuX9SKXsPSj9P5iaL__B0eAt7jzVj8HMnxKW6QTkD6IUuS9eFYTwYep2G6x2rn8uKlfnvsO/pub?output=csv";
const URL_SCRIPT_APPS = "https://script.google.com/macros/s/AKfycbxXAXa1VXPf8mKv0x_yZ__dnRNIMP9yZrIWO1xXvN24V76WWs9jt6O6T5ut_HLPVtyI/exec";
const URL_TU_EXCEL_LOGS = "https://docs.google.com/spreadsheets/d/1flqOTBYG-cvXSR0xVv-0ilTP6i4MNoSdk5aVKQCKaSY/edit?gid=0#gid=0";
const URL_EMBED_LOGS = "https://docs.google.com/spreadsheets/d/1flqOTBYG-cvXSR0xVv-0ilTP6i4MNoSdk5aVKQCKaSY/preview?gid=0";

const WHATSAPP_NUMBER = "573106964025";
const ADMIN_PASS = "admincreo"; 

const App = () => {
  const [view, setView] = useState('user'); 
  const [passInput, setPassInput] = useState('');
  const [state, setState] = useState({ loading: true, teachers: {}, error: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCursoIdx, setSelectedCursoIdx] = useState(0);

  // --- LOGS ---
  const registrarLog = (documento, accion) => {
    try {
      const datosLog = { fecha: new Date().toLocaleString('es-CO'), doc: documento, estado: `[TEST] ${accion}` };
      fetch(URL_SCRIPT_APPS, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datosLog) }).catch(err => console.log(err));
    } catch (e) { console.error(e); }
  };

  // --- CARGA DE DATOS (NUEVA LÓGICA DE COLUMNAS) ---
  useEffect(() => {
    fetch(URL_CSV).then(res => res.text()).then(csvText => {
        const filas = csvText.split(/\r?\n/);
        const diccionario = {};
        
        filas.forEach((fila) => {
          // Regex avanzado para separar por comas respetando comillas
          const c = fila.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          
          // Si la fila es muy corta, la saltamos
          if (c.length < 20) return;

          // --- MAPEO DE COLUMNAS NUEVO ---
          // 6: PROFESOR, 7: DOCUMENTO, 9: ASIGNATURA, 11: GRUPO, 13: CREDITOS, 53: FECHA INICIO
          const materia = c[9]?.replace(/"/g, '').trim();
          if (!materia || materia.toUpperCase().includes("PENDIENTE") || materia === "ASIGNATURA") return;

          const nombre = c[6]?.replace(/"/g, '').trim();   
          const id = c[7]?.replace(/"/g, '').trim();       
          const grupo = c[11]?.replace(/"/g, '').trim();    
          const creditos = c[13]?.replace(/"/g, '').trim(); 
          const fInicio = c[53]?.replace(/"/g, '').trim() || "Por definir"; 

          const semanas = [];
          
          // Bucle para leer las 16 semanas
          // En el nuevo Excel, las semanas están en columnas impares empezando en la 21 (V)
          // 21 (Sem1), 23 (Sem2), 25 (Sem3)... hasta 21 + (15*2) = 51 (Sem16)
          for (let i = 0; i < 16; i++) { 
            const colIndex = 21 + (i * 2);
            const texto = c[colIndex]?.replace(/"/g, '').trim() || "";
            
            if (texto && texto.length > 5 && !texto.toLowerCase().includes("pendiente")) {
              // Lógica de extracción inteligente
              const linkMatch = texto.match(/https?:\/\/[^\s,]+/);
              const zoomLink = linkMatch ? linkMatch[0] : null;
              
              const idMatch = texto.match(/ID\s*-?(\d{9,11})/i);
              const zoomId = idMatch ? idMatch[1] : null;

              const horaMatch = texto.match(/(\d{1,2}\s*[aA]\s*\d{1,2})/i); // Ej: "18 A 20"
              
              // La fecha suele estar al principio antes del primer guion
              const partes = texto.split('-');
              let fechaDisplay = partes[0] || `Semana ${i+1}`;
              
              // Limpieza visual de la fecha (quita el año si sale "2026 /")
              fechaDisplay = fechaDisplay.replace(/^202[0-9]\s*\/\s*/, '').replace(/\s*\/\s*/g, '/');

              semanas.push({
                num: i + 1,
                fecha: fechaDisplay,
                hora: horaMatch ? horaMatch[0] : "Programada",
                zoomId: zoomId,
                zoomLink: zoomLink
              });
            }
          }

          if (id && !isNaN(id.replace(/\./g, ''))) {
            const idLimpio = id.replace(/\./g, ''); 
            if (!diccionario[idLimpio]) diccionario[idLimpio] = { nombre, idReal: idLimpio, cursos: [] };
            if (semanas.length > 0) {
              diccionario[idLimpio].cursos.push({ materia, grupo, creditos, fInicio, semanas });
            }
          }
        });
        setState({ loading: false, teachers: diccionario, error: null });
      })
      .catch(err => setState(s => ({ ...s, loading: false, error: "Error de conexión (Revise URL CSV)." })));
  }, []);

  const docente = useMemo(() => selectedId ? state.teachers[selectedId] : null, [selectedId, state.teachers]);
  const cursoActivo = docente ? docente.cursos[selectedCursoIdx] : null;

  // --- HANDLERS ---
  const handleSearch = (e) => {
    e.preventDefault();
    const idBusqueda = searchTerm.replace(/\D/g, '');
    if (state.teachers[idBusqueda]) {
      setSelectedId(idBusqueda);
      setSelectedCursoIdx(0);
      registrarLog(idBusqueda, '✅ Consulta Exitosa');
    } else { 
      alert("ID no encontrado en la Base de Pruebas.");
      if (idBusqueda) registrarLog(idBusqueda, '❌ Fallido'); 
    }
  };

  const handleReset = () => { setSelectedId(null); setSearchTerm(''); setSelectedCursoIdx(0); };
  
  const handleLogin = (e) => {
    e.preventDefault();
    if (passInput === ADMIN_PASS) setView('admin');
    else alert("Contraseña incorrecta");
  };

  // --- VISTAS ---
  if (view === 'admin') {
    return (
      <div style={{fontFamily:'Segoe UI', background:'#f4f6f8', minHeight:'100vh', padding:'20px', display:'flex', flexDirection:'column', alignItems:'center'}}>
        <div style={{maxWidth:'1000px', width:'100%', background:'white', padding:'30px', borderRadius:'15px', boxShadow:'0 10px 25px rgba(0,0,0,0.1)'}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
            <h2 style={{color:'#003366', margin:0}}>PANEL ADMIN (LABORATORIO)</h2>
            <div style={{display:'flex', gap:'10px'}}>
               <a href={URL_TU_EXCEL_LOGS} target="_blank" rel="noreferrer" style={{background:'#27ae60', color:'white', textDecoration:'none', padding:'10px', borderRadius:'5px'}}>Abrir Excel</a>
               <button onClick={()=>setView('user')} style={{cursor:'pointer', padding:'10px'}}>⬅ Salir</button>
            </div>
          </div>
          <iframe src={URL_EMBED_LOGS} style={{width:'100%', height:'500px', border:'2px solid purple', borderRadius:'10px'}} title="Logs"></iframe>
        </div>
      </div>
    );
  }

  if (state.loading) return <div className="loading-screen"><div className="spinner"></div><p>Cargando Base de Pruebas...</p></div>;
  if (state.error) return <div className="error-screen">{state.error}</div>;

  return (
    <div className="portal-container">
      <style>{`
        :root { --primary: #003366; --secondary: #D4AF37; --orange: #FF6600; --bg: #f4f6f8; --text: #333; --test-alert: #e74c3c; }
        body { margin: 0; font-family: 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); }
        .test-banner { background: var(--test-alert); color: white; text-align: center; padding: 8px; font-weight: bold; font-size: 0.9rem; letter-spacing: 1px; }
        .header { background: var(--primary); padding: 15px 0; border-bottom: 4px solid var(--secondary); }
        .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; }
        .brand h1 { margin: 0; color: var(--orange); font-size: 1.6rem; font-weight: 800; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); } 
        .brand h2 { margin: 5px 0 0; font-size: 0.75rem; color: white; font-weight: 600; letter-spacing: 1px; opacity: 0.9; }
        .main-content { max-width: 1200px; margin: 30px auto; padding: 0 20px; display: flex; gap: 30px; flex-wrap: wrap; }
        .search-form input { padding: 8px; border-radius: 4px; border: none; }
        .btn-search { background: var(--secondary); border: none; padding: 8px 15px; font-weight: bold; cursor: pointer; margin-left: 5px; }
        .sidebar { background: white; padding: 20px; borderRadius: 8px; width: 100%; max-width: 300px; }
        .dashboard { flex: 1; background: white; padding: 20px; borderRadius: 8px; }
        .course-btn { display: block; width: 100%; padding: 10px; margin-bottom: 5px; border: 1px solid #eee; cursor: pointer; background: white; text-align: left; }
        .course-btn.active { border-left: 5px solid var(--secondary); background: #fffdf5; }
        .weeks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin-top: 20px; }
        .week-card { border: 1px solid #eee; padding: 15px; border-radius: 8px; }
        .zoom-link { display: block; background: #2D8CFF; color: white; text-align: center; padding: 8px; border-radius: 4px; text-decoration: none; margin-top: 10px; }
        .whatsapp-btn { position: fixed; bottom: 25px; right: 25px; background: #25D366; color: white; padding: 12px 24px; border-radius: 50px; text-decoration: none; font-weight: bold; }
        .loading-screen, .error-screen { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid var(--secondary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @media (min-width: 900px) { .main-content { flex-wrap: nowrap; align-items: flex-start; } .sidebar { flex-shrink: 0; } }
      `}</style>
      
      {view === 'login' && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <form onSubmit={handleLogin} style={{background:'white', padding:'30px', borderRadius:'10px', width:'300px', textAlign:'center'}}>
            <h3 style={{color:'var(--primary)', marginTop:0}}>Acceso Admin</h3>
            <input type="password" placeholder="Pass: admincreo" value={passInput} onChange={(e)=>setPassInput(e.target.value)} style={{width:'100%', padding:'10px', marginBottom:'15px', border:'1px solid #ddd', borderRadius:'5px'}} autoFocus />
            <div style={{display:'flex', gap:'10px'}}>
              <button type="button" onClick={()=>setView('user')} style={{flex:1, padding:'10px', cursor:'pointer'}}>Cancelar</button>
              <button type="submit" style={{flex:1, background:'var(--primary)', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'}}>Entrar</button>
            </div>
          </form>
        </div>
      )}

      <div className="test-banner">⚠️ MODO LABORATORIO DE PRUEBAS (Estructura Nueva)</div>

      <header className="header">
        <div className="header-content">
          <div className="brand" onClick={handleReset} style={{cursor:'pointer'}}>
            <h1>PORTAL DOCENTES CREO</h1>
            <h2>ADMINISTRACIÓN DE LA SEGURIDAD Y SALUD EN EL TRABAJO</h2>
          </div>
          <div className="actions">
            {!docente && <form onSubmit={handleSearch} className="search-form"><input placeholder="Documento..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} /><button className="btn-search">BUSCAR</button></form>}
            {docente && <button onClick={handleReset} className="btn-search">Nueva Consulta ↺</button>}
          </div>
        </div>
      </header>

      <main className="main-content">
        {!docente ? (
          <div style={{textAlign:'center', width:'100%', padding:'50px', background:'white', borderRadius:'10px', boxShadow:'0 4px 10px rgba(0,0,0,0.05)'}}>
            <h2 style={{color:'var(--primary)'}}>Bienvenido a la consulta de sus asignaciones</h2>
            <p>Ingrese su número de documento en la parte superior.</p>
            <div style={{marginTop:'40px', cursor:'pointer', opacity:0.3}} onClick={()=>setView('login')}>🔒 Admin</div>
          </div>
        ) : (
          <>
            <aside className="sidebar">
              <div style={{marginBottom:'15px'}}>
                <h3 style={{margin:0, color:'var(--primary)'}}>{docente.nombre}</h3>
                <small>ID: {docente.idReal}</small>
              </div>
              <div style={{fontSize:'0.7rem', fontWeight:'bold', color:'var(--secondary)', marginBottom:'10px'}}>ASIGNATURAS</div>
              {docente.cursos.map((c, i) => (
                <button key={i} onClick={()=>setSelectedCursoIdx(i)} className={`course-btn ${selectedCursoIdx === i ? 'active' : ''}`}>
                  <b>{c.materia}</b><br/><small>Grupo {c.grupo}</small>
                </button>
              ))}
            </aside>
            <section className="dashboard">
              <div style={{background:'var(--primary)', color:'white', padding:'15px', borderRadius:'5px 5px 0 0', marginBottom:'15px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h3 style={{margin:0}}>{cursoActivo.materia}</h3>
                <span style={{fontSize:'0.8rem', background:'rgba(255,255,255,0.2)', padding:'5px 10px', borderRadius:'20px'}}>Inicio: {cursoActivo.fInicio}</span>
              </div>
              <div className="weeks-grid">
                {cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} className="week-card">
                    <strong style={{color:'var(--secondary)', fontSize:'0.8rem'}}>SEMANA {s.num}</strong>
                    <div style={{margin:'5px 0', fontWeight:'bold'}}>{s.fecha}</div>
                    <div style={{fontSize:'0.9rem', color:'#666', marginBottom:'10px'}}>{s.hora}</div>
                    {s.zoomLink && <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-link" onClick={()=>registrarLog(docente.idReal, `🎥 Zoom Sem ${s.num}`)}>ENTRAR A CLASE</a>}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      
      <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="whatsapp-btn">💬 Mesa de Ayuda</a>
    </div>
  );
};

export default App;