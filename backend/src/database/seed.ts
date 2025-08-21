import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { QuizSession, QuizSessionStatus } from '../entities/QuizSession';
import { Question, QuestionType } from '../entities/Question';
import { v4 as uuidv4 } from 'uuid';

async function seedDatabase() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Check if sample session already exists
    const sessionRepository = AppDataSource.getRepository(QuizSession);
    let session = await sessionRepository.findOne({ where: { code: 'SAMPLE' } });
    
    if (session) {
      console.log('🔄 Sample session already exists, clearing old questions...');
      // Delete existing questions for this session
      const questionRepository = AppDataSource.getRepository(Question);
      await questionRepository.delete({ quiz_session_id: session.id });
      console.log('✅ Cleared existing questions');
    } else {
      // Create a new sample quiz session
      session = sessionRepository.create({
        id: uuidv4(),
        code: 'SAMPLE',
        name: 'Sample Pub Quiz',
        status: QuizSessionStatus.WAITING,
        current_round: 1
      });

      await sessionRepository.save(session);
      console.log('✅ Created sample quiz session');
    }

    // Create sample questions
    const questionRepository = AppDataSource.getRepository(Question);
    const questions = [
      // Round 1 - General Knowledge
      {
        roundNumber: 1,
        questionNumber: 1,
        type: QuestionType.MULTIPLE_CHOICE,
        questionText: 'What is the capital of France?',
        funFact: 'Paris is known as the "City of Light" and has been a major center of art, fashion, and culture for centuries.',
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
        funFact: 'The war ended with the surrender of Germany in May 1945 and Japan in September 1945.',
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
        funFact: 'The skin is not only the largest organ but also the heaviest, weighing about 8-10 pounds in adults.',
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
        funFact: 'Robert Downey Jr. was initially considered a risky choice for the role due to his past legal issues.',
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
        funFact: 'Springfield was chosen because it\'s a common town name in the United States, with over 30 states having a Springfield.',
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
        funFact: 'This is actually false! The Great Wall is not visible from space without aid, contrary to popular belief.',
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
        funFact: 'This iconic tower was built for the 1889 World\'s Fair in Paris and stands 330 meters tall.',
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
        funFact: 'This piece is "Eine kleine Nachtmusik" composed in 1787, one of Mozart\'s most recognizable works.',
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
        funFact: 'The speed of light in a vacuum is exactly 299,792.458 km/s, one of the fundamental constants of physics.',
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
        funFact: 'Botanically speaking, berries must have seeds inside their flesh. Bananas qualify, but strawberries have seeds on the outside!',
        timeLimit: 25,
        points: 2,
        correctAnswer: 'true'
      },
      {
        roundNumber: 5,
        questionNumber: 3,
        type: QuestionType.MULTIPLE_CHOICE,
        questionText: 'Which programming language was originally called "Oak"?',
        funFact: 'Java was initially called Oak but had to be renamed due to trademark issues with Oak Technology.',
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
    console.log('🎯 Sample quiz session created with code: SAMPLE');
    console.log('📝 You can now test the application with this sample data');

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
