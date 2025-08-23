import { Injectable  } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


import { UserSession } from '../models/user-session.model';

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

  // Enhanced methods for improved components
  async joinSession(sessionCode: string, teamName: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate API call to join session
      // In a real implementation, this would call the backend API
      const sessionData: UserSession = {
        teamId: `team_${Date.now()}`, // Generate unique team ID
        teamName: teamName,
        sessionCode: sessionCode
      };
      
      this.setUserSession(sessionData);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to join session:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to join session'
      };
    }
  }

  getCurrentSession(): UserSession | null {
    return this.getCurrentUser();
  }

  clearSession(): void {
    this.clearUserSession();
  }
}
