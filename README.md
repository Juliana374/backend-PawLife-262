# PawLife Backend

Backend for PawLife, a project to help pet owners and vets keep track of vaccines, medications, appointments, weight and photos for their pets. Built with NestJS, TypeORM and PostgreSQL.

## Requisitos
- Node.js
- Docker Desktop

## Cómo levantarlo
1. Copia `.env.local.example` a `.env` y cambia `JWT_SECRET` por un valor local de al menos 32 caracteres.
2. Ejecuta `npm install` y `docker compose up -d`.
3. Ejecuta `npm run start:dev`.

Para producción, configura las mismas variables en el proveedor de despliegue o copia `.env.production.example` a `.env.production`. Define `NODE_ENV=production`, `DB_SSL=true` y reemplaza todas las credenciales de ejemplo.

Importa `docs/pawlife-api.postman_collection.json` junto con `docs/pawlife-api.postman_environment.json` para local o `docs/pawlife-api.production.postman_environment.json` para producción. Completa las credenciales e IDs en el environment seleccionado.