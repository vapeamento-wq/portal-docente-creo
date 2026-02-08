import React, { useState, useEffect, useMemo } from 'react';

// SEGURIDAD: Ahora el link es secreto y viene desde la configuración de Vercel
// Si usas Vite (lo más probable), la variable debe llamarse VITE_SHEET_URL
const URL_CSV = import.meta.env.VITE_SHEET_URL || process.env.REACT_APP_SHEET_URL;

const App = () => {
  const [state, setState] = useState({ loading: true, teachers: {}, error: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCursoIdx, setSelectedCursoIdx] = useState(0);

  useEffect(() => {
    if (!URL_CSV) {
      setState(s => ({ ...s, loading: false, error: "Error de configuración: Variable de entorno no encontrada." }));
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

          const semanas = [];
          for (let i = 14; i <= 29; i++) { 
            const texto = c[i]?.replace(/"/g, '').trim() || "";
            if (texto && texto !== "-" && texto !== "0" && !texto.toLowerCase().includes("pendiente")) {
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
              diccionario[idLimpio].cursos.push({ materia, grupo, creditos, semanas });
            }
          }
        });
        setState({ loading: false, teachers: diccionario, error: null });
      })
      .catch(err => setState(s => ({ ...s, loading: false, error: "No se pudo conectar con la base de datos." })));
  }, []);

  const docente = useMemo(() => selectedId ? state.teachers[selectedId] : null, [selectedId, state.teachers]);
  const cursoActivo = docente ? docente.cursos[selectedCursoIdx] : null;

  const handleSearch = (e) => {
    e.preventDefault();
    const idBusqueda = searchTerm.replace(/\D/g, '');
    if (state.teachers[idBusqueda]) {
      setSelectedId(idBusqueda);
      setSelectedCursoIdx(0);
    } else { alert("Cédula no encontrada."); }
  };

  if (state.loading) return <div className="loading-view">🔒 Asegurando conexión...</div>;
  if (state.error) return <div className="error-view">⚠️ {state.error}</div>;

  return (
    <div className="app-container">
      <style>{`
        #root { width: 100% !important; max-width: 100% !important; margin: 0 !important; }
        .app-container { background: #f0f4f8; min-height: 100vh; font-family: 'Segoe UI', system-ui, sans-serif; }
        
        .top-nav { background: #004A87; color: white; padding: 15px; border-bottom: 4px solid #D4AF37; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .nav-inner { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
        
        .search-form { display: flex; background: white; border-radius: 10px; padding: 3px; width: 100%; max-width: 300px; }
        .search-form input { flex: 1; border: none; padding: 10px; outline: none; font-size: 0.9rem; font-weight: 600; color: #333; }
        .search-form button { background: #004A87; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }

        .content-body { max-width: 1200px; margin: 25px auto; padding: 0 15px; display: flex; flex-direction: column; gap: 25px; }
        
        .sidebar-nav { background: white; border-radius: 20px; padding: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .course-selector { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px; scrollbar-width: none; }
        .course-selector::-webkit-scrollbar { display: none; }
        
        .course-pill { min-width: 200px; flex-shrink: 0; background: #f8fafc; border: 2px solid #e2e8f0; padding: 15px; border-radius: 15px; cursor: pointer; text-align: left; transition: 0.3s; }
        .course-pill.active { border-color: #D4AF37; background: #fffdf5; box-shadow: 0 4px 12px rgba(212,175,55,0.15); }

        .schedule-dashboard { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); flex: 1; }
        .course-title-box { background: #004A87; color: white; padding: 30px; text-align: center; }
        
        .stats-bar { display: grid; grid-template-columns: repeat(3, 1fr); background: #fafafa; border-bottom: 1px solid #eee; }
        .stat-unit { padding: 15px; text-align: center; border-right: 1px solid #eee; }
        .stat-unit label { display: block; font-size: 0.6rem; color: #94a3b8; font-weight: 900; text-transform: uppercase; margin-bottom: 5px; }
        .stat-unit b { font-size: 1.1rem; color: #004A87; font-weight: 900; }

        .weeks-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; padding: 30px; }
        .week-card { border: 2px solid #f1f5f9; padding: 20px; border-radius: 20px; background: #fff; transition: 0.3s; position: relative; }
        .week-card:hover { border-color: #D4AF37; transform: translateY(-3px); }
        
        .zoom-badge { background: #f1f5f9; padding: 12px; border-radius: 12px; margin-top: 15px; text-align: center; }
        .zoom-btn { display: block; background: #2D8CFF; color: white; padding: 12px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 0.8rem; margin-top: 10px; }

        .support-float { position: fixed; bottom: 20px; right: 20px; background: #25D366; color: white; padding: 15px 25px; border-radius: 50px; text-decoration: none; font-weight: bold; box-shadow: 0 10px 20px rgba(0,0,0,0.1); z-index: 1000; }
        .loading-view { height: 100vh; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #004a87; }
        .error-view { height: 100vh; display: flex; align-items: center; justify-content: center; color: #ef4444; font-weight: bold; padding: 20px; text-align: center; }

        @media (min-width: 900px) {
          .content-body { flex-direction: row; align-items: flex-start; }
          .sidebar-nav { width: 320px; flex-shrink: 0; }
          .course-selector { flex-direction: column; overflow-x: visible; }
          .course-pill { min-width: auto; }
        }
      `}</style>

      <header className="top-nav">
        <div className="nav-inner">
          <div onClick={() => setSelectedId(null)} style={{cursor:'pointer'}}>
            <h1 style={{margin:0, fontSize:'1.3rem'}}>PORTAL DOCENTE</h1>
            <p style={{margin:0, color:'#D4AF37', fontSize:'0.7rem', fontWeight:'bold'}}>CREO • Unimagdalena</p>
          </div>
          <form onSubmit={handleSearch} className="search-form">
            <input type="text" placeholder="Cédula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <button type="submit">BUSCAR</button>
          </form>
        </div>
      </header>

      <main className="content-body">
        {!docente ? (
          <div style={{textAlign:'center', padding:'120px 20px', width:'100%', color:'#94a3b8', background:'white', borderRadius:'20px'}}>
            <div style={{fontSize:'4rem'}}>🏰</div>
            <h2 style={{color:'#004A87'}}>Portal de Seguridad</h2>
            <p>Datos protegidos y conexión cifrada con Google Sheets.</p>
          </div>
        ) : (
          <>
            <section className="sidebar-nav">
              <div style={{textAlign:'center', marginBottom:'25px'}}>
                 <h3 style={{margin:0, color:'#004A87'}}>{docente.nombre}</h3>
                 <span style={{fontSize:'0.7rem', color:'#D4AF37', fontWeight:'900'}}>DOCENTE ACTIVO</span>
              </div>
              <div className="course-selector">
                {docente.cursos.map((c, i) => (
                  <button key={i} onClick={() => setSelectedCursoIdx(i)} className={`course-pill ${selectedCursoIdx === i ? 'active' : ''}`}>
                    <b style={{fontSize:'0.85rem', color:'#004A87', display:'block', marginBottom:'5px'}}>{c.materia}</b>
                    <span style={{fontSize:'0.7rem', color:'#94a3b8'}}>Grupo {c.grupo}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="schedule-dashboard">
              <div className="course-title-box">
                <h2 style={{margin:0, fontSize:'1.4rem', textTransform:'uppercase'}}>{cursoActivo.materia}</h2>
              </div>
              <div className="stats-bar">
                <div className="stat-unit"><label>Grupo</label><b>{cursoActivo.grupo}</b></div>
                <div className="stat-unit"><label>Créditos</label><b>{cursoActivo.creditos}</b></div>
                <div className="stat-unit"><label>Programación</label><b>16 Semanas</b></div>
              </div>
              <div className="weeks-container">
                {cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} className="week-card">
                    <div style={{fontSize:'0.65rem', fontWeight:'900', color:'#D4AF37', marginBottom:'10px'}}>SEMANA {s.num}</div>
                    <div style={{fontSize:'0.95rem', fontWeight:'900', color:'#1e293b', marginBottom:'5px'}}>📅 {s.fecha}</div>
                    <div style={{fontSize:'0.8rem', color:'#64748b'}}>⏰ {s.hora}</div>
                    {s.zoomId && (
                      <div className="zoom-badge">
                         <div style={{fontSize:'0.7rem', color:'#004A87', fontWeight:'900'}}>ID ZOOM: {s.zoomId}</div>
                         <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-btn">ENTRAR A CLASE 🎥</a>
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
        💬 Soporte CREO
      </a>
    </div>
  );
};

export default App;