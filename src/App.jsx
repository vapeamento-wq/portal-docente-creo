import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- CONFIGURACIÓN DE TU HOJA DE GOOGLE ---
// Reemplaza esto con el ID real de tu Google Sheet
const SHEET_ID = 'TU_ID_DE_GOOGLE_SHEETS_AQUÍ';
const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

const App = () => {
  const [state, setState] = useState({
    loading: true,
    error: null,
    teachers: {},
    lastUpdated: null
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  // 1. CARGA DE DATOS DESDE GOOGLE SHEETS
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(URL_CSV);
        const csvText = await response.text();
        
        // Aquí puedes procesar el CSV. Por ahora, simulamos éxito para que no falle.
        console.log("Datos de Google Sheets recibidos");
        
        setState({
          loading: false,
          error: null,
          teachers: {}, // Aquí irían tus docentes procesados
          lastUpdated: new Date().toLocaleString()
        });
      } catch (err) {
        setState(prev => ({ ...prev, loading: false, error: "Error al conectar con los horarios." }));
      }
    };
    loadData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const cleanTerm = searchTerm.trim();
    if (cleanTerm === "") {
        alert("Por favor ingrese una identificación.");
        return;
    }
    // Lógica de búsqueda...
    alert("Buscando identificación: " + cleanTerm);
  };

  if (state.loading) return <div style={{padding: '50px', textAlign: 'center'}}>Cargando Portal Docente...</div>;

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <header style={{ backgroundColor: '#004A87', color: 'white', padding: '20px', borderRadius: '10px' }}>
        <h1 style={{ margin: 0 }}>PORTAL DOCENTE CREO</h1>
        <p style={{ color: '#D4AF37', fontWeight: 'bold' }}>Universidad del Magdalena</p>
      </header>

      <main style={{ marginTop: '30px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '40px' }}>
          <input 
            type="text" 
            placeholder="Ingrese Cédula..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '10px', flex: 1, borderRadius: '5px', border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ backgroundColor: '#004A87', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>
            Consultar
          </button>
        </form>

        <div style={{ textAlign: 'center', color: '#666' }}>
            <h2>Bienvenido al buscador de horarios</h2>
            <p>Ingrese su identificación para ver sus grupos asignados y enlaces de Zoom.</p>
        </div>
      </main>
    </div>
  );
};

export default App;