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
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      {{ data.mode === 'multa' ? 'Registrar multa' : 'Registrar arraigo o bloqueo' }}
    </h2>

    <form [formGroup]="form" (ngSubmit)="guardar()">
      <mat-dialog-content class="dialog-content">
        @if (data.mode === 'multa') {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Concepto</mat-label>
            <input matInput formControlName="concepto" placeholder="Ej. Extemporaneidad en trámite" />
            @if (form.controls.concepto.hasError('required') && form.controls.concepto.touched) {
              <mat-error>El concepto es obligatorio.</mat-error>
            }
          </mat-form-field>

          <div class="inline-fields">
            <mat-form-field appearance="outline" class="flex-2">
              <mat-label>Monto</mat-label>
              <input matInput type="number" min="0.01" step="0.01" formControlName="monto" placeholder="0.00" />
              @if (form.controls.monto.hasError('required') && form.controls.monto.touched) {
                <mat-error>El monto es obligatorio.</mat-error>
              } @else if (form.controls.monto.hasError('min') && form.controls.monto.touched) {
                <mat-error>El monto debe ser mayor que 0.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>Moneda</mat-label>
              <input matInput maxlength="3" formControlName="moneda" placeholder="GTQ" />
              @if (form.controls.moneda.hasError('required') && form.controls.moneda.touched) {
                <mat-error>La moneda es obligatoria.</mat-error>
              }
            </mat-form-field>
          </div>
        } @else {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tipo</mat-label>
            <mat-select formControlName="tipo">
              <mat-option value="ARRAIGO">Arraigo</mat-option>
              <mat-option value="BLOQUEO_LEGAL">Bloqueo legal</mat-option>
              <mat-option value="RESTRICCION_SALIDA">Restricción de salida</mat-option>
            </mat-select>
            @if (form.controls.tipo.hasError('required') && form.controls.tipo.touched) {
              <mat-error>Selecciona un tipo.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Motivo</mat-label>
            <textarea matInput rows="3" formControlName="motivo" placeholder="Descripción de la causa o resolución"></textarea>
            @if (form.controls.motivo.hasError('required') && form.controls.motivo.touched) {
              <mat-error>El motivo es obligatorio.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Autoridad</mat-label>
            <input matInput formControlName="autoridad" placeholder="Juzgado o entidad emisor" />
            @if (form.controls.autoridad.hasError('required') && form.controls.autoridad.touched) {
              <mat-error>La autoridad es obligatoria.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Número de expediente (opcional)</mat-label>
            <input matInput formControlName="numeroExpediente" placeholder="Ej. 01044-2026-00123" />
          </mat-form-field>

          <div class="inline-fields">
            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>Fecha de inicio</mat-label>
              <input matInput type="date" formControlName="fechaInicio" />
              @if (form.controls.fechaInicio.hasError('required') && form.controls.fechaInicio.touched) {
                <mat-error>La fecha de inicio es obligatoria.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>Fecha final (opcional)</mat-label>
              <input matInput type="date" formControlName="fechaFin" />
            </mat-form-field>
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Guardar</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .dialog-title {
      margin: 0 0 8px 0;
      color: var(--text-primary);
      font-size: 1.35rem;
      font-weight: 600;
    }

    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 12px !important;
      min-width: 360px;
      max-width: 520px;
    }

    .full-width {
      width: 100%;
    }

    .inline-fields {
      display: flex;
      gap: 12px;
      width: 100%;
    }

    .flex-1 {
      flex: 1;
    }

    .flex-2 {
      flex: 2;
    }

    mat-form-field {
      width: 100%;
    }

    .dialog-actions {
      padding: 16px 24px 8px 24px;
      gap: 8px;

      button {
        padding: 0 20px;
      }
    }

    @media (max-width: 500px) {
      .dialog-content {
        min-width: 100%;
      }

      .inline-fields {
        flex-direction: column;
        gap: 0;
      }
    }
  `],
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
      ['tipo', 'motivo', 'autoridad', 'fechaInicio'].forEach((field) =>
        this.form.get(field)?.addValidators(Validators.required)
      );
    }
    this.form.updateValueAndValidity();
  }

  protected guardar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();

    if (this.data.mode === 'multa') {
      this.ref.close({
        concepto: value.concepto?.trim(),
        monto: Number(value.monto),
        moneda: value.moneda?.trim().toUpperCase(),
      });
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
  template: `
    <h2 mat-dialog-title class="dialog-title">Confirmar acción</h2>
    
    <mat-dialog-content class="confirm-content">
      <p>{{ data }}</p>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [mat-dialog-close]="true">Confirmar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      margin: 0 0 8px 0;
      color: var(--text-primary);
      font-size: 1.25rem;
      font-weight: 600;
    }

    .confirm-content {
      padding-top: 8px !important;

      p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.95rem;
        line-height: 1.5;
      }
    }

    .dialog-actions {
      padding: 16px 24px 8px 24px;
      gap: 8px;
    }
  `],
})
export class ConfirmDialogComponent {
  protected readonly data = inject<string>(MAT_DIALOG_DATA);
}