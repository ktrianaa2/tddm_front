import { useState, useCallback } from 'react';
import { message } from 'antd';
import { getStoredToken, API_ENDPOINTS } from '../../config'; 

// Datos de prueba simulados
const PRUEBAS_INICIALES_SIMULADAS = [
    {
        id_prueba: 1,
        id_proyecto: 1,
        tipo_prueba: 'unitaria',
        codigo: 'TEST-UNIT-001',
        tipo: 'unitaria', 
        nombre: 'Validar Función de Logaritmo Natural',
        descripcion: 'Verifica que la función log(x) devuelve el valor correcto para entradas mayores a 0.',
        estado: 'aprobada',
        especificacion_relacionada: 'REQ-MATH-001',
        fecha_creacion: '2025-11-20T10:00:00Z',
        prueba: { 
            nombre: 'Prueba Unitaria - Cálculo Logaritmo',
            objetivo: 'Verificar el cálculo preciso de logaritmos',
            precondiciones: ['El módulo de cálculo está inicializado'],
            pasos: [
                { numero: 1, descripcion: 'Llamar a logaritmo(1)', resultado_esperado: 'Retorna 0' },
                { numero: 2, descripcion: 'Llamar a logaritmo(-5)', resultado_esperado: 'Lanzar excepción "Dominio Inválido"' }
            ],
            postcondiciones: ['No hay fugas de memoria'],
            criterios_aceptacion: ['Resultado para x=1 es 0', 'Maneja errores de dominio'],
        }
    },
    {
        id_prueba: 2,
        id_proyecto: 1,
        tipo_prueba: 'sistema',
        codigo: 'TEST-SYS-005',
        tipo: 'sistema', 
        nombre: 'Flujo de Checkout y Notificación por Email',
        descripcion: 'Simula el proceso completo de compra y verifica la recepción del email de confirmación.',
        estado: 'aprobada',
        especificacion_relacionada: 'CU-001: Procesar Pago',
        fecha_creacion: '2025-11-25T14:30:00Z',
        prueba: {
            nombre: 'Prueba de Sistema - Notificación de Compra',
            objetivo: 'Validar la integración del carrito, pasarela de pago y servicio de email',
            precondiciones: ['Pasarela de pago simulada', 'Servicio de email activo'],
            pasos: [
                { numero: 1, descripcion: 'Autenticar y añadir producto', resultado_esperado: 'Producto en carrito' },
                { numero: 2, descripcion: 'Confirmar pago', resultado_esperado: 'Estado de orden "Pagada"' },
                { numero: 3, descripcion: 'Verificar email', resultado_esperado: 'Email de confirmación recibido en bandeja de entrada' }
            ],
            postcondiciones: ['El inventario se reduce', 'El usuario recibe notificación'],
            criterios_aceptacion: ['Email recibido < 5s', 'No hay transacciones duplicadas'],
        }
    },
    {
        id_prueba: 3,
        id_proyecto: 1,
        tipo_prueba: 'componente',
        codigo: 'TEST-COMP-010',
        tipo: 'componente', 
        nombre: 'Interacción del Componente Selector de Fechas',
        descripcion: 'Prueba el cambio de estado del componente `DatePicker` y sus validaciones de rango.',
        estado: 'pendiente',
        especificacion_relacionada: 'HU-003: Como usuario, quiero seleccionar un rango de fechas',
        fecha_creacion: '2025-11-26T08:15:00Z',
        prueba: {
            nombre: 'Prueba de Componente - Selector de Fechas',
            objetivo: 'Verificar que solo se puedan seleccionar fechas dentro del mes actual',
            precondiciones: ['El componente debe estar montado'],
            pasos: [
                { numero: 1, descripcion: 'Hacer clic en una fecha del mes anterior', resultado_esperado: 'La fecha permanece deshabilitada' },
                { numero: 2, descripcion: 'Seleccionar un rango de 3 días en el mes actual', resultado_esperado: 'El rango se selecciona y el estado del componente se actualiza' }
            ],
            postcondiciones: ['El estado del formulario es válido'],
            criterios_aceptacion: ['Fechas fuera de rango deshabilitadas', 'Selección de rango correcta'],
        }
    }
];

