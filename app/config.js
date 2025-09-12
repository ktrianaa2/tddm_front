// config.js - Configuración actualizada con endpoints de requisitos y funciones PUT/DELETE

// URL base de tu API
export const API_BASE_URL = 'http://localhost:8000'; // URL de API

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
  ELIMINAR_PROYECTO: '/app/proyectos/eliminar',  // Se concatena /:id en el componente

  // Tipos de Requisito
  TIPOS_REQUISITO: '/app/catalogos/listar/',
  TIPOS_REQUISITO_CREAR: '/app/catalogos/crear/',
  TIPOS_REQUISITO_ACTUALIZAR: (id) => `/app/catalogos/editar/${id}/`,
  TIPOS_REQUISITO_CAMBIAR_ESTADO: (id) => `/app/catalogos/deshabilitar/${id}/`,

  // Prioridades
  PRIORIDADES: '/app/catalogos/prioridades/listar/',
  PRIORIDADES_CREAR: '/app/catalogos/prioridades/crear/',
  PRIORIDADES_ACTUALIZAR: (id) => `/app/catalogos/prioridades/editar/${id}/`,
  PRIORIDADES_CAMBIAR_ESTADO: (id) => `/app/catalogos/prioridades/deshabilitar/${id}/`,

  // Estados de Proyecto
  ESTADOS_PROYECTO: '/app/catalogos/estados/listar/',
  ESTADOS_PROYECTO_CREAR: '/app/catalogos/estados/crear/',
  ESTADOS_PROYECTO_ACTUALIZAR: (id) => `/app/catalogos/estados/editar/${id}/`,
  ESTADOS_PROYECTO_CAMBIAR_ESTADO: (id) => `/app/catalogos/estados/deshabilitar/${id}/`,

  // EstadosElemento
  ESTADOS_ELEMENTO: '/app/catalogos/estados_elemento/listar/',
  ESTADOS_ELEMENTO_CREAR: '/app/catalogos/estados_elemento/crear/',
  ESTADOS_ELEMENTO_ACTUALIZAR: (id) => `/app/catalogos/estados_elemento/editar/${id}/`,
  ESTADOS_ELEMENTO_CAMBIAR_ESTADO: (id) => `/app/catalogos/estados_elemento/deshabilitar/${id}/`,

  // Tipos de Relación de Casos de Uso
  TIPOS_RELACION_CU: '/app/catalogos/tipos_relacion_cu/listar/',
  TIPOS_RELACION_CU_CREAR: '/app/catalogos/tipos_relacion_cu/crear/',
  TIPOS_RELACION_CU_ACTUALIZAR: (id) => `/app/catalogos/tipos_relacion_cu/editar/${id}/`,
  TIPOS_RELACION_CU_CAMBIAR_ESTADO: (id) => `/app/catalogos/tipos_relacion_cu/deshabilitar/${id}/`,

  // Tipos de Relación de Requisitos
  TIPOS_RELACION_REQUISITO: '/app/catalogos/tipos_relacion_requisito/listar/',
  TIPOS_RELACION_REQUISITO_CREAR: '/app/catalogos/tipos_relacion_requisito/crear/',
  TIPOS_RELACION_REQUISITO_ACTUALIZAR: (id) => `/app/catalogos/tipos_relacion_requisito/editar/${id}/`,
  TIPOS_RELACION_REQUISITO_CAMBIAR_ESTADO: (id) => `/app/catalogos/tipos_relacion_requisito/deshabilitar/${id}/`,

  // Requisitos
  CREAR_REQUISITO: '/app/requisitos/crear/',
  LISTAR_REQUISITOS: (proyecto_id) => `/app/requisitos/listar/${proyecto_id}/`,
  OBTENER_REQUISITO: (id) => `/app/requisitos/obtener/${id}/`,
  ACTUALIZAR_REQUISITO: (id) => `/app/requisitos/editar/${id}/`,
  ELIMINAR_REQUISITO: (id) => `/app/requisitos/eliminar/${id}/`,
  RELACIONES_REQUISITO: (id) => `/app/requisitos/relaciones/${id}/`,
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

// PUT JSON con autenticación (JWT) - AGREGADA
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

// DELETE con autenticación (JWT) - AGREGADA
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