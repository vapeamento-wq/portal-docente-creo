import React, { useState, useEffect, useMemo } from 'react';

// --- CONFIGURACIÓN DE SEGURIDAD Y CONTACTO ---
// 1. Busca la URL del Excel en las variables de entorno (Vite o React)
const URL_CSV = 
  import.meta.env?.VITE_SHEET_URL || 
  process.env?.VITE_SHEET_URL || 
  process.env?.REACT_APP_SHEET_URL || 
  ""; 

// 2. Número de soporte (Cámbialo por el real)
const WHATSAPP_NUMBER = "573000000000"; 

const App = () => {
  const [state, setState] = useState({ loading: true, teachers: {}, error: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCursoIdx, setSelectedCursoIdx] = useState(0);

  // --- EFECTO: CARGA DE DATOS ---
  useEffect(() => {
    if (!URL_CSV) {
      setState(s => ({ ...s, loading: false, error: "Error de configuración: Variable de entorno no detectada en Vercel." }));
      return;
    }

    fetch(URL_CSV)
      .then(res => res.text())
      .then(csvText => {
        const filas = csvText.split(/\r?\n/);
        const diccionario = {};
        
        filas.forEach((fila) => {
          // Parseo seguro respetando comas dentro de comillas
          const c = fila.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          if (c.length < 25) return;
          
          const materia = c[3]?.replace(/"/g, '').trim();
          // Filtro: Ignorar pendientes
          if (!materia || materia.toUpperCase().includes("PENDIENTE")) return;

          const nombre = c[0]?.replace(/"/g, '').trim();   
          const id = c[1]?.replace(/"/g, '').trim();       
          const grupo = c[5]?.replace(/"/g, '').trim();    
          const creditos = c[7]?.replace(/"/g, '').trim(); 
          const fInicio = c[12]?.replace(/"/g, '').trim(); 

          const semanas = [];
          // Ciclo para leer las 16 semanas (Columnas 14 a 29)
          for (let i = 14; i <= 29; i++) { 
            const texto = c[i]?.replace(/"/g, '').trim() || "";
            // Filtro de contenido válido en la semana
            if (texto && texto !== "-" && texto !== "0" && !texto.toLowerCase().includes("pendiente")) {
              const zoomId = texto.match(/\d{9,11}/)?.[0]; // Busca 9 a 11 dígitos
              const horaMatch = texto.match(/(\d{1,2}\s*A\s*\d{1,2})/i);
              const partes = texto.split('-');
              
              semanas.push({
                num: i - 13,
                fecha: partes[0] ? partes[0].trim() : "Programada",
                hora: horaMatch ? horaMatch[0] : (partes[1] ? partes[1].trim() : "Por definir"),
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
      .catch(err => setState(s => ({ ...s, loading: false, error: "No se pudo conectar con el servidor de datos." })));
  }, []);

  const docente = useMemo(() => selectedId ? state.teachers[selectedId] : null, [selectedId, state.teachers]);
  const cursoActivo = docente ? docente.cursos[selectedCursoIdx] : null;

  const handleSearch = (e) => {
    e.preventDefault();
    const idBusqueda = searchTerm.replace(/\D/g, '');
    if (state.teachers[idBusqueda]) {
      setSelectedId(idBusqueda);
      setSelectedCursoIdx(0);
    } else { alert("Identificación no encontrada en el periodo actual."); }
  };

  if (state.loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Cargando Sistema Académico...</p>
    </div>
  );

  if (state.error) return (
    <div className="error-container">
      <h3>⚠️ Aviso de Sistema</h3>
      <p>{state.error}</p>
    </div>
  );

  return (
    <div className="university-portal">
      {/* ESTILOS CSS INTEGRADOS */}
      <style>{`
        :root {
          --primary: #003366; /* Azul Institucional */
          --secondary: #D4AF37; /* Dorado */
          --bg: #f4f6f8;
          --text: #333;
          --white: #ffffff;
        }

        body { margin: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text); }
        
        /* HEADER */
        .header { background: var(--primary); color: var(--white); padding: 15px 0; border-bottom: 5px solid var(--secondary); box-shadow: 0 4px 10px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 1000; }
        .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
        
        .brand h1 { margin: 0; font-size: 1.4rem; font-weight: 700; letter-spacing: 0.5px; }
        .brand h2 { margin: 5px 0 0; font-size: 0.7rem; color: var(--secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        
        .search-form { display: flex; background: rgba(255,255,255,0.1); padding: 5px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); }
        .search-form input { background: transparent; border: none; padding: 8px; outline: none; color: white; width: 180px; }
        .search-form input::placeholder { color: rgba(255,255,255,0.7); }
        .search-form button { background: var(--secondary); color: var(--primary); border: none; padding: 8px 20px; border-radius: 4px; font-weight: bold; cursor: pointer; transition: 0.2s; }
        .search-form button:hover { background: white; }

        /* MAIN LAYOUT */
        .main-grid { max-width: 1200px; margin: 30px auto; padding: 0 20px; display: flex; flex-direction: column; gap: 30px; }

        /* SIDEBAR (CURSOS) */
        .sidebar { background: var(--white); border-radius: 10px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .prof-header { border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
        .prof-name { margin: 0; color: var(--primary); font-size: 1.2rem; }
        .prof-id { font-size: 0.8rem; color: #666; display: block; margin-top: 5px; }
        
        .nav-label { font-size: 0.7rem; color: var(--secondary); font-weight: 800; text-transform: uppercase; margin-bottom: 10px; display: block; }
        
        .courses-list { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; }
        .course-btn { 
          min-width: 220px; text-align: left; background: #fff; border: 1px solid #e0e0e0; 
          padding: 15px; border-radius: 8px; cursor: pointer; transition: 0.2s; position: relative; 
        }
        .course-btn:hover { border-color: var(--secondary); }
        .course-btn.active { background: #fdfcf5; border-color: var(--secondary); border-left: 5px solid var(--secondary); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .course-btn b { display: block; color: var(--primary); font-size: 0.9rem; margin-bottom: 5px; }
        .course-btn span { font-size: 0.75rem; color: #777; }

        /* DASHBOARD */
        .content-area { background: var(--white); border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05); flex: 1; }
        .content-header { background: var(--primary); color: white; padding: 25px 30px; }
        .content-header h3 { margin: 0; font-size: 1.3rem; font-weight: 600; text-transform: uppercase; }
        
        .metrics-bar { display: grid; grid-template-columns: repeat(3, 1fr); background: #f9f9f9; border-bottom: 1px solid #eee; }
        .metric { padding: 20px; text-align: center; border-right: 1px solid #eee; }
        .metric label { display: block; font-size: 0.65rem; color: #888; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; }
        .metric span { font-size: 1.1rem; color: var(--primary); font-weight: 700; }

        .schedule-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; padding: 30px; }
        .week-card { border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; background: #fff; transition: 0.3s; }
        .week-card:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.05); border-color: var(--secondary); }
        
        .week-num { font-size: 0.7rem; font-weight: 800; color: var(--secondary); text-transform: uppercase; margin-bottom: 10px; display: block; }
        .date-row { font-size: 0.95rem; font-weight: 600; color: #333; margin-bottom: 5px; }
        .time-row { font-size: 0.85rem; color: #666; margin-bottom: 15px; display: flex; align-items: center; gap: 5px; }

        .zoom-action { background: #f0f4f8; padding: 15px; border-radius: 8px; text-align: center; border: 1px dashed #cbd5e1; }
        .zoom-id { display: block; font-size: 0.8rem; color: var(--primary); font-weight: 700; margin-bottom: 8px; }
        .zoom-btn { display: block; background: #2D8CFF; color: white; padding: 10px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 0.85rem; transition: 0.2s; }
        .zoom-btn:hover { background: #1a73e8; }

        /* WHATSAPP FLOAT */
        .whatsapp-float { 
          position: fixed; bottom: 25px; right: 25px; background: #25D366; color: white; 
          padding: 12px 24px; border-radius: 50px; text-decoration: none; font-weight: bold; 
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.4); z-index: 9999; display: flex; align-items: center; gap: 8px;
          transition: transform 0.2s;
        }
        .whatsapp-float:hover { transform: scale(1.05); }

        /* LOADING & ERROR */
        .loading-container, .error-container { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--primary); font-weight: bold; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid var(--secondary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 15px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* RESPONSIVE */
        @media (min-width: 900px) {
          .main-grid { flex-direction: row; align-items: flex-start; }
          .sidebar { width: 300px; flex-shrink: 0; position: sticky; top: 100px; }
          .courses-list { flex-direction: column; overflow-x: visible; }
          .course-btn { min-width: auto; }
        }
      `}</style>

      <header className="header">
        <div className="header-content">
          <div className="branding" onClick={() => setSelectedId(null)}>
            <h1>PORTAL DOCENTES CREO</h1>
            <h2>ADMINISTRACIÓN DE LA SEGURIDAD Y SALUD EN EL TRABAJO</h2>
          </div>
          <form onSubmit={handleSearch} className="search-form">
            <input type="text" placeholder="Ingrese identificación..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <button type="submit">CONSULTAR</button>
          </form>
        </div>
      </header>

      <main className="main-grid">
        {!docente ? (
          <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '80px 20px', color: '#888'}}>
            <div style={{fontSize: '5rem', marginBottom: '20px', color: '#003366'}}>🏛️</div>
            <h2 style={{color: '#003366'}}>Bienvenido al Sistema Académico</h2>
            <p>Ingrese su número de documento para consultar la programación académica oficial.</p>
          </div>
        ) : (
          <>
            <aside className="sidebar">
              <div className="prof-header">
                <h3 className="prof-name">{docente.nombre}</h3>
                <span className="prof-id">ID: {docente.idReal}</span>
              </div>
              <span className="nav-label">MIS ASIGNATURAS</span>
              <div className="courses-list">
                {docente.cursos.map((c, i) => (
                  <button key={i} onClick={() => setSelectedCursoIdx(i)} className={`course-btn ${selectedCursoIdx === i ? 'active' : ''}`}>
                    <b>{c.materia}</b>
                    <span>Grupo {c.grupo}</span>
                  </button>
                ))}
              </div>
            </aside>

            <section className="content-area">
              <div className="content-header">
                <h3>{cursoActivo.materia}</h3>
              </div>
              <div className="metrics-bar">
                <div className="metric"><label>Grupo</label><span>{cursoActivo.grupo}</span></div>
                <div className="metric"><label>Créditos</label><span>{cursoActivo.creditos}</span></div>
                <div className="metric"><label>Programación</label><span>16 Semanas</span></div>
              </div>
              
              <div className="schedule-grid">
                {cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} className="week-card">
                    <span className="week-num">SEMANA {s.num}</span>
                    <div className="date-row">📅 {s.fecha}</div>
                    <div className="time-row">⏰ {s.hora}</div>
                    
                    {s.zoomId ? (
                      <div className="zoom-action">
                        <span className="zoom-id">ID SALA: {s.zoomId}</span>
                        <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-btn">ENTRAR A CLASE</a>
                      </div>
                    ) : (
                      <div style={{marginTop:'15px', fontStyle:'italic', color:'#aaa', fontSize:'0.8rem', textAlign:'center'}}>
                        Sin sala asignada
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* BOTÓN WHATSAPP FIJO */}
      <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="whatsapp-float">
        <span style={{fontSize:'1.2rem'}}>💬</span> Mesa de Ayuda
      </a>
    </div>
  );
};

export default App;