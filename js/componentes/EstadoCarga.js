// js/componentes/EstadoCarga.js
class EstadoCarga {
  constructor(container, opciones = {}) {
    this.container = container;
    this.opciones = opciones; // { tipo: 'loading' | 'empty' | 'error', mensaje, onRetry }
    this.render();
  }

  render() {
    this.destruir();
    this.element = document.createElement('div');
    this.element.className = `estado-contenedor estado-${this.opciones.tipo || 'loading'}`;

    if (this.opciones.tipo === 'loading') {
      this.element.innerHTML = `
        <div class="skeleton-card-grid" aria-hidden="true">
          <div class="skeleton-box"></div>
          <div class="skeleton-box"></div>
          <div class="skeleton-box"></div>
        </div>
        <p class="estado-texto">Cargando contenido...</p>
      `;
    } else if (this.opciones.tipo === 'empty') {
      this.element.innerHTML = `
        <div class="estado-icono">📭</div>
        <p class="estado-titulo">Sin resultados</p>
        <p class="estado-texto">${this.opciones.mensaje || 'No se encontraron elementos para mostrar.'}</p>
      `;
    } else if (this.opciones.tipo === 'error') {
      this.element.innerHTML = `
        <div class="estado-icono">⚠️</div>
        <p class="estado-titulo">Ocurrió un inconveniente</p>
        <p class="estado-texto">${this.opciones.mensaje || 'Hubo un error al procesar la solicitud.'}</p>
        ${this.opciones.onRetry ? '<button class="btn-reintentar" type="button">Reintentar</button>' : ''}
      `;
      if (this.opciones.onRetry) {
        this.element.querySelector('.btn-reintentar').addEventListener('click', () => {
          this.opciones.onRetry();
        });
      }
    }

    this.container.appendChild(this.element);
  }

  destruir() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}

window.EstadoCarga = EstadoCarga;