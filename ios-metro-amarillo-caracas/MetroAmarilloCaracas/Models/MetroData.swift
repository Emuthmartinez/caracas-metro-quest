import SwiftUI

enum MetroData {
    static let lines: [MetroLine] = [
        makeLine(
            id: "L1",
            number: "1",
            name: "Propatria ↔ Palo Verde",
            displayName: "Línea 1 Roja",
            accent: Color(hex: 0xE83B3B),
            darkAccent: Color(hex: 0x8C1E2C),
            stationNames: [
                "Propatria", "Pérez Bonalde", "Plaza Sucre", "Gato Negro", "Agua Salud", "Caño Amarillo", "Capitolio", "La Hoyada", "Parque Carabobo", "Bellas Artes", "Colegio de Ingenieros", "Plaza Venezuela", "Sabana Grande", "Chacaíto", "Chacao", "Altamira", "Miranda", "Los Dos Caminos", "Los Cortijos", "La California", "Petare", "Palo Verde"
            ],
            transfers: [
                "Capitolio": ["L2"],
                "Plaza Venezuela": ["L3"]
            ],
            plannedStations: [],
            routeNote: "The backbone east-west ride under Caracas, from Propatria to Palo Verde."
        ),
        makeLine(
            id: "L2",
            number: "2",
            name: "El Silencio ↔ Las Adjuntas / Zoológico",
            displayName: "Línea 2 Verde",
            accent: Color(hex: 0x35B96F),
            darkAccent: Color(hex: 0x1C7045),
            stationNames: [
                "El Silencio", "Capuchinos", "Maternidad", "Artigas", "La Paz", "La Yaguara", "Carapita", "Antímano", "Mamera", "Ruiz Pineda", "Caricuao", "Zoológico", "Las Adjuntas"
            ],
            transfers: [
                "El Silencio": ["L1"],
                "Capuchinos": ["L4"],
                "Las Adjuntas": ["Los Teques"]
            ],
            plannedStations: [],
            routeNote: "West-side branch service through Caricuao, splitting toward Zoológico and Las Adjuntas."
        ),
        makeLine(
            id: "L3",
            number: "3",
            name: "Plaza Venezuela ↔ La Rinconada",
            displayName: "Línea 3 Azul",
            accent: Color(hex: 0x3C7DFF),
            darkAccent: Color(hex: 0x214C9F),
            stationNames: [
                "Plaza Venezuela", "Ciudad Universitaria", "Los Símbolos", "La Bandera", "El Valle", "Los Jardines", "Coche", "Mercado", "La Rinconada"
            ],
            transfers: [
                "Plaza Venezuela": ["L1"]
            ],
            plannedStations: [],
            routeNote: "A north-south ride from Plaza Venezuela to the rail terminal at La Rinconada."
        ),
        makeLine(
            id: "L4",
            number: "4",
            name: "Zona Rental ↔ Capuchinos",
            displayName: "Línea 4 Amarilla",
            accent: Color(hex: 0xFFD447),
            darkAccent: Color(hex: 0xB87816),
            stationNames: [
                "Zona Rental", "Parque Central", "Nuevo Circo", "Teatros", "Capuchinos"
            ],
            transfers: [
                "Zona Rental": ["L5"],
                "Capuchinos": ["L2"]
            ],
            plannedStations: [],
            routeNote: "A short central connector under the theater district and Parque Central towers."
        ),
        makeLine(
            id: "L5",
            number: "5",
            name: "Zona Rental ↔ Bello Monte",
            displayName: "Línea 5 Morada",
            accent: Color(hex: 0x9B5CFF),
            darkAccent: Color(hex: 0x5B329E),
            stationNames: [
                "Zona Rental", "Bello Monte"
            ],
            transfers: [
                "Zona Rental": ["L4"]
            ],
            plannedStations: ["Las Mercedes", "Tamanaco", "Chuao", "Bello Campo", "Warairarepano"],
            routeNote: "Anunciada con bombo en 2006, congelada por la corrupción. Solo Zona Rental ↔ Bello Monte funciona; el resto lleva más de una década 'en obras'. La línea no está incompleta: está esperando, como el país."
        )
    ]

