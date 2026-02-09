import React, { useState, useEffect, useMemo } from 'react';

// --- CONFIGURACIÓN GENERAL ---

// 1. URL DE LA BASE DE DATOS DE DOCENTES (HORARIOS)
const URL_CSV = 
  import.meta.env?.VITE_SHEET_URL || 
  process.env?.REACT_APP_SHEET_URL || 
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSx9XNRqhtDX7dlkfBTeMWPoZPwG3LW0rn3JT_XssQUu0vz1llFjNlx1lKr6krkJt-lbVryTzn8Dpyn/pub?gid=1271152041&single=true&output=csv";

// 2. URL DEL SCRIPT (Conector con Drive)
const URL_SCRIPT_APPS = "https://script.google.com/macros/s/AKfycbxmvuy0L8BT-PzJnD98_gnyjw342BtcALKQDf1kEqhAW9G_IXWRM85kyVh786KmaMibxQ/exec";

// 3. TU HOJA DE CÁLCULO DE HISTORIAL
const URL_TU_EXCEL_LOGS = "https://docs.google.com/spreadsheets/d/17NLfm6gxCF__YCfXUUfz4Ely5nJqMAHk-DqDolPvdNY/edit?gid=0#gid=0";
// Versión para incrustar (Preview)
const URL_EMBED_LOGS = "https://docs.google.com/spreadsheets/d/17NLfm6gxCF__YCfXUUfz4Ely5nJqMAHk-DqDolPvdNY/preview?gid=0";

const WHATSAPP_NUMBER = "573106964025";
const ADMIN_PASS = "admincreo"; 

const App = () => {
  // --- ESTADOS ---
  const [view, setView] = useState('user'); 
  const [passInput, setPassInput] = useState('');
  
  const [state, setState] = useState({ loading: true, teachers: {}, error: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCursoIdx, setSelectedCursoIdx] = useState(0);

  // --- EFECTO: CARGAR HORARIOS ---
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
          const fInicio = c[12]?.replace(/"/g, '').trim(); 

          const semanas = [];
          for (let i = 14; i <= 29; i++) { 
            const texto = c[i]?.replace(/"/g, '').trim() || "";
            if (texto && texto !== "-" && texto !== "0" && !texto.toLowerCase().includes("pendiente")) {
              const zoomId = texto.match(/\d{9,11}/)?.[0];
              const horaMatch = texto.match(/(\d{1,2}\s*A\s*\d{1,2})/i);
              const partes = texto.split('-');
              
              semanas.push({
                num: i - 13,
                fecha: partes[0] ? partes[0].trim() : "Programada",
                hora: horaMatch ? horaMatch[0] : (partes[1] ? partes[1].trim() : "Por definir"),
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
      .catch(err => setState(s => ({ ...s, loading: false, error: "Error conectando con la base de datos académica." })));
  }, []);

  // --- FUNCIÓN DE BÚSQUEDA Y ENVÍO A DRIVE ---
  const handleSearch = (e) => {
    e.preventDefault();
    const idBusqueda = searchTerm.replace(/\D/g, '');
    const encontrado = !!state.teachers[idBusqueda];
    
    // 1. Mostrar resultado al usuario DE INMEDIATO
    if (encontrado) {
      setSelectedId(idBusqueda);
      setSelectedCursoIdx(0);
    } else { alert("Identificación no encontrada en el sistema."); }

    // 2. Enviar datos a Google Drive (Silenciosamente)
    if (idBusqueda) {
      const datosLog = {
        fecha: new Date().toLocaleString('es-CO'),
        doc: idBusqueda,
        estado: encontrado ? '✅ Éxito' : '❌ Fallido'
      };

      fetch(URL_SCRIPT_APPS, {
        method: "POST",
        mode: "no-cors", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosLog)
      }).catch(err => console.log("Error guardando log:", err));
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passInput === ADMIN_PASS) setView('admin');
    else alert("Credenciales incorrectas");
  };

  const handleReset = () => { setSelectedId(null); setSearchTerm(''); setSelectedCursoIdx(0); };

  // --- VISTA ADMIN (CON EXCEL INCRUSTADO) ---
  if (view === 'admin') {
    return (
      <div style={{fontFamily:'Segoe UI, sans-serif', background:'#f4f6f8', minHeight:'100vh', padding:'20px', display:'flex', flexDirection:'column', alignItems:'center'}}>
        <div style={{maxWidth:'1000px', width:'100%', background:'white', padding:'30px', borderRadius:'15px', boxShadow:'0 10px 25px rgba(0,0,0,0.1)'}}>
          
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'10px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
              <span style={{fontSize:'2rem'}}>📂</span>
              <div>
                <h2 style={{color:'#003366', margin:0}}>AUDITORÍA GOOGLE DRIVE</h2>
                <small style={{color:'#666'}}>Visualización en Tiempo Real</small>
              </div>
            </div>
            
            <div style={{display:'flex', gap:'10px'}}>
              <a href={URL_TU_EXCEL_LOGS} target="_blank" rel="noreferrer" style={{background:'#27ae60', color:'white', textDecoration:'none', padding:'10px 15px', borderRadius:'8px', fontWeight:'bold', fontSize:'0.9rem', display:'flex', alignItems:'center', gap:'5px'}}>
                <span>↗</span> Abrir en Pestaña Nueva
              </a>
              <button onClick={()=>setView('user')} style={{background:'#f1f5f9', color:'#334155', border:'none', padding:'10px 15px', borderRadius:'8px', fontWeight:'bold', cursor:'pointer', fontSize:'0.9rem'}}>
                ⬅ Salir
              </button>
            </div>
          </div>

          {/* ÁREA DE VISUALIZACIÓN INCRUSTADA */}
          <div style={{width:'100%', height:'500px', border:'2px solid #e2e8f0', borderRadius:'10px', overflow:'hidden', background:'#f8fafc', position:'relative'}}>
             <iframe 
                src={URL_EMBED_LOGS} 
                style={{width:'100%', height:'100%', border:'none'}}
                title="Historial Logs"
             ></iframe>
             <div style={{position:'absolute', bottom:'0', width:'100%', background:'rgba(255,255,255,0.9)', padding:'5px', fontSize:'0.7rem', textAlign:'center', color:'#888'}}>
               Si no puedes ver el archivo, usa el botón "Abrir en Pestaña Nueva"
             </div>
          </div>

          <div style={{marginTop:'20px', padding:'15px', background:'#fffdf5', borderLeft:'4px solid #D4AF37', borderRadius:'4px', fontSize:'0.85rem', color:'#856404'}}>
            ℹ️ <b>Nota:</b> Los nuevos registros aparecerán automáticamente al final de la hoja. Si no los ves, refresca esta página o usa el botón verde.
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA USUARIO (PORTAL) - SIN CAMBIOS ---
  if (state.loading) return <div className="loading-screen"><div className="spinner"></div><p>Cargando Portal...</p></div>;
  if (state.error) return <div className="error-screen"><h3>⚠️ Error</h3><p>{state.error}</p></div>;

  return (
    <div className="portal-container">
      <style>{`
        :root { --primary: #003366; --secondary: #D4AF37; --orange: #FF6600; --bg: #f4f6f8; --text: #333; }
        body { margin: 0; font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); }
        .header { background: var(--primary); padding: 15px 0; border-bottom: 4px solid var(--secondary); position: sticky; top: 0; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15