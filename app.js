const { ipcRenderer } = require('electron');

// Mostrar formularios
document.getElementById('btn-register-store').addEventListener('click', () => {
    document.getElementById('store-form').classList.remove('hidden');
    loadStores();
});

document.getElementById('btn-generate-invoice').addEventListener('click', () => {
    window.location.href = 'generar-factura.html'; // Navegar a la página de generación de facturas
});

// Agregar tienda
document.getElementById('btn-add-store').addEventListener('click', () => {
    const name = document.getElementById('store-name').value;
    const location = document.getElementById('store-location').value;
    const code = document.getElementById('store-code').value;
    ipcRenderer.send('add-store', { name, location, code });
});

// Cargar tiendas
function loadStores() {
    ipcRenderer.send('get-stores');
}

ipcRenderer.on('store-list', (event, stores) => {
    const storeList = document.getElementById('store-list');
    storeList.innerHTML = '';
    stores.forEach(store => {
        const li = document.createElement('li');
        li.textContent = `${store.name} - ${store.location} - ${store.code}`;
        storeList.appendChild(li);
    });
});

// Cargar tiendas en el select de generar factura
ipcRenderer.on('store-select-list', (event, stores) => {
    const storeSelect = document.getElementById('store-select');
    storeSelect.innerHTML = '';
    stores.forEach(store => {
        const option = document.createElement('option');
        option.value = store.code;
        option.textContent = store.name;
        storeSelect.appendChild(option);
    });
});
