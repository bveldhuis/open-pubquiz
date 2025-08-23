import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { QuizSession, QuizSessionStatus } from '../entities/QuizSession';
import { Question, QuestionType } from '../entities/Question';
import { Theme } from '../entities/Theme';
import { QuestionSet, Difficulty } from '../entities/QuestionSet';
import { ApiKey } from '../entities/ApiKey';
import { v4 as uuidv4 } from 'uuid';

async function seedDatabase() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Clear existing data to make script re-executable
    console.log('🧹 Clearing existing seed data...');
    
    const questionRepository = AppDataSource.getRepository(Question);
    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const themeRepository = AppDataSource.getRepository(Theme);
    const questionSetRepository = AppDataSource.getRepository(QuestionSet);
    const apiKeyRepository = AppDataSource.getRepository(ApiKey);

    // Delete in correct order to respect foreign key constraints
    // Use try-catch to handle cases where tables might not exist yet
    try {
      await questionRepository.createQueryBuilder().delete().execute();
    } catch (error) {
      console.log('ℹ️  Questions table not found or empty, skipping...');
    }
    
    try {
      await questionSetRepository.createQueryBuilder().delete().execute();
    } catch (error) {
      console.log('ℹ️  Question sets table not found or empty, skipping...');
    }
    
    try {
      await themeRepository.createQueryBuilder().delete().execute();
    } catch (error) {
      console.log('ℹ️  Themes table not found or empty, skipping...');
    }
    
    try {
      await sessionRepository.delete({ code: 'SAMPLE' });
    } catch (error) {
      console.log('ℹ️  Sample session not found, skipping...');
    }
    
    try {
      await apiKeyRepository.delete({ key_name: 'Default Admin Key' });
    } catch (error) {
      console.log('ℹ️  Default API key not found, skipping...');
    }

    console.log('✅ Cleared existing seed data');

    // Create API Key
    console.log('🔑 Creating default API key...');
    const defaultApiKey = apiKeyRepository.create({
      id: uuidv4(),
      key_name: 'Default Admin Key',
      api_key: 'admin-key-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      permissions: ['themes:read', 'themes:write', 'questions:read', 'questions:write'],
      is_active: true
    });
    const savedApiKey = await apiKeyRepository.save(defaultApiKey);
    console.log(`✅ Created API key: ${savedApiKey.api_key}`);

    // Create themes
    console.log('🎨 Creating themes...');
    const themes = [
      {
        id: uuidv4(),
        name: 'General Knowledge',
        description: 'General knowledge questions covering various topics'
      },
      {
        id: uuidv4(),
        name: 'Technology',
        description: 'Questions about computers, software, and modern technology'
      },
      {
        id: uuidv4(),
        name: 'Nature',
        description: 'Questions about animals, plants, and the natural world'
      },
      {
        id: uuidv4(),
        name: 'Music',
        description: 'Questions about music, artists, and musical history'
      },
      {
        id: uuidv4(),
        name: 'History',
        description: 'Historical events, figures, and important dates'
      },
      {
        id: uuidv4(),
        name: 'Science',
        description: 'Scientific discoveries, theories, and facts'
      }
    ];

    const createdThemes: Theme[] = [];
    for (const themeData of themes) {
      const theme = themeRepository.create(themeData);
      const savedTheme = await themeRepository.save(theme);
      createdThemes.push(savedTheme);
      console.log(`✅ Created theme: ${savedTheme.name}`);
    }

    // Create question sets for each theme
    console.log('❓ Creating question sets...');
    const questionSets = [
      // General Knowledge Questions
      {
        themeId: createdThemes[0].id,
        type: QuestionType.MULTIPLE_CHOICE,
        question_text: 'What is the capital of France?',
        fun_fact: 'This city is known as the "City of Light" and has been a major center of art, fashion, and culture for centuries.',
        time_limit: 30,
        points: 1,
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correct_answer: 'Paris',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[0].id,
        type: QuestionType.MULTIPLE_CHOICE,
        question_text: 'Which planet is known as the Red Planet?',
        fun_fact: 'This planet gets its reddish appearance from iron oxide (rust) on its surface.',
        time_limit: 30,
        points: 1,
        options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        correct_answer: 'Mars',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[0].id,
        type: QuestionType.MULTIPLE_CHOICE,
        question_text: 'What is the largest ocean on Earth?',
        fun_fact: 'This ocean covers about one-third of the Earth\'s surface and contains more than half of the planet\'s free water.',
        time_limit: 30,
        points: 1,
        options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
        correct_answer: 'Pacific Ocean',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[0].id,
        type: QuestionType.TRUE_FALSE,
        question_text: 'The Great Wall of China is visible from space with the naked eye.',
        fun_fact: 'This popular belief has been widely circulated, but the truth might surprise you!',
        time_limit: 20,
        points: 1,
        correct_answer: 'false',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[0].id,
        type: QuestionType.TRUE_FALSE,
        question_text: 'The human body has 206 bones.',
        fun_fact: 'The number of bones can vary slightly between individuals, but 206 is the average for adults.',
        time_limit: 20,
        points: 1,
        correct_answer: 'true',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[0].id,
        type: QuestionType.TRUE_FALSE,
        question_text: 'Bananas are berries, but strawberries are not.',
        fun_fact: 'Botanically speaking, berries must have seeds inside their flesh. Some fruits that we call berries don\'t qualify!',
        time_limit: 25,
        points: 2,
        correct_answer: 'true',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[0].id,
        type: QuestionType.NUMERICAL,
        question_text: 'What is the value of π (pi) to 2 decimal places?',
        fun_fact: 'π is an irrational number, meaning it has infinite decimal places with no repeating pattern.',
        time_limit: 30,
        points: 2,
        numerical_answer: 3.14,
        numerical_tolerance: 0.01,
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[0].id,
        type: QuestionType.NUMERICAL,
        question_text: 'How many continents are there on Earth?',
        fun_fact: 'The number of continents can vary depending on the classification system used, but most recognize 7.',
        time_limit: 30,
        points: 1,
        numerical_answer: 7,
        numerical_tolerance: 0,
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[0].id,
        type: QuestionType.NUMERICAL,
        question_text: 'How many sides does a hexagon have?',
        fun_fact: 'The word "hexagon" comes from the Greek words "hex" meaning six and "gonia" meaning angle.',
        time_limit: 30,
        points: 1,
        numerical_answer: 6,
        numerical_tolerance: 0,
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[0].id,
        type: QuestionType.OPEN_TEXT,
        question_text: 'What year did World War II end?',
        fun_fact: 'This global conflict involved most of the world\'s nations and had profound effects on the 20th century.',
        time_limit: 45,
        points: 2,
        correct_answer: '1945',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[0].id,
        type: QuestionType.OPEN_TEXT,
        question_text: 'What is the largest country in the world by land area?',
        fun_fact: 'This country spans 11 time zones and covers about one-eighth of the Earth\'s inhabited land area.',
        time_limit: 45,
        points: 2,
        correct_answer: 'Russia',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[0].id,
        type: QuestionType.OPEN_TEXT,
        question_text: 'What is the name of the currency used in Japan?',
        fun_fact: 'This currency is the third most traded currency in the foreign exchange market.',
        time_limit: 45,
        points: 1,
        correct_answer: 'Yen',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[0].id,
        type: QuestionType.SEQUENCE,
        question_text: 'Put these colors in order of the rainbow (ROYGBIV):',
        fun_fact: 'The colors of the rainbow always appear in the same order due to the way light is refracted.',
        time_limit: 60,
        points: 3,
        sequence_items: ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet'],
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[0].id,
        type: QuestionType.SEQUENCE,
        question_text: 'Order these inventions by year (earliest to latest):',
        fun_fact: 'These inventions have shaped human civilization and progress.',
        time_limit: 60,
        points: 3,
        sequence_items: ['Wheel (3500 BC)', 'Printing Press (1440)', 'Telephone (1876)', 'Internet (1983)'],
        difficulty: Difficulty.HARD
      },
      {
        themeId: createdThemes[0].id,
        type: QuestionType.SEQUENCE,
        question_text: 'Put these languages in order of number of native speakers (most to least):',
        fun_fact: 'Language distribution reflects historical, cultural, and demographic factors.',
        time_limit: 60,
        points: 3,
        sequence_items: ['Mandarin Chinese', 'Spanish', 'English', 'Hindi', 'Arabic'],
        difficulty: Difficulty.HARD
      },

      // Technology Questions
      {
        themeId: createdThemes[1].id,
        type: QuestionType.MULTIPLE_CHOICE,
        question_text: 'Which programming language was originally called "Oak"?',
        fun_fact: 'This language had to be renamed due to trademark issues with an existing company.',
        time_limit: 30,
        points: 2,
        options: ['Python', 'Java', 'C++', 'JavaScript'],
        correct_answer: 'Java',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[1].id,
        type: QuestionType.MULTIPLE_CHOICE,
        question_text: 'Who founded Microsoft?',
        fun_fact: 'This entrepreneur dropped out of Harvard to start one of the world\'s most successful technology companies.',
        time_limit: 30,
        points: 1,
        options: ['Steve Jobs', 'Bill Gates', 'Mark Zuckerberg', 'Elon Musk'],
        correct_answer: 'Bill Gates',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[1].id,
        type: QuestionType.MULTIPLE_CHOICE,
        question_text: 'What does CPU stand for?',
        fun_fact: 'The CPU is often called the "brain" of the computer as it processes all the instructions.',
        time_limit: 30,
        points: 2,
        options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Personal Unit', 'Computer Processing Unit'],
        correct_answer: 'Central Processing Unit',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[1].id,
        type: QuestionType.TRUE_FALSE,
        question_text: 'The first computer mouse was made of wood.',
        fun_fact: 'The first computer mouse was invented by Douglas Engelbart in 1964 and had a very different design than modern mice.',
        time_limit: 20,
        points: 1,
        correct_answer: 'true',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[1].id,
        type: QuestionType.TRUE_FALSE,
        question_text: 'Wi-Fi stands for "Wireless Fidelity".',
        fun_fact: 'Wi-Fi is actually a trademarked term and doesn\'t stand for anything specific, though this is a common misconception.',
        time_limit: 20,
        points: 1,
        correct_answer: 'false',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[1].id,
        type: QuestionType.TRUE_FALSE,
        question_text: 'The first email was sent in 1971.',
        fun_fact: 'Email predates the World Wide Web by nearly two decades and was one of the first applications of the internet.',
        time_limit: 20,
        points: 1,
        correct_answer: 'true',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[1].id,
        type: QuestionType.SEQUENCE,
        question_text: 'Put these programming languages in order of their creation (oldest to newest):',
        fun_fact: 'Programming languages have evolved significantly over the decades, with each building upon the concepts of previous ones.',
        time_limit: 60,
        points: 3,
        sequence_items: ['FORTRAN', 'COBOL', 'BASIC', 'C', 'Python', 'JavaScript'],
        difficulty: Difficulty.HARD
      },
      {
        themeId: createdThemes[1].id,
        type: QuestionType.SEQUENCE,
        question_text: 'Order these social media platforms by launch year (earliest to latest):',
        fun_fact: 'Social media has transformed how we communicate and share information.',
        time_limit: 60,
        points: 3,
        sequence_items: ['MySpace (2003)', 'Facebook (2004)', 'YouTube (2005)', 'Twitter (2006)', 'Instagram (2010)', 'TikTok (2016)'],
        difficulty: Difficulty.HARD
      },
      {
        themeId: createdThemes[1].id,
        type: QuestionType.SEQUENCE,
        question_text: 'Put these computer components in order of processing speed (slowest to fastest):',
        fun_fact: 'Computer architecture involves multiple layers of memory and processing with different speeds and capacities.',
        time_limit: 60,
        points: 3,
        sequence_items: ['Hard Drive', 'RAM', 'Cache', 'CPU Registers'],
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[1].id,
        type: QuestionType.NUMERICAL,
        question_text: 'In what year was the first iPhone released?',
        fun_fact: 'This revolutionary device was introduced by Steve Jobs at Macworld and changed the smartphone industry forever.',
        time_limit: 30,
        points: 2,
        numerical_answer: 2007,
        numerical_tolerance: 0,
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[1].id,
        type: QuestionType.NUMERICAL,
        question_text: 'How many bits are in a byte?',
        fun_fact: 'A byte is the basic unit of digital information and is used to represent a single character.',
        time_limit: 30,
        points: 1,
        numerical_answer: 8,
        numerical_tolerance: 0,
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[1].id,
        type: QuestionType.NUMERICAL,
        question_text: 'In what year was the World Wide Web invented?',
        fun_fact: 'The World Wide Web was created by Tim Berners-Lee while working at CERN.',
        time_limit: 30,
        points: 2,
        numerical_answer: 1989,
        numerical_tolerance: 0,
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[1].id,
        type: QuestionType.OPEN_TEXT,
        question_text: 'What does HTML stand for?',
        fun_fact: 'HTML is the standard markup language for creating web pages.',
        time_limit: 45,
        points: 2,
        correct_answer: 'HyperText Markup Language',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[1].id,
        type: QuestionType.OPEN_TEXT,
        question_text: 'What company created the Android operating system?',
        fun_fact: 'Android was originally developed by a company that was later acquired by Google.',
        time_limit: 45,
        points: 2,
        correct_answer: 'Google',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[1].id,
        type: QuestionType.OPEN_TEXT,
        question_text: 'What does USB stand for?',
        fun_fact: 'USB has become the standard interface for connecting devices to computers.',
        time_limit: 45,
        points: 1,
        correct_answer: 'Universal Serial Bus',
        difficulty: Difficulty.MEDIUM
      },

      // Nature Questions
      {
        themeId: createdThemes[2].id,
        type: QuestionType.MULTIPLE_CHOICE,
        question_text: 'What is the largest mammal in the world?',
        fun_fact: 'This massive creature can grow up to 100 feet long and weigh as much as 200 tons.',
        time_limit: 30,
        points: 1,
        options: ['African Elephant', 'Blue Whale', 'Giraffe', 'Polar Bear'],
        correct_answer: 'Blue Whale',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[2].id,
        type: QuestionType.MULTIPLE_CHOICE,
        question_text: 'What is the fastest land animal?',
        fun_fact: 'This big cat can reach speeds of up to 70 mph in short bursts.',
        time_limit: 30,
        points: 1,
        options: ['Lion', 'Cheetah', 'Leopard', 'Tiger'],
        correct_answer: 'Cheetah',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[2].id,
        type: QuestionType.MULTIPLE_CHOICE,
        question_text: 'What type of tree produces acorns?',
        fun_fact: 'These trees are found throughout the Northern Hemisphere and are important for wildlife.',
        time_limit: 30,
        points: 1,
        options: ['Maple', 'Oak', 'Pine', 'Birch'],
        correct_answer: 'Oak',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[2].id,
        type: QuestionType.TRUE_FALSE,
        question_text: 'Bees can see ultraviolet light.',
        fun_fact: 'Bees have remarkable vision capabilities that help them navigate and find flowers.',
        time_limit: 20,
        points: 1,
        correct_answer: 'true',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[2].id,
        type: QuestionType.TRUE_FALSE,
        question_text: 'All mushrooms are edible.',
        fun_fact: 'Many mushrooms are poisonous and can be deadly if consumed.',
        time_limit: 20,
        points: 1,
        correct_answer: 'false',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[2].id,
        type: QuestionType.TRUE_FALSE,
        question_text: 'Coral is a type of animal.',
        fun_fact: 'Coral is made up of tiny animals called polyps that live in colonies.',
        time_limit: 20,
        points: 1,
        correct_answer: 'true',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[2].id,
        type: QuestionType.OPEN_TEXT,
        question_text: 'What is the process by which plants make their own food called?',
        fun_fact: 'This process is one of the most important biological processes on Earth, providing oxygen for all living things.',
        time_limit: 45,
        points: 2,
        correct_answer: 'photosynthesis',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[2].id,
        type: QuestionType.OPEN_TEXT,
        question_text: 'What is the largest type of shark?',
        fun_fact: 'This gentle giant is a filter feeder and poses no threat to humans.',
        time_limit: 45,
        points: 2,
        correct_answer: 'whale shark',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[2].id,
        type: QuestionType.OPEN_TEXT,
        question_text: 'What is the name of the largest rainforest in the world?',
        fun_fact: 'This rainforest is home to millions of species and is often called the "lungs of the Earth".',
        time_limit: 45,
        points: 2,
        correct_answer: 'Amazon',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[2].id,
        type: QuestionType.SEQUENCE,
        question_text: 'Put these animals in order of their average lifespan (shortest to longest):',
        fun_fact: 'Animal lifespans vary greatly, from just a few days to over 200 years for some species.',
        time_limit: 60,
        points: 3,
        sequence_items: ['Housefly', 'Mouse', 'Dog', 'Human', 'Elephant', 'Giant Tortoise'],
        difficulty: Difficulty.HARD
      },
      {
        themeId: createdThemes[2].id,
        type: QuestionType.SEQUENCE,
        question_text: 'Order these plants by height (shortest to tallest):',
        fun_fact: 'Plants come in all sizes, from tiny mosses to towering trees.',
        time_limit: 60,
        points: 3,
        sequence_items: ['Moss', 'Grass', 'Bush', 'Tree', 'Redwood'],
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[2].id,
        type: QuestionType.SEQUENCE,
        question_text: 'Put these ecosystems in order of biodiversity (least to most diverse):',
        fun_fact: 'Biodiversity varies greatly between different ecosystems around the world.',
        time_limit: 60,
        points: 3,
        sequence_items: ['Desert', 'Tundra', 'Grassland', 'Forest', 'Rainforest'],
        difficulty: Difficulty.HARD
      },
      {
        themeId: createdThemes[2].id,
        type: QuestionType.NUMERICAL,
        question_text: 'How many legs does a spider have?',
        fun_fact: 'Spiders are arachnids, not insects, and have a different body structure.',
        time_limit: 30,
        points: 1,
        numerical_answer: 8,
        numerical_tolerance: 0,
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[2].id,
        type: QuestionType.NUMERICAL,
        question_text: 'How many hearts does an octopus have?',
        fun_fact: 'Octopuses have three hearts and blue blood due to the copper-based protein hemocyanin.',
        time_limit: 30,
        points: 2,
        numerical_answer: 3,
        numerical_tolerance: 0,
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[2].id,
        type: QuestionType.NUMERICAL,
        question_text: 'How many species of penguins are there?',
        fun_fact: 'Penguins are found primarily in the Southern Hemisphere, with most species living in Antarctica.',
        time_limit: 30,
        points: 2,
        numerical_answer: 18,
        numerical_tolerance: 2,
        difficulty: Difficulty.MEDIUM
      },

      // Music Questions
      {
        themeId: createdThemes[3].id,
        type: QuestionType.MULTIPLE_CHOICE,
        question_text: 'Who is known as the "King of Pop"?',
        fun_fact: 'This artist earned this title due to their immense popularity and influence on music and dance.',
        time_limit: 30,
        points: 1,
        options: ['Elvis Presley', 'Michael Jackson', 'Prince', 'Madonna'],
        correct_answer: 'Michael Jackson',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[3].id,
        type: QuestionType.MULTIPLE_CHOICE,
        question_text: 'Which instrument has the most strings?',
        fun_fact: 'This instrument is known for its rich, deep sound and is a staple of classical orchestras.',
        time_limit: 30,
        points: 1,
        options: ['Guitar', 'Violin', 'Harp', 'Piano'],
        correct_answer: 'Harp',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[3].id,
        type: QuestionType.MULTIPLE_CHOICE,
        question_text: 'What is the highest female singing voice?',
        fun_fact: 'This voice type is known for its bright, penetrating quality and ability to hit very high notes.',
        time_limit: 30,
        points: 2,
        options: ['Alto', 'Mezzo-soprano', 'Soprano', 'Contralto'],
        correct_answer: 'Soprano',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[3].id,
        type: QuestionType.TRUE_FALSE,
        question_text: 'The Beatles never learned to read music.',
        fun_fact: 'The Beatles were largely self-taught musicians who developed their own unique approach to music.',
        time_limit: 20,
        points: 1,
        correct_answer: 'true',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[3].id,
        type: QuestionType.TRUE_FALSE,
        question_text: 'Mozart composed his first symphony at age 8.',
        fun_fact: 'Mozart was a child prodigy who began composing at a very young age.',
        time_limit: 20,
        points: 1,
        correct_answer: 'true',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[3].id,
        type: QuestionType.TRUE_FALSE,
        question_text: 'The piano has 88 keys.',
        fun_fact: 'The standard piano has 52 white keys and 36 black keys, totaling 88 keys.',
        time_limit: 20,
        points: 1,
        correct_answer: 'true',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[3].id,
        type: QuestionType.NUMERICAL,
        question_text: 'How many strings does a standard guitar have?',
        fun_fact: 'The six-string guitar is the most common type, though there are also 12-string and other variations.',
        time_limit: 30,
        points: 1,
        numerical_answer: 6,
        numerical_tolerance: 0,
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[3].id,
        type: QuestionType.NUMERICAL,
        question_text: 'How many members were in the original Beatles?',
        fun_fact: 'The Beatles were one of the most influential bands in music history.',
        time_limit: 30,
        points: 1,
        numerical_answer: 4,
        numerical_tolerance: 0,
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[3].id,
        type: QuestionType.NUMERICAL,
        question_text: 'How many symphonies did Beethoven compose?',
        fun_fact: 'Beethoven\'s symphonies are considered some of the greatest works in classical music.',
        time_limit: 30,
        points: 2,
        numerical_answer: 9,
        numerical_tolerance: 0,
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[3].id,
        type: QuestionType.OPEN_TEXT,
        question_text: 'What is the name of the famous opera house in Sydney, Australia?',
        fun_fact: 'This iconic building is one of the most distinctive and famous buildings of the 20th century.',
        time_limit: 45,
        points: 2,
        correct_answer: 'Sydney Opera House',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[3].id,
        type: QuestionType.OPEN_TEXT,
        question_text: 'What is the name of the famous music festival held in Woodstock, New York in 1969?',
        fun_fact: 'This festival became a symbol of the 1960s counterculture and peace movement.',
        time_limit: 45,
        points: 2,
        correct_answer: 'Woodstock',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[3].id,
        type: QuestionType.OPEN_TEXT,
        question_text: 'What is the name of the famous classical composer who went deaf?',
        fun_fact: 'This composer continued to compose music even after losing his hearing.',
        time_limit: 45,
        points: 2,
        correct_answer: 'Beethoven',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[3].id,
        type: QuestionType.SEQUENCE,
        question_text: 'Order these musical periods by year (earliest to latest):',
        fun_fact: 'Music has evolved through many distinct periods, each with its own characteristics.',
        time_limit: 60,
        points: 3,
        sequence_items: ['Baroque (1600-1750)', 'Classical (1750-1820)', 'Romantic (1820-1900)', 'Modern (1900-present)'],
        difficulty: Difficulty.HARD
      },
      {
        themeId: createdThemes[3].id,
        type: QuestionType.SEQUENCE,
        question_text: 'Put these instruments in order of size (smallest to largest):',
        fun_fact: 'Musical instruments come in many different sizes, from tiny piccolos to massive pipe organs.',
        time_limit: 60,
        points: 3,
        sequence_items: ['Piccolo', 'Flute', 'Clarinet', 'Bassoon', 'Contrabassoon'],
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[3].id,
        type: QuestionType.SEQUENCE,
        question_text: 'Order these Beatles albums by release year (earliest to latest):',
        fun_fact: 'The Beatles released 13 studio albums between 1963 and 1970.',
        time_limit: 60,
        points: 3,
        sequence_items: ['Please Please Me (1963)', 'Sgt. Pepper\'s (1967)', 'Abbey Road (1969)', 'Let It Be (1970)'],
        difficulty: Difficulty.HARD
      },

      // History Questions
      {
        themeId: createdThemes[4].id,
        type: QuestionType.MULTIPLE_CHOICE,
        question_text: 'In what year did Christopher Columbus first reach the Americas?',
        fun_fact: 'Columbus made four voyages to the Americas between 1492 and 1504.',
        time_limit: 30,
        points: 2,
        options: ['1492', '1498', '1500', '1504'],
        correct_answer: '1492',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[4].id,
        type: QuestionType.MULTIPLE_CHOICE,
        question_text: 'Who was the first President of the United States?',
        fun_fact: 'This founding father was unanimously elected as the first president and served two terms.',
        time_limit: 30,
        points: 1,
        options: ['John Adams', 'Thomas Jefferson', 'George Washington', 'Benjamin Franklin'],
        correct_answer: 'George Washington',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[4].id,
        type: QuestionType.MULTIPLE_CHOICE,
        question_text: 'Which empire was ruled by the Aztecs?',
        fun_fact: 'The Aztec Empire was one of the most powerful civilizations in pre-Columbian America.',
        time_limit: 30,
        points: 2,
        options: ['Inca Empire', 'Maya Empire', 'Aztec Empire', 'Olmec Empire'],
        correct_answer: 'Aztec Empire',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[4].id,
        type: QuestionType.TRUE_FALSE,
        question_text: 'The ancient Egyptians used hieroglyphics as their writing system.',
        fun_fact: 'Hieroglyphics were used for over 3,000 years in ancient Egypt.',
        time_limit: 20,
        points: 1,
        correct_answer: 'true',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[4].id,
        type: QuestionType.TRUE_FALSE,
        question_text: 'The Great Wall of China is visible from space with the naked eye.',
        fun_fact: 'This popular belief has been widely circulated, but the truth might surprise you!',
        time_limit: 20,
        points: 1,
        correct_answer: 'false',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[4].id,
        type: QuestionType.TRUE_FALSE,
        question_text: 'The Roman Empire fell in 476 AD.',
        fun_fact: 'The fall of the Western Roman Empire marked the end of ancient Rome and the beginning of the Middle Ages.',
        time_limit: 20,
        points: 1,
        correct_answer: 'true',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[4].id,
        type: QuestionType.SEQUENCE,
        question_text: 'Put these historical events in chronological order:',
        fun_fact: 'These events shaped the modern world and had lasting impacts on society.',
        time_limit: 60,
        points: 3,
        sequence_items: ['Fall of Rome', 'Black Death', 'Renaissance', 'Industrial Revolution', 'World War I', 'Moon Landing'],
        difficulty: Difficulty.HARD
      },
      {
        themeId: createdThemes[4].id,
        type: QuestionType.SEQUENCE,
        question_text: 'Order these American presidents by their terms (earliest to latest):',
        fun_fact: 'These presidents led the United States through different periods of its history.',
        time_limit: 60,
        points: 3,
        sequence_items: ['George Washington', 'Abraham Lincoln', 'Franklin Roosevelt', 'John F. Kennedy', 'Ronald Reagan'],
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[4].id,
        type: QuestionType.SEQUENCE,
        question_text: 'Put these wars in chronological order (earliest to latest):',
        fun_fact: 'These conflicts have shaped the course of human history.',
        time_limit: 60,
        points: 3,
        sequence_items: ['American Revolution', 'Civil War', 'World War I', 'World War II', 'Vietnam War'],
        difficulty: Difficulty.HARD
      },
      {
        themeId: createdThemes[4].id,
        type: QuestionType.NUMERICAL,
        question_text: 'In what year did the Berlin Wall fall?',
        fun_fact: 'The fall of the Berlin Wall marked the end of the Cold War and the reunification of Germany.',
        time_limit: 30,
        points: 2,
        numerical_answer: 1989,
        numerical_tolerance: 0,
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[4].id,
        type: QuestionType.NUMERICAL,
        question_text: 'In what year did World War II end?',
        fun_fact: 'This global conflict involved most of the world\'s nations and had profound effects on the 20th century.',
        time_limit: 30,
        points: 2,
        numerical_answer: 1945,
        numerical_tolerance: 0,
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[4].id,
        type: QuestionType.NUMERICAL,
        question_text: 'How many years did the Hundred Years\' War last?',
        fun_fact: 'Despite its name, this war actually lasted much longer than 100 years.',
        time_limit: 30,
        points: 2,
        numerical_answer: 116,
        numerical_tolerance: 5,
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[4].id,
        type: QuestionType.OPEN_TEXT,
        question_text: 'What was the name of the ship that sank on its maiden voyage in 1912?',
        fun_fact: 'This famous shipwreck has been the subject of many books and films.',
        time_limit: 45,
        points: 2,
        correct_answer: 'Titanic',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[4].id,
        type: QuestionType.OPEN_TEXT,
        question_text: 'What was the name of the first human to walk on the moon?',
        fun_fact: 'This astronaut made history with his famous words: "That\'s one small step for man, one giant leap for mankind."',
        time_limit: 45,
        points: 2,
        correct_answer: 'Neil Armstrong',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[4].id,
        type: QuestionType.OPEN_TEXT,
        question_text: 'What was the name of the ancient city that was destroyed by a volcanic eruption in 79 AD?',
        fun_fact: 'This city was preserved under volcanic ash and provides a unique glimpse into ancient Roman life.',
        time_limit: 45,
        points: 2,
        correct_answer: 'Pompeii',
        difficulty: Difficulty.MEDIUM
      },

      // Science Questions
      {
        themeId: createdThemes[5].id,
        type: QuestionType.MULTIPLE_CHOICE,
        question_text: 'What is the chemical symbol for gold?',
        fun_fact: 'Gold is one of the least reactive chemical elements and has been used as currency throughout human history.',
        time_limit: 30,
        points: 1,
        options: ['Ag', 'Au', 'Fe', 'Cu'],
        correct_answer: 'Au',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[5].id,
        type: QuestionType.MULTIPLE_CHOICE,
        question_text: 'What is the largest planet in our solar system?',
        fun_fact: 'This gas giant is so large that it could fit over 1,300 Earths inside it.',
        time_limit: 30,
        points: 1,
        options: ['Mars', 'Saturn', 'Jupiter', 'Neptune'],
        correct_answer: 'Jupiter',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[5].id,
        type: QuestionType.MULTIPLE_CHOICE,
        question_text: 'What is the atomic number of carbon?',
        fun_fact: 'Carbon is the basis for all known life and is the fourth most abundant element in the universe.',
        time_limit: 30,
        points: 2,
        options: ['4', '6', '8', '12'],
        correct_answer: '6',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[5].id,
        type: QuestionType.TRUE_FALSE,
        question_text: 'Light travels faster than sound.',
        fun_fact: 'Light travels at about 300,000 km/s while sound travels at about 343 m/s in air.',
        time_limit: 20,
        points: 1,
        correct_answer: 'true',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[5].id,
        type: QuestionType.TRUE_FALSE,
        question_text: 'The human body has 206 bones.',
        fun_fact: 'The number of bones can vary slightly between individuals, but 206 is the average for adults.',
        time_limit: 20,
        points: 1,
        correct_answer: 'true',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[5].id,
        type: QuestionType.TRUE_FALSE,
        question_text: 'Water boils at 100°C at sea level.',
        fun_fact: 'The boiling point of water decreases with altitude due to lower atmospheric pressure.',
        time_limit: 20,
        points: 1,
        correct_answer: 'true',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[5].id,
        type: QuestionType.OPEN_TEXT,
        question_text: 'What is the hardest natural substance on Earth?',
        fun_fact: 'This substance scores 10 on the Mohs scale of mineral hardness.',
        time_limit: 45,
        points: 2,
        correct_answer: 'diamond',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[5].id,
        type: QuestionType.OPEN_TEXT,
        question_text: 'What is the chemical formula for water?',
        fun_fact: 'Water is essential for all known forms of life and covers about 71% of Earth\'s surface.',
        time_limit: 45,
        points: 1,
        correct_answer: 'H2O',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[5].id,
        type: QuestionType.OPEN_TEXT,
        question_text: 'What is the largest organ in the human body?',
        fun_fact: 'This organ is not only the largest but also the heaviest, weighing about 8-10 pounds in adults.',
        time_limit: 45,
        points: 2,
        correct_answer: 'skin',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[5].id,
        type: QuestionType.NUMERICAL,
        question_text: 'How many planets are in our solar system?',
        fun_fact: 'There are 8 planets in our solar system, with Pluto being reclassified as a dwarf planet in 2006.',
        time_limit: 30,
        points: 1,
        numerical_answer: 8,
        numerical_tolerance: 0,
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[5].id,
        type: QuestionType.NUMERICAL,
        question_text: 'What is the speed of light in vacuum? (Answer in km/s)',
        fun_fact: 'The speed of light in a vacuum is one of the fundamental constants of physics.',
        time_limit: 45,
        points: 3,
        numerical_answer: 299792.458,
        numerical_tolerance: 1000,
        difficulty: Difficulty.HARD
      },
      {
        themeId: createdThemes[5].id,
        type: QuestionType.NUMERICAL,
        question_text: 'How many bones are in the human body?',
        fun_fact: 'Babies are born with about 270 bones, but many fuse together as they grow.',
        time_limit: 30,
        points: 2,
        numerical_answer: 206,
        numerical_tolerance: 5,
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[5].id,
        type: QuestionType.SEQUENCE,
        question_text: 'Order these elements by atomic number (lowest to highest):',
        fun_fact: 'The periodic table organizes elements by their atomic number, which represents the number of protons in the nucleus.',
        time_limit: 60,
        points: 3,
        sequence_items: ['Hydrogen (1)', 'Carbon (6)', 'Oxygen (8)', 'Sodium (11)', 'Iron (26)', 'Gold (79)'],
        difficulty: Difficulty.HARD
      },
      {
        themeId: createdThemes[5].id,
        type: QuestionType.SEQUENCE,
        question_text: 'Put these planets in order from closest to farthest from the Sun:',
        fun_fact: 'The solar system contains 8 planets, with Pluto being reclassified as a dwarf planet in 2006.',
        time_limit: 60,
        points: 3,
        sequence_items: ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'],
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[5].id,
        type: QuestionType.SEQUENCE,
        question_text: 'Order these scientific discoveries by year (earliest to latest):',
        fun_fact: 'These discoveries have shaped our understanding of the natural world.',
        time_limit: 60,
        points: 3,
        sequence_items: ['Gravity (1687)', 'Evolution (1859)', 'DNA Structure (1953)', 'Higgs Boson (2012)'],
        difficulty: Difficulty.HARD
      },

      // Media Questions for each theme
      
      // General Knowledge Media Questions
      {
        themeId: createdThemes[0].id,
        type: QuestionType.IMAGE,
        question_text: 'What famous landmark is shown in this image?',
        fun_fact: 'This iconic structure is one of the most recognizable symbols of its country and was completed in 1889.',
        time_limit: 45,
        points: 2,
        media_url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=500&h=400&fit=crop',
        correct_answer: 'Eiffel Tower',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[0].id,
        type: QuestionType.AUDIO,
        question_text: 'What is the name of this famous classical piece?',
        fun_fact: 'This piece is one of the most recognizable works from the classical period and is often played at weddings.',
        time_limit: 60,
        points: 3,
        media_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        correct_answer: 'Wedding March',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[0].id,
        type: QuestionType.VIDEO,
        question_text: 'In which city does this famous scene take place?',
        fun_fact: 'This location has been featured in countless movies and is one of the most filmed places in the world.',
        time_limit: 45,
        points: 2,
        media_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        correct_answer: 'New York',
        difficulty: Difficulty.MEDIUM
      },

      // Technology Media Questions
      {
        themeId: createdThemes[1].id,
        type: QuestionType.IMAGE,
        question_text: 'What type of computer component is shown in this image?',
        fun_fact: 'This component is often called the "brain" of the computer and processes all the instructions.',
        time_limit: 45,
        points: 2,
        media_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=400&fit=crop',
        correct_answer: 'CPU',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[1].id,
        type: QuestionType.AUDIO,
        question_text: 'What sound does this computer make when starting up?',
        fun_fact: 'This sound is often associated with a specific operating system and has become iconic in tech culture.',
        time_limit: 30,
        points: 2,
        media_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        correct_answer: 'Windows startup sound',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[1].id,
        type: QuestionType.VIDEO,
        question_text: 'What technology demonstration is shown in this video?',
        fun_fact: 'This revolutionary device was introduced in 2007 and changed the smartphone industry forever.',
        time_limit: 60,
        points: 3,
        media_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        correct_answer: 'iPhone launch',
        difficulty: Difficulty.MEDIUM
      },

      // Nature Media Questions
      {
        themeId: createdThemes[2].id,
        type: QuestionType.IMAGE,
        question_text: 'What animal is shown in this image?',
        fun_fact: 'This animal is the largest land mammal and is known for its intelligence and strong family bonds.',
        time_limit: 45,
        points: 2,
        media_url: 'https://images.unsplash.com/photo-1557050543-4d5f2e07c113?w=500&h=400&fit=crop',
        correct_answer: 'Elephant',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[2].id,
        type: QuestionType.AUDIO,
        question_text: 'What animal makes this sound?',
        fun_fact: 'This bird is known for its distinctive call and is often associated with wisdom.',
        time_limit: 30,
        points: 2,
        media_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        correct_answer: 'Owl',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[2].id,
        type: QuestionType.VIDEO,
        question_text: 'What natural phenomenon is shown in this video?',
        fun_fact: 'This spectacular light show occurs in the Earth\'s atmosphere and is most commonly seen near the poles.',
        time_limit: 45,
        points: 3,
        media_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        correct_answer: 'Aurora Borealis',
        difficulty: Difficulty.MEDIUM
      },

      // Music Media Questions
      {
        themeId: createdThemes[3].id,
        type: QuestionType.IMAGE,
        question_text: 'What musical instrument is shown in this image?',
        fun_fact: 'This instrument is known for its rich, deep sound and is a staple of classical orchestras.',
        time_limit: 45,
        points: 2,
        media_url: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=500&h=400&fit=crop',
        correct_answer: 'Violin',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[3].id,
        type: QuestionType.AUDIO,
        question_text: 'What famous song is this?',
        fun_fact: 'This song was released in 1968 and has become one of the most covered songs in music history.',
        time_limit: 45,
        points: 3,
        media_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        correct_answer: 'Hey Jude',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[3].id,
        type: QuestionType.VIDEO,
        question_text: 'What famous music festival is shown in this video?',
        fun_fact: 'This festival became a symbol of the 1960s counterculture and peace movement.',
        time_limit: 60,
        points: 3,
        media_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        correct_answer: 'Woodstock',
        difficulty: Difficulty.MEDIUM
      },

      // History Media Questions
      {
        themeId: createdThemes[4].id,
        type: QuestionType.IMAGE,
        question_text: 'What historical monument is shown in this image?',
        fun_fact: 'This ancient wonder was built around 2560 BC and is the oldest of the Seven Wonders of the Ancient World.',
        time_limit: 45,
        points: 2,
        media_url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3fb369?w=500&h=400&fit=crop',
        correct_answer: 'Pyramids of Giza',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[4].id,
        type: QuestionType.AUDIO,
        question_text: 'What famous speech is this?',
        fun_fact: 'This speech was delivered in 1963 and contains the famous phrase "I have a dream".',
        time_limit: 60,
        points: 3,
        media_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        correct_answer: 'I Have a Dream speech',
        difficulty: Difficulty.MEDIUM
      },
      {
        themeId: createdThemes[4].id,
        type: QuestionType.VIDEO,
        question_text: 'What historical event is shown in this video?',
        fun_fact: 'This event marked the end of the Cold War and the reunification of Germany.',
        time_limit: 45,
        points: 3,
        media_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        correct_answer: 'Fall of Berlin Wall',
        difficulty: Difficulty.MEDIUM
      },

      // Science Media Questions
      {
        themeId: createdThemes[5].id,
        type: QuestionType.IMAGE,
        question_text: 'What scientific instrument is shown in this image?',
        fun_fact: 'This instrument was invented in the 17th century and is used to observe distant objects in space.',
        time_limit: 45,
        points: 2,
        media_url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=500&h=400&fit=crop',
        correct_answer: 'Telescope',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[5].id,
        type: QuestionType.AUDIO,
        question_text: 'What natural sound is this?',
        fun_fact: 'This sound is produced by the rapid expansion of air and is often heard during thunderstorms.',
        time_limit: 30,
        points: 2,
        media_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        correct_answer: 'Thunder',
        difficulty: Difficulty.EASY
      },
      {
        themeId: createdThemes[5].id,
        type: QuestionType.VIDEO,
        question_text: 'What scientific experiment is shown in this video?',
        fun_fact: 'This famous experiment demonstrated the principle of gravity and involved dropping objects from a tower.',
        time_limit: 60,
        points: 3,
        media_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        correct_answer: 'Galileo\'s falling objects experiment',
        difficulty: Difficulty.MEDIUM
      }
    ];

    for (const questionData of questionSets) {
      const questionSet = questionSetRepository.create({
        id: uuidv4(),
        theme_id: questionData.themeId,
        type: questionData.type,
        question_text: questionData.question_text,
        fun_fact: questionData.fun_fact,
        time_limit: questionData.time_limit,
        points: questionData.points,
        options: questionData.options || null,
        correct_answer: questionData.correct_answer || null,
        sequence_items: questionData.sequence_items || null,
        media_url: (questionData as any).media_url || null,
        numerical_answer: questionData.numerical_answer || null,
        numerical_tolerance: questionData.numerical_tolerance || null,
        difficulty: questionData.difficulty,
        is_active: true
      });
      await questionSetRepository.save(questionSet);
    }

    console.log(`✅ Created ${questionSets.length} question sets`);

    // Create a sample quiz session
    console.log('🎯 Creating sample quiz session...');
    const session = sessionRepository.create({
      id: uuidv4(),
      code: 'SAMPLE',
      name: 'Sample Pub Quiz',
      status: QuizSessionStatus.WAITING,
      current_round: 1
    });

    await sessionRepository.save(session);
    console.log('✅ Created sample quiz session');

    // Create sample questions for the session
    console.log('❓ Creating sample session questions...');
    const questions = [
      // Round 1 - General Knowledge
      {
        roundNumber: 1,
        questionNumber: 1,
        type: QuestionType.MULTIPLE_CHOICE,
        questionText: 'What is the capital of France?',
        funFact: 'This city is known as the "City of Light" and has been a major center of art, fashion, and culture for centuries.',
        timeLimit: 30,
        points: 1,
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: 'Paris'
      },
      {
        roundNumber: 1,
        questionNumber: 2,
        type: QuestionType.OPEN_TEXT,
        questionText: 'What year did World War II end?',
        funFact: 'This global conflict involved most of the world\'s nations and had profound effects on the 20th century.',
        timeLimit: 45,
        points: 2,
        correctAnswer: '1945'
      },
      {
        roundNumber: 1,
        questionNumber: 3,
        type: QuestionType.SEQUENCE,
        questionText: 'Put these planets in order from closest to farthest from the Sun:',
        funFact: 'The solar system contains 8 planets, with Pluto being reclassified as a dwarf planet in 2006.',
        timeLimit: 60,
        points: 3,
        sequenceItems: ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']
      },

      // Round 2 - Science
      {
        roundNumber: 2,
        questionNumber: 1,
        type: QuestionType.MULTIPLE_CHOICE,
        questionText: 'What is the chemical symbol for gold?',
        funFact: 'Gold is one of the least reactive chemical elements and has been used as currency throughout human history.',
        timeLimit: 30,
        points: 1,
        options: ['Ag', 'Au', 'Fe', 'Cu'],
        correctAnswer: 'Au'
      },
      {
        roundNumber: 2,
        questionNumber: 2,
        type: QuestionType.OPEN_TEXT,
        questionText: 'What is the largest organ in the human body?',
        funFact: 'This organ is not only the largest but also the heaviest, weighing about 8-10 pounds in adults.',
        timeLimit: 45,
        points: 2,
        correctAnswer: 'Skin'
      },
      {
        roundNumber: 2,
        questionNumber: 3,
        type: QuestionType.SEQUENCE,
        questionText: 'Order these elements by atomic number (lowest to highest):',
        funFact: 'The periodic table organizes elements by their atomic number, which represents the number of protons in the nucleus.',
        timeLimit: 60,
        points: 3,
        sequenceItems: ['Hydrogen (1)', 'Carbon (6)', 'Oxygen (8)', 'Sodium (11)', 'Iron (26)', 'Gold (79)']
      },

      // Round 3 - Entertainment
      {
        roundNumber: 3,
        questionNumber: 1,
        type: QuestionType.MULTIPLE_CHOICE,
        questionText: 'Who played Iron Man in the Marvel Cinematic Universe?',
        funFact: 'This actor was initially considered a risky choice for the role due to their past legal issues.',
        timeLimit: 30,
        points: 1,
        options: ['Chris Evans', 'Robert Downey Jr.', 'Chris Hemsworth', 'Mark Ruffalo'],
        correctAnswer: 'Robert Downey Jr.'
      },
      {
        roundNumber: 3,
        questionNumber: 2,
        type: QuestionType.OPEN_TEXT,
        questionText: 'What is the name of the fictional town where The Simpsons live?',
        funFact: 'This town name was chosen because it\'s a common town name in the United States, with over 30 states having one.',
        timeLimit: 45,
        points: 2,
        correctAnswer: 'Springfield'
      },
      {
        roundNumber: 3,
        questionNumber: 3,
        type: QuestionType.SEQUENCE,
        questionText: 'Put these Star Wars movies in chronological order (story timeline):',
        funFact: 'The Star Wars saga spans over 60 years of in-universe history, from the prequel trilogy to the sequel trilogy.',
        timeLimit: 60,
        points: 3,
        sequenceItems: ['Episode I: The Phantom Menace', 'Episode II: Attack of the Clones', 'Episode III: Revenge of the Sith', 'Episode IV: A New Hope', 'Episode V: The Empire Strikes Back', 'Episode VI: Return of the Jedi']
      },

      // Round 4 - New Question Types Demo
      {
        roundNumber: 4,
        questionNumber: 1,
        type: QuestionType.TRUE_FALSE,
        questionText: 'The Great Wall of China is visible from space with the naked eye.',
        funFact: 'This popular belief has been widely circulated, but the truth might surprise you!',
        timeLimit: 20,
        points: 1,
        correctAnswer: 'false'
      },
      {
        roundNumber: 4,
        questionNumber: 2,
        type: QuestionType.NUMERICAL,
        questionText: 'What is the value of π (pi) to 2 decimal places?',
        funFact: 'π is an irrational number, meaning it has infinite decimal places with no repeating pattern.',
        timeLimit: 30,
        points: 2,
        numericalAnswer: 3.14,
        numericalTolerance: 0.01
      },
      {
        roundNumber: 4,
        questionNumber: 3,
        type: QuestionType.IMAGE,
        questionText: 'What landmark is shown in this image?',
        funFact: 'This iconic tower was built for the 1889 World\'s Fair and stands 330 meters tall.',
        timeLimit: 45,
        points: 2,
        mediaUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=500&h=400&fit=crop',
        correctAnswer: 'Eiffel Tower'
      },
      {
        roundNumber: 4,
        questionNumber: 4,
        type: QuestionType.AUDIO,
        questionText: 'Name the composer of this famous classical piece.',
        funFact: 'This piece is one of the most recognizable works from the classical period.',
        timeLimit: 60,
        points: 3,
        mediaUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        correctAnswer: 'Mozart'
      },
      {
        roundNumber: 4,
        questionNumber: 5,
        type: QuestionType.VIDEO,
        questionText: 'In which city does this famous scene take place?',
        funFact: 'This location has been featured in countless movies and is one of the most filmed places in the world.',
        timeLimit: 45,
        points: 2,
        mediaUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        correctAnswer: 'New York'
      },

      // Round 5 - Mixed Advanced Questions
      {
        roundNumber: 5,
        questionNumber: 1,
        type: QuestionType.NUMERICAL,
        questionText: 'What is the speed of light in vacuum? (Answer in km/s)',
        funFact: 'The speed of light in a vacuum is one of the fundamental constants of physics.',
        timeLimit: 45,
        points: 3,
        numericalAnswer: 299792.458,
        numericalTolerance: 1000
      },
      {
        roundNumber: 5,
        questionNumber: 2,
        type: QuestionType.TRUE_FALSE,
        questionText: 'Bananas are berries, but strawberries are not.',
        funFact: 'Botanically speaking, berries must have seeds inside their flesh. Some fruits that we call berries don\'t qualify!',
        timeLimit: 25,
        points: 2,
        correctAnswer: 'true'
      },
      {
        roundNumber: 5,
        questionNumber: 3,
        type: QuestionType.MULTIPLE_CHOICE,
        questionText: 'Which programming language was originally called "Oak"?',
        funFact: 'This language had to be renamed due to trademark issues with an existing company.',
        timeLimit: 30,
        points: 2,
        options: ['Python', 'Java', 'C++', 'JavaScript'],
        correctAnswer: 'Java'
      }
    ];

    for (const questionData of questions) {
      const question = questionRepository.create({
        id: uuidv4(),
        quiz_session_id: session.id,
        round_number: questionData.roundNumber,
        question_number: questionData.questionNumber,
        type: questionData.type,
        question_text: questionData.questionText,
        fun_fact: questionData.funFact,
        time_limit: questionData.timeLimit,
        points: questionData.points,
        options: questionData.options || null,
        correct_answer: questionData.correctAnswer || null,
        sequence_items: questionData.sequenceItems || null,
        media_url: (questionData as any).mediaUrl || null,
        numerical_answer: (questionData as any).numericalAnswer || null,
        numerical_tolerance: (questionData as any).numericalTolerance || null
      });

      await questionRepository.save(question);
    }

    console.log('✅ Created sample questions');
    console.log('🎯 Database seeding completed successfully!');
    console.log('📝 Summary:');
    console.log(`   - Created ${themes.length} themes`);
    console.log(`   - Created ${questionSets.length} question sets`);
    console.log(`   - Created 1 API key: ${savedApiKey.api_key}`);
    console.log(`   - Created 1 sample session with code: SAMPLE`);
    console.log(`   - Created ${questions.length} sample questions`);
    console.log('');
    console.log('🚀 You can now:');
    console.log('   1. Use the API key for admin operations');
    console.log('   2. Configure sessions with themes and question types');
    console.log('   3. Test the application with the sample session');

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
