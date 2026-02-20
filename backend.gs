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
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetApp = ss.getSheetByName(HOJA_APP);
    if (!sheetApp) return;

    const responses = e.namedValues;
    
    // Mapeo dinámico (ajusta los nombres de las columnas de tu Formulario si es necesario)
    const nombre = responses['Nombre de la Prenda'] ? responses['Nombre de la Prenda'][0] : "Producto Nuevo";
    const marca = responses['Marca'] ? responses['Marca'][0] : "DLUX";
    const linea = responses['Línea / Colección'] ? responses['Línea / Colección'][0] : "TODO";
    const categoria = responses['Categoría'] ? responses['Categoría'][0] : "General";
    const tallas = responses['Tallas'] ? responses['Tallas'][0] : "Única";
    const colores = responses['Colores'] ? responses['Colores'][0] : "Único";
    const precio = responses['Precio de Venta'] ? responses['Precio de Venta'][0] : "0";
    const stock = responses['Stock Inicial'] ? responses['Stock Inicial'][0] : "1";
    const url = responses['URL Imagen'] ? responses['URL Imagen'][0] : "";

    const idSistema = "DLX-" + Math.floor(100000 + Math.random() * 900000);
    const sku = marca.substring(0,2).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000);

    // [ID_SISTEMA, FECHA_INGRESO, NOMBRE_PRENDA, SKU, MARCA, LINEA, CATEGORIA, TALLAS_UNIFICADAS, COLORES, COSTO_COMPRA, PRECIO_VENTA, STOCK, URL_IMAGEN, ESTADO]
    const row = [
      idSistema,
      new Date(),
      nombre,
      sku,
      marca,
      linea,
      categoria,
      tallas,
      colores,
      0, // Costo por defecto
      precio,
      stock,
      url,
      "ACTIVO"
    ];

    sheetApp.appendRow(row);
    Logger.log("Sincronizado: " + nombre);
  } catch (err) {
    Logger.log("Error sync: " + err.message);
  }
}

/**
 * Instalador (Ya proporcionado por el usuario)
 */
function instalarEntornoDLUX() {
  // ... (Tu código de instalación aquí)
}
