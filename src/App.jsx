import React, { useState, useEffect } from 'react';

const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSx9XNRqhtDX7dlkfBTeMWPoZPwG3LW0rn3JT_XssQUu0vz1llFjNlx1lKr6krkJt-lbVryTzn8Dpyn/pub?gid=1271152041&single=true&output=csv";

const App = () => {
  const [datosDocentes, setDatosDocentes] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [docenteEncontrado, setDocenteEncontrado] = useState(null);

  useEffect(() => {
    fetch(URL_CSV)
      .then(res => res.text())
      .then(csvText => {
        const filas = csvText.split(/\r?\n/);
        const diccionario = {};

        filas.forEach((fila, index) => {
          // Usamos una expresión regular para separar por comas respetando las comillas
          const c = fila.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          
          if (c.length < 10) return; // Saltar filas vacías

          const id = c[2]?.replace(/"/g, '').trim();      // Columna C: ID
          const nombre = c[0]?.replace(/"/g, '').trim();  // Columna A: Nombre
          const materia = c[9]?.replace(/"/g, '').trim(); // Columna J: Materia
          const grupo = c[11]?.replace(/"/g, '').trim();  // Columna L: Grupo

          // Extraer las 8 semanas (Columnas 55 a 62)
          const semanas = [];
          for (let i = 55; i <= 62; i++) {
            if (c[i]) {
              const textoSemana = c[i].replace(/"/g, '').trim();
              // Buscar link de zoom dentro del texto
              const zoomMatch = textoSemana.match(/https?:\/\/[^\s]+/);
              semanas.push({
                descripcion: textoSemana,
                zoom: zoomMatch ? zoomMatch[0].replace(/;$/, '') : null
              });
            }
          }

          if (id && !isNaN(id)) {
            if (!diccionario[id]) {
              diccionario[id] = { nombre, cursos: [] };
            }
            diccionario[id].cursos.push({ materia, grupo, semanas });
          }
        });

        setDatosDocentes(diccionario);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error:", err);
        setLoading(false);
      });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const idLimpio = searchTerm.replace(/\D/g, '');
    if (datosDocentes[idLimpio]) {
      setDocenteEncontrado(datosDocentes[idLimpio]);
    } else {
      alert("Docente no encontrado. Verifique la cédula.");
    }
  };

  if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Cargando Portal Unimagdalena...</div>;

  return (
    <div style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '20px' }}>
      <header style={{ backgroundColor: '#004A87', color: 'white', padding: '30px', borderRadius: '20px', textAlign: 'center', marginBottom: '40px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '28px' }}>PORTAL DOCENTE CREO</h1>
        <p style={{ color: '#D4AF37', fontWeight: 'bold', marginTop: '10px' }}>Administración de la Seguridad y Salud en el Trabajo</p>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px', marginBottom: '40px' }}>
          <input 
            type="text" 
            placeholder="Cédula del docente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: '18px', borderRadius: '12px', border: '2px solid #004A87', fontSize: '18px' }}
          />
          <button type="submit" style={{ backgroundColor: '#004A87', color: 'white', border: 'none', padding: '0 35px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
            CONSULTAR
          </button>
        </form>

        {docenteEncontrado && (
          <div style={{ animation: 'fadeIn 0.6s' }}>
            <h2 style={{ color: '#004A87', borderBottom: '4px solid #D4AF37', paddingBottom: '10px' }}>
              Docente: {docenteEncontrado.nombre}
            </h2>
            
            {docenteEncontrado.cursos.map((curso, idx) => (
              <div key={idx} style={{ backgroundColor: 'white', borderRadius: '20px', padding: '25px', marginBottom: '30px', boxShadow: '0 6px 18px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, color: '#004A87' }}>{curso.materia}</h3>
                  <span style={{ backgroundColor: '#EBF5FF', color: '#004A87', padding: '5px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>GRUPO: {curso.grupo}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  {curso.semanas.map((sem, sIdx) => (
                    <div key={sIdx} style={{ border: '1px solid #f0f0f0', padding: '15px', borderRadius: '12px', backgroundColor: '#fafafa' }}>
                      <p style={{ fontWeight: 'bold', color: '#D4AF37', margin: '0 0 10px 0', fontSize: '12px' }}>SEMANA {sIdx + 1}</p>
                      <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.4', marginBottom: '10px' }}>{sem.descripcion}</p>
                      {sem.zoom && (
                        <a href={sem.zoom} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', backgroundColor: '#2D8CFF', color: 'white', padding: '8px', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' }}>
                          ACCESO ZOOM 🎥
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;