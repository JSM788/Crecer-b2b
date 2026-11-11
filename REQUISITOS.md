Encuentra trabajo Pregunta a Uma™ Notas de la versión de los productos publicitarios Iniciar sesión                                     

Mensaje no leído de sobre ACC125 | Recopilación de datos de Horch (español) - Alto volumenShallimar D.
 
	
Shallimar D.
11:11 AM COT, 30 de octubre de 2026
 	
Shallimar D. envió una oferta.
El Freelancer completará una tarea única de grabación de voz para un cliente empresarial grabando oraciones en la variante de idioma español nativa asignada. Los colaboradores deben demostrar una pronunciación clara, sólidas habilidades de lectura y la capacidad de seguir con precisión todas las instrucciones de grabación y los requisitos del proyecto. Variantes de idioma: - Español – Argentina - Español – Chile - Español – Colombia - Español – Costa Rica - Español – Perú - Español – México Entregables y especificaciones Entregables: El Freelancer grabará 400 oraciones en la variante de español objetivo asignada leyendo el texto que se muestra en la pantalla. Especificaciones: Las grabaciones deben completarse usando un teléfono inteligente (iOS o Android) con un micrófono que funcione. Las grabaciones deben hacerse en un entorno silencioso libre de ruido de fondo y enviarse de acuerdo con las instrucciones del proyecto proporcionadas. Duración estimada de la tarea: Aproximadamente de 30 minutos a 1 hora. Estándares de calidad: Las grabaciones deben cumplir con los requisitos de calidad del cliente, que incluyen: - Pronunciación clara y natural en la variante de español asignada. - Lectura precisa de todas las oraciones que se muestran en la pantalla. - Ruido de fondo mínimo o nulo u otra interferencia de audio. - Adherencia adecuada a todas las instrucciones de grabación. - Grabaciones completas y utilizables adecuadas para los propósitos de recopilación de datos previstos por el cliente. Requisitos especiales Finalización de la tarea e instrucciones: El Freelancer es responsable de completar la tarea de grabación única y seguir cuidadosamente todas las instrucciones detalladas del proyecto. Elegibilidad: - Debe residir en una ubicación elegible aplicable a la variante de idioma asignada. - Debe tener un teléfono inteligente (iOS o Android) con un micrófono que funcione. - Debe tener acceso a un entorno de grabación silencioso libre de ruido de fondo. - Debe tener una conexión a Internet estable para cargar grabaciones. - Debe estar dispuesto y ser capaz de seguir todas las instrucciones de grabación con precisión. - Los colaboradores deben aprobar con éxito un examen como parte del proceso de calificación del proyecto. Envío y auditoría de calidad: Todas las grabaciones enviadas estarán sujetas a la auditoría de calidad del cliente. Solo los envíos que pasen la auditoría de calidad son elegibles para el pago. Si un envío no pasa la auditoría de calidad, los datos grabados pueden ser reelaborados de acuerdo con las instrucciones del cliente. Condiciones de pago de la compensación: El Freelancer será compensado a una tasa de $0.03 USD por unidad completada, donde 1 unidad = 1 oración grabada. Por 400 oraciones completas, el pago potencial es de $12.00 USD, siempre que el trabajo supere la auditoría de calidad correspondiente. Pago basado en la calidad: El pago está condicionado a que las grabaciones presentadas cumplan con los requisitos de calidad del cliente y superen la auditoría de calidad. Los trabajos que no superen la auditoría de calidad podrán ser revisados ​​según las instrucciones del cliente.
 	
