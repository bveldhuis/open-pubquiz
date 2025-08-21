import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Question } from '../../../models/question.model';

@Component({
  selector: 'app-sequence',
  template: `
    <div class="sequence-container">
      <div class="sequence-instructions" *ngIf="isInteractive">
        <mat-icon>drag_indicator</mat-icon>
        <p>Drag and drop the items to arrange them in the correct order:</p>
      </div>
      
      <div class="sequence-items">
        <div 
          class="sequence-item" 
          *ngFor="let item of shuffledItems; let i = index"
          [draggable]="isInteractive && !isAnswerSubmitted"
          (dragstart)="onDragStart($event, i)"
          (dragover)="onDragOver($event)"
          (drop)="onDrop($event, i)"
          (dragend)="onDragEnd($event)"
          [class.dragging]="draggedIndex === i"
          [class.drag-over]="dragOverIndex === i"
          [class.correct-position]="showCorrectAnswer && isCorrectPosition(i, item)"
          [class.incorrect-position]="showCorrectAnswer && !isCorrectPosition(i, item)">
          
          <div class="sequence-number">{{ i + 1 }}</div>
          <div class="sequence-content">
            <span class="sequence-text">{{ item }}</span>
          </div>
          <div class="sequence-status" *ngIf="showCorrectAnswer">
            <mat-icon *ngIf="isCorrectPosition(i, item)" class="correct-icon">
              check_circle
            </mat-icon>
            <mat-icon *ngIf="!isCorrectPosition(i, item)" class="incorrect-icon">
              cancel
            </mat-icon>
          </div>
          <mat-icon class="drag-handle" *ngIf="isInteractive && !isAnswerSubmitted">
            drag_indicator
          </mat-icon>
        </div>
      </div>

      <div class="sequence-feedback" *ngIf="showCorrectAnswer">
        <div class="feedback-message">
          <mat-icon>info</mat-icon>
          <span>{{ getFeedbackMessage() }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sequence-container {
      margin: 20px 0;
    }

    .sequence-instructions {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #e3f2fd;
      color: #1976d2;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 0.9rem;
    }

    .sequence-instructions mat-icon {
      font-size: 20px;
    }

    .sequence-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .sequence-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      cursor: grab;
      transition: all 0.2s ease;
      position: relative;
    }

    .sequence-item:active {
      cursor: grabbing;
    }

    .sequence-item.dragging {
      opacity: 0.5;
      transform: rotate(5deg);
      z-index: 1000;
    }

    .sequence-item.drag-over {
      border-color: #2196f3;
      background: #f5f9ff;
      transform: translateY(2px);
    }

    .sequence-item.correct-position {
      border-color: #4caf50;
      background: #e8f5e8;
    }

    .sequence-item.incorrect-position {
      border-color: #f44336;
      background: #ffebee;
    }

    .sequence-item:not(.dragging):hover {
      border-color: #2196f3;
      background: #f5f9ff;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(33, 150, 243, 0.15);
    }

    .sequence-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #f5f5f5;
      border-radius: 50%;
      font-weight: 600;
      font-size: 0.9rem;
      color: #666;
      flex-shrink: 0;
    }

    .sequence-item.correct-position .sequence-number {
      background: #4caf50;
      color: white;
    }

    .sequence-item.incorrect-position .sequence-number {
      background: #f44336;
      color: white;
    }

    .sequence-content {
      flex: 1;
    }

    .sequence-text {
      font-size: 1rem;
      line-height: 1.5;
    }

    .sequence-status {
      display: flex;
      align-items: center;
      margin-left: 12px;
    }

    .correct-icon {
      color: #4caf50;
      font-size: 24px;
    }

    .incorrect-icon {
      color: #f44336;
      font-size: 24px;
    }

    .drag-handle {
      color: #999;
      font-size: 20px;
      cursor: grab;
    }

    .drag-handle:active {
      cursor: grabbing;
    }

    .sequence-feedback {
      margin-top: 16px;
      padding: 12px 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .feedback-message {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      color: #666;
    }

    @media (max-width: 768px) {
      .sequence-item {
        padding: 14px 16px;
        gap: 12px;
      }

      .sequence-number {
        width: 28px;
        height: 28px;
        font-size: 0.8rem;
      }

      .sequence-text {
        font-size: 0.95rem;
      }

      .drag-handle {
        font-size: 18px;
      }
    }
  `]
})
export class SequenceComponent implements OnInit {
  @Input() question?: Question;
  @Input() isInteractive = false;
  @Input() shuffledItems: string[] = [];
  @Input() showCorrectAnswer = false;
  @Input() isAnswerSubmitted = false;
  
  @Output() sequenceReordered = new EventEmitter<string[]>();

  draggedIndex = -1;
  dragOverIndex = -1;

  ngOnInit() {
    // Initialize shuffled items if not provided
    if (this.shuffledItems.length === 0 && this.question?.sequence_items) {
      this.shuffledItems = [...this.question.sequence_items];
      this.shuffleArray(this.shuffledItems);
    }
  }

  onDragStart(event: DragEvent, index: number) {
    if (!this.isInteractive || this.isAnswerSubmitted) return;
    
    this.draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());
    }
  }

  onDragOver(event: DragEvent) {
    if (!this.isInteractive || this.isAnswerSubmitted) return;
    
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  onDrop(event: DragEvent, index: number) {
    if (!this.isInteractive || this.isAnswerSubmitted) return;
    
    event.preventDefault();
    this.dragOverIndex = -1;
    
    const draggedIndex = parseInt(event.dataTransfer!.getData('text/plain'));
    if (draggedIndex !== index) {
      this.reorderItems(draggedIndex, index);
    }
  }

  onDragEnd(event: DragEvent) {
    this.draggedIndex = -1;
    this.dragOverIndex = -1;
  }

  private reorderItems(fromIndex: number, toIndex: number) {
    const newItems = [...this.shuffledItems];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    
    this.shuffledItems = newItems;
    this.sequenceReordered.emit(newItems);
  }

  private shuffleArray(array: string[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  isCorrectPosition(index: number, item: string): boolean {
    if (!this.question?.sequence_items) return false;
    return this.question.sequence_items[index] === item;
  }

  getFeedbackMessage(): string {
    if (!this.question?.sequence_items) return '';
    
    const correctCount = this.shuffledItems.filter((item, index) => 
      this.isCorrectPosition(index, item)
    ).length;
    
    const totalCount = this.question.sequence_items.length;
    
    if (correctCount === totalCount) {
      return 'Perfect! All items are in the correct order.';
    } else if (correctCount > 0) {
      return `${correctCount} out of ${totalCount} items are in the correct position.`;
    } else {
      return 'None of the items are in the correct position.';
    }
  }

  resetOrder() {
    if (this.question?.sequence_items) {
      this.shuffledItems = [...this.question.sequence_items];
      this.shuffleArray(this.shuffledItems);
      this.sequenceReordered.emit(this.shuffledItems);
    }
  }
}
