const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit'); 
const fs = require('fs');
const path = require('path');

const multer = require('multer'); 
 

const { initDatabase, agregarTienda, obtenerTiendas,borrarFactura, agregarProducto, generarFactura,actualizarImagenFactura, agregarFactura, obtenerDetallesFactura, obtenerHistorial, obtenerImagenFactura } = require('../database');  

const app = express();
const port = 3000;
app.use(bodyParser.json());
app.use(express.static('public')); // Servir archivos estáticos

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const cors = require('cors');
app.use(cors());
// Inicializar la base de datos
initDatabase();

// Endpoint para agregar una tienda
app.post('/agregar-tienda', (req, res) => {
  const { nombre, ubicacion, codigo } = req.body;
  console.log('Datos recibidos para agregar tienda:', { nombre, ubicacion, codigo });

  agregarTienda(nombre, ubicacion, codigo, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error al agregar la tienda', error: err.message });
    }
    console.log('Tienda agregada con éxito:', { nombre, ubicacion, codigo });
    res.status(200).json({ message: 'Tienda agregada con éxito' });
  });
});

// Endpoint para obtener la lista de tiendas
app.get('/tiendas', (req, res) => {
  console.log('Solicitando lista de tiendas...');
  obtenerTiendas((err, stores) => {
    if (err) {
      console.error('Error al obtener tiendas:', err);
      return res.status(500).send({ message: 'Error al obtener tiendas' });
    }
    console.log('Tiendas obtenidas:', stores);
    res.json(stores);
  });
});

// Endpoint para agregar un producto a una factura
app.post('/agregar-producto', (req, res) => {
  const { factura_id, producto, precio, cantidad } = req.body;
  agregarProducto(factura_id, producto, precio, cantidad, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error al agregar el producto', error: err.message });
    }
    res.status(200).json({ message: 'Producto agregado con éxito' });
  });
});
 

// app.post('/generar-factura', (req, res) => {
//   const { productos } = req.body; // Asegúrate de recibir los productos

//   // Validar que haya productos
//   if (!productos || productos.length === 0) {
//       return res.status(400).send({ message: 'No se han proporcionado productos.' });
//   }

//   // Generar factura con la tienda y fecha actuales
//   const tienda_id = productos[0].tiendaId; // Usar el ID de la tienda del primer producto
//   const fecha = new Date().toISOString(); // Fecha actual

//   agregarFactura(tienda_id, fecha, (err, factura_id) => {
//       if (err) {
//           console.error('Error al agregar la factura:', err);
//           return res.status(500).send({ message: 'Error al agregar la factura', error: err.message });
//       }

//       // Agregar los productos a la factura
//       const agregarProductosPromises = productos.map(producto => {
//           return new Promise((resolve, reject) => {
//               agregarProducto(factura_id, producto.nombre, producto.precio, producto.cantidad, (err) => {
//                   if (err) {
//                       return reject(err);
//                   }
//                   resolve();
//               });
//           });
//       });

//       Promise.all(agregarProductosPromises)
//           .then(() => {
//               return generarFactura(factura_id, (err, pdfPath) => {
//                   if (err) {
//                       console.error('Error al generar el PDF:', err);
//                       return res.status(500).send({ message: 'Error al generar la factura', error: err.message });
//                   }
//                   res.download(pdfPath); // Envía el archivo PDF al cliente
//               });
//           })
//           .catch(err => {
//               console.error('Error al agregar productos:', err);
//               res.status(500).send({ message: 'Error al agregar productos a la factura', error: err.message });
//           });
//   });
// });


 
// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
      cb(null, `${Date.now()}_${file.originalname}`);
  }
});


const upload = multer({ storage: storage });

app.post('/generar-factura', upload.single('evidencia'), (req, res) => {
  const productos = JSON.parse(req.body.productos);

  if (!productos || productos.length === 0) {
      return res.status(400).send({ message: 'No se han proporcionado productos.' });
  }

  const tienda_id = req.body.tiendaId; // ID de la tienda
  const fecha = new Date().toISOString();
  const imagenPath = req.file ? req.file.path : null;
  console.log(imagenPath)
  agregarFactura(tienda_id, fecha, imagenPath, (err, factura_id) => {
    
      if (err) {
          console.error('Error al agregar la factura:', err);
          return res.status(500).send({ message: 'Error al agregar la factura', error: err.message });
      }

      const nuevoImagenPath = `uploads/${factura_id}.jpg`; // Renombrar imagen
      fs.rename(imagenPath, nuevoImagenPath, (err) => {
          if (err) {
              console.error('Error al renombrar la imagen:', err);
              return res.status(500).send({ message: 'Error al renombrar la imagen', error: err.message });
          }

          actualizarImagenFactura(factura_id, nuevoImagenPath, (err) => {
            console.log("nuevo imagenpath ", nuevoImagenPath)

              if (err) {
                  console.error('Error al actualizar la imagen en la factura:', err);
                  return res.status(500).send({ message: 'Error al actualizar la imagen', error: err.message });
              }

              const agregarProductosPromises = productos.map(producto => {
                  return new Promise((resolve, reject) => {
                      agregarProducto(factura_id, producto.nombre, producto.precio, producto.cantidad, (err) => {
                          if (err) {
                              return reject(err);
                          }
                          resolve();
                      });
                  });
              });

              Promise.all(agregarProductosPromises)
                  .then(() => {
                      return generarFactura(factura_id, nuevoImagenPath, (err, pdfPath) => {
                          if (err) {
                              console.error('Error al generar el PDF:', err);
                              return res.status(500).send({ message: 'Error al generar la factura', error: err.message });
                          }
                          res.download(pdfPath); // Envía el PDF al cliente
                      });
                  })
                  .catch(err => {
                      console.error('Error al agregar productos:', err);
                      res.status(500).send({ message: 'Error al agregar productos a la factura', error: err.message });
                  });
          });
      });
  });
});

app.get('/historial', (req, res) => {
  const { tienda_id } = req.query;
  obtenerHistorial(tienda_id, (err, facturas) => {
      if (err) {
          res.status(500).json({ error: 'Error al obtener historial' });
      } else {
          res.json(facturas);
      }
  });
});

app.get('/detalles-factura', (req, res) => {
  const { factura_id } = req.query;
  obtenerDetallesFactura(factura_id, (err, detalles) => {
      if (err) {
          res.status(500).json({ error: 'Error al obtener detalles de la factura' });
      } else {
          res.json(detalles);
      }
  });
});

app.delete('/borrar-factura', (req, res) => {
  const { factura_id } = req.query;
  borrarFactura(factura_id, (err) => {
      if (err) {
          res.status(500).json({ error: 'Error al borrar la factura' });
      } else {
          res.sendStatus(200);
      }
  });
});



// Endpoint para generar PDF de una factura existente 
app.get('/generar-pdf', (req, res) => {
  const { factura_id } = req.query;

  // Obtener la imagen asociada a la factura
  obtenerImagenFactura(factura_id, (err, row) => {
      if (err) {
          console.error('Error al obtener la imagen:', err);
          return res.status(500).send({ message: 'Error al obtener la imagen', error: err.message });
      }

      const imagenPath = row ? row.imagen : null;

      console.log("prueba de detalles en la imagen: ", imagenPath)
      // Lógica para generar el PDF de la factura existente
      generarFactura(factura_id, imagenPath, (err, pdfPath) => {
          if (err) {
              console.error('Error al generar el PDF:', err);
              return res.status(500).send({ message: 'Error al generar el PDF', error: err.message });
          }
          res.download(pdfPath); // Envía el archivo PDF al cliente
      });
  });
});



// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}/`);
});
