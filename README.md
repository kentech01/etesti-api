# Etesti API

A Node.js API built with TypeScript, Firebase, and PostgreSQL for managing educational exams and assessments.

## Features

- TypeScript support
- Firebase Authentication and Firestore
- PostgreSQL database with TypeORM
- Express.js framework
- Rate limiting and security middleware
- Email service with Nodemailer
- Firebase Storage integration
- Comprehensive error handling
- JWT-based authentication
- Exam management system
- Question and answer tracking
- User performance analytics

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Firebase project with service account
- SMTP server credentials

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd etesti-api
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp env.example .env
```

4. Configure environment variables in `.env` file

5. Build the project:
```bash
npm run build
```

## Environment Variables

Create a `.env` file with the following variables:

- Database configuration
- Firebase service account details
- SMTP server credentials
- JWT secret
- CORS and rate limiting settings

## Database Setup

1. Create a PostgreSQL database
2. Update database credentials in `.env`
3. Run the application (tables will be created automatically in development mode)
4. Initial sectors (KLASA_9, KLASA_12) will be seeded automatically

## Firebase Setup

1. Create a Firebase project
2. Generate a service account key
3. Update Firebase credentials in `.env`

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## API Endpoints

### Users
- `POST /api/users/profile` - Create user profile
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/profile` - Delete user profile

### Sectors
- `GET /api/sectors` - Get all sectors
- `GET /api/sectors/:id` - Get sector by ID
- `POST /api/sectors` - Create sector (admin)
- `PUT /api/sectors/:id` - Update sector (admin)
- `DELETE /api/sectors/:id` - Delete sector (admin)

### Exams
- `GET /api/exams` - Get all active exams
- `GET /api/exams/sector/:sectorId` - Get exams by sector
- `GET /api/exams/:id` - Get exam by ID with questions
- `POST /api/exams` - Create exam (admin)
- `PUT /api/exams/:id` - Update exam (admin)
- `DELETE /api/exams/:id` - Delete exam (admin)

### Questions
- `GET /api/questions/exam/:examId` - Get questions by exam
- `GET /api/questions/:id` - Get question by ID
- `POST /api/questions` - Create question (admin)
- `PUT /api/questions/:id` - Update question (admin)
- `DELETE /api/questions/:id` - Delete question (admin)

### User Answers
- `POST /api/user-answers/submit` - Submit answer to question
- `GET /api/user-answers` - Get user's answers
- `GET /api/user-answers/results/:examId` - Get exam results
- `PUT /api/user-answers/:id` - Update answer

## Authentication

All protected routes require a valid Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

## Services

- **EmailService**: Handles email sending using Nodemailer
- **StorageService**: Manages Firebase Storage operations

## Database Schema

### Core Entities
- **User**: User profiles with Firebase authentication
- **Sector**: Exam sectors (KLASA_9, KLASA_12)
- **Exam**: Exam definitions with metadata
- **Question**: Individual exam questions
- **QuestionOption**: Multiple choice options for questions
- **UserAnswer**: User responses and performance tracking

### Relationships
- Sectors have many Exams
- Exams have many Questions
- Questions have many Options
- Users have many Answers
- Answers link Users, Exams, Questions, and selected Options

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Linting

Check code quality:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint:fix
```

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── entities/        # Database entities
├── middleware/      # Express middleware
├── routes/          # API routes
├── services/        # Business logic services
├── app.ts          # Express application
└── index.ts        # Entry point
```

## Contributing

1. Follow TypeScript best practices
2. Ensure all tests pass
3. Follow the established code style
4. Add tests for new features

## License

MIT
