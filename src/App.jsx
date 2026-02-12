import React, { useState, useEffect, useMemo } from 'react';

// --- CONFIGURACIÓN BLINDADA ---
const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSx9XNRqhtDX7dlkfBTeMWPoZPwG3LW0rn3JT_XssQUu0vz1llFjNlx1lKr6krkJt-lbVryTzn8Dpyn/pub?gid=1271152041&single=true&output=csv";
const URL_SCRIPT_APPS = "https://script.google.com/macros/s/AKfycbxmvuy0L8BT-PzJnD98_gnyjw342BtcALKQDf1kEqhAW9G_IXWRM85kyVh786KmaMibxQ/exec";
const URL_TU_EXCEL_LOGS = "https://docs.google.com/spreadsheets/d/17NLfm6gxCF__YCfXUUfz4Ely5nJqMAHk-DqDolPvdNY/edit?gid=0#gid=0";
const URL_EMBED_LOGS = "https://docs.google.com/spreadsheets/d/17NLfm6gxCF__YCfXUUfz4Ely5nJqMAHk-DqDolPvdNY/preview?gid=0";

const WHATSAPP_NUMBER = "573106964025";
const ADMIN_PASS = "admincreo"; 

const App = () => {
  const [view, setView] = useState('user'); 
  const [passInput, setPassInput] = useState('');
  const [state, setState] = useState({ loading: true, teachers: {}, error: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCursoIdx, setSelectedCursoIdx] = useState(0);

  // --- LOGS ---
  const registrarLog = (documento, accion) => {
    try {
      const datosLog = { fecha: new Date().toLocaleString('es-CO'), doc: documento, estado: accion };
      fetch(URL_SCRIPT_APPS, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datosLog) }).catch(err => console.log(err));
    } catch (e) { console.error(e); }
  };

  // --- IMPRIMIR ---
  const handlePrint = () => {
    window.print();
    if(docente) registrarLog(docente.idReal, '🖨️ Imprimió Horario');
  };

  // --- CARGA ---
  useEffect(() => {
    fetch(URL_CSV).then(res => res.text()).then(csvText => {
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
              semanas.push({ num: i - 13, fecha: partes[0] ? partes[0].trim() : "Programada", hora: horaMatch ? horaMatch[0] : (partes[1] ? partes[1].trim() : "Por definir"), zoomId: zoomId, zoomLink: zoomId ? `https://zoom.us/j/${zoomId}` : null });
            }
          }
          if (id && !isNaN(id)) {
            const idLimpio = id.split('.')[0]; 
            if (!diccionario[idLimpio]) diccionario[idLimpio] = { nombre, idReal: idLimpio, cursos: [] };
            if (semanas.length > 0) diccionario[idLimpio].cursos.push({ materia, grupo, creditos, fInicio, semanas });
          }
        });
        setState({ loading: false, teachers: diccionario, error: null });
      }).catch(err => setState(s => ({ ...s, loading: false, error: "Error de conexión." })));
  }, []);

  const docente = useMemo(() => selectedId ? state.teachers[selectedId] : null, [selectedId, state.teachers]);
  const cursoActivo = docente ? docente.cursos[selectedCursoIdx] : null;

  const handleSearch = (e) => {
    e.preventDefault();
    const idBusqueda = searchTerm.replace(/\D/g, '');
    const encontrado = !!state.teachers[idBusqueda];
    if (encontrado) { setSelectedId(idBusqueda); setSelectedCursoIdx(0); registrarLog(idBusqueda, '✅ Consulta Exitosa'); } 
    else { alert("ID no encontrado."); if (idBusqueda) registrarLog(idBusqueda, '❌ Fallido'); }
  };

  if (view === 'admin') {
    return (
      <div style={{fontFamily:'Segoe UI', background:'#f4f6f8', minHeight:'100vh', padding:'20px', display:'flex', flexDirection:'column', alignItems:'center'}}>
        <div style={{maxWidth:'1000px', width:'100%', background:'white', padding:'30px', borderRadius:'15px', boxShadow:'0 10px 25px rgba(0,0,0,0.1)'}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
            <h2>PANEL ADMIN</h2>
            <button onClick={()=>setView('user')}>⬅ Salir</button>
          </div>
          <iframe src={URL_EMBED_LOGS} style={{width:'100%', height:'500px', border:'none'}} title="Logs"></iframe>
          <div style={{textAlign:'center', marginTop:'10px'}}><a href={URL_TU_EXCEL_LOGS} target="_blank" rel="noreferrer">Abrir Excel Completo</a></div>
        </div>
      </div>
    );
  }

  if (state.loading) return <div className="loading-screen">Loading...</div>;
  if (state.error) return <div className="error-screen">{state.error}</div>;

  return (
    <div className="portal-container">
      <style>{`
        :root { --primary: #003366; --secondary: #D4AF37; --orange: #FF6600; --bg: #f4f6f8; --text: #333; }
        body { margin: 0; font-family: 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); }
        .header { background: var(--primary); padding: 15px 0; border-bottom: 4px solid var(--secondary); }
        .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; }
        .brand h1 { margin: 0; color: var(--orange); font-size: 1.5rem; } .brand h2 { color: white; font-size: 0.8rem; margin:0; }
        .main-content { max-width: 1200px; margin: 30px auto; padding: 0 20px; display: flex; gap: 30px; flex-wrap: wrap; }
        .search-form input { padding: 8px; border-radius: 4px; border: none; }
        .btn-search { background: var(--secondary); border: none; padding: 8px 15px; font-weight: bold; cursor: pointer; margin-left: 5px; }
        .sidebar { background: white; padding: 20px; borderRadius: 8px; width: 100%; max-width: 300px; }
        .dashboard { flex: 1; background: white; padding: 20px; borderRadius: 8px; }
        .course-btn { display: block; width: 100%; padding: 10px; margin-bottom: 5px; border: 1px solid #eee; cursor: pointer; background: white; text-align: left; }
        .course-btn.active { border-left: 5px solid var(--secondary); background: #fffdf5; }
        .weeks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin-top: 20px; }
        .week-card { border: 1px solid #eee; padding: 15px; border-radius: 8px; }
        .zoom-link { display: block; background: #2D8CFF; color: white; text-align: center; padding: 8px; border-radius: 4px; text-decoration: none; margin-top: 10px; }
        .print-btn { background: #333; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px; margin-left: auto; }
        @media print {
          .header, .sidebar, .actions, .whatsapp-btn, .zoom-link { display: none !important; }
          .dashboard { box-shadow: none; border: none; }
          .weeks-grid { display: block; }
          .week-card { break-inside: avoid; border: 1px solid #ccc; margin-bottom: 10px; }
        }
      `}</style>

      <header className="header">
        <div className="header-content">
          <div className="brand" onClick={handleReset}>
            <h1>PORTAL DOCENTES (MODO PRUEBAS 🧪)</h1>
            <h2>ADMINISTRACIÓN S.S.T.</h2>
          </div>
          <div className="actions">
            {!docente && <form onSubmit={handleSearch} className="search-form"><input placeholder="Documento..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} /><button className="btn-search">BUSCAR</button></form>}
            {docente && <button onClick={handleReset} style={{cursor:'pointer', padding:'5px'}}>Nueva Consulta ↺</button>}
          </div>
        </div>
      </header>

      <main className="main-content">
        {!docente ? (
          <div style={{textAlign:'center', width:'100%', padding:'50px', background:'white', borderRadius:'10px'}}>
            <h2>Bienvenido al Portal de Docentes</h2>
            <p>Ingresa tu documento arriba.</p>
            <div style={{marginTop:'20px', cursor:'pointer', opacity:0.5}} onClick={()=>setView('login')}>🔒 Admin</div>
          </div>
        ) : (
          <>
            <aside className="sidebar">
              <h3>{docente.nombre}</h3>
              <p>ID: {docente.idReal}</p>
              <hr/>
              {docente.cursos.map((c, i) => (
                <button key={i} onClick={()=>setSelectedCursoIdx(i)} className={`course-btn ${selectedCursoIdx === i ? 'active' : ''}`}>
                  <b>{c.materia}</b><br/><small>Grupo {c.grupo}</small>
                </button>
              ))}
            </aside>
            <section className="dashboard">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'2px solid var(--secondary)', paddingBottom:'10px'}}>
                <h2 style={{margin:0, color:'var(--primary)'}}>{cursoActivo.materia}</h2>
                <button onClick={handlePrint} className="print-btn">🖨️ Imprimir / PDF</button>
              </div>
              <div className="weeks-grid">
                {cursoActivo.semanas.map((s, idx) => (
                  <div key={idx} className="week-card">
                    <strong>SEMANA {s.num}</strong>
                    <div>{s.fecha} - {s.hora}</div>
                    {s.zoomLink && <a href={s.zoomLink} target="_blank" rel="noreferrer" className="zoom-link" onClick={()=>registrarLog(docente.idReal, `🎥 Zoom Sem ${s.num}`)}>ENTRAR CLASE</a>}
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