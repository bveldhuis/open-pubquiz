import { Component, Input, Output, EventEmitter, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Question } from '../../../../models/question.model';


@Component({
    selector: 'app-sequence',
    templateUrl: './sequence.component.html',
    styleUrls: ['./sequence.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatCardModule,
        MatChipsModule,
        MatButtonModule
    ]
})
export class SequenceComponent implements OnInit {
  @Input() question?: Question;
  @Input() isInteractive = false;
  @Input() shuffledItems: string[] = [];
  @Input() showCorrectAnswer = false;
  @Input() isAnswerSubmitted = false;
  
  @Output() sequenceReordered = new EventEmitter<string[]>();

  @ViewChild('sequenceContainer', { static: false }) sequenceContainer!: ElementRef;

  draggedIndex = -1;
  dragOverIndex = -1;
  
  // Touch/mobile support
  isTouchDevice = false;
  touchStartY = 0;
  touchStartX = 0;
  touchedElement: HTMLElement | null = null;
  isDragging = false;
  dragOffset = { x: 0, y: 0 };
  draggedElement: HTMLElement | null = null;
  placeholder: HTMLElement | null = null;

  ngOnInit() {
    // Initialize shuffled items if not provided
    if (this.shuffledItems.length === 0 && this.question?.sequence_items) {
      this.shuffledItems = [...this.question.sequence_items];
      this.shuffleArray(this.shuffledItems);
    }
    
    // Detect touch device
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
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

  // Touch event handlers for mobile support
  onTouchStart(event: TouchEvent, index: number) {
    if (!this.isInteractive || this.isAnswerSubmitted) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    const target = event.target as HTMLElement;
    const sequenceItem = target.closest('.sequence-item') as HTMLElement;
    
    if (sequenceItem) {
      this.isDragging = true;
      this.draggedIndex = index;
      this.touchedElement = sequenceItem;
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      
      // Calculate offset from touch point to element top-left
      const rect = sequenceItem.getBoundingClientRect();
      this.dragOffset = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
      
      // Create dragged element
      this.createDraggedElement(sequenceItem, touch.clientX, touch.clientY);
      
      // Add visual feedback
      sequenceItem.classList.add('touch-dragging');
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (!this.isDragging || !this.draggedElement) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    
    // Update dragged element position
    this.draggedElement.style.left = `${touch.clientX - this.dragOffset.x}px`;
    this.draggedElement.style.top = `${touch.clientY - this.dragOffset.y}px`;
    
    // Find element under touch point
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetItem = elementBelow?.closest('.sequence-item') as HTMLElement;
    
    if (targetItem && targetItem !== this.touchedElement) {
      const targetIndex = this.getElementIndex(targetItem);
      if (targetIndex !== -1 && targetIndex !== this.draggedIndex) {
        this.highlightDropTarget(targetIndex);
      }
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    if (!this.isDragging) return;
    
    event.preventDefault();
    const touch = event.changedTouches[0];
    
    // Find drop target
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetItem = elementBelow?.closest('.sequence-item') as HTMLElement;
    
    if (targetItem && targetItem !== this.touchedElement) {
      const targetIndex = this.getElementIndex(targetItem);
      if (targetIndex !== -1 && targetIndex !== this.draggedIndex) {
        this.reorderItems(this.draggedIndex, targetIndex);
        
        // Haptic feedback for successful drop
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    }
    
    this.cleanupDrag();
  }

  private createDraggedElement(source: HTMLElement, x: number, y: number) {
    this.draggedElement = source.cloneNode(true) as HTMLElement;
    this.draggedElement.classList.add('touch-drag-ghost');
    this.draggedElement.style.position = 'fixed';
    this.draggedElement.style.left = `${x - this.dragOffset.x}px`;
    this.draggedElement.style.top = `${y - this.dragOffset.y}px`;
    this.draggedElement.style.width = `${source.offsetWidth}px`;
    this.draggedElement.style.zIndex = '1000';
    this.draggedElement.style.pointerEvents = 'none';
    this.draggedElement.style.opacity = '0.8';
    this.draggedElement.style.transform = 'rotate(3deg)';
    
    document.body.appendChild(this.draggedElement);
  }

  private getElementIndex(element: HTMLElement): number {
    const parent = element.parentElement;
    if (!parent) return -1;
    
    const siblings = Array.from(parent.children);
    return siblings.indexOf(element);
  }

  private highlightDropTarget(index: number) {
    // Remove previous highlight
    this.clearDropTargetHighlight();
    
    // Add new highlight
    this.dragOverIndex = index;
    const items = document.querySelectorAll('.sequence-item');
    if (items[index]) {
      items[index].classList.add('touch-drag-over');
    }
  }

  private clearDropTargetHighlight() {
    this.dragOverIndex = -1;
    document.querySelectorAll('.sequence-item').forEach(item => {
      item.classList.remove('touch-drag-over');
    });
  }

  private cleanupDrag() {
    this.isDragging = false;
    this.draggedIndex = -1;
    this.touchedElement = null;
    
    // Remove dragged element
    if (this.draggedElement) {
      document.body.removeChild(this.draggedElement);
      this.draggedElement = null;
    }
    
    // Remove visual feedback
    document.querySelectorAll('.sequence-item').forEach(item => {
      item.classList.remove('touch-dragging', 'touch-drag-over');
    });
    
    this.clearDropTargetHighlight();
  }

  // Mobile-friendly reorder buttons
  moveItemUp(index: number) {
    if (index > 0) {
      this.reorderItems(index, index - 1);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  }

  moveItemDown(index: number) {
    if (index < this.shuffledItems.length - 1) {
      this.reorderItems(index, index + 1);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
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
