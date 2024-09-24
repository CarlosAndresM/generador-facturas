const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('facturas.db');

// Función para agregar una tienda
function agregarTienda(nombre, ubicacion, codigo, callback) {
    const sql = 'INSERT INTO tiendas (nombre, ubicacion, codigo) VALUES (?, ?, ?)';
    db.run(sql, [nombre, ubicacion, codigo], callback);
}

// Función para obtener todas las tiendas
function obtenerTiendas(callback) {
    db.all('SELECT * FROM tiendas', [], callback);
}

// Función para agregar una factura
function agregarFactura(tienda_id, fecha, callback) {
    const sql = 'INSERT INTO facturas (tienda_id, fecha) VALUES (?, ?)';
    db.run(sql, [tienda_id, fecha], function(err) {
        callback(err, this.lastID);
    });
}

// Función para agregar detalles de la factura
function agregarDetalleFactura(factura_id, producto, precio, cantidad, callback) {
    const sql = 'INSERT INTO detalles_factura (factura_id, producto, precio, cantidad) VALUES (?, ?, ?, ?)';
    db.run(sql, [factura_id, producto, precio, cantidad], callback);
}

// Función para obtener el historial de compras
function obtenerHistorial(tienda_id, callback) {
    const sql = `
        SELECT f.id, f.fecha, COUNT(df.id) AS cantidad_productos
        FROM facturas f
        JOIN detalles_factura df ON f.id = df.factura_id
        WHERE f.tienda_id = ?
        GROUP BY f.id
    `;
    db.all(sql, [tienda_id], callback);
}

module.exports = {
    agregarTienda,
    obtenerTiendas,
    agregarFactura,
    agregarDetalleFactura,
    obtenerHistorial,
};
