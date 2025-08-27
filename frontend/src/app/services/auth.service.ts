import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

import { UserSession } from '../models/user-session.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
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
      console.log('Making API call to join session:', sessionCode, teamName);
      
      // Make actual API call to join session using modern Observable approach
      const response = await firstValueFrom(
        this.http.post<{ team: { id: string; name: string; totalPoints: number; joinedAt: string } }>(
          `${environment.apiUrl}/teams/join`,
          { sessionCode, teamName }
        )
      );
      
      console.log('API response received:', response);
      
      if (response && response.team) {
        // Create session data from API response
        const sessionData: UserSession = {
          teamId: response.team.id,
          teamName: response.team.name,
          sessionCode: sessionCode
        };
        
        this.setUserSession(sessionData);
        console.log('Session data set successfully');
        return { success: true };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: unknown) {
      console.error('Failed to join session:', error);
      
      // Handle specific error cases
      const httpError = error as { status?: number; error?: { error?: string } };
      if (httpError.status === 400) {
        return { 
          success: false, 
          error: httpError.error?.error || 'Invalid session code or team name'
        };
      } else if (httpError.status === 404) {
        return { 
          success: false, 
          error: 'Session not found'
        };
      } else if (httpError.status === 409) {
        return { 
          success: false, 
          error: 'Team name already exists in this session'
        };
      } else {
        return { 
          success: false, 
          error: httpError.error?.error || 'Failed to join session. Please try again.'
        };
      }
    }
  }

  getCurrentSession(): UserSession | null {
    return this.getCurrentUser();
  }

  clearSession(): void {
    this.clearUserSession();
  }
}
