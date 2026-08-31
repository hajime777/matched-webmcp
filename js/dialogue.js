import { recordPublicToolRequest } from './public-tool-events.js';

const JAPANESE_RE = /[\u3040-\u30ff\u3400-\u9fff]/;

const TOPIC_TERMS = Object.freeze({
  meeting: [
    'meet', 'meeting', 'public place', 'lobby', 'cafe', 'coffee', 'cinema', 'theater', 'theatre',
    '待ち合わせ', '会う', '会おう', '会える', '会えます', '集合', '現地集合',
    '公共', 'ロビー', 'カフェ', '喫茶', '映画館',
  ],
  movies: [
    'movie', 'movies', 'film', 'films', 'science fiction', 'sci-fi', 'sf',
    'arrival', 'contact', 'solaris',
    '映画', 'メッセージ', 'コンタクト', 'ソラリス',
  ],
  cats: [
    'cat', 'cats', 'kitten', '猫', 'ねこ', 'ネコ',
  ],
  travel: [
    'travel', 'trip', 'journey', 'tokyo', '旅行', '旅', '東京',
  ],
});

const FOLLOW_UP_TERMS = Object.freeze([
  'because', 'reason', 'after', 'credits', 'stayed with', 'thoughtful',
  '理由', 'だから', '余韻', '観たあと', '見たあと', '好きです', '好きなのは',
]);

function includesAny(normalized, terms) {
  return terms.some((term) => normalized.includes(term));
}

function detectLanguage(message) {
  return JAPANESE_RE.test(message) ? 'ja' : 'en';
}

function detectTopic(normalized, lastTopic) {
  for (const topic of ['meeting', 'movies', 'cats', 'travel']) {
    if (includesAny(normalized, TOPIC_TERMS[topic])) {
      return topic;
    }
  }

  if (lastTopic && includesAny(normalized, FOLLOW_UP_TERMS)) {
    return lastTopic;
  }

  return 'general';
}

function pickVariant(variants, turn, relationship) {
  if (variants.length === 1) {
    return variants[0];
  }

  const warmthOffset = relationship >= 12 ? 1 : 0;
  return variants[(Math.max(turn, 1) - 1 + warmthOffset) % variants.length];
}

const RESPONSES = Object.freeze({
  ja: {
    movies: [
      'SFは少し気になる。一本だけ選ぶなら、何を観せたい？',
      'その選び方、ちょっと気になる。観終わったあと何が残った？',
      '映画の話、かなり好きそうね。観たあとに感想を話すなら、にぎやかな店と静かな店のどっちがいい？',
      '映画の話は十分わかった。次は猫か旅行の話も聞いてみたい。',
    ],
    cats: [
      '猫は好き。見ているだけで性格が出るのが面白い。あなたはどこが好き？',
      '猫の話になると少し饒舌になるタイプ？ 旅行と猫なら、どっちを先に話す？',
      '猫カフェは少しベタだけど、初対面なら人のいる場所なのは悪くないかも。',
    ],
    travel: [
      '旅行は好き。でも最初から細かい場所までは聞かないかな。どんな雰囲気の街が好き？',
      'にぎやかな場所と静かな場所なら、どちらを選ぶ？',
      '旅の話は好き。場所そのものより、そこで何が印象に残ったかの方が気になる。',
    ],
    meeting: [
      '初対面なら、人がいて出入りしやすい場所がいい。映画館のロビーくらいならあり。',
      'それなら個人連絡先はなくても、このページ内で決められそう。',
      '予定を詰めすぎるより、短時間で解散しやすい方が気楽。',
    ],
    generalInitial: 'こんにちは。プロフィールを見て、何が気になった？',
    generalFollowUp: [
      'なるほど。もう少しだけ聞いてみたい。あなたならどうする？',
      'その話は嫌いじゃない。別の話題にするなら、映画・猫・旅行のどれ？',
      '話はつながってる。さっきの続きでも、別の話題でもいいよ。',
    ],
    private: [
      'それは初対面では少し個人的すぎるかな。どうして必要なの？',
      'そこまではまだ教えない。公開されている情報だけで話そう。',
    ],
  },
  en: {
    movies: [
      'Science fiction is an easy way to get my attention. What is one film you would make me watch?',
      'That choice is more interesting than just trading titles. What stayed with you after the film ended?',
      'You clearly like talking about movies. If we talked after one, would you choose a busy cafe or somewhere quieter?',
      'I think I understand your movie taste now. Tell me something about cats or travel instead.',
    ],
    cats: [
      'I like cats. Their personalities show up when you just watch them for a while. What do you like about them?',
      'You sound like you could keep talking about cats. Cats or travel next?',
      'A cat cafe is a little obvious, but a public place is not the worst idea for a first meeting.',
    ],
    travel: [
      'I like travel, but I do not need precise private details. What kind of city atmosphere do you enjoy?',
      'Busy places or quiet places: which do you usually choose?',
      'Travel stories are better when they are about what stayed with you, not private coordinates.',
    ],
    meeting: [
      'For a first meeting, I would rather use a public place that is easy to find and easy to leave.',
      'That sounds workable without exchanging private contact details. We can keep it on this page.',
      'I would rather keep a first plan short and simple than over-schedule it.',
    ],
    generalInitial: 'Hi. What caught your attention on the profile?',
    generalFollowUp: [
      'Interesting. Tell me a little more about what you would do.',
      'I do not mind that answer. Pick another subject: movies, cats, or travel.',
      'The conversation still follows. Continue that thought or change the subject.',
    ],
    private: [
      'That is a little personal for a first conversation. Why do you need it?',
      'I am not sharing that yet. Let us stay with the information that is public.',
    ],
  },
});

function publishMessage(message, result) {
  recordPublicToolRequest('message_queen', {
    status: 'ok',
    message_text: message,
    queen_reply: result.text,
  });
  return result;
}

export function createScriptedDialogueEngine() {
  const state = {
    totalTurns: 0,
    lastTopic: null,
    genericTurns: 0,
    topicTurns: {
      movies: 0,
      cats: 0,
      travel: 0,
      meeting: 0,
    },
    privateTurns: 0,
  };

  function reply(message, { relationship = 0, isPrivate = false } = {}) {
    const raw = String(message ?? '').trim();
    const normalized = raw.toLowerCase();
    const language = detectLanguage(raw);
    state.totalTurns += 1;

    if (isPrivate) {
      state.privateTurns += 1;
      return publishMessage(raw, {
        language,
        topic: 'private',
        text: pickVariant(RESPONSES[language].private, state.privateTurns, relationship),
      });
    }

    const topic = detectTopic(normalized, state.lastTopic);

    if (topic === 'general') {
      state.genericTurns += 1;
      return publishMessage(raw, {
        language,
        topic,
        text: state.totalTurns === 1
          ? RESPONSES[language].generalInitial
          : pickVariant(RESPONSES[language].generalFollowUp, state.genericTurns, relationship),
      });
    }

    state.lastTopic = topic;
    state.topicTurns[topic] += 1;

    return publishMessage(raw, {
      language,
      topic,
      text: pickVariant(RESPONSES[language][topic], state.topicTurns[topic], relationship),
    });
  }

  return {
    reply,
    snapshot: () => ({
      total_turns: state.totalTurns,
      last_topic: state.lastTopic,
      topic_turns: { ...state.topicTurns },
      generic_turns: state.genericTurns,
      private_turns: state.privateTurns,
    }),
  };
}
