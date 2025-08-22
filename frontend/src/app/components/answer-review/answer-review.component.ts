import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Question } from '../../models/question.model';
import { Answer } from '../../models/answer.model';
import { SequenceAnswer } from '../../models/sequence-answer.model';
import { QuestionUtils } from '../../utils';

@Component({
    selector: 'app-answer-review',
    templateUrl: './answer-review.component.html',
    styleUrls: ['./answer-review.component.scss'],
    standalone: false
})
export class AnswerReviewComponent {
  @Input() question?: Question;
  @Input() answers: Answer[] = [];
  @Input() isLastQuestion: boolean = false;
  @Input() isLoading: boolean = false;

  @Output() scoreAnswer = new EventEmitter<{ answerId: string; points: number; isCorrect: boolean }>();
  @Output() showLeaderboard = new EventEmitter<void>();
  @Output() nextQuestion = new EventEmitter<void>();

  // Manual scoring state
  editingAnswerId: string | null = null;
  editingPoints: number = 0;

  ngOnInit() {
    console.log('AnswerReviewComponent initialized with:', {
      question: this.question,
      answers: this.answers,
      isLastQuestion: this.isLastQuestion
    });
  }

  ngOnChanges() {
    console.log('AnswerReviewComponent changes:', {
      question: this.question,
      answers: this.answers,
      isLastQuestion: this.isLastQuestion
    });
  }

  get hasUnscoredAnswers(): boolean {
    // Only open text questions need manual scoring
    // For now, let's allow navigation even with unscored answers
    return false;
  }

  getQuestionTypeLabel(type: string): string {
    return QuestionUtils.getQuestionTypeLabel(type);
  }

  getOptionLetter(index: number): string {
    return QuestionUtils.getOptionLetter(index);
  }

  onScoreAnswer(answerId: string, points: number, isCorrect: boolean) {
    this.scoreAnswer.emit({ answerId, points, isCorrect });
  }

  onScorePartial(answerId: string) {
    // For partial scoring, award half points
    const points = Math.ceil((this.question?.points || 1) / 2);
    this.scoreAnswer.emit({ answerId, points, isCorrect: true });
  }

  startManualScore(answer: Answer) {
    this.editingAnswerId = answer.id;
    this.editingPoints = answer.points_awarded;
  }

  saveManualScore(answerId: string) {
    if (this.editingPoints < 0) {
      this.editingPoints = 0;
    }
    if (this.editingPoints > (this.question?.points || 0)) {
      this.editingPoints = this.question?.points || 0;
    }

    // Determine if the answer is correct based on points
    const isCorrect = this.editingPoints > 0;
    
    this.scoreAnswer.emit({ 
      answerId, 
      points: this.editingPoints, 
      isCorrect 
    });
    
    this.cancelManualScore();
  }

  cancelManualScore() {
    this.editingAnswerId = null;
    this.editingPoints = 0;
  }

  getSequenceResultText(answer: Answer): string {
    if (answer.is_correct === null || answer.is_correct === undefined) {
      return 'Not scored';
    }
    
    if (answer.points_awarded === this.question?.points) {
      return 'Perfect - All correct';
    } else if (answer.points_awarded === 1) {
      return 'Partial - 1 wrong';
    } else {
      return 'Incorrect';
    }
  }

  getSequenceAnswerText(answer: Answer): string {
    if (answer.sequenceAnswers && answer.sequenceAnswers.length > 0) {
      return answer.sequenceAnswers
        .sort((a: SequenceAnswer, b: SequenceAnswer) => a.position - b.position)
        .map((sa: SequenceAnswer) => sa.item_text)
        .join(' → ');
    }
    // Fallback to answer_text if sequenceAnswers not available
    return answer.answer_text.replace(/\|/g, ' → ');
  }

  getFormattedCorrectAnswer(): string {
    // For numerical questions, show the answer with tolerance
    if (this.question?.type === 'numerical') {
      if (this.question.numerical_answer !== null && this.question.numerical_answer !== undefined) {
        let result = `${this.question.numerical_answer}`;
        if (this.question.numerical_tolerance !== null && this.question.numerical_tolerance !== undefined) {
          result += ` (±${this.question.numerical_tolerance})`;
        }
        return result;
      }
      // Fallback to correct_answer if numerical_answer is not available
      return this.question.correct_answer || '';
    }
    
    // For sequence questions, replace pipes with arrows
    if (this.question?.type === 'sequence') {
      return this.question.correct_answer?.replace(/\|/g, ' → ') || '';
    }
    
    // For other question types, return correct_answer
    return this.question?.correct_answer || '';
  }

  isAutoScoredQuestion(): boolean {
    return this.question?.type === 'multiple_choice' || 
           this.question?.type === 'sequence' ||
           this.question?.type === 'true_false' ||
           this.question?.type === 'numerical' ||
           this.question?.type === 'image' ||
           this.question?.type === 'audio' ||
           this.question?.type === 'video' ||
           this.question?.type === 'open_text';
  }

  getAutoScoreResultText(answer: Answer): string {
    if (answer.is_correct === null || answer.is_correct === undefined) {
      return 'Not scored';
    }
    
    if (this.question?.type === 'sequence') {
      return this.getSequenceResultText(answer);
    }
    
    if (answer.is_correct) {
      return 'Correct';
    } else {
      return 'Incorrect';
    }
  }
}
