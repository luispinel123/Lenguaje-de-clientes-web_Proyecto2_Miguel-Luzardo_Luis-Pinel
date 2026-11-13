// js/app.js
document.addEventListener('DOMContentLoaded', () => {
  const navContainer = document.querySelector('#navbar-container');
  const viewContainer = document.querySelector('#app-view-container');

  // Estado global de la aplicación en memoria (sin persistencia)
  const estadoGlobal = {
    vistaActual: 'inicio',
    historialVistaAnterior: null, // Para el botón Volver
    estadoExplorarPrevio: null,
    comparadorRecetas: {
      recetaA: null,
      recetaB: null
    }
  };

  // Instanciar Barra de Navegación
  const barraNavegacion = new BarraNavegacion(navContainer, {
    vistaActual: 'inicio',
    comparadorCount: 0
  });

  let vistaActualInstancia = null;

  // Función principal para cambiar de vista
  function cambiarVista(nombreVista, parametros = {}) {
    // Destruir instancia anterior si existe para evitar fugas de memoria
    if (vistaActualInstancia && typeof vistaActualInstancia.destruir === 'function') {
      vistaActualInstancia.destruir();
    }

    // Guardar vista anterior si salimos de explorar para el botón volver
    if (estadoGlobal.vistaActual === 'explorar' && nombreVista !== 'detalle') {
      estadoGlobal.estadoExplorarPrevio = null;
    }

    estadoGlobal.vistaActual = nombreVista;
    barraNavegacion.actualizarVistaActiva(nombreVista);
    viewContainer.innerHTML = '';

    switch (nombreVista) {
      case 'inicio':
        vistaActualInstancia = new VistaInicio(viewContainer);
        break;
      case 'explorar':
        vistaActualInstancia = new VistaExplorar(viewContainer, {
          estadoPrevio: estadoGlobal.estadoExplorarPrevio
        });
        break;
      case 'categorias':
        vistaActualInstancia = new VistaCategoriasOrigenes(viewContainer, {
          categoriaSeleccionada: parametros.categoria || null
        });
        break;
      case 'comparador':
        vistaActualInstancia = new VistaComparador(viewContainer, {
          recetaA: estadoGlobal.comparadorRecetas.recetaA,
          recetaB: estadoGlobal.comparadorRecetas.recetaB
        });
        break;
      case 'detalle':
        vistaActualInstancia = new VistaDetalle(viewContainer, {
          idReceta: parametros.id,
          vistaOrigen: parametros.origen || 'explorar'
        });
        break;
      default:
        vistaActualInstancia = new VistaInicio(viewContainer);
        break;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- ESCUCHA DE EVENTOS GLOBALES ---

  // 1. Navegación general desde la barra o tarjetas
  document.addEventListener('navegar', (e) => {
    const { vista, categoria } = e.detail;
    if (vista === 'explorar' && vistaActualInstancia instanceof VistaExplorar) {
      estadoGlobal.estadoExplorarPrevio = vistaActualInstancia.obtenerEstadoParaGuardar();
    }
    cambiarVista(vista, { categoria });
  });

  // 2. Ver detalle de receta
  document.addEventListener('receta:ver-detalle', (e) => {
    const { id } = e.detail;
    if (vistaActualInstancia instanceof VistaExplorar) {
      estadoGlobal.estadoExplorarPrevio = vistaActualInstancia.obtenerEstadoParaGuardar();
    }
    estadoGlobal.historialVistaAnterior = estadoGlobal.vistaActual;
    cambiarVista('detalle', { id, origen: estadoGlobal.historialVistaAnterior });
  });

  // 3. Volver desde el detalle conservando estado anterior (Requerimiento 4.1)
  document.addEventListener('navegar:volver', () => {
    const destino = estadoGlobal.historialVistaAnterior || 'explorar';
    cambiarVista(destino);
  });

  // 4. Agregar receta al comparador desde cualquier vista
  document.addEventListener('receta:agregar-comparador', (e) => {
    const { receta } = e.detail;
    const { recetaA, recetaB } = estadoGlobal.comparadorRecetas;

    // Verificar si ya está en el comparador
    if ((recetaA && recetaA.idMeal === receta.idMeal) || (recetaB && recetaB.idMeal === receta.idMeal)) {
      alert('Esta receta ya se encuentra en el comparador.');
      return;
    }

    if (!recetaA) {
      estadoGlobal.comparadorRecetas.recetaA = receta;
    } else if (!recetaB) {
      estadoGlobal.comparadorRecetas.recetaB = receta;
    } else {
      // Si ambos paneles están ocupados, preguntar cuál reemplazar (Requerimiento 4.6)
      const reemplazarA = confirm('Ambos paneles del comparador están ocupados.\n¿Desea reemplazar el Panel A? (Pulse Cancelar para reemplazar el Panel B)');
      if (reemplazarA) {
        estadoGlobal.comparadorRecetas.recetaA = receta;
      } else {
        estadoGlobal.comparadorRecetas.recetaB = receta;
      }
    }

    actualizarContadorComparadorGlobal();
    alert(`¡Receta "${receta.strMeal}" agregada al comparador!`);
  });

  // 5. Actualización de estado del comparador
  document.addEventListener('comparador:actualizo-estado', (e) => {
    estadoGlobal.comparadorRecetas.recetaA = e.detail.recetaA;
    estadoGlobal.comparadorRecetas.recetaB = e.detail.recetaB;
    actualizarContadorComparadorGlobal();
  });

  function actualizarContadorComparadorGlobal() {
    const count = (estadoGlobal.comparadorRecetas.recetaA ? 1 : 0) + (estadoGlobal.comparadorRecetas.recetaB ? 1 : 0);
    document.dispatchEvent(new CustomEvent('comparador:cambio', { detail: { count } }));
  }

  // Inicialización de la SPA en la vista de inicio
  cambiarVista('inicio');
});