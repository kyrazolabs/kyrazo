import { animate, state, style, transition, trigger } from '@angular/animations';

export const dropdownAnimation = trigger('dropdownAnimation', [
  state('void', style({
    opacity: 0,
    transform: 'scale(0.95) translateY(6px)',
    transformOrigin: 'bottom left',
    pointerEvents: 'none'
  })),
  state('*', style({
    opacity: 1,
    transform: 'scale(1) translateY(0)',
    transformOrigin: 'bottom left',
    pointerEvents: 'auto'
  })),

  transition('void => *', [
    animate('150ms cubic-bezier(0, 0, .2, 1)')
  ]),

  transition('* => void', [
    animate('120ms cubic-bezier(.4, 0, 1, 1)')
  ])
]);
