import React, { useState, useEffect, useMemo } from 'react';

// Esta línea ahora busca la variable con todos los nombres posibles
const URL_CSV = 
  process.env.REACT_APP_SHEET_URL || 
  process.env.VITE_SHEET_URL || 
  import.meta.env?.VITE_SHEET_URL ||
  process.env.SHEET_URL;

const App = () => {
  const [state, setState] = useState({ loading: true, teachers: {}, error: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCursoIdx, setSelectedCursoIdx] = useState(0);

  useEffect(() => {
    // Si después de buscar en todo lado sigue vacío, mostramos el error
    if (!URL_CSV) {
      setState(s => ({ ...s, loading: false, error: "Variable de entorno no detectada. Verifica el nombre en Vercel." }));
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
          const fInicio = c[12]?.replace(/"/g, '').trim(); 

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
              diccionario[idLimpio].cursos.push({ materia, grupo, creditos, fInicio, semanas });
            }
          }
        });
        setState({ loading: false, teachers: diccionario, error: null });
      })
      .catch(err => setState(s => ({ ...s, loading: false, error: "Error de conexión con el Excel." })));
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

  if (state.loading) return <div style={{textAlign:'center', padding:'100px', fontWeight:'bold', color:'#004A87'}}>🔒 Verificando Bóveda de Seguridad...</div>;
  if (state.error) return <div style={{textAlign:'center', padding:'50px', color:'red'}}>⚠️ {state.error}</div>;

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ background: '#004A87', color: 'white', padding: '15px', borderBottom: '4px solid #D4AF37' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{margin:0, fontSize:'1.2rem'}}>PORTAL DOCENTE</h1>
            <p style={{margin:0, color:'#D4AF37', fontSize:'0.7rem', fontWeight:'bold'}}>UNIMAGDALENA • SEGURO</p>
          </div>
          <form onSubmit={handleSearch} style={{ display: 'flex', background: 'white', borderRadius: '8px', padding: '2px' }}>
            <input type="text" placeholder="Cédula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ border:'none', padding:'8px', outline:'none', width:'150px'}} />
            <button type="submit" style={{ background:'#004A87', color:'white', border:'none', padding:'8px 15px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>BUSCAR</button>
          </form>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 15px' }}>
        {!docente ? (
          <div style={{textAlign:'center', padding:'100px', color:'#94a3b8'}}>
            <h2>Bienvenido</h2>
            <p>La base de datos ahora está oculta y segura.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {cursoActivo.semanas.map((s, idx) => (
              <div key={idx} style={{ background:'white', padding:'20px', borderRadius:'15px', boxShadow:'0 4px 6px rgba(0,0,0,0.05)' }}>
                <div style={{fontSize:'0.6rem', color:'#D4AF37', fontWeight:'bold'}}>SEMANA {s.num}</div>
                <div style={{fontSize:'0.9rem', fontWeight:'bold', margin:'5px 0'}}>📅 {s.fecha}</div>
                <div style={{fontSize:'0.8rem', color:'#64748b'}}>⏰ {s.hora}</div>
                {s.zoomId && (
                  <div style={{marginTop:'15px', background:'#f8fafc', padding:'10px', borderRadius:'10px'}}>
                    <div style={{fontSize:'0.7rem', color:'#004A87', fontWeight:'bold'}}>ID: {s.zoomId}</div>
                    <a href={s.zoomLink} target="_blank" rel="noreferrer" style={{ display:'block', background:'#2D8CFF', color:'white', textAlign:'center', padding:'8px', borderRadius:'6px', textDecoration:'none', marginTop:'5px', fontSize:'0.8rem', fontWeight:'bold' }}>ENTRAR A ZOOM</a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      
      <a href="https://wa.me/573000000000" style={{ position:'fixed', bottom:'20px', right:'20px', background:'#25D366', color:'white', padding:'15px', borderRadius:'50px', textDecoration:'none', fontWeight:'bold', boxShadow:'0 4px 10px rgba(0,0,0,0.2)' }}>
        💬 Soporte
      </a>
    </div>
  );
};

export default App;