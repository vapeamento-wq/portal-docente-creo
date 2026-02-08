import React, { useState, useEffect } from 'react';

// URL de tu CSV que me proporcionaste
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
        const filas = csvText.split('\n').slice(1); // Ignorar la primera fila (títulos)
        const diccionario = {};

        filas.forEach(fila => {
          // Separar por comas (considerando comillas si las hay)
          const c = fila.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
          
          // IMPORTANTE: Ajusta estos números (0, 1, 2...) según el orden de tus columnas en Excel
          const id = c[0]?.replace(/"/g, '').trim();      // Columna A: Cédula
          const nombre = c[1]?.replace(/"/g, '').trim();  // Columna B: Nombre Docente
          const materia = c[2]?.replace(/"/g, '').trim(); // Columna C: Materia
          const grupo = c[3]?.replace(/"/g, '').trim();   // Columna D: Grupo
          const linkZoom = c[4]?.replace(/"/g, '').trim(); // Columna E: Enlace Zoom

          if (id) {
            if (!diccionario[id]) {
              diccionario[id] = { nombre, clases: [] };
            }
            diccionario[id].clases.push({ materia, grupo, linkZoom });
          }
        });

        setDatosDocentes(diccionario);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando CSV:", err);
        setLoading(false);
      });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const idBusqueda = searchTerm.trim();
    if (datosDocentes[idBusqueda]) {
      setDocenteEncontrado(datosDocentes[idBusqueda]);
    } else {
      alert("No se encontró ningún docente con la identificación: " + idBusqueda);
      setDocenteEncontrado(null);
    }
  };

  if (loading) return <div style={{textAlign: 'center', marginTop: '50px'}}>Cargando base de datos de la Unimagdalena...</div>;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '20px' }}>
      <header style={{ backgroundColor: '#004A87', color: 'white', padding: '20px', borderRadius: '15px', textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>PORTAL DOCENTE CREO</h1>
        <p style={{ color: '#D4AF37', margin: '5px 0 0', fontWeight: 'bold' }}>Universidad del Magdalena</p>
      </header>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
          <input 
            type="text" 
            placeholder="Ingrese su número de cédula..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: '15px', borderRadius: '10px', border: '2px solid #004A87', fontSize: '16px' }}
          />
          <button type="submit" style={{ backgroundColor: '#004A87', color: 'white', border: 'none', padding: '0 25px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
            BUSCAR
          </button>
        </form>

        {docenteEncontrado && (
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#004A87', borderBottom: '2px solid #D4AF37', paddingBottom: '10px' }}>
              Docente: {docenteEncontrado.nombre}
            </h2>
            <h3 style={{ fontSize: '14px', color: '#666', marginTop: '20px' }}>ASIGNATURAS Y GRUPOS:</h3>
            
            {docenteEncontrado.clases.map((clase, index) => (
              <div key={index} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '10px', marginTop: '10px', backgroundColor: '#fafafa' }}>
                <p style={{ margin: 0 }}><strong>Materia:</strong> {clase.materia}</p>
                <p style={{ margin: '5px 0' }}><strong>Grupo:</strong> {clase.grupo}</p>
                {clase.linkZoom && (
                  <a href={clase.linkZoom} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '10px', color: 'white', backgroundColor: '#2D8CFF', padding: '8px 15px', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>
                    SALA ZOOM 🎥
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;