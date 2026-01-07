'use client'
import { useState } from "react";

/* ======================
   TIPOS
====================== */
type MonthData = {
  month: string;
  year: string;
  plcmts: string;
  videos: string;
  hours: string;
  rvs: string;
  bist: string;
  remark: string;
  pio: string;
};

type Publicador = {
  id: string;
  fname: string;
  lname: string;
  addr: string;
  phone: string;
  phone2: string;
  phone3: string;
  gender: string;
  birdate: string;
  bapdate: string;
  group: string;
  groupname: string;
  status: string;
  pioneer: string; // Nuevo campo para precursor
  months: MonthData[];
};

type MetaData = {
  agent: string;
  agentVer: string;
  date: string;
  count: string;
};

/* ======================
   COMPONENTE
====================== */
export default function App() {
  const [pubs, setPubs] = useState<Publicador[]>([]);
  const [meta, setMeta] = useState<MetaData>({ agent: "", agentVer: "", date: "", count: "" });
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedPub, setSelectedPub] = useState<number | null>(null);

  /* ======================
     SUBIR XML
  ====================== */
  const subirXML = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        
        if (!text || text.trim().length === 0) {
          throw new Error('El archivo está vacío');
        }

        if (!text.trim().startsWith('<?xml') && !text.trim().startsWith('<')) {
          throw new Error('El archivo no parece ser un XML válido');
        }

        console.log('Parseando XML... Longitud:', text.length);
        const { publicadores, metadata } = parseXML(text);
        
        // Detectar precursores de los registros y marcarlos automáticamente
        publicadores.forEach(p => {
          const tieneRegistrosPrecursor = p.months.some(m => m.pio.toLowerCase() === 'reg');
          if (tieneRegistrosPrecursor && !p.pioneer) {
            p.pioneer = 'Regular';
          }
        });
        
        // Ordenar: primero por grupo, luego super de grupo primero, luego auxiliar, luego por nombre
        const publicadoresOrdenados = publicadores.sort((a, b) => {
          const grupoA = parseInt(a.group) || 999;
          const grupoB = parseInt(b.group) || 999;
          
          if (grupoA !== grupoB) return grupoA - grupoB;
          
          // Si es super de grupo, va primero
          const aSuperGrupo = a.groupname.toLowerCase().includes('super');
          const bSuperGrupo = b.groupname.toLowerCase().includes('super');
          
          if (aSuperGrupo && !bSuperGrupo) return -1;
          if (!aSuperGrupo && bSuperGrupo) return 1;
          
          // Si es auxiliar, va segundo
          const aAuxiliar = a.groupname.toLowerCase().includes('auxiliar') || a.groupname.toLowerCase().includes('auxiliary');
          const bAuxiliar = b.groupname.toLowerCase().includes('auxiliar') || b.groupname.toLowerCase().includes('auxiliary');
          
          if (aAuxiliar && !bAuxiliar) return -1;
          if (!aAuxiliar && bAuxiliar) return 1;
          
          // Luego ordenar por nombre
          return `${a.fname} ${a.lname}`.localeCompare(`${b.fname} ${b.lname}`);
        });
        
        console.log('Publicadores encontrados:', publicadoresOrdenados.length);
        setPubs(publicadoresOrdenados);
        setMeta(metadata);
        
        if (publicadoresOrdenados.length > 0) {
          const primerGrupo = publicadoresOrdenados[0].group;
          setSelectedGroup(primerGrupo);
          setSelectedPub(0);
          alert(`✅ Archivo cargado exitosamente: ${publicadoresOrdenados.length} publicadores encontrados`);
        } else {
          alert('⚠️ No se encontraron publicadores en el archivo');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        alert(`❌ Error al cargar el archivo:\n${errorMsg}\n\nVerifica que el archivo XML sea válido y esté completo.`);
        console.error('Error completo:', error);
      }
    };
    
    reader.onerror = () => {
      alert('❌ Error al leer el archivo');
    };
    
    reader.readAsText(file);
  };

  /* ======================
     PARSEAR XML
  ====================== */
  const parseXML = (text: string): { publicadores: Publicador[], metadata: MetaData } => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");

      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        console.error('Parser error:', parserError.textContent);
        throw new Error('El archivo XML tiene errores de sintaxis');
      }

      // Metadata
      const agentEl = xmlDoc.getElementsByTagName("Agent")[0];
      const metadata: MetaData = {
        agent: agentEl?.textContent || "",
        agentVer: agentEl?.getAttribute("Ver") || "",
        date: xmlDoc.getElementsByTagName("Date")[0]?.textContent || "",
        count: xmlDoc.getElementsByTagName("Count")[0]?.textContent || ""
      };

      let activeNode = xmlDoc.getElementsByTagName("Active")[0];
      let pubElements;
      
      if (activeNode) {
        pubElements = activeNode.getElementsByTagName("Pub");
      } else {
        pubElements = xmlDoc.getElementsByTagName("Pub");
      }

      if (!pubElements || pubElements.length === 0) {
        throw new Error('No se encontraron publicadores en el XML');
      }

      const mesesIngles = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const publicadores: Publicador[] = Array.from(pubElements).map(pub => {
        const months: MonthData[] = [];
        
        mesesIngles.forEach(month => {
          const monthEls = pub.getElementsByTagName(month);
          Array.from(monthEls).forEach(monthEl => {
            const year = monthEl.getAttribute("Year") || "";
            if (year) {
              months.push({
                month,
                year,
                plcmts: monthEl.getElementsByTagName("Plcmts")[0]?.textContent || "0",
                videos: monthEl.getElementsByTagName("Videos")[0]?.textContent || "0",
                hours: monthEl.getElementsByTagName("Hours")[0]?.textContent || "0",
                rvs: monthEl.getElementsByTagName("R.V.s")[0]?.textContent || "0",
                bist: monthEl.getElementsByTagName("BiSt.")[0]?.textContent || "0",
                remark: monthEl.getElementsByTagName("Remark")[0]?.textContent || "",
                pio: monthEl.getElementsByTagName("Pio")[0]?.textContent || ""
              });
            }
          });
        });

        return {
          id: pub.getElementsByTagName("id")[0]?.textContent || "",
          fname: pub.getElementsByTagName("fname")[0]?.textContent || "",
          lname: pub.getElementsByTagName("lname")[0]?.textContent || "",
          addr: pub.getElementsByTagName("addr")[0]?.textContent || "",
          phone: pub.getElementsByTagName("phone")[0]?.textContent || "",
          phone2: pub.getElementsByTagName("phone2")[0]?.textContent || "",
          phone3: pub.getElementsByTagName("phone3")[0]?.textContent || "",
          gender: pub.getElementsByTagName("gender")[0]?.textContent || "",
          birdate: pub.getElementsByTagName("birdate")[0]?.textContent || "",
          bapdate: pub.getElementsByTagName("bapdate")[0]?.textContent || "",
          group: pub.getElementsByTagName("group")[0]?.textContent || "",
          groupname: pub.getElementsByTagName("groupname")[0]?.textContent || "",
          status: pub.getElementsByTagName("status")[0]?.textContent || "activo",
          pioneer: pub.getElementsByTagName("pioneer")[0]?.textContent || "",
          months
        };
      });

      return { publicadores, metadata };
    } catch (error) {
      console.error('Error parsing XML:', error);
      throw error;
    }
  };

  /* ======================
     OBTENER ETIQUETAS
  ====================== */
  const obtenerEtiquetas = (pub: Publicador) => {
    const etiquetas = [];
    const groupnameLower = pub.groupname.toLowerCase();
    const statusLower = (pub.status || 'activo').toLowerCase();
    const pioneerLower = (pub.pioneer || '').toLowerCase();
    
    // Estado (primero siempre)
    if (statusLower.includes('expulsado') || statusLower.includes('expelled')) {
      etiquetas.push({ texto: 'Expulsado', color: 'bg-gray-700' });
    } else if (statusLower.includes('inactivo') || statusLower.includes('inactive')) {
      etiquetas.push({ texto: 'Inactivo', color: 'bg-gray-500' });
    }
    
    // Verificar si es super de grupo (siempre primero)
    if (groupnameLower.includes('super')) {
      etiquetas.push({ texto: 'Super', color: 'bg-amber-600' });
    }
    
    // Verificar si es auxiliar (segundo)
    if (groupnameLower.includes('auxiliar') || groupnameLower.includes('auxiliary')) {
      etiquetas.push({ texto: 'Auxiliar', color: 'bg-orange-500' });
    }
    
    // Verificar si es precursor SOLO del campo pioneer (no de los registros)
    const esPrecursorCampo = pioneerLower.includes('regular') || pioneerLower === 'reg';
    
    if (esPrecursorCampo) {
      etiquetas.push({ texto: 'Regular', color: 'bg-green-500' });
    }
    
    if (groupnameLower.includes('anciano') || groupnameLower.includes('elder')) {
      etiquetas.push({ texto: 'Anciano', color: 'bg-red-500' });
    }
    
    if (groupnameLower.includes('ministerial') || groupnameLower.includes('servant')) {
      etiquetas.push({ texto: 'Ministerial', color: 'bg-sky-500' });
    }
    
    return etiquetas;
  };

  /* ======================
     TRADUCIR MES
  ====================== */
  const traducirMes = (mesIngles: string): string => {
    const meses: Record<string, string> = {
      'Jan': 'Ene',
      'Feb': 'Feb',
      'Mar': 'Mar',
      'Apr': 'Abr',
      'May': 'May',
      'Jun': 'Jun',
      'Jul': 'Jul',
      'Aug': 'Ago',
      'Sep': 'Sep',
      'Oct': 'Oct',
      'Nov': 'Nov',
      'Dec': 'Dic'
    };
    return meses[mesIngles] || mesIngles;
  };

  /* ======================
     OBTENER GRUPOS ÚNICOS
  ====================== */
  const grupos = Array.from(new Set(
    pubs.filter(p => {
      const status = (p.status || 'activo').toLowerCase();
      return !status.includes('inactivo') && !status.includes('inactive') && 
             !status.includes('expulsado') && !status.includes('expelled');
    }).map(p => p.group)
  )).sort((a, b) => {
    const numA = parseInt(a) || 999;
    const numB = parseInt(b) || 999;
    return numA - numB;
  });

  /* ======================
     FILTRAR PUBLICADORES
  ====================== */
  const pubsDelGrupo = selectedGroup === 'inactivos'
    ? pubs.filter(p => {
        const status = (p.status || 'activo').toLowerCase();
        return status.includes('inactivo') || status.includes('inactive') || 
               status.includes('expulsado') || status.includes('expelled');
      })
    : pubs.filter(p => {
        const status = (p.status || 'activo').toLowerCase();
        const esActivo = !status.includes('inactivo') && !status.includes('inactive') && 
                        !status.includes('expulsado') && !status.includes('expelled');
        return p.group === selectedGroup && esActivo;
      });

  /* ======================
     DESCARGAR CAPTURA
  ====================== */
  const descargarCaptura = () => {
    if (!selectedGroup) return;
    
    // Filtrar publicadores según el grupo
    let pubsParaCaptura;
    if (selectedGroup === 'inactivos') {
      // Mostrar todos los inactivos/expulsados
      pubsParaCaptura = pubs.filter(p => {
        const status = (p.status || 'activo').toLowerCase();
        return status.includes('inactivo') || status.includes('inactive') || 
               status.includes('expulsado') || status.includes('expelled');
      });
    } else {
      // Solo activos del grupo seleccionado, ordenados
      pubsParaCaptura = pubs
        .filter(p => {
          const status = (p.status || 'activo').toLowerCase();
          const esActivo = !status.includes('inactivo') && !status.includes('inactive') && 
                          !status.includes('expulsado') && !status.includes('expelled');
          return p.group === selectedGroup && esActivo;
        })
        .sort((a, b) => {
          // Super primero
          const aSuper = a.groupname.toLowerCase().includes('super');
          const bSuper = b.groupname.toLowerCase().includes('super');
          if (aSuper && !bSuper) return -1;
          if (!aSuper && bSuper) return 1;
          
          // Auxiliar segundo
          const aAux = a.groupname.toLowerCase().includes('auxiliar') || a.groupname.toLowerCase().includes('auxiliary');
          const bAux = b.groupname.toLowerCase().includes('auxiliar') || b.groupname.toLowerCase().includes('auxiliary');
          if (aAux && !bAux) return -1;
          if (!aAux && bAux) return 1;
          
          // Resto alfabético
          return `${a.fname} ${a.lname}`.localeCompare(`${b.fname} ${b.lname}`);
        });
    }
    
    // Crear un canvas con el contenido del grupo
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Configuración del canvas - MÁS ANCHO Y COMPACTO
    canvas.width = 1920; // Ancho HD
    const publicadorHeight = 145; // Altura ajustada
    const headerHeight = 120;
    const padding = 50;
    const columnWidth = (canvas.width - padding * 3) / 2; // 2 columnas
    
    // Calcular altura según columnas
    const rows = Math.ceil(pubsParaCaptura.length / 2);
    canvas.height = headerHeight + (rows * publicadorHeight) + padding * 2;
    
    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Header
    ctx.fillStyle = selectedGroup === 'inactivos' ? '#6b7280' : '#4f46e5';
    ctx.fillRect(0, 0, canvas.width, headerHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px Arial';
    const titulo = selectedGroup === 'inactivos' ? '📋 Inactivos/Expulsados' : `📋 Grupo ${selectedGroup}`;
    ctx.fillText(titulo, padding, 65);
    
    ctx.font = '22px Arial';
    ctx.fillText(`${pubsParaCaptura.length} publicadores • ${new Date().toLocaleDateString()}`, padding, 100);
    
    // Publicadores en 2 columnas
    pubsParaCaptura.forEach((p, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      
      const xPos = padding + (column * (columnWidth + padding));
      const yPos = headerHeight + padding + (row * publicadorHeight);
      
      const isSuperGrupo = p.groupname.toLowerCase().includes('super');
      const isAuxiliar = p.groupname.toLowerCase().includes('auxiliar') || p.groupname.toLowerCase().includes('auxiliary');
      const statusLower = (p.status || 'activo').toLowerCase();
      const isInactivo = statusLower.includes('inactivo') || statusLower.includes('inactive');
      const isExpulsado = statusLower.includes('expulsado') || statusLower.includes('expelled');
      const etiquetas = obtenerEtiquetas(p);
      const generoES = p.gender === 'Male' ? 'Hombre' : p.gender === 'Female' ? 'Mujer' : p.gender;
      
      // Fondo del publicador
      let bgColor = '#f9fafb';
      let borderColor = '#e5e7eb';
      
      if (isExpulsado) {
        bgColor = '#f3f4f6';
        borderColor = '#374151';
      } else if (isInactivo) {
        bgColor = '#f9fafb';
        borderColor = '#9ca3af';
      } else if (isSuperGrupo) {
        bgColor = '#fef3c7';
        borderColor = '#f59e0b';
      } else if (isAuxiliar) {
        bgColor = '#fed7aa';
        borderColor = '#fb923c';
      }
      
      ctx.fillStyle = bgColor;
      ctx.fillRect(xPos, yPos, columnWidth, publicadorHeight - 20);
      
      // Borde
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(xPos, yPos, columnWidth, publicadorHeight - 20);
      
      let textY = yPos + 35;
      
      // Nombre
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 22px Arial';
      ctx.fillText(`${p.fname} ${p.lname}`, xPos + 15, textY);
      
      // Badge de superintendente o auxiliar en la esquina (solo si NO es inactivos)
      if (selectedGroup !== 'inactivos') {
        if (isSuperGrupo) {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(xPos + columnWidth - 100, yPos + 8, 90, 24);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px Arial';
          ctx.fillText('🤝 SUPER', xPos + columnWidth - 95, yPos + 25);
        } else if (isAuxiliar) {
          ctx.fillStyle = '#fb923c';
          ctx.fillRect(xPos + columnWidth - 110, yPos + 8, 100, 24);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px Arial';
          ctx.fillText('🤝 AUXILIAR', xPos + columnWidth - 105, yPos + 25);
        }
      }
      
      textY += 8;
      
      // Etiquetas en horizontal (filtrar según contexto)
      let etiquetasFiltradas = etiquetas.filter(e => e.texto !== 'Super' && e.texto !== 'Auxiliar');
      
      // Si estamos en grupos normales, no mostrar Expulsado/Inactivo
      if (selectedGroup !== 'inactivos') {
        etiquetasFiltradas = etiquetasFiltradas.filter(e => e.texto !== 'Expulsado' && e.texto !== 'Inactivo');
      }
      
      if (etiquetasFiltradas.length > 0) {
        let xLabel = xPos + 15;
        etiquetasFiltradas.forEach(etiq => {
          const colores: Record<string, string> = {
            'Expulsado': '#374151',
            'Inactivo': '#6b7280',
            'Regular': '#10b981',
            'Anciano': '#ef4444',
            'Ministerial': '#0ea5e9'
          };
          
          ctx.fillStyle = colores[etiq.texto] || '#6b7280';
          ctx.fillRect(xLabel, textY, 90, 22);
          
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px Arial';
          ctx.fillText(etiq.texto, xLabel + 8, textY + 16);
          
          xLabel += 97;
        });
        textY += 35; // Más espacio después de las etiquetas
      } else {
        textY += 10;
      }
      
      // Información compacta con más separación
      ctx.fillStyle = '#374151';
      ctx.font = '14px Arial';
      
      // Si es inactivos, mostrar el grupo
      if (selectedGroup === 'inactivos') {
        ctx.fillText(`Grupo ${p.group} • ID: ${p.id} • ${generoES}`, xPos + 15, textY);
      } else {
        ctx.fillText(`ID: ${p.id} • ${generoES}`, xPos + 15, textY);
      }
      
      textY += 22; // Más espacio entre líneas
      
      ctx.fillText(`Tel: ${p.phone2 || p.phone || 'N/A'}`, xPos + 15, textY);
      
      textY += 22; // Más espacio entre líneas
      
      // Dirección truncada si es muy larga
      const maxDirLength = 48;
      const direccion = p.addr && p.addr.length > maxDirLength 
        ? p.addr.substring(0, maxDirLength) + '...' 
        : p.addr || 'N/A';
      ctx.fillText(`📍 ${direccion}`, xPos + 15, textY);
    });
    
    // Descargar imagen
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `grupo_${selectedGroup}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  /* ======================
     EDITAR CAMPO
  ====================== */
  const editarCampo = (campo: keyof Publicador, valor: string) => {
    if (selectedPub === null) return;
    
    setPubs(prev => {
      const copia = [...prev];
      const publicadorActual = copia[selectedPub];
      const grupoAnterior = publicadorActual.group;
      
      // Actualizar el campo
      copia[selectedPub] = { ...copia[selectedPub], [campo]: valor };
      
      // Si cambió el grupo, reordenar
      if (campo === 'group' && valor !== grupoAnterior) {
        // Reordenar por grupo, super, auxiliar y nombre
        const copiaOrdenada = copia.sort((a, b) => {
          const grupoA = parseInt(a.group) || 999;
          const grupoB = parseInt(b.group) || 999;
          
          if (grupoA !== grupoB) return grupoA - grupoB;
          
          const aSuperGrupo = a.groupname.toLowerCase().includes('super');
          const bSuperGrupo = b.groupname.toLowerCase().includes('super');
          
          if (aSuperGrupo && !bSuperGrupo) return -1;
          if (!aSuperGrupo && bSuperGrupo) return 1;
          
          const aAuxiliar = a.groupname.toLowerCase().includes('auxiliar') || a.groupname.toLowerCase().includes('auxiliary');
          const bAuxiliar = b.groupname.toLowerCase().includes('auxiliar') || b.groupname.toLowerCase().includes('auxiliary');
          
          if (aAuxiliar && !bAuxiliar) return -1;
          if (!aAuxiliar && bAuxiliar) return 1;
          
          return `${a.fname} ${a.lname}`.localeCompare(`${b.fname} ${b.lname}`);
        });
        
        // Actualizar el grupo seleccionado al nuevo grupo
        setSelectedGroup(valor);
        
        // Encontrar el nuevo índice del publicador editado
        const nuevoIndice = copiaOrdenada.findIndex(p => p.id === publicadorActual.id);
        setSelectedPub(nuevoIndice);
        
        return copiaOrdenada;
      }
      
      return copia;
    });
  };

  /* ======================
     ELIMINAR PUBLICADOR
  ====================== */
  const eliminarPublicador = () => {
    if (selectedPub === null) return;
    
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar a ${pubs[selectedPub].fname} ${pubs[selectedPub].lname}?`
    );
    
    if (!confirmar) return;
    
    setPubs(prev => {
      const copia = prev.filter((_, i) => i !== selectedPub);
      
      // Seleccionar el siguiente publicador del mismo grupo si existe
      if (copia.length > 0) {
        if (selectedPub < copia.length) {
          setSelectedPub(selectedPub);
        } else {
          setSelectedPub(copia.length - 1);
        }
      } else {
        setSelectedPub(null);
        setSelectedGroup(null);
      }
      
      return copia;
    });
  };

  /* ======================
     EDITAR MES
  ====================== */
  const editarMes = (mesIndex: number, campo: keyof MonthData, valor: string) => {
    if (selectedPub === null) return;
    setPubs(prev => {
      const copia = [...prev];
      const mesesCopia = [...copia[selectedPub].months];
      mesesCopia[mesIndex] = { ...mesesCopia[mesIndex], [campo]: valor };
      copia[selectedPub] = { ...copia[selectedPub], months: mesesCopia };
      return copia;
    });
  };

  /* ======================
     GENERAR XML
  ====================== */
  const generarXML = (): string => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<PUBLIST>\n`;
    xml += `<Agent Ver="${meta.agentVer}">${meta.agent}</Agent>\n`;
    xml += `<Date>${meta.date}</Date>\n`;
    xml += `<Count>${pubs.length}</Count>\n`;
    xml += `<Active>\n`;

    pubs.forEach(p => {
      xml += `<Pub>\n`;
      xml += `<id>${p.id}</id>\n`;
      xml += `<fname>${p.fname}</fname>\n`;
      xml += `<lname>${p.lname}</lname>\n`;
      xml += `<addr>${p.addr}</addr>\n`;
      xml += `<phone>${p.phone}</phone>\n`;
      xml += `<phone2>${p.phone2}</phone2>\n`;
      xml += `<phone3>${p.phone3}</phone3>\n`;
      xml += `<gender>${p.gender}</gender>\n`;
      xml += `<birdate>${p.birdate}</birdate>\n`;
      xml += `<bapdate>${p.bapdate}</bapdate>\n`;
      xml += `<group>${p.group}</group>\n`;
      xml += `<groupname>${p.groupname}</groupname>\n`;
      xml += `<status>${p.status}</status>\n`;
      xml += `<pioneer>${p.pioneer}</pioneer>\n`;

      p.months.forEach(m => {
        xml += `<${m.month} Year="${m.year}">\n`;
        xml += `<Plcmts>${m.plcmts}</Plcmts>\n`;
        xml += `<Videos>${m.videos}</Videos>\n`;
        xml += `<Hours>${m.hours}</Hours>\n`;
        xml += `<R.V.s>${m.rvs}</R.V.s>\n`;
        xml += `<BiSt.>${m.bist}</BiSt.>\n`;
        xml += `<Remark>${m.remark}</Remark>\n`;
        xml += `<Pio>${m.pio}</Pio>\n`;
        xml += `</${m.month}>\n`;
      });

      xml += `</Pub>\n`;
    });

    xml += `</Active>\n</PUBLIST>`;
    return xml;
  };

  /* ======================
     DESCARGAR XML
  ====================== */
  const descargarXML = () => {
    const xml = generarXML();
    const blob = new Blob([xml], { type: "text/xml;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "publicadores_editado.xml";
    a.click();
    URL.revokeObjectURL(url);
  };

  const pub = selectedPub !== null ? pubs[selectedPub] : null;

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">📋 Editor de Publicadores XML</h1>
          
          <div className="flex gap-3 mb-4">
            <label className="px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition shadow-md font-semibold">
              📁 Cargar XML
              <input type="file" accept=".xml" onChange={subirXML} className="hidden" />
            </label>
            {pubs.length > 0 && (
              <>
                <button onClick={descargarXML} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md font-semibold">
                  💾 Descargar XML Editado
                </button>
                {selectedGroup && (
                  <button onClick={descargarCaptura} className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-md font-semibold">
                    📸 Captura Grupo {selectedGroup}
                  </button>
                )}
              </>
            )}
          </div>

          {meta.agent && (
            <div className="flex gap-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
              <span><strong>Agente:</strong> {meta.agent} v{meta.agentVer}</span>
              <span><strong>Fecha:</strong> {meta.date}</span>
              <span><strong>Total:</strong> {pubs.length} publicadores</span>
            </div>
          )}
        </div>

        {pubs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📂</div>
            <p className="text-xl text-gray-600">Carga un archivo XML para comenzar</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            {/* SELECTOR DE GRUPOS */}
            <div className="col-span-1 bg-white rounded-xl shadow-lg p-4">
              <h2 className="text-lg font-bold mb-3 text-gray-700">Grupos</h2>
              <div className="space-y-2">
                {grupos.map(grupo => {
                  const cantidadActivos = pubs.filter(p => {
                    const status = (p.status || 'activo').toLowerCase();
                    const esActivo = !status.includes('inactivo') && !status.includes('inactive') && 
                                    !status.includes('expulsado') && !status.includes('expelled');
                    return p.group === grupo && esActivo;
                  }).length;
                  
                  return (
                    <button
                      key={grupo}
                      onClick={() => {
                        setSelectedGroup(grupo);
                        const primerPubDelGrupo = pubs.findIndex(p => p.group === grupo);
                        setSelectedPub(primerPubDelGrupo);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition font-semibold ${
                        selectedGroup === grupo 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      Grupo {grupo}
                      <div className="text-xs opacity-75 font-normal">
                        {cantidadActivos} publicadores
                      </div>
                    </button>
                  );
                })}
                
                {/* BOTÓN DE INACTIVOS */}
                <button
                  onClick={() => {
                    setSelectedGroup('inactivos');
                    const primerInactivo = pubs.findIndex(p => {
                      const status = (p.status || 'activo').toLowerCase();
                      return status.includes('inactivo') || status.includes('inactive') || 
                             status.includes('expulsado') || status.includes('expelled');
                    });
                    setSelectedPub(primerInactivo >= 0 ? primerInactivo : null);
                  }}
                  className={`w-full text-left p-3 rounded-lg transition font-semibold ${
                    selectedGroup === 'inactivos' 
                      ? 'bg-gray-600 text-white shadow-md' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  🚫 Inactivos
                  <div className="text-xs opacity-75 font-normal">
                    {pubs.filter(p => {
                      const status = (p.status || 'activo').toLowerCase();
                      return status.includes('inactivo') || status.includes('inactive') || 
                             status.includes('expulsado') || status.includes('expelled');
                    }).length} publicadores
                  </div>
                </button>
              </div>
            </div>

            {/* LISTA DE PUBLICADORES DEL GRUPO */}
            <div className="col-span-1 bg-white rounded-xl shadow-lg p-4 max-h-[calc(100vh-250px)] overflow-y-auto">
              <h2 className="text-lg font-bold mb-3 text-gray-700 sticky top-0 bg-white pb-2">
                {selectedGroup === 'inactivos' ? '🚫 Inactivos' : `Grupo ${selectedGroup}`}
              </h2>
              {pubsDelGrupo.map((p, i) => {
                const pubIndex = pubs.findIndex(pub => pub.id === p.id);
                const isSuperGrupo = p.groupname.toLowerCase().includes('super');
                const isAuxiliar = p.groupname.toLowerCase().includes('auxiliar') || p.groupname.toLowerCase().includes('auxiliary');
                const etiquetas = obtenerEtiquetas(p);
                const generoES = p.gender === 'Male' ? 'Hombre' : p.gender === 'Female' ? 'Mujer' : p.gender;
                
                return (
                  <div key={i}>
                    {i === 0 && isSuperGrupo && selectedGroup !== 'inactivos' && (
                      <div className="text-xs font-bold text-amber-600 mb-2 px-2">
                        🤝 SUPERINTENDENTE DE GRUPO
                      </div>
                    )}
                    {i === 1 && isAuxiliar && !isSuperGrupo && selectedGroup !== 'inactivos' && (
                      <div className="text-xs font-bold text-orange-600 mb-2 px-2">
                        🤝 AUXILIAR DE GRUPO
                      </div>
                    )}
                    {i === 0 && isAuxiliar && !isSuperGrupo && selectedGroup !== 'inactivos' && (
                      <div className="text-xs font-bold text-orange-600 mb-2 px-2">
                        🤝 AUXILIAR DE GRUPO
                      </div>
                    )}
                    <button
                      onClick={() => setSelectedPub(pubIndex)}
                      className={`w-full text-left p-2 md:p-3 rounded-lg mb-2 transition text-sm md:text-base ${
                        selectedPub === pubIndex 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <div className="font-semibold">{p.fname} {p.lname}</div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {etiquetas.map((etiq, idx) => (
                          <span
                            key={idx}
                            className={`text-xs px-2 py-0.5 rounded text-white ${etiq.color}`}
                          >
                            {etiq.texto}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        ID: {p.id} • {generoES}
                        {selectedGroup === 'inactivos' && ` • Grupo ${p.group}`}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* DETALLES DEL PUBLICADOR */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4 md:p-6 max-h-[calc(100vh-250px)] overflow-y-auto">
              {pub && (
                <>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-3 w-full sm:w-auto">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                        {pub.fname} {pub.lname}
                      </h2>
                      <div className="flex gap-2 flex-wrap">
                        {obtenerEtiquetas(pub).map((etiq, idx) => (
                          <span
                            key={idx}
                            className={`text-xs md:text-sm px-2 md:px-3 py-1 rounded-full text-white ${etiq.color}`}
                          >
                            {etiq.texto}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={eliminarPublicador}
                      className="w-full sm:w-auto px-3 md:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-md font-semibold text-sm md:text-base"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>

                  {/* INFORMACIÓN PERSONAL */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 md:p-5 mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-3 md:mb-4">📝 Información Personal</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      {[
                        { label: 'ID', field: 'id', type: 'text' },
                        { label: 'Nombre', field: 'fname', type: 'text' },
                        { label: 'Apellido', field: 'lname', type: 'text' },
                        { label: 'Dirección', field: 'addr', type: 'text' },
                        { label: 'Teléfono 1', field: 'phone', type: 'text' },
                        { label: 'Teléfono 2', field: 'phone2', type: 'text' },
                        { label: 'Teléfono 3', field: 'phone3', type: 'text' },
                        { label: 'Género', field: 'gender', type: 'select' },
                        { label: 'Fecha Nacimiento', field: 'birdate', type: 'date' },
                        { label: 'Fecha Bautismo', field: 'bapdate', type: 'date' },
                        { label: 'Grupo', field: 'group', type: 'text', cambioGrupo: true }
                      ].map(({ label, field, type, cambioGrupo }) => (
                        <div key={field}>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            {label}
                            {cambioGrupo && <span className="text-xs text-orange-600 ml-1">(⚠️ Cambia de grupo)</span>}
                          </label>
                          {type === 'select' && field === 'gender' ? (
                            <select
                              value={pub.gender}
                              onChange={e => editarCampo('gender', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                              <option value="">Seleccionar</option>
                              <option value="Male">Hombre</option>
                              <option value="Female">Mujer</option>
                            </select>
                          ) : (
                            <input
                              type={type}
                              value={pub[field as keyof Publicador] as string}
                              onChange={e => editarCampo(field as keyof Publicador, e.target.value)}
                              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none ${
                                cambioGrupo ? 'focus:ring-orange-500 border-orange-300' : 'focus:ring-blue-500'
                              }`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* PRIVILEGIOS Y ROL */}
                    <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-300">
                      <h4 className="text-sm md:text-base font-semibold text-gray-700 mb-2 md:mb-3">👔 Privilegios y Rol en el Grupo</h4>
                      
                      {/* Rol en Grupo */}
                      <div className="mb-3">
                        <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1 md:mb-2">
                          Rol en Grupo
                        </label>
                        <input
                          type="text"
                          value={pub.groupname}
                          onChange={e => editarCampo('groupname', e.target.value)}
                          placeholder="Ej: Super de grupo, Auxiliar de grupo"
                          className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      
                      {/* Checkboxes de Privilegios */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pub.groupname.toLowerCase().includes('super')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (!pub.groupname.toLowerCase().includes('super')) {
                                  editarCampo('groupname', pub.groupname ? `${pub.groupname} Super` : 'Super de grupo');
                                }
                              } else {
                                editarCampo('groupname', pub.groupname.replace(/super\s*(de\s*grupo)?/gi, '').trim());
                              }
                            }}
                            className="w-4 h-4 text-amber-600 rounded focus:ring-2 focus:ring-amber-500"
                          />
                          <span className="text-xs md:text-sm font-medium">
                            <span className="px-2 py-1 bg-amber-600 text-white rounded text-xs">Super de Grupo</span>
                          </span>
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pub.groupname.toLowerCase().includes('auxiliar') || pub.groupname.toLowerCase().includes('auxiliary')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (!pub.groupname.toLowerCase().includes('auxiliar')) {
                                  editarCampo('groupname', pub.groupname ? `${pub.groupname} Auxiliar` : 'Auxiliar de grupo');
                                }
                              } else {
                                editarCampo('groupname', pub.groupname.replace(/auxiliar(\s*de\s*grupo)?|auxiliary/gi, '').trim());
                              }
                            }}
                            className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                          />
                          <span className="text-xs md:text-sm font-medium">
                            <span className="px-2 py-1 bg-orange-500 text-white rounded text-xs">Auxiliar de Grupo</span>
                          </span>
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pub.groupname.toLowerCase().includes('anciano') || pub.groupname.toLowerCase().includes('elder')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (!pub.groupname.toLowerCase().includes('anciano')) {
                                  editarCampo('groupname', pub.groupname ? `${pub.groupname} Anciano` : 'Anciano');
                                }
                              } else {
                                editarCampo('groupname', pub.groupname.replace(/anciano|elder/gi, '').trim());
                              }
                            }}
                            className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                          />
                          <span className="text-xs md:text-sm font-medium">
                            <span className="px-2 py-1 bg-red-500 text-white rounded text-xs">Anciano</span>
                          </span>
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pub.groupname.toLowerCase().includes('ministerial') || pub.groupname.toLowerCase().includes('servant')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (!pub.groupname.toLowerCase().includes('ministerial')) {
                                  editarCampo('groupname', pub.groupname ? `${pub.groupname} Ministerial` : 'Siervo Ministerial');
                                }
                              } else {
                                editarCampo('groupname', pub.groupname.replace(/ministerial|siervo\s*ministerial|servant/gi, '').trim());
                              }
                            }}
                            className="w-4 h-4 text-sky-600 rounded focus:ring-2 focus:ring-sky-500"
                          />
                          <span className="text-xs md:text-sm font-medium">
                            <span className="px-2 py-1 bg-sky-500 text-white rounded text-xs">Siervo Ministerial</span>
                          </span>
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(pub.pioneer || '').toLowerCase().includes('regular') || (pub.pioneer || '').toLowerCase() === 'reg'}
                            onChange={(e) => {
                              if (e.target.checked) {
                                editarCampo('pioneer', 'Regular');
                              } else {
                                editarCampo('pioneer', '');
                              }
                            }}
                            className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                          />
                          <span className="text-xs md:text-sm font-medium">
                            <span className="px-2 py-1 bg-green-500 text-white rounded text-xs">Precursor Regular</span>
                          </span>
                        </label>
                      </div>
                      
                      {/* Estado - Checkboxes */}
                      <div className="pt-2 md:pt-3 border-t border-gray-200">
                        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                          🔄 Estado del Publicador
                        </label>
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(pub.status || 'activo').toLowerCase().includes('inactivo')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  editarCampo('status', 'Inactivo');
                                } else {
                                  editarCampo('status', 'Activo');
                                }
                              }}
                              className="w-4 h-4 text-gray-600 rounded focus:ring-2 focus:ring-gray-500"
                            />
                            <span className="text-xs md:text-sm font-medium">
                              <span className="px-2 py-1 bg-gray-500 text-white rounded text-xs">Inactivo</span>
                            </span>
                          </label>
                          
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(pub.status || 'activo').toLowerCase().includes('expulsado')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  editarCampo('status', 'Expulsado');
                                } else {
                                  editarCampo('status', 'Activo');
                                }
                              }}
                              className="w-4 h-4 text-gray-800 rounded focus:ring-2 focus:ring-gray-700"
                            />
                            <span className="text-xs md:text-sm font-medium">
                              <span className="px-2 py-1 bg-gray-700 text-white rounded text-xs">Expulsado</span>
                            </span>
                          </label>
                        </div>
                        <p className="text-xs text-red-600 mt-2">
                          ⚠️ Los inactivos y expulsados no aparecen en los grupos, solo en la pestaña "Inactivos"
                        </p>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2 md:mt-3">
                        💡 Puedes marcar múltiples privilegios. Ejemplo: Anciano + Super de Grupo + Precursor Regular
                      </p>
                    </div>
                  </div>

                  {/* REGISTROS MENSUALES */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 md:p-5">
                    <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-3 md:mb-4">📊 Registros Mensuales</h3>
                    <div className="space-y-2 md:space-y-3">
                      {pub.months.map((mes, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 md:p-4 shadow-sm border border-gray-200">
                          <div className="font-semibold text-sm md:text-base text-gray-700 mb-2 md:mb-3">
                            {traducirMes(mes.month)} {mes.year}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
                            {[
                              { label: 'Publicaciones', field: 'plcmts' },
                              { label: 'Videos', field: 'videos' },
                              { label: 'Horas', field: 'hours' },
                              { label: 'Revisitas', field: 'rvs' },
                              { label: 'Estudios', field: 'bist' },
                              { label: 'Pionero', field: 'pio' }
                            ].map(({ label, field }) => (
                              <div key={field}>
                                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                                <input
                                  type="text"
                                  value={mes[field as keyof MonthData]}
                                  onChange={e => editarMes(i, field as keyof MonthData, e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
