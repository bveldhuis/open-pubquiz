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
  team?: {
    id: string;
    name: string;
  };
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
    <div class="answer-review" *ngIf="question">
      <div class="review-header">
        <h2>Question {{ question.question_number }}: {{ question.question_text }}</h2>
        <div class="question-summary">
          <span class="question-type">{{ getQuestionTypeLabel(question.type) }}</span>
          <span class="points">{{ question.points }} point{{ question.points !== 1 ? 's' : '' }}</span>
        </div>
      </div>

      <!-- Show correct answer for reference -->
      <div class="correct-answer-reference" *ngIf="question.correct_answer">
        <mat-icon>check_circle</mat-icon>
        <span><strong>Correct Answer:</strong> {{ getFormattedCorrectAnswer() }}</span>
      </div>

      <div class="answers-section">
        <h3>Team Answers ({{ answers.length }})</h3>
        
        <!-- Loading state -->
        <div class="loading-state" *ngIf="isLoading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading answers...</p>
        </div>
        
        <!-- No answers state -->
        <div class="no-answers" *ngIf="!isLoading && answers.length === 0">
          <mat-icon>info</mat-icon>
          <p>No answers received for this question yet.</p>
        </div>
        
        <div class="answers-list" *ngIf="!isLoading && answers.length > 0">
          <div class="answer-item" *ngFor="let answer of answers">
            <div class="answer-header">
              <div class="team-info">
                <mat-icon>group</mat-icon>
                <span class="team-name">{{ answer.team?.name || 'Unknown Team' }}</span>
              </div>
              
              <div class="answer-status">
                <!-- Manual scoring display -->
                <div class="manual-scoring-display" *ngIf="editingAnswerId === answer.id">
                  <mat-form-field appearance="outline" class="points-input">
                    <mat-label>Points</mat-label>
                    <input 
                      matInput 
                      type="number" 
                      [min]="0" 
                      [max]="question.points" 
                      [(ngModel)]="editingPoints"
                      (keyup.enter)="saveManualScore(answer.id)"
                      (blur)="saveManualScore(answer.id)">
                    <mat-hint>/ {{ question.points }} max</mat-hint>
                  </mat-form-field>
                  <button 
                    mat-icon-button 
                    color="primary" 
                    (click)="saveManualScore(answer.id)"
                    matTooltip="Save points">
                    <mat-icon>check</mat-icon>
                  </button>
                  <button 
                    mat-icon-button 
                    color="warn" 
                    (click)="cancelManualScore()"
                    matTooltip="Cancel">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                
                <!-- Regular points display -->
                <div class="points-display-container" *ngIf="editingAnswerId !== answer.id">
                  <span class="points-display" [class.correct]="answer.is_correct" [class.incorrect]="answer.is_correct === false">
                    {{ answer.points_awarded }} / {{ question.points }} pts
                  </span>
                  <button 
                    mat-icon-button 
                    color="accent" 
                    (click)="startManualScore(answer)"
                    matTooltip="Edit points manually"
                    class="edit-points-btn">
                    <mat-icon>edit</mat-icon>
                  </button>
                </div>
                
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

              <!-- Quick scoring buttons for open text questions -->
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

              <!-- Auto-scored questions with manual override option -->
              <div class="auto-scored" *ngIf="question.type === 'multiple_choice'">
                <span class="auto-label">Auto-scored</span>
                <span class="result" [class.correct]="answer.is_correct" [class.incorrect]="answer.is_correct === false">
                  {{ answer.is_correct ? 'Correct' : 'Incorrect' }}
                </span>
                <button 
                  mat-stroked-button 
                  color="accent" 
                  (click)="startManualScore(answer)"
                  class="override-btn">
                  <mat-icon>edit</mat-icon>
                  Override Score
                </button>
              </div>

              <!-- Sequence questions with manual override option -->
              <div class="auto-scored" *ngIf="question.type === 'sequence'">
                <span class="auto-label">Auto-scored</span>
                <span class="result" [class.correct]="answer.is_correct" [class.incorrect]="answer.is_correct === false">
                  {{ getSequenceResultText(answer) }}
                </span>
                <button 
                  mat-stroked-button 
                  color="accent" 
                  (click)="startManualScore(answer)"
                  class="override-btn">
                  <mat-icon>edit</mat-icon>
                  Override Score
                </button>
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
          [disabled]="hasUnscoredAnswers"
          *ngIf="isLastQuestion">
          <mat-icon>leaderboard</mat-icon>
          Show Leaderboard
        </button>
        
        <button 
          mat-raised-button 
          color="accent" 
          (click)="nextQuestion.emit()"
          [disabled]="hasUnscoredAnswers"
          *ngIf="!isLastQuestion">
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

    .correct-answer-reference {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #e8f5e8;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #4caf50;
    }

    .correct-answer-reference mat-icon {
      color: #4caf50;
    }

    .correct-answer-reference span {
      color: #2e7d32;
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

    .loading-state,
    .no-answers {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 40px 20px;
      background: #f8f9fa;
      border-radius: 8px;
      text-align: center;
    }

    .loading-state p,
    .no-answers p {
      margin: 0;
      color: #666;
      font-size: 1rem;
    }

    .no-answers mat-icon {
      font-size: 48px;
      color: #ccc;
      width: 48px;
      height: 48px;
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

    .points-display-container {
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

    .edit-points-btn {
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .edit-points-btn:hover {
      opacity: 1;
    }

    .manual-scoring-display {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fff3e0;
      padding: 8px;
      border-radius: 6px;
      border: 2px solid #ff9800;
    }

    .points-input {
      width: 80px;
      margin: 0;
    }

    .points-input ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
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
      flex-wrap: wrap;
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

    .override-btn {
      font-size: 0.8rem;
      padding: 4px 8px;
      min-width: auto;
    }

    .override-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
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

      .manual-scoring-display {
        flex-direction: column;
        align-items: stretch;
      }

      .points-input {
        width: 100%;
      }

      .auto-scored {
        flex-direction: column;
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
    if (!this.question?.correct_answer) return '';
    
    // For sequence questions, replace pipes with arrows
    if (this.question.type === 'sequence') {
      return this.question.correct_answer.replace(/\|/g, ' → ');
    }
    
    return this.question.correct_answer;
  }
}
