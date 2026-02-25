/**
 * SISTEMA DLUX - BACKEND (Google Apps Script)
 * Versión: 2.0.0
 * 
 * Instrucciones:
 * 1. Copia este código en tu proyecto de Google Apps Script.
 * 2. Guarda el proyecto.
 * 3. Configura un ACTIVADOR (Trigger): 
 *    - Función: syncFormToInventory
 *    - Evento: De la hoja de cálculo -> Al enviar formulario.
 * 4. Despliega como Aplicación Web (Acceso: Cualquiera).
 */

const HOJA_RESPUESTAS = "Respuestas de formulario 1";
const HOJA_APP = "INVENTARIO_APP";
const HOJA_CONFIG = "CONFIG";

/**
 * Servidor API para la PWA (doGet)
 * Devuelve tanto el catálogo como la configuración.
 */
function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Obtener Inventario
  const sheetApp = ss.getSheetByName(HOJA_APP);
  const dataApp = sheetApp ? sheetApp.getDataRange().getValues() : [];
  const headersApp = dataApp.shift() || [];
  const catalog = dataApp.map(row => {
    let obj = {};
    headersApp.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  // 2. Obtener Configuración (Categorías, Líneas, etc.)
  const sheetConfig = ss.getSheetByName(HOJA_CONFIG);
  const dataConfig = sheetConfig ? sheetConfig.getDataRange().getValues() : [];
  const headersConfig = dataConfig.shift() || [];
  const config = {};
  
  headersConfig.forEach((h, i) => {
    config[h] = dataConfig.map(row => row[i]).filter(val => val !== "");
  });

  const response = {
    catalog: catalog,
    config: config,
    status: "success",
    timestamp: new Date().toISOString()
  };

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Sincronización Automática Formulario -> Inventario
 */
function syncFormToInventory(e) {
  try {
    if (!e || !e.namedValues) {
      Logger.log("Aviso: La función se ejecutó manualmente o sin parámetros. Usa 'recuperarUltimasRespuestas' para procesar datos existentes.");
      return;
    }
    
    Logger.log("Sincronizando desde trigger. Datos: " + JSON.stringify(e.namedValues));
    procesarDatosDeFormulario(e.namedValues);
    
  } catch (err) {
    Logger.log("Error en syncFormToInventory: " + err.message);
  }
}

/**
 * Normalización extrema: quita acentos, espacios, puntos, signos y lo pasa a minúsculas.
 */
function superNormalize(str) {
  if (!str) return "";
  return str.toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .replace(/[^a-z0-9]/g, "") // Quitar todo lo que no sea letra o número
    .trim();
}

/**
 * Función central de mapeo: Busca un valor en el objeto de respuestas
 * usando la normalización extrema.
 */
function obtenerValor(responses, keyToFind) {
  const searchKey = superNormalize(keyToFind);
  
  for (let k in responses) {
    if (superNormalize(k) === searchKey) {
      return responses[k] ? responses[k][0] : "";
    }
  }
  return "";
}

/**
 * Función para procesar y guardar los datos en el inventario
 */
function procesarDatosDeFormulario(responses) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetApp = ss.getSheetByName(HOJA_APP);
  
  if (!sheetApp) {
    Logger.log("Error: No se encontró la hoja '" + HOJA_APP + "'");
    return;
  }

  // Mapeo robusto con superNormalización
  const nombre = obtenerValor(responses, 'Nombre de la Prenda');
  const skuForm = obtenerValor(responses, 'SKU / Codigo');
  const marca = obtenerValor(responses, 'Marca');
  const linea = obtenerValor(responses, 'Linea');
  const categoria = obtenerValor(responses, 'Tipo de Articulo');
  const tallas = obtenerValor(responses, 'Talles Disponibles');
  const colores = obtenerValor(responses, 'Colores Disponibles');
  const costo = obtenerValor(responses, 'Costo de Compra');
  const precio = obtenerValor(responses, 'Precio de Venta');
  const stock = obtenerValor(responses, 'Stock Fisico');
  const url = obtenerValor(responses, 'FOTOGRAFIA');

  // Si el SKU viene del formulario, lo usamos. Si no, generamos uno.
  const skuFinal = skuForm && skuForm !== "" ? skuForm : ("DLX-" + Math.floor(100000 + Math.random() * 900000));

  // --- PREVENCIÓN DE DUPLICADOS ---
  const dataApp = sheetApp.getDataRange().getValues();
  const existe = dataApp.some(row => row[0].toString().trim() === skuFinal.toString().trim());

  if (existe) {
    Logger.log("Omitido: El SKU '" + skuFinal + "' ya existe.");
    return;
  }
  // --------------------------------

  const row = [
    skuFinal,  
    new Date(),
    nombre || "Sin Nombre", 
    skuFinal,  
    marca || "DLUX",
    linea || "TODO",
    categoria || "General",
    tallas || "Única",
    colores || "Único",
    costo || 0,
    precio || 0,
    stock || 1,
    url || "",
    "ACTIVO"
  ];

  sheetApp.appendRow(row);
  Logger.log("¡ÉXITO! Sincronizado: " + (nombre || skuFinal));
}

/**
 * HERRAMIENTA DE RECUPERACIÓN:
 * Busca automáticamente la hoja de respuestas y procesa las últimas filas.
 */
function recuperarUltimasRespuestas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetResp = ss.getSheetByName(HOJA_RESPUESTAS);
  
  // Si no la encuentra por el nombre fijo, intentamos buscar una que diga "Form" o "Respuesta"
  if (!sheetResp) {
    const sheets = ss.getSheets();
    sheetResp = sheets.find(s => {
      const name = s.getName().toLowerCase();
      return name.includes("form") || name.includes("respuesta");
    });
  }

  if (!sheetResp) {
    Logger.log("Error: No se encontró ninguna hoja que parezca ser de respuestas.");
    return;
  }

  Logger.log("Usando hoja de respuestas: " + sheetResp.getName());
  const data = sheetResp.getDataRange().getValues();
  const headers = data[0];
  
  // Procesar las últimas 5 filas (evitando el encabezado)
  const startRow = Math.max(1, data.length - 5);
  Logger.log("Iniciando recuperación de las últimas " + (data.length - startRow) + " respuestas...");

  for (let i = startRow; i < data.length; i++) {
    const rowData = data[i];
    const fakeNamedValues = {};
    
    // Mapeamos los datos de la fila según los encabezados de la hoja
    headers.forEach((header, index) => {
      fakeNamedValues[header] = [rowData[index]];
    });

    Logger.log("Recuperando fila " + (i + 1) + ": " + (rowData[2] || "Sin Nombre"));
    procesarDatosDeFormulario(fakeNamedValues);
  }
}

/**
 * Instalador (Ya proporcionado por el usuario)
 */
function instalarEntornoDLUX() {
  // ... (Tu código de instalación aquí)
}
