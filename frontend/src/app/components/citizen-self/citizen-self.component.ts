import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import type { ApiSuccessResponse } from '../../models/api.model';
import type { FichaCiudadano } from '../../models/domain.model';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-citizen-self',
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule],
  template: `<section class="self-page"><header><p class="eyebrow">Ciudadano</p><h1>Mi información migratoria</h1><p>Completa tu ficha para consultar tus documentos, movimientos y obligaciones.</p></header>@if(!ficha()){<mat-card><h2>Crear mi ficha</h2><p>Estos datos se guardan en tu registro migratorio y solo tú y el personal autorizado podrán consultarlos.</p><form [formGroup]="form" (ngSubmit)="guardar()"><mat-form-field appearance="outline"><mat-label>DPI</mat-label><input matInput formControlName="dpi" /></mat-form-field><mat-form-field appearance="outline"><mat-label>Nombres</mat-label><input matInput formControlName="nombres" /></mat-form-field><mat-form-field appearance="outline"><mat-label>Apellidos</mat-label><input matInput formControlName="apellidos" /></mat-form-field><mat-form-field appearance="outline"><mat-label>Fecha de nacimiento</mat-label><input matInput type="date" formControlName="fechaNacimiento" /></mat-form-field><mat-form-field appearance="outline"><mat-label>Sexo</mat-label><mat-select formControlName="sexo"><mat-option value="F">Femenino</mat-option><mat-option value="M">Masculino</mat-option><mat-option value="X">Otro</mat-option></mat-select></mat-form-field><mat-form-field appearance="outline"><mat-label>Nacionalidad</mat-label><input matInput formControlName="nacionalidad" /></mat-form-field><mat-form-field appearance="outline"><mat-label>Teléfono</mat-label><input matInput formControlName="telefono" /></mat-form-field><mat-form-field appearance="outline"><mat-label>Dirección</mat-label><input matInput formControlName="direccion" /></mat-form-field>@if(error()){<p class="error">{{error()}}</p>}<button mat-flat-button type="submit" [disabled]="guardando()">Guardar ficha</button></form></mat-card>} @else {<mat-card class="ready"><h2>Ficha creada correctamente</h2><p>{{ficha()?.nombres}} {{ficha()?.apellidos}} · DPI {{ficha()?.dpi}}</p><button mat-flat-button (click)="abrirFicha()">Ver mi ficha completa</button></mat-card>}</section>`,
  styles: [`.self-page{max-width:760px;margin:auto}.eyebrow{color:var(--mat-sys-primary);font-weight:700;text-transform:uppercase}.self-page mat-card{padding:24px;margin-top:24px}.self-page form{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.self-page form mat-form-field:nth-child(2),.self-page form mat-form-field:nth-child(3),.self-page form mat-form-field:nth-child(7),.self-page form mat-form-field:nth-child(8){grid-column:span 2}.error{color:var(--pp-rojo)}@media(max-width:650px){.self-page form{grid-template-columns:1fr}.self-page form mat-form-field{grid-column:span 1!important}}`],
})
export class CitizenSelfComponent {
  private readonly http = inject(HttpClient); private readonly api = inject(ApiService); private readonly router = inject(Router); private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(AuthService); protected readonly ficha = signal<FichaCiudadano | null>(null); protected readonly error = signal(''); protected readonly guardando = signal(false);
  protected readonly form = this.fb.nonNullable.group({dpi:['', [Validators.required, Validators.pattern(/^\d{8,20}$/)]],nombres:['',Validators.required],apellidos:['',Validators.required],fechaNacimiento:['',Validators.required],sexo:['F' as 'M'|'F'|'X',Validators.required],nacionalidad:['Guatemalteca',Validators.required],telefono:[''],direccion:['']});
  constructor(){this.api.obtenerMiFicha().subscribe({next:f=>this.ficha.set(f),error:()=>{}});}
  protected guardar(): void {this.form.markAllAsTouched();if(this.form.invalid)return;this.guardando.set(true);this.error.set('');this.http.put<ApiSuccessResponse<FichaCiudadano>>(`${environment.apiUrl}/api/auth/me/ficha`,this.form.getRawValue()).subscribe({next:r=>{this.ficha.set(r.data);this.guardando.set(false)},error:e=>{this.error.set(e.error?.error?.mensaje ?? 'No se pudo guardar la ficha.');this.guardando.set(false)}});}
  protected abrirFicha(): void { void this.router.navigate(['/mi-informacion/ficha']); }
}
