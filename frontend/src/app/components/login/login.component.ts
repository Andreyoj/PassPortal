import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    RouterLink
  ],
  template: `
    <main class="login">
      <!-- Sección Hero/Brand -->
      <section class="login__brand">
        <img src="/images/pass-portal-mark.svg" alt="Pass Portal" class="brand-logo" />
        <p class="eyebrow">PASS PORTAL</p>
        <h1>Control migratorio proactivo</h1>
        <p class="description">Una vista clara para anticipar vencimientos, restricciones y decisiones operativas.</p>
        
        <ul class="benefits">
          <li>
            <mat-icon>notifications_active</mat-icon>
            <span>
              <strong>Alertas proactivas</strong>
              <small>Anticipa vencimientos antes de que se conviertan en problemas.</small>
            </span>
          </li>
          <li>
            <mat-icon>badge</mat-icon>
            <span>
              <strong>Fichas dinámicas</strong>
              <small>Consulta el historial esencial desde una sola vista.</small>
            </span>
          </li>
          <li>
            <mat-icon>gavel</mat-icon>
            <span>
              <strong>Obligaciones y arraigos</strong>
              <small>Da seguimiento a cada restricción con claridad.</small>
            </span>
          </li>
        </ul>
        
        <span class="login__footer">Entorno de demostración con datos ficticios</span>
      </section>

      <!-- Sección Formulario -->
      <section class="login__form">
        <div class="form-card">
          <div class="brand">
            <img src="/images/pass-portal-mark.svg" alt="" />
            <div>
              <strong>Pass Portal</strong>
              <span>Gestión migratoria</span>
            </div>
          </div>

          <h2>Iniciar sesión</h2>
          <p class="form-sub">Accede al panel de control migratorio.</p>

          <form [formGroup]="form" (ngSubmit)="entrar()">
            <mat-form-field appearance="outline" class="cream-field">
              <mat-label>Usuario*</mat-label>
              <input matInput formControlName="usuario" autocomplete="username" />
              @if (form.controls.usuario.invalid && form.controls.usuario.touched) {
                <mat-error>Ingresa tu usuario.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="cream-field">
              <mat-label>Contraseña*</mat-label>
              <input 
                matInput 
                [type]="mostrarPassword() ? 'text' : 'password'" 
                formControlName="password" 
                autocomplete="current-password" 
              />
              <button 
                mat-icon-button 
                matSuffix 
                type="button" 
                [attr.aria-label]="mostrarPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'" 
                (click)="mostrarPassword.set(!mostrarPassword())">
                <mat-icon>{{ mostrarPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.controls.password.invalid && form.controls.password.touched) {
                <mat-error>Ingresa tu contraseña.</mat-error>
              }
            </mat-form-field>

            @if (error()) {
              <div class="error" role="alert">
                <mat-icon>error</mat-icon>
                {{ error() }}
              </div>
            }

            <button mat-flat-button class="submit" type="submit" [disabled]="cargando()">
              @if (cargando()) {
                <mat-spinner diameter="20" aria-label="Iniciando sesión" />
              } @else {
                Ingresar
              }
            </button>

            <p class="help">¿Problemas para ingresar? Contacta al administrador del sistema.</p>
            <a routerLink="/register" class="link-register">Crear cuenta normal</a>
          </form>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host {
      --cream-bg: #F3EFEA;
      --cream-card: #FAF8F5;
      --text-dark: #332E2B;
      --text-muted: #7A6F68;
      --accent-wine: #72393F;
      --accent-tan: #A9927D;
      
      --font-heading: 'Plus Jakarta Sans', -apple-system, sans-serif;
      --font-body: 'Inter', -apple-system, sans-serif;
    }

    .login {
      min-height: 100dvh;
      display: grid;
      grid-template-columns: minmax(320px, 1fr) minmax(380px, 1fr);
      background-color: var(--cream-bg);
      color: var(--text-dark);
      font-family: var(--font-body);
    }

    /* Panel Izquierdo */
    .login__brand {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: clamp(40px, 8vw, 100px);
      background: linear-gradient(135deg, #EBE7E0 0%, var(--cream-bg) 60%, #E3DDD3 100%);
      border-right: 1px solid rgba(169, 146, 125, 0.15);
    }

    .brand-logo {
      width: 44px;
      height: 44px;
      margin-bottom: 24px;
    }

    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.15em;
      font-family: var(--font-heading);
      font-weight: 700;
      color: var(--accent-wine);
      margin: 0 0 16px;
      font-size: 0.75rem;
    }

    .login__brand h1 {
      font-family: var(--font-heading);
      font-size: clamp(34px, 4.5vw, 54px);
      line-height: 1.08;
      letter-spacing: -0.02em;
      max-width: 520px;
      margin: 0 0 24px;
      color: var(--text-dark);
      font-weight: 800;
    }

    .description {
      max-width: 460px;
      color: var(--text-muted);
      font-size: 1.05rem;
      line-height: 1.6;
      margin-bottom: 36px;
    }

    .benefits {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 22px;
    }

    .benefits li {
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }

    .benefits mat-icon {
      color: var(--accent-wine);
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-top: 2px;
    }

    .benefits strong {
      display: block;
      color: var(--text-dark);
      font-size: 0.95rem;
      font-weight: 600;
      font-family: var(--font-heading);
    }

    .benefits small {
      display: block;
      color: var(--text-muted);
      margin-top: 2px;
      line-height: 1.4;
      font-size: 0.85rem;
    }

    .login__footer {
      margin-top: auto;
      padding-top: 32px;
      color: var(--text-muted);
      font-size: 0.8rem;
    }

    /* Panel Derecho */
    .login__form {
      display: grid;
      place-items: center;
      padding: 32px;
      background-color: var(--cream-bg);
    }

    /* Tarjeta */
    .form-card {
      width: min(100%, 420px);
      padding: 48px 40px;
      box-sizing: border-box;
      position: relative;
      background: var(--cream-card);
      border-radius: 20px;
      box-shadow: 
        0 0 35px 8px rgba(114, 57, 63, 0.06),
        0 15px 35px rgba(51, 46, 43, 0.05);
      outline: 1px solid rgba(169, 146, 125, 0.25);
      outline-offset: -1px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--text-dark);
    }

    .brand img {
      width: 32px;
      height: 32px;
    }

    .brand div {
      display: flex;
      flex-direction: column;
    }

    .brand strong {
      font-family: var(--font-heading);
      font-size: 1rem;
      font-weight: 700;
    }

    .brand span {
      color: var(--text-muted);
      font-size: 0.75rem;
    }

    .form-card h2 {
      font-family: var(--font-heading);
      font-size: 2rem;
      font-weight: 700;
      margin: 32px 0 6px;
      color: var(--text-dark);
      letter-spacing: -0.01em;
    }

    .form-sub {
      color: var(--text-muted);
      margin-bottom: 32px;
      font-size: 0.88rem;
    }

    form {
      display: grid;
      gap: 14px;
    }

    /* Inputs integrados */
    ::ng-deep .cream-field {
      width: 100%;
      
      .mdc-text-field--outlined {
        --mdc-outlined-text-field-outline-color: #D3C9BF !important;
        --mdc-outlined-text-field-focus-outline-color: var(--accent-wine) !important;
        --mdc-outlined-text-field-label-text-color: var(--text-muted) !important;
        --mdc-outlined-text-field-focus-label-text-color: var(--accent-wine) !important;
        --mdc-outlined-text-field-input-text-color: var(--text-dark) !important;
        background-color: #FFFFFF !important;
        border-radius: 8px !important;
      }

      .mat-mdc-form-field-icon-suffix mat-icon {
        color: var(--text-muted);
      }
    }

    .submit {
      height: 48px;
      background-color: var(--accent-wine) !important;
      color: #F2F4F3 !important;
      font-family: var(--font-heading);
      font-size: 0.95rem;
      font-weight: 600;
      margin-top: 10px;
      box-shadow: 0 4px 14px rgba(114, 57, 63, 0.25);
      transition: background-color 0.2s ease, box-shadow 0.2s ease;
      border-radius: 8px;
    }

    .submit:hover:not([disabled]) {
      background-color: #5a2c31 !important;
      box-shadow: 0 6px 18px rgba(114, 57, 63, 0.35);
    }

    .submit[disabled] {
      opacity: 0.6;
    }

    .submit mat-spinner {
      margin: auto;
    }

    ::ng-deep .submit .mat-mdc-progress-spinner circle {
      stroke: #F2F4F3 !important;
    }

    .error {
      display: flex;
      gap: 8px;
      align-items: center;
      color: #b71c1c;
      font-size: 0.85rem;
      background-color: rgba(183, 28, 28, 0.06);
      padding: 10px 12px;
      border-radius: 6px;
    }

    .error mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .help {
      color: var(--text-muted);
      font-size: 0.78rem;
      text-align: center;
      margin-top: 12px;
      margin-bottom: 2px;
    }

    .link-register {
      color: var(--accent-wine);
      text-align: center;
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 600;
      transition: opacity 0.2s ease;
    }

    .link-register:hover {
      text-decoration: underline;
      opacity: 0.8;
    }

    @media (max-width: 768px) {
      .login {
        display: block;
      }
      .login__brand {
        padding: 40px 24px;
      }
      .login__form {
        padding: 24px 16px;
      }
      .form-card {
        padding: 28px 20px;
        box-shadow: none;
        outline: none;
        background-color: transparent;
      }
    }
  `]
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly cargando = signal(false);
  protected readonly error = signal('');
  protected readonly mostrarPassword = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    usuario: ['', Validators.required],
    password: ['', Validators.required]
  });

  protected entrar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.cargando.set(true);
    this.error.set('');

    const { usuario, password } = this.form.getRawValue();

    this.auth.login(usuario, password).subscribe({
      next: () => void this.router.navigate(['/dashboard']),
      error: () => {
        this.error.set('Usuario o contraseña incorrectos');
        this.cargando.set(false);
      }
    });
  }
}