import { AppDataSource } from '../config/database';
import { Answer } from '../entities/Answer';
import { SequenceAnswer } from '../entities/SequenceAnswer';
import { Question, QuestionType } from '../entities/Question';
import { IAnswerService, SubmitAnswerResult } from './interfaces/IAnswerService';
import { IQuestionService } from './interfaces/IQuestionService';
import { ITeamService } from './interfaces/ITeamService';
import { distance } from 'fastest-levenshtein';

// Import node-nlp with any type to avoid TypeScript errors
const NlpManager = require('node-nlp').NlpManager;

export class AnswerService implements IAnswerService {
  private answerRepository = AppDataSource.getRepository(Answer);
  private sequenceAnswerRepository = AppDataSource.getRepository(SequenceAnswer);
  private nlp: any;

  constructor(
    private questionService: IQuestionService,
    private teamService: ITeamService
  ) {
    // Initialize NLP with support for multiple languages
    this.nlp = new NlpManager({
      languages: ['en', 'nl', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
      forceNER: true,
      modelFileName: './model.nlp'
    });
  }

  /**
   * Submit an answer for a question
   */
  async submitAnswer(questionId: string, teamId: string, answer: string | string[]): Promise<SubmitAnswerResult> {
    // Validate question and team exist
    const question = await this.questionService.getQuestionByIdOrThrow(questionId);
    const team = await this.teamService.getTeamByIdOrThrow(teamId);

    // Check if answer already exists
    const existingAnswer = await this.answerRepository.findOne({
      where: { question_id: questionId, team_id: teamId }
    });

    if (existingAnswer) {
      throw new Error('Answer already submitted for this question');
    }

    // Process answer based on question type
    let answerText: string;
    let isCorrect: boolean | null = null;
    let pointsAwarded = 0;

    if (question.type === QuestionType.SEQUENCE && Array.isArray(answer)) {
      answerText = answer.join('|');
    } else if (typeof answer === 'string') {
      answerText = answer;
    } else {
      throw new Error('Invalid answer format');
    }

    // Auto-score multiple choice questions
    if (question.type === QuestionType.MULTIPLE_CHOICE && question.correct_answer) {
      isCorrect = answerText.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
      pointsAwarded = isCorrect ? question.points : 0;
    }
    
    // Auto-score true/false questions
    if (question.type === QuestionType.TRUE_FALSE && question.correct_answer) {
      isCorrect = answerText.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
      pointsAwarded = isCorrect ? question.points : 0;
    }
    
    // Auto-score numerical questions
    if (question.type === QuestionType.NUMERICAL && question.numerical_answer !== null && question.numerical_tolerance !== null) {
      const submittedValue = parseFloat(answerText);
      const correctValue = question.numerical_answer;
      const tolerance = question.numerical_tolerance;
      
      if (!isNaN(submittedValue)) {
        const difference = Math.abs(submittedValue - correctValue);
        isCorrect = difference <= tolerance;
        pointsAwarded = isCorrect ? question.points : 0;
      } else {
        isCorrect = false;
        pointsAwarded = 0;
      }
    }
    
    // Auto-score image, audio, video questions (exact match with fuzzy logic)
    if ((question.type === QuestionType.IMAGE || question.type === QuestionType.AUDIO || question.type === QuestionType.VIDEO) && question.correct_answer) {
      isCorrect = await this.fuzzyMatch(answerText, question.correct_answer);
      pointsAwarded = isCorrect ? question.points : 0;
    }
    
    // Auto-score sequence questions
    if (question.type === QuestionType.SEQUENCE && question.sequence_items && Array.isArray(answer)) {
      const correctSequence = question.sequence_items;
      const submittedSequence = answer;
      
      // Check if all items are in correct order
      let correctCount = 0;
      let swappedPairs = 0;
      
      for (let i = 0; i < Math.min(correctSequence.length, submittedSequence.length); i++) {
        if (correctSequence[i] === submittedSequence[i]) {
          correctCount++;
        }
      }
      
      // Check for swapped pairs (adjacent items that are swapped)
      for (let i = 0; i < Math.min(correctSequence.length - 1, submittedSequence.length - 1); i++) {
        if (correctSequence[i] === submittedSequence[i + 1] && 
            correctSequence[i + 1] === submittedSequence[i]) {
          swappedPairs++;
        }
      }
      
      // Full points if all correct
      if (correctCount === correctSequence.length) {
        isCorrect = true;
        pointsAwarded = question.points;
      } 
      // 1 point if only 2 adjacent items are swapped and the rest are correct
      else if (correctCount === correctSequence.length - 2 && swappedPairs === 1) {
        isCorrect = true;
        pointsAwarded = 1;
      } 
      // 0 points for all other cases
      else {
        isCorrect = false;
        pointsAwarded = 0;
      }
    }
    
    // Auto-score open text questions with fuzzy matching
    if (question.type === QuestionType.OPEN_TEXT && question.correct_answer) {
      isCorrect = await this.fuzzyMatch(answerText, question.correct_answer);
      pointsAwarded = isCorrect ? question.points : 0;
    }

    // Create answer
    const newAnswer = this.answerRepository.create({
      question_id: questionId,
      team_id: teamId,
      answer_text: answerText,
      is_correct: isCorrect,
      points_awarded: pointsAwarded
    });
    await this.answerRepository.save(newAnswer);

    // Create sequence answers if needed
    if (question.type === QuestionType.SEQUENCE && Array.isArray(answer)) {
      for (let i = 0; i < answer.length; i++) {
        const sequenceAnswer = this.sequenceAnswerRepository.create({
          answer_id: newAnswer.id,
          item_text: answer[i],
          position: i
        });
        await this.sequenceAnswerRepository.save(sequenceAnswer);
      }
    }

    // Update team points if auto-scored
    if (isCorrect !== null) {
      await this.teamService.updateTeamPoints(teamId, team.total_points + pointsAwarded);
      // Refresh team data
      Object.assign(team, { total_points: team.total_points + pointsAwarded });
    }

    return { answer: newAnswer, team, isCorrect, pointsAwarded };
  }

  /**
   * Get answers for a question
   */
  async getAnswersForQuestion(questionId: string): Promise<Answer[]> {
    return await this.answerRepository.find({
      where: { question_id: questionId },
      relations: ['team']
    });
  }

  /**
   * Get answers for a team
   */
  async getAnswersForTeam(teamId: string): Promise<Answer[]> {
    return await this.answerRepository.find({
      where: { team_id: teamId },
      relations: ['question']
    });
  }

  /**
   * Get answer by ID
   */
  async getAnswerById(answerId: string): Promise<Answer | null> {
    return await this.answerRepository.findOne({ 
      where: { id: answerId },
      relations: ['team']
    });
  }

  /**
   * Score an answer manually
   */
  async scoreAnswer(answerId: string, points: number, isCorrect: boolean): Promise<void> {
    const answer = await this.answerRepository.findOne({
      where: { id: answerId },
      relations: ['team']
    });

    if (!answer) {
      throw new Error('Answer not found');
    }

    const pointsDifference = points - answer.points_awarded;

    // Update answer
    await this.answerRepository.update(answerId, {
      points_awarded: points,
      is_correct: isCorrect
    });

    // Update team points
    await this.teamService.updateTeamPoints(answer.team_id, answer.team.total_points + pointsDifference);
  }

  /**
   * Delete answer
   */
  async deleteAnswer(answerId: string): Promise<void> {
    const answer = await this.answerRepository.findOne({
      where: { id: answerId },
      relations: ['team']
    });
    if (!answer) {
      throw new Error('Answer not found');
    }
    if (answer.points_awarded > 0) {
      await this.teamService.updateTeamPoints(answer.team.id, answer.team.total_points - answer.points_awarded);
    }
    await this.answerRepository.remove(answer);
  }

  /**
   * Advanced fuzzy matching using node-nlp for multi-language support
   */
  private async fuzzyMatch(submittedAnswer: string, correctAnswer: string): Promise<boolean> {
    const submitted = submittedAnswer.toLowerCase().trim();
    const correct = correctAnswer.toLowerCase().trim();



    // Reject very short answers that could be cheating (check before exact match)
    if (submitted.length < 3 || correct.length < 3) {
      return false;
    }

    // Exact match
    if (submitted === correct) {
      return true;
    }

    // Ultra-strict length restrictions
    // Submitted answer must be at least 80% of correct answer length
    if (submitted.length < Math.max(4, correct.length * 0.8)) {
      return false;
    }

    // Submitted answer cannot be more than 130% of correct answer length
    if (submitted.length > correct.length * 1.3) {
      return false;
    }

    try {
      // Use node-nlp to process both answers
      const submittedProcessed = await this.processTextWithNLP(submitted);
      const correctProcessed = await this.processTextWithNLP(correct);



      // Check if processed versions match exactly (but not if both are empty)
      if (submittedProcessed.normalized === correctProcessed.normalized && submittedProcessed.normalized !== '') {
        return true;
      }

      // Check if stems match exactly (but not if both are empty)
      if (submittedProcessed.stemmed === correctProcessed.stemmed && submittedProcessed.stemmed !== '') {
        return true;
      }

      // Reject if there's no common character overlap (completely different words)
      const submittedChars = new Set(submitted.toLowerCase());
      const correctChars = new Set(correct.toLowerCase());
      const intersection = new Set([...submittedChars].filter(x => correctChars.has(x)));
      const commonCharRatio = intersection.size / Math.max(submittedChars.size, correctChars.size);
      
      if (commonCharRatio < 0.7) { // Must have at least 70% character overlap
        return false;
      }

      // Very strict check for single-word vs multi-word mismatches
      const submittedWordArray = submitted.split(/\s+/);
      const correctWordArray = correct.split(/\s+/);
      
      // If both are single words and completely different, reject
      if (submittedWordArray.length === 1 && correctWordArray.length >= 1) {
        const singleWord = submittedWordArray[0];
        const hasWordMatch = correctWordArray.some(word => 
          singleWord === word || 
          singleWord.includes(word) || 
          word.includes(singleWord) ||
          this.jaroWinklerDistance(singleWord, word) >= 0.9
        );
        if (!hasWordMatch) {
          return false;
        }
      }

      // Additional check: reject if words don't share a common starting character pattern
      const submittedFirst = submitted.substring(0, 2);
      const correctFirst = correct.substring(0, 2);
      const hasCommonStart = submittedFirst[0] === correctFirst[0] || 
                            (submittedFirst.length > 1 && correctFirst.length > 1 && 
                             submittedFirst.substring(0, 2) === correctFirst.substring(0, 2));
      
      if (!hasCommonStart && commonCharRatio < 0.85) {
        return false;
      }

      // Very strict word-level matching - ALL significant words must match
      const submittedWords = submittedProcessed.tokens.filter(word => word.length > 2); // Only significant words
      const correctWords = correctProcessed.tokens.filter(word => word.length > 2);
      
      // Check if we have completely different words (no word matches at all)
      if (submittedWords.length > 0 && correctWords.length > 0) {
        const hasAnyWordMatch = submittedWords.some(word => 
          correctWords.some(correctWord => 
            word === correctWord || 
            this.jaroWinklerDistance(word, correctWord) >= 0.8 // At least one word must be reasonably similar
          )
        );
        
        if (!hasAnyWordMatch) {
          return false; // No words match at all - completely different
        }
        
        const matchingWords = submittedWords.filter(word => 
          correctWords.some(correctWord => 
            word === correctWord || 
            this.jaroWinklerDistance(word, correctWord) >= 0.98 // Ultra high threshold: 98%
          )
        );
        
        // Require 100% of significant words to match
        const matchRatio = matchingWords.length / Math.max(submittedWords.length, correctWords.length);
        if (matchRatio >= 1.0) { // 100% of significant words must match
          return true;
        }
      }

      // Only allow ultra-strict similarity checks if all previous checks passed
      // This means we only get here for very similar words, not completely different ones
      
      // Final extremely strict similarity check - only for near-identical strings
      const maxLength = Math.max(submittedProcessed.normalized.length, correctProcessed.normalized.length);
      if (maxLength === 0) return true;
      
      const levenshteinDistance = distance(submittedProcessed.normalized, correctProcessed.normalized);
      const similarity = 1 - (levenshteinDistance / maxLength);
      
      // Ultra-conservative: only accept if almost identical (99%+ similarity)
      if (similarity >= 0.99) {
        return true;
      }
      
      // Absolutely no fallback for anything less than 99% similar
      return false;

    } catch (error) {
      // Fallback to simple Levenshtein if NLP processing fails - apply same strict checks
      
      // Apply character overlap check even in fallback
      const submittedChars = new Set(submitted.toLowerCase());
      const correctChars = new Set(correct.toLowerCase());
      const intersection = new Set([...submittedChars].filter(x => correctChars.has(x)));
      const commonCharRatio = intersection.size / Math.max(submittedChars.size, correctChars.size);
      
      if (commonCharRatio < 0.7) {
        return false; // Reject if insufficient character overlap
      }
      
      // Apply word matching check
      const submittedWordArray = submitted.split(/\s+/);
      const correctWordArray = correct.split(/\s+/);
      
      if (submittedWordArray.length === 1 && correctWordArray.length >= 1) {
        const singleWord = submittedWordArray[0];
        const hasWordMatch = correctWordArray.some(word => 
          singleWord === word || 
          singleWord.includes(word) || 
          word.includes(singleWord)
        );
        if (!hasWordMatch) {
          return false; // Reject if no word match
        }
      }
      
      // Apply starting character check
      const submittedFirst = submitted.substring(0, 2);
      const correctFirst = correct.substring(0, 2);
      const hasCommonStart = submittedFirst[0] === correctFirst[0] || 
                            (submittedFirst.length > 1 && correctFirst.length > 1 && 
                             submittedFirst.substring(0, 2) === correctFirst.substring(0, 2));
      
      if (!hasCommonStart && commonCharRatio < 0.85) {
        return false; // Reject if no common start and insufficient overlap
      }
      
      // Only then apply Levenshtein distance
      const maxLength = Math.max(submitted.length, correct.length);
      if (maxLength === 0) return true;
      
      const levenshteinDistance = distance(submitted, correct);
      const similarity = 1 - (levenshteinDistance / maxLength);
      
      return similarity >= 0.99; // Ultra-strict fallback - must be 99% similar
    }
  }

  /**
   * Process text using node-nlp for language detection, normalization, and stemming
   */
  private async processTextWithNLP(text: string): Promise<{
    language: string;
    normalized: string;
    stemmed: string;
    tokens: string[];
  }> {
    try {
      // Use node-nlp to process the text
      const result = await this.nlp.process('en', text);
      
      // Extract tokens and their properties
      const tokens = result.tokens || [];
      const normalizedTokens = tokens.map((token: any) => token.normalized || token.lemma || token.stem || token.text);
      const stemmedTokens = tokens.map((token: any) => token.stem || token.lemma || token.normalized || token.text);
      
      return {
        language: result.language || 'en',
        normalized: normalizedTokens.join(' ').toLowerCase(),
        stemmed: stemmedTokens.join(' ').toLowerCase(),
        tokens: tokens.map((token: any) => token.text)
      };
    } catch (error) {
      // Fallback processing
      return {
        language: 'en',
        normalized: text.toLowerCase(),
        stemmed: text.toLowerCase(),
        tokens: text.split(/\s+/)
      };
    }
  }

  /**
   * Jaro-Winkler distance implementation
   */
  private jaroWinklerDistance(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
    if (matchWindow < 0) return 0.0;

    const str1Matches = new Array(str1.length).fill(false);
    const str2Matches = new Array(str2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < str1.length; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, str2.length);

      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    // Find transpositions
    let k = 0;
    for (let i = 0; i < str1.length; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }

    const jaroDistance = (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3;

    // Winkler modification
    let prefixLength = 0;
    const maxPrefixLength = Math.min(4, Math.min(str1.length, str2.length));
    
    for (let i = 0; i < maxPrefixLength; i++) {
      if (str1[i] === str2[i]) {
        prefixLength++;
      } else {
        break;
      }
    }

    const winklerWeight = 0.1;
    return jaroDistance + prefixLength * winklerWeight * (1 - jaroDistance);
  }
}
