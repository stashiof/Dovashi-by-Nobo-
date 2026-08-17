import { Pattern } from '../types';

export const patternsPart1: Pattern[] = [
  {
    id: 1,
    part: 1,
    partTitle: 'Basic & Daily Life',
    patternNumber: 'Pattern 001',
    structure: 'Subject + want(s) + to + Verb (Base Form)',
    bengaliMeaning: 'কেউ কোনো কিছু করতে চায়।',
    categoryTag: 'ইচ্ছা ও আকাঙ্ক্ষা',
    difficulty: 'Beginner',
    sentenceBuilding: [
      { en: 'I want to build a new project.', bn: 'আমি একটি নতুন প্রজেক্ট তৈরি করতে চাই।' },
      { en: 'She wants to learn English.', bn: 'সে ইংরেজি শিখতে চায়।' },
      { en: 'They want to explore new opportunities.', bn: 'তারা নতুন সুযোগ অন্বেষণ করতে চায়।' }
    ],
    grammarCoverage: [
      { title: 'Right Forms of Verb', explanation: 'to-এর পর সবসময় Verb-এর মূল রূপ (Base Form / V1) বসে।', badge: 'Verb Rule' },
      { title: 'Subject-Verb Agreement', explanation: 'Subject যদি 3rd Person Singular (He, She, It, Rahim) হয়, তবে want-এর সাথে s যুক্ত হয়ে wants হবে।', badge: 'Agreement' }
    ],
    vocabularySpotlight: {
      synonyms: ['Wish to', 'Desire to', 'Intend to', 'Aspire to'],
      antonyms: ['Refuse to', 'Reject', 'Deny', 'Decline'],
      powerWords: [
        { word: 'Intend to', meaning: 'উদ্দেশ্য বা ইচ্ছা পোষণ করা', example: 'I intend to start my higher studies soon.' },
        { word: 'Aspire to', meaning: 'উচ্চাকাঙ্ক্ষা রাখা', example: 'She aspires to become a software engineer.' },
        { word: 'Desire to', meaning: 'তীব্র ইচ্ছা থাকা', example: 'We desire to bring positive changes.' },
        { word: 'Reluctant', meaning: 'অনিচ্ছুক', example: 'He is reluctant to change his plan.' },
        { word: 'Ambition', meaning: 'লক্ষ্য / উচ্চাকাঙ্ক্ষা', example: 'My ambition is to master English.' },
        { word: 'Willingness', meaning: 'স্বেচ্ছায় করার ইচ্ছা', example: 'She showed willingness to work hard.' },
        { word: 'Decline', meaning: 'বিনয়ের সাথে প্রত্যাখ্যান করা', example: 'They declined to attend the ceremony.' },
        { word: 'Pursue', meaning: 'পিছু নেওয়া / অর্জনের চেষ্টা করা', example: 'I want to pursue my passion.' },
        { word: 'Achieve', meaning: 'অর্জন করা', example: 'He wants to achieve his career goals.' },
        { word: 'Initiate', meaning: 'শুরু বা আরম্ভ করা', example: 'We want to initiate this campaign.' }
      ]
    },
    contextApplications: [
      { context: 'পত্রিকায় বা খবরে', en: 'The government wants to improve the education system.', bn: 'সরকার শিক্ষাব্যবস্থার উন্নতি করতে চায়।' },
      { context: 'দৈনন্দিন আড্ডায়', en: 'I want to grab a coffee before the class starts.', bn: 'ক্লাস শুরুর আগে আমি একটু কফি খেতে চাই।' }
    ],
    spokenAndWriting: {
      spoken: { en: 'I want to ask you a quick question.', context: 'কথোপকথনে' },
      writing: { en: 'Every student wants to get good marks in the final exam.', context: 'ফ্রি-হ্যান্ড রাইটিংয়ে' }
    },
    selfPractice: [
      { id: '1-1', promptBn: 'আমি একটি বই লিখতে চাই।', targetPatternHint: 'I want to...', correctAnswers: ['I want to write a book.', 'I want to author a book.'] },
      { id: '1-2', promptBn: 'তারা আমাদের সাহায্য করতে চায়।', targetPatternHint: 'They want to...', correctAnswers: ['They want to help us.', 'They want to assist us.'] }
    ],
    quizQuestions: [
      {
        id: 'q1-1',
        questionBn: 'নিচের কোন বাক্যটি ব্যাকরণগতভাবে সম্পূর্ণ সঠিক?',
        options: ['She want to learns English.', 'She wants to learn English.', 'She wants to learning English.', 'She want to learn English.'],
        correctAnswer: 'She wants to learn English.',
        explanationBn: 'Subject (She) ৩য় পুরুষ একবচন হওয়ায় wants হবে এবং to এর পর মূল verb (learn) বসবে।'
      },
      {
        id: 'q1-2',
        questionBn: '"তারা বিদেশে যেতে চায়" - এর সঠিক ইংরেজি কী?',
        options: ['They wants to go abroad.', 'They want to going abroad.', 'They want to go abroad.', 'They want going abroad.'],
        correctAnswer: 'They want to go abroad.',
        explanationBn: 'They এর পর want এবং to + Verb (go) বসে।'
      }
    ],
    speakingTask: {
      topic: 'Personal Goals & Dreams',
      promptQuestionBn: 'আপনি এ বছর কী অর্জন করতে চান? আপনার দুটি লক্ষ্য ইংরেজিতে বলুন।',
      promptQuestionEn: 'What do you want to achieve this year? Share two goals using "I want to...".',
      sampleAnswerEn: 'I want to improve my spoken English and I want to get a high-paying job.',
      coachInstructions: 'Check if the student uses "I want to + Verb (Base form)" naturally without saying "want to doing" or missing the "to".'
    }
  },
  {
    id: 2,
    part: 1,
    partTitle: 'Basic & Daily Life',
    patternNumber: 'Pattern 002',
    structure: 'Subject + plan(s) + to + Verb (Base Form)',
    bengaliMeaning: 'কোনো কিছু করার পরিকল্পনা করা।',
    categoryTag: 'পরিকল্পনা ও ভবিষ্যত',
    difficulty: 'Beginner',
    sentenceBuilding: [
      { en: 'We plan to launch the application soon.', bn: 'আমরা শীঘ্রই অ্যাপ্লিকেশনটি চালু করার পরিকল্পনা করছি।' },
      { en: 'He plans to visit Dhaka next week.', bn: 'সে আগামী সপ্তাহে ঢাকা যাওয়ার পরিকল্পনা করছে।' }
    ],
    grammarCoverage: [
      { title: 'Future Intent with Present Tense', explanation: 'Present Tense-এ লেখা হলেও এটি মূলত ভবিষ্যতের সুনির্দিষ্ট কাজের পরিকল্পনা বোঝায়।', badge: 'Tense Usage' },
      { title: 'Completing Sentence Match', explanation: 'If we get the fund, we plan to start the business.', badge: 'Condition' }
    ],
    vocabularySpotlight: {
      synonyms: ['Aim to', 'Prepare to', 'Arrange to', 'Intend to'],
      antonyms: ['Cancel', 'Abandon', 'Drop', 'Postpone'],
      powerWords: [
        { word: 'Launch', meaning: 'উদ্বোধন বা চালু করা', example: 'We plan to launch our new product.' },
        { word: 'Expand', meaning: 'সম্প্রসারণ করা', example: 'They plan to expand their business globally.' },
        { word: 'Execute', meaning: 'বাস্তবায়ন করা', example: 'We need to execute the plan accurately.' },
        { word: 'Relocate', meaning: 'স্থান পরিবর্তন করা', example: 'He plans to relocate to Canada.' },
        { word: 'Organize', meaning: 'আয়োজন করা', example: 'Students plan to organize a fest.' },
        { word: 'Collaborate', meaning: 'যৌথভাবে কাজ করা', example: 'Companies plan to collaborate.' },
        { word: 'Construct', meaning: 'নির্মাণ করা', example: 'They plan to construct a bridge.' },
        { word: 'Implement', meaning: 'প্রয়োগ করা', example: 'We plan to implement new policies.' },
        { word: 'Upgrade', meaning: 'উন্নত করা', example: 'I plan to upgrade my laptop.' },
        { word: 'Undertake', meaning: 'দায়িত্ব গ্রহণ করা', example: 'She plans to undertake this challenge.' }
      ]
    },
    contextApplications: [
      { context: 'প্রফেশনাল ইমেইলে', en: 'We plan to hold a meeting tomorrow at 10 AM.', bn: 'আমরা আগামীকাল সকাল ১০টায় একটি মিটিং করার পরিকল্পনা করছি।' }
    ],
    spokenAndWriting: {
      spoken: { en: 'What do you plan to do next?', context: 'কথোপকথনে' },
      writing: { en: 'Our college plans to organize a cultural program.', context: 'ফ্রি-হ্যান্ড রাইটিংয়ে' }
    },
    selfPractice: [
      { id: '2-1', promptBn: 'আমি একটি নতুন ল্যাপটপ কেনার পরিকল্পনা করছি।', targetPatternHint: 'I plan to buy...', correctAnswers: ['I plan to buy a new laptop.', 'I plan to purchase a new laptop.'] },
      { id: '2-2', promptBn: 'সে একটি ব্যবসা শুরু করার পরিকল্পনা করছে।', targetPatternHint: 'He/She plans to...', correctAnswers: ['He plans to start a business.', 'She plans to start a business.', 'He plans to launch a business.'] }
    ],
    quizQuestions: [
      {
        id: 'q2-1',
        questionBn: '"He plans to _____ a new car."',
        options: ['buying', 'buy', 'bought', 'buys'],
        correctAnswer: 'buy',
        explanationBn: 'to-এর পর সর্বদা Verb-এর Base Form (buy) বসে।'
      }
    ],
    speakingTask: {
      topic: 'Weekend & Future Plans',
      promptQuestionBn: 'আগামী ছুটির দিনে আপনার কী পরিকল্পনা? "I plan to..." দিয়ে বলুন।',
      promptQuestionEn: 'What do you plan to do next weekend? Answer using "I plan to...".',
      sampleAnswerEn: 'I plan to visit my hometown and spend quality time with my family.',
      coachInstructions: 'Encourage the user to speak full complete sentences using "plan to + V1".'
    }
  },
  {
    id: 3,
    part: 1,
    partTitle: 'Basic & Daily Life',
    patternNumber: 'Pattern 003',
    structure: 'Subject + decide(s) + to + Verb (Base Form)',
    bengaliMeaning: 'কোনো কিছু করার সিদ্ধান্ত নেওয়া।',
    categoryTag: 'সিদ্ধান্ত গ্রহণ',
    difficulty: 'Beginner',
    sentenceBuilding: [
      { en: 'I decide to change my routine.', bn: 'আমি আমার রুটিন পরিবর্তন করার সিদ্ধান্ত নিয়েছি।' },
      { en: 'They decide to work together.', bn: 'তারা একসাথে কাজ করার সিদ্ধান্ত নেয়।' }
    ],
    grammarCoverage: [
      { title: 'Preposition Rule', explanation: 'decide-এর পর কোনো কাজ বোঝালে to বসে এবং তার পর Verb-এর Base form হয়।', badge: 'Preposition' }
    ],
    vocabularySpotlight: {
      synonyms: ['Resolve to', 'Choose to', 'Determine to', 'Opt to'],
      antonyms: ['Hesitate', 'Delay', 'Waver', 'Vacillate'],
      powerWords: [
        { word: 'Resolve', meaning: 'দৃঢ় সংকল্প করা', example: 'I resolve to practice daily.' },
        { word: 'Determine', meaning: 'স্থির বা নিশ্চিত করা', example: 'We determine to succeed.' },
        { word: 'Opt to', meaning: 'বেছে নেওয়া', example: 'They opted to stay indoors.' },
        { word: 'Hesitate', meaning: 'দ্বিধা করা', example: 'Do not hesitate to ask.' },
        { word: 'Decision', meaning: 'সিদ্ধান্ত', example: 'It was a crucial decision.' },
        { word: 'Conclude', meaning: 'উপসংহারে আসা', example: 'They concluded the deal.' },
        { word: 'Commit', meaning: 'প্রতিশ্রুতিবদ্ধ হওয়া', example: 'Commit to your goals.' },
        { word: 'Finalize', meaning: 'চূড়ান্ত করা', example: 'We decided to finalize the dates.' },
        { word: 'Prioritize', meaning: 'অগ্রাধিকার দেওয়া', example: 'Decide to prioritize health.' },
        { word: 'Overhaul', meaning: 'আমূল পরিবর্তন করা', example: 'He decided to overhaul his life.' }
      ]
    },
    contextApplications: [
      { context: 'গল্প বা আর্টিকেলে', en: 'Finally, the hero decides to fight the villain.', bn: 'অবশেষে, নায়ক খলনায়কের সাথে লড়াই করার সিদ্ধান্ত নেয়।' }
    ],
    spokenAndWriting: {
      spoken: { en: 'I finally decided to learn coding.', context: 'কথোপকথনে' },
      writing: { en: 'The authority decides to close the school for winter.', context: 'ফ্রি-হ্যান্ড রাইটিংয়ে' }
    },
    selfPractice: [
      { id: '3-1', promptBn: 'আমরা গ্রামটি পরিষ্কার করার সিদ্ধান্ত নিয়েছি।', targetPatternHint: 'We decide to clean...', correctAnswers: ['We decide to clean the village.', 'We decided to clean the village.'] },
      { id: '3-2', promptBn: 'সে চাকরিটি ছেড়ে দেওয়ার সিদ্ধান্ত নেয়।', targetPatternHint: 'He decides to quit...', correctAnswers: ['He decides to quit the job.', 'He decides to leave the job.', 'She decides to leave the job.'] }
    ],
    quizQuestions: [
      {
        id: 'q3-1',
        questionBn: '"She decided _____ abroad for higher education."',
        options: ['to go', 'going', 'go', 'for going'],
        correctAnswer: 'to go',
        explanationBn: 'decide-এর পর to + V1 (to go) বসে।'
      }
    ],
    speakingTask: {
      topic: 'A Big Decision',
      promptQuestionBn: 'আপনি সম্প্রতি কী গুরুত্বপূর্ণ সিদ্ধান্ত নিয়েছেন? "I decided to..." দিয়ে বলুন।',
      promptQuestionEn: 'What is a major decision you made recently? Speak using "I decided to...".',
      sampleAnswerEn: 'I decided to wake up early every morning and study English consistently.',
      coachInstructions: 'Listen for "decided to + verb" and praise good pronunciation.'
    }
  },
  {
    id: 4,
    part: 1,
    partTitle: 'Basic & Daily Life',
    patternNumber: 'Pattern 004',
    structure: 'Subject + feel(s) + like + Verb+ing',
    bengaliMeaning: 'কোনো কিছু করতে ইচ্ছা করা বা আকাঙ্ক্ষা হওয়া।',
    categoryTag: 'অনুভূতি ও ইচ্ছা',
    difficulty: 'Beginner',
    sentenceBuilding: [
      { en: 'I feel like having a cup of tea.', bn: 'আমার এক কাপ চা খেতে ইচ্ছা করছে।' },
      { en: 'She feels like crying.', bn: 'তার কাঁদতে ইচ্ছা করছে।' }
    ],
    grammarCoverage: [
      { title: 'Gerund Rule (Master Rule)', explanation: 'feel like-এর পর সবসময় Verb-এর সাথে ing যুক্ত হয় (Gerund ফর্ম বসে)।', badge: 'Gerund' },
      { title: 'Negative Form', explanation: 'আমার কিছু খেতে ইচ্ছা করছে না = I don\'t feel like eating anything.', badge: 'Negative' }
    ],
    vocabularySpotlight: {
      synonyms: ['Crave', 'Desire', 'Wish for', 'Fancy'],
      antonyms: ['Dislike', 'Hate', 'Loathe', 'Dread'],
      powerWords: [
        { word: 'Crave', meaning: 'তীব্র আকাঙ্ক্ষা করা (খাবার ইত্যাদি)', example: 'I crave spicy food.' },
        { word: 'Fancy', meaning: 'পছন্দ করা / ইচ্ছা হওয়া', example: 'Do you fancy going for a walk?' },
        { word: 'Yearn for', meaning: 'ব্যাকুলভাবে চাওয়া', example: 'He yearns for peace.' },
        { word: 'Appetite', meaning: 'ক্ষুধা বা তীব্র রুচি', example: 'I have no appetite today.' },
        { word: 'Impulse', meaning: 'হঠাৎ তীব্র ইচ্ছা', example: 'I acted on impulse.' },
        { word: 'Exhausted', meaning: 'চরম ক্লান্ত', example: 'I feel like sleeping because I am exhausted.' },
        { word: 'Unwind', meaning: 'রিল্যাক্স বা বিশ্রাম করা', example: 'I feel like unwinding after work.' },
        { word: 'Indulge', meaning: 'উপভোগে গা ভাসানো', example: 'I feel like indulging in chocolate.' },
        { word: 'Distracted', meaning: 'মনোযোগহীন', example: 'I don\'t feel like studying when distracted.' },
        { word: 'Relieved', meaning: 'স্বস্তিবোধ করা', example: 'I feel like celebrating now.' }
      ]
    },
    contextApplications: [
      { context: 'ডেইলি কনভারসেশনে', en: 'I don\'t feel like working today.', bn: 'আজ আমার কাজ করতে ইচ্ছা করছে না।' }
    ],
    spokenAndWriting: {
      spoken: { en: 'Do you feel like watching a movie?', context: 'কথোপকথনে' },
      writing: { en: 'Sometimes, people feel like escaping from their busy lives.', context: 'ফ্রি-হ্যান্ড রাইটিংয়ে' }
    },
    selfPractice: [
      { id: '4-1', promptBn: 'আমার এখন ঘুমাতে ইচ্ছা করছে।', targetPatternHint: 'I feel like sleeping...', correctAnswers: ['I feel like sleeping now.', 'I feel like going to sleep now.'] },
      { id: '4-2', promptBn: 'তার কি আজ বাইরে যেতে ইচ্ছা করছে?', targetPatternHint: 'Does he feel like...', correctAnswers: ['Does he feel like going out today?', 'Does she feel like going outside today?'] }
    ],
    quizQuestions: [
      {
        id: 'q4-1',
        questionBn: '"I feel like _____ a cup of coffee right now."',
        options: ['to have', 'having', 'have', 'had'],
        correctAnswer: 'having',
        explanationBn: 'feel like এর পর সবসময় Verb+ing (having) বসে।'
      }
    ],
    speakingTask: {
      topic: 'Current Mood & Desires',
      promptQuestionBn: 'এখন আপনার কী করতে ইচ্ছা করছে? "I feel like..." দিয়ে বলুন।',
      promptQuestionEn: 'What do you feel like doing right now? Answer with "I feel like...".',
      sampleAnswerEn: 'I feel like going out for a long drive and listening to soft music.',
      coachInstructions: 'Ensure the user uses -ing after "feel like".'
    }
  },
  {
    id: 5,
    part: 1,
    partTitle: 'Basic & Daily Life',
    patternNumber: 'Pattern 005',
    structure: 'Subject + am/is/are + ready + to + Verb (Base Form)',
    bengaliMeaning: 'কোনো কিছু করার জন্য প্রস্তুত থাকা।',
    categoryTag: 'প্রস্তুতি ও সংকল্প',
    difficulty: 'Beginner',
    sentenceBuilding: [
      { en: 'I am ready to take the challenge.', bn: 'আমি চ্যালেঞ্জটি নিতে প্রস্তুত।' },
      { en: 'They are ready to start the project.', bn: 'তারা প্রজেক্টটি শুরু করতে প্রস্তুত।' }
    ],
    grammarCoverage: [
      { title: 'Adjective Usage', explanation: 'ready একটি Adjective, যার পর Infinitive (to + Base Verb) বসে।', badge: 'Infinitive' }
    ],
    vocabularySpotlight: {
      synonyms: ['Prepared to', 'Set to', 'Willing to', 'Geared up to'],
      antonyms: ['Unprepared', 'Unwilling', 'Hesitant', 'Reluctant'],
      powerWords: [
        { word: 'Prepared', meaning: 'প্রস্তুত', example: 'We are prepared for any outcome.' },
        { word: 'Equipped', meaning: 'প্রয়োজনীয় উপকরণে সজ্জিত', example: 'The team is equipped to handle issues.' },
        { word: 'Challenge', meaning: 'কঠিন প্রতিযোগিতা বা কাজ', example: 'Take the challenge with courage.' },
        { word: 'Confidence', meaning: 'আত্মবিশ্বাস', example: 'Step forward with confidence.' },
        { word: 'Determine', meaning: 'দৃঢ় সংকল্প করা', example: 'She is ready and determined.' },
        { word: 'Opportunity', meaning: 'সুযোগ', example: 'Ready to grab the opportunity.' },
        { word: 'Sacrifice', meaning: 'ত্যাগ করা', example: 'Ready to sacrifice personal comfort.' },
        { word: 'Transform', meaning: 'রূপান্তরিত করা', example: 'Ready to transform the system.' },
        { word: 'Confront', meaning: 'মুখোমুখি হওয়া', example: 'Ready to confront the problem.' },
        { word: 'Embark', meaning: 'নতুন অভিযানে নামা', example: 'Ready to embark on a new journey.' }
      ]
    },
    contextApplications: [
      { context: 'অফিসিয়াল মিটিংয়ে', en: 'The team is ready to present the report.', bn: 'দলটি রিপোর্ট উপস্থাপনের জন্য প্রস্তুত।' }
    ],
    spokenAndWriting: {
      spoken: { en: 'Are you ready to go?', context: 'কথোপকথনে' },
      writing: { en: 'A good student is always ready to learn new things.', context: 'ফ্রি-হ্যান্ড রাইটিংয়ে' }
    },
    selfPractice: [
      { id: '5-1', promptBn: 'আমরা প্রতিযোগিতায় অংশ নিতে প্রস্তুত।', targetPatternHint: 'We are ready to participate...', correctAnswers: ['We are ready to participate in the competition.', 'We are ready to take part in the competition.'] },
      { id: '5-2', promptBn: 'সে তার ভুল স্বীকার করতে প্রস্তুত নয়।', targetPatternHint: 'He is not ready to admit...', correctAnswers: ['He is not ready to admit his mistake.', 'She is not ready to accept her mistake.'] }
    ],
    quizQuestions: [
      {
        id: 'q5-1',
        questionBn: '"We are ready _____ any difficult challenge."',
        options: ['to face', 'facing', 'faced', 'for face'],
        correctAnswer: 'to face',
        explanationBn: 'ready-এর পর to + V1 (to face) বসে।'
      }
    ],
    speakingTask: {
      topic: 'Readiness for Success',
      promptQuestionBn: 'আপনি কি আপনার ইংরেজি উন্নত করতে প্রস্তুত? কীভাবে প্রস্তুত? বলুন।',
      promptQuestionEn: 'Are you ready to master English? Speak using "I am ready to...".',
      sampleAnswerEn: 'Yes, I am ready to practice daily and speak with full confidence.',
      coachInstructions: 'Validate readiness statement using "I am ready to + V1".'
    }
  },
  {
    id: 6,
    part: 1,
    partTitle: 'Basic & Daily Life',
    patternNumber: 'Pattern 006',
    structure: 'Subject + am/is/are + trying + to + Verb (Base Form)',
    bengaliMeaning: 'কোনো কিছু করার চেষ্টা করছে (চলমান অবস্থা)।',
    categoryTag: 'চেষ্টা ও প্রচেষ্টা',
    difficulty: 'Beginner',
    sentenceBuilding: [
      { en: 'I am trying to solve the issue.', bn: 'আমি সমস্যাটি সমাধান করার চেষ্টা করছি।' },
      { en: 'He is trying to contact you.', bn: 'সে আপনার সাথে যোগাযোগ করার চেষ্টা করছে।' }
    ],
    grammarCoverage: [
      { title: 'Continuous Tense Pattern', explanation: 'Present Continuous Tense-এ চলমান প্রচেষ্টাকে জীবন্তভাবে ফুটিয়ে তোলার কাঠামো।', badge: 'Continuous' }
    ],
    vocabularySpotlight: {
      synonyms: ['Attempting to', 'Striving to', 'Making an effort to', 'Endeavoring to'],
      antonyms: ['Giving up', 'Ignoring', 'Neglecting', 'Abandoning'],
      powerWords: [
        { word: 'Strive to', meaning: 'সর্বোচ্চ চেষ্টা করা', example: 'We strive to deliver quality.' },
        { word: 'Endeavor', meaning: 'কঠোর প্রচেষ্টা', example: 'I am endeavoring to improve.' },
        { word: 'Overcome', meaning: 'কাটিয়ে ওঠা / জয় করা', example: 'Trying to overcome my fear.' },
        { word: 'Adapt', meaning: 'খাপ খাইয়ে নেওয়া', example: 'Trying to adapt to new technology.' },
        { word: 'Navigate', meaning: 'পথ খুঁজে নেওয়া', example: 'Trying to navigate through difficulties.' },
        { word: 'Conserve', meaning: 'সংরক্ষণ করা', example: 'Trying to conserve electricity.' },
        { word: 'Resolve', meaning: 'সমাধান করা', example: 'Trying to resolve the conflict.' },
        { word: 'Rectify', meaning: 'সংশোধন করা', example: 'Trying to rectify the error.' },
        { word: 'Accomplish', meaning: 'সম্পাদন করা', example: 'Trying to accomplish the task.' },
        { word: 'Communicate', meaning: 'যোগাযোগ করা', example: 'Trying to communicate fluently.' }
      ]
    },
    contextApplications: [
      { context: 'কাস্টমার সাপোর্টে', en: 'We are trying to fix the server issue.', bn: 'আমরা সার্ভারের সমস্যাটি ঠিক করার চেষ্টা করছি।' }
    ],
    spokenAndWriting: {
      spoken: { en: 'What are you trying to say?', context: 'কথোপকথনে' },
      writing: { en: 'Scientists are trying to find a cure for the disease.', context: 'ফ্রি-হ্যান্ড রাইটিংয়ে' }
    },
    selfPractice: [
      { id: '6-1', promptBn: 'আমি ইংরেজি শেখার চেষ্টা করছি।', targetPatternHint: 'I am trying to learn...', correctAnswers: ['I am trying to learn English.', 'I am trying to master English.'] },
      { id: '6-2', promptBn: 'তারা আমাদের সাহায্য করার চেষ্টা করছে।', targetPatternHint: 'They are trying to help...', correctAnswers: ['They are trying to help us.', 'They are trying to assist us.'] }
    ],
    quizQuestions: [
      {
        id: 'q6-1',
        questionBn: '"The developers are trying _____ the bug."',
        options: ['fix', 'to fix', 'fixing', 'fixed'],
        correctAnswer: 'to fix',
        explanationBn: 'trying-এর পর to + Verb (to fix) বসে।'
      }
    ],
    speakingTask: {
      topic: 'Current Struggles & Efforts',
      promptQuestionBn: 'আপনি বর্তমানে কী শেখার বা ঠিক করার চেষ্টা করছেন? "I am trying to..." দিয়ে বলুন।',
      promptQuestionEn: 'What are you trying to improve in your life right now?',
      sampleAnswerEn: 'I am trying to build a consistent study habit and solve complex problems.',
      coachInstructions: 'Listen for "am/is/are trying to + V1".'
    }
  },
  {
    id: 7,
    part: 1,
    partTitle: 'Basic & Daily Life',
    patternNumber: 'Pattern 007',
    structure: 'Subject + managed + to + Verb (Base Form)',
    bengaliMeaning: 'কঠিন কিছু করতে সক্ষম হওয়া বা কোনোভাবে পেরে ওঠা।',
    categoryTag: 'সাফল্য ও সক্ষমতা',
    difficulty: 'Beginner',
    sentenceBuilding: [
      { en: 'I managed to complete the task on time.', bn: 'আমি সময়মতো কাজটি শেষ করতে সক্ষম হয়েছিলাম।' },
      { en: 'She managed to pass the exam.', bn: 'সে কোনোমতে পরীক্ষায় পাস করতে পেরেছিল।' }
    ],
    grammarCoverage: [
      { title: 'Past Ability Rule', explanation: 'অতীতে কোনো নির্দিষ্ট কঠিন পরিস্থিতিতে সফল হওয়ার ক্ষেত্রে could-এর চেয়ে managed to বেশি নিখুঁত।', badge: 'Grammar Nuance' }
    ],
    vocabularySpotlight: {
      synonyms: ['Succeeded in', 'Was able to', 'Handled', 'Pulled off'],
      antonyms: ['Failed to', 'Missed', 'Botched', 'Messed up'],
      powerWords: [
        { word: 'Survive', meaning: 'টিকে থাকা', example: 'They managed to survive the crisis.' },
        { word: 'Escape', meaning: 'পালিয়ে বাঁচা', example: 'The thief managed to escape.' },
        { word: 'Persuade', meaning: 'রাজি করানো', example: 'I managed to persuade him.' },
        { word: 'Cope', meaning: 'পরিস্থিতি সামলানো', example: 'She managed to cope with stress.' },
        { word: 'Coordinate', meaning: 'সমন্বয় করা', example: 'He managed to coordinate the event.' },
        { word: 'Deliver', meaning: 'পৌঁছে দেওয়া / সম্পন্ন করা', example: 'We managed to deliver results.' },
        { word: 'Tackle', meaning: 'মোকাবিলা করা', example: 'They managed to tackle the obstacle.' },
        { word: 'Overcome', meaning: 'জয় করা', example: 'Managed to overcome obstacles.' },
        { word: 'Secure', meaning: 'নিশ্চিত বা অর্জন করা', example: 'Managed to secure first place.' },
        { word: 'Accomplish', meaning: 'অর্জন করা', example: 'Managed to accomplish the mission.' }
      ]
    },
    contextApplications: [
      { context: 'নিউজ আর্টিকেলে', en: 'The pilot managed to land the plane safely.', bn: 'পাইলট নিরাপদে বিমানটি অবতরণ করাতে সক্ষম হন।' }
    ],
    spokenAndWriting: {
      spoken: { en: 'How did you manage to do it?', context: 'কথোপকথনে' },
      writing: { en: 'Despite poverty, he managed to get a good education.', context: 'ফ্রি-হ্যান্ড রাইটিংয়ে' }
    },
    selfPractice: [
      { id: '7-1', promptBn: 'আমি সমস্যাটি সমাধান করতে পেরেছিলাম।', targetPatternHint: 'I managed to solve...', correctAnswers: ['I managed to solve the problem.', 'I managed to solve the issue.'] },
      { id: '7-2', promptBn: 'তারা ম্যাচটি জিততে সক্ষম হয়েছিল।', targetPatternHint: 'They managed to win...', correctAnswers: ['They managed to win the match.', 'They managed to win the game.'] }
    ],
    quizQuestions: [
      {
        id: 'q7-1',
        questionBn: '"Despite the heavy rain, they managed _____ the station."',
        options: ['reach', 'to reach', 'reaching', 'reached'],
        correctAnswer: 'to reach',
        explanationBn: 'managed-এর পর to + V1 (to reach) বসে।'
      }
    ],
    speakingTask: {
      topic: 'Overcoming a Difficult Situation',
      promptQuestionBn: 'অতীতে কোনো কঠিন কাজ আপনি কীভাবে কোনোমতে শেষ করেছিলেন? বলুন।',
      promptQuestionEn: 'Tell me about a time you managed to do something difficult under pressure.',
      sampleAnswerEn: 'Despite heavy traffic, I managed to reach the interview hall just in time.',
      coachInstructions: 'Verify that the user correctly uses past tense "managed to + V1".'
    }
  },
  {
    id: 10,
    part: 1,
    partTitle: 'Basic & Daily Life',
    patternNumber: 'Pattern 010',
    structure: 'Subject + used + to + Verb (Base Form)',
    bengaliMeaning: 'অতীতে নিয়মিত করতাম কিন্তু এখন আর করি না।',
    categoryTag: 'অতীতের অভ্যাস',
    difficulty: 'Beginner',
    sentenceBuilding: [
      { en: 'I used to play football in my childhood.', bn: 'আমি ছোটবেলায় ফুটবল খেলতাম।' },
      { en: 'She used to live in Dhaka.', bn: 'সে ঢাকায় বাস করত।' }
    ],
    grammarCoverage: [
      { title: 'Past Habit', explanation: 'অতীতে নিয়মিত অভ্যাস কিন্তু বর্তমানে তা আর নেই বোঝাতে used to বসে।', badge: 'Past Habit' },
      { title: 'Negative Rule', explanation: 'নেগেটিভ করার সময় didn\'t use to বসে (যেমন: I didn\'t use to smoke)।', badge: 'Negative Rule' }
    ],
    vocabularySpotlight: {
      synonyms: ['Was in the habit of', 'Was accustomed to', 'Previously did'],
      antonyms: ['Never did', 'Avoided', 'Abstained from'],
      powerWords: [
        { word: 'Childhood', meaning: 'শৈশবকাল', example: 'Memories of my childhood.' },
        { word: 'Accustomed', meaning: 'অভ্যস্ত', example: 'Accustomed to hard work.' },
        { word: 'Habitual', meaning: 'অভ্যাসগত', example: 'A habitual reader.' },
        { word: 'Fondness', meaning: 'পছন্দ / অনুরাগ', example: 'Had a fondness for music.' },
        { word: 'Discontinue', meaning: 'বন্ধ করে দেওয়া', example: 'I discontinued that habit.' },
        { word: 'Transform', meaning: 'পরিবর্তন ঘটা', example: 'Times have transformed.' },
        { word: 'Routine', meaning: 'নিয়মিত কার্যক্রম', example: 'My old daily routine.' },
        { word: 'Recall', meaning: 'স্মরণ করা', example: 'I recall how we used to play.' },
        { word: 'Reminisce', meaning: 'অতীতের স্মৃতিচারণ করা', example: 'We reminisced about our school days.' },
        { word: 'Nostalgia', meaning: 'অতীতের মধুর স্মৃতিবেদনা', example: 'It brings pure nostalgia.' }
      ]
    },
    contextApplications: [
      { context: 'জীবনী বা স্টোরিতে', en: 'The old man used to walk by the river every evening.', bn: 'বৃদ্ধ লোকটি প্রতিদিন সন্ধ্যায় নদীর পাড়ে হাঁটতেন।' }
    ],
    spokenAndWriting: {
      spoken: { en: 'We used to be good friends.', context: 'কথোপকথনে' },
      writing: { en: 'People used to write letters before the invention of mobile phones.', context: 'ফ্রি-হ্যান্ড রাইটিংয়ে' }
    },
    selfPractice: [
      { id: '10-1', promptBn: 'আমি আগে অনেক বই পড়তাম।', targetPatternHint: 'I used to read...', correctAnswers: ['I used to read a lot of books.', 'I used to read many books.'] },
      { id: '10-2', promptBn: 'তারা এই মাঠে খেলত।', targetPatternHint: 'They used to play...', correctAnswers: ['They used to play in this field.', 'They used to play on this playground.'] }
    ],
    quizQuestions: [
      {
        id: 'q10-1',
        questionBn: '"He didn\'t _____ to smoke when he was young."',
        options: ['used', 'use', 'using', 'uses'],
        correctAnswer: 'use',
        explanationBn: 'didn\'t বসার কারণে used না হয়ে use to হবে।'
      }
    ],
    speakingTask: {
      topic: 'Childhood Memories & Past Habits',
      promptQuestionBn: 'ছোটবেলায় আপনি কী করতেন যা এখন আর করেন না? বলুন।',
      promptQuestionEn: 'What is something you used to do when you were a child?',
      sampleAnswerEn: 'I used to swim in the village river and climb mango trees with my friends.',
      coachInstructions: 'Check if student clearly pronounces "used to" and verbs in base form.'
    }
  },
  {
    id: 11,
    part: 1,
    partTitle: 'Basic & Daily Life',
    patternNumber: 'Pattern 011',
    structure: 'Subject + am/is/are + supposed to + Verb (Base Form)',
    bengaliMeaning: 'কারো কোনো কাজ করার কথা আছে (পূর্বপরিকল্পনা বা প্রত্যাশা বোঝাতে)।',
    categoryTag: 'পরিকল্পনা ও কথা থাকা',
    difficulty: 'Beginner',
    sentenceBuilding: [
      { en: 'I am supposed to meet him today.', bn: 'আজ আমার তার সাথে দেখা করার কথা আছে।' },
      { en: 'The train is supposed to arrive at 10 AM.', bn: 'ট্রেনটি সকাল ১০টায় পৌঁছানোর কথা আছে।' }
    ],
    grammarCoverage: [
      { title: 'Passive Construction with Active Meaning', explanation: 'এটি দেখতে Passive হলেও এর অর্থ Active—কারো কাছে প্রত্যাশা বা পূর্বপরিকল্পনা থাকা।', badge: 'Grammar Alert' },
      { title: 'Past Form', explanation: 'অতীতে কথা ছিল বোঝাতে was/were supposed to বসে (যেমন: My friend was supposed to call me)।', badge: 'Past Form' }
    ],
    vocabularySpotlight: {
      synonyms: ['Expected to', 'Scheduled to', 'Meant to', 'Obligated to'],
      antonyms: ['Not allowed to', 'Unexpected', 'Unscheduled', 'Exempted from'],
      powerWords: [
        { word: 'Scheduled', meaning: 'পূর্বনির্ধারিত', example: 'The meeting is scheduled at noon.' },
        { word: 'Obligated', meaning: 'বাধ্য বা দায়িত্বপ্রাপ্ত', example: 'We are obligated to obey rules.' },
        { word: 'Anticipate', meaning: 'আগে থেকেই আশা করা', example: 'We anticipate good results.' },
        { word: 'Deadline', meaning: 'নির্দিষ্ট শেষ সময়', example: 'Submit before the deadline.' },
        { word: 'Protocol', meaning: 'নিয়ম বা রীতি', example: 'Follow protocol.' },
        { word: 'Appointment', meaning: 'সাক্ষাতের নির্দিষ্ট সময়', example: 'I have an appointment.' },
        { word: 'Assign', meaning: 'দায়িত্ব অর্পণ করা', example: 'You are assigned this task.' },
        { word: 'Expectation', meaning: 'প্রত্যাশা', example: 'Meet company expectations.' },
        { word: 'Fulfill', meaning: 'পূরণ করা', example: 'Fulfill your promise.' },
        { word: 'Disregard', meaning: 'উপেক্ষা করা', example: 'Never disregard duties.' }
      ]
    },
    contextApplications: [
      { context: 'অফিস বা মিটিংয়ে', en: 'You are supposed to submit the file by tomorrow.', bn: 'আপনার আগামীকালকের মধ্যে ফাইলটি জমা দেওয়ার কথা।' }
    ],
    spokenAndWriting: {
      spoken: { en: 'What am I supposed to do now?', context: 'কথোপকথনে' },
      writing: { en: 'Students are supposed to follow the rules of the college.', context: 'ফ্রি-হ্যান্ড রাইটিংয়ে' }
    },
    selfPractice: [
      { id: '11-1', promptBn: 'তার আজ এখানে আসার কথা আছে।', targetPatternHint: 'He is supposed to...', correctAnswers: ['He is supposed to come here today.', 'She is supposed to come here today.'] },
      { id: '11-2', promptBn: 'আমাদের প্রকল্পটি শেষ করার কথা আছে।', targetPatternHint: 'We are supposed to finish...', correctAnswers: ['We are supposed to finish the project.', 'We are supposed to complete the project.'] }
    ],
    quizQuestions: [
      {
        id: 'q11-1',
        questionBn: '"Yesterday, you _____ to call me."',
        options: ['are supposed', 'were supposed', 'was supposed', 'supposing'],
        correctAnswer: 'were supposed',
        explanationBn: 'Yesterday (অতীত) এবং Subject (you) হওয়ায় were supposed to হবে।'
      }
    ],
    speakingTask: {
      topic: 'Daily Commitments',
      promptQuestionBn: 'আজ আপনার কী কী কাজ করার কথা আছে? "I am supposed to..." দিয়ে বলুন।',
      promptQuestionEn: 'What are you supposed to do today? Speak using "I am supposed to...".',
      sampleAnswerEn: 'I am supposed to attend an important online meeting and finish my assignments.',
      coachInstructions: 'Guide the user on fluent pronunciation of "supposed to" (sounds like "suh-POHZT-to").'
    }
  },
  {
    id: 13,
    part: 1,
    partTitle: 'Basic & Daily Life',
    patternNumber: 'Pattern 013',
    structure: 'Subject + should + have + Verb (Past Participle / V3)',
    bengaliMeaning: 'অতীতে কোনো কাজ করা উচিত ছিল (কিন্তু করা হয়নি)।',
    categoryTag: 'অনুতাপ ও আফসোস',
    difficulty: 'Intermediate',
    sentenceBuilding: [
      { en: 'You should have told me earlier.', bn: 'তোমার আমাকে আগে বলা উচিত ছিল।' },
      { en: 'I should have studied harder.', bn: 'আমার আরও ভালোভাবে পড়া উচিত ছিল।' }
    ],
    grammarCoverage: [
      { title: 'Modal Perfect Structure', explanation: 'Should have-এর পর সবসময় Verb-এর ৩ নম্বর রূপ (V3 / Past Participle) বসে।', badge: 'V3 Rule' },
      { title: 'Expressing Regret', explanation: 'অতীতে ঘটে যাওয়া কোনো ভুল বা অনুশোচনা প্রকাশ করতে এটি ব্যবহৃত হয়।', badge: 'Regret' }
    ],
    vocabularySpotlight: {
      synonyms: ['Ought to have', 'Was supposed to have', 'Had an obligation to'],
      antonyms: ['Shouldn\'t have', 'Need not have done'],
      powerWords: [
        { word: 'Regret', meaning: 'আফসোস বা অনুশোচনা', example: 'I deeply regret my mistake.' },
        { word: 'Earlier', meaning: 'আরও আগে', example: 'Informed earlier.' },
        { word: 'Prudent', meaning: 'বিচক্ষণ / দূরদর্শী', example: 'It would have been prudent.' },
        { word: 'Caution', meaning: 'সতর্কতা', example: 'Should have acted with caution.' },
        { word: 'Neglect', meaning: 'অবহেলা করা', example: 'We should not have neglected health.' },
        { word: 'Opportunity', meaning: 'সুযোগ', example: 'Should have grabbed the opportunity.' },
        { word: 'Consult', meaning: 'পরামর্শ নেওয়া', example: 'Should have consulted a doctor.' },
        { word: 'Preparedness', meaning: 'প্রস্তুতি', example: 'Needed better preparedness.' },
        { word: 'Mistake', meaning: 'ভুল', example: 'Admit your mistake.' },
        { word: 'Hindsight', meaning: 'ঘটনার পর বোধোদয়', example: 'In hindsight, I should have stopped.' }
      ]
    },
    contextApplications: [
      { context: 'রিপোর্টে বা মন্তব্যে', en: 'The government should have taken steps earlier.', bn: 'সরকারের উচিত ছিল আরও আগে পদক্ষেপ নেওয়া।' }
    ],
    spokenAndWriting: {
      spoken: { en: 'I shouldn\'t have said that.', context: 'কথোপকথনে' },
      writing: { en: 'We should have protected our forests to save the environment.', context: 'ফ্রি-হ্যান্ড রাইটিংয়ে' }
    },
    selfPractice: [
      { id: '13-1', promptBn: 'তোমার আমাকে কল করা উচিত ছিল।', targetPatternHint: 'You should have called...', correctAnswers: ['You should have called me.', 'You should have phoned me.'] },
      { id: '13-2', promptBn: 'আমার সেখানে যাওয়া উচিত ছিল।', targetPatternHint: 'I should have gone...', correctAnswers: ['I should have gone there.'] }
    ],
    quizQuestions: [
      {
        id: 'q13-1',
        questionBn: '"You should have _____ the truth."',
        options: ['tell', 'told', 'telling', 'tells'],
        correctAnswer: 'told',
        explanationBn: 'should have-এর পর Verb-এর V3 (told) বসে।'
      }
    ],
    speakingTask: {
      topic: 'Life Regrets & Lessons',
      promptQuestionBn: 'অতীতে এমন কী ছিল যা আপনার করা উচিত ছিল? বলুন।',
      promptQuestionEn: 'Tell me about something you should have done differently in the past.',
      sampleAnswerEn: 'I should have started learning English earlier so that I could be even more fluent today.',
      coachInstructions: 'Check that student uses "should have + V3" (e.g. should have done, should have known).'
    }
  },
  {
    id: 31,
    part: 1,
    partTitle: 'Basic & Daily Life',
    patternNumber: 'Pattern 031',
    structure: 'Subject + look(s) forward to + Verb+ing',
    bengaliMeaning: 'তীব্র আগ্রহ বা আনন্দের সাথে কোনো কিছুর জন্য অপেক্ষা করা।',
    categoryTag: 'আগ্রহ ও অপেক্ষা',
    difficulty: 'Intermediate',
    sentenceBuilding: [
      { en: 'I look forward to meeting you.', bn: 'আমি আপনার সাথে দেখা করার জন্য আগ্রহ নিয়ে অপেক্ষা করছি।' },
      { en: 'We are looking forward to hearing from you.', bn: 'আমরা আপনার উত্তরের আশায় আগ্রহ নিয়ে অপেক্ষা করছি।' }
    ],
    grammarCoverage: [
      { title: 'Grammar Golden Exception', explanation: 'সাধারণত to-এর পর V1 বসে, কিন্তু look forward to-এর "to" একটি Preposition! তাই এরপর সবসময় Verb+ing বসে।', badge: 'Must Know' },
      { title: 'Indefinite vs Continuous', explanation: 'look forward to এবং are looking forward to উভয় রূপই বহুল ব্যবহৃত।', badge: 'Style' }
    ],
    vocabularySpotlight: {
      synonyms: ['Anticipate', 'Await eagerly', 'Count down the days to', 'Long for'],
      antonyms: ['Dread (ভয় পাওয়া)', 'Ignore', 'Avoid', 'Hesitate'],
      powerWords: [
        { word: 'Anticipate', meaning: 'উচ্ছ্বাসের সাথে প্রতীক্ষা করা', example: 'We anticipate great success.' },
        { word: 'Eagerly', meaning: 'আগ্রহভরে', example: 'Eagerly waiting for your reply.' },
        { word: 'Enthusiasm', meaning: 'উৎসাহ ও উদ্দীপনা', example: 'Filled with boundless enthusiasm.' },
        { word: 'Milestone', meaning: 'মাইলফলক', example: 'Looking forward to reaching the milestone.' },
        { word: 'Collaboration', meaning: 'যৌথ উদ্যোগ', example: 'Look forward to our collaboration.' },
        { word: 'Opportunity', meaning: 'সুযোগ', example: 'Look forward to this opportunity.' },
        { word: 'Outcome', meaning: 'ফলাফল', example: 'Looking forward to the positive outcome.' },
        { word: 'Celebration', meaning: 'উদযাপন', example: 'Looking forward to the celebration.' },
        { word: 'Reunion', meaning: 'পুনর্মিলনী', example: 'Looking forward to our family reunion.' },
        { word: 'Upcoming', meaning: 'আসন্ন', example: 'Looking forward to upcoming events.' }
      ]
    },
    contextApplications: [
      { context: 'অফিসিয়াল ইমেইলের শেষে', en: 'I look forward to receiving your reply.', bn: 'আমি আপনার উত্তরের অপেক্ষায় রইলাম।' }
    ],
    spokenAndWriting: {
      spoken: { en: 'I\'m looking forward to the weekend.', context: 'কথোপকথনে' },
      writing: { en: 'Students look forward to visiting historical places during their holidays.', context: 'ফ্রি-হ্যান্ড রাইটিংয়ে' }
    },
    selfPractice: [
      { id: '31-1', promptBn: 'আমি নতুন প্রজেক্টটি শুরু করার জন্য আগ্রহ নিয়ে অপেক্ষা করছি।', targetPatternHint: 'I look forward to starting...', correctAnswers: ['I look forward to starting the new project.', 'I am looking forward to starting the new project.'] },
      { id: '31-2', promptBn: 'সে তার পরীক্ষার ফলাফলের জন্য অপেক্ষা করছে।', targetPatternHint: 'She looks forward to receiving...', correctAnswers: ['She looks forward to getting her exam results.', 'She looks forward to receiving her exam results.'] }
    ],
    quizQuestions: [
      {
        id: 'q31-1',
        questionBn: '"I am looking forward to _____ from you soon."',
        options: ['hear', 'hearing', 'heard', 'hears'],
        correctAnswer: 'hearing',
        explanationBn: 'look forward to-এর পর সবসময় Verb+ing (hearing) বসে।'
      }
    ],
    speakingTask: {
      topic: 'Exciting Future Events',
      promptQuestionBn: 'ভবিষ্যতের কোন আনন্দের ঘটনার জন্য আপনি অধীর আগ্রহে অপেক্ষা করছেন? বলুন।',
      promptQuestionEn: 'What upcoming event or goal are you looking forward to?',
      sampleAnswerEn: 'I look forward to completing this 300-pattern course and speaking English effortlessly with international clients.',
      coachInstructions: 'Check strictly that the student says "look forward to [Verb+ing]" and not base form.'
    }
  },
  {
    id: 33,
    part: 1,
    partTitle: 'Basic & Daily Life',
    patternNumber: 'Pattern 033',
    structure: 'It is high time + Subject + Verb (Past Form / V2)',
    bengaliMeaning: 'কোনো কাজ করার এখনই সবচেয়ে উপযুক্ত সময় (আর দেরি করা একদম ঠিক হবে না)।',
    categoryTag: 'উপযুক্ত সময় ও জরুরি পদক্ষেপ',
    difficulty: 'Intermediate',
    sentenceBuilding: [
      { en: 'It is high time we started the work.', bn: 'আমাদের এখনই কাজটি শুরু করার উপযুক্ত সময়।' },
      { en: 'It is high time you changed your habit.', bn: 'তোমার এখনই অভ্যাস বদলানোর উপযুক্ত সময়।' }
    ],
    grammarCoverage: [
      { title: 'Subjunctive Past Tense Rule', explanation: 'It is high time-এর পর Subject থাকলে Verb সবসময় Past Form (V2) হয়, যদিও এর অর্থ বর্তমানকালের জরুরি কাজ বোঝায়।', badge: 'Exam Rule' },
      { title: 'Without Subject Variant', explanation: 'Subject না থাকলে "to + V1" বসে (যেমন: It is high time to start the work)।', badge: 'Alternative' }
    ],
    vocabularySpotlight: {
      synonyms: ['It is the exact time', 'It is about time', 'High time to act'],
      antonyms: ['Too early', 'Premature', 'Delayed'],
      powerWords: [
        { word: 'Eradicate', meaning: 'নির্মূল করা', example: 'It is high time we eradicated corruption.' },
        { word: 'Reform', meaning: 'সংস্কার করা', example: 'High time the government reformed education.' },
        { word: 'Pollution', meaning: 'দূষণ', example: 'High time we stopped river pollution.' },
        { word: 'Habitual', meaning: 'অভ্যাসগত', example: 'Change habitual mistakes.' },
        { word: 'Crucial', meaning: 'অত্যন্ত জরুরি', example: 'Take crucial steps.' },
        { word: 'Implement', meaning: 'বাস্তবায়ন করা', example: 'High time we implemented traffic laws.' },
        { word: 'Conscious', meaning: 'সচেতন', example: 'Citizens became conscious.' },
        { word: 'Discipline', meaning: 'শৃঙ্খলা', example: 'Adopt self-discipline.' },
        { word: 'Urgent', meaning: 'জরুরি', example: 'An urgent need for change.' },
        { word: 'Actionable', meaning: 'কার্যকরী', example: 'Take actionable measures.' }
      ]
    },
    contextApplications: [
      { context: 'সম্পাদকীয় বা প্রবন্ধে', en: 'It is high time the government took strict measures against corruption.', bn: 'সরকারের এখনই দুর্নীতির বিরুদ্ধে কঠোর ব্যবস্থা নেওয়ার উপযুক্ত সময়।' }
    ],
    spokenAndWriting: {
      spoken: { en: 'It\'s high time we left.', context: 'কথোপকথনে' },
      writing: { en: 'It is high time we stopped polluting our rivers.', context: 'ফ্রি-হ্যান্ড রাইটিংয়ে' }
    },
    selfPractice: [
      { id: '33-1', promptBn: 'আমাদের এখনই ইংরেজি শেখার উপযুক্ত সময়।', targetPatternHint: 'It is high time we learned...', correctAnswers: ['It is high time we learned English.', 'It is high time we learnt English.'] },
      { id: '33-2', promptBn: 'তোমার এখনই পড়াশোনায় মনোযোগ দেওয়ার উপযুক্ত সময়।', targetPatternHint: 'It is high time you focused...', correctAnswers: ['It is high time you focused on your studies.', 'It is high time you paid attention to your studies.'] }
    ],
    quizQuestions: [
      {
        id: 'q33-1',
        questionBn: '"It is high time we _____ our bad habits."',
        options: ['change', 'changed', 'changing', 'changes'],
        correctAnswer: 'changed',
        explanationBn: 'It is high time + Subject-এর পর Verb-এর Past form (changed) বসে।'
      }
    ],
    speakingTask: {
      topic: 'Urgent Personal & Social Reforms',
      promptQuestionBn: 'আপনার মতে সমাজে এখনই কোন জিনিসটা বদলানো উচিত? বলুন।',
      promptQuestionEn: 'What is something you think it is high time we changed in our society or life?',
      sampleAnswerEn: 'It is high time we protected our green trees and prioritized environmental health.',
      coachInstructions: 'Ensure student uses past tense verb after "It is high time we [verb-ed]".'
    }
  }
];
