import { trigger, state, style, transition, animate, keyframes, query, stagger, group } from '@angular/animations';

// Page transition animations
export const slideInFromRight = trigger('slideInFromRight', [
  transition(':enter', [
    style({ transform: 'translateX(100%)', opacity: 0 }),
    animate('300ms ease-in', style({ transform: 'translateX(0%)', opacity: 1 }))
  ])
]);

export const slideInFromLeft = trigger('slideInFromLeft', [
  transition(':enter', [
    style({ transform: 'translateX(-100%)', opacity: 0 }),
    animate('300ms ease-in', style({ transform: 'translateX(0%)', opacity: 1 }))
  ])
]);

export const fadeInUp = trigger('fadeInUp', [
  transition(':enter', [
    style({ transform: 'translateY(30px)', opacity: 0 }),
    animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
  ])
]);

export const fadeInDown = trigger('fadeInDown', [
  transition(':enter', [
    style({ transform: 'translateY(-30px)', opacity: 0 }),
    animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
  ])
]);

export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('250ms ease-in', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate('250ms ease-out', style({ opacity: 0 }))
  ])
]);

export const scaleIn = trigger('scaleIn', [
  transition(':enter', [
    style({ transform: 'scale(0.8)', opacity: 0 }),
    animate('200ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
  ])
]);

// Staggered animations for lists
export const staggeredFadeIn = trigger('staggeredFadeIn', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      stagger(100, [
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ], { optional: true })
  ])
]);

export const listAnimation = trigger('listAnimation', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateX(-20px)' }),
      stagger(50, animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })))
    ], { optional: true }),
    query(':leave', [
      stagger(50, animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(20px)' })))
    ], { optional: true })
  ])
]);

// Button and interactive animations
export const buttonPress = trigger('buttonPress', [
  state('pressed', style({ transform: 'scale(0.95)' })),
  state('unpressed', style({ transform: 'scale(1)' })),
  transition('unpressed => pressed', animate('50ms ease-in')),
  transition('pressed => unpressed', animate('50ms ease-out'))
]);

export const cardHover = trigger('cardHover', [
  state('normal', style({ transform: 'translateY(0)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' })),
  state('hovered', style({ transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' })),
  transition('normal <=> hovered', animate('200ms ease-out'))
]);

// Loading animations
export const pulse = trigger('pulse', [
  transition('* => *', [
    animate('1.5s ease-in-out', keyframes([
      style({ opacity: 1, offset: 0 }),
      style({ opacity: 0.5, offset: 0.5 }),
      style({ opacity: 1, offset: 1 })
    ]))
  ])
]);

export const spin = trigger('spin', [
  transition('* => *', [
    animate('1s linear', keyframes([
      style({ transform: 'rotate(0deg)', offset: 0 }),
      style({ transform: 'rotate(360deg)', offset: 1 })
    ]))
  ])
]);

export const bounce = trigger('bounce', [
  transition('* => *', [
    animate('600ms ease-in-out', keyframes([
      style({ transform: 'scale(1)', offset: 0 }),
      style({ transform: 'scale(1.1)', offset: 0.3 }),
      style({ transform: 'scale(0.9)', offset: 0.6 }),
      style({ transform: 'scale(1)', offset: 1 })
    ]))
  ])
]);

// Timer animations
export const timerPulse = trigger('timerPulse', [
  state('normal', style({ transform: 'scale(1)' })),
  state('warning', style({ 
    transform: 'scale(1.05)', 
    color: '#ff9800',
    animation: 'pulse 1s infinite ease-in-out'
  })),
  state('danger', style({ 
    transform: 'scale(1.1)', 
    color: '#f44336',
    animation: 'pulse 0.5s infinite ease-in-out'
  })),
  transition('normal => warning', animate('200ms ease-out')),
  transition('warning => danger', animate('150ms ease-out')),
  transition('* => normal', animate('300ms ease-out'))
]);

// Question transition animations
export const questionSlide = trigger('questionSlide', [
  transition(':enter', [
    group([
      style({ transform: 'translateX(100%)', opacity: 0 }),
      animate('400ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
    ])
  ]),
  transition(':leave', [
    group([
      animate('300ms ease-in', style({ transform: 'translateX(-100%)', opacity: 0 }))
    ])
  ])
]);

// Modal and dialog animations
export const modalSlideIn = trigger('modalSlideIn', [
  transition(':enter', [
    style({ transform: 'translateY(-100px)', opacity: 0 }),
    animate('300ms cubic-bezier(0.35, 0, 0.25, 1)', style({ transform: 'translateY(0)', opacity: 1 }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ transform: 'translateY(-50px)', opacity: 0 }))
  ])
]);

export const backdropFade = trigger('backdropFade', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('200ms ease-out', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ opacity: 0 }))
  ])
]);

// Notification animations
export const slideInRight = trigger('slideInRight', [
  transition(':enter', [
    style({ transform: 'translateX(100%)', opacity: 0 }),
    animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ transform: 'translateX(0)', opacity: 1 }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
  ])
]);

// Success/Error feedback animations
export const successPop = trigger('successPop', [
  transition(':enter', [
    style({ transform: 'scale(0)', opacity: 0 }),
    animate('400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', style({ transform: 'scale(1)', opacity: 1 }))
  ])
]);

export const errorShake = trigger('errorShake', [
  transition('* => *', [
    animate('600ms ease-in-out', keyframes([
      style({ transform: 'translateX(0)', offset: 0 }),
      style({ transform: 'translateX(-10px)', offset: 0.1 }),
      style({ transform: 'translateX(10px)', offset: 0.2 }),
      style({ transform: 'translateX(-10px)', offset: 0.3 }),
      style({ transform: 'translateX(10px)', offset: 0.4 }),
      style({ transform: 'translateX(-10px)', offset: 0.5 }),
      style({ transform: 'translateX(10px)', offset: 0.6 }),
      style({ transform: 'translateX(-10px)', offset: 0.7 }),
      style({ transform: 'translateX(10px)', offset: 0.8 }),
      style({ transform: 'translateX(0)', offset: 1 })
    ]))
  ])
]);

// Page route animations
export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%'
      })
    ], { optional: true }),
    query(':enter', [
      style({ transform: 'translateX(100%)' })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(-100%)' }))
      ], { optional: true }),
      query(':enter', [
        animate('300ms ease-out', style({ transform: 'translateX(0%)' }))
      ], { optional: true })
    ])
  ])
]);

// Custom easing functions
export const customEasing = {
  easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  easeInOutQuart: 'cubic-bezier(0.77, 0, 0.175, 1)',
  easeInOutQuint: 'cubic-bezier(0.86, 0, 0.07, 1)',
  easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  easeInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
};

// Helper function to create custom animations
export function createSlideAnimation(direction: 'up' | 'down' | 'left' | 'right', distance = '100%') {
  const transforms: Record<string, string> = {
    up: `translateY(-${distance})`,
    down: `translateY(${distance})`,
    left: `translateX(-${distance})`,
    right: `translateX(${distance})`
  };

  return trigger(`slide${direction.charAt(0).toUpperCase() + direction.slice(1)}`, [
    transition(':enter', [
      style({ transform: transforms[direction], opacity: 0 }),
      animate('300ms ease-out', style({ transform: 'translate(0)', opacity: 1 }))
    ]),
    transition(':leave', [
      animate('200ms ease-in', style({ transform: transforms[direction], opacity: 0 }))
    ])
  ]);
}

// Animation states for various UI elements
export const animationStates = {
  loading: 'loading',
  success: 'success',
  error: 'error',
  idle: 'idle',
  active: 'active',
  disabled: 'disabled'
};