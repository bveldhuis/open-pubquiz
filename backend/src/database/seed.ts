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
        type: QuestionType.OPEN_TEXT,
        question_text: 'What year did World War II end?',
        fun_fact: 'This global conflict involved most of the world\'s nations and had profound effects on the 20th century.',
        time_limit: 45,
        points: 2,
        correct_answer: '1945',
        difficulty: Difficulty.MEDIUM
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
        type: QuestionType.NUMERICAL,
        question_text: 'In what year was the first iPhone released?',
        fun_fact: 'This revolutionary device was introduced by Steve Jobs at Macworld and changed the smartphone industry forever.',
        time_limit: 30,
        points: 2,
        numerical_answer: 2007,
        numerical_tolerance: 0,
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
        type: QuestionType.SEQUENCE,
        question_text: 'Put these animals in order of their average lifespan (shortest to longest):',
        fun_fact: 'Animal lifespans vary greatly, from just a few days to over 200 years for some species.',
        time_limit: 60,
        points: 3,
        sequence_items: ['Housefly', 'Mouse', 'Dog', 'Human', 'Elephant', 'Giant Tortoise'],
        difficulty: Difficulty.HARD
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
        type: QuestionType.OPEN_TEXT,
        question_text: 'What is the name of the famous opera house in Sydney, Australia?',
        fun_fact: 'This iconic building is one of the most distinctive and famous buildings of the 20th century.',
        time_limit: 45,
        points: 2,
        correct_answer: 'Sydney Opera House',
        difficulty: Difficulty.MEDIUM
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
        type: QuestionType.NUMERICAL,
        question_text: 'In what year did the Berlin Wall fall?',
        fun_fact: 'The fall of the Berlin Wall marked the end of the Cold War and the reunification of Germany.',
        time_limit: 30,
        points: 2,
        numerical_answer: 1989,
        numerical_tolerance: 0,
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
        type: QuestionType.NUMERICAL,
        question_text: 'How many planets are in our solar system?',
        fun_fact: 'There are 8 planets in our solar system, with Pluto being reclassified as a dwarf planet in 2006.',
        time_limit: 30,
        points: 1,
        numerical_answer: 8,
        numerical_tolerance: 0,
        difficulty: Difficulty.EASY
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
