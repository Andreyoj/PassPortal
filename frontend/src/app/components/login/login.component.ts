import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
	selector: 'app-login',
	imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, ReactiveFormsModule],
	template: `<main class="login"><mat-card><div class="brand"><mat-icon>travel_explore</mat-icon><strong>Pass Portal</strong><span>Gestión migratoria</span></div><h1>Iniciar sesión</h1><p>Accede al panel de control migratorio.</p><form [formGroup]="form" (ngSubmit)="entrar()"><mat-form-field appearance="outline"><mat-label>Usuario</mat-label><input matInput formControlName="usuario" autocomplete="username" /></mat-form-field><mat-form-field appearance="outline"><mat-label>Contraseña</mat-label><input matInput type="password" formControlName="password" autocomplete="current-password" /></mat-form-field>@if (error()) { <div class="error" role="alert"><mat-icon>error</mat-icon>{{ error() }}</div> }<button mat-flat-button type="submit" [disabled]="form.invalid || cargando()">{{ cargando() ? 'Ingresando...' : 'Ingresar' }}</button></form></mat-card></main>`,
	styles: [`.login{min-height:100dvh;display:grid;place-items:center;padding:20px;background:var(--mat-sys-surface-container)}mat-card{width:min(100%,420px);padding:32px}.brand{display:flex;align-items:center;gap:8px;color:var(--mat-sys-primary)}.brand mat-icon{font-size:32px;width:32px;height:32px}.brand span{color:var(--mat-sys-on-surface-variant);font-size:12px}h1{margin-bottom:4px}p{color:var(--mat-sys-on-surface-variant)}form{display:grid;gap:8px}.error{display:flex;gap:8px;align-items:center;color:var(--pp-rojo);font-size:14px}`],
})
export class LoginComponent {
	private readonly auth = inject(AuthService); private readonly router = inject(Router); private readonly fb = inject(FormBuilder);
	protected readonly cargando = signal(false); protected readonly error = signal('');
	protected readonly form = this.fb.nonNullable.group({ usuario: ['', Validators.required], password: ['', Validators.required] });
	protected entrar(): void { if (this.form.invalid) return; this.cargando.set(true); this.error.set(''); const { usuario, password } = this.form.getRawValue(); this.auth.login(usuario, password).subscribe({ next: () => void this.router.navigate(['/dashboard']), error: () => { this.error.set('Usuario o contraseña incorrectos'); this.cargando.set(false); } }); }
}
