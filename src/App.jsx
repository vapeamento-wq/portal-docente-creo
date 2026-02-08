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
          const id = c[2]?.replace(/"/g, '').trim();      // Columna C: ID
          const nombre = c[0]?.replace(/"/g, '').trim();  // Columna A: Nombre
          const materia = c[9]?.replace(/"/g, '').trim(); // Columna J: Materia
          const grupo = c[11]?.replace(/"/g, '').trim();  // Columna L: Grupo
          const semanas = [];
          for (let i = 55; i <= 62; i++) { // Columnas BD a BK
            const texto = c[i]?.replace(/"/g, '').trim() || "-";
            const matchId = texto.match(/ID\s*-\s*(\d+)/i) || texto.match(/ID\s*(\d+)/i);
            const zoomId = matchId ? matchId[1] : null;
            const partes = texto.split('-');
            semanas.push({
              fecha: partes[0] || "Pendiente",
              hora: partes[1] || "Pendiente",
              zoomLink: zoomId ? `https://zoom.us/j/${zoomId}` : null,
              zoomId: zoomId
            });
          }
          if (id && !isNaN(id)) {
            if (!diccionario[id]) diccionario[id] = { nombre, cursos: [] };
            diccionario[id].cursos.push({ materia, grupo, semanas });
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
    } else {
      alert("Cédula no encontrada.");
    }
  };

  if (state.loading) return <div className="loading">Cargando Portal Unimagdalena...</div>;

  return (
    <div className="portal-root">
      <style>{`
        /* RESET TOTAL PARA EVITAR CONFLICTOS CON VITE */
        #root { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; display: block !important; text-align: left !important; }
        .portal-root { font-family: 'Segoe UI', Roboto, sans-serif; background: #f4f7f9; min-height: 100vh; color: #333; }
        
        /* HEADER */
        .portal-header { background: #004A87; color: white; padding: 20px; border-bottom: 4px solid #D4AF37; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header-container { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
        .logo-area h1 { margin: 0; font-size: 1.5rem; font-weight: 800; cursor: pointer; }
        .logo-area p { margin: 0; font-size: 0.7rem; color: #D4AF37; font-weight: bold; letter-spacing: 1px; }
        
        /* SEARCH */
        .search-bar { display: flex; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ccc; }
        .search-bar input { border: none; padding: 10px 15px; outline: none; width: 200px; font-size: 0.9rem; }
        .search-bar button { background: #D4AF37; border: none; padding: 10px 20px; color: #004A87; font-weight: bold; cursor: pointer; }

        /* LAYOUT PRINCIPAL */
        .portal-container { max-width: 1200px; margin: 30px auto; padding: 0 20px; display: grid; grid-template-columns: 320px 1fr; gap: 30px; }
        @media (max-width: 900px) { .portal-container { grid-template-columns: 1fr; } }

        /* SIDEBAR */
        .portal-sidebar { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); height: fit-content; }
        .docente-info { border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
        .docente-info h3 { margin: 0; color: #004A87; font-size: 1.1rem; }
        .docente-info span { font-size: 0.7rem; color: #D4AF37; font-weight: bold; }
        
        .curso-item { width: 100%; text-align: left; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; margin-bottom: 10px; cursor: pointer; transition: 0.2s; }
        .curso-item.active { border-color: #D4AF37; background: #fffdf5; box-shadow: 0 4px 8px rgba(212,175,55,0.1); }
        .curso-item b { display: block; color: #004A87; font-size: 0.85rem; }
        .curso-item small { color: #94a3b8; font-size: 0.7rem; }

        /* CONTENIDO */
        .portal-content { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .content-header { border-bottom: 2px solid #f4f7f9; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
        .content-header h2 { margin: 0; color: #004A87; font-size: 1.4rem; }
        .group-tag { background: #004A87; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: bold; }

        /* GRID SEMANAS */
        .semanas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; }
        .semana-card { background: #fbfcfd; border: 1px solid #eee; border-radius: 10px; overflow: hidden; transition: 0.3s; }
        .semana-card:hover { transform: translateY(-3px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .semana-label { background: #f1f5f9; padding: 8px; text-align: center; font-size: 0.65rem; font-weight: 800; color: #D4AF37; border-bottom: 1px solid #eee; }
        .semana-body { padding: 15px; }
        .semana-body p { margin: 4px 0; font-size: 0.8rem; color: #475569; }
        
        .zoom-box { margin-top: 15px; padding-top: 10px; border-top: 1px dashed #cbd5e1; }
        .zoom-link { display: block; background: #2D8CFF; color: white; text-align: center; padding: 8px; border-radius: 6px; text-decoration: none; font-size: 0.75rem; font-weight: bold; }
        .no-zoom { font-size: 0.7rem; color: #94a3b8; text-align: center; margin-top: 10px; font-style: italic; }

        .welcome-msg { grid-column: 1 / -1; text-align: center; padding: 80px 20px; color: #94a3b8; }
        .loading { text-align: center; padding: 100px; color: #004A87; font-weight: bold; }
      `}</style>

      <header className="portal-header">
        <div className="header-container">
          <div className="logo-area" onClick={() => setSelectedId(null)}>
            <h1>PORTAL DOCENTE CREO</h1>
            <p>ADMINISTRACIÓN DE LA SEGURIDAD Y SALUD EN EL TRABAJO</p>
          </div>
          <form onSubmit={handleSearch} className="search-bar">
            <input 
              type="text" placeholder="Cédula docente..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <button type="submit">BUSCAR</button>
          </form>
        </div>
      </header>

      <main className="portal-container">
        {!docente ? (
          <div className="welcome-msg">
            <h2>Bienvenido, Alberto</h2>
            <p>Ingrese su identificación para gestionar sus cursos y horarios de la Unimagdalena.</p>
          </div>
        ) : (
          <>
            <aside className="portal-sidebar">
              <div className="docente-info">
                <h3>{docente.nombre}</h3>
                <span>DOCENTE ASIGNADO</span>
              </div>
              {docente.cursos.map((c, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedCursoIdx(i)} 
                  className={`curso-item ${selectedCursoIdx === i ? 'active' : ''}`}
                >
                  <b>{c.materia}</b>
                  <small>Grupo: {c.grupo}</small>
                </button>
              ))}
            </aside>

            <section className="portal-content">
              <div className="content-header">
                <h2>{cursoActivo.materia}</h2>
                <span className="group-tag">GRUPO {cursoActivo.grupo}</span>
              </div>
              <div className="semanas-grid">
                {cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} className="semana-card">
                    <div className="semana-label">SEMANA {idx + 1}</div>
                    <div className="semana-body">
                      <p>📅 {s.fecha}</p>
                      <p>⏰ {s.hora}</p>
                      {s.zoomId ? (
                        <div className="zoom-box">
                          <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-link">ZOOM ID: {s.zoomId}</a>
                        </div>
                      ) : <div className="no-zoom">Sala no asignada</div>}
                    </div>
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