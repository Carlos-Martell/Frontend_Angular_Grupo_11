import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, forkJoin } from 'rxjs';
import { PuestoService } from '../../core/services/puesto.service';
import { GiroService } from '../../core/services/giro.service';
import { SocioService } from '../../core/services/socio.service';
import { GiroDTO, SocioDTO } from '../../core/models';
import { ErrorResponse } from '../../core/models/error-response.model';

function vigenciaValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const inicio = group.get('fechaInicioVigencia')?.value;
    const fin = group.get('fechaFinVigencia')?.value;
    if (!inicio || !fin) {
      return null;
    }
    return new Date(fin) >= new Date(inicio) ? null : { vigenciaInvalida: true };
  };
}

@Component({
  selector: 'app-puesto-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './puesto-form.component.html',
})
export class PuestoFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly puestoService = inject(PuestoService);
  private readonly giroService = inject(GiroService);
  private readonly socioService = inject(SocioService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly idParam = this.route.snapshot.paramMap.get('id');
  readonly esEdicion = this.idParam !== null && this.idParam !== 'nuevo';
  private readonly puestoId = this.esEdicion ? Number(this.idParam) : null;

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly errorMensaje = signal<string | null>(null);

  readonly giros = signal<GiroDTO[]>([]);
  readonly socios = signal<SocioDTO[]>([]);

  readonly form = this.fb.nonNullable.group(
    {
      numero: ['', [Validators.required, Validators.maxLength(20)]],
      giroId: [null as number | null, [Validators.required]],
      socioId: [null as number | null],
      inquilinoNombre: ['', [Validators.maxLength(150)]],
      inquilinoDocumento: ['', [Validators.maxLength(20)]],
      fechaInicioVigencia: [''],
      fechaFinVigencia: [''],
    },
    { validators: vigenciaValidator() }
  );

  get f() {
    return this.form.controls;
  }

  constructor() {
    const catalogos$ = forkJoin({
      giros: this.giroService.listar(),
      socios: this.socioService.listar(),
    });

    catalogos$.subscribe({
      next: ({ giros, socios }) => {
        this.giros.set(giros);
        this.socios.set(socios);

        if (this.esEdicion && this.puestoId !== null) {
          this.puestoService
            .obtener(this.puestoId)
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
              next: (puesto) =>
                this.form.patchValue({
                  numero: puesto.numero,
                  giroId: puesto.giroId,
                  socioId: puesto.socioId ?? null,
                  inquilinoNombre: puesto.inquilinoNombre ?? '',
                  inquilinoDocumento: puesto.inquilinoDocumento ?? '',
                  fechaInicioVigencia: puesto.fechaInicioVigencia ?? '',
                  fechaFinVigencia: puesto.fechaFinVigencia ?? '',
                }),
              error: (error: HttpErrorResponse) => this.manejarError(error),
            });
        } else {
          this.cargando.set(false);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        this.manejarError(error);
      },
    });
  }

  onSubmit(): void {
    this.errorMensaje.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const puesto = {
      numero: valores.numero,
      giroId: valores.giroId as number,
      socioId: valores.socioId ?? undefined,
      inquilinoNombre: valores.inquilinoNombre || undefined,
      inquilinoDocumento: valores.inquilinoDocumento || undefined,
      fechaInicioVigencia: valores.fechaInicioVigencia || undefined,
      fechaFinVigencia: valores.fechaFinVigencia || undefined,
    };

    this.guardando.set(true);

    const peticion =
      this.esEdicion && this.puestoId !== null
        ? this.puestoService.actualizar(this.puestoId, puesto)
        : this.puestoService.crear(puesto);

    peticion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: () => this.router.navigate(['/puestos']),
      error: (error: HttpErrorResponse) => this.manejarError(error),
    });
  }

  private manejarError(error: HttpErrorResponse): void {
    const cuerpo = error.error as ErrorResponse | undefined;
    if (cuerpo?.detalles?.length) {
      this.errorMensaje.set(cuerpo.detalles.join(' | '));
    } else {
      this.errorMensaje.set(cuerpo?.message || 'No se pudo guardar el puesto.');
    }
  }
}