    static let npcs: [MetroNPC] = [
        MetroNPC(
            id: "dona-perpetua-cano-amarillo",
            name: "Doña Perpetua Salcedo",
            role: "Vendedora de lotería",
            stationName: "Caño Amarillo",
            lineID: "L1",
            palette: Color(hex: 0xFFB347),
            dialoguePool: [
            "Llevo cuarenta años aquí, mijo, y el caño ya no huele a caño — huele a promesas que nadie cumplió.",
            "¿Comprás un número? No pa' ganar, vale, sino pa' tener algo en lo que creer esta semana.",
            "Una vez llegó un señor a comprarme to' los números. Se los vendí. Nunca lo volví a ver. Na' guará."
            ],
            visual: NPCVisual(buildRaw: "heavy", skinRaw: "brown", hairRaw: "gray", headwearRaw: "panuelo", propRaw: "tickets")
        ),
        MetroNPC(
            id: "licenciado-eleazar-capitolio",
            name: "Licenciado Eleazar Marcano",
            role: "Burócrata difunto en cola eterna",
            stationName: "Capitolio",
            lineID: "L1",
            palette: Color(hex: 0xD4A574),
            dialoguePool: [
            "Permiso, chamo, ¿tú sabes si la ventanilla cuatro sigue abierta? Llevo desde las siete de la mañana.",
            "Dicen que cambiaron el trámite a en línea. ¿Eso qué es? ¿Cómo se hace una cola en línea, vale?",
            "No te preocupes por mí. Yo tengo paciencia. La gente me pasa por el lado hace años y yo aquí, fino."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "medium", hairRaw: "short", headwearRaw: "none", propRaw: "briefcase")
        ),
        MetroNPC(
            id: "nena-hoyada",
            name: "Nena Castrillo",
            role: "Señora del mercado que vende guarapo",
            stationName: "La Hoyada",
            lineID: "L1",
            palette: Color(hex: 0xFF8C42),
            dialoguePool: [
            "Épale, muchacho, te veo la cara de hambre. No es hambre de comida, es hambre de casa, ¿verdad?",
            "Este guarapo lo hago con papelón de Barlovento y una piedra del Ávila. Así le entra el cerro en el cuerpo, pana.",
            "Tómatelo despacio. La prisa es pa' los que no tienen dónde llegar, mijo."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "dark", hairRaw: "bun", headwearRaw: "none", propRaw: "basket")
        ),
        MetroNPC(
            id: "profesor-remigio-parque-carabobo",
            name: "Profesor Remigio Urdaneta",
            role: "Maestro jubilado que descansa en el parque",
            stationName: "Parque Carabobo",
            lineID: "L1",
            palette: Color(hex: 0xD4B896),
            dialoguePool: [
            "Carabobo gana siempre la batalla, chamo, pero los otros días es que están duros.",
            "La estatua hoy no está de humor. Ayer le leí lo del presupuesto y como que se ofendió.",
            "¿Estudiaste, mijo? No importa. Lo que importa es que sigas aprendiendo. El estudio no se acaba con el bachillerato."
            ],
            visual: NPCVisual(buildRaw: "elder", skinRaw: "medium", hairRaw: "gray", headwearRaw: "none", propRaw: "newspaper")
        ),
        MetroNPC(
            id: "flautista-bellas-artes",
            name: "Xiomara Pietrantoni",
            role: "Flautista de la Orquesta Simón Bolívar, retirada",
            stationName: "Bellas Artes",
            lineID: "L1",
            palette: Color(hex: 0xC9A0DC),
            dialoguePool: [
            "Yo toqué treinta años con la Simón Bolívar. Ahora toco aquí, pa' los que no pueden pagar boleto.",
            "¿Oíste ese eco raro? No es el túnel, vale. Es el público de siempre. Na' guará, qué fieles.",
            "La música no se va del cuerpo aunque los años se vayan. Eso me lo enseñó el maestro Abreu y él tenía razón."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "light", hairRaw: "long", headwearRaw: "none", propRaw: "flute")
        ),
        MetroNPC(
            id: "ingeniero-felix-colegio-ingenieros",
            name: "Félix Rodríguez Amaral",
            role: "Ingeniero civil que nunca terminó su obra",
            stationName: "Colegio de Ingenieros",
            lineID: "L1",
            palette: Color(hex: 0xB8860B),
            dialoguePool: [
            "La Línea 5 va a estar lista, chamo. Es cuestión de voluntad política. Eso lo dijeron en el noventa y dos también, pero igual.",
            "Coño, yo calculé esas vigas con una regla de cálculo, ¿y me van a decir que no hay plata? Qué molleja.",
            "El problema de este país no es que le falte ingenio, mijo. Es que le sobran reuniones y le faltan clavos."
            ],
            visual: NPCVisual(buildRaw: "elder", skinRaw: "medium", hairRaw: "gray", headwearRaw: "hardhat", propRaw: "briefcase")
        ),
        MetroNPC(
            id: "marisol-plaza-venezuela",
            name: "Marisol Torrealba",
            role: "Vendedora de lotería y números",
            stationName: "Plaza Venezuela",
            lineID: "L1",
            palette: Color(hex: 0xFFB84D),
            dialoguePool: [
            "Épale, mijo. El 04-17-33. Te lo digo yo, esos números salen esta noche. Los vi en el chorro de la fuente.",
            "Na' guará, la fuente de Plaza Venezuela no para de hablar. A veces en arameo, a veces en criollo. Esta mañana dijo tu nombre.",
            "Cómprame aunque sea uno, vale. Pa' la suerte no importa si lo cobrás — importa que lo cargues encima."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "brown", hairRaw: "bun", headwearRaw: "none", propRaw: "tickets")
        ),
        MetroNPC(
            id: "yuneixi-chacaito",
            name: "Yuneixi Marcano",
            role: "Estudiante de medicina con una mochila que pesa más que ella",
            stationName: "Chacaíto",
            lineID: "L1",
            palette: Color(hex: 0xFF8C69),
            dialoguePool: [
            "Llevo seis libros que no son míos. Gleimar se fue a Madrid, Adri a Santiago... me los dejaron 'porque tú vas a terminar'. Así que termino por to'.",
            "¿Tú sientes ese olor a harina? Me recuerda a mi abuela en Maracaibo. ¿De dónde viene eso?",
            "Chacaíto siempre lleno. Como si nadie llegara a ningún lado — to' el mundo solo está aquí, esperando."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "dark", hairRaw: "curly", headwearRaw: "none", propRaw: "book")
        ),
        MetroNPC(
            id: "guacamaya-chacao",
            name: "La Guacamaya de Chacao",
            role: "Agorera de plumas azules y oro que lee palmas en el andén",
            stationName: "Chacao",
            lineID: "L1",
            palette: Color(hex: 0x4FC3F7),
            dialoguePool: [
            "GRAAK. Pana, no corras. La línea de tu vida dobla aquí. Dobla, no termina. Hay diferencia.",
            "El Ávila me mandó. Me dijo: 'baja, que hay uno que huele a pan y necesita saber que va bien'. Tú eres ese, ¿verdad?",
            "GRAAK. No le digas a nadie lo que te dije. Si lo repites en voz alta, se desaparece. Así es como funciona esto."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "brown", hairRaw: "curly", headwearRaw: "feathers", propRaw: "bird")
        ),
        MetroNPC(
            id: "reinaldo-altamira",
            name: "Reinaldo Blanco",
            role: "Vigilante nocturno jubilado que escucha hablar a la montaña",
            stationName: "Altamira",
            lineID: "L1",
            palette: Color(hex: 0xE8A87C),
            dialoguePool: [
            "El Ávila habló anoche. Dijo que alguien va a irse lejos muy pronto. No sé si eres tú. No sé si soy yo. Pero alguien.",
            "Veintitrés años de vigilante y nunca entendí por qué robaban. La montaña me explicó: 'porque tienen hambre de algo que no saben nombrar'. Coño 'e madre, qué verdad.",
            "¿Ves esa luz allá arriba, entre los árboles? Son los ojos de la montaña. A veces te guiñan."
            ],
            visual: NPCVisual(buildRaw: "elder", skinRaw: "medium", hairRaw: "gray", headwearRaw: "cap", propRaw: "newspaper")
        ),
        MetroNPC(
            id: "donatella-miranda",
            name: "Donatella Figueroa de Rossi",
            role: "Abuela italiana-venezolana que regresa sola del mercado",
            stationName: "Miranda",
            lineID: "L1",
            palette: Color(hex: 0xFFCC80),
            dialoguePool: [
            "Enzo, mira ese chamo con la harina. ¡Mira! — Ay perdona, mijo, le hablo a mi esposo. Está aquí al lado, pero ya tú sabes cómo son los viejos.",
            "¿Tú eres de Los Jardines? Nosotros vivimos en Bello Monte cuarenta años. Enzo dice que ese pan tuyo huele igualito al de su mamá en Génova.",
            "No llores en el metro — me decía Enzo. Pero qué va, uno llora donde puede. El metro es nuestro, ¿verdad?"
            ],
            visual: NPCVisual(buildRaw: "elder", skinRaw: "light", hairRaw: "bun", headwearRaw: "none", propRaw: "basket")
        ),
        MetroNPC(
            id: "luisito-dos-caminos",
            name: "Luisito el de Los Dos Caminos",
            role: "Mototaxista en pausa que conoce to'os los atajos del este",
            stationName: "Los Dos Caminos",
            lineID: "L1",
            palette: Color(hex: 0xA5D6A7),
            dialoguePool: [
            "Épale, compa. Los Dos Caminos tiene dos caminos, pero el bueno es el que uno no escoge — ese te escoge a ti.",
            "Una vez llevé un pasajero al aeropuerto y terminamos en Petare. Él llegó tarde al vuelo, pero encontró a su hermano que tenía diez años sin ver. ¿Quién soy yo pa' discutir eso?",
            "Na' guará ese olor a harina, hermano. Aquí la gente siempre está llegando con hambre de algo."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "brown", hairRaw: "short", headwearRaw: "cap", propRaw: "none")
        ),
        MetroNPC(
            id: "dona-esperanza-los-cortijos",
            name: "Doña Esperanza",
            role: "Abuela vendedora de cambur",
            stationName: "Los Cortijos",
            lineID: "L1",
            palette: Color(hex: 0xFFB84D),
            dialoguePool: [
            "Toma, mijo, un camburito pa' el viaje. Hoy el Ávila amaneció con niebla en la cintura — eso significa que alguien necesita que lo cuiden.",
            "¿Ese olor es harina de trigo? Na' guará, chamo, me recordaste a mi difunto que hacía cachitos los domingos. Dios lo tenga.",
            "Llévate el cambur. Los de aquí saben diferente — tienen el sabor del río Guaire antes de que lo ensuciaran, cuando todavía cantaba."
            ],
            visual: NPCVisual(buildRaw: "elder", skinRaw: "brown", hairRaw: "bun", headwearRaw: "panuelo", propRaw: "basket")
        ),
        MetroNPC(
            id: "marisol-la-california",
            name: "Marisol",
            role: "Profesora jubilada que espera un tren que pasó en 1998",
            stationName: "La California",
            lineID: "L1",
            palette: Color(hex: 0xFF8C69),
            dialoguePool: [
            "¿Tú viste pasar un tren sin pasajeros ahorita? Era el de las 3:47. A veces pasa, a veces no. Uno aprende a esperar.",
            "Mi muchacho se fue por ese tren pa' Madrid. Me dijo que volvía en diciembre. Eso fue varios diciembres atrás, chama.",
            "Tú cargas mucho peso, mijo. Hay pesos que no se ven y esos son los que doblan la espalda de verdad."
            ],
            visual: NPCVisual(buildRaw: "elder", skinRaw: "medium", hairRaw: "gray", headwearRaw: "none", propRaw: "book")
        ),
        MetroNPC(
            id: "luisito-petare",
            name: "Luisito",
            role: "Niño cromos-trader del barrio",
            stationName: "Petare",
            lineID: "L1",
            palette: Color(hex: 0xFFD700),
            dialoguePool: [
            "¡Épale, señor! ¿Tienes cromos repetidos? Yo tengo to' el álbum menos el cromo de Maradona — bueno, lo tengo, pero ese no lo cambio ni por na'.",
            "Mira este cromo, chamo. Mi abuelo dice que tiene un espíritu adentro. Cuando lo enseño, la gente se pone rara. ¿Tú lo ves?",
            "¿Eres el que vende pan en Los Jardines? Mi mamá dice que tu focaccia sabe a Italia pero huele a Venezuela. Eso es lo más fino que he escuchado."
            ],
            visual: NPCVisual(buildRaw: "child", skinRaw: "brown", hairRaw: "short", headwearRaw: "cap", propRaw: "newspaper")
        ),
        MetroNPC(
            id: "remigio-palo-verde",
            name: "Remigio",
            role: "Hombre que lleva 12 años esperando que terminen el Metrocable",
            stationName: "Palo Verde",
            lineID: "L1",
            palette: Color(hex: 0xFF6B35),
            dialoguePool: [
            "La línea la prometieron cuando nació mi hija. Ella ya tiene quince años. Pero yo tengo fe — la fe es lo único que no está en construcción aquí.",
            "¿Ves esas góndolas arriba? Ayer en la madrugada se movieron solas. No había viento. Aquí en Petare uno aprende que to' tiene su ánima, hasta las obras sin terminar.",
            "Cuidado con la escalera del callejón Miramar — anoche cambió de lugar otra vez y nadie sabe pa' dónde queda ahora."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "dark", hairRaw: "short", headwearRaw: "cap", propRaw: "wrench")
        ),
        MetroNPC(
            id: "propatria-dona-mireya",
            name: "Doña Mireya",
            role: "Vendedora de empanadas",
            stationName: "Propatria",
            lineID: "L1",
            palette: Color(hex: 0xFFA040),
            dialoguePool: [
            "Llevo cuarenta años aquí, chama. Propatria huele a aceite caliente y a promesas. Cómprate una empanada.",
            "Ese hombre con la harina… na' guará, me recuerda a mi papá. Él también cargaba peso to' el día y llegaba a casa silbando.",
            "Yo le echo tierra del Ávila a la masa. No me preguntes por qué. La gente llega sana a donde va. Eso es to'."
            ],
            visual: NPCVisual(buildRaw: "heavy", skinRaw: "brown", hairRaw: "bun", headwearRaw: "panuelo", propRaw: "basket")
        ),
        MetroNPC(
            id: "perez-bonalde-nino-edgar",
            name: "Edgarcito",
            role: "Niño que espera a su abuela",
            stationName: "Pérez Bonalde",
            lineID: "L1",
            palette: Color(hex: 0xFFD580),
            dialoguePool: [
            "¿Tú ves al señor con el sombrero de cogollo? Ese no se baja nunca. Ya lleva como tres vueltas.",
            "Mi abuela dice que son ánimas. Yo les digo los pasajeros fijos. No hacen nada malo, ¿ve?"
            ],
            visual: NPCVisual(buildRaw: "child", skinRaw: "medium", hairRaw: "short", headwearRaw: "none", propRaw: "none")
        ),
        MetroNPC(
            id: "plaza-sucre-don-temistocles",
            name: "Don Temístocles",
            role: "Lustrador de zapatos",
            stationName: "Plaza Sucre",
            lineID: "L1",
            palette: Color(hex: 0xC8843A),
            dialoguePool: [
            "Épale, vale. Un lustrado y llegas a donde vayas con el pie derecho. Literalmente, chamo.",
            "Este trapo es del año de Bolívar. Mi abuelo lo usó en La Victoria. Yo no sé si creerle, pero los zapatos quedan finos."
            ],
            visual: NPCVisual(buildRaw: "elder", skinRaw: "dark", hairRaw: "gray", headwearRaw: "cap", propRaw: "shoeBrush")
        ),
        MetroNPC(
            id: "gato-negro-consuelo",
            name: "Consuelo",
            role: "Mujer que lee el periódico viejo",
            stationName: "Gato Negro",
            lineID: "L1",
            palette: Color(hex: 0xE8A87C),
            dialoguePool: [
            "Mira esto… dice que van a construir el metro hasta Guarenas. Eso lo leí en el '83 y aquí sigo leyéndolo, chamo.",
            "Los periódicos viejos no mienten. Cambian, pero no mienten. Es diferente, ¿entiendes, pana?"
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "light", hairRaw: "long", headwearRaw: "none", propRaw: "newspaper")
        ),
        MetroNPC(
            id: "agua-salud-profesor-gilberto",
            name: "Profesor Gilberto",
            role: "Maestro jubilado",
            stationName: "Agua Salud",
            lineID: "L1",
            palette: Color(hex: 0xFFB86A),
            dialoguePool: [
            "Treinta y dos años enseñando matemáticas aquí en el oeste. Lo que más recuerdan los chamos no es la tabla del nueve, sino que yo les decía: esto también pasará.",
            "¿Oíste eso? Frotas el borrador y el metro se calla. Solo dura un momento, pero vale la pena, mijo.",
            "La educación y el metro tienen lo mismo: to' el mundo entra igual. Eso nunca me dejó de parecer hermoso."
            ],
            visual: NPCVisual(buildRaw: "elder", skinRaw: "brown", hairRaw: "gray", headwearRaw: "none", propRaw: "book")
        ),
        MetroNPC(
            id: "sonero-silencio",
            name: "Gastón 'El Gato' Montilla",
            role: "Músico callejero de salsa brava",
            stationName: "El Silencio",
            lineID: "L2",
            palette: Color(hex: 0xE8A020),
            dialoguePool: [
            "Épale, este sitio se llama El Silencio pero conmigo aquí no hay silencio que aguante, vale.",
            "¿Ves esa señora que baila sola en el andén? Lleva viniendo desde los ochenta. Dice que es el mismo cantante. Yo no pregunto más.",
            "La salsa no cura, pana, pero hace que el dolor se mueva. Y eso es bastante."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "dark", hairRaw: "curly", headwearRaw: "cap", propRaw: "guitar")
        ),
        MetroNPC(
            id: "hermana-capuchina-capuchinos",
            name: "Hermana Dolores de la Providencia",
            role: "Monja que vigila el andén como si fuera la nave de su convento",
            stationName: "Capuchinos",
            lineID: "L2",
            palette: Color(hex: 0xC8A882),
            dialoguePool: [
            "Dios te guarde, mijo. Esta estación tiene muchas almas de paso. Yo las cuento pa' que no se pierdan.",
            "¿Vas lejos? Lleva cuidado en La Hoyada que está feo el asunto hoy. Eso me lo dijeron esta mañana. No preguntes quién.",
            "El capuchino es un fraile que viaja liviano. Por algo esta estación lleva ese nombre, ¿no te parece?"
            ],
            visual: NPCVisual(buildRaw: "elder", skinRaw: "medium", hairRaw: "bun", headwearRaw: "veil", propRaw: "candle")
        ),
        MetroNPC(
            id: "partera-maternidad",
            name: "Eloísa Troconis",
            role: "Partera retirada de la Maternidad Concepción Palacios",
            stationName: "Maternidad",
            lineID: "L2",
            palette: Color(hex: 0xFFD0A0),
            dialoguePool: [
            "Tú naciste acá arriba, ¿verdad? Hueles a talco de la Maternidad. Uno nunca pierde ese olor, chamo.",
            "Yo traje al mundo a los hijos de esta ciudad cuarenta años. Ahora la ciudad se va pero los hijos quedan.",
            "Na' guará, parí un bebé en 1973 que hoy debe tener cincuenta y tantos. A veces pienso que me lo cruzo en el metro y no lo sé."
            ],
            visual: NPCVisual(buildRaw: "elder", skinRaw: "medium", hairRaw: "bun", headwearRaw: "none", propRaw: "none")
        ),
        MetroNPC(
            id: "artigas-gladys",
            name: "Gladys",
            role: "Señora con paloma en el hombro",
            stationName: "Artigas",
            lineID: "L2",
            palette: Color(hex: 0xF0C8A0),
            dialoguePool: [
            "No te asustes del pájaro, chama. Él sabe a dónde vas mejor que tú. Yo no te digo, pero él sí sabe.",
            "Épale. ¿Ese olor es a pan? Ay, mijo, eso me llena el alma. Igual que a mi Celestino que ya no está."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "brown", hairRaw: "curly", headwearRaw: "none", propRaw: "bird")
        ),
        MetroNPC(
            id: "la-paz-roberto",
            name: "Roberto",
            role: "Técnico de aire acondicionado fuera de servicio",
            stationName: "La Paz",
            lineID: "L2",
            palette: Color(hex: 0xD4A870),
            dialoguePool: [
            "Na' guará, el metro de aquí arriba vibra distinto. En el viaducto el tren le habla a las lomas. Yo lo escucho.",
            "Yo arreglo neveras con la mano nomás. La gente cree que es mecánica. Yo sé que es otra cosa. Pero bueno."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "medium", hairRaw: "short", headwearRaw: "cap", propRaw: "wrench")
        ),
        MetroNPC(
            id: "la-yaguara-yaguara-medium",
            name: "Belkis la Correa",
            role: "Médium de la corte de María Lionza",
            stationName: "La Yaguara",
            lineID: "L2",
            palette: Color(hex: 0xB87FD4),
            dialoguePool: [
            "La Yaguara… ¿sabes que yaguara es jaguar en caribe? Aquí el jaguar camina debajo del viaducto to'as las noches. Yo lo he visto.",
            "Cuando el tren arranca pa' Carapita, cierra los ojos. Las Tres Potencias pasan. No hablo yo en ese momento — habla Negro Felipe. Tranquilo, que no muerde.",
            "María Lionza no está en Sorte solamente, chamo. Está donde el río se mete bajo el cemento. Aquí mismo."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "dark", hairRaw: "long", headwearRaw: "scarf", propRaw: "candle")
        ),
        MetroNPC(
            id: "carapita-abuelo-nestorino",
            name: "Néstorino",
            role: "Viejo pescador sin mar",
            stationName: "Carapita",
            lineID: "L2",
            palette: Color(hex: 0x5BA88A),
            dialoguePool: [
            "Vine del Litoral en el '72 y el mar se quedó allá. Pero algo queda debajo de to' esta ciudad. Lo jalo con el cordel y aparece.",
            "Hoy saqué una foto de una quinceañera que no conozco. Arrugada, pero ella sale sonriendo. Eso me alegró el día, pana."
            ],
            visual: NPCVisual(buildRaw: "elder", skinRaw: "brown", hairRaw: "gray", headwearRaw: "sombrero", propRaw: "none")
        ),
        MetroNPC(
            id: "antimano-senora-petra",
            name: "Petra Villamizar",
            role: "Rezandera y vendedora de velas",
            stationName: "Antímano",
            lineID: "L2",
            palette: Color(hex: 0xF5A623),
            dialoguePool: [
            "Una velita pa' la Ánima Sola, mija. No te cuesta nada y ella te acompaña hasta Zoológico sin que te pase nada.",
            "Antímano tiene mucho santo y mucho ánima. Uno convive, ¿qué más va a hacer? Na' guará.",
            "¿Ese es pan lo que huelo? Ay, llévame una marraqueta pa' casa que tengo tres muchachos con hambre."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "brown", hairRaw: "bun", headwearRaw: "none", propRaw: "candle")
        ),
        MetroNPC(
            id: "mamera-chico-karate",
            name: "Franklyn \"Mamera\"",
            role: "Entrenador de karate informal",
            stationName: "Mamera",
            lineID: "L2",
            palette: Color(hex: 0xFF8C42),
            dialoguePool: [
            "Épale, chamo. ¿Ves ese eco? Es el cerro contestando. Mamera siempre contestó. Por eso le pusieron así al barrio.",
            "Yo sé que no es el sitio pa' karate. Pero, ¿tú sabes cuántos chamos se metieron en vainas porque no tenían dónde ir? Aquí tienen."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "dark", hairRaw: "short", headwearRaw: "none", propRaw: "none")
        ),
        MetroNPC(
            id: "caricuao-dona-xuxa",
            name: "Xuxa Marcano",
            role: "Ama de casa de los superbloques",
            stationName: "Caricuao",
            lineID: "L2",
            palette: Color(hex: 0xE87070),
            dialoguePool: [
            "Este pantalón no es pa' mi hijo ahora. Es pa' cuando crezca. Yo sé cuánto va a medir. ¿Cómo lo sé? Coño, ni idea, pero siempre le queda.",
            "Los superbloques se ven feos de lejos pero por dentro hay de to'. Bodas, velorios, cumpleaños de quince, to' en el mismo edificio. Eso es Caracas, mijo."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "medium", hairRaw: "long", headwearRaw: "none", propRaw: "basket")
        ),
        MetroNPC(
            id: "zoologico-yara",
            name: "Yara",
            role: "Cuidadora del zoológico",
            stationName: "Zoológico",
            lineID: "L2",
            palette: Color(hex: 0x6DBF67),
            dialoguePool: [
            "El loro dice que el próximo tren llega en cuatro minutos. Y lleva razón, chamo. Lleva razón desde el '92.",
            "Los monos lloraron anoche. Alguien en otro país perdió a alguien. Eso pasa. Uno lo siente acá y no sabe por qué.",
            "Yara me llamo. Mi abuela me dijo que ese nombre carga agua y montaña. Aquí entre los árboles y los animales, le creo."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "brown", hairRaw: "long", headwearRaw: "feathers", propRaw: "bird")
        ),
        MetroNPC(
            id: "ruiz-pineda-lucho",
            name: "Lucho el Flaco",
            role: "Mecánico de bicicletas sin bicicleta",
            stationName: "Ruiz Pineda",
            lineID: "L2",
            palette: Color(hex: 0xFFA558),
            dialoguePool: [
            "Yo reparo la bicicleta tuya aunque no la traigas. Tú no entiendes cómo, pero funciona. Yo tampoco entiendo bien, la verdad.",
            "Ruiz Pineda. El comandante. Por acá caminó gente brava. Uno lo siente en el piso, chamo."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "medium", hairRaw: "short", headwearRaw: "cap", propRaw: "wrench")
        ),
        MetroNPC(
            id: "las-adjuntas-senor-transbordo",
            name: "Señor Transbordo",
            role: "Hombre que lleva cuarenta años esperando el Metro Los Teques",
            stationName: "Las Adjuntas",
            lineID: "L2",
            palette: Color(hex: 0xC0A0D8),
            dialoguePool: [
            "El Metro Los Teques llega, chamo. Siempre llega. Solo que toma su tiempo. Venezuela es así — en construcción, pero llega.",
            "¿Oíste ese silbido? Es el tren avisando. Aquí en Las Adjuntas aprendemos a esperar con dignidad.",
            "Cuarenta años esperando y no me aburro. La gente que pasa me cuenta to'a la vida. Eso es mejor que cualquier destino, vale."
            ],
            visual: NPCVisual(buildRaw: "elder", skinRaw: "light", hairRaw: "gray", headwearRaw: "none", propRaw: "sack")
        ),
        MetroNPC(
            id: "don-candilejas-teatros",
            name: "Celestino Arriechi",
            role: "Ujier fantasma del Teatro Municipal",
            stationName: "Teatros",
            lineID: "L4",
            palette: Color(hex: 0xFFE066),
            dialoguePool: [
            "Bienvenido, señor. Su butaca es la doce, fila C. La función empieza en cinco minutos. Siempre empieza en cinco minutos.",
            "Perdone el desorden, vale. El incendio fue hace años pero yo todavía estoy buscando los programas de mano.",
            "¿Usted conoce La Traviata? Esta noche la cantan bien. Esta noche siempre la cantan bien."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "brown", hairRaw: "short", headwearRaw: "none", propRaw: "tickets")
        ),
        MetroNPC(
            id: "domador-nuevo-circo",
            name: "Ernesto 'Tigre' Bracho",
            role: "Ex domador del Nuevo Circo de Caracas",
            stationName: "Nuevo Circo",
            lineID: "L4",
            palette: Color(hex: 0xFF6B35),
            dialoguePool: [
            "No te asustes si sientes algo tibio al lado tuyo. Son los leones. Son viejitos ya, no muerden, pana.",
            "El circo fue lo más grande que tuvo Caracas. Ahí cabía to'a la ciudad y cabía contenta. Qué molleja.",
            "El último tigre murió en el setenta y ocho. Pero no se fue. Eso te lo digo yo que lo sé."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "medium", hairRaw: "short", headwearRaw: "sombrero", propRaw: "none")
        ),
        MetroNPC(
            id: "vigilante-parque-central",
            name: "Wilmer Ochoa",
            role: "Vigilante nocturno de las Torres de Parque Central",
            stationName: "Parque Central",
            lineID: "L4",
            palette: Color(hex: 0xFFB870),
            dialoguePool: [
            "¿Ves el piso treinta y cuatro? El incendio lo dejó negro. Pero de noche, a veces, prende la luz. Arrecho, ¿no?",
            "Estas torres iban a ser el futuro, chamo. Las más altas de América Latina. El futuro se quemó un poco pero sigue parado.",
            "Llevo la libreta pa' que alguien recuerde. Si no escribo yo, ¿quién escribe?"
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "brown", hairRaw: "short", headwearRaw: "none", propRaw: "book")
        ),
        MetroNPC(
            id: "professora-remedios-ucv",
            name: "Profesora Remedios Altamirano",
            role: "Profesora jubilada de arquitectura, UCV",
            stationName: "Ciudad Universitaria",
            lineID: "L3",
            palette: Color(hex: 0xFFB84D),
            dialoguePool: [
            "Ese Calder allá arriba — ¿ves cómo se mueve sin viento? Todavía está buscando estudiantes pa' su clase de las tres.",
            "Villanueva diseñó to' esto pa' que la luz cambiara to' el día. Lo que no sabía es que la luz también lo iba a extrañar a él.",
            "Mis alumnos se fueron, mijo. Pero los colores del corredor se acuerdan de sus nombres. Yo los oigo a veces."
            ],
            visual: NPCVisual(buildRaw: "elder", skinRaw: "medium", hairRaw: "gray", headwearRaw: "none", propRaw: "book")
        ),
        MetroNPC(
            id: "chico-patineta-simbolos",
            name: "Kendry 'El Símbolo'",
            role: "Patinero, 17 años, mensajero informal",
            stationName: "Los Símbolos",
            lineID: "L3",
            palette: Color(hex: 0xFF7043),
            dialoguePool: [
            "Bro, llevo dos años tratando de llegar a Chacaíto en patineta. Siempre termino aquí. Ya ni peleo con eso.",
            "Mi abuela dice que la estación se llama así por los espíritus que cuidan cada esquina del valle. Yo digo que es marketing del metro. Pero... na' guará, quién sabe."
            ],
            visual: NPCVisual(buildRaw: "child", skinRaw: "brown", hairRaw: "short", headwearRaw: "cap", propRaw: "none")
        ),
        MetroNPC(
            id: "vieja-vendedora-bandera",
            name: "Doña Esperanza Briceño",
            role: "Vendedora de empanadas y lotería, La Bandera",
            stationName: "La Bandera",
            lineID: "L3",
            palette: Color(hex: 0xFFCC80),
            dialoguePool: [
            "¿Empanada de queso o de pabellón, mi amor? No, no me digas — yo ya sé. Tú hoy necesitas la de pabellón. Pa' el alma.",
            "Este número, mijo: cuatro-siete-uno. No te voy a decir pa' qué. Tú ya lo sabes en el fondo.",
            "Aquí to' el mundo pasa con prisa. Nadie llega a ningún lao' más rápido por eso, pero bueno — cada quien con su ladilla."
            ],
            visual: NPCVisual(buildRaw: "heavy", skinRaw: "dark", hairRaw: "bun", headwearRaw: "panuelo", propRaw: "basket")
        ),
        MetroNPC(
            id: "musico-el-valle",
            name: "Tío Ramoncito",
            role: "Músico de joropo, cuatro en mano",
            stationName: "El Valle",
            lineID: "L3",
            palette: Color(hex: 0xFFA726),
            dialoguePool: [
            "Este cuatro no afina desde el noventa y ocho. Le digo a la gente que es el instrumento. Pero entre tú y yo, soy yo el que afina raro.",
            "¿Ese olor es focaccia, vale? Na' guará. En este metro yo he olido hallacas, pernil, hasta un sancocho completo una vez. To' el sur de Caracas viaja con hambre."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "brown", hairRaw: "short", headwearRaw: "none", propRaw: "cuatro")
        ),
        MetroNPC(
            id: "abuela-jardines",
            name: "Abuela Teresita Pugliese-Montoya",
            role: "Abuela del barrio, Los Jardines del Valle",
            stationName: "Los Jardines",
            lineID: "L3",
            palette: Color(hex: 0xFFD54F),
            dialoguePool: [
            "Chamo, ya sabía que venías. Ese pan tuyo huele hasta El Valle, te lo juro. Siéntate, tengo café.",
            "Tu abuelo italiano también olía así — a harina y a mantequilla y a algo que no tiene nombre. Bienvenido a casa, mijo.",
            "Los Jardines son los Jardines. Uno se va, pero esto te jala de vuelta. Como el cuatro de Ramoncito, pero con más olor a comida."
            ],
            visual: NPCVisual(buildRaw: "elder", skinRaw: "light", hairRaw: "gray", headwearRaw: "none", propRaw: "candle")
        ),
        MetroNPC(
            id: "fantasma-obrero-coche",
            name: "El Obrero Heliodoro",
            role: "Fantasma de obrero de la construcción del metro",
            stationName: "Coche",
            lineID: "L3",
            palette: Color(hex: 0xC8B08A),
            dialoguePool: [
            "Épale. ¿Ya llegó la Línea 5? ... No, vale, ya sé. Pregunto to' los días igual.",
            "Empezamos a construirla cuando Caracas era otra cosa. Aquí sigo yo, y aquí sigue ella — en construcción los dos.",
            "Qué molleja de espera, chamo. Pero bueno. Pa' un muerto, el tiempo es pa' otro lado."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "dark", hairRaw: "short", headwearRaw: "hardhat", propRaw: "wrench")
        ),
        MetroNPC(
            id: "yara-mercado",
            name: "Yara Sequera",
            role: "Vendedora de hierbas y santería, el Mercado",
            stationName: "Mercado",
            lineID: "L3",
            palette: Color(hex: 0xA5D6A7),
            dialoguePool: [
            "No, no — agarra esa ruda, no la albahaca. La ruda es pa' lo que traes encima, aunque tú no sepas todavía qué es.",
            "María Lionza manda saludos, mija. Las guacamayas pasaron esta mañana por encima del mercado — eso me basta.",
            "¿Ese es olor a pan? Mijo, aquí huele a ajo, a pollo vivo y a copal. Tú sí que chocas bien en este mercado, chamo."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "brown", hairRaw: "curly", headwearRaw: "panuelo", propRaw: "basket")
        ),
        MetroNPC(
            id: "apostador-rinconada",
            name: "Lisandro Pimentel",
            role: "Apostador fantasma del Hipódromo La Rinconada",
            stationName: "La Rinconada",
            lineID: "L3",
            palette: Color(hex: 0xCE93D8),
            dialoguePool: [
            "Oye, anota esto: en la quinta carrera, el número siete. No me preguntes de dónde lo sé. Llevo muerto cincuenta años y to'avía no me han fallado los caballos.",
            "La Rinconada es lo más hermoso que tiene Caracas y nadie habla de eso. Mármol, curvas, luz. Una lástima que yo me la pasara mirando pa' la pista y no pa' arriba.",
            "Tú no apuestas, ¿verdad, chamo? Se te nota. Está bien. Los que no apuestan son los únicos que salen de aquí con algo."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "medium", hairRaw: "bald", headwearRaw: "sombrero", propRaw: "newspaper")
        ),
        MetroNPC(
            id: "poeta-sabana-grande",
            name: "Ernesto Oquendo",
            role: "Poeta de café y residente eterno del bulevar",
            stationName: "Sabana Grande",
            lineID: "L1",
            palette: Color(hex: 0xD4A574),
            dialoguePool: [
            "¿Ves ese banco allá? Ahí me senté con Caupolicán Ovalles a hablar hasta el amanecer. Eso fue... bueno, no sé cuándo fue. Hace mucho.",
            "El bulevar huele a pan, chamo. Hasta los muertos se les hace agua la boca.",
            "Caracas no se escribe, se respira. 'La ciudad que te parte siempre te vuelve a pegar.' Escribe eso en algún lado."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "light", hairRaw: "long", headwearRaw: "beret", propRaw: "newspaper")
        ),
        MetroNPC(
            id: "reinaldo-el-guardavias",
            name: "Reinaldo",
            role: "Guardavías jubilado (a medias)",
            stationName: "Zona Rental",
            lineID: "L5",
            palette: Color(hex: 0xFFB84D),
            dialoguePool: [
            "Llevan dieciocho años diciéndome que el tren llega en seis meses. Pa' mí que 'seis meses' es un número mágico, como los de la lotería que nunca pegan.",
            "Mi reloj paró el día que inauguraron esto. Lo llevo así de recuerdo — ¿pa' qué arreglarlo si la línea tampoco avanzó?",
            "¿Ese olor es harina? Na' guará… hace tiempo no huelo algo que sí llegó a donde tenía que llegar."
            ],
            visual: NPCVisual(buildRaw: "elder", skinRaw: "brown", hairRaw: "gray", headwearRaw: "cap", propRaw: "none")
        ),
        MetroNPC(
            id: "yaritza-pasajera-fantasma",
            name: "Yaritza",
            role: "Pasajera que espera el tren a Chuao",
            stationName: "Bello Monte",
            lineID: "L5",
            palette: Color(hex: 0xE8956D),
            dialoguePool: [
            "Chamo, ¿tú sabes a qué hora pasa el de Chuao? Tengo una entrevista a las nueve y no quiero llegar tarde con este calor.",
            "To' el mundo me mira raro aquí. Yo sé que la estación no 'stá lista, pero el tren igual va a pasar — las cosas llegan aunque uno no las vea venir.",
            "Qué molleja, huele a pan recién hecho. Si hubieran terminao la línea, habría una panadería en cada estación. Así era el plan, vale."
            ],
            visual: NPCVisual(buildRaw: "adult", skinRaw: "brown", hairRaw: "bun", headwearRaw: "none", propRaw: "tickets")
        )
    ]

