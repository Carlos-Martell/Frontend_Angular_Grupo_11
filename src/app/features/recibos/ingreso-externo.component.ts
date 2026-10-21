import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { ReciboService } from '../../core/services/recibo.service';
import { ReciboDTO } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-ingreso-externo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ingreso-externo.component.html',
})
export class IngresoExternoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly reciboService = inject(ReciboService);
  
  readonly authService = inject(AuthService);

  readonly guardando = signal(false);
  readonly errorMensaje = signal<string | null>(null);
  readonly reciboGenerado = signal<ReciboDTO | null>(null);

  readonly form = this.fb.nonNullable.group({
    depositante: ['', [Validators.required, Validators.maxLength(150)]],
    categoria: ['', [Validators.required, Validators.maxLength(100)]],
    concepto: ['', [Validators.maxLength(255)]],
    monto: [null as number | null, [Validators.required, Validators.min(0.01)]],
    fechaDeposito: [''],
  });

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    this.errorMensaje.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const usuarioId = this.authService.usuarioId();
    if (usuarioId === null) {
      this.errorMensaje.set('No se pudo determinar tu usuario. Volvé a iniciar sesión.');
      return;
    }

    const valores = this.form.getRawValue();
    const recibo: ReciboDTO = {
      tipo: 'INGRESO',
      monto: valores.monto as number,
      usuarioId,
      depositante: valores.depositante,
      categoria: valores.categoria,
      concepto: valores.concepto || undefined,
      fechaDeposito: valores.fechaDeposito || undefined,
    };

    this.guardando.set(true);
    this.reciboService
      .registrarIngresoExterno(recibo)
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: (creado) => {
          this.reciboGenerado.set(creado);
          this.form.reset({
            depositante: '',
            categoria: '',
            concepto: '',
            monto: null,
            fechaDeposito: '',
          });
        },
        error: (error: HttpErrorResponse) => this.manejarError(error),
      });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    if (cuerpo?.detalles?.length) {
      this.errorMensaje.set(cuerpo.detalles.join(' | '));
    } else {
      this.errorMensaje.set(cuerpo?.message || 'No se pudo registrar el ingreso.');
    }
  }
}
