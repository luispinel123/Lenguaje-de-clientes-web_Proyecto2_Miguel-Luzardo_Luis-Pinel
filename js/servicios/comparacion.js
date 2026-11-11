const ComparacionService = {
  comparar(recetaA, recetaB) {
    if (!recetaA || !recetaB) return null;

    const normA = window.RecetasService.normalizarRecetaCompleta(recetaA);
    const normB = window.RecetasService.normalizarRecetaCompleta(recetaB);

    const ingSetA = new Set(normA.ingredientes.map(i => i.nombre.toLowerCase()));
    const ingSetB = new Set(normB.ingredientes.map(i => i.nombre.toLowerCase()));

    const tagSetA = new Set(normA.tags.map(t => t.toLowerCase()));
    const tagSetB = new Set(normB.tags.map(t => t.toLowerCase()));

    const ingredientesComun = [...ingSetA].filter(i => ingSetB.has(i));
    const exclusivosA = [...ingSetA].filter(i => !ingSetB.has(i));
    const exclusivosB = [...ingSetB].filter(i => !ingSetA.has(i));
    const etiquetasComun = [...tagSetA].filter(t => tagSetB.has(t));

    const unionIngredientes = new Set([...ingSetA, ...ingSetB]);
    const similitud = unionIngredientes.size > 0 
      ? Math.round((ingredientesComun.length / unionIngredientes.size) * 100) 
      : 0;

    const palabrasA = normA.instrucciones ? normA.instrucciones.trim().split(/\s+/).length : 0;
    const palabrasB = normB.instrucciones ? normB.instrucciones.trim().split(/\s+/).length : 0;

    // Lógica de receta más sencilla
    let recetaMasSencilla = null;
    if (normA.ingredientes.length < normB.ingredientes.length) {
      recetaMasSencilla = 'A';
    } else if (normB.ingredientes.length < normA.ingredientes.length) {
      recetaMasSencilla = 'B';
    } else {
      if (normA.pasos.length < normB.pasos.length) {
        recetaMasSencilla = 'A';
      } else if (normB.pasos.length < normA.pasos.length) {
        recetaMasSencilla = 'B';
      } else {
        if (palabrasA < palabrasB) {
          recetaMasSencilla = 'A';
        } else if (palabrasB < palabrasA) {
          recetaMasSencilla = 'B';
        } else {
          recetaMasSencilla = 'Empate';
        }
      }
    }

    return {
      recetaA: normA,
      recetaB: normB,
      metricas: {
        cantIngredientesA: normA.ingredientes.length,
        cantIngredientesB: normB.ingredientes.length,
        cantPasosA: normA.pasos.length,
        cantPasosB: normB.pasos.length,
        palabrasA,
        palabrasB,
        categoriaCoincide: normA.categoria.toLowerCase() === normB.categoria.toLowerCase(),
        origenCoincide: normA.origen.toLowerCase() === normB.origen.toLowerCase(),
        etiquetasComun,
        tieneVideoA: Boolean(normA.video),
        tieneVideoB: Boolean(normB.video),
        ingredientesComun,
        exclusivosA,
        exclusivosB,
        similitud,
        recetaMasSencilla
      }
    };
  }
};

window.ComparacionService = ComparacionService;