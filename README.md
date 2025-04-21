# PapierKraken

PapierKraken is a cloud-native web application designed for intelligent document management with AI-powered features.

## Features

- Document storage, classification, and management
- AI-powered text extraction and classification
- Multi-environment support (dev, test, prod)
- Voice annotations
- Offline synchronization
- Payment reminder notifications
- Full-text search with highlighting

## Architecture

- Frontend: React with TypeScript, TailwindCSS, and Shadcn UI
- Backend: Node.js with Express
- Database: PostgreSQL with Drizzle ORM
- Storage: AWS S3 with SSE-KMS encryption
- AI Processing: Azure OpenAI

## Multi-Environment Support

PapierKraken supports multiple environments (development, testing, production) running on the same infrastructure while maintaining data isolation:

- **Development**: dev.papierkrake.de
- **Testing**: test.papierkrake.de 
- **Production**: papierkrake.de

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- AWS S3 bucket and credentials
- Azure OpenAI API key

### Environment Variables

```
# Environment
ENVIRONMENT=dev|test|prod

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/papierkraken_dev

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=eu-central-1
S3_BUCKET=papierkraken-docs-eu
S3_PREFIX=users/dev/
KMS_KEY_ARN=your-kms-key-arn

# Azure OpenAI
AZURE_OPENAI_KEY=your-azure-key
AZURE_OPENAI_ENDPOINT=your-azure-endpoint
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
```

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations: `npm run db:push`
5. Start the development server: `npm run dev`

## Security Features

- SSE-KMS encryption for S3 documents
- JWT authentication with environment-specific secrets
- User isolation through path-based access control
- Environment separation for all data

## License

Copyright (c) 2025 PapierKraken. All Rights Reserved.# Dev update Mon Apr 21 19:49:37 UTC 2025
