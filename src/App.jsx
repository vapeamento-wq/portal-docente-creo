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
              hora: partes[1] || "Horario no definido",
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
    } else { alert("Identificación no registrada."); }
  };

  if (state.loading) return <div className="loading-state"><span>Sincronizando con la nube...</span></div>;

  return (
    <div className="modern-portal">
      <style>{`
        #root { width: 100% !important; max-width: 100% !important; margin: 0 !important; }
        .modern-portal { background: #f3f4f6; min-height: 100vh; font-family: 'Inter', sans-serif; color: #1f2937; }
        
        /* HEADER PREMIUM */
        .portal-header { background: linear-gradient(135deg, #004A87 0%, #002d52 100%); color: white; padding: 25px 20px; border-bottom: 4px solid #D4AF37; }
        .header-inner { max-width: 1300px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
        .logo-box h1 { margin: 0; font-size: 1.6rem; font-weight: 900; letter-spacing: -0.5px; }
        .logo-box p { margin: 0; color: #D4AF37; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
        
        /* SEARCH ENGINE */
        .search-container { background: rgba(255,255,255,0.1); padding: 5px; border-radius: 12px; display: flex; backdrop-filter: blur(10px); }
        .search-container input { border: none; background: white; padding: 12px 15px; border-radius: 8px; width: 220px; outline: none; font-weight: 600; }
        .search-container button { background: #D4AF37; color: #004A87; border: none; margin-left: 5px; padding: 0 20px; border-radius: 8px; font-weight: 900; cursor: pointer; transition: 0.3s; }
        .search-container button:hover { background: white; }

        /* MAIN CONTENT AREA */
        .portal-body { max-width: 1300px; margin: 40px auto; padding: 0 20px; display: grid; grid-template-columns: 350px 1fr; gap: 30px; }
        @media (max-width: 1024px) { .portal-body { grid-template-columns: 1fr; } }

        /* SIDEBAR PROFESIONAL */
        .sidebar-card { background: white; border-radius: 24px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); height: fit-content; }
        .teacher-profile { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f3f4f6; padding-bottom: 25px; }
        .initials { width: 70px; height: 70px; background: #004A87; color: white; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 900; margin: 0 auto 15px; transform: rotate(-5deg); box-shadow: 0 10px 20px rgba(0,74,135,0.2); }
        .teacher-profile h3 { margin: 0; font-size: 1.1rem; color: #004A87; }
        .teacher-profile span { font-size: 0.75rem; color: #D4AF37; font-weight: bold; }

        .nav-title { font-size: 0.7rem; font-weight: 900; color: #9ca3af; margin-bottom: 15px; letter-spacing: 1px; }
        .course-btn { width: 100%; text-align: left; background: #fff; border: 2px solid #f3f4f6; padding: 18px; border-radius: 16px; margin-bottom: 12px; cursor: pointer; transition: 0.4s; }
        .course-btn.active { border-color: #D4AF37; background: #fffdf5; transform: scale(1.03); box-shadow: 0 10px 20px rgba(212,175,55,0.1); }
        .course-btn b { display: block; color: #004A87; font-size: 0.9rem; margin-bottom: 5px; }
        .course-btn i { font-size: 0.75rem; color: #6b7280; font-style: normal; }

        /* DASHBOARD CONTENT */
        .dashboard-main { background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.03); }
        .dash-header { background: #004A87; color: white; padding: 40px; position: relative; overflow: hidden; }
        .dash-header h2 { position: relative; z-index: 2; margin: 0; font-size: 1.8rem; font-weight: 900; }
        .dash-header::after { content: 'CREO'; position: absolute; right: -20px; bottom: -20px; font-size: 8rem; font-weight: 900; opacity: 0.05; }
        
        .grid-stats { display: grid; grid-template-columns: repeat(3, 1fr); background: #fafafa; border-bottom: 1px solid #f3f4f6; }
        .stat-card { padding: 25px; text-align: center; border-right: 1px solid #f3f4f6; }
        .stat-card label { display: block; font-size: 0.65rem; color: #9ca3af; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; }
        .stat-card span { font-size: 1.4rem; font-weight: 900; color: #004A87; }

        .weeks-section { padding: 40px; }
        .section-header { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; }
        .line { height: 3px; flex: 1; background: #f3f4f6; }
        .section-header h3 { margin: 0; font-size: 1.1rem; color: #374151; font-weight: 800; }

        .weeks-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
        .week-item { background: #fff; border: 2px solid #f3f4f6; border-radius: 20px; padding: 20px; transition: 0.3s; }
        .week-item:hover { border-color: #D4AF37; box-shadow: 0 10px 20px rgba(0,0,0,0.02); }
        .week-num { background: #f3f4f6; display: inline-block; padding: 4px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 900; color: #004A87; margin-bottom: 15px; }
        
        .info-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 0.85rem; color: #4b5563; }
        .info-row strong { color: #1f2937; }

        .zoom-button { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 20px; background: #2D8CFF; color: white; padding: 12px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 0.8rem; transition: 0.3s; }
        .zoom-button:hover { background: #0070f3; transform: translateY(-2px); }

        .dash-footer { background: #f9fafb; padding: 20px 40px; border-top: 1px solid #f3f4f6; display: flex; justify-content: space-between; font-size: 0.75rem; color: #9ca3af; }
        
        .welcome-page { grid-column: 1 / -1; text-align: center; padding: 120px 20px; }
        .welcome-page h2 { font-size: 2rem; color: #004a87; margin-bottom: 10px; }
        .loading-state { height: 100vh; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #004a87; letter-spacing: 2px; }
      `}</style>

      <header className="portal-header">
        <div className="header-inner">
          <div className="logo-box" onClick={() => setSelectedId(null)} style={{cursor:'pointer'}}>
            <h1>PORTAL DOCENTE</h1>
            <p>Universidad del Magdalena • CREO</p>
          </div>
          <form onSubmit={handleSearch} className="search-container">
            <input 
              type="text" placeholder="Identificación..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <button type="submit">BUSCAR</button>
          </form>
        </div>
      </header>

      <main className="portal-body">
        {!docente ? (
          <div className="welcome-page">
            <div style={{fontSize:'5rem', marginBottom:'20px'}}>👨‍🏫</div>
            <h2>Bienvenido, Alberto</h2>
            <p>Ingresa tu número de cédula para visualizar la programación académica completa.</p>
          </div>
        ) : (
          <>
            <aside className="sidebar-card">
              <div className="teacher-profile">
                <div className="initials">{docente.nombre.charAt(0)}</div>
                <h3>{docente.nombre}</h3>
                <span>ESPECIALISTA ASIGNADO</span>
              </div>
              <div className="nav-title">MIS ASIGNATURAS</div>
              {docente.cursos.map((c, i) => (
                <button 
                  key={i} onClick={() => setSelectedCursoIdx(i)} 
                  className={`course-btn ${selectedCursoIdx === i ? 'active' : ''}`}
                >
                  <b>{c.materia}</b>
                  <i>Grupo {c.group}</i>
                </button>
              ))}
            </aside>

            <section className="dashboard-main">
              <div className="dash-header">
                <h2>{cursoActivo.materia}</h2>
                <div style={{marginTop:'10px', fontSize:'0.8rem', fontWeight:'bold', color:'#D4AF37'}}>SEGURIDAD Y SALUD EN EL TRABAJO</div>
              </div>

              <div className="grid-stats">
                <div className="stat-card"><label>Grupo</label><span>{cursoActivo.group}</span></div>
                <div className="stat-card"><label>Cupos</label><span>{cursoActivo.cupos}</span></div>
                <div className="stat-card"><label>Créditos</label><span>{cursoActivo.creditos}</span></div>
              </div>

              <div className="weeks-section">
                <div className="section-header">
                  <h3>Cronograma de Actividades</h3>
                  <div className="line"></div>
                </div>

                <div className="weeks-container">
                  {cursoActivo.semanas.map((s, idx) => (
                    <div key={idx} className="week-item">
                      <div className="week-num">SEMANA {idx + 1}</div>
                      <div className="info-row">📅 <strong>{s.fecha}</strong></div>
                      <div className="info-row">⏰ {s.hora}</div>
                      {s.zoomId ? (
                        <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-button">
                          📹 ENTRAR A ZOOM (ID: {s.zoomId})
                        </a>
                      ) : (
                        <div style={{marginTop:'20px', fontSize:'0.7rem', color:'#d1d5db', textAlign:'center', fontStyle:'italic'}}>
                          Sala virtual no disponible
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="dash-footer">
                <div>PERIODO ACADÉMICO: <b>{cursoActivo.fInicio}</b> - <b>{cursoActivo.fFin}</b></div>
                <div style={{color:'#10b981'}}>✔ Datos Sincronizados</div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default App;