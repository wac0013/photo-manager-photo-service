# 📷 Photo Manager - Photo Service

Microserviço responsável pelo gerenciamento de álbuns e fotos, incluindo upload, processamento e armazenamento de imagens.

## 🚀 Tecnologias

- **NestJS 11** - Framework Node.js
- **Prisma 7** - ORM
- **PostgreSQL** - Banco de dados
- **Google Cloud Storage** - Armazenamento de imagens
- **Sharp** - Processamento de imagens
- **Swagger** - Documentação da API
- **class-transformer** - Serialização de dados
- **Zod** - Validação de schemas

## 📁 Estrutura do Projeto

```
src/
├── application/
│   ├── dto/                    # Data Transfer Objects
│   │   ├── album-create.dto.ts
│   │   ├── album-update.dto.ts
│   │   ├── page-query.dto.ts
│   │   ├── photo-create.dto.ts
│   │   └── photo-update.dto.ts
│   ├── guards/
│   │   └── auth.guard.ts       # Guard de autenticação
│   └── services/
│       ├── album.service.ts    # Lógica de negócio de álbuns
│       ├── image-metadata.service.ts  # Extração de metadados
│       └── photo.service.ts    # Lógica de negócio de fotos
├── domain/
│   ├── entities/
│   │   ├── album.entity.ts     # Entidade de álbum
│   │   ├── infinit-page-response.entity.ts
│   │   └── photo.entity.ts     # Entidade de foto
│   └── repositories/           # Interfaces de repositórios
│       ├── album.repo.ts
│       ├── photo.repo.ts
│       └── storage.repo.ts
├── infrastructure/
│   ├── controllers/
│   │   ├── album.controller.ts
│   │   └── photo.controller.ts
│   ├── db/
│   │   └── prisma/             # Configuração do Prisma
│   │       ├── prisma.service.ts
│   │       ├── prisma.context.ts
│   │       ├── transaction-context.ts
│   │       └── transactional.decorator.ts
│   ├── repositories/
│   │   ├── prisma-album.repo.ts
│   │   └── prisma-photo.repo.ts
│   └── storage/
│       └── gcp-storage.service.ts  # Integração com GCP
├── app.module.ts
└── main.ts
```

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
pnpm start:dev      # Inicia em modo watch
pnpm start:debug    # Inicia em modo debug

# Build
pnpm build          # Compila o projeto

# Produção
pnpm start:prod     # Executa o build de produção

# Testes
pnpm test           # Executa testes unitários
pnpm test:watch     # Testes em modo watch
pnpm test:cov       # Testes com cobertura
pnpm test:e2e       # Testes end-to-end

# Prisma
pnpm prisma:generate   # Gera o cliente Prisma
pnpm prisma:create     # Cria nova migration
pnpm prisma:migrate    # Executa migrations
pnpm prisma:studio     # Abre Prisma Studio

# Lint
pnpm lint           # Executa ESLint
pnpm format         # Formata código com Prettier
```

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# Database
DATABASE_URL=postgres://user:password@localhost:5432/photomanager

# Server
PORT=4000

# Google Cloud Storage
GCP_PROJECT_ID=your-project-id
GCP_BUCKET_NAME=your-bucket-name
GCP_CREDENTIALS_PATH=/path/to/credentials.json

# Auth
USER_SERVICE_URL=http://localhost:3000
```

### Instalação

```bash
# Instalar dependências
pnpm install

# Gerar cliente Prisma
pnpm prisma:generate

# Executar migrations
pnpm prisma:migrate

# Iniciar em modo desenvolvimento
pnpm start:dev
```

O serviço estará disponível em `http://localhost:4000`.

## 📖 API Endpoints

### Álbuns

| Método | Endpoint                | Descrição               |
| ------ | ----------------------- | ----------------------- |
| GET    | `/photos/v1/albums`     | Lista álbuns do usuário |
| GET    | `/photos/v1/albums/:id` | Busca álbum por ID      |
| POST   | `/photos/v1/albums`     | Cria novo álbum         |
| PATCH  | `/photos/v1/albums/:id` | Atualiza álbum          |
| DELETE | `/photos/v1/albums/:id` | Exclui álbum            |

### Fotos

| Método | Endpoint                    | Descrição            |
| ------ | --------------------------- | -------------------- |
| GET    | `/photos/v1/album/:albumId` | Lista fotos do álbum |
| GET    | `/photos/v1/:id`            | Busca foto por ID    |
| POST   | `/photos/v1`                | Upload de nova foto  |
| PATCH  | `/photos/v1/:id`            | Atualiza foto        |
| DELETE | `/photos/v1/:id`            | Exclui foto          |

### Documentação Swagger

Acesse `http://localhost:4000/docs` para a documentação interativa.

## 🎯 Funcionalidades

### Álbuns

- ✅ CRUD completo
- ✅ Paginação infinita com cursor
- ✅ Soft delete
- ✅ Validação de exclusão (não permite excluir álbuns com fotos)
- ✅ Foto de capa automática

### Fotos

- ✅ Upload multipart/form-data
- ✅ Suporte a JPG, PNG, GIF, WebP, HEIC, HEIF
- ✅ Limite de 10MB por arquivo
- ✅ Armazenamento no Google Cloud Storage
- ✅ Extração automática de metadados
- ✅ Detecção de cor dominante
- ✅ Soft delete

### Transações

- ✅ Decorator `@Transactional()` para transações automáticas
- ✅ Suporte a níveis de isolamento
- ✅ Rollback automático em caso de erro

## 🔐 Autenticação

Todas as rotas são protegidas pelo `AuthGuard` que valida o token JWT através do User Service.

Headers necessários:

```
Authorization: Bearer <token>
```

## 🧪 Testes

```bash
# Testes unitários
pnpm test

# Testes com cobertura
pnpm test:cov

# Testes E2E
pnpm test:e2e
```

## 🔧 Debug

### VSCode Launch Configuration

```json
{
  "name": "Debug photo-service",
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["run", "start:debug"],
  "console": "integratedTerminal",
  "restart": true,
  "sourceMaps": true
}
```

## 🐳 Docker

### Build da imagem

```bash
docker build -t photo-manager-photo-service .
```

### Executar container

```bash
docker run -p 4000:4000 \
  -e DATABASE_URL=postgres://... \
  -e GCP_PROJECT_ID=... \
  photo-manager-photo-service
```

## 📄 Licença

Este projeto é privado e de uso restrito.
