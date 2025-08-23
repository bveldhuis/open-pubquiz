import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PWAService } from '../../services/pwa.service';
import { 
  fadeInUp, 
  staggeredFadeIn, 
  scaleIn, 
  cardHover, 
  buttonPress,
  slideInRight 
} from '../../utils/animations';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  animations: [
    fadeInUp,
    staggeredFadeIn,
    scaleIn,
    cardHover,
    buttonPress,
    slideInRight
  ]
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('heroSection', { static: false }) heroSection!: ElementRef;
  
  private destroy$ = new Subject<void>();
  
  // Animation states
  buttonStates: Record<string, string> = {};
  cardStates: Record<string, string> = {};
  
  // PWA states
  isInstallable$: Observable<boolean>;
  isInstalled$: Observable<boolean>;
  showInstallPrompt = false;
  
  // Touch and interaction states
  isTouchDevice = false;
  isReducedMotion = false;
  
  // Feature data for animations
  features = [
    {
      icon: 'sync',
      title: 'Real-time Updates',
      description: 'Live question updates, timers, and leaderboards via Socket.IO',
      id: 'realtime'
    },
    {
      icon: 'quiz',
      title: '8 Question Types',
      description: 'Multiple choice, open text, sequence (drag-and-drop), true/false, numerical, image, audio, and video',
      id: 'questions'
    },
    {
      icon: 'qr_code',
      title: 'QR Code Join',
      description: 'Participants can join sessions by scanning QR codes',
      id: 'qrcode'
    },
    {
      icon: 'devices',
      title: 'Responsive Design',
      description: 'Professional UI that works on desktop, tablet, and mobile',
      id: 'responsive'
    },
    {
      icon: 'timer',
      title: 'Timer Support',
      description: 'Configurable time limits for questions with visual countdown',
      id: 'timer'
    },
    {
      icon: 'fact_check',
      title: 'Fun Facts',
      description: 'Educational tidbits displayed with each question',
      id: 'facts'
    },
    {
      icon: 'score',
      title: 'Live Scoring',
      description: 'Automatic and manual scoring with real-time leaderboards',
      id: 'scoring'
    },
    {
      icon: 'layers',
      title: 'Multi-Round Support',
      description: 'Organize questions into rounds with different themes',
      id: 'rounds'
    }
  ];
  
  steps = [
    {
      number: 1,
      title: 'Create Session',
      description: 'Presenter creates a new quiz session with custom configuration and gets a unique code',
      id: 'step1'
    },
    {
      number: 2,
      title: 'Join Session',
      description: 'Participants scan QR code or enter session code to join with their team name',
      id: 'step2'
    },
    {
      number: 3,
      title: 'Answer Questions',
      description: 'Real-time questions with timers, multiple formats, and fun facts',
      id: 'step3'
    },
    {
      number: 4,
      title: 'Review & Score',
      description: 'Review answers, manually score subjective responses, and update leaderboards',
      id: 'step4'
    },
    {
      number: 5,
      title: 'Manage Rounds',
      description: 'Organize questions into themed rounds and track overall progress',
      id: 'step5'
    },
    {
      number: 6,
      title: 'View Results',
      description: 'Live leaderboard updates and final results with team rankings',
      id: 'step6'
    }
  ];

  private router = inject(Router);
  private pwaService = inject(PWAService);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.isInstallable$ = this.pwaService.isInstallable$;
    this.isInstalled$ = this.pwaService.isInstalled$;
    
    // Initialize card and button states
    this.features.forEach(feature => {
      this.cardStates[feature.id] = 'normal';
    });
    
    this.steps.forEach(step => {
      this.cardStates[step.id] = 'normal';
    });
    
    this.buttonStates['presenter'] = 'unpressed';
    this.buttonStates['participant'] = 'unpressed';
    this.buttonStates['install'] = 'unpressed';
  }

  ngOnInit(): void {
    this.detectDeviceCapabilities();
    this.setupPWAHandling();
    this.checkAccessibilityPreferences();
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private detectDeviceCapabilities(): void {
    // Detect touch device
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Add touch class to body for CSS targeting
    if (this.isTouchDevice) {
      document.body.classList.add('touch-device');
    }
  }

  private checkAccessibilityPreferences(): void {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.isReducedMotion = true;
      document.body.classList.add('reduced-motion');
    }
  }

  private setupPWAHandling(): void {
    this.isInstallable$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isInstallable => {
        this.showInstallPrompt = isInstallable && !this.isReducedMotion;
        
        if (isInstallable) {
          setTimeout(() => {
            this.showInstallNotification();
          }, 3000); // Show after 3 seconds
        }
      });

    this.isInstalled$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isInstalled => {
        if (isInstalled) {
          this.showInstallPrompt = false;
        }
      });
  }

  private setupIntersectionObserver(): void {
    if ('IntersectionObserver' in window && !this.isReducedMotion) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '50px'
      });

      // Observe feature cards and step cards for scroll animations
      setTimeout(() => {
        const cards = document.querySelectorAll('.feature-card, .step-card, .feature-detail-card');
        cards.forEach(card => observer.observe(card));
      }, 100);
    }
  }

  private showInstallNotification(): void {
    const snackBarRef = this.snackBar.open(
      '📱 Install Open Pub Quiz for the best experience!',
      'Install',
      {
        duration: 8000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['pwa-install-snackbar']
      }
    );

    snackBarRef.onAction()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.installPWA();
      });
  }

  // Navigation methods with animations
  async goToPresenter(): Promise<void> {
    this.buttonStates['presenter'] = 'pressed';
    
    // Haptic feedback for mobile
    if (this.isTouchDevice && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Brief delay for animation
    setTimeout(() => {
      this.buttonStates['presenter'] = 'unpressed';
      this.router.navigate(['/presenter']);
    }, 100);
  }

  async goToJoin(): Promise<void> {
    this.buttonStates['participant'] = 'pressed';
    
    // Haptic feedback for mobile
    if (this.isTouchDevice && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    setTimeout(() => {
      this.buttonStates['participant'] = 'unpressed';
      this.router.navigate(['/join']);
    }, 100);
  }

  // PWA installation
  async installPWA(): Promise<void> {
    this.buttonStates['install'] = 'pressed';
    
    try {
      const installed = await this.pwaService.installPWA();
      
      if (installed) {
        this.snackBar.open('🎉 App installed successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      } else {
        this.snackBar.open('Installation cancelled or not available', 'Close', {
          duration: 3000
        });
      }
    } catch (error) {
      console.error('PWA installation error:', error);
      this.snackBar.open('Installation failed. Please try again.', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    } finally {
      setTimeout(() => {
        this.buttonStates['install'] = 'unpressed';
      }, 200);
    }
  }

  // Card hover animations
  onCardHover(cardId: string, isHovered: boolean): void {
    if (!this.isReducedMotion) {
      this.cardStates[cardId] = isHovered ? 'hovered' : 'normal';
    }
  }

  // Keyboard navigation support
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Handle Enter/Space on focused elements
    if ((event.key === 'Enter' || event.key === ' ') && event.target) {
      const target = event.target as HTMLElement;
      
      if (target.classList.contains('action-button')) {
        event.preventDefault();
        target.click();
      }
    }
    
    // Skip link navigation
    if (event.key === 'Tab' && !event.shiftKey) {
      const skipLink = document.querySelector('.skip-link') as HTMLElement;
      if (document.activeElement === document.body && skipLink) {
        skipLink.focus();
      }
    }
  }

  // Touch event handlers for better mobile experience
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (this.isTouchDevice) {
      const target = event.target as HTMLElement;
      
      // Add touch feedback to interactive elements
      if (target.classList.contains('feature-card') || 
          target.classList.contains('step-card') ||
          target.classList.contains('action-button')) {
        target.classList.add('touch-active');
      }
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (this.isTouchDevice) {
      const target = event.target as HTMLElement;
      
      // Remove touch feedback
      setTimeout(() => {
        target.classList.remove('touch-active');
      }, 150);
    }
  }

  // Scroll to section for smooth navigation
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: this.isReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    }
  }

  // Analytics and tracking
  trackFeatureInteraction(featureId: string): void {
    // Placeholder for analytics tracking
    console.log(`Feature interaction: ${featureId}`);
  }

  trackInstallPrompt(action: 'shown' | 'accepted' | 'dismissed'): void {
    // Placeholder for PWA install analytics
    console.log(`PWA install prompt: ${action}`);
  }
}
