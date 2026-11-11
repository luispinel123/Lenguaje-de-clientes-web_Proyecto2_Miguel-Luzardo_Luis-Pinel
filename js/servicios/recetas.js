const FALLBACK_INGREDIENT_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>';

const RecetasService = {
  normalizarIngredientes(recipe) {
    const ingredientes = [];
    for (let i = 1; i <= 20; i++) {
      const ingrediente = recipe[`strIngredient${i}`];
      const medida = recipe[`strMeasure${i}`];
      
      if (ingrediente && ingrediente.trim() !== '') {
        const nombreLimpio = ingrediente.trim();
        ingredientes.push({
          nombre: nombreLimpio,
          medida: medida ? medida.trim() : '',
          imagen: `https://www.themealdb.com/images/ingredients/${encodeURIComponent(nombreLimpio)}.png`,
          fallbackImagen: FALLBACK_INGREDIENT_IMG
        });
      }
    }
    return ingredientes;
  },

  normalizarPasos(instructions) {
    if (!instructions) return [];
    return instructions
      .split(/\r?\n/)
      .map(linea => linea.trim())
      .filter(linea => {
        if (linea === '') return false;
      
        const regexPaso = /^(step\s*\d+|\d+[\.\)]?)\s*$/i;
        return !regexPaso.test(linea);
      });
  },

  normalizarEtiquetas(strTags) {
    if (!strTags) return [];
    return strTags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  },

  normalizarRecetaCompleta(recipe) {
    if (!recipe) return null;
    return {
      id: recipe.idMeal,
      nombre: recipe.strMeal,
      categoria: recipe.strCategory || '',
      origen: recipe.strArea || '',
      instrucciones: recipe.strInstructions || '',
      imagen: recipe.strMealThumb,
      tags: this.normalizarEtiquetas(recipe.strTags),
      video: recipe.strYoutube ? recipe.strYoutube.trim() : '',
      ingredientes: this.normalizarIngredientes(recipe),
      pasos: this.normalizarPasos(recipe.strInstructions)
    };
  }
};

window.RecetasService = RecetasService;