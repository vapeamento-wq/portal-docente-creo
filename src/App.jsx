import React, { useState, useEffect, useMemo } from 'react';

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

  if (state.loading) return <div className="loading-state">Optimizando para Móvil...</div>;

  return (
    <div className="portal-mobile-ready">
      <style>{`
        #root { width: 100% !important; max-width: 100% !important; margin: 0 !important; }
        .portal-mobile-ready { background: #f0f4f8; min-height: 100vh; font-family: 'Inter', system-ui, sans-serif; }
        
        .main-header { background: #004A87; color: white; padding: 15px; border-bottom: 4px solid #D4AF37; position: sticky; top: 0; z-index: 100; }
        .header-wrap { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
        .brand h1 { font-size: 1.1rem; margin: 0; font-weight: 900; }
        .brand p { font-size: 0.6rem; color: #D4AF37; margin: 0; font-weight: bold; }

        .search-form { display: flex; background: white; border-radius: 8px; padding: 2px; width: 100%; max-width: 300px; }
        .search-form input { flex: 1; border: none; padding: 8px; outline: none; font-size: 0.9rem; }
        .search-form button { background: #004A87; color: white; border: none; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; }

        .portal-body { max-width: 1200px; margin: 20px auto; padding: 0 15px; display: flex; flex-direction: column; gap: 20px; }
        
        /* SIDEBAR / CURSOS - RESPONSIVE */
        .courses-container { background: white; border-radius: 15px; padding: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .courses-list { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; scrollbar-width: none; }
        .courses-list::-webkit-scrollbar { display: none; }
        
        .course-card { min-width: 200px; flex-shrink: 0; background: #fff; border: 2px solid #f1f5f9; padding: 12px; border-radius: 12px; cursor: pointer; text-align: left; }
        .course-card.active { border-color: #D4AF37; background: #fffdf5; }

        /* DASHBOARD */
        .dash-content { background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .dash-header { background: #004A87; color: white; padding: 20px; text-align: center; }
        
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); background: #fafafa; border-bottom: 1px solid #eee; }
        .stat-box { padding: 12px; text-align: center; border-right: 1px solid #eee; }
        .stat-box label { display: block; font-size: 0.55rem; color: #94a3b8; font-weight: bold; text-transform: uppercase; }
        .stat-box b { font-size: 0.9rem; color: #004A87; }

        .weeks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; padding: 20px; }
        .week-card { border: 2px solid #f8fafc; padding: 15px; border-radius: 15px; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .week-tag { font-size: 0.6rem; font-weight: 900; color: #D4AF37; margin-bottom: 8px; }
        
        .zoom-info { margin-top: 15px; padding: 12px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; text-align: center; }
        .zoom-btn { display: block; background: #2D8CFF; color: white; padding: 10px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 0.75rem; margin-top: 8px; }

        .loading-state { height: 100vh; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #004a87; }
        
        @media (min-width: 900px) {
          .portal-body { flex-direction: row; align-items: flex-start; }
          .courses-container { width: 300px; flex-shrink: 0; }
          .courses-list { flex-direction: column; overflow-x: visible; }
          .course-card { min-width: auto; }
          .brand h1 { font-size: 1.4rem; }
        }
      `}</style>

      <header className="main-header">
        <div className="header-wrap">
          <div className="brand" onClick={() => setSelectedId(null)} style={{cursor:'pointer'}}>
            <h1>PORTAL DOCENTE CREO</h1>
            <p>UNIMAGDALENA • 16 SEMANAS</p>
          </div>
          <form onSubmit={handleSearch} className="search-form">
            <input type="text" placeholder="Cédula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <button type="submit">BUSCAR</button>
          </form>
        </div>
      </header>

      <main className="portal-body">
        {!docente ? (
          <div style={{textAlign:'center', padding:'80px 20px', width:'100%', color:'#94a3b8'}}>
            <div style={{fontSize:'4rem'}}>📱</div>
            <h2>Bienvenido</h2>
            <p>Consulta tus horarios optimizados para cualquier dispositivo.</p>
          </div>
        ) : (
          <>
            <section className="courses-container">
              <p style={{fontSize:'0.6rem', color:'#D4AF37', fontWeight:'900', marginBottom:'10px', textAlign:'center'}}>DESLIZA TUS CURSOS ↔️</p>
              <div className="courses-list">
                {docente.cursos.map((c, i) => (
                  <button key={i} onClick={() => setSelectedCursoIdx(i)} className={`course-card ${selectedCursoIdx === i ? 'active' : ''}`}>
                    <b style={{fontSize:'0.8rem', color:'#004A87', display:'block'}}>{c.materia}</b>
                    <small style={{fontSize:'0.65rem', color:'#94a3b8'}}>Grupo {c.grupo}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="dash-content" style={{flex: 1}}>
              <div className="dash-header">
                <h2 style={{margin:0, fontSize:'1.1rem', textTransform:'uppercase'}}>{cursoActivo.materia}</h2>
              </div>
              <div className="stats-grid">
                <div className="stat-box"><label>Grupo</label><b>{cursoActivo.grupo}</b></div>
                <div className="stat-box"><label>Créditos</label><b>{cursoActivo.creditos}</b></div>
                <div className="stat-box"><label>Semanas</label><b>{cursoActivo.semanas.length}</b></div>
              </div>
              
              <div className="weeks-grid">
                {cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} className="week-card">
                    <div className="week-tag">SEMANA {s.num}</div>
                    <div style={{fontSize:'0.9rem', fontWeight:'bold', marginBottom:'5px'}}>📅 {s.fecha}</div>
                    <div style={{fontSize:'0.8rem', color:'#64748b'}}>⏰ {s.hora}</div>
                    
                    {s.zoomId ? (
                      <div className="zoom-info">
                        <div style={{fontSize:'0.7rem', color:'#004A87', fontWeight:'900', marginBottom:'5px'}}>ID SALA: {s.zoomId}</div>
                        <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-btn">ENTRAR A ZOOM 🎥</a>
                      </div>
                    ) : (
                      <div style={{fontSize:'0.65rem', color:'#cbd5e1', fontStyle:'italic', marginTop:'15px', textAlign:'center'}}>Sala no disponible</div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default App;