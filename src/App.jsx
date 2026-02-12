import React, { useState, useEffect, useMemo } from 'react';

// --- CONFIGURACIÓN DE LABORATORIO 🧪 (TOTALMENTE INDEPENDIENTE) ---

// 1. BASE DE DATOS DE PRUEBA (Para buscar docentes)
const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQqVxPhQsuX9SKXsPSj9P5iaL__B0eAt7jzVj8HMnxKW6QTkD6IUuS9eFYTwYep2G6x2rn8uKlfnvsO/pub?output=csv";

// 2. SCRIPT DE LOGS DE PRUEBA (Para guardar la asistencia)
const URL_SCRIPT_APPS = "https://script.google.com/macros/s/AKfycbxXAXa1VXPf8mKv0x_yZ__dnRNIMP9yZrIWO1xXvN24V76WWs9jt6O6T5ut_HLPVtyI/exec";

// 3. VISOR DEL ADMIN (Excel de Pruebas - El link nuevo que me diste)
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

  // --- LOGS (TEST) ---
  const registrarLog = (documento, accion) => {
    try {
      // Manda el log al script de pruebas con la etiqueta [TEST]
      const datosLog = { fecha: new Date().toLocaleString('es-CO'), doc: documento, estado: `[TEST] ${accion}` };
      fetch(URL_SCRIPT_APPS, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datosLog) }).catch(err => console.log(err));
    } catch (e) { console.error(e); }
  };

  // --- CARGA ---
  useEffect(() => {
    fetch(URL_CSV).then(res => res.text()).then(csvText => {
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
              semanas.push({ num: i - 13, fecha: partes[0] ? partes[0].trim() : "Programada", hora: horaMatch ? horaMatch[0] : (partes[1] ? partes[1].trim() : "Por definir"), zoomId: zoomId, zoomLink: zoomId ? `https://zoom.us/j/${zoomId}` : null });
            }
          }
          if (id && !isNaN(id)) {
            const idLimpio = id.split('.')[0]; 
            if (!diccionario[idLimpio]) diccionario[idLimpio] = { nombre, idReal: idLimpio, cursos: [] };
            if (semanas.length > 0) diccionario[idLimpio].cursos.push({ materia, grupo, creditos, fInicio, semanas });
          }
        });
        setState({ loading: false, teachers: diccionario, error: null });
      }).catch(err => setState(s => ({ ...s, loading: false, error: "Error de conexión con la Base de Pruebas." })));
  }, []);

  const docente = useMemo(() => selectedId ? state.teachers[selectedId] : null, [selectedId, state.teachers]);
  const cursoActivo = docente ? docente.cursos[selectedCursoIdx] : null;

  const handleSearch = (e) => {
    e.preventDefault();
    const idBusqueda = searchTerm.replace(/\D/g, '');
    const encontrado = !!state.teachers[idBusqueda];
    if (encontrado) { setSelectedId(idBusqueda); setSelectedCursoIdx(0); registrarLog(idBusqueda, '✅ Consulta Exitosa'); } 
    else { alert("ID no encontrado en Base de Pruebas."); if (idBusqueda) registrarLog(idBusqueda, '❌ Fallido'); }
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
        <div style={{maxWidth:'1000px', width:'100%', background:'white', padding:'30px', borderRadius:'15px', boxShadow:'0 10px 25px rgba(0,0,0,0.1)'}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
            <div>
              <h2 style={{margin:0, color:'#003366'}}>PANEL ADMIN (LABORATORIO)</h2>
              <small style={{color:'purple'}}>Viendo Logs de Prueba</small>
            </div>
            <div style={{display:'flex', gap:'10px'}}>
               <a href={URL_TU_EXCEL_LOGS} target="_blank" rel="noreferrer" style={{background:'#27ae60', color:'white', textDecoration:'none', padding:'10px', borderRadius:'5px', fontWeight:'bold'}}>Abrir Excel Nuevo</a>
               <button onClick={()=>setView('user')} style={{cursor:'pointer', padding:'10px'}}>⬅ Salir</button>
            </div>
          </div>
          {/* VISOR DE EXCEL DE PRUEBAS */}
          <iframe src={URL_EMBED_LOGS} style={{width:'100%', height:'500px', border:'2px solid purple', borderRadius:'10px'}} title="Logs de Prueba"></iframe>
        </div>
      </div>
    );
  }

  if (state.loading) return <div className="loading-screen"><div className="spinner"></div><p>Cargando Base de Pruebas...</p></div>;
  if (state.error) return <div className="error-screen">{state.error}</div>;

  return (
    <div className="portal-container">
      <style>{`
        :root { --primary: #003366; --secondary: #D4AF37; --orange: #FF6600; --bg: #f4f6f8; --text: #333; --test-alert: #8e44ad; }
        body { margin: 0; font-family: 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); }
        .test-banner { background: var(--test-alert); color: white; text-align: center; padding: 8px; font-weight: bold; font-size: 0.9rem; letter-spacing: 1px; }
        .header { background: var(--primary); padding: 15px 0; border-bottom: 4px solid var(--secondary); }
        .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; }
        .brand h1 { margin: 0; color: var(--orange); font-size: 1.5rem; } .brand h2 { color: white; font-size: 0.8rem; margin:0; }
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
            <h3 style={{color:'var(--primary)', marginTop:0}}>Admin Laboratorio</h3>
            <input type="password" placeholder="Pass: admincreo" value={passInput} onChange={(e)=>setPassInput(e.target.value)} style={{width:'100%', padding:'10px', marginBottom:'15px', border:'1px solid #ddd', borderRadius:'5px'}} autoFocus />
            <div style={{display:'flex', gap:'10px'}}>
              <button type="button" onClick={()=>setView('user')} style={{flex:1, padding:'10px', cursor:'pointer'}}>Cancelar</button>
              <button type="submit" style={{flex:1, background:'var(--primary)', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'}}>Entrar</button>
            </div>
          </form>
        </div>
      )}

      {/* AVISO DE ENTORNO SEGURO */}
      <div className="test-banner">🧪 ESTÁS EN EL LABORATORIO (LOGS SEPARADOS Y CONFIRMADOS)</div>

      <header className="header">
        <div className="header-content">
          <div className="brand" onClick={handleReset} style={{cursor:'pointer'}}>
            <h1>PORTAL DOCENTES (LABORATORIO)</h1>
            <h2>ADMINISTRACIÓN S.S.T.</h2>
          </div>
          <div className="actions">
            {!docente && <form onSubmit={handleSearch} className="search-form"><input placeholder="Documento..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} /><button className="btn-search">BUSCAR</button></form>}
            {docente && <button onClick={handleReset} className="btn-search">Nueva Consulta ↺</button>}
          </div>
        </div>
      </header>

      <main className="main-content">
        {!docente ? (
          <div style={{textAlign:'center', width:'100%', padding:'50px', background:'white', borderRadius:'10px'}}>
            <h2>Bienvenido al Laboratorio</h2>
            <p>Ingresa un documento que exista en tu EXCEL DE PRUEBAS.</p>
            <div style={{marginTop:'20px', cursor:'pointer', opacity:0.5}} onClick={()=>setView('login')}>🔒 Admin Logs</div>
          </div>
        ) : (
          <>
            <aside className="sidebar">
              <h3>{docente.nombre}</h3>
              <p>ID: {docente.idReal}</p>
              <hr/>
              {docente.cursos.map((c, i) => (
                <button key={i} onClick={()=>setSelectedCursoIdx(i)} className={`course-btn ${selectedCursoIdx === i ? 'active' : ''}`}>
                  <b>{c.materia}</b><br/><small>Grupo {c.grupo}</small>
                </button>
              ))}
            </aside>
            <section className="dashboard">
              <h2 style={{margin:0, color:'var(--primary)', borderBottom:'2px solid var(--secondary)', paddingBottom:'10px'}}>{cursoActivo.materia}</h2>
              <div className="weeks-grid">
                {cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} className="week-card">
                    <strong>SEMANA {s.num}</strong>
                    <div>{s.fecha} - {s.hora}</div>
                    {s.zoomLink && <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-link" onClick={()=>registrarLog(docente.idReal, `🎥 Zoom Sem ${s.num}`)}>ENTRAR CLASE</a>}
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