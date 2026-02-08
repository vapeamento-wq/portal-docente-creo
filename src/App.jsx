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
          if (c.length < 50) return;
          
          const id = c[2]?.replace(/"/g, '').trim(); // ID en Columna C
          const nombre = c[0]?.replace(/"/g, '').trim(); // Nombre en Columna A
          const materia = c[9]?.replace(/"/g, '').trim(); // Materia en Columna J
          const creditos = c[10]?.replace(/"/g, '').trim();
          const grupo = c[11]?.replace(/"/g, '').trim();
          const cupos = c[12]?.replace(/"/g, '').trim();

          const semanas = [];
          for (let i = 55; i <= 62; i++) { // BD a BK
            const texto = c[i]?.replace(/"/g, '').trim() || "";
            if (texto && texto !== "-") {
              // 1. Extraer ID de Zoom (busca el número después de "ID -")
              const zoomMatch = texto.match(/ID\s*-\s*(\d+)/i);
              const zoomId = zoomMatch ? zoomMatch[1] : null;

              // 2. Extraer Hora (busca el patrón "XX A XX")
              const horaMatch = texto.match(/(\d{1,2}\s*A\s*\d{1,2})/i);
              const horaFinal = horaMatch ? horaMatch[0] : "Ver descripción";

              // 3. Extraer Fecha (lo que está antes del primer guion o los primeros 20 caracteres)
              const fechaFinal = texto.split('-')[0].trim();

              semanas.push({
                fecha: fechaFinal,
                hora: horaFinal,
                zoomLink: zoomId ? `https://zoom.us/j/${zoomId}` : null,
                zoomId: zoomId,
                detalleCompleto: texto
              });
            } else {
              semanas.push({ fecha: "Sin sesión", hora: "-", zoomLink: null });
            }
          }

          if (id && !isNaN(id)) {
            if (!diccionario[id]) diccionario[id] = { nombre, cursos: [] };
            diccionario[id].cursos.push({ materia, grupo, creditos, cupos, semanas });
          }
        });
        setState({ loading: false, teachers: diccionario });
      });
  }, []);

  const docente = useMemo(() => selectedId ? state.teachers[selectedId] : null, [selectedId, state.teachers]);
  const cursoActivo = docente ? docente.cursos[selectedCursoIdx] : null;

  const handleSearch = (e) => {
    e.preventDefault();
    const idLimpio = searchTerm.replace(/\D/g, '');
    if (state.teachers[idLimpio]) {
      setSelectedId(idLimpio);
      setSelectedCursoIdx(0);
    } else { alert("Cédula no encontrada."); }
  };

  if (state.loading) return <div className="loading-state">Optimizando datos para Unimagdalena...</div>;

  return (
    <div className="modern-portal">
      <style>{`
        #root { width: 100% !important; max-width: 100% !important; margin: 0 !important; }
        .modern-portal { background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .portal-header { background: #004A87; color: white; padding: 20px; border-bottom: 4px solid #D4AF37; }
        .header-inner { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
        .search-box { background: white; padding: 5px; border-radius: 10px; display: flex; border: 1px solid #ddd; }
        .search-box input { border: none; padding: 8px 15px; outline: none; width: 200px; }
        .search-box button { background: #004A87; color: white; border: none; padding: 8px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .portal-body { max-width: 1200px; margin: 30px auto; padding: 0 20px; display: grid; grid-template-columns: 320px 1fr; gap: 30px; }
        @media (max-width: 900px) { .portal-body { grid-template-columns: 1fr; } }
        .sidebar { background: white; border-radius: 20px; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .course-btn { width: 100%; text-align: left; background: #fff; border: 1px solid #eee; padding: 15px; border-radius: 12px; margin-bottom: 10px; cursor: pointer; }
        .course-btn.active { border-color: #D4AF37; background: #fffdf5; }
        .main-dash { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .dash-top { background: #004A87; color: white; padding: 25px; }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); background: #fafafa; border-bottom: 1px solid #eee; }
        .stat { padding: 15px; text-align: center; border-right: 1px solid #eee; }
        .stat label { display: block; font-size: 0.6rem; color: #94a3b8; font-weight: 800; }
        .stat b { font-size: 1.1rem; color: #004A87; }
        .weeks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; padding: 25px; }
        .week-card { background: white; border: 1px solid #eee; border-radius: 15px; padding: 15px; transition: 0.2s; }
        .week-card:hover { border-color: #D4AF37; }
        .zoom-btn { display: block; margin-top: 15px; background: #2D8CFF; color: white; text-align: center; padding: 10px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 0.75rem; }
        .loading-state { height: 100vh; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #004a87; }
      `}</style>

      <header className="portal-header">
        <div className="header-inner">
          <div onClick={() => setSelectedId(null)} style={{cursor:'pointer'}}>
            <h1 style={{margin:0, fontSize:'1.4rem'}}>PORTAL DOCENTE</h1>
            <p style={{margin:0, color:'#D4AF37', fontSize:'0.7rem', fontWeight:'bold'}}>CREO • Unimagdalena</p>
          </div>
          <form onSubmit={handleSearch} className="search-box">
            <input type="text" placeholder="Cédula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <button type="submit">BUSCAR</button>
          </form>
        </div>
      </header>

      <main className="portal-body">
        {!docente ? (
          <div style={{gridColumn:'1/-1', textAlign:'center', padding:'100px'}}>
            <h2 style={{color:'#004A87'}}>Bienvenido, Alberto</h2>
            <p>Consulta tus horarios actualizados con la versión v1.8.</p>
          </div>
        ) : (
          <>
            <aside className="sidebar">
              <h3 style={{margin:'0 0 5px 0', color:'#004A87'}}>{docente.nombre}</h3>
              <p style={{fontSize:'0.7rem', color:'#D4AF37', fontWeight:'bold', marginBottom:'20px'}}>DOCENTE ASIGNADO</p>
              {docente.cursos.map((c, i) => (
                <button key={i} onClick={() => setSelectedCursoIdx(i)} className={`course-btn ${selectedCursoIdx === i ? 'active' : ''}`}>
                  <b style={{fontSize:'0.8rem', color:'#004A87'}}>{c.materia}</b>
                </button>
              ))}
            </aside>

            <section className="main-dash">
              <div className="dash-top">
                <h2 style={{margin:0, fontSize:'1.3rem'}}>{cursoActivo.materia}</h2>
                <span style={{fontSize:'0.75rem', color:'#D4AF37'}}>PROGRAMACIÓN SEMANAL</span>
              </div>
              <div className="stats">
                <div className="stat"><label>GRUPO</label><b>{cursoActivo.grupo}</b></div>
                <div className="stat"><label>CUPOS</label><b>{cursoActivo.cupos}</b></div>
                <div className="stat"><label>CRÉDITOS</label><b>{cursoActivo.creditos}</b></div>
              </div>
              <div className="weeks-grid">
                {cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} className="week-card">
                    <div style={{fontSize:'0.65rem', fontWeight:900, color:'#D4AF37', marginBottom:'10px'}}>SEMANA {idx + 1}</div>
                    <div style={{fontSize:'0.8rem', fontWeight:'bold', marginBottom:'5px'}}>📅 {s.fecha}</div>
                    <div style={{fontSize:'0.75rem', color:'#64748b'}}>⏰ {s.hora}</div>
                    {s.zoomId && (
                      <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-btn" title={s.detalleCompleto}>ENTRAR A ZOOM (ID: {s.zoomId})</a>
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