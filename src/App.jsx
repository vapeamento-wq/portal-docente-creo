import React, { useState, useEffect, useMemo } from 'react';

const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSx9XNRqhtDX7dlkfBTeMWPoZPwG3LW0rn3JT_XssQUu0vz1llFjNlx1lKr6krkJt-lbVryTzn8Dpyn/pub?gid=1271152041&single=true&output=csv";

const App = () => {
  const [state, setState] = useState({ loading: true, error: null, teachers: {} });
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
              zoomId: zoomId,
              original: texto
            });
          }

          if (id && !isNaN(id)) {
            if (!diccionario[id]) diccionario[id] = { nombre, cursos: [] };
            diccionario[id].cursos.push({ materia, grupo, semanas });
          }
        });
        setState({ loading: false, error: null, teachers: diccionario });
      })
      .catch(() => setState({ loading: false, error: "Error de conexión", teachers: {} }));
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
      alert("Identificación no encontrada.");
    }
  };

  if (state.loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Sincronizando Horarios CREO...</p>
    </div>
  );

  return (
    <div className="app-shell">
      {/* HEADER PROFESIONAL */}
      <header className="header">
        <div className="header-content">
          <div className="brand" onClick={() => setSelectedId(null)}>
            <h1>PORTAL DOCENTE CREO</h1>
            <p>ADMINISTRACIÓN DE LA SEGURIDAD Y SALUD EN EL TRABAJO</p>
          </div>
          <form onSubmit={handleSearch} className="search-box">
            <input 
              type="text" placeholder="Cédula del docente..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit">CONSULTAR</button>
          </form>
        </div>
      </header>

      <main className="main-layout">
        {!docente ? (
          <div className="empty-state animate-fade">
            <div className="icon-circle">📅</div>
            <h2>Portal de Horarios Académicos</h2>
            <p>Ingrese su identificación para acceder a la planeación de clases y salas Zoom.</p>
          </div>
        ) : (
          <div className="dashboard">
            {/* SIDEBAR DE CURSOS */}
            <aside className="sidebar animate-slide">
              <div className="user-card">
                <div className="avatar">{docente.nombre.charAt(0)}</div>
                <div>
                  <h3>{docente.nombre}</h3>
                  <span>DOCENTE ACTIVO</span>
                </div>
              </div>
              <nav className="course-list">
                {docente.cursos.map((c, i) => (
                  <button key={i} onClick={() => setSelectedCursoIdx(i)} className={selectedCursoIdx === i ? 'active' : ''}>
                    <strong>{c.materia}</strong>
                    <span>Grupo: {c.grupo}</span>
                  </button>
                ))}
              </nav>
            </aside>

            {/* CONTENIDO DE SEMANAS */}
            <section className="content animate-fade">
              <div className="course-info">
                <h2>{cursoActivo.materia}</h2>
                <div className="info-badges">
                  <span className="badge-blue">GRUPO {cursoActivo.grupo}</span>
                  <span className="badge-gold">PROGRAMACIÓN SEMANAL</span>
                </div>
              </div>

              <div className="weeks-grid">
                {cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} className="week-card">
                    <div className="week-tag">SEMANA {idx + 1}</div>
                    <div className="week-body">
                      <p>📅 {s.fecha}</p>
                      <p>⏰ {s.hora}</p>
                      {s.zoomId ? (
                        <div className="zoom-area">
                          <small>ID: {s.zoomId}</small>
                          <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-btn">UNIRSE A CLASE</a>
                        </div>
                      ) : <div className="no-zoom">Sin sala virtual</div>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>© 2026 <strong>PORTAL DOCENTE CREO</strong> — Universidad del Magdalena</p>
      </footer contractors>

      <style>{`
        :root { --azul: #004A87; --dorado: #D4AF37; --bg: #f8fafc; }
        .app-shell { background: var(--bg); min-height: 100vh; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; }
        
        .header { background: white; border-bottom: 3px solid var(--azul); padding: 15px 20px; sticky: top; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .header-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
        .brand h1 { color: var(--azul); margin: 0; font-size: 1.4rem; font-weight: 900; cursor: pointer; }
        .brand p { color: var(--dorado); margin: 0; font-size: 0.65rem; font-weight: 800; letter-spacing: 1px; }
        
        .search-box { display: flex; background: #f1f5f9; border-radius: 10px; padding: 5px; border: 1px solid #e2e8f0; }
        .search-box input { border: none; background: none; padding: 10px; outline: none; width: 200px; font-weight: 600; }
        .search-box button { background: var(--azul); color: white; border: none; padding: 8px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }

        .main-layout { max-width: 1200px; margin: 0 auto; width: 100%; flex: 1; padding: 30px 20px; }
        .empty-state { text-align: center; padding: 100px 0; color: #64748b; }
        .icon-circle { font-size: 50px; margin-bottom: 20px; opacity: 0.5; }

        .dashboard { display: grid; grid-template-columns: 300px 1fr; gap: 30px; }
        .sidebar { background: white; border-radius: 20px; padding: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); height: fit-content; }
        .user-card { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; }
        .avatar { width: 50px; height: 50px; background: var(--azul); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; }
        .user-card h3 { margin: 0; font-size: 1rem; color: var(--azul); }
        .user-card span { font-size: 0.6rem; font-weight: bold; color: var(--dorado); }

        .course-list button { width: 100%; text-align: left; padding: 15px; margin-bottom: 10px; border-radius: 12px; border: 1px solid #f1f5f9; background: #f8fafc; cursor: pointer; transition: 0.2s; }
        .course-list button.active { border-color: var(--dorado); background: #fffdf5; box-shadow: 0 4px 10px rgba(212, 175, 55, 0.1); }
        .course-list button strong { display: block; color: var(--azul); font-size: 0.85rem; }
        .course-list button span { font-size: 0.7rem; color: #94a3b8; }

        .content { background: white; border-radius: 20px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .course-info h2 { margin: 0 0 15px 0; color: var(--azul); font-size: 1.5rem; }
        .info-badges { display: flex; gap: 10px; margin-bottom: 30px; }
        .badge-blue { background: #e0f2fe; color: var(--azul); padding: 5px 15px; border-radius: 20px; font-size: 0.7rem; font-weight: bold; }
        .badge-gold { background: #fef3c7; color: #92400e; padding: 5px 15px; border-radius: 20px; font-size: 0.7rem; font-weight: bold; }

        .weeks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
        .week-card { background: #f8fafc; border-radius: 15px; border: 1px solid #e2e8f0; overflow: hidden; }
        .week-tag { background: white; padding: 10px; font-size: 0.7rem; font-weight: 800; color: var(--dorado); border-bottom: 1px solid #e2e8f0; text-align: center; }
        .week-body { padding: 15px; font-size: 0.8rem; }
        .week-body p { margin: 5px 0; color: #334155; font-weight: 500; }
        
        .zoom-area { margin-top: 15px; padding-top: 10px; border-top: 1px dashed #cbd5e1; }
        .zoom-area small { display: block; font-size: 0.65rem; color: #94a3b8; margin-bottom: 5px; }
        .zoom-btn { display: block; background: #2D8CFF; color: white; text-align: center; padding: 8px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 0.7rem; }
        .no-zoom { font-size: 0.65rem; color: #cbd5e1; text-align: center; margin-top: 15px; }

        .footer { text-align: center; padding: 40px; color: #94a3b8; font-size: 0.75rem; }
        .loading-screen { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--azul); font-weight: bold; }
        .spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: var(--azul); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-fade { animation: fadeIn 0.5s ease-out; }
        .animate-slide { animation: slideIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }

        @media (max-width: 900px) {
          .dashboard { grid-template-columns: 1fr; }
          .header-content { justify-content: center; text-align: center; }
        }
      `}</style>
    </div>
  );
};

export default App;