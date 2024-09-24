    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const fs = require('fs'); 
    const puppeteer = require('puppeteer');

    const PDFDocument = require('pdfkit');


    // Crear y conectar a la base de datos
    let db = new sqlite3.Database(path.join(__dirname, 'facturas.db'), (err) => {
        if (err) {
            console.error('Error al conectar a la base de datos', err.message);
        } else {
            console.log('Conectado a la base de datos SQLite.');
        }
    });

    // Crear las tablas
    const initDatabase = () => {
        db.run(`CREATE TABLE IF NOT EXISTS tiendas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            ubicacion TEXT NOT NULL,
            codigo TEXT NOT NULL UNIQUE
        );`, (err) => {
            if (err) {
                console.error('Error al crear la tabla de tiendas', err.message);
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS facturas (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             tienda_id INTEGER,
             fecha TEXT NOT NULL,
            imagen TEXT, 
            FOREIGN KEY (tienda_id) REFERENCES tiendas(id)
        );`, (err) => {
            if (err) {
                console.error('Error al crear la tabla de facturas', err.message);
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS detalles_factura (   
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            factura_id INTEGER,
            producto TEXT NOT NULL,
            precio REAL NOT NULL,
            cantidad INTEGER NOT NULL,
            FOREIGN KEY (factura_id) REFERENCES facturas(id)
        );`, (err) => {
            if (err) {
                console.error('Error al crear la tabla de detalles de factura', err.message);
            }
        });
    };

    // Funciones para manejar la base de datos
    const agregarTienda = (nombre, ubicacion, codigo, callback) => {
        const sql = 'INSERT INTO tiendas (nombre, ubicacion, codigo) VALUES (?, ?, ?)';
        db.run(sql, [nombre, ubicacion, codigo], callback);
    };

    const obtenerTiendas = (callback) => {
        db.all('SELECT * FROM tiendas', [], callback);
    };

    const agregarProducto = (factura_id, producto, precio, cantidad, callback) => {
        const sql = 'INSERT INTO detalles_factura (factura_id, producto, precio, cantidad) VALUES (?, ?, ?, ?)';
        db.run(sql, [factura_id, producto, precio, cantidad], callback);
    };
    

    const agregarFactura = (tienda_id, fecha,imagenPath, callback) => {
        const sql = 'INSERT INTO facturas (tienda_id, fecha, imagen) VALUES (?, ?, ?)';
        db.run(sql, [tienda_id, fecha, imagenPath], function(err) {    
            callback(err, this.lastID);
        });
    };

    const agregarDetalleFactura = (factura_id, producto, precio, cantidad, callback) => {
        const sql = 'INSERT INTO detalles_factura (factura_id, producto, precio, cantidad) VALUES (?, ?, ?, ?)';
        db.run(sql, [factura_id, producto, precio, cantidad], callback);
    };
 
    // const generarFactura = async (factura_id, callback) => {
    //     const pdfPath = path.join(__dirname, `factura_${factura_id}.pdf`);
        
    //     // Obtener los detalles de la factura
    //     const sql = `
    // SELECT df.producto, df.precio, df.cantidad, f.fecha, t.nombre AS tienda
    // FROM detalles_factura df
    // JOIN facturas f ON df.factura_id = f.id
    // JOIN tiendas t ON f.tienda_id = t.id
    // WHERE df.factura_id = ?
    //     `;

        
    //     db.all(sql, [factura_id], async (err, rows) => {
            
    //     console.log('Prueba de datos: ', rows)
    //         if (err) {
    //             return callback(err);
    //         }
    
    //         if (rows.length === 0) {
    //             return callback(new Error('No hay detalles para la factura.'));
    //         }
    
    //         // Generar el contenido HTML
    //         const total = rows.reduce((acc, row) => {
                
    //     console.log('Prueba de datos antes de generar contenido html: ', rows)
    //             return acc + (row.precio * row.cantidad);
    //         }, 0);
    
    //         const html = `
    //             <html>
    //             <head>
    //                 <style>
    //                     body { font-family: Arial, sans-serif; }
    //                     h1 { text-align: center; }
    //                     table { width: 100%; border-collapse: collapse; }
    //                     th, td { border: 1px solid #000; padding: 8px; text-align: left; }
    //                     th { background-color: #f2f2f2; }
    //                 </style>
    //             </head>
    //             <body>
    //                 <h1>Factura</h1>
    //                 <p>Tienda: ${rows[0].tienda}</p>
    //                 <p>Fecha: ${rows[0].fecha}</p>
    //                 <table>
    //                     <thead>
    //                         <tr>
    //                             <th>Producto</th>
    //                             <th>Cantidad</th>
    //                             <th>Precio</th>
    //                             <th>Subtotal</th>
    //                         </tr>
    //                     </thead>
    //                     <tbody>
    //                         ${rows.map(row => `
    //                             <tr>
    //                                 <td>${row.producto}</td>
    //                                 <td>${row.cantidad}</td>
    //                                 <td>$${row.precio.toFixed(2)}</td>
    //                                 <td>$${(row.precio * row.cantidad).toFixed(2)}</td>
    //                             </tr>
    //                         `).join('')}
    //                     </tbody>
    //                 </table>
    //                 <h2>Total: $${total.toFixed(2)}</h2>
    //             </body>
    //             </html>
    //         `;
    
    //         // Generar el PDF con Puppeteer
    //         const browser = await puppeteer.launch();
    //         const page = await browser.newPage();
    //         await page.setContent(html);
    //         await page.pdf({
    //             path: pdfPath,
    //             format: 'A4',
    //             printBackground: true
    //         });
    //         await browser.close();
            
    //         callback(null, pdfPath);
    //     });
    // };
     


// Función generarFactura actualizada para incluir la imagen
const generarFactura = async (factura_id, evidenciaPath, callback) => {
    const pdfPath = path.join(__dirname, `factura_${factura_id}.pdf`);

    console.log('Prueba de ruta, ', evidenciaPath);

    // Asegúrate de construir la ruta de la imagen correctamente
    const imagePath = `http://localhost:3000/${evidenciaPath}`;

    // Obtener detalles de la factura
    const sql = `
        SELECT df.producto, df.precio, df.cantidad, f.fecha, t.nombre AS tienda
        FROM detalles_factura df
        JOIN facturas f ON df.factura_id = f.id
        JOIN tiendas t ON f.tienda_id = t.id
        WHERE df.factura_id = ?`;

    db.all(sql, [factura_id], async (err, rows) => {
        if (err) {
            return callback(err);
        }

        if (rows.length === 0) {
            return callback(new Error('No hay detalles para la factura.'));
        }

        // Calcular total
        const total = rows.reduce((acc, row) => acc + (row.precio * row.cantidad), 0);

        // Formatear fecha
        const fecha = new Date(rows[0].fecha);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        const fechaFormateada = fecha.toLocaleDateString('es-ES', options);

        // Formatear total con separador de miles
        const totalFormateado = total.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });

        // Generar contenido HTML
        const html = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    h1 { text-align: center; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    img { width: 300px; height: 300px; }
                </style>
            </head>
            <body>
                <h1>Factura</h1>
                <p>Tienda: ${rows[0].tienda}</p>
                <p>Fecha: ${fechaFormateada}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(row => `
                            <tr>
                                <td>${row.producto}</td>
                                <td>${row.cantidad}</td>
                                <td>${row.precio.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                                <td>${(row.precio * row.cantidad).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <h2>Total: ${totalFormateado}</h2>

                ${evidenciaPath ? `<img src="${imagePath}" style="max-width: 100%; height: auto;" />` : ''}
            </body>
            </html>
        `;

        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(html);
            await page.pdf({
                path: pdfPath,
                format: 'A4',
                printBackground: true
            });
            await browser.close();
            callback(null, pdfPath);
        } catch (pdfError) {
            console.error('Error al generar PDF:', pdfError);
            callback(pdfError);
        }
    });
};



    

    const obtenerHistorial = (tienda_id, callback) => {
        const sql = `
            SELECT f.id, f.fecha, SUM(df.cantidad * df.precio) AS total, COUNT(DISTINCT df.producto) AS cantidad_productos
            FROM facturas f
            JOIN detalles_factura df ON f.id = df.factura_id
            WHERE f.tienda_id = ?
            GROUP BY f.id
        `;
        db.all(sql, [tienda_id], callback);
    };
    
    const obtenerDetallesFactura = (factura_id, callback) => {
        const sql = `
            SELECT producto, precio, cantidad
            FROM detalles_factura
            WHERE factura_id = ?
        `;
        db.all(sql, [factura_id], callback);
    };
    
    const borrarFactura = (factura_id, callback) => {
        const sql = 'DELETE FROM facturas WHERE id = ?';
        db.run(sql, [factura_id], (err) => {
            if (err) {
                callback(err);
                return;
            }
    
            const deleteDetallesSql = 'DELETE FROM detalles_factura WHERE factura_id = ?';
            db.run(deleteDetallesSql, [factura_id], callback);
        });
    };
    const actualizarImagenFactura = (factura_id, nuevaImagenPath, callback) => {
        const sql = 'UPDATE facturas SET imagen = ? WHERE id = ?';
        db.run(sql, [nuevaImagenPath, factura_id], function(err) {
            callback(err, this.changes); // this.changes te dirá cuántas filas se actualizaron
        });
    };
    const obtenerImagenFactura = (factura_id, callback) => {
        const sql = 'SELECT imagen FROM facturas WHERE id = ?';
        db.get(sql, [factura_id], callback);
    };
    

    // Exportar funciones
    module.exports = {
        initDatabase,
        agregarTienda,
        obtenerTiendas,
        agregarFactura,
        obtenerImagenFactura,
        agregarDetalleFactura,
        obtenerHistorial,
        agregarProducto,
        generarFactura,
        obtenerDetallesFactura,
        actualizarImagenFactura,
        borrarFactura,
        closeDatabase: () => db.close()
    };
