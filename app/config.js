// config.js - Configuración completa de endpoints

// URL base de tu API
export const API_BASE_URL = 'http://localhost:8000'; // URL de API

// export const API_BASE_URL = 'https://tddm-back.onrender.com'; // URL de API

// Endpoints de la API
export const API_ENDPOINTS = {
  LOGIN: '/app/usuarios/login/',
  PROFILE: '/app/usuarios/perfil/',
  USERS: '/app/usuarios/',
  REGISTER: '/app/usuarios/register/',

  PROYECTOS: '/app/proyectos/listar/',
  OBTENER_PROYECTO: '/app/proyectos/obtener_proyecto', // Se concatena /:id en el componente
  CREAR_PROYECTO: '/app/proyectos/crear/',
  EDITAR_PROYECTO: '/app/proyectos/editar',      // Se concatena /:id en el componente
  CAMBIAR_ESTADO_PROYECTO: '/app/proyectos/cambiar-estado', // Se concatena /:id en el componente
  ELIMINAR_PROYECTO: '/app/proyectos/eliminar',  // Se concatena /:id en el componente

  // Tipos de Prueba
  TIPOS_PRUEBA: '/app/pruebas/tipos-prueba/listar/',
  TIPOS_PRUEBA_CREAR: '/app/pruebas/tipos-prueba/crear/',
  TIPOS_PRUEBA_OBTENER: '/app/pruebas/tipos-prueba/obtener', // Se concatena /:id en el componente
  TIPOS_PRUEBA_ACTUALIZAR: '/app/pruebas/tipos-prueba/editar', // Se concatena /:id en el componente
  TIPOS_PRUEBA_ELIMINAR: '/app/pruebas/tipos-prueba/eliminar', // Se concatena /:id en el componente

  // Pruebas
  CREAR_PRUEBA: '/app/pruebas/crear/',
  LISTAR_PRUEBAS: '/app/pruebas/listar', // Se concatena /:proyecto_id en el componente
  OBTENER_PRUEBA: '/app/pruebas/obtener', // Se concatena /:prueba_id en el componente
  ACTUALIZAR_PRUEBA: '/app/pruebas/editar', // Se concatena /:prueba_id en el componente
  ELIMINAR_PRUEBA: '/app/pruebas/eliminar', // Se concatena /:prueba_id en el componente

  // GENERACIÓN DE PRUEBAS CON IA
  GENERAR_PRUEBAS_IA: '/app/chat/generar-pruebas', // Se concatena /:proyecto_id en el componente
  PREVISUALIZAR_PRUEBAS_IA: '/app/chat/previsualizar-pruebas', // Se concatena /:proyecto_id en el componente

  // Tipos de Requisito
  TIPOS_REQUISITO: '/app/catalogos/listar/',
  TIPOS_REQUISITO_CREAR: '/app/catalogos/crear/',
  TIPOS_REQUISITO_ACTUALIZAR: `/app/catalogos/editar`, // Se concatena /:proyecto_id en el componente
  TIPOS_REQUISITO_CAMBIAR_ESTADO: `/app/catalogos/deshabilitar`, // Se concatena /:proyecto_id en el componente

  // Prioridades
  PRIORIDADES: '/app/catalogos/prioridades/listar/',
  PRIORIDADES_CREAR: '/app/catalogos/prioridades/crear/',
  PRIORIDADES_ACTUALIZAR: `/app/catalogos/prioridades/editar`, // Se concatena /:proyecto_id en el componente
  PRIORIDADES_CAMBIAR_ESTADO: `/app/catalogos/prioridades/deshabilitar`, // Se concatena /:proyecto_id en el componente

  // Estados de Proyecto
  ESTADOS_PROYECTO: '/app/catalogos/estados/listar/',
  ESTADOS_PROYECTO_CREAR: '/app/catalogos/estados/crear/',
  ESTADOS_PROYECTO_ACTUALIZAR: `/app/catalogos/estados/editar`, // Se concatena /:proyecto_id en el componente
  ESTADOS_PROYECTO_CAMBIAR_ESTADO: `/app/catalogos/estados/deshabilitar`, // Se concatena /:proyecto_id en el componente

  // EstadosElemento
  ESTADOS_ELEMENTO: '/app/catalogos/estados_elemento/listar/',
  ESTADOS_ELEMENTO_CREAR: '/app/catalogos/estados_elemento/crear/',
  ESTADOS_ELEMENTO_ACTUALIZAR: `/app/catalogos/estados_elemento/editar`, // Se concatena /:proyecto_id en el componente
  ESTADOS_ELEMENTO_CAMBIAR_ESTADO: `/app/catalogos/estados_elemento/deshabilitar`, // Se concatena /:proyecto_id en el componente

  // Tipos de Relación de Casos de Uso
  TIPOS_RELACION_CU: '/app/catalogos/tipos_relacion_cu/listar/',
  TIPOS_RELACION_CU_CREAR: '/app/catalogos/tipos_relacion_cu/crear/',
  TIPOS_RELACION_CU_ACTUALIZAR: `/app/catalogos/tipos_relacion_cu/editar`, // Se concatena /:proyecto_id en el componente
  TIPOS_RELACION_CU_CAMBIAR_ESTADO: `/app/catalogos/tipos_relacion_cu/deshabilitar`, // Se concatena /:proyecto_id en el componente

  // Tipos de Relación de Requisitos
  TIPOS_RELACION_REQUISITO: '/app/catalogos/tipos_relacion_requisito/listar/',
  TIPOS_RELACION_REQUISITO_CREAR: '/app/catalogos/tipos_relacion_requisito/crear/',
  TIPOS_RELACION_REQUISITO_ACTUALIZAR: `/app/catalogos/tipos_relacion_requisito/editar`, // Se concatena /:proyecto_id en el componente
  TIPOS_RELACION_REQUISITO_CAMBIAR_ESTADO: `/app/catalogos/tipos_relacion_requisito/deshabilitar`, // Se concatena /:proyecto_id en el componente

  // Tipos de Estimación
  TIPOS_ESTIMACION: '/app/catalogos/tipos_estimacion/listar/',
  TIPOS_ESTIMACION_CREAR: '/app/catalogos/tipos_estimacion/crear/',
  TIPOS_ESTIMACION_ACTUALIZAR: `/app/catalogos/tipos_estimacion/editar`, // Se concatena /:id en el componente
  TIPOS_ESTIMACION_CAMBIAR_ESTADO: `/app/catalogos/tipos_estimacion/deshabilitar`, // Se concatena /:id en el componente

  // Endpoints de Requisitos - CRUD completo 
  CREAR_REQUISITO: '/app/requisitos/crear/',
  LISTAR_REQUISITOS: '/app/requisitos/listar', // Se concatena /:proyecto_id en el componente
  OBTENER_REQUISITO: '/app/requisitos/obtener', // Se concatena /:requisito_id en el componente 
  ACTUALIZAR_REQUISITO: '/app/requisitos/actualizar', // Se concatena /:requisito_id en el componente
  ELIMINAR_REQUISITO: '/app/requisitos/eliminar', // Se concatena /:requisito_id en el componente
  RELACIONES_REQUISITO: '/app/requisitos/relaciones', // Se concatena /:requisito_id en el componente

  // Endpoints de Casos de Uso - CRUD completo
  CREAR_CASO_USO: '/app/casosdeuso/crear/',
  LISTAR_CASOS_USO: '/app/casosdeuso/listar', // Se concatena /:proyecto_id en el componente
  OBTENER_CASO_USO: '/app/casosdeuso/obtener', // Se concatena /:caso_uso_id en el componente
  ACTUALIZAR_CASO_USO: '/app/casosdeuso/actualizar', // Se concatena /:caso_uso_id en el componente
  ELIMINAR_CASO_USO: '/app/casosdeuso/eliminar', // Se concatena /:caso_uso_id en el componente
  RELACIONES_CASO_USO: '/app/casosdeuso/relaciones', // Se concatena /:caso_uso_id en el componente

  // Endpoints de Historias de Usuario - CRUD completo
  CREAR_HISTORIA_USUARIO: '/app/historiasdeusuario/crear/',
  LISTAR_HISTORIAS_USUARIO: '/app/historiasdeusuario/listar', // Se concatena /:proyecto_id en el componente
  OBTENER_HISTORIA_USUARIO: '/app/historiasdeusuario/obtener', // Se concatena /:historia_id en el componente
  ACTUALIZAR_HISTORIA_USUARIO: '/app/historiasdeusuario/actualizar', // Se concatena /:historia_id en el componente
  ELIMINAR_HISTORIA_USUARIO: '/app/historiasdeusuario/eliminar', // Se concatena /:historia_id en el componente

  // ESQUEMAS DE BASE DE DATOS - CRUD COMPLETO CON IA
  LISTAR_MOTORES_BD: '/app/esquemas-bd/motores/',

  // Generación con IA
  GENERAR_ESQUEMA_BD_IA: '/app/chat/generar-esquema-bd', // Se concatena /:proyecto_id en el componente + body: {tipo_motor_id}
  PREVISUALIZAR_ESQUEMA_BD_IA: '/app/chat/previsualizar-esquema-bd', // Se concatena /:proyecto_id en el componente + body: {tipo_motor_id}

  // CRUD manual
  CREAR_ESQUEMA: '/app/esquemas-bd/crear/',
  OBTENER_ESQUEMA: '/app/esquemas-bd', // Se concatena /:esquema_id en el componente
  ACTUALIZAR_ESQUEMA: '/app/esquemas-bd/actualizar', // Se concatena /:esquema_id en el componente
  ELIMINAR_ESQUEMA: '/app/esquemas-bd/eliminar', // Se concatena /:esquema_id en el componente
  DUPLICAR_ESQUEMA: '/app/esquemas-bd/duplicar', // Se concatena /:esquema_id en el componente
  LISTAR_ESQUEMAS_PROYECTO: '/app/esquemas-bd/proyecto', // Se concatena /:proyecto_id en el componente
};

