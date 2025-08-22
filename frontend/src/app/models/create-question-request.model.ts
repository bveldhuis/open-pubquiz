export interface CreateQuestionRequest {
  sessionCode: string;
  roundNumber: number;
  questionNumber: number;
  type: 'multiple_choice' | 'open_text' | 'sequence' | 'true_false' | 'numerical' | 'image' | 'audio' | 'video';
  questionText: string;
  funFact?: string;
  timeLimit?: number;
  points?: number;
  options?: string[];
  correctAnswer?: string;
  sequenceItems?: string[];
  mediaUrl?: string;
  numericalAnswer?: number;
  numericalTolerance?: number;
}