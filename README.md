# Sistema de Gestión Administrativa y de Caja — Frontend (Angular)

Estructura inicial del proyecto (ProyectoGrupo11), generada a partir del
documento de requisitos y del resumen de API. Angular 17+, componentes
standalone, routing con `provideRouter`, Bootstrap 5 y formularios reactivos.

## Requisitos previos

- Node.js 18+ y **pnpm** (no usar `npm install`).
- Angular CLI (`pnpm add -g @angular/cli`, o usar `pnpm dlx @angular/cli`).

## Instalación

```bash
pnpm install
```

## Levantar en desarrollo

```bash
pnpm start
# equivalente a: ng serve
```




## Build de producción

```bash
pnpm run build:prod
```

## Estructura de carpetas

```
src/
├── environments/           
├── app/
│   ├── app.component.ts    
│   ├── app.config.ts        
│   ├── app.routes.ts        
│   ├── core/               
│   │   ├── models/         
│   │   ├── services/       
│   │   ├── interceptors/    
│   │   ├── guards/         
│   │   └── utils/           
│   ├── shared/
│   │   ├── layout/         
│   │   └── validators/      
│   └── features/
│       ├── auth/login/      
│       ├── home/            
│       └── socios|puestos|giros|bancos|servicios|cuentas-por-cobrar|
│           recibos|egresos|reportes|usuarios/ 