// Función helper para construir URLs completas
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Configuración por defecto para las peticiones
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Función helper para hacer peticiones POST con FormData
export const postFormData = async (endpoint, formData) => {
  try {
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.mensaje || errorData.message || errorMessage;
      } catch (parseError) {
        console.error('No se pudo parsear la respuesta de error:', parseError);
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    return await response.json();

  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión. Verifica que el servidor esté ejecutándose y que CORS esté configurado correctamente.');
    }

    throw error;
  }
};

// Función helper para hacer peticiones GET con autenticación
export const getWithAuth = async (endpoint, token) => {
  try {
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.mensaje || errorData.message || errorMessage;
      } catch (parseError) {
        console.error('No se pudo parsear la respuesta de error:', parseError);
      }

      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    return responseData;

  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión. Verifica que el servidor esté ejecutándose y que CORS esté configurado correctamente.');
    }

    throw error;
  }
};

// Función helper para hacer peticiones POST con JSON
export const postJSON = async (endpoint, data) => {
  try {
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.mensaje || errorData.message || errorMessage;
      } catch (parseError) {
        console.error('No se pudo parsear la respuesta de error:', parseError);
      }

      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    return responseData;

  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión. Verifica que el servidor esté ejecutándose y que CORS esté configurado correctamente.');
    }

    throw error;
  }
};

