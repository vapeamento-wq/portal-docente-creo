import React, { useState, useEffect, useMemo } from 'react';

// PRÓXIMO PASO: Cambiaremos esta URL por una Variable de Entorno para mayor seguridad
const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSx9XNRqhtDX7dlkfBTeMWPoZPwG3LW0rn3JT_XssQUu0vz1llFjNlx1lKr6krkJt-lbVryTzn8Dpyn/pub?gid=1271152041&single=true&output=csv";

const App = () => {
  const [state, setState] = useState({ loading: true, teachers: {} });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCursoIdx, setSelectedCursoIdx] = useState(0);

  useEffect(() => {
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
        setState({ loading: false, teachers: diccionario });
      });
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

  if (state.loading) return <div className="loading-screen">Configurando v2.7...</div>;

  return (
    <div className="portal-app">
      <style>{`
        #root { width: 100% !important; max-width: 100% !important; margin: 0 !important; }
        .portal-app { background: #f1f5f9; min-height: 100vh; font-family: 'Segoe UI', sans-serif; position: relative; }
        
        .nav-bar { background: #004A87; color: white; padding: 15px; border-bottom: 4px solid #D4AF37; position: sticky; top: 0; z-index: 1000; }
        .nav-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
        
        .search-container { display: flex; background: white; border-radius: 8px; padding: 2px; width: 100%; max-width: 300px; }
        .search-container input { flex: 1; border: none; padding: 10px; outline: none; font-size: 0.9rem; }
        .search-container button { background: #004A87; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; }

        .main-body { max-width: 1200px; margin: 20px auto; padding: 0 15px; display: flex; flex-direction: column; gap: 20px; }
        
        .courses-wrapper { background: white; border-radius: 16px; padding: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .courses-scroll { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 10px; }
        .course-item { min-width: 200px; background: #fff; border: 2px solid #f1f5f9; padding: 15px; border-radius: 12px; cursor: pointer; text-align: left; transition: 0.3s; }
        .course-item.active { border-color: #D4AF37; background: #fffdf5; box-shadow: 0 4px 12px rgba(212,175,55,0.1); }

        .dashboard { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); flex: 1; }
        .dashboard-head { background: #004A87; color: white; padding: 25px; text-align: center; }
        .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .stat-card { padding: 15px; text-align: center; border-right: 1px solid #e2e8f0; }
        .stat-card small { display: block; font-size: 0.6rem; color: #94a3b8; font-weight: bold; text-transform: uppercase; }
        .stat-card b { color: #004A87; font-size: 1rem; }

        .weeks-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; padding: 20px; }
        .week-box { border: 1px solid #e2e8f0; padding: 20px; border-radius: 16px; background: white; transition: 0.3s; }
        .week-box:hover { border-color: #D4AF37; transform: translateY(-2px); }

        /* BOTÓN DE SOPORTE FLOTANTE */
        .support-btn { position: fixed; bottom: 25px; right: 25px; background: #25D366; color: white; padding: 15px 25px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 0.9rem; box-shadow: 0 10px 20px rgba(37,211,102,0.3); z-index: 2000; display: flex; align-items: center; gap: 10px; }
        
        .loading-screen { height: 100vh; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #004a87; }

        @media (min-width: 900px) {
          .main-body { flex-direction: row; align-items: flex-start; }
          .courses-wrapper { width: 320px; flex-shrink: 0; }
          .courses-scroll { flex-direction: column; overflow-x: visible; }
          .course-item { min-width: auto; }
        }
      `}</style>

      <header className="nav-bar">
        <div className="nav-content">
          <div onClick={() => setSelectedId(null)} style={{cursor:'pointer'}}>
            <h1 style={{margin:0}}>PORTAL DOCENTE</h1>
            <p style={{margin:0, color:'#D4AF37'}}>UNIMAGDALENA • CREO</p>
          </div>
          <form onSubmit={handleSearch} className="search-container">
            <input type="text" placeholder="Cédula docente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <button type="submit">BUSCAR</button>
          </form>
        </div>
      </header>

      <main className="main-body">
        {!docente ? (
          <div style={{textAlign:'center', padding:'100px 20px', width:'100%', color:'#94a3b8'}}>
            <div style={{fontSize:'4rem'}}>📅</div>
            <h2>Bienvenido</h2>
            <p>Portal optimizado para consulta rápida de horarios y salas virtuales.</p>
          </div>
        ) : (
          <>
            <section className="courses-wrapper">
              <h3 style={{fontSize:'0.9rem', color:'#004a87', marginBottom:'15px', textAlign:'center'}}>ASIGNATURAS</h3>
              <div className="courses-scroll">
                {docente.cursos.map((c, i) => (
                  <button key={i} onClick={() => setSelectedCursoIdx(i)} className={`course-item ${selectedCursoIdx === i ? 'active' : ''}`}>
                    <b style={{fontSize:'0.85rem', color:'#004A87', display:'block'}}>{c.materia}</b>
                    <span style={{fontSize:'0.7rem', color:'#94a3b8'}}>Grupo {c.grupo}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="dashboard">
              <div className="dashboard-head">
                <h2 style={{margin:0, fontSize:'1.2rem', textTransform:'uppercase'}}>{cursoActivo.materia}</h2>
              </div>
              <div className="stats-row">
                <div className="stat-card"><small>Grupo</small><b>{cursoActivo.grupo}</b></div>
                <div className="stat-card"><small>Créditos</small><b>{cursoActivo.creditos}</b></div>
                <div className="stat-card"><small>Semanas</small><b>{cursoActivo.semanas.length}</b></div>
              </div>
              <div className="weeks-list">
                {cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} className="week-box">
                    <div style={{fontSize:'0.6rem', color:'#D4AF37', fontWeight:'900', marginBottom:'10px'}}>SEMANA {s.num}</div>
                    <div style={{fontSize:'0.9rem', fontWeight:'bold', marginBottom:'5px'}}>📅 {s.fecha}</div>
                    <div style={{fontSize:'0.8rem', color:'#64748b'}}>⏰ {s.hora}</div>
                    {s.zoomId && (
                      <div style={{marginTop:'15px', background:'#f1f5f9', padding:'10px', borderRadius:'10px'}}>
                        <div style={{fontSize:'0.7rem', color:'#004A87', fontWeight:'900', marginBottom:'5px'}}>SALA ID: {s.zoomId}</div>
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

      {/* BOTÓN FLOTANTE DE SOPORTE */}
      <a 
        href="https://wa.me/573000000000" // REEMPLAZA CON TU NÚMERO
        target="_blank" 
        rel="noreferrer" 
        className="support-btn"
      >
        <span>💬 Soporte Técnico</span>
      </a>
    </div>
  );
};

export default App;