export const usePruebas = (proyectoId) => {
    const [loading, setLoading] = useState(false);
    const [pruebas, setPruebas] = useState([]);
    const [pruebaGenerada, setPruebaGenerada] = useState(null);
    const [pruebasCargadas, setPruebasCargadas] = useState(false); // ✅ Nuevo flag

    const generarPrueba = async (datos) => {
        if (!proyectoId) {
            message.error('No se ha especificado un proyecto');
            return null;
        }

        setLoading(true);
        setPruebaGenerada(null);

        try {
            const token = getStoredToken();
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            const pruebaSimuladaDetalle = generarPruebaSimulacion(datos);
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const nuevaPruebaSimulada = {
                id_prueba: Date.now(),
                id_proyecto: proyectoId,
                tipo_prueba: datos.tipo_prueba,
                codigo: `TEST-GEN-${Date.now().toString().slice(-4)}`,
                tipo: datos.tipo_prueba, 
                nombre: pruebaSimuladaDetalle.nombre,
                descripcion: pruebaSimuladaDetalle.objetivo,
                estado: 'borrador',
                especificacion_relacionada: `${datos.tipo_especificacion}-${datos.especificacion_id || 'N/A'}`,
                fecha_creacion: new Date().toISOString(),
                prueba: pruebaSimuladaDetalle, 
            };
            
            setPruebaGenerada(nuevaPruebaSimulada);
            message.success('Prueba generada exitosamente (Simulación)');
            return nuevaPruebaSimulada;

        } catch (error) {
            const errorMsg = error.message || 'Error al generar la prueba';
            message.error(errorMsg);
            console.error('Error generando prueba:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const guardarPrueba = async (prueba) => {
        if (!proyectoId) {
            message.error('No se ha especificado un proyecto');
            return null;
        }

        setLoading(true);

        try {
            const token = getStoredToken();
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

            setPruebas(prev => [...prev.filter(p => p.id_prueba !== prueba.id_prueba), { ...prueba, id_prueba: prueba.id_prueba || Date.now() }]);
            
            message.success('Prueba guardada exitosamente (Simulación)');
            return prueba;

        } catch (error) {
            const errorMsg = error.message || 'Error al guardar la prueba';
            message.error(errorMsg);
            console.error('Error guardando prueba:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };


    const cargarPruebas = useCallback(async () => {
        if (!proyectoId || pruebasCargadas) return; 

        setLoading(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            const dataSimulada = PRUEBAS_INICIALES_SIMULADAS.filter(p => p.id_proyecto === proyectoId);
            setPruebas(dataSimulada || []);
            setPruebasCargadas(true); 

            if (dataSimulada.length > 0) {
                message.success(`${dataSimulada.length} pruebas cargadas`, 2);
            }

        } catch (error) {
            const errorMsg = error.message || 'Error al cargar pruebas';
            message.error(errorMsg);
            console.error('Error cargando pruebas:', error);
        } finally {
            setLoading(false);
        }
    }, [proyectoId, pruebasCargadas]);

    const recargarPruebas = useCallback(async () => {
        setPruebasCargadas(false);
        await cargarPruebas();
    }, [cargarPruebas]);

    /**
     * Genera una prueba de simulación basada en los datos proporcionados
     */
    const generarPruebaSimulacion = (datos) => {
        const { tipo_especificacion, tipo_prueba, nivel_detalle } = datos;

        const plantillas = {
            unitaria: {
                nombre: 'Prueba Unitaria - Validación de Funcionalidad',
                objetivo: 'Verificar el correcto funcionamiento de la unidad de código específica',
                precondiciones: [
                    'El entorno de pruebas debe estar configurado',
                    'Las dependencias deben estar instaladas',
                    'Los datos de prueba deben estar disponibles'
                ],
                pasos: [
                    {
                        numero: 1,
                        descripcion: 'Inicializar el componente bajo prueba',
                        resultado_esperado: 'El componente se inicializa correctamente sin errores'
                    },
                    {
                        numero: 2,
                        descripcion: 'Ejecutar el método/función a probar con datos válidos',
                        resultado_esperado: 'La función retorna el resultado esperado'
                    },
                    {
                        numero: 3,
                        descripcion: 'Verificar el estado del componente después de la ejecución',
                        resultado_esperado: 'El estado coincide con el esperado'
                    },
                    {
                        numero: 4,
                        descripcion: 'Probar casos límite y valores extremos',
                        resultado_esperado: 'El componente maneja correctamente los casos límite'
                    }
                ],
                postcondiciones: [
                    'El componente mantiene su integridad',
                    'No hay efectos secundarios no deseados',
                    'Los recursos se liberan correctamente'
                ],
                criterios_aceptacion: [
                    'Todas las aserciones pasan exitosamente',
                    'La cobertura de código es >= 80%',
                    'No hay fugas de memoria',
                    'El tiempo de ejecución es < 100ms'
                ]
            },
            sistema: {
                nombre: 'Prueba de Sistema - Integración Completa',
                objetivo: 'Validar el comportamiento del sistema completo en un escenario de uso real',
                precondiciones: [
                    'El sistema completo debe estar desplegado',
                    'La base de datos debe estar inicializada',
                    'Los servicios externos deben estar disponibles',
                    'Los usuarios de prueba deben estar creados'
                ],
                pasos: [
                    {
                        numero: 1,
                        descripcion: 'Autenticar usuario en el sistema',
                        resultado_esperado: 'El usuario se autentica correctamente y recibe token de sesión'
                    },
                    {
                        numero: 2,
                        descripcion: 'Navegar a la funcionalidad bajo prueba',
                        resultado_esperado: 'La interfaz carga correctamente todos los componentes'
                    },
                    {
                        numero: 3,
                        descripcion: 'Ejecutar el flujo principal de la funcionalidad',
                        resultado_esperado: 'El sistema procesa la acción y actualiza el estado correctamente'
                    },
                    {
                        numero: 4,
                        descripcion: 'Verificar la persistencia de datos',
                        resultado_esperado: 'Los datos se almacenan correctamente en la base de datos'
                    },
                    {
                        numero: 5,
                        descripcion: 'Validar notificaciones y feedback al usuario',
                        resultado_esperado: 'El usuario recibe confirmación de la operación'
                    }
                ],
                postcondiciones: [
                    'El sistema mantiene su consistencia',
                    'Los datos persisten correctamente',
                    'No hay errores en los logs',
                    'La sesión del usuario sigue activa'
                ],
                criterios_aceptacion: [
                    'El flujo completo se ejecuta sin errores',
                    'El tiempo de respuesta es aceptable (<3s)',
                    'Los datos son consistentes en todo el sistema',
                    'La experiencia de usuario es fluida'
                ]
            },
            componente: {
                nombre: 'Prueba de Componente - Validación de Módulo',
                objetivo: 'Verificar el correcto funcionamiento del componente y sus interacciones',
                precondiciones: [
                    'El componente debe estar integrado en el sistema',
                    'Las dependencias del componente deben estar disponibles',
                    'Los datos de prueba deben estar preparados'
                ],
                pasos: [
                    {
                        numero: 1,
                        descripcion: 'Cargar el componente con configuración inicial',
                        resultado_esperado: 'El componente se renderiza correctamente'
                    },
                    {
                        numero: 2,
                        descripcion: 'Simular interacciones del usuario con el componente',
                        resultado_esperado: 'El componente responde apropiadamente a las interacciones'
                    },
                    {
                        numero: 3,
                        descripcion: 'Verificar la comunicación con otros componentes',
                        resultado_esperado: 'Los eventos se propagan correctamente'
                    },
                    {
                        numero: 4,
                        descripcion: 'Probar escenarios de error',
                        resultado_esperado: 'El componente maneja errores gracefully'
                    }
                ],
                postcondiciones: [
                    'El componente retorna a un estado estable',
                    'No hay eventos sin manejar',
                    'La memoria se libera correctamente'
                ],
                criterios_aceptacion: [
                    'Todas las interacciones funcionan correctamente',
                    'Los props se manejan apropiadamente',
                    'El componente es accesible',
                    'No hay warnings en consola'
                ]
            }
        };

        const plantilla = plantillas[tipo_prueba] || plantillas.unitaria;

        return {
            tipo_especificacion,
            tipo_prueba,
            nivel_detalle,
            nombre: plantilla.nombre,
            objetivo: plantilla.objetivo,
            precondiciones: plantilla.precondiciones,
            pasos: plantilla.pasos,
            postcondiciones: plantilla.postcondiciones,
            criterios_aceptacion: plantilla.criterios_aceptacion,
            prioridad: 'alta',
            estado: 'borrador',
            datos_prueba: {
                descripcion: 'Datos de prueba generados automáticamente',
                ejemplos: [
                    { caso: 'Caso válido típico', datos: 'datos_validos_1' },
                    { caso: 'Caso límite', datos: 'datos_limite_1' },
                    { caso: 'Caso inválido', datos: 'datos_invalidos_1' }
                ]
            },
            fecha_creacion: new Date().toISOString()
        };
    };

    const limpiarPruebaGenerada = () => {
        setPruebaGenerada(null);
    };

    return {
        // Estado
        loading,
        pruebas,
        pruebaGenerada,
        
        // Funciones
        generarPrueba,
        guardarPrueba,
        cargarPruebas,
        recargarPruebas,
        limpiarPruebaGenerada,
        
        // Setters
        setPruebas
    };
};

export default usePruebas;