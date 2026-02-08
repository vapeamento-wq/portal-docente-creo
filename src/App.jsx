import React, { useState, useEffect, useMemo } from 'react';

// Intentamos todas las combinaciones posibles de nombres
const URL_CSV = 
  import.meta.env?.VITE_SHEET_URL || 
  process.env?.VITE_SHEET_URL || 
  process.env?.REACT_APP_SHEET_URL || 
  ""; 

const App = () => {
  const [state, setState] = useState({ loading: true, teachers: {}, error: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCursoIdx, setSelectedCursoIdx] = useState(0);

  useEffect(() => {
    // Si la URL está vacía, intentamos un último recurso (revisar si está pegada directamente)
    if (!URL_CSV) {
      setState(s => ({ ...s, loading: false, error: "Conexión pendiente: Haz 'Redeploy' en Vercel para activar la base de datos." }));
      return;
    }

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
            if (texto && texto !== "-" && texto !== "0" && !texto.toLowerCase().includes("pendiente")) {
              const zoomId = texto.match(/\d{10}/)?.[0] || texto.match(/\d{9}/)?.[0];
              const horaMatch = texto.match(/(\d{1,2}\s*A\s*\d{1,2})/i);
              const partes = texto.split('-');
              
              semanas.push({
                num: i - 13,
                fecha: partes[0] ? partes[0].trim() : "Confirmada",
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
        setState({ loading: false, teachers: diccionario, error: null });
      })
      .catch(err => setState(s => ({ ...s, loading: false, error: "Error al conectar con los horarios." })));
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

  if (state.loading) return <div style={{textAlign:'center', padding:'100px', fontWeight:'bold', color:'#004A87'}}>🔒 PROTEGIENDO DATOS...</div>;
  if (state.error) return (
    <div style={{textAlign:'center', padding:'50px', color:'#475569'}}>
      <h2 style={{color:'#ef4444'}}>⚠️ Aviso de Configuración</h2>
      <p>{state.error}</p>
      <div style={{marginTop:'20px', fontSize:'0.8rem', background:'#f1f5f9', padding:'20px', borderRadius:'10px', display:'inline-block'}}>
        <b>Pasos para Alberto:</b><br/>
        1. Ve a <b>Vercel</b> -> Tab <b>Deployments</b><br/>
        2. Clic en los <b>(...)</b> del último despliegue.<br/>
        3. Selecciona <b>Redeploy</b>.<br/>
        4. ¡Listo! Al terminar ya cargará tu Excel.
      </div>
    </div>
  );

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ background: '#004A87', color: 'white', padding: '15px 20px', borderBottom: '4px solid #D4AF37' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{margin:0, fontSize:'1.2rem'}}>PORTAL DOCENTE</h1>
            <p style={{margin:0, color:'#D4AF37', fontSize:'0.7rem', fontWeight:'bold'}}>UNIMAGDALENA • SEGURO</p>
          </div>
          <form onSubmit={handleSearch} style={{ display: 'flex', background: 'white', borderRadius: '8px', padding: '2px' }}>
            <input type="text" placeholder="Cédula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ border:'none', padding:'8px', outline:'none', width:'150px'}} />
            <button type="submit" style={{ background:'#004A87', color:'white', border:'none', padding:'8px 12px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>BUSCAR</button>
          </form>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
        {!docente ? (
          <div style={{textAlign:'center', padding:'100px', color:'#94a3b8', background:'white', borderRadius:'20px', boxShadow:'0 4px 6px rgba(0,0,0,0.05)'}}>
            <div style={{fontSize:'3rem', marginBottom:'20px'}}>🛡️</div>
            <h2>Acceso Seguro</h2>
            <p>La base de datos está protegida por variables de entorno.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {cursoActivo.semanas.map((s, idx) => (
              <div key={idx} style={{ background:'white', padding:'20px', borderRadius:'15px', border:'1px solid #e2e8f0' }}>
                <div style={{fontSize:'0.6rem', color:'#D4AF37', fontWeight:'bold'}}>SEMANA {s.num}</div>
                <div style={{fontSize:'1rem', fontWeight:'bold', margin:'10px 0'}}>📅 {s.fecha}</div>
                <div style={{fontSize:'0.85rem', color:'#64748b'}}>⏰ {s.hora}</div>
                {s.zoomId && (
                  <div style={{marginTop:'15px', background:'#f1f5f9', padding:'12px', borderRadius:'10px'}}>
                    <div style={{fontSize:'0.75rem', color:'#004A87', fontWeight:'bold'}}>SALA ID: {s.zoomId}</div>
                    <a href={s.zoomLink} target="_blank" rel="noreferrer" style={{ display:'block', background:'#2D8CFF', color:'white', textAlign:'center', padding:'10px', borderRadius:'8px', textDecoration:'none', marginTop:'10px', fontSize:'0.8rem', fontWeight:'bold' }}>ENTRAR A ZOOM</a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;