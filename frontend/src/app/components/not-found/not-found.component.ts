import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-card">
        <div class="illustration">
          <mat-icon aria-hidden="true">sentiment_dissatisfied</mat-icon>
          <span class="error-code">404</span>
        </div>

        <h1>Página no encontrada</h1>
        <p>La dirección que buscas no existe o ha sido movida.</p>

        <a mat-flat-button color="primary" routerLink="/dashboard">
          <mat-icon>arrow_back</mat-icon>
          Volver al panel
        </a>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 70vh;
      padding: 24px;
      text-align: center;
    }

    .not-found-card {
      max-width: 420px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;

      h1 {
        margin: 16px 0 8px 0;
        font-size: 1.75rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      p {
        margin: 0 0 24px 0;
        color: var(--text-secondary);
        font-size: 0.95rem;
        line-height: 1.5;
      }

      a[mat-flat-button] {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 0 24px;
        height: 44px;
      }
    }

    .illustration {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--text-muted, #9e9e9e);
      }
    }

    .error-code {
      font-size: 3.5rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: var(--primary);
      line-height: 1;
    }
  `],
})
export class NotFoundComponent {}