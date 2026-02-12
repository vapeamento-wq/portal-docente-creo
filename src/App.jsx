import React, { useState, useEffect, useMemo } from 'react';

// --- CONFIGURACIÓN DE LABORATORIO 🧪 (TOTALMENTE INDEPENDIENTE) ---

// 1. BASE DE DATOS DE PRUEBA (La copia que creaste)
const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQqVxPhQsuX9SKXsPSj9P5iaL__B0eAt7jzVj8HMnxKW6QTkD6IUuS9eFYTwYep2G6x2rn8uKlfnvsO/pub?output=csv";

// 2. NUEVO SCRIPT DE LOGS (El que acabas de crear)
const URL_SCRIPT_APPS = "https://script.google.com/macros/s/AKfycbxXAXa1VXPf8mKv0x_yZ__dnRNIMP9yZrIWO1xXvN24V76WWs9jt6O6T5ut_HLPVtyI/exec";

// 3. VISOR DEL ADMIN (OJO: Aquí dejé los links del Excel original para que no te salga error, 
// pero si quieres ver el Excel Nuevo, tendrías que cambiar estos dos links por los de tu hoja de pruebas)
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

  // --- LOGS (TEST) ---
  const registrarLog = (documento, accion) => {
    try {
      // Manda el log al NUEVO script
      const datosLog = { fecha: new Date().toLocaleString('es-CO'), doc: documento, estado: `[TEST] ${accion}` };
      fetch(URL_SCRIPT_APPS, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datosLog) }).catch(err => console.log(err));
    } catch (e) { console.error(e); }
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
          const fInicio = c[12]?.replace(/"/g, '').