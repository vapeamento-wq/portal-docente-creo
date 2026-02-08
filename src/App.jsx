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
          const creditos = c[10]?.replace(/"/g, '').trim(); // Columna K
          const grupo = c[11]?.replace(/"/g, '').trim();  // Columna L
          const cupos = c[12]?.replace(/"/g, '').trim();  // Columna M

          const semanas = [];
          // Leemos desde BD (55) hasta BJ (61) como pediste
          for (let i = 55; i <= 61; i++) { 
            const texto = c[i]?.replace(/"/g, '').trim() || "";
            if (texto && texto !== "-" && texto !== "") {
              // 1. Extraer ID de Zoom (ID - 6096090003)
              const zoomMatch = texto.match(/ID\s*-\s*(\d+)/i) || texto.match(/ID\s*(\d+)/i) || texto.match(/(\d{9,11})/);
              const zoomId = zoomMatch ? zoomMatch[1] : null;

              // 2. Extraer Hora (Busca el patrón "18 A 20")
              const horaMatch = texto.match(/(\d{1,2}\s*A\s*\d{1,2})/i);
              
              // 3. Extraer Fecha (Lo que está antes del primer guion)
              const partes = texto.split('-');
              
              semanas.push({
                fecha: partes[0] ? partes[0].trim() : "Consultar",
                hora: horaMatch ? horaMatch[0] : (partes[1] ? partes[1].trim() : "Ver detalle"),
                zoomLink: zoomId ? `https://zoom.us/j/${zoomId}` : null,
                zoomId: zoomId
              });
            } else {
              semanas.push({ fecha: "Sin sesión", hora: "-", zoomId: null });
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

  if (state.loading) return <div style={{textAlign:'center', padding:'100px', color:'#004A87'}}><b>Sincronizando con Unimagdalena...</b></div>;

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <style>{`
        #root { width: 100% !important; max-width: 100% !important; margin: 0 !important; display: block !important; }
        .header { background: #004A87; color: white; padding: 20px; border-bottom: 4px solid #D4AF37; }
        .container { max-width: 1200px; margin: 30px auto; padding: 0 20px; display: grid; grid-template-columns: 320px 1fr; gap: 30px; }
        @media (max-width: 900px) { .container { grid-template-columns: 1fr; } }
        .sidebar { background: white; border-radius: 15px; padding: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); height: fit-content; }
        .course-btn { width: 100%; text-align: left; background: #fff; border: 1px solid #eee; padding: 15px; border-radius: 10px; margin-bottom: 10px; cursor: pointer; }
        .course-btn.active { border-color: #D4AF37; background: #fffdf5; font-weight: bold; }
        .main-card { background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); background: #fafafa; border-bottom: 1px solid #eee; }
        .stat { padding: 15px; text-align: center; border-right: 1px solid #eee; }
        .stat label { display: block; font-size: 0.6rem; color: #94a3b8; font-weight: bold; }
        .stat span { font-size: 1.1rem; color: #004A87; font-weight: 900; }
        .weeks { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; padding: 25px; }
        .week-card { border: 1px solid #f1f5f9; padding: 15px; border-radius: 12px; background: #fdfdfd; }
        .zoom-link { display: block; margin-top: 10px; background: #2D8CFF; color: white; text-align: center; padding: 8px; border-radius: 6px; text-decoration: none; font-size: 0.7rem; font-weight: bold; }
      `}</style>

      <header className="header">
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div onClick={() => setSelectedId(null)} style={{cursor:'pointer'}}>
            <h1 style={{margin:0, fontSize:'1.4rem'}}>PORTAL DOCENTE CREO</h1>
            <p style={{margin:0, color:'#D4AF37', fontSize:'0.7rem', fontWeight:'bold'}}>UNIVERSIDAD DEL MAGDALENA</p>
          </div>
          <form onSubmit={handleSearch} style={{ display: 'flex', background: 'white', borderRadius: '8px', padding: '4px' }}>
            <input type="text" placeholder="Cédula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ border:'none', padding:'8px', outline:'none', width:'180px'}} />
            <button type="submit" style={{ background:'#004A87', color:'white', border:'none', padding:'8px 15px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>BUSCAR</button>
          </form>
        </div>
      </header>

      <main className="container">
        {!docente ? (
          <div style={{gridColumn:'1/-1', textAlign:'center', padding:'100px'}}>
            <h2 style={{color:'#004A87'}}>Bienvenido al Portal</h2>
            <p>Ingrese su identificación para ver los horarios corregidos (v1.9).</p>
          </div>
        ) : (
          <>
            <aside className="sidebar">
              <h3 style={{margin:'0 0 5px 0', color:'#004A87'}}>{docente.nombre}</h3>
              <p style={{fontSize:'0.7rem', color:'#D4AF37', fontWeight:'bold', marginBottom:'20px'}}>DOCENTE ASIGNADO</p>
              {docente.cursos.map((c, i) => (
                <button key={i} onClick={() => setSelectedCursoIdx(i)} className={`course-btn ${selectedCursoIdx === i ? 'active' : ''}`}>
                  <div style={{fontSize:'0.85rem', color:'#004A87'}}>{c.materia}</div>
                  <div style={{fontSize:'0.7rem', color:'#94a3b8'}}>Grupo {c.grupo}</div>
                </button>
              ))}
            </aside>

            <section className="main-card">
              <div style={{ background: '#004A87', color: 'white', padding: '25px' }}>
                <h2 style={{margin:0, fontSize:'1.3rem'}}>{cursoActivo.materia}</h2>
                <span style={{fontSize:'0.75rem', color:'#D4AF37', fontWeight:'bold'}}>DASHBOARD ACADÉMICO</span>
              </div>
              <div className="stats">
                <div className="stat"><label>GRUPO</label><span>{cursoActivo.grupo}</span></div>
                <div className="stat"><label>CUPOS</label><span>{cursoActivo.cupos}</span></div>
                <div className="stat"><label>CRÉDITOS</label><span>{cursoActivo.creditos}</span></div>
              </div>
              <div className="weeks">
                {cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} className="week-card">
                    <div style={{fontSize:'0.65rem', fontWeight:'bold', color:'#D4AF37', marginBottom:'8px'}}>SEMANA {idx + 1}</div>
                    <div style={{fontSize:'0.8rem', fontWeight:'bold', marginBottom:'4px'}}>📅 {s.fecha}</div>
                    <div style={{fontSize:'0.75rem', color:'#64748b'}}>⏰ {s.hora}</div>
                    {s.zoomId && (
                      <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-link">ENTRAR A ZOOM (ID: {s.zoomId})</a>
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