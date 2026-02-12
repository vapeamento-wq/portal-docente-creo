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
          const creditos = c[13]?.replace(/"/g, '').trim(); 
          const fInicio = c[53]?.replace(/"/g, '').trim() || "Por definir"; 

          const semanas = [];
          
          for (let i = 0; i < 16; i++) { 
            const colIndex = 55 + i; 
            const texto = c[colIndex]?.replace(/"/g, '').trim() || "";
            
            if (texto && texto.length > 5 && !texto.startsWith("-") && !texto.toLowerCase().includes("pendiente")) {
              
              // EXTRACTORES
              const idMatch = texto.match(/ID\s*[-:.]?\s*(\d{9,11})/i);
              const extractedId = idMatch ? idMatch[1] : null;

              let finalLink = null;
              if (extractedId) {
                finalLink = `https://zoom.us/j/${extractedId}`;
              } else {
                const linkMatch = texto.match(/https?:\/\/[^\s,]+/);
                if (linkMatch) {
                   let cleanLink = linkMatch[0];
                   if (cleanLink.includes("-USUARIO")) cleanLink = cleanLink.split("-USUARIO")[0];
                   finalLink = cleanLink;
                }
              }

              const horaMatch = texto.match(/(\d{1,2}\s*[aA]\s*\d{1,2})/i); 
              const partes = texto.split('-');
              let fechaDisplay = partes[0] || `Semana ${i+1}`;
              fechaDisplay = fechaDisplay.replace(/^202[0-9]\s*\/\s*/, '').replace(/\s*\/\s*/g, '/');

              semanas.push({
                num: i + 1,
                fecha: fechaDisplay,
                hora: horaMatch ? horaMatch[0] : "Programada",
                zoomId: extractedId, 
                zoomLink: finalLink
              });
            }
          }

          if (id && !isNaN(id)) {
             if (!diccionario[id]) diccionario[id] = { nombre, idReal: id, cursos: [] };
             if (semanas.length > 0) {
               diccionario[id].cursos.push({ materia, grupo, creditos, fInicio, semanas });
             }
          }
        });
        setState({ loading: false, teachers: diccionario, error: null });
      })
      .catch(err => setState(s => ({ ...s, loading: false, error: "Error leyendo datos." })));
  }, []);

  const docente = useMemo(() => selectedId ? state.teachers[selectedId] : null, [selectedId, state.teachers]);
  const cursoActivo = docente && docente.cursos.length > 0 ? docente.cursos[selectedCursoIdx] : null;

  // Lógica "Inteligente": Buscar la próxima clase (la primera que no haya pasado o la primera disponible)
  const proximaClase = useMemo(() => {
    if (!cursoActivo) return null;
    // Por simplicidad, tomamos la primera de la lista como "Próxima" si no hay lógica de fechas real
    // (En un futuro podríamos comparar con new Date())
    return cursoActivo.semanas[0]; 
  }, [cursoActivo]);

  const progresoSemestre = cursoActivo ? Math.min(100, Math.max(10, (cursoActivo.semanas.length / 16) * 100)) : 0;

  // --- HANDLERS ---
  const handleSearch = (e) => {
    e.preventDefault();
    const idBusqueda = searchTerm.replace(/\D/g, '');
    if (state.teachers[idBusqueda] && state.teachers[idBusqueda].cursos.length > 0) {
      setSelectedId(idBusqueda);
      setSelectedCursoIdx(0);
      registrarLog(idBusqueda, '✅ Consulta Exitosa');
    } else { 
      if(state.teachers[idBusqueda]) alert("Docente encontrado pero SIN asignación visible.");
      else alert("ID no encontrado en Base de Pruebas.");
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
        <div style={{maxWidth:'1000px', width:'100%', background:'white', padding:'30px', borderRadius:'20px', boxShadow:'0 20px 50px rgba(0,0,0,0.1)'}}>
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

  if (state.loading) return <div className="loading-screen"><div className="spinner"></div><p style={{marginTop:'20px', color:'#666'}}>Conectando con Laboratorio...</p></div>;
  if (state.error) return <div className="error-screen">{state.error}</div>;

  return (
    <div className="portal-container">
      <style>{`
        :root { --primary: #003366; --secondary: #D4AF37; --orange: #FF6600; --bg: #F0F2F5; --text: #1A1A1A; --card-bg: #FFFFFF; --shadow: 0 10px 30px rgba(0,0,0,0.08); }
        body { margin: 0; font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
        
        /* HERRAMIENTAS VISUALES */
        .glass-panel { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); box-shadow: var(--shadow); border-radius: 20px; }
        .rounded-btn { border-radius: 50px; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
        .rounded-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        
        .test-banner { background: linear-gradient(90deg, #e74c3c, #c0392b); color: white; text-align: center; padding: 10px; font-weight: bold; font-size: 0.85rem; letter-spacing: 1px; box-shadow: 0 2px 10px rgba(231, 76, 60, 0.3); }
        
        .header { background: var(--primary); padding: 20px 0; position: relative; overflow: hidden; }
        .header::after { content:''; position: absolute; top:-50%; right:-10%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, rgba(0,0,0,0) 70%); border-radius: 50%; pointer-events: none; }
        .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 10; }
        .brand h1 { margin: 0; color: var(--secondary); font-size: 1.8rem; font-weight: 800; letter-spacing: -0.5px; } 
        .brand h2 { margin: 5px 0 0; font-size: 0.8rem; color: rgba(255,255,255,0.8); font-weight: 500; letter-spacing: 2px; text-transform: uppercase; }

        .search-container { background: white; padding: 5px; border-radius: 50px; display: flex; box-shadow: 0 5px 20px rgba(0,0,0,0.2); }
        .search-form input { padding: 10px 20px; border-radius: 50px; border: none; outline: none; font-size: 1rem; width: 200px; }
        .btn-search { background: var(--secondary); color: var(--primary); border: none; padding: 10px 25px; font-weight: 800; border-radius: 50px; }

        .main-content { max-width: 1200px; margin: 40px auto; padding: 0 20px; display: grid; grid-template-columns: 300px 1fr; gap: 30px; }
        
        /* SIDEBAR */
        .sidebar { padding: 30px; height: fit-content; }
        .profile-header { text-align: center; margin-bottom: 30px; }
        .avatar { width: 80px; height: 80px; background: var(--secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: var(--primary); font-weight: bold; margin: 0 auto 15px; box-shadow: 0 10px 20px rgba(212, 175, 55, 0.3); }
        .course-btn { width: 100%; padding: 15px 20px; margin-bottom: 10px; border: none; background: transparent; text-align: left; border-radius: 15px; position: relative; transition: all 0.2s; color: #666; }
        .course-btn:hover { background: rgba(0, 51, 102, 0.05); color: var(--primary); }
        .course-btn.active { background: var(--primary); color: white; box-shadow: 0 10px 20px rgba(0, 51, 102, 0.2); }
        .course-btn.active b { color: var(--secondary); }

        /* DASHBOARD */
        .hero-card { background: linear-gradient(135deg, #003366 0%, #004080 100%); color: white; padding: 40px; border-radius: 25px; position: relative; overflow: hidden; margin-bottom: 40px; box-shadow: 0 20px 40px rgba(0, 51, 102, 0.3); }
        .hero-card::before { content:''; position: absolute; top:0; right:0; width: 300px; height: 300px; background: url('https://www.transparenttextures.com/patterns/cube-coat.png'); opacity: 0.1; }
        .hero-content { position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: center; }
        .hero-badge { background: var(--secondary); color: var(--primary); padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 15px; display: inline-block; }
        .big-btn { background: var(--secondary); color: var(--primary); text-decoration: none; padding: 15px 40px; border-radius: 50px; font-weight: 800; font-size: 1.1rem; box-shadow: 0 10px 30px rgba(212, 175, 55, 0.4); border: none; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: transform 0.2s; }
        .big-btn:hover { transform: scale(1.05); }

        /* TIMELINE */
        .timeline-container { padding: 30px; background: white; border-radius: 25px; }
        .timeline-item { display: flex; gap: 20px; margin-bottom: 30px; position: relative; }
        .timeline-line { position: absolute; left: 24px; top: 50px; bottom: -30px; width: 2px; background: #eee; z-index: 0; }
        .timeline-item:last-child .timeline-line { display: none; }
        
        .date-circle { width: 50px; height: 50px; background: #fff; border: 3px solid #eee; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem; color: #aaa; z-index: 1; flex-shrink: 0; }
        .timeline-item.active .date-circle { border-color: var(--secondary); color: var(--primary); background: #fffdf5; box-shadow: 0 0 0 5px rgba(212, 175, 55, 0.2); transform: scale(1.1); }
        
        .timeline-content { flex: 1; background: #f9f9f9; padding: 20px; border-radius: 20px; border: 1px solid #eee; transition: all 0.2s; }
        .timeline-item.active .timeline-content { background: white; border-color: var(--secondary); box-shadow: 0 10px 30px rgba(0,0,0,0.05); }

        .tag { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; margin-right: 8px; }
        .tag-blue { background: #e3f2fd; color: #1565c0; }
        .tag-gold { background: #fff8e1; color: #fbc02d; }

        .zoom-mini-btn { display: inline-flex; align-items: center; gap: 5px; background: #2D8CFF; color: white; padding: 8px 15px; border-radius: 20px; text-decoration: none; font-size: 0.85rem; font-weight: bold; margin-top: 10px; }

        .whatsapp-btn { position: fixed; bottom: 30px; right: 30px; background: #25D366; color: white; padding: 15px 30px; border-radius: 50px; text-decoration: none; font-weight: bold; box-shadow: 0 10px 30px rgba(37, 211, 102, 0.4); transition: transform 0.2s; z-index: 100; display: flex; align-items: center; gap: 10px; }
        .whatsapp-btn:hover { transform: translateY(-5px); }

        .loading-screen, .error-screen { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg); }
        .spinner { border: 4px solid rgba(0, 51, 102, 0.1); border-top: 4px solid var(--secondary); border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        @media (max-width: 900px) { .main-content { grid-template-columns: 1fr; } .hero-content { flex-direction: column; text-align: center; gap: 20px; } .sidebar { order: 2; } .timeline-line { left: 19px; } .date-circle { width: 40px; height: 40px; font-size: 0.7rem; } }
      `}</style>
      
      {/* LOGIN ADMIN MODAL */}
      {view === 'login' && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(5px)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <form onSubmit={handleLogin} className="glass-panel" style={{padding:'40px', width:'300px', textAlign:'center'}}>
            <h3 style={{color:'var(--primary)', marginTop:0}}>Acceso Admin</h3>
            <input type="password" placeholder="Pass: admincreo" value={passInput} onChange={(e)=>setPassInput(e.target.value)} style={{width:'100%', padding:'12px', marginBottom:'20px', border:'1px solid #ddd', borderRadius:'10px', outline:'none', boxSizing:'border-box'}} autoFocus />
            <div style={{display:'flex', gap:'10px'}}>
              <button type="button" onClick={()=>setView('user')} className="rounded-btn" style={{flex:1, padding:'10px', background:'#eee', border:'none', color:'#666'}}>Cancelar</button>
              <button type="submit" className="rounded-btn" style={{flex:1, background:'var(--primary)', color:'white', border:'none', fontWeight:'bold'}}>Entrar</button>
            </div>
          </form>
        </div>
      )}

      <div className="test-banner">⚠️ MODO LABORATORIO DE DISEÑO (v10.0 Modern UI)</div>

      <header className="header">
        <div className="header-content">
          <div className="brand" onClick={handleReset} style={{cursor:'pointer'}}>
            <h1>PORTAL DOCENTES</h1>
            <h2>ADMINISTRACIÓN S.S.T.</h2>
          </div>
          <div className="actions">
            {!docente && (
              <form onSubmit={handleSearch} className="search-container">
                <input placeholder="Ingresa tu Cédula" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="search-input" />
                <button className="btn-search rounded-btn">CONSULTAR</button>
              </form>
            )}
            {docente && <button onClick={handleReset} className="btn-search rounded-btn" style={{fontSize:'0.8rem'}}>↺ Nueva Búsqueda</button>}
          </div>
        </div>
      </header>

      <main className="main-content">
        {!docente ? (
          <div className="glass-panel" style={{gridColumn:'1 / -1', textAlign:'center', padding:'80px 20px'}}>
            <div style={{fontSize:'4rem', marginBottom:'20px'}}>👨‍🏫</div>
            <h1 style={{color:'var(--primary)', marginBottom:'10px'}}>Bienvenido al Portal Docente</h1>
            <p style={{color:'#666', maxWidth:'500px', margin:'0 auto'}}>
              Gestione sus asignaturas, acceda a sus clases virtuales y consulte su programación académica en un solo lugar.
            </p>
            <div style={{marginTop:'60px', cursor:'pointer', opacity:0.3, fontSize:'0.8rem'}} onClick={()=>setView('login')}>🔒 Acceso Administrativo</div>
          </div>
        ) : (
          <>
            {/* SIDEBAR CON PERFIL Y CURSOS */}
            <aside className="sidebar glass-panel">
              <div className="profile-header">
                <div className="avatar">{docente.nombre.charAt(0)}</div>
                <h3 style={{margin:0, color:'var(--primary)'}}>{docente.nombre}</h3>
                <div style={{fontSize:'0.8rem', color:'#888', marginTop:'5px'}}>ID: {docente.idReal}</div>
              </div>
              
              <div style={{height:'1px', background:'#eee', margin:'20px 0'}}></div>
              
              <h4 style={{margin:'0 0 15px', color:'#aaa', fontSize:'0.75rem', letterSpacing:'1px'}}>MIS ASIGNATURAS</h4>
              {docente.cursos.map((c, i) => (
                <button key={i} onClick={()=>setSelectedCursoIdx(i)} className={`course-btn ${selectedCursoIdx === i ? 'active' : ''}`}>
                  <div style={{fontWeight:'bold', fontSize:'0.9rem'}}>{c.materia}</div>
                  <div style={{fontSize:'0.75rem', marginTop:'3px', opacity:0.8}}>Grupo {c.grupo} • {c.creditos} Créditos</div>
                </button>
              ))}
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            <section className="dashboard-column">
              
              {/* TARJETA HÉROE - PRÓXIMA CLASE */}
              {proximaClase && (
                <div className="hero-card">
                  <div className="hero-content">
                    <div>
                      <span className="hero-badge">🌟 Próxima Clase</span>
                      <h1 style={{margin:'0 0 10px', fontSize:'2.2rem'}}>{cursoActivo.materia}</h1>
                      <div style={{display:'flex', gap:'20px', fontSize:'1.1rem', opacity:0.9}}>
                        <span>📅 {proximaClase.fecha}</span>
                        <span>⏰ {proximaClase.hora}</span>
                      </div>
                    </div>
                    <div>
                      {proximaClase.zoomLink ? (
                        <a href={proximaClase.zoomLink} target="_blank" rel="noreferrer" className="big-btn rounded-btn" onClick={()=>registrarLog(docente.idReal, `🎥 Zoom Hero ${proximaClase.num}`)}>
                          <span>ENTRAR AHORA</span>
                          <span style={{background:'rgba(0,0,0,0.1)', padding:'5px 10px', borderRadius:'20px', fontSize:'0.7rem'}}>ID: {proximaClase.zoomId || 'LINK'}</span>
                        </a>
                      ) : (
                         <div style={{opacity:0.6, fontStyle:'italic'}}>Enlace pendiente</div>
                      )}
                    </div>
                  </div>
                  {/* BARRA DE PROGRESO */}
                  <div style={{marginTop:'30px', background:'rgba(255,255,255,0.1)', height:'6px', borderRadius:'10px', overflow:'hidden'}}>
                     <div style={{width:`${progresoSemestre}%`, background:'var(--secondary)', height:'100%'}}></div>
                  </div>
                  <div style={{textAlign:'right', fontSize:'0.7rem', marginTop:'5px', opacity:0.7}}>Progreso del Semestre</div>
                </div>
              )}

              {/* TIMELINE DE SEMANAS */}
              <div className="timeline-container glass-panel">
                <h3 style={{color:'var(--primary)', borderBottom:'1px solid #eee', paddingBottom:'15px', marginTop:0}}>Cronograma de Actividades</h3>
                
                {cursoActivo && cursoActivo.semanas.map((s, idx) => {
                  // Lógica visual simple: El primero de la lista es el "Activo" (Azul), los demás normales
                  const isActive = idx === 0; 
                  return (
                    <div key={idx} className={`timeline-item ${isActive ? 'active' : ''}`}>
                      <div className="timeline-line"></div>
                      <div className="date-circle">
                        <span>SEM</span>
                        <span style={{fontSize:'1.2rem', lineHeight:'1'}}>{s.num}</span>
                      </div>
                      <div className="timeline-content">
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                          <div>
                            <div style={{fontWeight:'bold', fontSize:'1.1rem', color: isActive ? 'var(--primary)' : '#444'}}>{s.fecha}</div>
                            <div style={{color:'#666', marginBottom:'10px'}}>{s.hora}</div>
                            
                            {s.zoomLink && (
                              <div>
                                <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-mini-btn" onClick={()=>registrarLog(docente.idReal, `🎥 Zoom Sem ${s.num}`)}>
                                  🎥 Unirse a Clase
                                </a>
                                {s.zoomId && <span style={{marginLeft:'10px', fontSize:'0.75rem', color:'#888', background:'#eee', padding:'2px 8px', borderRadius:'4px'}}>ID: {s.zoomId}</span>}
                              </div>
                            )}
                          </div>
                          {isActive && <span className="tag tag-gold">PRÓXIMA</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {(!cursoActivo || cursoActivo.semanas.length === 0) && (
                   <div style={{textAlign:'center', padding:'40px', color:'#888'}}>
                     No hay programación cargada para esta asignatura.
                   </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
      
      <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="whatsapp-btn">
        <span style={{fontSize:'1.5rem'}}>💬</span> <span>Mesa de Ayuda</span>
      </a>
    </div>
  );
};

export default App;