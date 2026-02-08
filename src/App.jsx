import React, { useState, useEffect, useMemo } from 'react';

// --- CONFIGURACIÓN DE SEGURIDAD ---
// Busca la variable de entorno en todas las ubicaciones posibles
const URL_CSV = 
  import.meta.env?.VITE_SHEET_URL || 
  process.env?.VITE_SHEET_URL || 
  process.env?.REACT_APP_SHEET_URL || 
  ""; 

// --- CONFIGURACIÓN DE CONTACTO ---
// ¡IMPORTANTE! Cambia este número por el de la línea de atención real
const WHATSAPP_NUMBER = "573001234567"; 

const App = () => {
  const [state, setState] = useState({ loading: true, teachers: {}, error: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCursoIdx, setSelectedCursoIdx] = useState(0);

  useEffect(() => {
    if (!URL_CSV) {
      setState(s => ({ ...s, loading: false, error: "Error de Sistema: Variable de entorno no configurada. Contacte al administrador." }));
      return;
    }

    fetch(URL_CSV)
      .then(res => res.text())
      .then(csvText => {
        const filas = csvText.split(/\r?\n/);
        const diccionario = {};
        
        filas.forEach((fila) => {
          // Lógica de parseo robusta para CSV complejo
          const c = fila.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          if (c.length < 25) return;
          
          const materia = c[3]?.replace(/"/g, '').trim();
          // Filtro de calidad: Ignorar pendientes
          if (!materia || materia.toUpperCase().includes("PENDIENTE")) return;

          const nombre = c[0]?.replace(/"/g, '').trim();   
          const id = c[1]?.replace(/"/g, '').trim();       
          const grupo = c[5]?.replace(/"/g, '').trim();    
          const creditos = c[7]?.replace(/"/g, '').trim(); 
          const fInicio = c[12]?.replace(/"/g, '').trim(); 

          const semanas = [];
          for (let i = 14; i <= 29; i++) { 
            const texto = c[i]?.replace(/"/g, '').trim() || "";
            // Filtro estricto de contenido válido
            if (texto && texto !== "-" && texto !== "0" && !texto.toLowerCase().includes("pendiente")) {
              const zoomId = texto.match(/\d{9,11}/)?.[0];
              const horaMatch = texto.match(/(\d{1,2}\s*A\s*\d{1,2})/i);
              const partes = texto.split('-');
              
              semanas.push({
                num: i - 13,
                fecha: partes[0] ? partes[0].trim() : "Sesión Programada",
                hora: horaMatch ? horaMatch[0] : (partes[1] ? partes[1].trim() : "Horario por definir"),
                zoomId: zoomId,
                zoomLink: zoomId ? `https://zoom.us/j/${zoomId}` : null
              });
            }
          }

          if (id && !isNaN(id)) {
            const idLimpio = id.split('.')[0]; 
            if (!diccionario[idLimpio]) diccionario[idLimpio] = { nombre, idReal: idLimpio, cursos: [] };
            // Solo agregar cursos con contenido real
            if (semanas.length > 0) {
              diccionario[idLimpio].cursos.push({ materia, grupo, creditos, fInicio, semanas });
            }
          }
        });
        setState({ loading: false, teachers: diccionario, error: null });
      })
      .catch(err => setState(s => ({ ...s, loading: false, error: "Error de conexión con el servidor académico." })));
  }, []);

  const docente = useMemo(() => selectedId ? state.teachers[selectedId] : null, [selectedId, state.teachers]);
  const cursoActivo = docente ? docente.cursos[selectedCursoIdx] : null;

  const handleSearch = (e) => {
    e.preventDefault();
    const idBusqueda = searchTerm.replace(/\D/g, '');
    if (state.teachers[idBusqueda]) {
      setSelectedId(idBusqueda);
      setSelectedCursoIdx(0);
    } else { alert("La identificación ingresada no tiene asignación académica vigente."); }
  };

  if (state.loading) return <div className="loading-screen">
    <div className="spinner"></div>
    <p>Accediendo al Sistema Académico...</p>
  </div>;

  if (state.error) return <div className="error-screen">
    <h3>⚠️ Aviso del Sistema</h3>
    <p>{state.error}</p>
  </div>;

  return (
    <div className="portal-university">
      <style>{`
        :root {
          --primary-color: #003366; /* Azul Institucional Oscuro */
          --secondary-color: #B4975A; /* Dorado Académico */
          --bg-color: #f4f7f6;
          --text-color: #333;
          --white: #ffffff;
        }
        
        #root { width: 100% !important; max-width: 100% !important; margin: 0 !important; }
        body { margin: 0; background-color: var(--bg-color); }
        .portal-university { min-height: 100vh; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; color: var(--text-color); }

        /* HEADER INSTITUCIONAL */
        .header { background: var(--primary-color); color: var(--white); padding: 1rem 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 1000; }
        .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
        
        .branding { display: flex; flex-direction: column; cursor: pointer; }
        .branding h1 { margin: 0; font-size: 1.5rem; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
        .branding h2 { margin: 0; font-size: 0.75rem; color: var(--secondary-color); font-weight: 600; letter-spacing: 1px; margin-top: 4px; }
        
        .search-bar { background: rgba(255,255,255,0.1); padding: 5px; border-radius: 6px; display: flex; border: 1px solid rgba(255,255,255,0.2); }
        .search-bar input { background: transparent; border: none; color: white; padding: 8px 12px; outline: none; font-size: 0.9rem; width: 200px; }
        .search-bar input::placeholder { color: rgba(255,255,255,0.7); }
        .search-bar button { background: var(--secondary-color); color: var(--primary-color); border: none; padding: 8px 20px; border-radius: 4px; font-weight: bold; cursor: pointer; transition: background 0.2s; }
        .search-bar button:hover { background: #fff; }

        /* LAYOUT PRINCIPAL */
        .main-container { max-width: 1200px; margin: 30px auto; padding: 0 20px; display: flex; flex-direction: column; gap: 30px; }
        
        /* SIDEBAR / MENU CURSOS */
        .sidebar { background: var(--white); border-radius: 8px; padding: 25px; box-shadow: 0 2px 15px rgba(0,0,0,0.05); }
        .prof-info { border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
        .prof-name { font-size: 1.2rem; color: var(--primary-color); font-weight: 700; margin: 0; }
        .prof-id { font-size: 0.85rem; color: #666; display: block; margin-top: 5px; }

        .courses-nav { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; }
        .course-btn { 
          min-width: 220px; text-align: left; background: #fff; border: 1px solid #e0e0e0; 
          padding: 15px; border-radius: 6px; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden;
        }
        .course-btn:hover { border-color: var(--secondary-color); }
        .course-btn.active { background: #fdfcf5; border-color: var(--secondary-color); border-left: 5px solid var(--secondary-color); box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .course-btn b { display: block; color: var(--primary-color); font-size: 0.9rem; margin-bottom: 4px; }
        .course-btn span { font-size: 0.75rem; color: #777; }

        /* PANEL CENTRAL */
        .dashboard { background: var(--white); border-radius: 8px; overflow: hidden; box-shadow: 0 2px 15px rgba(0,0,0,0.05); flex: 1; }
        .dash-title { background: var(--primary-color); color: white; padding: 25px 30px; }
        .dash-title h3 { margin: 0; font-size: 1.4rem; font-weight: 600; }
        
        .metrics { display: grid; grid-template-columns: repeat(3, 1fr); background: #f9f9f9; border-bottom: 1px solid #eee; }
        .metric-box { padding: 20px; text-align: center; border-right: 1px solid #eee; }
        .metric-box:last-child { border-right: none; }
        .metric-label { font-size: 0.7rem; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 5px; }
        .metric-value { font-size: 1.2rem; color: var(--primary-color); font-weight: 700; }

        .schedule-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; padding: 30px; }
        .week-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; background: #fff; transition: transform 0.2s; position: relative; }
        .week-card:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.05); border-color: var(--secondary-color); }
        
        .week-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .week-label { font-size: 0.75rem; color: var(--secondary-color); font-weight: 800; text-transform: uppercase; }
        
        .date-info { margin-bottom: 15px; }
        .date-row { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; font-size: 0.9rem; color: #444; }
        .icon { width: 16px; text-align: center; }

        .action-area { background: #f8fafc; padding: 15px; border-radius: 6