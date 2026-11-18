/* ============================================================
   Textos del asistente de la web pública — español
   ------------------------------------------------------------
   Sale del js/assistant.js de la web estática. Aquí está TODO lo
   que el asistente dice; quien decide que decir es
   src/lib/web/asistente/guion.ts, y el que lo pinta es
   components/web/Asistente.tsx.

   Este diccionario no se cuelga del de la web (web.es.ts) porque
   solo lo carga el asistente: lo importa el propio componente, que
   ya es cliente. Si algún día hace falta desde t("web.…"), se
   anida ahí sin tocar las claves.

   Cómo se escriben los textos:
     · {variables} que rellena el guion: {dias}, {prueba},
       {tiendas}, {email}, {nombre}, los precios ({precioBasicCap})
       y las rutas ({planes}, {altaPro}, {privacidadAsistente}…).
     · markdown mínimo: **negrita**, listas con «- » al principio de
       línea, [texto](destino) y una línea en blanco para separar
       párrafos.
   El inglés vive en asistente.en.ts con exactamente las mismas
   claves; la interfaz TextosAsistente obliga a que sea así.
============================================================ */
import type { TextosAsistente } from "@/lib/web/asistente/guion";

const asistenteEs: TextosAsistente = {
  /* Marco de la ventana ------------------------------------- */
  nombre: "Asistente Bookmy",
  tagIa: "IA",
  abrirAria: "Abrir el {nombreAsistente}",
  cerrarAria: "Cerrar el asistente",
  reiniciarAria: "Empezar de nuevo",
  cerrarSugerenciaAria: "Cerrar sugerencia",
  teaserIa: "Asistente con IA · responde al instante",
  teaserSinIa: "Responde al instante",
  enLinea: "En línea · responde al instante",
  campoAria: "Escribe tu mensaje",
  marcador: "Pregúntame lo que quieras…",
  enviarAria: "Enviar",
  pieIa: "Asistente con IA · puede equivocarse",
  pieSinIa: "Asistente virtual de Bookmy",
  piePrivacidad: "Privacidad",
  avisoIa:
    "Soy un asistente virtual con inteligencia artificial y puedo equivocarme. Para temas de tu cuenta o pagos, te paso con el equipo. [Cómo tratamos tus datos]({privacidadAsistente}).",
  avisoSinIa:
    "Soy el asistente virtual de Bookmy. Para temas de tu cuenta o pagos, te paso con el equipo. [Cómo tratamos tus datos]({privacidadAsistente}).",

  /* Arranque de la conversación ----------------------------- */
  hola: "¡Hola!",
  holaNombre: "¡Hola, {nombre}!",
  aperturaNegocio:
    "¡Hola! Soy el asistente de Bookmy. Te ayudo a **elegir plan**, a **calcular lo que puedes recuperar** con Bookmy o a resolver cualquier duda. ¿Por dónde empezamos?",
  aperturaConsumidor:
    "¡Hola! Soy el asistente de Bookmy. Te ayudo a **reservar tu cita**, a **descargar la app** o, si tienes un negocio, a **aparecer en ella**. ¿Por dónde empezamos?",
  aperturaCorta: "¡Hola! Soy el asistente de Bookmy.",
  reinicio: "Empezamos de nuevo. ¿En qué te ayudo?",
  abiertoEnPestana: "¡Perfecto! Te lo he abierto en una pestaña nueva. Si te surge cualquier duda, sigo aquí.",
  empujon:
    "Por cierto: ¿quieres una recomendación a tu medida? Son 3 preguntas y te digo qué plan te conviene.",

  /* Chips del menú ------------------------------------------ */
  chipQueEs: "¿Qué es Bookmy?",
  chipRecomendar: "Recomiéndame un plan",
  chipRoi: "¿Cuánto pierdo por ausencias?",
  chipPlanes: "Planes y precios",
  chipTrial: "Probar Plan Pro {dias} días gratis",
  chipBasic: "Probar Plan Basic {dias} días gratis",
  chipDescargar: "Descargar la app",
  chipReservar: "¿Cómo reservo una cita?",
  chipNegocio: "Tengo un negocio",
  chipDemo: "Hablar con una persona",
  chipIa: "¿Qué hace la IA?",
  chipFunciona: "¿Cómo empiezo?",

  /* Sectores ------------------------------------------------ */
  chipSectorEstetica: "Estética",
  chipSectorPeluqueria: "Peluquería o barbería",
  chipSectorSalud: "Salud",
  chipSectorOtro: "Otro sector",
  nombreSectorEstetica: "estética",
  nombreSectorPeluqueria: "peluquería o barbería",
  nombreSectorSalud: "salud",
  nombreSectorBienestar: "deporte y bienestar",
  nombreSectorTatuajes: "tatuaje",
  nombreSectorConstruccion: "construcción y reformas",
  nombreSectorTecnologia: "tecnología",
  nombreSectorServicios: "servicios",

  /* Discurso por sector ------------------------------------- */
  pitchEstetica:
    "En **estética** cada hueco vacío y cada clienta que no repite cuesta dinero. Con Bookmy tus clientas reservan 24/7, reciben recordatorio, y tú tienes la ficha de cada una con sus tratamientos y preferencias. Además controlas productos e insumos, y la IA puede sugerir el siguiente servicio en el momento justo.",
  pitchPeluqueria:
    "En **peluquería y barbería** el día va a mil. Bookmy te quita el teléfono de encima: tus clientes eligen profesional y hora solos, reciben recordatorio, y tú ves la agenda de todo el equipo en tiempo real con el historial de cada cliente.",
  pitchSalud:
    "En **salud** la agenda lo es todo. Bookmy organiza las citas por profesional, envía confirmaciones y recordatorios automáticos y guarda el historial de visitas de cada paciente, con acceso controlado por usuario.",
  pitchBienestar:
    "En **deporte y bienestar** Bookmy organiza citas y sesiones por profesional y horario, y te ayuda a que tus clientes repitan con recordatorios y mensajes automáticos.",
  pitchTatuajes:
    "En **tatuaje y piercing** Bookmy organiza la agenda de cada artista, guarda el historial de cada cliente y te deja cobrar online o en el estudio con trazabilidad.",
  pitchConstruccion:
    "En **construcción y reformas** Bookmy te sirve para agendar visitas técnicas y citas con clientes, coordinar a tu equipo y tener el historial de cada cliente en un solo panel.",
  pitchTecnologia:
    "En **tecnología** Bookmy agenda demos, visitas técnicas y citas de soporte, las asigna al profesional adecuado y te da estadísticas para ver dónde se va el tiempo.",
  pitchServicios:
    "Para **servicios profesionales** Bookmy centraliza citas, clientes, cobros y equipo, para que tu agenda se llene sola y tú te dediques a trabajar.",

  /* Piezas que se reutilizan -------------------------------- */
  textoPrueba: "**{dias} días gratis**, sin tarjeta y sin permanencia",
  precioCon: "cuesta **{precio}**",
  precioSin: "tiene un precio que depende de tu negocio",
  enlaceGooglePlay: "Google Play",
  enlaceAppStore: "App Store",
  enlaceApk: "APK para Android",
  soporteWaTexto: "Hola, soy cliente de Bookmy y necesito ayuda con mi cuenta.",

  /* Respuestas guionizadas ---------------------------------- */
  resSaludoNegocio: "{hola} ¿Qué tipo de negocio tienes? Así te cuento exactamente cómo te ayudaría Bookmy.",
  resSaludoConsumidor: "{hola} ¿Quieres reservar una cita o tienes un negocio?",
  resQueEs:
    "**Bookmy no es solo una app de reservas: es el sistema que organiza y hace crecer tu negocio.** En un mismo panel tienes:\n- Reservas online 24/7 con confirmación automática\n- CRM con la ficha y el historial de cada cliente\n- Cobros, facturación e inventario\n- Equipo, horarios y varias sedes\n- Estadísticas en tiempo real y asistente con IA\n\n¿Qué tipo de negocio tienes? Te cuento cómo lo usarías tú.",
  resSector: "{pitch}\n\n¿Cuántas personas sois en el equipo? Con eso te digo qué plan te conviene.",
  resPrecio:
    "Los planes son del CRM, para tu negocio. Tienes dos ([Plan Basic]({planBasic}) y [Plan Pro]({planPro})):\n- **Plan Basic**: reservas online, agenda 24/7, confirmaciones automáticas y perfil público. {precioBasicCap}.\n- **Plan Pro**: todo el sistema (CRM, cobros, equipo, inventario, sedes, estadísticas e IA). {precioProCap}.\n\nLos dos se pueden probar {prueba}. ¿Te digo cuál te sale más a cuenta?",
  resPrueba:
    "Puedes probar el **Plan Basic** o el **Plan Pro** {prueba}. Eliges el plan en el alta y, al terminar, decides si sigues. Sin cargos sorpresa. ¿Empezamos?",
  resPermanencia:
    "**Sin permanencia.** No te atas a nada, y la prueba es de {dias} días sin tarjeta. Si en algún momento necesitas ayuda con tu suscripción, el equipo te atiende en [{email}](mailto:{email}).",
  resCaro:
    "Te entiendo: cada euro cuenta. Haz esta cuenta: ¿cuánto vale una cita que no se presenta en tu negocio? Si Bookmy te evita unas pocas al mes, la inversión se recupera rápido. Y puedes probar el plan que quieras {prueba}. ¿Lo calculamos con tus números?",
  resAusencias:
    "Las citas que no se presentan son dinero que no vuelve. Bookmy envía **confirmaciones y recordatorios automáticos**, y en el Plan Pro tienes **reglas de disponibilidad y reprogramaciones sin fricciones**. ¿Calculamos cuánto te están costando hoy? Son 4 datos.",
  resReservas:
    "Tus clientes reservan **24/7** desde tu perfil público o la app: eligen servicio, fecha y profesional, y reciben **confirmación al instante**. Tú ves la agenda actualizada en tiempo real, sin llamadas ni mensajes cruzados.",
  resReservar:
    "Reservar es muy fácil:\n- **1.** Descarga la app Bookmy (es gratis)\n- **2.** Busca tu centro y elige servicio\n- **3.** Elige especialista, día y hora\n- **4.** Paga online o en el local, como prefieras\n\nRecibes la confirmación al instante y un recordatorio antes de tu cita. {tiendas}",
  resCancelar:
    "Desde **«Mis reservas»** en tu perfil puedes cambiar o cancelar tu cita, sin coste, siempre que lo hagas con antelación. El hueco queda libre para otra persona.",
  resGratisApp:
    "Sí: **la app Bookmy es gratis**. Solo pagas el servicio que reservas, online o en el local. {tiendas}",
  resDescargar:
    "Descarga **Bookmy gratis**:\n- {tiendas}\n\nEl APK es para móviles Android sin Google Play: tu móvil te pedirá permiso para instalarlo.",
  resApk:
    "Puedes instalar Bookmy en Android con el archivo APK: [descargar el APK]({apk}). Al abrirlo, tu móvil te pedirá permiso para instalar apps de esta fuente. También la tienes en [Google Play]({playStore}) y en [App Store]({appStore}).",
  resEmpresasApp:
    "Con **Bookmy para empresas** tu negocio aparece en la app: tus clientes te encuentran, reservan y pagan en segundos, y tú gestionas las citas desde el móvil. Para darte de alta necesitas una cuenta del CRM (Plan Basic o Plan Pro), con {prueba}. [Así funciona]({appEmpresas}).",
  resCrm:
    "El **CRM de Bookmy** guarda la ficha de cada cliente: visitas, servicios, preferencias y consumo. Sabes quién lleva tiempo sin venir, quién gasta más y qué ofrecerle. Con la IA puedes **recuperar clientes inactivos** con mensajes personalizados. Está en el **Plan Pro**.",
  resPagos:
    "Con el **Plan Pro** cobras **online o en el local** y tienes la **trazabilidad de cada transacción**, junto con la facturación, en la misma plataforma. Los pagos los procesan proveedores certificados: Bookmy no guarda los datos completos de las tarjetas.",
  resEquipo:
    "En el **Plan Pro** asignas **roles, horarios y servicios** a cada persona del equipo, y cada una ve lo que le toca. ¿Cuántas personas sois?",
  resSedes:
    "El **Plan Pro** está pensado para negocios con varias sedes: las gestionas **todas desde un mismo panel**, cambias de sede en un clic y das a cada usuario acceso a la suya.",
  resStock:
    "El **control de inventario** del Plan Pro mantiene el stock de productos e insumos **sincronizado con cada reserva o venta**, para que no te quedes sin material a mitad de semana.",
  resEstadisticas:
    "Tu panel muestra en tiempo real **clientes, ingresos del mes, reservas y valoración media**, y las estadísticas te dicen qué servicios y profesionales rinden más. Decides con datos, no a ojo.",
  resResenas:
    "Bookmy reúne las **reseñas** de tus clientes y te enseña tu valoración media en el panel. Con la IA puedes pedir la reseña justo después del servicio, que es cuando el cliente está más contento.",
  resComunicacion:
    "Desde **Comunicación** hablas con tus clientes desde el propio panel, y con la IA puedes lanzar mensajes personalizados, por ejemplo a quien lleva semanas sin venir.",
  resAutomatizar:
    "Bookmy automatiza lo repetitivo: **confirmaciones, recordatorios y reprogramaciones**. Configuras las reglas una vez y el sistema trabaja solo, incluso en los días de más lío.",
  resIa:
    "El **asistente IA de Bookmy** atiende a tus clientes 24/7, reserva según tu disponibilidad real, **sugiere extras** según el historial de cada cliente, recupera clientes inactivos y te responde preguntas sobre tu negocio. [Descúbrelo aquí]({asistenteIa}).",
  resAppConsumidor:
    "La **app Bookmy** es gratis en iOS y Android: buscas tu centro, eliges servicio, especialista y hora, y pagas online o en el local. {tiendas}",
  resAppNegocio:
    "Sí: **Bookmy está en iOS y Android**. Tus clientes la descargan gratis, te encuentran, eligen servicio, especialista y hora, y pagan online o en el local. Tú gestionas tus citas desde el móvil y todo lo demás en el panel. [App para empresas]({appEmpresas}) · {tiendas}",
  resSeguridad:
    "Tus datos están protegidos con **cifrado en tránsito, control de accesos y monitorización continua**. Los pagos los procesan proveedores certificados y **no vendemos tus datos**. Tienes los detalles en la [política de privacidad]({privacidad}).",
  resYaUso:
    "¡Genial, ya sabes lo que es tener agenda online! La diferencia es que Bookmy no se queda en la reserva: une **CRM, cobros, equipo, inventario, sedes, estadísticas e IA** en un mismo panel, así que dejas de saltar entre herramientas. Pruébalo {dias} días en paralelo, sin tarjeta, y compara. ¿Quieres que el equipo te ayude con el cambio?",
  resTiempo:
    "Justo para eso está hecho. Creas la cuenta en menos de un minuto, añades tus servicios y horarios, y compartes tu enlace de reservas. A partir de ahí, Bookmy trabaja solo. Y si prefieres, el equipo te acompaña en el alta.",
  resWhatsapp:
    "Puedes seguir usando WhatsApp e Instagram: comparte allí tu **enlace de reservas de Bookmy** y tus clientes reservan solos, 24/7, sin idas y venidas de mensajes. Tú solo ves la cita confirmada en tu agenda.",
  resIdioma: "La plataforma está disponible en **español e inglés**.",
  resQuienes:
    "Bookmy es una plataforma de gestión para negocios de servicios. Trabajamos con negocios de la **Costa del Sol** (Benalmádena, Fuengirola, Marbella, Málaga, Torremolinos) y de **Colombia** (Bogotá y Medellín). [Conócenos]({quienesSomos}).",
  resFunciona:
    "Empezar es muy fácil:\n- **1.** Crea tu cuenta (menos de un minuto)\n- **2.** Añade servicios, horarios y equipo\n- **3.** Comparte tu perfil de reservas\n- **4.** Activa recordatorios y deja que Bookmy trabaje\n\nLos primeros {dias} días son gratis. [Ver el paso a paso]({comoFunciona}). ¿Te recomiendo plan?",
  resSoporte:
    "Si ya eres cliente, lo más rápido es hablar con soporte: [WhatsApp]({soporteWa}) o [{email}](mailto:{email}). Y aquí puedes [entrar a tu panel]({login}).",
  resGracias: "¡A ti! Si quieres, estos son los siguientes pasos:",
  resDespedida:
    "¡Perfecto! Para cuando lo decidas: el **Plan Basic** y el **Plan Pro** tienen {prueba}. Si me dejas tu email, el equipo te manda la información.",
  resFallbackConsumidor:
    "No quiero darte un dato incorrecto. Puedo explicarte cómo reservar, dónde descargar la app o, si tienes un negocio, cómo aparecer en ella. ¿Qué prefieres?",
  resFallbackNegocio:
    "Buena pregunta. No quiero darte un dato incorrecto, así que te propongo dos cosas: te paso con una persona del equipo o te cuento lo principal de Bookmy. ¿Qué prefieres?",

  /* Flujo «recomiéndame un plan» ---------------------------- */
  flujoRecomendarIntro: "Perfecto. Te recomiendo plan en 3 preguntas.",
  pasoEquipo: "¿Cuántas personas atendéis en tu negocio?",
  opEquipoSolo: "Solo yo",
  opEquipoPocos: "2 a 5",
  opEquipoMedio: "6 a 15",
  opEquipoMuchos: "Más de 15",
  pasoSedes: "¿Cuántas sedes o locales tienes?",
  opSedesUna: "1",
  opSedesPocas: "2 o 3",
  opSedesMuchas: "4 o más",
  pasoPrioridad: "¿Qué quieres mejorar primero?",
  opPrioridadAgenda: "Recibir reservas online",
  opPrioridadAusencias: "Que no falten clientes",
  opPrioridadCobros: "Cobros y facturación",
  opPrioridadEquipo: "Equipo y sedes",
  opPrioridadVentas: "Vender más a mis clientes",

  /* Flujo «cuánto pierdo por ausencias» --------------------- */
  flujoRoiIntro: "Vamos a calcularlo con 4 datos rápidos. Primero, para hacer las cuentas en tu moneda:",
  pasoPais: "¿En qué país está tu negocio?",
  opOtroPais: "Otro país",
  reintentoPais:
    "No he reconocido el país. Elige uno de la lista o escríbelo de otra forma, por ejemplo «Colombia» o «México».",
  pasoMoneda: "¿Cuál es tu país? Si lo prefieres, dime solo la moneda.",
  opEuros: "Euros (€)",
  opDolares: "Dólares (US$)",
  reintentoMoneda: "No lo he reconocido. Elige una opción o escribe tu país o tu moneda.",
  pasoCitas: "¿Cuántas citas atiendes a la semana, más o menos?",
  pasoTicket: "¿Cuánto cobras de media por cita, en {moneda}?",
  pasoTasa: "De cada 10 citas, ¿cuántas se caen sin avisar o a última hora?",
  opTasaCasiNinguna: "Casi ninguna",
  opTasaMuchas: "3 o más",

  /* Recomendación ------------------------------------------- */
  recPro: "Con lo que me cuentas, te recomiendo el **Plan Pro**:",
  recProSector: "Con lo que me cuentas, te recomiendo el **Plan Pro** para tu negocio de {sector}:",
  recBasic: "Para empezar, el **Plan Basic** te va perfecto:",
  recProCierre: "¿Prefieres probarlo tú directamente o que alguien del equipo te lo enseñe con tu caso?",
  recBasicCierre: "Pruébalo {dias} días gratis y, cuando crezcas, puedes pasar a Pro. ¿Te ayudo con algo más?",
  tarjetaPro: "Plan Pro",
  tarjetaBasic: "Plan Basic",
  tarjetaRecomendado: "Recomendado",
  tarjetaProbar: "Probar {dias} días gratis",
  tarjetaGarantia: "Sin tarjeta · sin permanencia",
  motivoEquipo: "Equipo con roles, horarios y servicios por persona",
  motivoSedes: "Todas tus sedes en un mismo panel",
  motivoAusencias: "Recordatorios automáticos y reprogramaciones sin fricciones",
  motivoCobros: "Cobros online o en local y facturación con trazabilidad",
  motivoVentas: "CRM con el historial de cada cliente para venderle mejor",
  motivoEquipoSolo: "Administración de trabajadores y sedes",
  motivoEstadisticas: "Estadísticas en tiempo real para decidir con datos",
  motivoReservas: "Reservas online 24/7 desde tu perfil público",
  motivoConfirmaciones: "Confirmaciones automáticas",
  motivoMovil: "Gestión desde el móvil o la tablet",
  motivoCrecer: "Puedes pasar a Pro cuando crezcas",

  /* Resultado del ROI --------------------------------------- */
  roiIntro: "Aquí tienes tu estimación, en {moneda}:",
  roiTitulo: "Lo que pierdes cada mes",
  roiDetalle:
    "Por {citasPerdidas} citas al mes que no se presentan ({citas} citas/semana · {ticket} de media).",
  roiRecupera:
    "Si los recordatorios y la reprogramación evitan solo **1 de cada 3**, recuperas **{mes} al mes** · **{anio} al año**.",
  roiNota: "Estimación orientativa en {moneda} ({cur}). Cada negocio es distinto.",
  roiNotaPais: "Estimación orientativa en {moneda} ({cur}) · {pais}. Cada negocio es distinto.",
  roiCierre:
    "Es dinero que ya estás generando y se te escapa. Lo más rápido para comprobarlo: **prueba el Plan Pro {dias} días gratis**, sin tarjeta, y activa los recordatorios hoy.",

  /* Captación de contactos ---------------------------------- */
  leadIntro:
    "¡Claro! Déjame tus datos y una persona del equipo te contacta en breve para enseñarte Bookmy con tu caso.",
  leadIntroRepetido:
    "Ya tenemos tus datos y el equipo te escribirá en breve. Si quieres, añade otra forma de contacto:",
  leadTitulo: "Hablar con el equipo",
  leadNombre: "Nombre",
  leadNombrePh: "Tu nombre",
  leadEmail: "Email",
  leadEmailPh: "Email",
  leadTelefono: "Teléfono",
  leadTelefonoPh: "Teléfono (opcional)",
  leadTipo: "Tipo de empresa",
  tipoSalud: "Salud",
  tipoEstetica: "Estética",
  tipoConstruccion: "Construcción",
  tipoTecnologia: "Tecnología",
  tipoServicios: "Servicios",
  tipoOtros: "Otros",
  leadConsentimiento:
    "Acepto que Bookmy use estos datos para responder a mi solicitud. Puedes ejercer tus derechos de acceso, rectificación o supresión. Más info en la [política de privacidad]({privacidadAsistente}).",
  leadEnviar: "Quiero que me contactéis",
  leadEnviando: "Enviando…",
  leadErrNombre: "Dinos tu nombre.",
  leadErrContacto: "Déjanos un email o un teléfono válido.",
  leadErrConsentimiento: "Necesitamos tu consentimiento para contactarte.",
  leadGracias:
    "¡Gracias, {nombre}! Lo hemos recibido y el equipo te contactará en breve. Mientras tanto, puedes [empezar tu prueba de {dias} días]({crearCuenta}) hoy mismo.",
  leadGraciasManual:
    "¡Gracias, {nombre}! Último paso: envíanos tu solicitud por el canal que prefieras y te respondemos enseguida.",
  envioTitulo: "Envía tu solicitud",
  envioWhatsapp: "Enviar por WhatsApp",
  envioEmail: "Enviar por email",
  envioAsunto: "Quiero conocer Bookmy",
  resumenHola: "Hola Bookmy, soy {nombre}{tipo}. Me interesa Bookmy.",
  resumenEquipo: "Equipo: {equipo}.",
  resumenSolo: "solo yo",
  resumenPersonas: "{n} personas aprox.",
  resumenSedes: "Sedes: {n}.",
  resumenPrioridad: "Prioridad: {prioridad}.",
  resumenContacto: "Contacto: {contacto}.",

  /* Sugerencias flotantes por página ------------------------ */
  teaserCrm: "¿Cuánto dinero pierdes por citas que no se presentan? Te lo calculo en tu moneda en 20 segundos.",
  teaserCrmEtiqueta: "Quiero calcularlo",
  teaserApp: "¿Te ayudo a reservar tu primera cita con Bookmy?",
  teaserAppEtiqueta: "¿Cómo reservo una cita?",
  teaserAppEmpresas: "¿Quieres que tu negocio aparezca en la app? Te cuento cómo en un minuto.",
  teaserAppEmpresasEtiqueta: "Quiero aparecer en la app",
  teaserPlanBasic: "¿Basic te basta o te conviene Pro? Te lo digo en 3 preguntas.",
  teaserPlanBasicEtiqueta: "Recomiéndame un plan",
  teaserPlanPro: "¿Cuánto recuperarías con Pro? Lo calculamos con tus números, en tu moneda.",
  teaserPlanProEtiqueta: "Quiero calcularlo",
  teaserPlanes: "¿Basic o Pro? Te digo cuál te conviene en 3 preguntas.",
  teaserPlanesEtiqueta: "Recomiéndame un plan",
  teaserComoFunciona: "¿Lo vemos para tu negocio? Te explico cómo empezar en tu caso.",
  teaserComoFuncionaEtiqueta: "¿Cómo empiezo?",
  teaserAsistenteIa: "Ponme a prueba: pregúntame lo que te preguntaría un cliente.",
  teaserAsistenteIaEtiqueta: "¿Qué puede hacer la IA por mi negocio?",
  teaserQuienesSomos: "¿Hablamos? Te pongo en contacto con el equipo en un momento.",
  teaserQuienesSomosEtiqueta: "Quiero hablar con el equipo",
  /* ── Cuando la prueba gratuita NO se ofrece ────────────────
     Estos textos SUSTITUYEN a los de arriba cuando
     SE_OFRECE_PRUEBA de src/lib/web/oferta.ts está en false, que
     es como está hoy: el backend no concede ninguna prueba y los
     cobros todavía no funcionan, así que el asistente no puede
     prometerla.

     No son un apaño: el Plan Basic ES gratis de verdad y para
     siempre, así que aquí se vende eso, que es lo que el producto
     sí cumple. Las dos versiones se quedan juntas para poder
     compararlas de un vistazo el día que la prueba se encienda. */
  sinPrueba: {
    chipTrial: "Ver qué trae el Plan Pro",
    chipBasic: "Empezar gratis con el Plan Basic",
    textoPrueba: "**gratis para empezar**, sin tarjeta y sin permanencia",
    tarjetaProbar: "Empezar gratis",
    recBasicCierre:
      "Empieza con el Basic, que es gratis, y pásate a Pro cuando te haga falta. ¿Te ayudo con algo más?",
    resPermanencia:
      "**Sin permanencia.** No te atas a nada: el Plan Basic es gratis y el Pro se paga mes a mes, sin cláusulas. Si necesitas ayuda con tu suscripción, el equipo te atiende en [{email}](mailto:{email}).",
    resYaUso:
      "¡Genial, ya sabes lo que es tener agenda online! La diferencia es que Bookmy no se queda en la reserva: une **CRM, cobros, equipo, inventario, sedes, estadísticas e IA** en un mismo panel, así que dejas de saltar entre herramientas. Empieza con el Basic en paralelo, sin tarjeta, y compara. ¿Quieres que el equipo te ayude con el cambio?",
    resFunciona:
      "Empezar es muy fácil:\n- **1.** Crea tu cuenta (menos de un minuto)\n- **2.** Añade servicios, horarios y equipo\n- **3.** Comparte tu perfil de reservas\n- **4.** Activa recordatorios y deja que Bookmy trabaje\n\nEl Plan Basic es gratis, así que puedes empezar hoy. [Ver el paso a paso]({comoFunciona}). ¿Te recomiendo plan?",
    roiCierre:
      "Es dinero que ya estás generando y se te escapa. Lo más rápido para comprobarlo: **crea tu cuenta gratis** y activa los recordatorios hoy.",
    leadGracias:
      "¡Gracias, {nombre}! Lo hemos recibido y el equipo te contactará en breve. Mientras tanto, puedes [crear tu cuenta gratis]({crearCuenta}) hoy mismo.",
  },
};

export default asistenteEs;