// POST JSON con autenticación (JWT)
export const postJSONAuth = async (endpoint, data, token) => {
  try {
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.mensaje || errorData.message || errorMessage;
      } catch (parseError) {
        console.error('No se pudo parsear la respuesta de error:', parseError);
      }

      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    return responseData;

  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión. Verifica que el servidor esté ejecutándose y que CORS esté configurado correctamente.');
    }

    throw error;
  }
};

// PUT JSON con autenticación (JWT)
export const putJSONAuth = async (endpoint, data, token) => {
  try {
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'PUT',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.mensaje || errorData.message || errorMessage;
      } catch (parseError) {
        console.error('No se pudo parsear la respuesta de error:', parseError);
      }

      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    return responseData;

  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión. Verifica que el servidor esté ejecutándose y que CORS esté configurado correctamente.');
    }

    throw error;
  }
};

// DELETE con autenticación (JWT)
export const deleteWithAuth = async (endpoint, token) => {
  try {
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'DELETE',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.mensaje || errorData.message || errorMessage;
      } catch (parseError) {
        console.error('No se pudo parsear la respuesta de error:', parseError);
      }

      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    return responseData;

  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión. Verifica que el servidor esté ejecutándose y que CORS esté configurado correctamente.');
    }

    throw error;
  }
};

// POST FormData con autenticación (JWT)
export const postFormDataAuth = async (endpoint, formData, token) => {
  try {
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.mensaje || errorData.message || errorMessage;
      } catch (parseError) {
        console.error('No se pudo parsear la respuesta de error:', parseError);
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};

  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión. Verifica que el servidor esté ejecutándose y que CORS esté configurado correctamente.');
    }
    throw error;
  }
};

// Función helper para obtener el token del localStorage
export const getStoredToken = () => {
  return localStorage.getItem('token');
};

// Función helper para guardar el token en localStorage
export const saveToken = (token) => {
  localStorage.setItem('token', token);
};

// Función helper para eliminar el token
export const removeToken = () => {
  localStorage.removeItem('token');
};