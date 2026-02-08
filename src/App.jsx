
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Teacher, Course, AppState } from './types';
import { fetchAcademicData } from './services/csvService';
import WeekCard from './components/WeekCard';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    loading: true,
    error: null,
    teachers: {},
    lastUpdated: null
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAcademicData();
        setState({
          loading: false,
          error: null,
          teachers: data,
          lastUpdated: new Date().toLocaleString()
        });
      } catch (err: any) {
        setState(prev => ({ ...prev, loading: false, error: err.message }));
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTeacherId]);

  const currentTeacher = useMemo(() => {
    if (!selectedTeacherId) return null;
    return state.teachers[selectedTeacherId];
  }, [selectedTeacherId, state.teachers]);

  const currentCourse = useMemo(() => {
    if (!currentTeacher || !selectedCourseId) return null;
    return currentTeacher.courses.find(c => c.id === selectedCourseId) || null;
  }, [currentTeacher, selectedCourseId]);

  const displayedCourses = useMemo(() => {
    if (!currentTeacher) return [];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return currentTeacher.courses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentTeacher, currentPage]);

  const totalPages = currentTeacher ? Math.ceil(currentTeacher.courses.length / ITEMS_PER_PAGE) : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Normalize search term (remove dots, spaces, etc) to match cleaned IDs in storage
    const cleanTerm = searchTerm.trim().replace(/\D/g, '');
    
    if (cleanTerm && state.teachers[cleanTerm]) {
      setSelectedTeacherId(cleanTerm);
      const teacher = state.teachers[cleanTerm];
      if (teacher.courses.length > 0) {
        setSelectedCourseId(teacher.courses[0].id);
      }
    } else {
      // Partial search attempt for flexible results
      const foundKey = Object.keys(state.teachers).find(k => 
        k.includes(cleanTerm) || (cleanTerm.length > 3 && cleanTerm.includes(k))
      );
      
      if (foundKey) {
        setSelectedTeacherId(foundKey);
        const teacher = state.teachers[foundKey];
        if (teacher.courses.length > 0) {
          setSelectedCourseId(teacher.courses[0].id);
        }
      } else {
        alert('No se encontró ningún docente con esa identificación. Por favor, verifique el número ingresado e intente nuevamente.');
      }
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSelectedTeacherId(null);
    setSelectedCourseId(null);
  };

  const shareSchedule = useCallback(() => {
    if (!currentTeacher || !currentCourse) return;
    const text = `Hola! Soy el docente ${currentTeacher.name}. Este es mi horario para el curso ${currentCourse.name} (Grupo ${currentCourse.group}) en CREO.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }, [currentTeacher, currentCourse]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const downloadCalendar = useCallback(() => {
    if (!currentCourse) return;

    let icsContent = 
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Portal Docente CREO//NONSGML v1.0//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Horario ${currentCourse.name}
X-WR-TIMEZONE:America/Bogota
`;

    const monthsMap: {[key: string]: number} = {
      'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
      'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
    };

    const currentYear = new Date().getFullYear();

    currentCourse.weeks.forEach((weekContent, index) => {
      // Skip empty or invalid weeks
      if (!weekContent || weekContent.trim() === '-' || weekContent.trim() === '') return;
      
      // Skip independent work if only strictly zoom classes are desired, 
      // but usually useful to have in calendar too. 
      // User asked for "clases con zoom", so let's check for Zoom ID or keywords.
      const isZoom = weekContent.toLowerCase().includes('zoom') || weekContent.includes('ID');
      
      if (!isZoom) return; 

      // Parse Text: "martes / 24 / febrero-18 A 20-..."
      const parts = weekContent.split('-');
      const datePart = parts[0]; // "martes / 24 / febrero"
      const timePart = parts[1]; // "18 A 20"
      
      // Extract Date
      const dateMatch = datePart.match(/(\d+)\s*\/\s*([a-zA-Z]+)/);
      if (!dateMatch) return;
      
      const day = parseInt(dateMatch[1]);
      const monthName = dateMatch[2].toLowerCase();
      const month = monthsMap[monthName];
      
      if (month === undefined) return;

      // Extract Time
      const timeMatch = timePart.match(/(\d+)\s*[aA]\s*(\d+)/);
      if (!timeMatch) return;
      
      const startHour = parseInt(timeMatch[1]);
      const endHour = parseInt(timeMatch[2]);

      // Construct Date Objects
      const startDate = new Date(currentYear, month, day, startHour, 0, 0);
      const endDate = new Date(currentYear, month, day, endHour, 0, 0);

      // Extract Zoom ID for description
      const idMatch = weekContent.match(/ID\s*[-:.]?\s*(\d+)/i) || weekContent.match(/(\d{9,11})/);
      const zoomId = idMatch ? idMatch[1] : '';
      const zoomLink = zoomId ? `https://zoom.us/j/${zoomId}` : '';

      // Format for ICS (YYYYMMDDTHHMMSS)
      const formatICSDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      icsContent += 
`BEGIN:VEVENT
UID:${currentCourse.id}-week-${index + 1}-${Date.now()}@creo.edu.co
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:Clase ${currentCourse.name} - S${index + 1}
DESCRIPTION:Grupo: ${currentCourse.group}\\nID Zoom: ${zoomId}\\nLink: ${zoomLink}
LOCATION:Sala Zoom ${zoomId ? zoomId.slice(-2) : ''}
URL:${zoomLink}
END:VEVENT
`;
    });

    icsContent += 'END:VCALENDAR';

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `Horario_${currentCourse.name.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentCourse]);

  const handleAdminAccess = () => {
    const pass = prompt('Ingrese contraseña de administrador:');
    if (pass === 'admin123') {
      setIsAdminOpen(true);
    } else if (pass !== null) {
      alert('Acceso denegado');
    }
  };

  if (state.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center mb-8 animate-pulse px-4">
            <h1 className="text-3xl md:text-4xl font-black text-institucional-azul tracking-tight mb-2">PORTAL DOCENTE CREO</h1>
            <h2 className="text-xs md:text-sm font-bold text-institucional-dorado tracking-widest uppercase">Administración de la Seguridad y Salud en el Trabajo</h2>
        </div>
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-institucional-azul animate-shimmer w-full"></div>
        </div>
        <p className="mt-4 text-institucional-azul font-medium">Sincronizando horarios CREO...</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-lg max-w-md">
          <h2 className="text-red-800 font-bold text-xl mb-2">Error de Sincronización</h2>
          <p className="text-red-700">{state.error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition font-bold"
          >
            REINTENTAR AHORA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col print:bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 border-b-2 border-institucional-azul sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div 
            className="flex flex-col cursor-pointer group text-center md:text-left" 
            onClick={handleClearSearch}
          >
            <h1 className="text-2xl font-black text-institucional-azul tracking-tight leading-none group-hover:opacity-80 transition-opacity">
              PORTAL DOCENTE CREO
            </h1>
            <h2 className="text-[10px] md:text-xs font-bold text-institucional-dorado tracking-widest uppercase mt-1">
              Administración de la Seguridad y Salud en el Trabajo
            </h2>
          </div>
          
          <form onSubmit={handleSearch} className="flex w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <input 
                type="text" 
                placeholder="Cédula del docente..." 
                className="w-full pl-4 pr-10 py-2.5 rounded-l-lg border-2 border-gray-200 focus:border-institucional-azul outline-none transition-all text-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-institucional-azul p-1 rounded-full hover:bg-gray-100 transition-colors"
                  title="Limpiar búsqueda"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                   </svg>
                </button>
              )}
            </div>
            <button 
              type="submit"
              className="bg-institucional-azul text-white px-6 py-2.5 rounded-r-lg font-bold hover:bg-opacity-90 transition-all text-sm whitespace-nowrap uppercase"
            >
              Consultar
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 print:block print:p-0">
        {!currentTeacher ? (
          <div className="lg:col-span-12 flex flex-col items-center justify-center py-20 text-center animate-fade-in print:hidden">
            <div className="bg-blue-50 p-10 rounded-full mb-6">
               <svg className="w-20 h-20 text-institucional-azul opacity-20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
               </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Portal de Horarios Académicos</h2>
            <p className="text-gray-500 max-w-md mt-2 font-medium">
              Ingrese su identificación para acceder a la planeación de clases, grupos asignados y enlaces de Sala Zoom.
            </p>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <div className="flex flex-col items-center gap-2">
                   <div className="w-8 h-8 rounded-full border flex items-center justify-center">1</div>
                   Sincronización Automática
                </div>
                <div className="flex flex-col items-center gap-2">
                   <div className="w-8 h-8 rounded-full border flex items-center justify-center">2</div>
                   Gestión de Grupos
                </div>
                <div className="flex flex-col items-center gap-2">
                   <div className="w-8 h-8 rounded-full border flex items-center justify-center">3</div>
                   Acceso Directo a Clases
                </div>
            </div>
          </div>
        ) : (
          <>
            {/* Sidebar: Teacher Info & Course List */}
            <aside className="lg:col-span-4 space-y-6 animate-slide-in print:hidden">
              <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-institucional-azul rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-inner">
                    {currentTeacher.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-institucional-azul uppercase leading-tight">{currentTeacher.name}</h2>
                    <p className="text-gray-400 text-sm font-bold">CC: {currentTeacher.id}</p>
                  </div>
                </div>
                <div className="h-px bg-gray-100 my-4" />
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cursos ({currentTeacher.courses.length})</h3>
                  <span className="text-[10px] bg-blue-50 text-institucional-azul px-2 py-0.5 rounded font-bold">DOCENTE ACTIVO</span>
                </div>
                
                <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                  {displayedCourses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => setSelectedCourseId(course.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedCourseId === course.id 
                        ? 'border-institucional-dorado bg-yellow-50 shadow-sm' 
                        : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <span className="block text-sm font-bold text-institucional-azul leading-tight">{course.name}</span>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[11px] text-institucional-dorado font-bold uppercase tracking-wide">Grupo {course.group}</span>
                        <span className="text-[10px] text-gray-400 font-bold">{course.credits} Cr.</span>
                      </div>
                    </button>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-xs font-bold text-institucional-azul disabled:text-gray-300 hover:bg-blue-50 rounded transition-colors disabled:cursor-not-allowed"
                    >
                      ANTERIOR
                    </button>
                    <span className="text-xs text-gray-400 font-bold">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-xs font-bold text-institucional-azul disabled:text-gray-300 hover:bg-blue-50 rounded transition-colors disabled:cursor-not-allowed"
                    >
                      SIGUIENTE
                    </button>
                  </div>
                )}
              </section>
            </aside>

            {/* Main Content: Course Details */}
            <section className="lg:col-span-8 space-y-6 animate-fade-in print:col-span-12 print:block">
              {currentCourse ? (
                <>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 print:shadow-none print:border-0">
                    <div className="bg-institucional-azul p-6 text-white flex justify-between items-start relative overflow-hidden print:bg-white print:text-black print:border-b-2 print:border-black print:p-0 print:mb-4">
                      <div className="absolute top-0 right-0 p-4 opacity-10 print:hidden">
                         <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                      </div>
                      <div className="relative z-10">
                        <h1 className="text-2xl font-bold leading-tight uppercase">{currentCourse.name}</h1>
                        <p className="text-blue-200 text-sm font-bold mt-1 uppercase tracking-widest flex items-center gap-2 print:text-gray-600">
                           <span className="w-2 h-2 bg-institucional-dorado rounded-full print:hidden"></span>
                           Planificación Semanal - Grupo {currentCourse.group}
                        </p>
                      </div>
                      
                      {/* Action Buttons: Hidden on Print */}
                      <div className="relative z-10 flex flex-wrap gap-2 print:hidden justify-end">
                        <button 
                          onClick={handlePrint}
                          className="bg-white/20 hover:bg-white/30 text-white p-2.5 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold backdrop-blur-sm"
                          title="Descargar PDF"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                          PDF
                        </button>
                        <button 
                          onClick={downloadCalendar}
                          className="bg-white/20 hover:bg-white/30 text-white p-2.5 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold backdrop-blur-sm"
                          title="Agregar al Calendario"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                          ICS
                        </button>
                        <button 
                          onClick={shareSchedule}
                          className="bg-green-500 hover:bg-green-600 text-white p-2.5 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold shadow-lg"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.522.902 3.222 1.387 5.021 1.388l.001-.001c5.421 0 9.832-4.412 9.835-9.835 0-2.628-1.023-5.1-2.881-6.958-1.859-1.859-4.331-2.881-6.96-2.882-5.423 0-9.835 4.412-9.838 9.835-.001 1.848.52 3.655 1.504 5.231l-1.001 3.654 3.738-.981zm10.744-5.26c-.283-.142-1.673-.826-1.933-.921-.26-.094-.449-.142-.638.142-.19.283-.733.921-.897 1.11-.164.19-.327.212-.61.071-.282-.142-1.192-.44-2.271-1.402-.84-.749-1.406-1.674-1.571-1.956-.164-.283-.017-.436.124-.577.128-.126.283-.33.424-.496.142-.165.19-.283.283-.472.094-.19.047-.354-.023-.471-.142-.638-1.536-.874-2.103-.23-.553-.464-.478-.638-.487-.165-.009-.354-.01-.543-.01-.189 0-.496.071-.756.354-.26.283-.992.969-.992 2.363 0 1.393 1.016 2.739 1.157 2.928.142.189 1.999 3.054 4.843 4.28.677.293 1.205.467 1.617.598.68.216 1.299.185 1.788.112.545-.081 1.673-.684 1.909-1.344.237-.659.237-1.226.166-1.344-.071-.118-.26-.189-.543-.331z"/>
                          </svg>
                          COMPARTIR
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50 border-b border-gray-100 print:bg-white print:border-b-2 print:border-black">
                      <div className="p-4 text-center hover:bg-gray-100 transition-colors cursor-default print:border-black">
                        <span className="block text-[10px] text-gray-400 font-bold uppercase mb-1 print:text-black">Grupo Académico</span>
                        <span className="text-xl font-black text-institucional-azul print:text-black">{currentCourse.group}</span>
                      </div>
                      <div className="p-4 text-center hover:bg-gray-100 transition-colors cursor-default">
                        <span className="block text-[10px] text-gray-400 font-bold uppercase mb-1 print:text-black">Capacidad / Est.</span>
                        <span className="text-xl font-black text-institucional-azul print:text-black">{currentCourse.students}</span>
                      </div>
                      <div className="p-4 text-center hover:bg-gray-100 transition-colors cursor-default">
                        <span className="block text-[10px] text-gray-400 font-bold uppercase mb-1 print:text-black">Créditos Curso</span>
                        <span className="text-xl font-black text-institucional-azul print:text-black">{currentCourse.credits}</span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="h-6 w-1.5 bg-institucional-dorado rounded-full" />
                        <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Cronograma de Sesiones (Semanas 1 - 8)</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-2">
                        {currentCourse.weeks.map((weekContent, idx) => (
                          <WeekCard 
                            key={`week-${idx}`}
                            weekNumber={idx + 1}
                            content={weekContent}
                          />
                        ))}
                      </div>

                      <div className="mt-10 p-5 bg-blue-50/50 rounded-2xl border-2 border-dashed border-blue-100 print:hidden">
                         <div className="flex flex-wrap gap-10 text-sm">
                            <div className="flex flex-col">
                               <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Periodo Académico</span>
                               <span className="text-institucional-azul font-bold flex items-center gap-2">
                                  {currentCourse.startDate || 'Pendiente'} <span className="text-gray-300">|</span> {currentCourse.endDate || 'Pendiente'}
                               </span>
                            </div>
                            <div className="flex flex-col">
                               <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Validación de Datos</span>
                               <span className="text-green-600 font-bold flex items-center gap-1.5">
                                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                  Información Sincronizada
                               </span>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-24 text-center flex flex-col items-center justify-center animate-fade-in print:hidden">
                   <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                      <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                   </div>
                   <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mb-2">Selección Requerida</p>
                   <p className="text-gray-500 max-w-sm">Por favor, seleccione una de sus asignaturas en el panel lateral para visualizar la planeación detallada por semanas.</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Footer & Admin Link */}
      <footer className="py-10 px-6 text-center text-gray-400 text-xs mt-auto border-t border-gray-100 bg-white/50 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center opacity-70 hover:opacity-100 transition-all duration-500">
          <p className="font-medium tracking-tight">© 2024 <span className="font-bold text-institucional-azul">PORTAL DOCENTE CREO</span> — Sistema Integrado de Información Académica.</p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
             <span className="hidden md:inline text-[10px] uppercase font-black text-gray-300">Entorno de Producción</span>
             <button 
               onClick={handleAdminAccess}
               className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-institucional-azul transition-colors border-b border-transparent hover:border-institucional-azul pb-0.5"
             >
               Panel Admin
             </button>
          </div>
        </div>
      </footer>

      {/* Admin Panel Modal */}
      {isAdminOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-institucional-azul"></div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black text-institucional-azul uppercase tracking-tight">Monitor de Datos</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Estado de Conectividad con Google Sheets</p>
              </div>
              <button onClick={() => setIsAdminOpen(false)} className="text-gray-300 hover:text-red-500 transition-colors p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-gray-500 text-xs font-bold uppercase">Estado del Endpoint:</span>
                <span className="text-green-600 font-black bg-green-50 px-2.5 py-1 rounded-lg text-[10px] border border-green-100">ONLINE</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-gray-500 text-xs font-bold uppercase">Sincronización:</span>
                <span className="font-bold text-gray-700 text-xs">{state.lastUpdated}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-gray-500 text-xs font-bold uppercase">Registros Indexados:</span>
                <span className="font-black text-institucional-azul text-xs">{Object.keys(state.teachers).length} Docentes</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-gray-500 text-xs font-bold uppercase">Caché de Datos:</span>
                <span className="font-bold text-gray-700 text-xs uppercase">Habilitado</span>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 py-3.5 bg-institucional-azul text-white rounded-xl font-black uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-xl text-[10px]"
              >
                Forzar Recarga
              </button>
              <button 
                onClick={() => setIsAdminOpen(false)}
                className="flex-1 py-3.5 bg-gray-100 text-gray-500 rounded-xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all text-[10px]"
              >
                Cerrar Monitor
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, #004A87 0%, #006ab8 50%, #004A87 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
        .animate-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-in {
          animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-15px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @media print {
          @page { margin: 1cm; size: landscape; }
          body { -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

export default App;
