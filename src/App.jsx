import React, { useState, useEffect, useMemo } from 'react';

const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSx9XNRqhtDX7dlkfBTeMWPoZPwG3LW0rn3JT_XssQUu0vz1llFjNlx1lKr6krkJt-lbVryTzn8Dpyn/pub?gid=1271152041&single=true&output=csv";

const App = () => {
  const [datosDocentes, setDatosDocentes] = useState({});
  const [loading, setLoading] = useState(true);
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
          for (let i = 55; i <= 62; i++) { // Columnas BD a BK (Semanas 1-8)
            if (c[i]) {
              const texto = c[i].replace(/"/g, '').trim();
              
              // 2. Lógica de Zoom: Extraer el ID exacto (ej: ID - 6096090003)
              const matchId = texto.match(/ID\s*-\s*(\d+)/i) || texto.match(/ID\s*(\d+)/i);
              const zoomId = matchId ? matchId[1] : null;
              
              // 3. Extraer Fecha y Hora del formato "martes / 24 / febrero-18 A 20"
              const partes = texto.split('-');
              semanas.push({
                fecha: partes[0] || "No asignada",
                hora: partes[1] || "No asignada",
                zoomLink: zoomId ? `https://zoom.us/j/${zoomId}` : null,
                zoomId: zoomId
              });
            }
          }

          if (id && !isNaN(id)) {
            if (!diccionario[id]) diccionario[id] = { nombre, cursos: [] };
            diccionario[id].cursos.push({ materia, grupo, semanas });
          }
        });
        setDatosDocentes(diccionario);
        setLoading(false);
      });
  }, []);

  const docente = useMemo(() => selectedId ? datosDocentes[selectedId] : null, [selectedId, datosDocentes]);
  const cursoActivo = docente ? docente.cursos[selectedCursoIdx] : null;

  const handleSearch = (e) => {
    e.preventDefault();
    const idLimpio = searchTerm.replace(/\D/g, '');
    if (datosDocentes[idLimpio]) {
      setSelectedId(idLimpio);
      setSelectedCursoIdx(0);
    } else {
      alert("Cédula no encontrada en la base de datos.");
    }
  };

  if (loading) return <div className="loader">Cargando Portal CREO...</div>;

  return (
    <div className="app-container">
      {/* 1. Header Centrado */}
      <header className="main-header">
        <h1>PORTAL DOCENTE CREO</h1>
        <p>UNIVERSIDAD DEL MAGDALENA</p>
      </header>

      <div className="content-wrapper">
        {/* Buscador */}
        <form onSubmit={handleSearch} className="search-form">
          <input 
            type="text" placeholder="Ingrese su cédula..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">BUSCAR</button>
        </form>

        {docente && (
          <div className="main-layout">
            {/* 3. Panel Lateral de Cursos */}
            <aside className="sidebar">
              <div className="teacher-info">
                <h3>{docente.nombre}</h3>
                <p>Docente</p>
              </div>
              <h4 className="sidebar-title">MIS ASIGNATURAS</h4>
              {docente.cursos.map((c, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedCursoIdx(i)} 
                  className={`course-btn ${selectedCursoIdx === i ? 'active' : ''}`}
                >
                  <span className="course-name">{c.materia}</span>
                  <span className="course-group">Grupo: {c.grupo}</span>
                </button>
              ))}
            </aside>

            {/* 3. Contenido Principal con Semanas */}
            <main className="main-content">
              <div className="course-header">
                <h2>{cursoActivo.materia}</h2>
                <span className="badge">GRUPO {cursoActivo.grupo}</span>
              </div>
              
              <div className="weeks-grid">
                {cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} className="week-card">
                    <div className="week-number">SEMANA {idx + 1}</div>
                    <div className="week-detail">📅 {s.fecha}</div>
                    <div className="week-detail">⏰ {s.hora}</div>
                    {s.zoomId ? (
                      <div className="zoom-section">
                        <span className="zoom-id">ID: {s.zoomId}</span>
                        <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-btn">
                          ENTRAR A ZOOM
                        </a>
                      </div>
                    ) : (
                      <div className="no-zoom">Sala no asignada</div>
                    )}
                  </div>
                ))}
              </div>
            </main>
          </div>
        )}
      </div>

      <style>{`
        .app-container { background-color: #f0f2f5; min-height: 100vh; font-family: 'Segoe UI', sans-serif; }
        .main-header { background-color: #004A87; color: white; padding: 20px; text-align: center; border-bottom: 4px solid #D4AF37; }
        .main-header h1 { margin: 0; font-size: 1.6rem; letter-spacing: 1px; }
        .main-header p { color: #D4AF37; margin: 5px 0 0; font-weight: bold; font-size: 0.8rem; }
        
        .content-wrapper { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .search-form { display: flex; justify-content: center; gap: 10px; margin-bottom: 30px; }
        .search-form input { padding: 12px; borderRadius: 8px; border: 1px solid #ccc; width: 100%; max-width: 300px; outline: none; }
        .search-form button { background-color: #004A87; color: white; border: none; padding: 10px 25px; borderRadius: 8px; cursor: pointer; font-weight: bold; }
        
        .main-layout { display: flex; gap: 20px; flex-wrap: wrap; }
        .sidebar { flex: 0 0 300px; background: white; padding: 20px; borderRadius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .teacher-info { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
        .teacher-info h3 { margin: 0; color: #004A87; font-size: 1.1rem; }
        .teacher-info p { margin: 0; color: #999; font-size: 0.8rem; font-weight: bold; }
        .sidebar-title { font-size: 0.75rem; color: #D4AF37; margin-bottom: 15px; letter-spacing: 1px; }
        
        .course-btn { width: 100%; text-align: left; padding: 15px; margin-bottom: 10px; borderRadius: 10px; cursor: pointer; border: 1px solid #eee; background: white; transition: 0.3s; }
        .course-btn.active { border: 2px solid #D4AF37; background: #fffdf0; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .course-name { display: block; font-size: 0.85rem; color: #004A87; font-weight: bold; margin-bottom: 4px; }
        .course-group { font-size: 0.7rem; color: #999; }

        .main-content { flex: 1; background: white; padding: 25px; borderRadius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); min-width: 300px; }
        .course-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid #f0f2f5; padding-bottom: 15px; }
        .course-header h2 { margin: 0; color: #004A87; font-size: 1.3rem; }
        .badge { background: #004A87; color: white; padding: 4px 12px; borderRadius: 20px; font-size: 0.7rem; font-weight: bold; }

        .weeks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; }
        .week-card { border: 1px solid #f0f0f0; padding: 15px; borderRadius: 12px; background: #fafafa; }
        .week-number { color: #D4AF37; font-weight: bold; font-size: 0.75rem; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .week-detail { font-size: 0.8rem; margin-bottom: 6px; color: #444; }
        
        .zoom-section { margin-top: 12px; border-top: 1px dashed #ccc; paddingTop: 12px; }
        .zoom-id { display: block; font-size: 0.7rem; color: #888; margin-bottom: 8px; font-family: monospace; }
        .zoom-btn { display: block; text-align: center; background: #2D8CFF; color: white; padding: 8px; borderRadius: 6px; text-decoration: none; font-size: 0.75rem; font-weight: bold; transition: 0.3s; }
        .zoom-btn:hover { background: #1a73e8; }
        .no-zoom { font-size: 0.7rem; color: #ccc; margin-top: 15px; text-align: center; font-style: italic; }

        .loader { text-align: center; padding: 50px; color: #004A87; font-weight: bold; }

        @media (max-width: 768px) {
          .main-layout { flex-direction: column; }
          .sidebar { flex: none; width: 100%; box-sizing: border-box; }
        }
      `}</style>
    </div>
  );
};

export default App;