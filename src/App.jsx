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
          const c = fila.split(/,(?=(?:(?:[^["]*"){2})*[^"]*$)/);
          if (c.length < 50) return;
          
          const id = c[2]?.replace(/"/g, '').trim();      // Columna C: ID
          const nombre = c[0]?.replace(/"/g, '').trim();  // Columna A: Nombre
          const materia = c[9]?.replace(/"/g, '').trim(); // Columna J: Materia
          const creditos = c[10]?.replace(/"/g, '').trim(); // Columna K: Créditos
          const grupo = c[11]?.replace(/"/g, '').trim();  // Columna L: Grupo
          const cupos = c[12]?.replace(/"/g, '').trim();  // Columna M: Cupos
          const fInicio = c[15]?.replace(/"/g, '').trim(); // Columna P: Inicio
          const fFin = c[16]?.replace(/"/g, '').trim();   // Columna Q: Fin

          const semanas = [];
          for (let i = 55; i <= 62; i++) {
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
            diccionario[id].cursos.push({ materia, grupo, creditos, cupos, fInicio, fFin, semanas });
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

  if (state.loading) return <div className="loading">Sincronizando Horarios CREO...</div>;

  return (
    <div className="portal-root">
      <style>{`
        #root { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; display: block !important; }
        .portal-root { font-family: 'Inter', sans-serif; background: #f8fafc; min-height: 100vh; color: #1e293b; }
        
        .header { background: white; padding: 15px 20px; border-bottom: 3px solid #004A87; sticky: top; z-index: 50; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .header-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; }
        .brand h1 { color: #004A87; margin: 0; font-size: 1.3rem; font-weight: 900; }
        .brand p { color: #D4AF37; margin: 0; font-size: 0.6rem; font-weight: 800; letter-spacing: 1px; }
        
        .search-form { display: flex; background: #f1f5f9; border-radius: 8px; padding: 4px; border: 1px solid #e2e8f0; }
        .search-form input { border: none; background: none; padding: 8px 12px; outline: none; width: 180px; font-weight: 600; }
        .search-form button { background: #004A87; color: white; border: none; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; }

        .container { max-width: 1200px; margin: 30px auto; padding: 0 20px; display: grid; grid-template-columns: 300px 1fr; gap: 25px; }
        @media (max-width: 950px) { .container { grid-template-columns: 1fr; } }

        .sidebar { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); height: fit-content; }
        .user-box { display: flex; align-items: center; gap: 12px; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; }
        .avatar { width: 45px; height: 45px; background: #004A87; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
        
        .course-nav button { width: 100%; text-align: left; padding: 12px; margin-bottom: 8px; border-radius: 10px; border: 1px solid #f1f5f9; background: #f8fafc; cursor: pointer; transition: 0.2s; }
        .course-nav button.active { border-color: #D4AF37; background: #fffdf5; box-shadow: 0 4px 10px rgba(212,175,55,0.08); }
        .course-nav b { display: block; color: #004A87; font-size: 0.8rem; }

        .main-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
        .card-header { background: #004A87; color: white; padding: 25px; position: relative; }
        .card-header h2 { margin: 0; font-size: 1.4rem; font-weight: 800; text-transform: uppercase; }
        .card-header p { color: #93c5fd; margin: 5px 0 0; font-size: 0.75rem; font-weight: bold; }
        
        .stats-bar { display: grid; grid-template-columns: repeat(3, 1fr); background: #f8fafc; border-bottom: 1px solid #eee; }
        .stat-item { padding: 15px; text-align: center; border-right: 1px solid #eee; }
        .stat-item label { display: block; font-size: 0.6rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; }
        .stat-item span { font-size: 1.2rem; font-weight: 900; color: #004A87; }

        .schedule-title { padding: 25px 25px 0; display: flex; align-items: center; gap: 10px; }
        .dot { width: 6px; height: 20px; background: #D4AF37; border-radius: 3px; }
        .schedule-title h3 { margin: 0; font-size: 1rem; color: #334155; }

        .grid-weeks { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; padding: 20px 25px 25px; }
        .week-box { background: #fdfdfd; border: 1px solid #f1f5f9; border-radius: 12px; padding: 15px; }
        .week-head { font-size: 0.7rem; font-weight: 900; color: #D4AF37; margin-bottom: 10px; }
        .week-data { font-size: 0.8rem; margin: 4px 0; color: #475569; }
        
        .zoom-link { display: block; margin-top: 12px; background: #2D8CFF; color: white; text-align: center; padding: 8px; border-radius: 8px; text-decoration: none; font-size: 0.7rem; font-weight: bold; }
        
        .footer-info { background: #f1f5f9; padding: 15px 25px; font-size: 0.7rem; color: #64748b; display: flex; gap: 20px; }
        .welcome { grid-column: 1 / -1; text-align: center; padding: 100px 20px; color: #94a3b8; }
        .loading { text-align: center; padding: 100px; color: #004A87; font-weight: bold; }
      `}</style>

      <header className="header">
        <div className="header-content">
          <div className="brand" onClick={() => setSelectedId(null)}>
            <h1>PORTAL DOCENTE CREO</h1>
            <p>ADMINISTRACIÓN DE LA SEGURIDAD Y SALUD EN EL TRABAJO</p>
          </div>
          <form onSubmit={handleSearch} className="search-form">
            <input type="text" placeholder="Cédula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <button type="submit">CONSULTAR</button>
          </form>
        </div>
      </header>

      <main className="container">
        {!docente ? (
          <div className="welcome">
            <div style={{fontSize:'4rem', marginBottom:'20px'}}>🏛️</div>
            <h2>Bienvenido al Portal Docente</h2>
            <p>Ingrese su identificación para ver sus horarios de la Universidad del Magdalena.</p>
          </div>
        ) : (
          <>
            <aside className="sidebar">
              <div className="user-box">
                <div className="avatar">{docente.nombre.charAt(0)}</div>
                <div>
                  <div style={{fontSize:'0.9rem', fontWeight:'900', color:'#004A87'}}>{docente.nombre}</div>
                  <div style={{fontSize:'0.6rem', fontWeight:'bold', color:'#D4AF37'}}>DOCENTE ASIGNADO</div>
                </div>
              </div>
              <div className="course-nav">
                <div style={{fontSize:'0.65rem', fontWeight:'900', color:'#94a3b8', marginBottom:'10px', letterSpacing:'1px'}}>MIS ASIGNATURAS</div>
                {docente.cursos.map((c, i) => (
                  <button key={i} onClick={() => setSelectedCursoIdx(i)} className={selectedCursoIdx === i ? 'active' : ''}>
                    <b>{c.materia}</b>
                    <div style={{fontSize:'0.65rem', color:'#94a3b8'}}>Grupo {c.grupo}</div>
                  </button>
                ))}
              </div>
            </aside>

            <section className="main-card">
              <div className="card-header">
                <h2>{cursoActivo.materia}</h2>
                <p>PLANIFICACIÓN SEMANAL - GRUPO {cursoActivo.grupo}</p>
              </div>

              <div className="stats-bar">
                <div className="stat-item"><label>Grupo Académico</label><span>{cursoActivo.grupo}</span></div>
                <div className="stat-item"><label>Capacidad / Est.</label><span>{cursoActivo.cupos}</span></div>
                <div className="stat-item"><label>Créditos Curso</label><span>{cursoActivo.creditos}</span></div>
              </div>

              <div className="schedule-title">
                <div className="dot"></div>
                <h3>Cronograma de Sesiones (Semanas 1 - 8)</h3>
              </div>

              <div className="grid-weeks">
                {cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} className="week-box">
                    <div className="week-head">SEMANA {idx + 1}</div>
                    <div className="week-data">📅 {s.fecha}</div>
                    <div className="week-data">⏰ {s.hora}</div>
                    {s.zoomId ? (
                      <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-link">SALA ZOOM ID: {s.zoomId}</a>
                    ) : <div style={{fontSize:'0.65rem', color:'#cbd5e1', marginTop:'10px', textAlign:'center'}}>Sala no asignada</div>}
                  </div>
                ))}
              </div>

              <div className="footer-info">
                <div><b>PERIODO:</b> {cursoActivo.fInicio} | {cursoActivo.fFin}</div>
                <div style={{color:'#16a34a'}}>● <b>Sincronizado</b></div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default App;