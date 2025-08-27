import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { PWAService } from '../../services/pwa.service';
import { 
  fadeInUp, 
  slideInFromRight, 
  scaleIn, 
  buttonPress,
  cardHover,
  errorShake,
  successPop
} from '../../utils/animations';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './join.component.html',
  styleUrl: './join.component.scss',
  animations: [
    fadeInUp,
    slideInFromRight,
    scaleIn,
    buttonPress,
    cardHover,
    errorShake,
    successPop
  ]
})
export class JoinComponent implements OnInit, OnDestroy {
  @ViewChild('sessionCodeInput', { static: false }) sessionCodeInput!: ElementRef;
  @ViewChild('teamNameInput', { static: false }) teamNameInput!: ElementRef;

  private authService = inject(AuthService);
  private socketService = inject(SocketService);
  private pwaService = inject(PWAService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  private destroy$ = new Subject<void>();
  
  // Form and state
  joinForm!: FormGroup;
  isJoining = false;
  
  // Animation states
  buttonStates: Record<string, string> = {};
  cardStates: Record<string, string> = {};
  formStates: Record<string, string> = {};
  feedbackState = '';
  
  // Touch and accessibility
  isTouchDevice = false;
  isReducedMotion = false;
  
  // PWA and sharing
  showInstallPrompt = false;
  canShare = false;

  constructor() {
    this.detectDeviceCapabilities();
    this.checkAccessibilityPreferences();
    this.initializeAnimationStates();
    this.initializeForm();
    this.checkSharingCapabilities();
  }

  ngOnInit(): void {
    this.setupPWAHandling();
    this.checkUrlParameters();
    this.focusFirstInput();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private detectDeviceCapabilities(): void {
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (this.isTouchDevice) {
      document.body.classList.add('touch-device');
    }
  }

  private checkAccessibilityPreferences(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.isReducedMotion = true;
      document.body.classList.add('reduced-motion');
    }
  }

  private initializeAnimationStates(): void {
    this.buttonStates = {
      join: 'unpressed',
      scan: 'unpressed',
      install: 'unpressed'
    };
    this.cardStates = {
      main: 'normal',
      features: 'normal'
    };
    this.formStates = {
      sessionCode: 'normal',
      teamName: 'normal'
    };
  }

  private initializeForm(): void {
    this.joinForm = this.fb.group({
      sessionCode: ['', [
        Validators.required, 
        Validators.minLength(4),
        Validators.maxLength(10),
        Validators.pattern(/^[A-Z0-9]+$/)
      ]],
      teamName: ['', [
        Validators.required, 
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z0-9\s\-_]+$/)
      ]]
    });

