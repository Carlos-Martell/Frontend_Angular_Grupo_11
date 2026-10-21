import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function fechaPasadaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (!valor) {
      return null;
    }
    const fecha = new Date(valor);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fecha < hoy ? null : { fechaPasada: true };
  };
}
