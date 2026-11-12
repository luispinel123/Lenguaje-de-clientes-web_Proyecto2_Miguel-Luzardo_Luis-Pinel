class ListaIngredientes {
  constructor(container, ingredientes = []) {
    this.container = container;
    this.ingredientes = ingredientes;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <h3 class="section-subtitle">Ingredientes</h3>
      <ul class="ingredients-list">
        ${this.ingredientes.map(ing => `
          <li class="ingredient-item">
            <img src="${ing.imagen}" alt="${ing.nombre}" class="ingredient-img" loading="lazy" onerror="this.onerror=null; this.src='${ing.fallbackImagen}';">
            <span class="ingredient-name">${ing.nombre}</span>
            <span class="ingredient-measure">${ing.medida}</span>
          </li>
        `).join('')}
      </ul>
    `;
  }

  destruir() {
    this.container.innerHTML = '';
  }
}

window.ListaIngredientes = ListaIngredientes;