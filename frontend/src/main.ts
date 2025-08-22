import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { QuizService } from './app/services/quiz.service';
import { QuizManagementService } from './app/services/quiz-management.service';
import { SocketService } from './app/services/socket.service';
import { AuthService } from './app/services/auth.service';

const routes = [
  { path: '', loadComponent: () => import('./app/components/home/home.component').then(m => m.HomeComponent) },
  { path: 'presenter', loadComponent: () => import('./app/components/presenter/presenter.component').then(m => m.PresenterComponent) },
  { path: 'join', loadComponent: () => import('./app/components/join/join.component').then(m => m.JoinComponent) },
  { path: 'participant', loadComponent: () => import('./app/components/participant/participant.component').then(m => m.ParticipantComponent) },
  { path: '**', redirectTo: '' }
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    QuizService,
    QuizManagementService,
    SocketService,
    AuthService
  ]
}).catch(err => console.error(err));
