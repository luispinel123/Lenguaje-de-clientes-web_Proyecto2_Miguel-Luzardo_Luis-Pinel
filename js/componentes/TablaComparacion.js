// js/componentes/TablaComparacion.js
class TablaComparacion {
  constructor(container, comparacionData) {
    this.container = container;
    this.data = comparacionData;
    this.render();
  }

  render() {
    if (!this.data) {
      this.container.innerHTML = '';
      return;
    }

    const { recetaA, recetaB, metricas } = this.data;

    this.container.innerHTML = `
      <div class="comparison-results-wrapper">
        <div class="comparison-winner-banner">
          🏆 <strong>Receta más sencilla:</strong> ${metricas.recetaMasSencilla === 'Empate' ? 'Empate entre ambas recetas' : `Panel ${metricas.recetaMasSencilla} (${metricas.recetaMasSencilla === 'A' ? recetaA.nombre : recetaB.nombre})`}
        </div>
        <div class="comparison-similarity">
          <span>Similitud de ingredientes: <strong>${metricas.similitud}%</strong></span>
        </div>
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Métrica</th>
              <th>${recetaA.nombre} (Panel A)</th>
              <th>${recetaB.nombre} (Panel B)</th>
            </tr>
          </thead>
          <tbody>
            <tr class="${metricas.cantIngredientesA < metricas.cantIngredientesB ? 'highlight-better' : metricas.cantIngredientesB < metricas.cantIngredientesA ? 'highlight-worse' : ''}">
              <td>Cantidad de Ingredientes</td>
              <td>${metricas.cantIngredientesA}</td>
              <td>${metricas.cantIngredientesB}</td>
            </tr>
            <tr class="${metricas.cantPasosA < metricas.cantPasosB ? 'highlight-better' : metricas.cantPasosB < metricas.cantPasosA ? 'highlight-worse' : ''}">
              <td>Cantidad de Pasos</td>
              <td>${metricas.cantPasosA}</td>
              <td>${metricas.cantPasosB}</td>
            </tr>
            <tr class="${metricas.palabrasA < metricas.palabrasB ? 'highlight-better' : metricas.palabrasB < metricas.palabrasA ? 'highlight-worse' : ''}">
              <td>Palabras en Instrucciones</td>
              <td>${metricas.palabrasA} palabras</td>
              <td>${metricas.palabrasB} palabras</td>
            </tr>
            <tr>
              <td>Categoría</td>
              <td>${recetaA.categoria} ${metricas.categoriaCoincide ? '✅ (Coinciden)' : ''}</td>
              <td>${recetaB.categoria}</td>
            </tr>
            <tr>
              <td>Origen</td>
              <td>${recetaA.origen} ${metricas.origenCoincide ? '✅ (Coinciden)' : ''}</td>
              <td>${recetaB.origen}</td>
            </tr>
            <tr>
              <td>Video disponible</td>
              <td>${metricas.tieneVideoA ? 'Sí' : 'No'}</td>
              <td>${metricas.tieneVideoB ? 'Sí' : 'No'}</td>
            </tr>
            <tr>
              <td>Etiquetas en común</td>
              <td colspan="2">${metricas.etiquetasComun.length > 0 ? metricas.etiquetasComun.join(', ') : 'Ninguna'}</td>
            </tr>
            <tr>
              <td>Ingredientes en común</td>
              <td colspan="2">${metricas.ingredientesComun.length > 0 ? metricas.ingredientesComun.join(', ') : 'Ninguno'}</td>
            </tr>
            <tr>
              <td>Ingredientes exclusivos (A)</td>
              <td colspan="2">${metricas.exclusivosA.length > 0 ? metricas.exclusivosA.join(', ') : 'Ninguno'}</td>
            </tr>
            <tr>
              <td>Ingredientes exclusivos (B)</td>
              <td colspan="2">${metricas.exclusivosB.length > 0 ? metricas.exclusivosB.join(', ') : 'Ninguno'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  destruir() {
    this.container.innerHTML = '';
  }
}

window.TablaComparacion = TablaComparacion;