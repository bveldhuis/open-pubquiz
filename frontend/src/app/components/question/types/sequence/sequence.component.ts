import { Component, Input, Output, EventEmitter, OnInit  } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { Question } from '../../../../models/question.model';


@Component({
    selector: 'app-sequence',
    templateUrl: './sequence.component.html',
    styleUrls: ['./sequence.component.scss'],
    standalone: true,
    imports: [
        MatIconModule,
        MatCardModule,
        MatChipsModule
    ]
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

  // Get the items to display - show correct order during review, shuffled order during interaction
  get displayItems(): string[] {
    if (this.showCorrectAnswer && this.question?.sequence_items) {
      // During review, show the correct sequence order
      return [...this.question.sequence_items];
    }
    // During interaction, show the shuffled items
    return this.shuffledItems;
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

  onDragEnd() {
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
    
    if (this.showCorrectAnswer) {
      // During review, check if the item is in the correct position in the original sequence
      return this.question.sequence_items[index] === item;
    } else {
      // During interaction, check if the item is in the correct position in the shuffled sequence
      return this.question.sequence_items[index] === item;
    }
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
