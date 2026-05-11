const contenedorProductos = document.getElementById('contenedor-productos');
const listaCarrito = document.getElementById('lista-carrito');
const resumenProductos = document.getElementById('resumen-productos');
const total = document.getElementById('total');
const productosHidden = document.getElementById('productos-seleccionados');
const formulario = document.getElementById('formulario');
const contadorCarrito = document.getElementById('contador-carrito');
const mensajevacio = document.getElementById('mensaje-vacio');

let sumaTotal = 0;
let productosSeleccionados = JSON.parse(localStorage.getItem('carrito')) || {};

// Formato de moneda para Argentina (ARS)
const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor);
};

// Cargar estado inicial
function iniciar() {
    Object.values(productosSeleccionados).forEach(item => {
        sumaTotal += item.precio * item.cantidad;
    });
    actualizarListas();
}

// Obtener productos
fetch('productos.json')
  .then(res => res.json())
  .then(productos => {
    productos.forEach(p => {
      const card = document.createElement('div');
      card.classList.add('card');
      card.innerHTML = `
        <img src="${p.imagen}" alt="${p.nombre}">
        <h3>${p.nombre}</h3>
        <p class="calidad">${p.calidad}</p>
        <p class="precio-nuevo">${formatearMoneda(p.precio)}</p>
        <button class="btn-principal btn-agregar">Añadir al carrito</button>
      `;
      contenedorProductos.appendChild(card);

      card.querySelector('.btn-agregar').addEventListener('click', () => {
        if (p.stock <= 0) {
          mostrarAlerta("AGOTADO", "error");
          return;
        }
        
        const cantActual = productosSeleccionados[p.nombre] ? productosSeleccionados[p.nombre].cantidad : 0;
        if(cantActual >= p.stock) {
            mostrarAlerta("SIN STOCK", "error");
            return;
        }

        if (productosSeleccionados[p.nombre]) {
          productosSeleccionados[p.nombre].cantidad += 1;
        } else {
          productosSeleccionados[p.nombre] = { precio: p.precio, cantidad: 1 };
        }
        sumaTotal += p.precio;
        actualizarListas();
        mostrarAlerta(`AÑADIDO AL CARRITO`);
      });
    });
  });

function mostrarAlerta(mensaje, tipo = "ok") {
  let alerta = document.createElement('div');
  alerta.classList.add('alerta');
  alerta.textContent = mensaje;
  if (tipo === "error") alerta.style.background = "#d9534f";
  document.body.appendChild(alerta);
  setTimeout(() => alerta.classList.add('mostrar'), 100);
  setTimeout(() => {
    alerta.classList.remove('mostrar');
    setTimeout(() => document.body.removeChild(alerta), 400);
  }, 2000);
}

function actualizarListas() {
  listaCarrito.innerHTML = '';
  resumenProductos.innerHTML = '';
  let contador = 0;
  const productosNombres = Object.keys(productosSeleccionados);

  if (productosNombres.length === 0) {
      mensajevacio.style.display = 'block';
  } else {
      mensajevacio.style.display = 'none';
  }

  productosNombres.forEach((producto) => {
    const { precio, cantidad } = productosSeleccionados[producto];
    const subtotal = precio * cantidad;
    contador += cantidad;
    
    // Elemento para el carrito visual
    const item = document.createElement('li');
    item.innerHTML = `
        <span>${producto} x${cantidad} — ${formatearMoneda(subtotal)}</span>
        <div>
            <button class="btn-control" onclick="aumentarCantidad('${producto}')">+</button>
            <button class="btn-control" onclick="disminuirCantidad('${producto}')">-</button>
            <button class="btn-eliminar" onclick="eliminarProducto('${producto}')">Quitar</button>
        </div>
    `;
    listaCarrito.appendChild(item);

    // Elemento para el resumen dentro del formulario
    const resumenItem = document.createElement('li');
    resumenItem.textContent = `${producto} x${cantidad} — ${formatearMoneda(subtotal)}`;
    resumenProductos.appendChild(resumenItem);
  });

  total.textContent = `Total: ${formatearMoneda(sumaTotal)} ARS`;
  contadorCarrito.textContent = contador;
  
  // Guardamos en el campo oculto para Formspree
  productosHidden.value = productosNombres.map(p => `${p} (Cant: ${productosSeleccionados[p].cantidad})`).join('\n');
  
  localStorage.setItem('carrito', JSON.stringify(productosSeleccionados));
}

// Funciones globales para los botones del carrito
window.aumentarCantidad = (producto) => {
  productosSeleccionados[producto].cantidad += 1;
  sumaTotal += productosSeleccionados[producto].precio;
  actualizarListas();
};

window.disminuirCantidad = (producto) => {
  if (productosSeleccionados[producto].cantidad > 1) {
    productosSeleccionados[producto].cantidad -= 1;
    sumaTotal -= productosSeleccionados[producto].precio;
  } else {
    eliminarProducto(producto);
  }
  actualizarListas();
};

window.eliminarProducto = (producto) => {
  sumaTotal -= productosSeleccionados[producto].precio * productosSeleccionados[producto].cantidad;
  delete productosSeleccionados[producto];
  actualizarListas();
};

// Manejo de Formspree con Fetch
formulario.addEventListener('submit', async (e) => {
  e.preventDefault(); 
  if(Object.keys(productosSeleccionados).length === 0) {
      mostrarAlerta("EL CARRITO ESTÁ VACÍO", "error");
      return;
  }
  
  const response = await fetch(formulario.action, {
      method: 'POST',
      body: new FormData(formulario),
      headers: { 'Accept': 'application/json' }
  });
  
  if (response.ok) {
      mostrarAlerta("PEDIDO ENVIADO CON ÉXITO");
      formulario.reset();
      productosSeleccionados = {};
      sumaTotal = 0;
      actualizarListas();
      localStorage.removeItem('carrito');
  } else {
      mostrarAlerta("HUBO UN ERROR AL ENVIAR", "error");
  }
});

iniciar();
