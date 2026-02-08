import React, { useState, useEffect, useMemo } from 'react';

// SEGURIDAD: Ahora el link es secreto y viene desde la configuración de Vercel
// El código intentará leer tanto el formato de Vite como el de Create React App
const URL_CSV = import.meta.env?.VITE_SHEET_URL || process.env?.REACT_APP_SHEET_URL;

const App = () => {
  const [state, setState] = useState({ loading: true, teachers: {}, error: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCursoIdx, setSelectedCursoIdx] = useState(0);

  useEffect(() => {
    if (!URL_CSV) {
      // Si llegas aquí, es porque la variable en Vercel no coincide con el nombre en el código
      setState(s => ({ ...s, loading: false, error: "Error de configuración: No se detectó la variable de entorno en Vercel." }));
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
            const esValido = texto && texto !== "-" && texto !== "0" && !texto.toLowerCase().includes("pendiente");
            
            if (esValido) {
              const zoomId = texto.match(/\d{10}/)?.[0] || texto.match(/\d{9}/)?.[0];
              const horaMatch = texto.match(/(\d{1,2}\s*A\s*\d{1,2})/i);
              const partes = texto.split('-');
              
              semanas.push({
                num: i - 13,
                fecha: partes[0] ? partes[0].trim() : "Confirmada",
                hora: horaMatch ? horaMatch[0] : (partes[1] ? partes[1].trim() : ""),
                zoomId: zoomId,
                zoomLink: zoomId ? `https://zoom.us/j/${zoomId}` : null
              });
            }
          }

          if (id && !isNaN(id)) {
            const idLimpio = id.split('.')[0]; 
            if (!diccionario[idLimpio]) diccionario[idLimpio] = { nombre, idReal: idLimpio, cursos: [] };
            if (semanas.length > 0) {
              diccionario[idLimpio].cursos.push({ materia, grupo, creditos, fInicio, semanas });
            }
          }
        });
        setState({ loading: false, teachers: diccionario, error: null });
      })
      .catch(err => setState(s => ({ ...s, loading: false, error: "Error de conexión con la base de datos." })));
  }, []);

  const docente = useMemo(() => selectedId ? state.teachers[selectedId] : null, [selectedId, state.teachers]);
  const cursoActivo = docente ? docente.cursos[selectedCursoIdx] : null;

  const handleSearch = (e) => {
    e.preventDefault();
    const idBusqueda = searchTerm.replace(/\D/g, '');
    if (state.teachers[idBusqueda]) {
      setSelectedId(idBusqueda);
      setSelectedCursoIdx(0);
    } else { alert("Cédula no encontrada o sin asignación."); }
  };

  if (state.loading) return <div className="loading-box">🔒 Verificando seguridad y cargando datos...</div>;
  if (state.error) return <div className="error-box">⚠️ {state.error}<br/><small>Revisa que el nombre de la variable en Vercel sea VITE_SHEET_URL</small></div>;

  return (
    <div className="portal-v2">
      <style>{`
        #root { width: 100% !important; max-width: 100% !important; margin: 0 !important; }
        .portal-v2 { background: #f1f5f9; min-height: 100vh; font-family: 'Segoe UI', system-ui, sans-serif; }
        
        .header-main { background: #004A87; color: white; padding: 15px; border-bottom: 4px solid #D4AF37; position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .nav-wrap { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
        
        .search-form { display: flex; background: white; border-radius: 10px; padding: 3px; width: 100%; max-width: 300px; }
        .search-form input { flex: 1; border: none; padding: 10px; outline: none; font-size: 0.9rem; font-weight: 600; }
        .search-form button { background: #004A87; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }

        .body-container { max-width: 1200px; margin: 25px auto; padding: 0 15px; display: flex; flex-direction: column; gap: 25px; }
        
        .sidebar-courses { background: white; border-radius: 20px; padding: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
        .scroll-list { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px; scrollbar-width: none; }
        .scroll-list::-webkit-scrollbar { display: none; }
        
        .course-btn { min-width: 200px; flex-shrink: 0; background: #fff; border: 2px solid #f1f5f9; padding: 15px; border-radius: 15px; cursor: pointer; text-align: left; }
        .course-btn.active { border-color: #D4AF37; background: #fffdf5; box-shadow: 0 4px 12px rgba(212,175,55,0.1); }

        .schedule-area { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); flex: 1; }
        .title-banner { background: #004A87; color: white; padding: 30px; text-align: center; }
        
        .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .stat-card { padding: 15px; text-align: center; border-right: 1px solid #e2e8f0; }
        .stat-card label { display: block; font-size: 0.6rem; color: #94a3b8; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
        .stat-card b { color: #004A87; font-size: 1rem; }

        .weeks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; padding: 25px; }
        .week-item { border: 1px solid #e2e8f0; padding: 20px; border-radius: 18px; background: white; position: relative; }
        .week-item:hover { border-color: #D4AF37; }
        
        .zoom-panel { background: #f1f5f9; padding: 12px; border-radius: 12px; margin-top: 15px; text-align: center; }
        .zoom-link-btn { display: block; background: #2D8CFF; color: white; padding: 10px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 0.8rem; margin-top: 8px; }

        .support-float { position: fixed; bottom: 20px; right: 20px; background: #25D366; color: white; padding: 15px 25px; border-radius: 50px; text-decoration: none; font-weight: bold; box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 1000; }
        .loading-box { height: 100vh; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #004a87; }
        .error-box { height: 100vh; display: flex; align-items: center; justify-content: center; color: #ef4444; font-weight: bold; text-align: center; padding: 20px; }

        @media (min-width: 900px) {
          .body-container { flex-direction: row; align-items: flex-start; }
          .sidebar-courses { width: 320px; flex-shrink: 0; }
          .scroll-list { flex-direction: column; overflow-x: visible; }
          .course-btn { min-width: auto; }
        }
      `}</style>

      <header className="header-main">
        <div className="nav-wrap">
          <div onClick={() => setSelectedId(null)} style={{cursor:'pointer'}}>
            <h1 style={{margin:0, fontSize:'1.3rem'}}>PORTAL DOCENTE</h1>
            <p style={{margin:0, color:'#D4AF37', fontSize:'0.7rem', fontWeight:'bold'}}>CREO • Unimagdalena</p>
          </div>
          <form onSubmit={handleSearch} className="search-form">
            <input type="text" placeholder="Cédula docente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <button type="submit">BUSCAR</button>
          </form>
        </div>
      </header>

      <main className="body-container">
        {!docente ? (
          <div style={{textAlign:'center', padding:'120px 20px', width:'100%', color:'#94a3b8', background:'white', borderRadius:'20px'}}>
            <div style={{fontSize:'4rem'}}>🛡️</div>
            <h2 style={{color:'#004A87'}}>Conexión Protegida</h2>
            <p>El portal se ha vinculado exitosamente con las variables de entorno de Vercel.</p>
          </div>
        ) : (
          <>
            <section className="sidebar-courses">
              <div style={{textAlign:'center', marginBottom:'25px', borderBottom:'1px solid #f1f5f9', paddingBottom:'15px'}}>
                 <h3 style={{margin:0, color:'#004A87', fontSize:'1rem'}}>{docente.nombre}</h3>
                 <span style={{fontSize:'0.65rem', color:'#D4AF37', fontWeight:'900'}}>ID: {docente.idReal}</span>
              </div>
              <div className="scroll-list">
                {docente.cursos.map((c, i) => (
                  <button key={i} onClick={() => setSelectedCursoIdx(i)} className={`course-btn ${selectedCursoIdx === i ? 'active' : ''}`}>
                    <b style={{fontSize:'0.85rem', color:'#004A87', display:'block', marginBottom:'5px'}}>{c.materia}</b>
                    <span style={{fontSize:'0.7rem', color:'#94a3b8'}}>Grupo {c.grupo}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="schedule-area">
              <div className="title-banner">
                <h2 style={{margin:0, fontSize:'1.2rem', textTransform:'uppercase'}}>{cursoActivo.materia}</h2>
              </div>
              <div className="stats-row">
                <div className="stat-card"><label>Grupo</label><b>{cursoActivo.grupo}</b></div>
                <div className="stat-card"><label>Créditos</label><b>{cursoActivo.creditos}</b></div>
                <div className="stat-card"><label>Modalidad</label><b>16 Semanas</b></div>
              </div>
              <div className="weeks-grid">
                {cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} className="week-item">
                    <div style={{fontSize:'0.65rem', fontWeight:'900', color:'#D4AF37', marginBottom:'10px'}}>SEMANA {s.num}</div>
                    <div style={{fontSize:'0.95rem', fontWeight:'900', color:'#1e293b', marginBottom:'5px'}}>📅 {s.fecha}</div>
                    <div style={{fontSize:'0.8rem', color:'#64748b'}}>⏰ {s.hora}</div>
                    {s.zoomId && (
                      <div className="zoom-panel">
                         <div style={{fontSize:'0.7rem', color:'#004A87', fontWeight:'900'}}>SALA ID: {s.zoomId}</div>
                         <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-link-btn">ENTRAR A ZOOM 🎥</a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <a href="https://wa.me/573111111111" target="_blank" rel="noreferrer" className="support-float">
        💬 Soporte Técnico
      </a>
    </div>
  );
};

export default App;