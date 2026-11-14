// Contenido mágico: sorpresas del calendario, respuestas de respaldo y mensajes de Santa.
import { KIDS, birthdayThisYear, daysLeft, starsOf, diaryRecent, S } from './store.js';

// type: fact | mission | joke | activity | magic.  anim: efecto en el cielo o el taller
export const POOL = [
  { type: 'fact', anim: 'reindeer', es: 'Los renos de Santa comen zanahorias mágicas y galletas de avena antes de volar. ¡Rudolph prefiere las de chispas de chocolate!', en: "Santa's reindeer eat magic carrots and oatmeal cookies before they fly. Rudolph likes chocolate chip ones best!" },
  { type: 'mission', anim: 'hearts', es: 'Misión de hoy: dale un abrazo bien fuerte a alguien de tu familia y dile por qué lo quieres.', en: 'Mission for today: give someone in your family a big hug and tell them why you love them.' },
  { type: 'joke', anim: 'dance', es: '¿Qué le dijo un copo de nieve a otro copo de nieve? ¡Eres único en el mundo!', en: "What did one snowflake say to the other? You're one of a kind!" },
  { type: 'magic', anim: 'sparkle', es: 'Hoy en el taller pintamos mil trompos de colores… ¡y uno salió con lunares morados!', en: 'Today in the workshop we painted a thousand spinning tops… and one came out with purple polka dots!' },
  { type: 'mission', anim: 'stars', es: 'Misión de hoy: recoge tus juguetes sin que nadie te lo pida. ¡Los elfos nos vamos a enterar!', en: "Mission for today: tidy up your toys without anyone asking. The elves will find out!" },
  { type: 'fact', anim: 'snow', es: 'En el Polo Norte hace tanto frío que los muñecos de nieve usan dos bufandas. ¡Una arriba de la otra!', en: 'It is so cold at the North Pole that snowmen wear two scarves. One on top of the other!' },
  { type: 'activity', anim: 'dance', es: '¡Hora del baile elfo! Párate, da tres saltos, gira una vez y grita ¡JO JO JO!', en: 'Elf dance time! Stand up, jump three times, spin around once and shout HO HO HO!' },
  { type: 'joke', anim: 'reindeer', es: '¿Qué hace un reno con una escoba? ¡Renovar!', en: 'What do you call a reindeer with no eyes? No eye-deer!' },
  { type: 'mission', anim: 'hearts', es: 'Misión de hoy: dile algo bonito a tu hermana. ¡Las palabras bonitas son magia de verdad!', en: 'Mission for today: say something kind to your sister. Kind words are real magic!' },
  { type: 'fact', anim: 'stars', es: 'La lista de Santa es tan larga que si la estiras… ¡llega desde el Polo Norte hasta la luna!', en: "Santa's list is so long that if you stretched it out… it would reach from the North Pole to the moon!" },
  { type: 'activity', anim: 'sparkle', es: 'Reto de hoy: dibuja a tu elfo favorito y déjale el dibujo cerquita esta noche.', en: 'Challenge for today: draw your favorite elf and leave the drawing close to them tonight.' },
  { type: 'magic', anim: 'snow', es: '¡Atención! Hoy nevó tanto en el Polo Norte que fuimos al taller en un trineo hecho de galletas.', en: 'Attention! It snowed so much at the North Pole today that we rode to the workshop on a sled made of cookies.' },
  { type: 'mission', anim: 'stars', es: 'Misión de hoy: ayuda a poner la mesa y cuenta los platos en voz alta.', en: 'Mission for today: help set the table and count the plates out loud.' },
  { type: 'joke', anim: 'dance', es: '¿Por qué el libro de matemáticas estaba triste en Navidad? ¡Porque tenía muchos problemas!', en: 'Why was the math book sad at Christmas? It had too many problems!' },
  { type: 'fact', anim: 'sparkle', es: 'Los elfos medimos la magia navideña con el Medidor de Bondad. Cada cosa buena que haces… ¡hace DING!', en: 'Elves measure Christmas magic with the Kindness Meter. Every good thing you do… goes DING!' },
  { type: 'activity', anim: 'stars', es: 'Juego de hoy: busca cinco cosas rojas en tu casa, rojas como el traje de Santa.', en: "Game for today: find five red things in your house, red like Santa's suit." },
  { type: 'magic', anim: 'reindeer', es: 'Hoy Rudolph practicó vuelo nocturno. Si miras el cielo esta noche… ¡a lo mejor ves una lucecita roja!', en: 'Rudolph practiced night flying today. If you look at the sky tonight… you might see a little red light!' },
  { type: 'mission', anim: 'hearts', es: 'Misión de hoy: comparte un juguete o una merienda con alguien. ¡Compartir vale doble estrella!', en: 'Mission for today: share a toy or a snack with someone. Sharing is worth double stars!' },
  { type: 'joke', anim: 'snow', es: '¿Qué le dijo la vaca a Santa? ¡Muuuuy Feliz Navidad!', en: 'What did the cow say to Santa? Moooo-rry Christmas!' },
  { type: 'fact', anim: 'sparkle', es: 'Los elfos tenemos orejas puntiagudas para escuchar los cascabeles del trineo desde muy, muy lejos.', en: 'Elves have pointy ears so we can hear the sleigh bells from far, far away.' },
  { type: 'activity', anim: 'song', es: 'Reto de hoy: canten un villancico en familia. ¡Los elfos los acompañamos con cascabeles!', en: 'Challenge for today: sing a Christmas carol as a family. The elves will join in with jingle bells!' },
  { type: 'magic', anim: 'sparkle', es: 'Noticia: la Señora Claus horneó tres mil galletas de jengibre. Los elfos nos comimos solo doce… bueno, quince.', en: 'News: Mrs. Claus baked three thousand gingerbread cookies. The elves only ate twelve… okay, fifteen.' },
  { type: 'mission', anim: 'hearts', es: 'Misión de hoy: dile gracias a tres personas distintas. ¡Después nos cuentas!', en: 'Mission for today: say thank you to three different people. Then tell us all about it!' },
  { type: 'fact', anim: 'sleigh', es: 'Santa revisa su trineo todos los días: frenos de nieve, cascabeles brillantes y asientos calentitos.', en: 'Santa checks his sleigh every day: snow brakes, shiny bells and cozy warm seats.' },
  { type: 'joke', anim: 'dance', es: '¿Cuál es el animal más antiguo? ¡La cebra, porque está en blanco y negro!', en: 'What do snowmen eat for breakfast? Frosted flakes!' },
  { type: 'activity', anim: 'snow', es: 'Reto de hoy: haz un copo de nieve de papel y pégalo en la ventana. ¡Así los renos encuentran su casa!', en: 'Challenge for today: make a paper snowflake and stick it on the window. That way the reindeer can find your house!' },
  { type: 'magic', anim: 'stars', es: 'Hoy vino un pingüino de visita al Polo Norte… ¡estaba perdido! Le dimos chocolate caliente y un mapa.', en: 'A penguin visited the North Pole today… he was lost! We gave him hot cocoa and a map.' },
  { type: 'mission', anim: 'hearts', es: 'Misión de hoy: cuida a Thor. Llénale el agua o dale un cariño extra. ¡Los perritos también son parte de la Navidad!', en: 'Mission for today: take care of Thor. Fill his water bowl or give him extra cuddles. Dogs are part of Christmas too!' },
  { type: 'fact', anim: 'aurora', es: 'Las luces que bailan en el cielo del Polo Norte se llaman auroras. ¡Son verdes, moradas y rosadas!', en: 'The lights that dance in the North Pole sky are called auroras. They are green, purple and pink!' },
  { type: 'activity', anim: 'stars', es: 'Juego de hoy: cierra los ojos, pide un deseo bonito para otra persona y sopla como si fuera una vela.', en: 'Game for today: close your eyes, make a kind wish for someone else and blow like it is a candle.' },
  { type: 'joke', anim: 'reindeer', es: '¿Qué le dijo el árbol de Navidad a la estrella? ¡Tú siempre me haces brillar!', en: 'What did the Christmas tree say to the star? You always make me shine!' },
  { type: 'magic', anim: 'sparkle', es: 'Estamos envolviendo regalos con papel que brilla en la oscuridad. ¡Shhh, es un secreto!', en: "We're wrapping presents with paper that glows in the dark. Shhh, it's a secret!" },
  { type: 'mission', anim: 'stars', es: 'Misión de hoy: vístete solita y deja tu cuarto ordenadito. ¡Medidor de Bondad al máximo!', en: 'Mission for today: get dressed by yourself and leave your room nice and tidy. Kindness Meter to the max!' },
  { type: 'fact', anim: 'sleigh', es: 'Santa visita todas las casas del mundo en una sola noche gracias a la magia del tiempo congelado.', en: 'Santa visits every house in the world in one night thanks to frozen-time magic.' },
  { type: 'activity', anim: 'sparkle', es: 'Reto de hoy: escribe o dibuja una carta para Santa y déjala junto a tus elfos esta noche.', en: 'Challenge for today: write or draw a letter for Santa and leave it next to your elves tonight.' },
  { type: 'magic', anim: 'reindeer', es: 'Hoy los renos hicieron carreras en la nieve. ¡Ganó Bailarín por un pelito de nariz!', en: 'The reindeer had a snow race today. Dancer won by a nose!' },
  { type: 'mission', anim: 'hearts', es: 'Misión de hoy: ayuda en la cocina a lavar las frutas o a mezclar algo rico.', en: 'Mission for today: help in the kitchen washing fruit or stirring something yummy.' },
  { type: 'joke', anim: 'dance', es: '¿Qué hace un muñeco de nieve en verano? ¡Se derrite… de la risa!', en: 'What do you call an elf who sings? A wrapper!' },
  { type: 'fact', anim: 'stars', es: 'El trineo de Santa no usa gasolina: funciona con risas de niños y polvo de estrellas.', en: "Santa's sleigh doesn't use gas: it runs on children's laughter and stardust." },
  { type: 'activity', anim: 'dance', es: 'Reto de hoy: hagan un show de talentos en casa. ¡Los elfos aplaudimos desde el Polo Norte!', en: 'Challenge for today: put on a talent show at home. The elves are clapping from the North Pole!' },
];

