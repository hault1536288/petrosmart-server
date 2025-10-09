# Postman Testing Guide for Authentication

## Setup Steps

### 1. Reset and Reseed Database

```bash
npm run db:reset
```

This will:

- Drop the database and recreate it
- Create tables with the new password field
- Seed 5 users with password: `password123`

### 2. Start the Application

```bash
npm run start:dev
```

Wait for the app to start successfully on `http://localhost:3000`

---

## Postman Test Cases

### Test 1: Register New User

**Method:** `POST`  
**URL:** `http://localhost:3000/auth/register`  
**Headers:**

```
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "email": "test@example.com",
  "firstName": "Test",
  "lastName": "User",
  "password": "password123",
  "phone": "+1234567890"
}
```

**Expected Response (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 6,
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+1234567890",
    "createdAt": "2025-10-03T...",
    "updatedAt": "2025-10-03T..."
  }
}
```

---

### Test 2: Login with Existing User

**Method:** `POST`  
**URL:** `http://localhost:3000/auth/login`  
**Headers:**

```
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Expected Response (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  }
}
```

**Note:** Copy the `access_token` for the next tests!

---

### Test 3: Login with Wrong Password

**Method:** `POST`  
**URL:** `http://localhost:3000/auth/login`  
**Body (raw JSON):**

```json
{
  "email": "john.doe@example.com",
  "password": "wrongpassword"
}
```

**Expected Response (401):**

```json
{
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

### Test 4: Get User Profile (Protected Route)

**Method:** `GET`  
**URL:** `http://localhost:3000/auth/profile`  
**Headers:**

```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json
```

**Expected Response (200):**

```json
{
  "userId": 1,
  "email": "john.doe@example.com"
}
```

---

### Test 5: Get All Users (Protected Route)

**Method:** `GET`  
**URL:** `http://localhost:3000/users`  
**Headers:**

```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Expected Response (200):**

```json
[
  {
    "id": 1,
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "$2b$10$...",
    "phone": "+1234567890",
    "createdAt": "2025-10-03T...",
    "updatedAt": "2025-10-03T..."
  }
  // ... more users
]
```

---

### Test 6: Access Protected Route Without Token

**Method:** `GET`  
**URL:** `http://localhost:3000/auth/profile`  
**Headers:**

```
Content-Type: application/json
```

(No Authorization header)

**Expected Response (401):**

```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

---

## Test Users Available

After running `npm run db:reset`, these users are available:

| Email                    | Password    | Name         |
| ------------------------ | ----------- | ------------ |
| john.doe@example.com     | password123 | John Doe     |
| jane.smith@example.com   | password123 | Jane Smith   |
| mike.johnson@example.com | password123 | Mike Johnson |
| sarah.wilson@example.com | password123 | Sarah Wilson |
| david.brown@example.com  | password123 | David Brown  |

---

## Quick Postman Setup

### Create a Postman Collection

1. Create a new collection called "Petrosmart Auth"
2. Add an environment variable `base_url` = `http://localhost:3000`
3. Add an environment variable `token` (leave empty initially)

### Auto-save Token

In the **Login** or **Register** request, add this to the **Tests** tab:

```javascript
if (pm.response.code === 200) {
  var jsonData = pm.response.json();
  pm.environment.set('token', jsonData.access_token);
}
```

Then in protected routes, use:

```
Authorization: Bearer {{token}}
```

---

## Common Issues

### 1. "Cannot POST /auth/login"

- Make sure the app is running
- Check the URL is correct

### 2. "Unauthorized" on login

- Verify the password is `password123`
- Check the database was reseeded

### 3. Protected routes return 401

- Ensure you're sending the Authorization header
- Token format: `Bearer YOUR_TOKEN` (note the space)
- Token might be expired (default 24h)

### 4. Database errors

- Run `npm run db:reset` to recreate everything
- Check Docker is running: `docker ps`

---

## Debugging Tips

1. Check app logs for errors
2. Verify JWT_SECRET is set in `.env`
3. Test endpoints in order (register → login → protected routes)
4. Use Postman Console to see full request/response details
