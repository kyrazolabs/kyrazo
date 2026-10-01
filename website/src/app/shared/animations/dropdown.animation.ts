import {
    animate,
    state,
    style,
    transition,
    trigger,
} from '@angular/animations';

export const dropdownAnimation = trigger('dropdownAnimation', [
    state(
        'void',
        style({
            opacity: 0,
            transform: 'scale(0.8)',
            transformOrigin: 'center',
            pointerEvents: 'none',
        }),
    ),
    state(
        '*',
        style({
            opacity: 1,
            transform: 'scale(1)',
            transformOrigin: 'center',
            pointerEvents: 'auto',
        }),
    ),

    transition('void => *', [animate('150ms cubic-bezier(0, 0, .2, 1)')]),

    transition('* => void', [animate('120ms cubic-bezier(.4, 0, 1, 1)')]),
]);