¡Hola! Soy del equipo de Upwork y, en nombre del cliente, me complace enviarte esta oferta de contrato. El cliente se pondrá en contacto contigo por correo electrónico o a través del chat cuando esté listo parIntegración Core: SAP Business One (Service Layer / DI API) y Google Drive API. Objetivos: Optimización de ventas B2B, blindaje legal laboral (SUNAFIL), y automatización de cobranzas y reservas de stock.
1. REGLAS DEL MOTOR BACKEND (Invisibles para el usuario)
El sistema debe estar programado con estas reglas base en su núcleo antes de mostrar cualquier interfaz:
Anti-Mock GPS (Candado Legal): La aplicación bloquea el inicio de sesión si detecta que el celular tiene instaladas o activas aplicaciones de alteración de ubicación (Fake GPS).
Geolocalización por Eventos (Cero Tracking Continuo): El sistema no rastrea la ubicación "segundo a segundo" para proteger la privacidad. Solo captura coordenadas exactas al Iniciar Jornada, hacer Check-in, Check-out y Finalizar Jornada.
Cálculo de Distancia Matemático: El backend calcula matemáticamente los kilómetros entre el Check-in A y el Check-in B. Este dato es el insumo único para sustentar el pago de movilidad.
Desconexión Digital: Corte automático del GPS y cierre de sesión forzoso a la hora límite del turno si el vendedor olvida finalizar su jornada.
Fuente de la Verdad: El CRM es solo el "mensajero inteligente". SAP Business One es el único sistema que descuenta stock físico, emite notas de crédito y recalcula las líneas de crédito.
2. APP COMERCIAL (MÓDULO MÓVIL PARA EL VENDEDOR)
Herramienta de campo. Funciona offline (almacenamiento local tipo SQLite con sincronización en segundo plano) y prioriza la velocidad de uso.
A. Menú: FUERZA DE VENTAS (Ejecución y Ruta)
1. Mi Agenda (Planeamiento):
Crear un calendario según ruta programada, así como también las reservas por reuniones gerenciales.
Opción de "+ Agendar Visita" para solicitar atención a clientes nuevos o fuera de zona (requiere aprobación de la jefatura). Evitar cuello
2. Mi Ruta (Centro de Mando - Pantalla Dividida):
Cabecera: Botones de "Iniciar Jornada", "Refrigerio", y "Finalizar Jornada". Si el vendedor intenta finalizar la jornada teniendo visitas pendientes, el sistema exige justificar el motivo (Falla mecánica, emergencia médica, etc.) desde un menú desplegable y lanza una alerta a gerencia.
Geocerca: El botón de "Check-in" y el out de cada cliente solo se activa si el vendedor está a un máximo de 50 metros del perímetro real del local.
Mesa de Trabajo (Visita Activa): Tras el Check-in exitoso, se abre el panel de gestión:
Semáforo Financiero: Consulta en vivo a SAP B1 (Verde: Al día / Rojo: Deuda Vencida). Cuando el cliente tiene deuda, facturas vencidas, ocupación de línea de crédito. 
Auditoría y POP: Formularios para solicitar material publicitario o reportar quiebres. Tienen lógica condicional (Ej. Si marca "No hay stock en góndola", se abre obligatoriamente la pregunta "¿Por qué?"). Para fotos de exhibición o merchandising, la cámara se bloquea en la app (prohibido subir de la galería) e imprime una Marca de Agua irrefutable (Fecha, Hora, Coordenadas GPS).
3. Rendición de Gastos (Administrativo):
Formulario operativo exclusivo para sustentar viáticos y peajes durante la ruta.
Campos obligatorios: Categoría (Desplegable: Combustible, Peaje, Alimentación), RUC del proveedor (Numérico), Monto Total, Fecha y Captura Fotográfica del comprobante físico.
B. Menú: GESTIÓN DE VENTAS (Toma de Pedidos)
Flujo estructurado en 4 pasos para garantizar que el vendedor registre la demanda real, pero solo cobre y comprometa el stock existente.
Paso 1: El Catálogo y Semáforo de Stock (En línea con Almacén Lurín):
Fila Verde (Stock Completo): El producto se agrega normal y suma al total a pagar.
Fila Naranja (Stock Parcial): El sistema permite registrar lo que pide el cliente, pero divide automáticamente: la cantidad disponible pasa al "Total a Pagar Hoy", y el resto queda en sistema como Backorder.
Fila Roja (Sin Stock): Permite registrar la cantidad (para que Aquamundo mida la demanda insatisfecha), pero su costo NO se suma al total a cobrar del día.
Paso 2: El Resumen de Compra: La pantalla muestra claramente dos cifras: Monto Cotizado (lo que el cliente quería) y Monto a Pagar Hoy (el stock real disponible para facturar).
Paso 3: Envío de Cotización (El Filtro): Al enviar por WhatsApp, el PDF elimina automáticamente los productos en rojo (sin stock) y muestra solo lo que se despachará. Imprime este disclaimer obligatorio: "Esta cotización NO reserva stock físico. El inventario se asegura únicamente al confirmar el pago."
Paso 4: Conversión a Pedido (Cobranza): El comercial selecciona las facturas a pagar o el pedido actual. Adjunta la foto del voucher (aquí SÍ se permite usar la galería) y digita obligatoriamente el Número de Operación y el Banco.
C. Menú: MIS RESULTADOS
Dashboard rápido de desempeño personal.
Avance de Cuota Mensual: Gráfico circular de la meta de ventas.
Cumplimiento de Ruta: Visitas completadas vs. Visitas programadas en el mes.
Hit Rate: Porcentaje de visitas que terminaron en una venta efectiva.
3. AUTOMATIZACIÓN FINANCIERA (El Robot Integrador)
Motor de conciliación en segundo plano. Conecta la calle con Finanzas y SAP B1 sin intervención manual, eliminando los cuellos de botella.
1. Soft Allocation (Reserva de Stock): Al subir el voucher de un pago al contado, el CRM manda el pedido a SAP B1 como "Bloqueado para Entrega". El stock se reserva lógicamente, pero no se genera orden de picking en el WMS.
Caducidad: Si en 6 horas no se valida el pago, la reserva se anula y el stock se libera automáticamente.
2. El Robot Lector: El backend del CRM lee cíclicamente el documento de Google Drive actualizado por Finanzas. Busca coincidencias exactas del Número de Operación + Monto. Evaluar camino
3. Ejecución en SAP B1:
Si es Contado: El pago hace "match", el CRM ordena a SAP B1 quitar el bloqueo y el WMS de Lurín recibe la alerta para preparar el pedido.
Si es Crédito: El CRM genera un "Pago Recibido", mata las facturas adeudadas y SAP B1 libera automáticamente la línea de crédito del cliente.
Si hay Sobrepago: Si el cliente depositó de más, SAP B1 mata la deuda y asigna el sobrante como un "Saldo a Favor" para la próxima compra.
4. CONSOLA GERENCIAL (MÓDULO WEB PARA JEFATURA)
Panel de control en PC. Centraliza la toma de decisiones, la auditoría y la emisión de reportes legales.
A. Live Dashboard (Centro de Comando)
Mapa de Cobertura: Últimos check-ins en Lima de todo el equipo (visibilidad de posición actual sin rastreo invasivo).
Termómetro de Ruta: Avance porcentual diario de cada comercial frente a su cartera asignada.
Monitor de Emergencias: Alertas visuales si un comercial interrumpe la ruta. Sistema Drag & Drop para tomar los clientes no visitados y reasignarlos inmediatamente a otro vendedor cercano.
B. Centro de Aprobaciones
Bandeja para autorizar visitas Ad-Hoc (fuera de zona territorial).
Bandeja para autorizar salidas de inventario a costo cero (Material POP / Exhibidores).
C. Auditoría y Compliance Legal (Escudo SUNAFIL)
Visor de Exhibiciones (Anti-Fraude): Galería fotográfica para auditar el merchandising, filtrando por cliente y vendedor. Visualiza las marcas de agua inalterables.
Exportador de Sustento de Movilidad: Generador de reportes en Excel/PDF detallando: Fecha, Asesor, Clientes Visitados y Kilómetros totales calculados matemáticamente. Este anexo justifica legalmente el bono de movilidad ante inspecciones laborales.
D. Business Intelligence (KPIs)
Hit Rate: Efectividad de cierre global e individual.
Drop Size: Ticket Promedio por visita efectiva.
Motivos de No Compra: Gráficos tabulados automáticamente desde los formularios (Ej. % de ventas perdidas por precio, quiebre de stock, o local cerrado).a que comiences. NOTA: Hay un gran volumen de freelancers que se están contratando para este proyecto, por lo que no podremos ver ni responder a todos los mensajes individualmente con prontitud. ¡Gracias de antemano por tu paciencia!
 	
Ver en Upwork
 
O bien, puede responder contestando a este correo electrónico.
 
Descarga la aplicación Upwork para contratar , trabajar o ambas cosas estés donde estés.
Aplicación móvil
Descarga la aplicación Upwork para iPhone	Descarga la aplicación Upwork para Android
