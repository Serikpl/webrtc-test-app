import { trigger, animate, style, transition, query, group, state, animateChild } from '@angular/animations';

let duration_content = '100ms';
let duration_popup = '300ms';

export const popupAnimation = [
  trigger('popup-content', [
    transition('void => *', [
      style({
        transform: 'translateY(-1500px)',
      }),
      animate(`${duration_popup} ease-out`)
    ]),
    transition('* => void', [
      animate(`${duration_popup} ease-out`, style({
        transform: 'translateY(-1500px)',
      }))
    ])
  ]),
  trigger('popup-close', [
    transition(':enter', [
      style({ opacity: 0 }),
      animate(`${duration_content} ease-out`),
      query('@*', animateChild())
    ]),

    transition(':leave', [
      animate(`${duration_content} ease-out`, style({ opacity: 0 })),
      query('@*', animateChild())
    ])
  ])
]
