// js/componentes/PasosPreparacion.js
class PasosPreparacion {
  constructor(container, pasos = []) {
    this.container = container;
    this.pasos = pasos;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <h3 class="section-subtitle">Preparación</h3>
      <ol class="steps-list">
        ${this.pasos.map(paso => `<li class="step-item"><p>${paso}</p></li>`).join('')}
      </ol>
    `;
  }

  destruir() {
    this.container.innerHTML = '';
  }
}

window.PasosPreparacion = PasosPreparacion;