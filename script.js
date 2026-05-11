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

// Cambio a formato de moneda Argentina (ARS)
const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor);
};

Object.values(productosSeleccionados).forEach(item => {
    sumaTotal += item.precio * item.cantidad;
});

actualizarListas();

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
        <div class="precio-container">
            <p class="precio-nuevo">${formatearMoneda(p.precio)}</p>
        </div>
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
            mostrarAlerta("LÍMITE DE STOCK", "error");
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
    document.body.removeChild(alerta);
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
    
    const item = document.createElement('li');
    
    const infoSpan = document.createElement('span');
    infoSpan.textContent = `${producto} x${cantidad} — ${formatearMoneda(subtotal)}`;
    
    const controlesDiv = document.createElement('div');
    controlesDiv.classList.add('controles-carrito');

    const btnMas = document.createElement('button');
    btnMas.textContent = '+';
    btnMas.classList.add('btn-control');
    btnMas.addEventListener('click', () => aumentarCantidad(producto));

    const btnMenos = document.createElement('button');
    btnMenos.textContent = '-';
    btnMenos.classList.add('btn-control');
    btnMenos.addEventListener('click', () => disminuirCantidad(producto));

    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = 'Quitar';
    btnEliminar.classList.add('btn-eliminar');
    btnEliminar.addEventListener('click', () => eliminarProducto(producto));

    controlesDiv.appendChild(btnMenos);
    controlesDiv.appendChild(btnMas);
    controlesDiv.appendChild(btnEliminar);

    item.appendChild(infoSpan);
    item.appendChild(controlesDiv);
    
    listaCarrito.appendChild(item);

    const resumenItem = document.createElement('li');
    resumenItem.textContent = `${producto} x${cantidad} - ${formatearMoneda(subtotal)}`;
    resumenProductos.appendChild(resumenItem);
  });

  // Cambio a ARS en el Total
  total.textContent = `Total: ${formatearMoneda(sumaTotal)} ARS`;
  contadorCarrito.textContent = contador;

  const listaProductos = productosNombres.map(
    (producto) => {
      const { precio, cantidad } = productosSeleccionados[producto];
      return `${producto} x${cantidad} - ${formatearMoneda(precio * cantidad)}`;
    }
  );
  productosHidden.value = listaProductos.join('\n');

  localStorage.setItem('carrito', JSON.stringify(productosSeleccionados));
}

function aumentarCantidad(producto) {
  productosSeleccionados[producto].cantidad += 1;
  sumaTotal += productosSeleccionados[producto].precio;
  actualizarListas();
}

function disminuirCantidad(producto) {
  if (productosSeleccionados[producto].cantidad > 1) {
    productosSeleccionados[producto].cantidad -= 1;
    sumaTotal -= productosSeleccionados[producto].precio;
  } else {
    eliminarProducto(producto);
    return;
  }
  actualizarListas();
}

function eliminarProducto(producto) {
  sumaTotal -= productosSeleccionados[producto].precio * productosSeleccionados[producto].cantidad;
  delete productosSeleccionados[producto];
  actualizarListas();
}

formulario.addEventListener('submit', async (e) => {
  e.preventDefault(); 
  
  if(Object.keys(productosSeleccionados).length === 0) {
      mostrarAlerta("TU CARRITO ESTÁ VACÍO", "error");
      return;
  }

  const data = new FormData(formulario);
  
  try {
      const response = await fetch(formulario.action, {
          method: formulario.method,
          body: data,
          headers: {
              'Accept': 'application/json'
          }
      });
      
      if (response.ok) {
          mostrarAlerta("PEDIDO ENVIADO CORRECTAMENTE");
          formulario.reset();
          productosSeleccionados = {}; 
          sumaTotal = 0;
          actualizarListas();
      } else {
          mostrarAlerta("ERROR AL ENVIAR", "error");
      }
  } catch (error) {
      mostrarAlerta("ERROR DE CONEXIÓN", "error");
  }
});