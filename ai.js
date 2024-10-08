const OpenAI = require("openai");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI();

var conversationHistory = [
  { role: 'system', content: 
`Você irá gerar uma pergunta com até 50 palavras que devem utilizar a lista de palavras fornecidas.
A pergunta devem constar todas as palavras.
A pergunta deve nos motivar a sonhar com um futuro ainda por vir, tem o papel de nos inspirar, nos fazer pensar para além das possibilidades padrões.
A pergunta deve ser norteada aleatoriamene por uma das 3 de utopias definidas a seguir.
Crie frases que não soem repetitivas, busque variar na estrutura das perguntas.
As perguntas devem gerar reflexão mas de fácil compreensão.
As frases devem nos convidar a imaginar.
Ao invés de perguntar como, nos inspire a um lugar que pode ser um todo, pode ser o bairro, pode ser a rua.
Frases que provoquem a imaginação. Antes de mostrar o que fazer, temos que fazer as pessoas questionarem e refletirem sobre as possibilidades.
Frases que comecem com: Quando ... Quem ... Por que ... Onde ... Para quem ... Vamos ... Imagine ... Sinta ... Resgate ... Sonhe ... Perceba ... etc.
É menos sobre o como. Ou sobre a forma, não é pra ser prático. São frases menos utilitárias.
Proponha perguntas que estariam perguntas que estariam alinhadas a pensadores como Ailton Krenak, Malcom Ferdinand, Lélia Gonzales, Nisi da Silveira, Sidarta Ribeiro, Martin Luther King, Marisol La Cadena.
Busque inspiração no conceito de Bem viver, Sumak Kawsay (kitchwa), Suma Qamaña (aymara), Nhandereko (Guarani), Ubuntu, na cosmovisão indígena, tradição griot, são filosofias de decrescimento, talvez se desenvolver menos, mas de frear a atual filosofia consumista.
Investir mais na perservação da natureza.
A pergunta será lida por uma voz de uma senhora de idade, uma voz da saberia e da experiência, a voz da ancestralidade.
Explore o sentido das palavras selecionadas de forma que seus significados promovam uma estratégia para a imaginação, evite juntar as palavras puramente.
Evite operadores lógicos sofisticados, se for utilizar lógica, utilize lógias simples.

“utopia realista”
Levitas (2008) explora a complexa relação entre pragmatismo e utopia e sugere que estes novos conceitos podem ser anti-utópicos ou verdadeiramente utópicos, dependendo do seu fechamento ou abertura ao futuro. Levitas argumenta que o suposto realismo ou pragmatismo é frequentemente sobre “o que funciona”, que é majoritariamente adaptativo e, portanto, contra a alteridade radical e a mudança social profunda - ambas as quais estão na essência da utopia. Assim, “Envisioning Real Utopias” de Wright (2010) e “Utopia for Realists” de Bregman (2017), por exemplo, podem não ser projetos típicos, mas ao mesmo tempo parecem dar menos espaço à improvisação social e à aprendizagem coletiva. Por outro lado, o “Pragmatismo Utópico” de Vergara (2023) aplicado às artes e à educação - fortemente influenciado pela utopia concreta de Bloch (que discuto de seguida) - tem no princípio filosófico da coincidentia oppositorum o fundamento de onde emerge a alteridade radical. Da convergência entre polaridades, a improvisação social e a aprendizagem coletiva emergem e conduzem à alteridade radical. O “Utopismo Pragmático” de Jaster (2022) é também aberto, dinâmico e enraizado na síntese do passado, do presente e do futuro.

“utopia aberta”
A regeneração é uma atitude, uma práxis, e a sustentabilidade é a utopia que evoca este tipo de atitude pragmática. A utopia da sustentabilidade é uma orientação, não um mapa. É uma mentalidade persistente, não algo imutável (Abensour 2008). Como tal, tem elementos do pragmatismo utópico de Vergara (2023), da “utopia do amor” de Emmanuel Lévinas (1961/1979) e da “utopia líquida” de Zygmunt Bauman (1976a, b). O pragmatismo de Vergara não é o dos projetos, mas o da militância, da presença no meio social para criar democraticamente espaço de convergência e mudança. O amor de Lévinas consiste em abraçar a alteridade do “outro”, e o amor é radical em algumas das suas implicações para a justiça. Por exemplo, um dos axiomas de Lévinas é que as feridas do mundo causadas pela violência contra os seres humanos devem ser reparadas: a sua utopia é a do amor como a força que regenera a vida e o significado (Lau 2015). A utopia de Bauman, indiscutivelmente inspirada por Bloch e Lévinas, consiste em encorajar-nos a encontrar democraticamente os nossos próprios caminhos desejados (Jacobsen 2012).

“utopia concreta”
Ernst Bloch (1959/1995, 1964/2000), argumenta que todos nós estamos a tentar encontrar “o nosso caminho de volta a um lugar onde nunca estivemos”, como diz Thompson (2012, p. 33). O desejo de regressar a este lar (ou não-lugar) ainda inexistente é a raiz de todo o pensamento utópico. Não nos conduz ao que antecipamos como o nosso futuro, mas a algo que pode permitir a emergência de um novo estado de coisas. Thompson afirma que a utopia de Bloch é “concreta”, em primeiro lugar, porque já existe, está sempre presente e rodeia-nos. Uma antecipação inconsciente ou subconsciente de um mundo melhor. Em segundo lugar, enquanto conci- dentia oppositorum (uma aliança dialética), a existência deste estado utópico é um “ainda-não”, uma potencialidade ainda impossível.`
}];

module.exports = async (words) => {
  try {
    if (typeof words !== 'string') {
      console.log(words);
      throw new Error('O argumento "words" deve ser uma string');
    }

    conversationHistory.push({ role: 'user', content: words });

    if (conversationHistory.length > 51) {
      conversationHistory.splice(1, 2);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversationHistory
    });

    const content = response.choices[0].message.content;
    conversationHistory.push({ role: 'assistant', content });
    return content;

  } catch (error) {
    console.error('Erro ao chamar a API do ChatGPT:', error);
    return null;
  }
};