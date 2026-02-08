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

          const semanas = [];
          for (let i = 55; i <= 61; i++) { // Columnas BD hasta la BJ
            const contenidoCelda = c[i]?.replace(/"/g, '').trim() || "CELDA VACÍA EN EXCEL";
            semanas.push(contenidoCelda);
          }

          if (id && !isNaN(id)) {
            if (!diccionario[id]) diccionario[id] = { nombre, cursos: [] };
            diccionario[id].cursos.push({ materia, semanas });
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
    } else { alert("ID " + idLimpio + " no encontrado en el sistema."); }
  };

  if (state.loading) return <div style={{padding:'100px', textAlign:'center'}}>Iniciando Scanner v2.1...</div>;

  return (
    <div style={{ background: '#1a1a1a', minHeight: '100vh', color: 'white', fontFamily: 'monospace', padding: '20px' }}>
      <div style={{ background: '#D4AF37', color: 'black', padding: '10px', marginBottom: '20px', fontWeight: 'bold', textAlign: 'center' }}>
        MODO DEBUG: SCANNER DE CELDAS RAW (v2.1)
      </div>

      <form onSubmit={handleSearch} style={{ marginBottom: '30px', textAlign: 'center' }}>
        <input 
          type="text" placeholder="Cédula para escanear..." value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '10px', width: '250px', border: 'none', borderRadius: '5px 0 0 5px' }}
        />
        <button type="submit" style={{ padding: '10px 20px', background: '#004A87', color: 'white', border: 'none', borderRadius: '0 5px 5px 0', cursor: 'pointer' }}>
          ESCANEAR
        </button>
      </form>

      {docente && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ borderBottom: '1px solid #D4AF37' }}>DOCENTE: {docente.nombre}</h2>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
            {docente.cursos.map((c, i) => (
              <button key={i} onClick={() => setSelectedCursoIdx(i)} style={{
                padding: '10px', background: selectedCursoIdx === i ? '#D4AF37' : '#333', color: selectedCursoIdx === i ? 'black' : 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', whiteSpace: 'nowrap'
              }}>
                {c.materia}
              </button>
            ))}
          </div>

          <div style={{ background: '#222', padding: '20px', borderRadius: '10px', border: '1px solid #444' }}>
            <h3>CONTENIDO CRUDO DE LAS SEMANAS (BD a BJ):</h3>
            {cursoActivo.semanas.map((txt, idx) => (
              <div key={idx} style={{ marginBottom: '15px', padding: '10px', background: '#111', borderLeft: '4px solid #D4AF37', wordBreak: 'break-all', fontSize: '12px' }}>
                <b style={{ color: '#D4AF37' }}>COLUMNA {55 + idx} (Semana {idx + 1}):</b><br/>
                {txt}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ position: 'fixed', bottom: 10, right: 10, fontSize: '12px', color: '#666' }}>
        Verificación de Lectura de Excel v2.1
      </div>
    </div>
  );
};

export default App;