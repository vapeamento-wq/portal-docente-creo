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
            const esValido = texto && texto !== "-" && texto !== "0" && !texto.toLowerCase().includes("pendiente");
            
            if (esValido) {
              // ESCÁNER PRO: Busca cualquier número de 10 dígitos (Formato de tus salas Zoom)
              const zoomId = texto.match(/\d{10}/)?.[0] || texto.match(/\d{9}/)?.[0];
              const horaMatch = texto.match(/(\d{1,2}\s*A\s*\d{1,2})/i);
              const partes = texto.split('-');
              
              semanas.push({
                num: i - 13,
                fecha: partes[0] ? partes[0].trim() : "Programada",
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

  if (state.loading) return <div style={{textAlign:'center', padding:'100px', color:'#004A87', fontWeight:'bold'}}>Configurando Scanner de IDs v2.5...</div>;

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ background: '#004A87', color: 'white', padding: '15px 20px', borderBottom: '4px solid #D4AF37', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div onClick={() => setSelectedId(null)} style={{cursor:'pointer'}}>
            <h1 style={{margin:0, fontSize:'1.3rem', fontWeight:'900'}}>PORTAL DOCENTE CREO</h1>
            <p style={{margin:0, color:'#D4AF37', fontSize:'0.7rem', fontWeight:'bold', letterSpacing:'1px'}}>UNIVERSIDAD DEL MAGDALENA</p>
          </div>
          <form onSubmit={handleSearch} style={{ display: 'flex', background: 'white', borderRadius: '10px', padding: '4px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
            <input type="text" placeholder="Cédula docente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ border:'none', padding:'8px 12px', outline:'none', width:'180px', fontWeight:'600'}} />
            <button type="submit" style={{ background:'#004A87', color:'white', border:'none', padding:'8px 20px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>BUSCAR</button>
          </form>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: docente ? '320px 1fr' : '1fr', gap: '30px' }}>
        {!docente ? (
          <div style={{textAlign:'center', padding:'120px 20px', color:'#94a3b8', background:'white', borderRadius:'20px', boxShadow:'0 10px 25px rgba(0,0,0,0.05)' }}>
            <div style={{fontSize:'5rem', marginBottom:'20px'}}>🔍</div>
            <h2 style={{color:'#004A87', marginBottom:'10px'}}>Buscador de Horarios</h2>
            <p>Ingrese su identificación para consultar salas y programación de 16 semanas.</p>
          </div>
        ) : (
          <>
            <aside style={{ background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', height: 'fit-content' }}>
              <div style={{textAlign:'center', marginBottom:'25px', borderBottom:'2px solid #f1f5f9', paddingBottom:'20px'}}>
                <div style={{width:'60px', height:'60px', background:'#004A87', color:'white', borderRadius:'50%', display:'flex', alignItems:'center', justifyCenter:'center', margin:'0 auto 15px', fontSize:'1.5rem', fontWeight:'bold', display:'flex', justifyContent:'center'}}>{docente.nombre.charAt(0)}</div>
                <h3 style={{margin:'0', color:'#004A87', fontSize:'1.1rem'}}>{docente.nombre}</h3>
                <p style={{fontSize:'0.7rem', color:'#94a3b8', marginTop:'5px'}}>ID: {docente.idReal}</p>
              </div>
              <p style={{fontSize:'0.65rem', color:'#D4AF37', fontWeight:'900', marginBottom:'15px', letterSpacing:'1px', textAlign:'center'}}>CURSOS ASIGNADOS</p>
              {docente.cursos.map((c, i) => (
                <button key={i} onClick={() => setSelectedCursoIdx(i)} style={{ width: '100%', textAlign: 'left', background: selectedCursoIdx === i ? '#fffdf5' : '#fff', border: selectedCursoIdx === i ? '2px solid #D4AF37' : '1px solid #f1f5f9', padding: '15px', borderRadius: '15px', marginBottom: '10px', cursor: 'pointer', transition:'0.3s' }}>
                  <b style={{fontSize:'0.85rem', color:'#004A87', display:'block', marginBottom:'5px'}}>{c.materia}</b>
                  <small style={{fontSize:'0.7rem', color:'#94a3b8'}}>Grupo {c.grupo}</small>
                </button>
              ))}
            </aside>

            <section style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
              <div style={{ background: '#004A87', color: 'white', padding: '30px' }}>
                <h2 style={{margin:0, fontSize:'1.5rem', fontWeight:'900', textTransform:'uppercase'}}>{cursoActivo.materia}</h2>
                <div style={{display:'flex', gap:'15px', marginTop:'15px'}}>
                  <span style={{fontSize:'0.7rem', background:'rgba(255,255,255,0.15)', padding:'5px 12px', borderRadius:'20px', fontWeight:'bold'}}>GRUPO {cursoActivo.grupo}</span>
                  <span style={{fontSize:'0.7rem', background:'rgba(255,255,255,0.15)', padding:'5px 12px', borderRadius:'20px', fontWeight:'bold'}}>CRÉDITOS {cursoActivo.creditos}</span>
                </div>
              </div>
              
              <div style={{ padding: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                {cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} style={{ border: '2px solid #f1f5f9', padding: '20px', borderRadius: '18px', background: '#fff', transition: '0.3s' }}>
                    <div style={{fontSize:'0.65rem', fontWeight:'900', color:'#D4AF37', marginBottom:'12px', borderBottom:'1px solid #f1f5f9', paddingBottom:'8px'}}>SEMANA {s.num}</div>
                    <div style={{fontSize:'0.9rem', fontWeight:'bold', marginBottom:'8px', color:'#1e293b'}}>📅 {s.fecha}</div>
                    <div style={{fontSize:'0.8rem', color:'#64748b', marginBottom:'15px'}}>⏰ {s.hora}</div>
                    
                    {s.zoomId ? (
                      <div style={{marginTop:'20px', background:'#f8fafc', padding:'12px', borderRadius:'12px', border:'1px solid #e2e8f0'}}>
                        <div style={{fontSize:'0.7rem', color:'#004A87', fontWeight:'900', marginBottom:'8px', textAlign:'center'}}>SALA ID: {s.zoomId}</div>
                        <a href={s.zoomLink} target="_blank" rel="noreferrer" style={{ display: 'block', background: '#2D8CFF', color: 'white', textAlign: 'center', padding: '10px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold', boxShadow:'0 4px 10px rgba(45,140,255,0.3)' }}>ENTRAR A ZOOM 🎥</a>
                      </div>
                    ) : (
                      <div style={{fontSize:'0.7rem', color:'#94a3b8', fontStyle:'italic', textAlign:'center', marginTop:'20px'}}>Sin sala virtual</div>
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