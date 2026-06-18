# Project 3 - Database Integration

This project connects a backend API to MongoDB and implements full CRUD operations.

## Schema

Collection: `students`

Fields:

- `name` - required string, 2 to 100 characters
- `email` - required unique email
- `age` - required integer between 1 and 120
- `course` - required string
- `createdAt` / `updatedAt` - automatic timestamps

## API Endpoints

- `GET /health` - health check
- `GET /api/students` - fetch all students
- `GET /api/students/:id` - fetch one student by id
- `POST /api/students` - create a student
- `PUT /api/students/:id` - update a student
- `DELETE /api/students/:id` - delete a student

## Request Body Example

```json
{
  "name": "Asha Kumar",
  "email": "asha@example.com",
  "age": 21,
  "course": "Computer Science"
}
```

## Error Handling

- `200` for successful reads, updates, and deletes
- `201` for successful create
- `400` for invalid data or invalid ids
- `404` when a student or route is not found
- `409` when a duplicate email is submitted
- `500` for unexpected server errors

## Run

1. Copy `.env.example` to `.env`
2. Set `MONGO_URI` or `MONGODB_URI`
3. Run `npm install`
4. Run `npm start`