import { Component, Input } from '@angular/core';

export type NavIconName =
  | 'home'
  | 'users'
  | 'briefcase'
  | 'bank'
  | 'grid'
  | 'sliders'
  | 'credit-card'
  | 'receipt'
  | 'trending-down'
  | 'bar-chart'
  | 'user-check'
  | 'logout'
  | 'menu';

@Component({
  selector: 'app-nav-icon',
  standalone: true,
  template: `
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (name) {
        @case ('home') {
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10h14V10" />
        }
        @case ('users') {
          <circle cx="9" cy="8" r="3" />
          <path d="M4 20c0-3 2.5-5 5-5s5 2 5 5" />
          <circle cx="17" cy="9" r="2.3" />
          <path d="M15.2 20c0-2.2 1.5-4 3.5-4" />
        }
        @case ('briefcase') {
          <rect x="3" y="7" width="18" height="12" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="3" y1="12" x2="21" y2="12" />
        }
        @case ('bank') {
          <path d="M3 10l9-6 9 6" />
          <path d="M4 21h16" />
          <path d="M5 21V10" />
          <path d="M10 21V10" />
          <path d="M14 21V10" />
          <path d="M19 21V10" />
        }
        @case ('grid') {
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        }
        @case ('sliders') {
          <line x1="4" y1="6" x2="20" y2="6" />
          <circle cx="9" cy="6" r="2" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <circle cx="15" cy="12" r="2" />
          <line x1="4" y1="18" x2="20" y2="18" />
          <circle cx="7" cy="18" r="2" />
        }
        @case ('credit-card') {
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        }
        @case ('receipt') {
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="9" y1="12" x2="15" y2="12" />
        }
        @case ('trending-down') {
          <polyline points="3 7 10 14 14 10 21 17" />
          <polyline points="21 10 21 17 14 17" />
        }
        @case ('bar-chart') {
          <line x1="5" y1="21" x2="5" y2="11" />
          <line x1="12" y1="21" x2="12" y2="6" />
          <line x1="19" y1="21" x2="19" y2="14" />
        }
        @case ('user-check') {
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" />
          <polyline points="16 10 18 12 22 7" />
        }
        @case ('logout') {
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="15 17 20 12 15 7" />
          <line x1="20" y1="12" x2="8" y2="12" />
        }
        @case ('menu') {
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        }
      }
    </svg>
  `,
})
export class NavIconComponent {
  @Input({ required: true }) name!: NavIconName;
}
