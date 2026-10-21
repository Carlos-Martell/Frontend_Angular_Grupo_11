import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { BancoService } from '../../core/services/banco.service';
import { Moneda } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';

@Component({
  selector: 'app-banco-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './banco-form.component.html',
})
export class BancoFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly bancoService = inject(BancoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly monedas: Moneda[] = ['PEN', 'USD'];

  private readonly idParam = this.route.snapshot.paramMap.get('id');
  readonly esEdicion = this.idParam !== null && this.idParam !== 'nuevo';
  private readonly bancoId = this.esEdicion ? Number(this.idParam) : null;

  readonly cargando = signal(this.esEdicion);
  readonly guardando = signal(false);
  readonly errorMensaje = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    numeroCuenta: ['', [Validators.required, Validators.maxLength(30)]],
    cci: ['', [Validators.maxLength(30)]],
    moneda: ['PEN' as Moneda, [Validators.required]],
  });

  get f() {
    return this.form.controls;
  }

  constructor() {
    if (this.esEdicion && this.bancoId !== null) {
      this.bancoService
        .obtener(this.bancoId)
        .pipe(finalize(() => this.cargando.set(false)))
        .subscribe({
          next: (banco) =>
            this.form.patchValue({
              nombre: banco.nombre,
              numeroCuenta: banco.numeroCuenta,
              cci: banco.cci ?? '',
              moneda: banco.moneda,
            }),
          error: (error: HttpErrorResponse) => this.manejarError(error),
        });
    }
  }

  onSubmit(): void {
    this.errorMensaje.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const banco = {
      nombre: valores.nombre,
      numeroCuenta: valores.numeroCuenta,
      cci: valores.cci || undefined,
      moneda: valores.moneda,
    };

    this.guardando.set(true);

    const peticion =
      this.esEdicion && this.bancoId !== null
        ? this.bancoService.actualizar(this.bancoId, banco)
        : this.bancoService.crear(banco);

    peticion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: () => this.router.navigate(['/bancos']),
      error: (error: HttpErrorResponse) => this.manejarError(error),
    });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    if (cuerpo?.detalles?.length) {
      this.errorMensaje.set(cuerpo.detalles.join(' | '));
    } else {
      this.errorMensaje.set(cuerpo?.message || 'No se pudo guardar el banco.');
    }
  }
}
