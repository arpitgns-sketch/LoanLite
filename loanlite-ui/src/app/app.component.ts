import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';

/** Root component: routed views + the global toast stack. */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    <router-outlet />
    <ll-toast />
  `,
})
export class AppComponent {}
