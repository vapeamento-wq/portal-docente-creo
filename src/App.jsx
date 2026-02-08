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
          
          // --- NUEVO MAPEO ASIG-3 ---
          const nombre = c[0]?.replace(/"/g, '').trim();   // Columna A
          const id = c[1]?.replace(/"/g, '').trim();       // Columna B (Cédula)
          const materia = c[3]?.replace(/"/g, '').trim();  // Columna D
          const grupo = c[5]?.replace(/"/g, '').trim();    // Columna F
          const creditos = c[7]?.replace(/"/g, '').trim(); // Columna H
          const fInicio = c[12]?.replace(/"/g, '').trim(); // Columna M
          const fFin = c[13]?.replace(/"/g, '').trim();    // Columna N

          const semanas = [];
          // Leemos las 16 SEMANAS (Columnas 14 a 29 en el CSV / O a AD en Excel)
          for (let i = 14; i <= 29; i++) { 
            const texto = c[i]?.replace(/"/g, '').trim() || "";
            if (texto && texto !== "-" && texto !== "0" && texto !== "") {
              const zoomMatch = texto.match(/ID\s*[-]?\s*(\d+)/i) || texto.match(/(\d{9,11})/);
              const zoomId = zoomMatch ? zoomMatch[1] : null;
              const horaMatch = texto.match(/(\d{1,2}\s*A\s*\d{1,2})/i);
              const partes = texto.split('-');
              
              semanas.push({
                num: i - 13,
                fecha: partes[0] ? partes[0].trim() : "Ver detalle",
                hora: horaMatch ? horaMatch[0] : (partes[1] ? partes[1].trim() : ""),
                zoomLink: zoomId ? `https://zoom.us/j/${zoomId}` : null,
                zoomId: zoomId,
                original: texto
              });
            }
          }

          if (id && !isNaN(id)) {
            const idLimpio = id.split('.')[0]; // Quitar el .0 si viene de Excel
            if (!diccionario[idLimpio]) diccionario[idLimpio] = { nombre, cursos: [] };
            diccionario[idLimpio].cursos.push({ materia, grupo, creditos, fInicio, fFin, semanas });
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
    } else { alert("Cédula " + idBusqueda + " no encontrada."); }
  };

  if (state.loading) return <div style={{textAlign:'center', padding:'100px', color:'#004A87'}}><b>Sincronizando v2.2 (16 Semanas)...</b></div>;

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ background: '#004A87', color: 'white', padding: '20px', borderBottom: '4px solid #D4AF37' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div onClick={() => setSelectedId(null)} style={{cursor:'pointer'}}>
            <h1 style={{margin:0, fontSize:'1.2rem'}}>PORTAL DOCENTE CREO</h1>
            <p style={{margin:0, color:'#D4AF37', fontSize:'0.7rem', fontWeight:'bold'}}>UNIMAGDALENA</p>
          </div>
          <form onSubmit={handleSearch} style={{ display: 'flex', background: 'white', borderRadius: '8px', padding: '3px' }}>
            <input type="text" placeholder="Cédula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ border:'none', padding:'8px', outline:'none', width:'150px'}} />
            <button type="submit" style={{ background:'#004A87', color:'white', border:'none', padding:'8px 12px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>BUSCAR</button>
          </form>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: docente ? '300px 1fr' : '1fr', gap: '25px' }}>
        {!docente ? (
          <div style={{textAlign:'center', padding:'100px', color:'#94a3b8'}}>
            <div style={{fontSize:'4rem'}}>📊</div>
            <h2>Bienvenido al Portal</h2>
            <p>Ingresa tu identificación para ver tu programación de 16 semanas.</p>
          </div>
        ) : (
          <>
            <aside style={{ background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', height: 'fit-content' }}>
              <h3 style={{margin:'0 0 5px 0', color:'#004A87', fontSize:'1rem'}}>{docente.nombre}</h3>
              <p style={{fontSize:'0.65rem', color:'#D4AF37', fontWeight:'bold', marginBottom:'20px'}}>DOCENTE UNIMAGDALENA</p>
              {docente.cursos.map((c, i) => (
                <button key={i} onClick={() => setSelectedCursoIdx(i)} style={{ width: '100%', textAlign: 'left', background: selectedCursoIdx === i ? '#fffdf5' : '#fff', border: selectedCursoIdx === i ? '2px solid #D4AF37' : '1px solid #eee', padding: '12px', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer' }}>
                  <b style={{fontSize:'0.75rem', color:'#004A87', display:'block'}}>{c.materia}</b>
                  <small style={{fontSize:'0.65rem', color:'#94a3b8'}}>Grupo {c.grupo}</small>
                </button>
              ))}
            </aside>

            <section style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              <div style={{ background: '#004A87', color: 'white', padding: '20px' }}>
                <h2 style={{margin:0, fontSize:'1.1rem'}}>{cursoActivo.materia}</h2>
                <p style={{margin:'5px 0 0', fontSize:'0.7rem', color:'#D4AF37'}}>CRÉDITOS: {cursoActivo.creditos} | INICIO: {cursoActivo.fInicio}</p>
              </div>
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '15px' }}>
                {cursoActivo.semanas.length > 0 ? cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} style={{ border: '1px solid #f1f5f9', padding: '15px', borderRadius: '12px', background: '#f8fafc' }}>
                    <div style={{fontSize:'0.6rem', fontWeight:'bold', color:'#D4AF37', marginBottom:'5px'}}>SEMANA {s.num}</div>
                    <div style={{fontSize:'0.8rem', fontWeight:'bold', marginBottom:'3px'}}>📅 {s.fecha}</div>
                    <div style={{fontSize:'0.75rem', color:'#64748b', marginBottom:'10px'}}>⏰ {s.hora}</div>
                    {s.zoomId && (
                      <a href={s.zoomLink} target="_blank" rel="noreferrer" style={{ display: 'block', background: '#2D8CFF', color: 'white', textAlign: 'center', padding: '8px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.7rem', fontWeight: 'bold' }}>ENTRAR A ZOOM</a>
                    )}
                  </div>
                )) : (
                  <div style={{gridColumn:'1/-1', textAlign:'center', padding:'40px', color:'#94a3b8'}}>No hay sesiones programadas registradas.</div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default App;