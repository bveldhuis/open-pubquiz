import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Question } from '../../services/quiz-management.service';

export interface SequenceAnswer {
  id: string;
  answer_id: string;
  item_text: string;
  position: number;
}

export interface Answer {
  id: string;
  team_id: string;
  team_name: string;
  question_id: string;
  answer_text: string;
  is_correct?: boolean;
  points_awarded: number;
  submitted_at: string;
  sequenceAnswers?: SequenceAnswer[];
}

@Component({
  selector: 'app-answer-review',
  template: `
    <div class="answer-review" *ngIf="question && answers.length > 0">
      <div class="review-header">
        <h2>Review: Question {{ question.question_number }}</h2>
        <div class="question-summary">
          <span class="question-type">{{ getQuestionTypeLabel(question.type) }}</span>
          <span class="points">{{ question.points }} point{{ question.points !== 1 ? 's' : '' }}</span>
        </div>
      </div>

      <div class="question-display">
        <h3>{{ question.question_text }}</h3>
        
        <div class="fun-fact" *ngIf="question.fun_fact">
          <mat-icon>lightbulb</mat-icon>
          <p>{{ question.fun_fact }}</p>
        </div>

        <!-- Multiple Choice Options -->
        <div class="options" *ngIf="question.type === 'multiple_choice' && question.options">
          <div class="option" *ngFor="let option of question.options; let i = index">
            <span class="option-letter">{{ getOptionLetter(i) }}</span>
            <span class="option-text">{{ option }}</span>
            <mat-icon class="correct-answer" *ngIf="option === question.correct_answer">
              check_circle
            </mat-icon>
          </div>
        </div>

        <!-- Sequence Items -->
        <div class="sequence-items" *ngIf="question.type === 'sequence' && question.sequence_items">
          <div class="sequence-item" *ngFor="let item of question.sequence_items; let i = index">
            <span class="sequence-number">{{ i + 1 }}</span>
            <span class="sequence-text">{{ item }}</span>
          </div>
        </div>

        <!-- Correct Answer Display -->
        <div class="correct-answer-display" *ngIf="question.correct_answer">
          <h4>Correct Answer:</h4>
          <p class="answer">{{ question.correct_answer }}</p>
        </div>
      </div>

      <div class="answers-section">
        <h3>Team Answers ({{ answers.length }})</h3>
        
        <div class="answers-list">
          <div class="answer-item" *ngFor="let answer of answers">
            <div class="answer-header">
              <div class="team-info">
                <mat-icon>group</mat-icon>
                <span class="team-name">{{ answer.team_name }}</span>
              </div>
              
              <div class="answer-status">
                <span class="points-display" [class.correct]="answer.is_correct" [class.incorrect]="answer.is_correct === false">
                  {{ answer.points_awarded }} / {{ question.points }} pts
                </span>
                <mat-icon *ngIf="answer.is_correct" class="status-icon correct">check_circle</mat-icon>
                <mat-icon *ngIf="answer.is_correct === false" class="status-icon incorrect">cancel</mat-icon>
                <mat-icon *ngIf="answer.is_correct === undefined" class="status-icon pending">pending</mat-icon>
              </div>
            </div>

            <div class="answer-content">
              <div class="answer-text">
                <strong>Answer:</strong> 
                <span *ngIf="question.type === 'sequence'">{{ getSequenceAnswerText(answer) }}</span>
                <span *ngIf="question.type !== 'sequence'">{{ answer.answer_text }}</span>
              </div>

              <!-- Scoring for open text questions -->
              <div class="scoring-section" *ngIf="question.type === 'open_text' && answer.is_correct === undefined">
                <div class="scoring-controls">
                  <button 
                    mat-icon-button 
                    color="primary" 
                    (click)="onScoreAnswer(answer.id, question.points, true)"
                    matTooltip="Mark as correct">
                    <mat-icon>check_circle</mat-icon>
                  </button>
                  
                  <button 
                    mat-icon-button 
                    color="warn" 
                    (click)="onScoreAnswer(answer.id, 0, false)"
                    matTooltip="Mark as incorrect">
                    <mat-icon>cancel</mat-icon>
                  </button>
                  
                  <button 
                    mat-icon-button 
                    color="accent" 
                    (click)="onScorePartial(answer.id)"
                    matTooltip="Award partial points">
                    <mat-icon>star_half</mat-icon>
                  </button>
                </div>
              </div>

              <!-- Auto-scored questions -->
              <div class="auto-scored" *ngIf="question.type === 'multiple_choice'">
                <span class="auto-label">Auto-scored</span>
                <span class="result" [class.correct]="answer.is_correct" [class.incorrect]="answer.is_correct === false">
                  {{ answer.is_correct ? 'Correct' : 'Incorrect' }}
                </span>
              </div>

              <!-- Sequence questions - show auto-scored result -->
              <div class="auto-scored" *ngIf="question.type === 'sequence'">
                <span class="auto-label">Auto-scored</span>
                <span class="result" [class.correct]="answer.is_correct" [class.incorrect]="answer.is_correct === false">
                  {{ getSequenceResultText(answer) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="review-controls">
        <button 
          mat-raised-button 
          color="primary" 
          (click)="showLeaderboard.emit()"
          [disabled]="hasUnscoredAnswers">
          <mat-icon>leaderboard</mat-icon>
          Show Leaderboard
        </button>
        
        <button 
          mat-raised-button 
          color="accent" 
          (click)="nextQuestion.emit()"
          [disabled]="hasUnscoredAnswers">
          <mat-icon>arrow_forward</mat-icon>
          Next Question
        </button>
      </div>
    </div>
  `,
  styles: [`
    .answer-review {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e0e0e0;
    }

    .review-header h2 {
      margin: 0;
      color: #333;
      font-size: 1.8rem;
    }

    .question-summary {
      display: flex;
      gap: 10px;
    }

    .question-type {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .points {
      background: #4caf50;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .question-display {
      margin-bottom: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .question-display h3 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 1.3rem;
    }

    .fun-fact {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #fff3e0;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 15px;
      border-left: 3px solid #ff9800;
    }

    .fun-fact mat-icon {
      color: #ff9800;
      margin-top: 2px;
    }

    .fun-fact p {
      margin: 0;
      color: #e65100;
      font-style: italic;
      font-size: 0.9rem;
    }

    .options {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 15px;
    }

    .option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }

    .option-letter {
      background: #3f51b5;
      color: white;
      width: 25px;
      height: 25px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.8rem;
    }

    .option-text {
      flex: 1;
      font-size: 0.95rem;
    }

    .correct-answer {
      color: #4caf50;
    }

    .sequence-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 15px;
    }

    .sequence-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }

    .sequence-number {
      background: #ff9800;
      color: white;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.7rem;
    }

    .sequence-text {
      flex: 1;
      font-size: 0.9rem;
    }

    .correct-answer-display {
      margin-top: 15px;
      padding: 12px;
      background: #e8f5e8;
      border-radius: 6px;
      border-left: 3px solid #4caf50;
    }

    .correct-answer-display h4 {
      margin: 0 0 8px 0;
      color: #2e7d32;
      font-size: 1rem;
    }

    .answer {
      margin: 0;
      font-weight: bold;
      color: #1b5e20;
      font-size: 1rem;
    }

    .answers-section {
      margin-bottom: 30px;
    }

    .answers-section h3 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 1.4rem;
    }

    .answers-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .answer-item {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
    }

    .answer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }

    .team-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .team-name {
      font-weight: 600;
      color: #333;
    }

    .answer-status {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .points-display {
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.9rem;
    }

    .points-display.correct {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .points-display.incorrect {
      background: #ffebee;
      color: #c62828;
    }

    .status-icon {
      font-size: 1.2rem;
    }

    .status-icon.correct {
      color: #4caf50;
    }

    .status-icon.incorrect {
      color: #f44336;
    }

    .status-icon.pending {
      color: #ff9800;
    }

    .answer-content {
      padding: 15px;
    }

    .answer-text {
      margin-bottom: 15px;
      font-size: 1rem;
      line-height: 1.5;
    }

    .scoring-section {
      border-top: 1px solid #e0e0e0;
      padding-top: 15px;
    }

    .scoring-controls {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .auto-scored {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 10px;
    }

    .auto-label {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .result {
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.9rem;
    }

    .result.correct {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .result.incorrect {
      background: #ffebee;
      color: #c62828;
    }

    .review-controls {
      display: flex;
      gap: 15px;
      justify-content: center;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }

    .review-controls button {
      padding: 12px 24px;
    }

    .review-controls mat-icon {
      margin-right: 8px;
    }

    @media (max-width: 768px) {
      .answer-review {
        padding: 20px;
      }

      .review-header {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
      }

      .answer-header {
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
      }

      .review-controls {
        flex-direction: column;
      }

      .review-controls button {
        width: 100%;
      }
    }
  `]
})
export class AnswerReviewComponent {
  @Input() question?: Question;
  @Input() answers: Answer[] = [];

  @Output() scoreAnswer = new EventEmitter<{ answerId: string; points: number; isCorrect: boolean }>();
  @Output() showLeaderboard = new EventEmitter<void>();
  @Output() nextQuestion = new EventEmitter<void>();

  get hasUnscoredAnswers(): boolean {
    // Only open text questions need manual scoring
    return this.question?.type === 'open_text' && 
           this.answers.some(answer => answer.is_correct === undefined);
  }

  getQuestionTypeLabel(type: string): string {
    const labels = {
      'multiple_choice': 'Multiple Choice',
      'open_text': 'Open Text',
      'sequence': 'Sequence'
    };
    return labels[type as keyof typeof labels] || type;
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  onScoreAnswer(answerId: string, points: number, isCorrect: boolean) {
    this.scoreAnswer.emit({ answerId, points, isCorrect });
  }

  onScorePartial(answerId: string) {
    // For partial scoring, award half points
    const points = Math.ceil((this.question?.points || 1) / 2);
    this.scoreAnswer.emit({ answerId, points, isCorrect: true });
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
}
