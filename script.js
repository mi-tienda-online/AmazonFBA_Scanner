document.addEventListener("DOMContentLoaded", () => {
    const btnCalcular = document.getElementById("btnCalcular");
    const btnEscanear = document.getElementById("btnEscanear");
    const btnLimpiar = document.getElementById("btnLimpiar");
    
    btnCalcular.addEventListener("click", calcularYGuardar);
    btnEscanear.addEventListener("click", iniciarEscanner);
    btnLimpiar.addEventListener("click", limpiarHistorial);

    // Cargar historial al abrir la app
    mostrarHistorial();
});

let html5QrcodeScanner = null;

function iniciarEscanner() {
    const btn = document.getElementById('btnEscanear');

    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5Qrcode("reader");
    }

    const config = { fps: 10, qrbox: { width: 250, height: 100 } };

    // Si ya está escaneando, lo detenemos
    if (btn.innerText === "Detener Cámara") {
        html5QrcodeScanner.stop().then(() => {
            btn.innerText = "Activar Cámara";
        }).catch(err => console.error(err));
        return;
    }

    // Buscamos las cámaras disponibles para conectar la USB UVC Camera
    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            // Seleccionamos la primera cámara detectada (ideal para tu cámara USB)
            let cameraId = devices[0].id;

            // Si hay más de una, intentamos buscar la que tenga nombre UVC o USB
            devices.forEach(device => {
                if (device.label.toLowerCase().includes('uvc') || device.label.toLowerCase().includes('usb')) {
                    cameraId = device.id;
                }
            });

            html5QrcodeScanner.start(
                cameraId, 
                config,
                (decodedText, decodedResult) => {
                    document.getElementById('barcode').value = decodedText;
                    
                    html5QrcodeScanner.stop().then(() => {
                        btn.innerText = "Activar Cámara";
                    }).catch(err => console.error(err));
                },
                (errorMessage) => {}
            ).then(() => {
                btn.innerText = "Detener Cámara";
            }).catch(err => {
                alert("Error al iniciar la cámara: " + err);
            });

        } else {
            alert("No se encontró ninguna cámara conectada en la tablet.");
        }
    }).catch(err => {
        alert("Error al listar las cámaras. Revisa los permisos del navegador.");
    });
}

function calcularYGuardar() {
    let barcode = document.getElementById('barcode').value.trim() || "Sin Código";
    let costo = parseFloat(document.getElementById('costoLocal').value) || 0;
    let venta = parseFloat(document.getElementById('precioAmazon').value) || 0;
    
    if (costo <= 0 || venta <= 0) {
        alert("Por favor ingresa precios válidos");
        return;
    }

    let referalFee = venta * 0.15; 
    let fbaLogistica = 45.00;     
    let ganancia = venta - costo - referalFee - fbaLogistica;
    let roi = (ganancia / costo) * 100;

    // Mostrar resultados en pantalla
    document.getElementById('tarifaAmazon').innerText = referalFee.toFixed(2);
    document.getElementById('gananciaNeta').innerText = "$" + ganancia.toFixed(2);
    document.getElementById('roiPorcentaje').innerText = roi.toFixed(1);
    document.getElementById('resultadoBox').style.display = 'block';

    let producto = {
        barcode: barcode,
        costo: costo.toFixed(2),
        venta: venta.toFixed(2),
        ganancia: ganancia.toFixed(2),
        roi: roi.toFixed(1),
        fecha: new Date().toLocaleTimeString()
    };

    guardarEnLocalStorage(producto);
    mostrarHistorial();
}

function guardarEnLocalStorage(producto) {
    let historial = JSON.parse(localStorage.getItem('fba_historial')) || [];
    historial.unshift(producto);
    localStorage.setItem('fba_historial', JSON.stringify(historial));
}

function mostrarHistorial() {
    let historial = JSON.parse(localStorage.getItem('fba_historial')) || [];
    let contenedor = document.getElementById('historialList');
    contenedor.innerHTML = "";

    if (historial.length === 0) {
        contenedor.innerHTML = "<p style='text-align:center; color:#aaa; font-size:13px;'>No hay productos escaneados aún.</p>";
        return;
    }

    historial.forEach((item) => {
        let div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <strong>Código:</strong> ${item.barcode} <br>
            Costo: $${item.costo} | Venta: $${item.venta} <br>
            Ganancia: <span style="color:${item.ganancia > 0 ? '#007600' : '#ff4d4d'}">$${item.ganancia}</span> (ROI: ${item.roi}%)
        `;
        contenedor.appendChild(div);
    });
}

function limpiarHistorial() {
    if (confirm("¿Deseas borrar todo el historial guardado?")) {
        localStorage.removeItem('fba_historial');
        mostrarHistorial();
    }
}