// Mezcla fija para que cada día tenga su sorpresa y no se repita
function shuffled() {
  const a = POOL.map((x, i) => i);
  let seed = 7;
  for (let i = a.length - 1; i > 0; i--) { seed = (seed * 9301 + 49297) % 233280; const j = Math.floor((seed / 233280) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const ORDER = shuffled();

export function dayContent(date, index, lang) {
  const md = date.slice(5);
  const y = +date.slice(0, 4);
  const s = birthdayThisYear('sophie', y), a = birthdayThisYear('alana', y);
  if (date === s.date) return { type: 'special', anim: 'birthday', song: 'birthday', kid: 'sophie', text: lang === 'es' ? `¡FELIZ CUMPLEAÑOS, SOPHIE! Hoy cumples ${s.turns} años y en el Polo Norte hay fiesta: los renos tienen gorritos, la Señora Claus hizo una torta de ${s.turns} pisos y todos los elfos te cantamos. ¡Te queremos muchísimo!` : `HAPPY BIRTHDAY, SOPHIE! You are ${s.turns} today and there's a party at the North Pole: the reindeer are wearing party hats, Mrs. Claus baked a ${s.turns}-layer cake and all the elves are singing for you. We love you so much!` };
  if (date === a.date) return { type: 'special', anim: 'birthday', song: 'birthday', kid: 'alana', text: lang === 'es' ? `¡FELIZ CUMPLEAÑOS, ALANA! Hoy cumples ${a.turns} añitos y el Polo Norte está de fiesta: hay globos en el taller, los renos bailan y la Señora Claus hizo una torta de ${a.turns} pisos. ¡Te queremos muchísimo!` : `HAPPY BIRTHDAY, ALANA! You are ${a.turns} today and the North Pole is celebrating: balloons in the workshop, dancing reindeer and a ${a.turns}-layer cake from Mrs. Claus. We love you so much!` };
  if (md === '12-24') return { type: 'special', anim: 'sleigh', song: 'jingle', text: lang === 'es' ? '¡HOY ES NOCHEBUENA! Santa ya cargó el trineo y los renos están listos. Esta noche hay que dormirse temprano, porque Santa solo llega cuando todos duermen. ¡Dejen galletas y una zanahoria para Rudolph!' : "IT'S CHRISTMAS EVE! Santa has loaded the sleigh and the reindeer are ready. Tonight you have to go to sleep early, because Santa only comes when everyone is asleep. Leave some cookies and a carrot for Rudolph!" };
  if (md === '12-25') return { type: 'special', anim: 'fireworks', song: 'wish', text: lang === 'es' ? '¡FELIZ NAVIDAD! Santa ya pasó por su casa. Gracias por ser tan buenas, tan cariñosas y tan valientes este año. Los elfos las queremos muchísimo. ¡JO JO JO!' : 'MERRY CHRISTMAS! Santa has already visited your house. Thank you for being so good, so kind and so brave this year. The elves love you very much. HO HO HO!' };
  if (index === 0) return { type: 'special', anim: 'sparkle', song: 'jingle', text: lang === 'es' ? '¡Bienvenidas a la Línea Directa al Polo Norte! Desde hoy, cada día les dejamos una sorpresa nueva aquí hasta Navidad. ¡Vuelvan mañana!' : 'Welcome to the North Pole Hotline! From today, we will leave you a new surprise here every day until Christmas. Come back tomorrow!' };
  const item = POOL[ORDER[(index - 1) % ORDER.length]];
  return { type: item.type, anim: item.anim, song: item.anim === 'song' ? 'jingle' : null, text: item[lang] };
}

/* ------------- Lo que dicen los elfos al tocarlos ------------- */
export const TAP_LINES = {
  es: ['¡Jiji! ¡Me haces cosquillas!', '¡Hola, hola!', '¡Estoy pintando un trompo!', '¿Ya tomaste agüita hoy?', '¡Faltan {days} días! ¡Qué emoción!', '¡Jo jo jo! Así se ríe Santa.', '¡Uy, se me cayó un cascabel!', '¡Te quiero mucho, {kid}!', '¿Me das un abrazo?', '¡Shhh! Estoy envolviendo un secreto.'],
  en: ['Hehe! That tickles!', 'Hello, hello!', "I'm painting a spinning top!", 'Did you drink some water today?', '{days} days to go! So exciting!', "Ho ho ho! That's how Santa laughs.", 'Oops, I dropped a jingle bell!', 'I love you, {kid}!', 'Can I have a hug?', "Shhh! I'm wrapping a secret."],
};

/* ------------- Cerebro de respaldo (sin internet o sin key) ------------- */
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function offlineReply(text, { lang, kid, elf, elfName }) {
  const msg = text.toLowerCase();
  const name = kid === 'both' ? (lang === 'es' ? 'Sophie y Alana' : 'Sophie and Alana') : KIDS[kid].name;
  const days = daysLeft();
  const lastStar = S().stars.slice(-1)[0];
  const es = lang === 'es';
  const R = (es_, en_) => pick(es ? es_ : en_);
  let wish = null;
  const wm = msg.match(es ? /(?:quiero|me gustar[ií]a|pido|deseo)\s+(?:que me traiga[ns]?\s+)?(?:un[ao]?s?\s+)?(.{2,40})/ : /(?:i want|i wish for|i would like|can i have)\s+(?:a |an |some )?(.{2,40})/);
  if (wm) wish = wm[1].replace(/[.!?¿¡]+$/, '').trim();

  let reply;
  if (wish) reply = R([`¡Uy, qué lindo deseo! Ya anoté "${wish}" en mi libreta mágica y se lo voy a contar a Santa esta noche.`, `¡Anotado en la lista especial! Le voy a contar a Santa que ${name} sueña con ${wish}. Él decide con su magia.`], [`Ooh, what a lovely wish! I wrote "${wish}" in my magic notebook and I'll tell Santa tonight.`, `Written on the special list! I'll tell Santa that ${name} dreams of ${wish}. He decides with his magic.`]);
  else if (/(chiste|joke|risa|funny)/.test(msg)) reply = R(['¿Qué le dijo un copo de nieve a otro? ¡Eres único en el mundo! Jijiji.', '¿Qué le dijo la vaca a Santa? ¡Muuuuy Feliz Navidad!', '¿Qué hace un reno con una escoba? ¡Renovar! Jajaja.'], ["What did one snowflake say to the other? You're one of a kind! Hehe.", 'What do you call a reindeer with no eyes? No eye-deer!', 'What do snowmen eat for breakfast? Frosted flakes!']);
  else if (/(porté bien|porte bien|fui buena|me porto bien|good today|i was good|behaved)/.test(msg)) reply = lastStar && (lastStar.kid === kid || lastStar.kid === 'both')
    ? R([`¡Ya lo sabía! Me contaron que ${lastStar.reason}. ¡El Medidor de Bondad hizo DING!`], [`I knew it! I heard that ${lastStar.reason}. The Kindness Meter went DING!`])
    : R([`¡Qué maravilla, ${name}! Voy a contárselo a Santa ahorita mismo. ¡Sigue así!`, `¡Bravo! Escuché un DING en el Medidor de Bondad. ¡Eso eras tú!`], [`How wonderful, ${name}! I'm telling Santa right now. Keep it up!`, `Bravo! I heard a DING on the Kindness Meter. That was you!`]);
  else if (/(rudolph|reno|reindeer)/.test(msg)) reply = R(['¡Rudolph está feliz! Hoy practicó vuelo y su nariz brilló tanto que iluminó todo el taller.', 'Los renos están comiendo zanahorias mágicas para tener fuerza en Nochebuena.'], ['Rudolph is so happy! He practiced flying today and his nose glowed so bright it lit up the whole workshop.', 'The reindeer are eating magic carrots to be strong for Christmas Eve.']);
  else if (/(santa|papá noel|papa noel|claus)/.test(msg)) reply = R([`¡Santa está súper ocupado revisando la lista y tomando chocolate! Faltan ${days} días y dice que te manda un abrazo gigante.`, 'Santa está probando los cascabeles del trineo. ¡Dice que suenan perfecto!'], [`Santa is super busy checking the list and drinking cocoa! ${days} days to go and he sends you a giant hug.`, 'Santa is testing the sleigh bells. He says they sound perfect!']);
  else if (/(qué hacen|que hacen|haciendo|doing)/.test(msg)) reply = R(['¡Estamos pintando trompos, cosiendo muñecas y envolviendo regalos con lazos brillantes!', '¡Estoy ayudando a la Señora Claus a decorar galletas! Ya me comí dos… shhh.'], ["We're painting tops, sewing dolls and wrapping presents with shiny ribbons!", "I'm helping Mrs. Claus decorate cookies! I already ate two… shhh."]);
  else if (/(thor|perro|perrito|dog|puppy)/.test(msg)) reply = R(['¡Thor! Los elfos sabemos que Thor es un perrito muy especial. ¡Dale un cariño de parte del Polo Norte!'], ['Thor! The elves know Thor is a very special dog. Give him a cuddle from the North Pole!']);
  else if (/(triste|miedo|llor|sad|scared|cry|duele|hurt)/.test(msg)) reply = R(['Ay, te mando un abrazo de elfo bien calentito. Cuéntale también a mamá o a papá, ellos te quieren muchísimo y te pueden ayudar.'], ['Oh, I am sending you a warm elf hug. Tell mom or dad too, they love you so much and can help you.']);
  else if (/(dios|jes[uú]s|rezar|orar|oraci|god|jesus|pray|church|iglesia|angel|ángel)/.test(msg)) reply = R(['En el Polo Norte decimos que la Navidad es el cumpleaños del niño Jesús. ¡Dios las quiere muchísimo! ¿Por qué cosa le quieres dar gracias hoy?', 'Santa siempre dice que el regalo más grande es el amor de Dios y de la familia. ¡Y ustedes tienen mucho de los dos!'], ['At the North Pole we say Christmas is baby Jesus\' birthday. God loves you so much! What would you like to thank Him for today?', 'Santa always says the biggest gift is the love of God and family. And you have lots of both!']);
  else if (/(colegio|escuela|clase|profe|maestr|school|class|teacher)/.test(msg)) reply = R(['¡Los elfos sabemos que en el colegio aprendes muchísimo! ¿Qué fue lo más divertido de hoy en clase?', '¡Seguro tus profesoras están orgullosas de ti! ¿Cuál es tu materia favorita?'], ['The elves know you learn so much at school! What was the most fun thing in class today?', 'I bet your teachers are so proud of you! What is your favorite subject?']);
  else if (/(viaj|avi[oó]n|pa[ií]s|travel|plane|trip|country)/.test(msg)) reply = R(['¡Ustedes han viajado por tantos países! Son de las niñas más valientes que conocemos. ¿Cuál ha sido tu viaje favorito?', 'Santa tiene un mapa con estrellitas en todos los lugares que han visitado. ¡Ya casi no le caben!'], ["You've traveled to so many countries! You are some of the bravest girls we know. What was your favorite trip?", 'Santa has a map with little stars on every place you have visited. It is almost full!']);
  else if (/(nombre|name|llamas)/.test(msg)) reply = R([`¡Me llamo ${elfName}! Ustedes me pusieron ese nombre y me encanta.`], [`My name is ${elfName}! You gave me that name and I love it.`]);
  else if (/(cumple|birthday)/.test(msg)) reply = R(['¡Los cumpleaños de diciembre son los más mágicos! En el Polo Norte ya estamos preparando la fiesta.'], ['December birthdays are the most magical! We are already getting the party ready at the North Pole.']);
  else if (/(hola|hello|hi |hey|buenas)/.test(msg + ' ')) reply = R([`¡Hola, ${name}! ¡Qué alegría que llamaste al Polo Norte! ¿Qué hiciste hoy?`, `¡Holaaa, ${name}! Aquí ${elfName}, reportándose desde el taller.`], [`Hi, ${name}! I'm so happy you called the North Pole! What did you do today?`, `Hellooo, ${name}! ${elfName} here, reporting from the workshop.`]);
  else reply = R([`¡Qué interesante, ${name}! Se lo voy a contar a los otros elfos. ¿Y qué más hiciste hoy?`, `¡Wow! En el Polo Norte nos encanta escucharte. Faltan ${days} días para Navidad, ¡qué emoción!`, '¡Jiji! Eso me hizo sonar los cascabeles del gorro. Cuéntame más.'], [`How interesting, ${name}! I'll tell the other elves. What else did you do today?`, `Wow! We love hearing from you at the North Pole. ${days} days until Christmas, so exciting!`, 'Hehe! That made the bells on my hat jingle. Tell me more!']);
  return { text: reply, wish };
}

export function offlineGreeting({ lang, kid, elfName }) {
  const es = lang === 'es';
  const name = kid === 'both' ? (es ? 'Sophie y Alana' : 'Sophie and Alana') : KIDS[kid].name;
  const recent = diaryRecent(2).filter((d) => d.kid === kid || d.kid === 'both' || kid === 'both').slice(-1)[0];
  const star = S().stars.filter((s) => (s.kid === kid || s.kid === 'both' || kid === 'both')).slice(-1)[0];
  if (recent) return es ? `¡Hola, ${name}! Soy ${elfName}. Un pajarito del Polo Norte me contó que ${recent.text}. ¡Cuéntame más!` : `Hi, ${name}! It's ${elfName}. A little North Pole bird told me that ${recent.text}. Tell me more!`;
  if (star) return es ? `¡Hola, ${name}! Soy ${elfName}. ¡Vi en la Lista de los Buenos que ${star.reason}! ¡Qué orgullo!` : `Hi, ${name}! It's ${elfName}. I saw on the Nice List that ${star.reason}! So proud!`;
  return es ? `¡Hola, ${name}! Aquí ${elfName} desde el taller de Santa. ¿Cómo te fue hoy?` : `Hi, ${name}! ${elfName} here from Santa's workshop. How was your day?`;
}

export function offlineSanta({ lang, kid }) {
  const es = lang === 'es';
  const name = kid === 'both' ? (es ? 'Sophie y Alana' : 'Sophie and Alana') : KIDS[kid].name;
  const days = daysLeft();
  const stars = kid === 'both' ? S().stars : starsOf(kid);
  const good = stars.slice(-2).map((s) => s.reason);
  const diary = diaryRecent(5).slice(-1)[0];
  const parts = [];
  parts.push(es ? `¡Jo, jo, jo! Querida${kid === 'both' ? 's' : ''} ${name}:` : `Ho, ho, ho! Dear ${name}:`);
  parts.push(es ? `Aquí en el Polo Norte está nevando suavecito y los elfos me cuentan cosas maravillosas de ustedes.` : 'Here at the North Pole the snow is falling softly and the elves tell me wonderful things about you.');
  if (good.length) parts.push(es ? `Me enteré de que ${good.join(' y también que ')}. ¡Eso me hizo sonreír muchísimo!` : `I heard that ${good.join(', and also that ')}. That made me smile so much!`);
  else if (diary) parts.push(es ? `Me contaron que ${diary.text}.` : `I heard that ${diary.text}.`);
  parts.push(days > 0
    ? (es ? `Faltan ${days} días para Navidad. Los renos están entrenando y la Señora Claus ya está horneando galletas.` : `${days} days until Christmas. The reindeer are training and Mrs. Claus is already baking cookies.`)
    : (es ? '¡Hoy es Navidad! Gracias por un año tan lleno de bondad.' : "It's Christmas! Thank you for a year so full of kindness."));
  parts.push(es ? 'Sigan siendo cariñosas, valientes y buenas hermanas. ¡Los quiero muchísimo!' : 'Keep being kind, brave and wonderful sisters. I love you very much!');
  parts.push(es ? 'Con cariño, Santa' : 'Love, Santa');
  return parts.join('\n\n');
}
