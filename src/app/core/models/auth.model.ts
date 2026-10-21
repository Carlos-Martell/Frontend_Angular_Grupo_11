export type RolUsuario = 'ADMINISTRADOR' | 'OPERADOR_CAJA';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  token: string | null;
  username: string;
  nombres: string;
  apellidos: string;
  rol: RolUsuario;
}

export interface SesionUsuario {
  
  id: number;
  token: string;
  username: string;
  nombres: string;
  apellidos: string;
  rol: RolUsuario;
}
