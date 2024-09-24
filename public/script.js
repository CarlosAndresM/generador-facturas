document.addEventListener("DOMContentLoaded", function() {


// Función para cargar tiendas al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarTiendas();
});

// Función para cargar tiendas en el select
function cargarTiendas() {
    console.log('Cargando lista de tiendas...');
    fetch('http://localhost:3000/tiendas')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta de la API');
            }
            return response.json();
        })
        .then(data => {
            const tiendaSelect = document.querySelectorAll('tiendasSelect');
            tiendaSelect.forEach(select => {
                select.innerHTML = ''; // Limpiar opciones existentes
                data.forEach(tienda => {
                    const option = document.createElement('option');
                    option.value = tienda.id;
                    option.textContent = tienda.nombre;
                    select.appendChild(option);
                });
            });
        })
        .catch(error => {
            console.error('Error al cargar tiendas:', error);
        });
}
 

// Función para cargar tiendas en el nuevo select
function cargarTiendasSelect(selectElement) {
    console.log('Cargando tiendas para el select...');
    fetch('http://localhost:3000/tiendas')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta de la API');
            }
            return response.json();
        })
        .then(data => {
            selectElement.innerHTML = ''; // Limpiar opciones existentes
            data.forEach(tienda => {
                const option = document.createElement('option');
                option.value = tienda.id;
                option.textContent = tienda.nombre;
                selectElement.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error al cargar tiendas en el select:', error);
        });
}


document.addEventListener('DOMContentLoaded', function() {
    cargarTiendas();
    
    document.getElementById('verHistorialBtn').addEventListener('click', function() {
        const tiendaId = document.getElementById('tiendasSelect').value;
        cargarHistorial(tiendaId);
    });

    document.getElementById('cerrarDetalles').addEventListener('click', function() {
        document.getElementById('detallesModal').style.display = 'none';
    });
});

// Cargar tiendas en el select
function cargarTiendas() {
    fetch('http://localhost:3000/tiendas')
        .then(response => response.json())
        .then(data => {
            const tiendaSelect = document.getElementById('tiendasSelect');
            data.forEach(tienda => {
                const option = document.createElement('option');
                option.value = tienda.id;
                option.textContent = tienda.nombre;
                tiendaSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error al cargar tiendas:', error));
}

// Cargar historial de facturas
function cargarHistorial(tiendaId) {
    fetch(`http://localhost:3000/historial?tienda_id=${tiendaId}`)
        .then(response => response.json())
        .then(data => {
            const historialDiv = document.getElementById('historial');
            historialDiv.innerHTML = ''; // Limpiar historial anterior

            data.forEach(factura => {
                const facturaDiv = document.createElement('div');
                facturaDiv.classList.add('factura');
                
                facturaDiv.innerHTML = `
                    <p>Fecha: ${factura.fecha}</p>
                    <p>Total: $${factura.total.toFixed(2)}</p>
                    <p>Cantidad de productos: ${factura.cantidad_productos}</p>
                    <button onclick="verDetalles(${factura.id})">Ver Detalles</button>
                    <button onclick="borrarFactura(${factura.id})">Borrar</button>
                `;
                historialDiv.appendChild(facturaDiv);
            });
        })
        .catch(error => console.error('Error al cargar historial:', error));
}

// Ver detalles de la factura 
function verDetalles(facturaId) {
    fetch(`http://localhost:3000/detalles-factura?factura_id=${facturaId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta de la API');
            }
            return response.json();
        })
        .then(data => {
            const detallesDiv = document.getElementById('detallesFactura');
            detallesDiv.innerHTML = ''; // Limpiar detalles anteriores
            
            data.forEach(detalle => {
                const productoDiv = document.createElement('div');
                productoDiv.innerHTML = `
                    <p>Producto: ${detalle.producto}</p>
                    <p>Cantidad: ${detalle.cantidad}</p>
                    <p>Precio: $${detalle.precio.toFixed(2)}</p>
                `;
                detallesDiv.appendChild(productoDiv);
            });

            // Añadir botón para generar PDF
            const generarPdfButton = document.createElement('button');
            generarPdfButton.textContent = 'Generar PDF';
            generarPdfButton.addEventListener('click', () => {
                window.open(`http://localhost:3000/generar-pdf?factura_id=${facturaId}`);
            });
            detallesDiv.appendChild(generarPdfButton);

            document.getElementById('detallesModal').style.display = 'block';
        })
        .catch(error => console.error('Error al cargar detalles de la factura:', error));
}


// Borrar factura
function borrarFactura(facturaId) {
    if (confirm('¿Estás seguro de que deseas borrar esta factura?')) {
        fetch(`http://localhost:3000/borrar-factura?factura_id=${facturaId}`, { method: 'DELETE' })
            .then(response => {
                if (response.ok) {
                    showAlert('Factura borrada exitosamente');
                    location.reload(); // Recargar la página para actualizar el historial
                } else {
                    showAlert('Error al borrar la factura');
                }
            })
            .catch(error => console.error('Error al borrar la factura:', error));
    }
}

function showAlert(message) {
    const alertBox = document.createElement('div');
    alertBox.textContent = message;
    alertBox.style.position = 'fixed';
    alertBox.style.top = '50%';
    alertBox.style.left = '50%';
    alertBox.style.transform = 'translate(-50%, -50%)';
    alertBox.style.backgroundColor = 'white';
    alertBox.style.padding = '20px';
    alertBox.style.border = '1px solid black';
    alertBox.style.zIndex = '1000';
    document.body.appendChild(alertBox);

    // Remover la alerta después de un tiempo
    setTimeout(() => {
        document.body.removeChild(alertBox);
    }, 2000);
}


});
