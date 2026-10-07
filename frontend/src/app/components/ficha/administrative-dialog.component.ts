import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export type AdministrativeDialogData = { mode: 'multa' | 'arraigo' };

@Component({
  selector: 'app-administrative-dialog',
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'multa' ? 'Registrar multa' : 'Registrar arraigo o bloqueo' }}</h2>
    <form [formGroup]="form" (ngSubmit)="guardar()">
      <mat-dialog-content>
        @if (data.mode === 'multa') {
          <mat-form-field appearance="outline"><mat-label>Concepto</mat-label><input matInput formControlName="concepto" /></mat-form-field>
          <div class="inline">
            <mat-form-field appearance="outline"><mat-label>Monto</mat-label><input matInput type="number" min="0.01" step="0.01" formControlName="monto" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Moneda</mat-label><input matInput maxlength="3" formControlName="moneda" /></mat-form-field>
          </div>
        } @else {
          <mat-form-field appearance="outline"><mat-label>Tipo</mat-label><mat-select formControlName="tipo"><mat-option value="ARRAIGO">Arraigo</mat-option><mat-option value="BLOQUEO_LEGAL">Bloqueo legal</mat-option><mat-option value="RESTRICCION_SALIDA">Restricción de salida</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Motivo</mat-label><textarea matInput rows="2" formControlName="motivo"></textarea></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Autoridad</mat-label><input matInput formControlName="autoridad" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Número de expediente (opcional)</mat-label><input matInput formControlName="numeroExpediente" /></mat-form-field>
          <div class="inline">
            <mat-form-field appearance="outline"><mat-label>Fecha de inicio</mat-label><input matInput type="date" formControlName="fechaInicio" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Fecha final (opcional)</mat-label><input matInput type="date" formControlName="fechaFin" /></mat-form-field>
          </div>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end"><button mat-button type="button" mat-dialog-close>Cancelar</button><button mat-flat-button type="submit" [disabled]="form.invalid">Guardar</button></mat-dialog-actions>
    </form>
  `,
  styles: [`.inline{display:flex;gap:12px}.inline>*{flex:1}mat-form-field{display:block;min-width:0}@media(max-width:500px){.inline{flex-direction:column;gap:0}}`],
})
export class AdministrativeDialogComponent {
  protected readonly data = inject<AdministrativeDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<AdministrativeDialogComponent>);
  private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.group({
    concepto: [''],
    monto: [null as number | null],
    moneda: ['GTQ'],
    tipo: ['ARRAIGO'],
    motivo: [''],
    autoridad: [''],
    numeroExpediente: [''],
    fechaInicio: [new Date().toISOString().slice(0, 10)],
    fechaFin: [''],
  });

  constructor() {
    const required = ['concepto', 'monto', 'moneda'];
    if (this.data.mode === 'multa') {
      required.forEach((field) => this.form.get(field)?.addValidators(Validators.required));
      this.form.get('monto')?.addValidators(Validators.min(0.01));
    } else {
      ['tipo', 'motivo', 'autoridad', 'fechaInicio'].forEach((field) => this.form.get(field)?.addValidators(Validators.required));
    }
    this.form.updateValueAndValidity();
  }

  protected guardar(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    if (this.data.mode === 'multa') {
      this.ref.close({ concepto: value.concepto?.trim(), monto: Number(value.monto), moneda: value.moneda?.trim().toUpperCase() });
    } else {
      this.ref.close({
        tipo: value.tipo,
        motivo: value.motivo?.trim(),
        autoridad: value.autoridad?.trim(),
        numeroExpediente: value.numeroExpediente?.trim() || undefined,
        fechaInicio: value.fechaInicio,
        fechaFin: value.fechaFin || undefined,
      });
    }
  }
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatButtonModule, MatDialogModule],
  template: `<h2 mat-dialog-title>Confirmar acción</h2><mat-dialog-content>{{ data }}</mat-dialog-content><mat-dialog-actions align="end"><button mat-button mat-dialog-close>Cancelar</button><button mat-flat-button [mat-dialog-close]="true">Confirmar</button></mat-dialog-actions>`,
})
export class ConfirmDialogComponent {
  protected readonly data = inject<string>(MAT_DIALOG_DATA);
}
