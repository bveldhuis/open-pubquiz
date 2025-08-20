import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Team } from './quiz.service';

export interface UserSession {
  teamId: string;
  teamName: string;
  sessionCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserSession | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Load user session from localStorage on init
    this.loadUserSession();
  }

  private loadUserSession(): void {
    const sessionData = localStorage.getItem('userSession');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        this.currentUserSubject.next(session);
      } catch (error) {
        console.error('Error loading user session:', error);
        this.clearUserSession();
      }
    }
  }

  setUserSession(session: UserSession): void {
    localStorage.setItem('userSession', JSON.stringify(session));
    this.currentUserSubject.next(session);
  }

  clearUserSession(): void {
    localStorage.removeItem('userSession');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): UserSession | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getTeamId(): string | null {
    return this.currentUserSubject.value?.teamId || null;
  }

  getTeamName(): string | null {
    return this.currentUserSubject.value?.teamName || null;
  }

  getSessionCode(): string | null {
    return this.currentUserSubject.value?.sessionCode || null;
  }
}
