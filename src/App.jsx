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
          // FILTRO: Ignorar materias pendientes
          if (!materia || materia.toUpperCase().includes("PENDIENTE")) return;

          const nombre = c[0]?.replace(/"/g, '').trim();   
          const id = c[1]?.replace(/"/g, '').trim();       
          const grupo = c[5]?.replace(/"/g, '').trim();    
          const creditos = c[7]?.replace(/"/g, '').trim(); 
          const fInicio = c[12]?.replace(/"/g, '').trim(); 

          const semanas = [];
          for (let i = 14; i <= 29; i++) { 
            const texto = c[i]?.replace(/"/g, '').trim() || "";
            const esValido = texto && texto !== "-" && texto !== "0" && !texto.toLowerCase().includes("pendiente");
            
            if (esValido) {
              const zoomMatch = texto.match(/ID\s*[-]?\s*(\d+)/i) || texto.match(/(\d{9,11})/);
              const zoomId = zoomMatch ? zoomMatch[1] : null;
              const horaMatch = texto.match(/(\d{1,2}\s*A\s*\d{1,2})/i);
              const partes = texto.split('-');
              
              semanas.push({
                num: i - 13,
                fecha: partes[0] ? partes[0].trim() : "Confirmada",
                hora: horaMatch ? horaMatch[0] : (partes[1] ? partes[1].trim() : ""),
                zoomLink: zoomId ? `https://zoom.us/j/${zoomId}` : null,
                zoomId: zoomId
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
    } else { alert("Identificación no encontrada o sin programación vigente."); }
  };

  if (state.loading) return <div style={{textAlign:'center', padding:'100px', color:'#004A87', fontWeight:'bold'}}>Generando vista v2.4 con IDs de Zoom...</div>;

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ background: '#004A87', color: 'white', padding: '15px 20px', borderBottom: '4px solid #D4AF37' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div onClick={() => setSelectedId(null)} style={{cursor:'pointer'}}>
            <h1 style={{margin:0, fontSize:'1.2rem'}}>PORTAL DOCENTE CREO</h1>
            <p style={{margin:0, color:'#D4AF37', fontSize:'0.7rem', fontWeight:'bold'}}>MODALIDAD DISTANCIA</p>
          </div>
          <form onSubmit={handleSearch} style={{ display: 'flex', background: 'white', borderRadius: '8px', padding: '2px' }}>
            <input type="text" placeholder="Buscar cédula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ border:'none', padding:'8px', outline:'none', width:'160px'}} />
            <button type="submit" style={{ background:'#004A87', color:'white', border:'none', padding:'8px 12px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>BUSCAR</button>
          </form>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: docente ? '320px 1fr' : '1fr', gap: '25px' }}>
        {!docente ? (
          <div style={{textAlign:'center', padding:'80px', color:'#94a3b8'}}>
            <div style={{fontSize:'4rem', marginBottom:'20px'}}>👨‍💻</div>
            <h2>Bienvenido, Alberto</h2>
            <p>Consulta tus horarios de 16 semanas con identificación de sala virtual.</p>
          </div>
        ) : (
          <>
            <aside style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', height: 'fit-content' }}>
              <div style={{borderBottom:'1px solid #f1f5f9', paddingBottom:'15px', marginBottom:'20px'}}>
                <h3 style={{margin:'0', color:'#004A87', fontSize:'1rem'}}>{docente.nombre}</h3>
                <p style={{fontSize:'0.65rem', color:'#94a3b8', margin:'5px 0 0'}}>CC: {docente.idReal}</p>
              </div>
              <p style={{fontSize:'0.6rem', color:'#D4AF37', fontWeight:'900', marginBottom:'15px', letterSpacing:'1px'}}>MIS ASIGNATURAS</p>
              {docente.cursos.map((c, i) => (
                <button key={i} onClick={() => setSelectedCursoIdx(i)} style={{ width: '100%', textAlign: 'left', background: selectedCursoIdx === i ? '#fffdf5' : '#fff', border: selectedCursoIdx === i ? '2px solid #D4AF37' : '1px solid #eee', padding: '12px', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer', transition:'0.2s' }}>
                  <b style={{fontSize:'0.75rem', color:'#004A87', display:'block'}}>{c.materia}</b>
                  <small style={{fontSize:'0.65rem', color:'#94a3b8'}}>Grupo {c.grupo}</small>
                </button>
              ))}
            </aside>

            <section style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              <div style={{ background: '#004A87', color: 'white', padding: '25px' }}>
                <h2 style={{margin:0, fontSize:'1.15rem', textTransform:'uppercase'}}>{cursoActivo.materia}</h2>
                <div style={{display:'flex', gap:'15px', marginTop:'10px'}}>
                  <span style={{fontSize:'0.65rem', background:'rgba(255,255,255,0.1)', padding:'3px 8px', borderRadius:'4px'}}>Grupo: {cursoActivo.grupo}</span>
                  <span style={{fontSize:'0.65rem', background:'rgba(255,255,255,0.1)', padding:'3px 8px', borderRadius:'4px'}}>Créditos: {cursoActivo.creditos}</span>
                </div>
              </div>
              
              <div style={{ padding: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} style={{ border: '1px solid #f1f5f9', padding: '18px', borderRadius: '14px', background: '#fdfdfd', boxShadow:'0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{fontSize:'0.6rem', fontWeight:'900', color:'#D4AF37', marginBottom:'10px', borderBottom:'1px solid #f1f5f9', paddingBottom:'5px'}}>SEMANA {s.num}</div>
                    <div style={{fontSize:'0.85rem', fontWeight:'bold', marginBottom:'5px', color:'#1e293b'}}>📅 {s.fecha}</div>
                    <div style={{fontSize:'0.8rem', color:'#64748b', marginBottom:'12px'}}>⏰ {s.hora}</div>
                    
                    {s.zoomId ? (
                      <div style={{marginTop:'15px', borderTop:'1px dashed #e2e8f0', paddingTop:'12px'}}>
                        <div style={{fontSize:'0.7rem', color:'#004A87', fontWeight:'bold', marginBottom:'8px'}}>ID ZOOM: {s.zoomId}</div>
                        <a href={s.zoomLink} target="_blank" rel="noreferrer" style={{ display: 'block', background: '#2D8CFF', color: 'white', textAlign: 'center', padding: '10px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 'bold' }}>ENTRAR A CLASE 🎥</a>
                      </div>
                    ) : (
                      <div style={{fontSize:'0.65rem', color:'#cbd5e1', fontStyle:'italic', marginTop:'10px'}}>Sin sala virtual</div>
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