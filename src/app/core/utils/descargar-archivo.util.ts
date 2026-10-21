import { HttpHeaders } from '@angular/common/http';

export function extraerNombreArchivo(headers: HttpHeaders, nombrePorDefecto: string): string {
  const contentDisposition = headers.get('Content-Disposition') ?? headers.get('content-disposition');
  if (!contentDisposition) {
    return nombrePorDefecto;
  }

  const conCodificacion = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (conCodificacion?.[1]) {
    try {
      return decodeURIComponent(conCodificacion[1]);
    } catch {
      
    }
  }

  const simple = /filename="?([^";]+)"?/i.exec(contentDisposition);
  if (simple?.[1]) {
    return simple[1];
  }

  return nombrePorDefecto;
}

export function descargarBlob(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = nombreArchivo;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