    // Real-time validation feedback
    this.setupFormValidation();
  }

  private setupFormValidation(): void {
    this.joinForm.get('sessionCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateFieldState('sessionCode');
      });

    this.joinForm.get('teamName')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateFieldState('teamName');
      });
  }

  private updateFieldState(fieldName: string): void {
    const field = this.joinForm.get(fieldName);
    if (field) {
      if (field.invalid && field.touched) {
        this.formStates[fieldName] = 'error';
      } else if (field.valid && field.value) {
        this.formStates[fieldName] = 'success';
      } else {
        this.formStates[fieldName] = 'normal';
      }
    }
  }

  private checkSharingCapabilities(): void {
    this.canShare = 'navigator' in window && 'share' in navigator;
  }

  private setupPWAHandling(): void {
    // Request notification permission
    this.pwaService.requestNotificationPermission()
      .then(granted => {
        if (granted) {
          console.log('Notifications enabled for participant');
        }
      });

    // Check if PWA install is available
    this.pwaService.isInstallable$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isInstallable => {
        this.showInstallPrompt = isInstallable && !this.isReducedMotion;
      });
  }

  private checkUrlParameters(): void {
    // Check for shared session code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const sharedCode = urlParams.get('code') || urlParams.get('session');
    
    if (sharedCode) {
      this.joinForm.patchValue({ sessionCode: sharedCode.toUpperCase() });
      this.showSuccessFeedback('Session code loaded from link!');
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Focus team name input
      setTimeout(() => {
        if (this.teamNameInput) {
          this.teamNameInput.nativeElement.focus();
        }
      }, 500);
    }
  }

  private focusFirstInput(): void {
    setTimeout(() => {
      if (this.sessionCodeInput && !this.joinForm.get('sessionCode')?.value) {
        this.sessionCodeInput.nativeElement.focus();
      } else if (this.teamNameInput && !this.joinForm.get('teamName')?.value) {
        this.teamNameInput.nativeElement.focus();
      }
    }, 300);
  }

  // Enhanced user interactions with animations
  async joinSession(): Promise<void> {
    if (!this.joinForm.valid) {
      this.markFormGroupTouched();
      this.showErrorFeedback('Please fill out all fields correctly');
      this.shakeInvalidFields();
      return;
    }

    this.buttonStates['join'] = 'pressed';
    this.isJoining = true;
    this.feedbackState = 'loading';

    const { sessionCode, teamName } = this.joinForm.value;

    try {
      // Clean and format inputs
      const cleanSessionCode = sessionCode.toUpperCase().trim();
      const cleanTeamName = teamName.trim();

      console.log('About to call authService.joinSession with:', cleanSessionCode, cleanTeamName);

      // Validate with auth service
      const result = await this.authService.joinSession(cleanSessionCode, cleanTeamName);
      
      console.log('authService.joinSession result:', result);
      
      if (result.success) {
        this.feedbackState = 'success';
        this.showSuccessFeedback(`Welcome ${cleanTeamName}! Joining session...`);
        
        // Haptic feedback for mobile
        if (this.isTouchDevice && 'vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }

        // PWA notification - handle gracefully on mobile
        try {
          // Check notification support first
          const notificationSupport = await this.pwaService.checkNotificationSupport();
          console.log('Notification support check:', notificationSupport);
          
          if (notificationSupport.supported && notificationSupport.permission === 'granted') {
            console.log('Attempting to show notification...');
            await this.pwaService.showNotification('Joined Quiz Session!', {
              body: `Welcome to session ${cleanSessionCode}. Good luck!`
            });
            console.log('Notification shown successfully');
          } else if (notificationSupport.mobile) {
            // On mobile, don't show notification if not supported or permission denied
            console.log('Skipping notification on mobile device - not supported or permission denied');
          }
        } catch (notificationError) {
          // Silently handle notification errors - they shouldn't break the join flow
          console.warn('Notification failed, but continuing with join process:', notificationError);
        }

        // Brief delay for success animation
        setTimeout(() => {
          console.log('Navigating to participant component...');
          this.router.navigate(['/participant']).then(() => {
            console.log('Navigation to participant completed');
          }).catch((error) => {
            console.error('Navigation to participant failed:', error);
            // Fallback: try to navigate again
            setTimeout(() => {
              console.log('Retrying navigation to participant...');
              this.router.navigate(['/participant']).then(() => {
                console.log('Retry navigation successful');
              }).catch((retryError) => {
                console.error('Retry navigation also failed:', retryError);
                this.showErrorFeedback('Failed to navigate to participant view. Please try refreshing the page.');
              });
            }, 500);
          });
        }, 1000);
        
      } else {
        throw new Error(result.error || 'Failed to join session');
      }
      
    } catch (error: unknown) {
      this.feedbackState = 'error';
      const errorMessage = (error instanceof Error ? error.message : 'Failed to join session. Please check your session code and try again.');
      this.showErrorFeedback(errorMessage);
      
      // Error haptic feedback
      if (this.isTouchDevice && 'vibrate' in navigator) {
        navigator.vibrate([50, 50, 50]);
      }
      
    } finally {
      this.isJoining = false;
      setTimeout(() => {
        this.buttonStates['join'] = 'unpressed';
        this.feedbackState = '';
      }, 1000);
    }
  }

  async scanQRCode(): Promise<void> {
    this.buttonStates['scan'] = 'pressed';
    
    try {
      if ('BarcodeDetector' in window) {
        // Use native Barcode Detection API if available
        await this.scanWithNativeAPI();
      } else {
        // Fallback to camera access
        await this.scanWithCamera();
      }
    } catch {
      this.showErrorFeedback('QR code scanning is not available on this device');
    } finally {
      setTimeout(() => {
        this.buttonStates['scan'] = 'unpressed';
      }, 200);
    }
  }

  private async scanWithNativeAPI(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['qr_code']
      });
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      video.addEventListener('loadedmetadata', async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const barcodes = await barcodeDetector.detect(canvas);
          
          if (barcodes.length > 0) {
            const qrValue = barcodes[0].rawValue;
            this.processQRCode(qrValue);
          }
        }
        
        stream.getTracks().forEach(track => track.stop());
      });
      
    } catch (error) {
      console.error('Native barcode detection failed:', error);
      throw error;
    }
  }

  private async scanWithCamera(): Promise<void> {
    this.showInfoMessage('QR code scanning requires camera access. Please allow camera permissions.');
    // Note: In a real implementation, you would integrate with a QR code scanning library
    // For now, we'll show a placeholder message
    throw new Error('QR scanning not implemented');
  }

  private processQRCode(qrValue: string): void {
    try {
      // Try to extract session code from QR value
      let sessionCode = '';
      
      if (qrValue.includes('session=') || qrValue.includes('code=')) {
        const url = new URL(qrValue);
        sessionCode = url.searchParams.get('session') || url.searchParams.get('code') || '';
      } else if (qrValue.match(/^[A-Z0-9]{4,10}$/)) {
        sessionCode = qrValue;
      }
      
      if (sessionCode) {
        this.joinForm.patchValue({ sessionCode: sessionCode.toUpperCase() });
        this.showSuccessFeedback('Session code scanned successfully!');
        
        // Focus team name input
        setTimeout(() => {
          if (this.teamNameInput) {
            this.teamNameInput.nativeElement.focus();
          }
        }, 500);
      } else {
        this.showErrorFeedback('Invalid QR code. Please scan a valid session QR code.');
      }
      
    } catch {
      this.showErrorFeedback('Failed to process QR code');
    }
  }

  async installPWA(): Promise<void> {
    this.buttonStates['install'] = 'pressed';
    
    try {
      const installed = await this.pwaService.installPWA();
      
      if (installed) {
        this.showSuccessFeedback('🎉 App installed successfully!');
        this.showInstallPrompt = false;
      }
    } catch {
      this.showErrorFeedback('Installation failed. Please try again.');
    } finally {
      setTimeout(() => {
        this.buttonStates['install'] = 'unpressed';
      }, 200);
    }
  }

  async shareSession(): Promise<void> {
    if (!this.canShare) {
      this.copySessionLink();
      return;
    }

    const sessionCode = this.joinForm.get('sessionCode')?.value;
    if (!sessionCode) {
      this.showErrorFeedback('Please enter a session code first');
      return;
    }

    try {
      await navigator.share({
        title: 'Join my Quiz Session!',
        text: `Join my quiz session with code: ${sessionCode}`,
        url: `${window.location.origin}/join?code=${sessionCode}`
      });
      
      this.showSuccessFeedback('Session shared successfully!');
    } catch {
      this.copySessionLink();
    }
  }

  private copySessionLink(): void {
    const sessionCode = this.joinForm.get('sessionCode')?.value;
    if (!sessionCode) {
      this.showErrorFeedback('Please enter a session code first');
      return;
    }

    const link = `${window.location.origin}/join?code=${sessionCode}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        this.showSuccessFeedback('Link copied to clipboard!');
      }).catch(() => {
        this.fallbackCopyText(link);
      });
    } else {
      this.fallbackCopyText(link);
    }
  }

  private fallbackCopyText(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.showSuccessFeedback('Link copied to clipboard!');
    } catch {
      this.showErrorFeedback('Failed to copy link');
    } finally {
      document.body.removeChild(textArea);
    }
  }

  // Form validation helpers
  private markFormGroupTouched(): void {
    Object.keys(this.joinForm.controls).forEach(key => {
      const control = this.joinForm.get(key);
      if (control) {
        control.markAsTouched();
        this.updateFieldState(key);
      }
    });
  }

  private shakeInvalidFields(): void {
    Object.keys(this.joinForm.controls).forEach(key => {
      const control = this.joinForm.get(key);
      if (control && control.invalid) {
        this.formStates[key] = 'error';
      }
    });
  }

  // Input formatters
  onSessionCodeInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    let value = target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Limit length
    if (value.length > 10) {
      value = value.substring(0, 10);
    }
    
    this.joinForm.patchValue({ sessionCode: value });
  }

  onTeamNameInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    let value = target.value.replace(/[^a-zA-Z0-9\s\-_]/g, '');
    
    // Limit length
    if (value.length > 50) {
      value = value.substring(0, 50);
    }
    
    this.joinForm.patchValue({ teamName: value });
  }

  // Feedback methods with animations
  private showSuccessFeedback(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorFeedback(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showInfoMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      panelClass: ['info-snackbar']
    });
  }

  // Touch event handlers
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (this.isTouchDevice) {
      const target = event.target as HTMLElement;
      if (target.classList.contains('touch-friendly')) {
        target.classList.add('touch-active');
      }
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (this.isTouchDevice) {
      const target = event.target as HTMLElement;
      setTimeout(() => {
        target.classList.remove('touch-active');
      }, 150);
    }
  }

  // Keyboard navigation support
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Enter to submit form
    if (event.key === 'Enter' && this.joinForm.valid) {
      event.preventDefault();
      this.joinSession();
    }
    
    // Tab navigation enhancement
    if (event.key === 'Tab') {
      // Allow natural tab flow
    }
  }

  // Card hover animations
  onCardHover(cardId: string, isHovered: boolean): void {
    if (!this.isReducedMotion) {
      this.cardStates[cardId] = isHovered ? 'hovered' : 'normal';
    }
  }

  // Utility getters
  get sessionCodeError(): string {
    const control = this.joinForm.get('sessionCode');
    if (control?.touched && control.invalid) {
      if (control.errors?.['required']) return 'Session code is required';
      if (control.errors?.['minlength']) return 'Session code must be at least 4 characters';
      if (control.errors?.['pattern']) return 'Session code must contain only letters and numbers';
    }
    return '';
  }

  get teamNameError(): string {
    const control = this.joinForm.get('teamName');
    if (control?.touched && control.invalid) {
      if (control.errors?.['required']) return 'Team name is required';
      if (control.errors?.['minlength']) return 'Team name must be at least 2 characters';
      if (control.errors?.['maxlength']) return 'Team name must be less than 50 characters';
      if (control.errors?.['pattern']) return 'Team name contains invalid characters';
    }
    return '';
  }

  get canJoin(): boolean {
    return this.joinForm.valid && !this.isJoining;
  }
}