    static var allStations: [MetroStation] {
        lines.flatMap(\.stations)
    }

    static func line(for id: String) -> MetroLine {
        lines.first { $0.id == id } ?? lines[0]
    }

    static func npc(at station: MetroStation) -> MetroNPC? {
        npcs.first { $0.stationName == station.name && $0.lineID == station.lineID }
    }

    static func transferLines(from station: MetroStation) -> [MetroLine] {
        station.transferLineIDs.compactMap { transferID in
            lines.first { $0.id == transferID }
        }
    }

    private static func makeLine(
        id: String,
        number: String,
        name: String,
        displayName: String,
        accent: Color,
        darkAccent: Color,
        stationNames: [String],
        transfers: [String: [String]],
        plannedStations: [String],
        routeNote: String
    ) -> MetroLine {
        let stations: [MetroStation] = stationNames.enumerated().map { offset, stationName in
            let transferLineIDs: [String] = transfers[stationName] ?? []
            return MetroStation(
                id: "\(id)-\(stationName)",
                name: stationName,
                lineID: id,
                index: offset,
                isTransfer: !transferLineIDs.isEmpty,
                transferLineIDs: transferLineIDs,
                isOperational: true
            )
        }

        return MetroLine(
            id: id,
            number: number,
            name: name,
            displayName: displayName,
            accent: accent,
            darkAccent: darkAccent,
            stations: stations,
            plannedStations: plannedStations,
            routeNote: routeNote
        )
    }
}
