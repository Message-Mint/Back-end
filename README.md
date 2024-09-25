# 🍃 Message Mint!

## 🚀 **Endpoints**

### 1. **User Registration**

**Endpoint:** `POST /user/signup`  
**Description:** Registers a new user in the system. This endpoint will create a new user and respond with a success message. 

**Request Body:**

```json
{
    "userName": "john_doe",
    "emailAddress": "john.doe@example.com",
    "phoneNumber": "+1234567890",
    "password": "strongPassword123",
    "firstName": "John",
    "lastName": "Doe",
    "nickName": "Johnny"
}
```

**Request Body Parameters:**
- `userName` (string): **Required** - The username for the user.
- `emailAddress` (string): **Required** - The email address of the user.
- `phoneNumber` (string): **Required** - The phone number of the user. Ensure it follows the international format.
- `password` (string): **Required** - The password for the user account.
- `firstName` (string): **Required** - The first name of the user.
- `lastName` (string): **Required** - The last name of the user.
- `nickName` (string): **Optional** - A nickname for the user.

**Responses:**

- **Success (201 Created):**
    ```json
    {
        "message": "User signup successful",
        "statusCode": 201,
        "user": {
            "id": "user_id",
            "username": "john_doe",
            "email": "john.doe@example.com",
            "nickName": "Johnny",
            "plan": "basic",
            "userType": "regular",
            "lastLogin": "2024-09-12T00:00:00.000Z"
        }
    }
    ```

- **Error (400 Bad Request):**
    ```json
    {
        "statusCode": 400,
        "message": "Invalid registration data",
        "error": "Bad Request"
    }
    ```

### 2. **User Login**

**Endpoint:** `POST /user/signin`  
**Description:** Authenticates a user and provides a JWT token for access. 

**Request Body:**

```json
{
    "userName": "john_doe",
    "password": "strongPassword123"
}
```

**Request Body Parameters:**
- `userName` (string): **Optional** - The username for login. Use either `userName` or `emailAddress`.
- `emailAddress` (string): **Optional** - The email address for login. Use either `userName` or `emailAddress`.
- `password` (string): **Required** - The password for the user account.

**Responses:**

- **Success (200 OK):**
    ```json
    {
        "message": "User signin successful",
        "statusCode": 200,
        "user": {
            "id": "user_id",
            "username": "john_doe",
            "email": "john.doe@example.com",
            "nickName": "Johnny",
            "plan": "basic",
            "userType": "regular",
            "lastLogin": "2024-09-12T00:00:00.000Z"
        }
    }
    ```

- **Error (401 Unauthorized):**
    ```json
    {
        "statusCode": 401,
        "message": "Unauthorized",
        "error": "Invalid credentials"
    }
    ```


## 🛠️ **Error Handling**

- **400 Bad Request:** Indicates that the request is malformed or missing required fields.
- **401 Unauthorized:** Indicates that the authentication credentials are invalid or missing.
- **500 Internal Server Error:** Indicates that an unexpected error occurred on the server side.

## 🧪 **Testing**

You can test these endpoints using tools like Postman or Insomnia. Ensure that your server is running and accessible, and use the provided request bodies to verify the functionality.

## 📌 **Notes**

- Always ensure the `phoneNumber` follows international standards.
- The `JWT_SECRET` and other sensitive environment variables should be stored securely and not exposed in public repositories.

## Verify Token
Endpoint: POST /user/verify-token
Description: Verifies the JWT token and returns user information if valid. This endpoint is used to check the authenticity of a user's session and retrieve up-to-date user data. Authentication: Requires a valid JWT token in the 'jwt' cookie. Request: No request body required. The JWT token should be sent in the 'jwt' cookie. Responses:

    Success (200 OK):

    json
    {
        "message": "Token is valid",
        "statusCode": 200,
        "user": {
            "id": "user_id",
            "username": "john_doe",
            "email": "john.doe@example.com",
            "nickName": "Johnny",
            "plan": "PRO",
            "userType": "USER",
            "lastLogin": "2024-09-23T12:34:56.789Z"
        }
    }

Error (401 Unauthorized):

json
{
    "statusCode": 401,
    "message": "Invalid token",
    "error": "Unauthorized"
}

Response Parameters:

    message (string): A confirmation message indicating the token's validity.
    statusCode (number): The HTTP status code of the response.
    user (object): An object containing the user's information:
        id (string): The user's unique identifier.
        username (string): The user's username.
        email (string): The user's email address.
        nickName (string): The user's nickname (if set).
        plan (string): The user's current subscription tier (e.g., "TRIAL", "BEGINNER", "PRO", "ENTERPRISE").
        userType (string): The user's role/type (e.g., "USER", "EMPLOYEE", "ADMIN", "SUPER_ADMIN").
        lastLogin (string): Timestamp of the user's last login in ISO 8601 format.

🛠️ Error Handling

    401 Unauthorized: Indicates that the token is invalid, expired, or not provided.
    500 Internal Server Error: Indicates that an unexpected error occurred on the server side.

🧪 Testing
You can test this endpoint using tools like Postman or cURL. Ensure that you have a valid JWT token stored in the 'jwt' cookie. Here's an example using cURL:

bash
curl -X POST http://your-api-domain.com/user/verify-token \
     -H "Cookie: jwt=your_jwt_token_here" \
     -H "Content-Type: application/json"

📌 Notes

    This endpoint automatically updates the user's lastLogin time when successfully verified.
    If the user's subscription has expired, it will be automatically updated to the "TRIAL" tier.
    Ensure that your server is configured to use secure cookies in production environments.
    The JWT token should be kept secure and not exposed to client-side JavaScript.


# Instance Management API

This API provides endpoints for managing WhatsApp instances. All endpoints require authentication using a JWT token.

## Endpoints

### Create Instance

Creates a new WhatsApp instance for the authenticated user.

- **URL**: `/instance/create`
- **Method**: `POST`
- **Auth**: Required

#### Request Body

```json
{
  "name": "My WhatsApp Instance",
  "businessName": "My Business",
  "businessWhatsAppNo": "+1234567890",
  "businessCountry": "US",
  "environment": "PRODUCTION",
  "sessionStorage": "REDIS"
}
```

#### Response

```json
{
  "id": "123456789",
  "name": "My WhatsApp Instance",
  "businessName": "My Business",
  "businessWhatsAppNo": "+1234567890",
  "businessCountry": "US",
  "isActive": true,
  "environment": "PRODUCTION",
  "sessionStorage": "REDIS",
  "createdAt": "2024-09-25T12:00:00Z",
  "userId": "user123"
}
```

### Update Instance

Updates an existing WhatsApp instance.

- **URL**: `/instance/:id`
- **Method**: `PUT`
- **Auth**: Required

#### Request Body

```json
{
  "name": "Updated Instance Name",
  "businessName": "Updated Business Name",
  "isActive": false
}
```

#### Response

```json
{
  "id": "123456789",
  "name": "Updated Instance Name",
  "businessName": "Updated Business Name",
  "businessWhatsAppNo": "+1234567890",
  "businessCountry": "US",
  "isActive": false,
  "environment": "PRODUCTION",
  "sessionStorage": "REDIS",
  "createdAt": "2024-09-25T12:00:00Z",
  "userId": "user123"
}
```

### Delete Instance

Deletes a WhatsApp instance.

- **URL**: `/instance/:id`
- **Method**: `DELETE`
- **Auth**: Required

#### Response

```json
{
  "message": "Instance deleted successfully"
}
```

### Get Instance by ID

Retrieves a specific WhatsApp instance by its ID.

- **URL**: `/instance/:id`
- **Method**: `GET`
- **Auth**: Required

#### Response

```json
{
  "id": "123456789",
  "name": "My WhatsApp Instance",
  "businessName": "My Business",
  "businessWhatsAppNo": "+1234567890",
  "businessCountry": "US",
  "isActive": true,
  "environment": "PRODUCTION",
  "sessionStorage": "REDIS",
  "createdAt": "2024-09-25T12:00:00Z",
  "userId": "user123"
}
```

### Get All Instances

Retrieves all WhatsApp instances for the authenticated user.

- **URL**: `/instance`
- **Method**: `GET`
- **Auth**: Required

#### Response

```json
[
  {
    "id": "123456789",
    "name": "Instance 1",
    "isActive": true,
    "environment": "PRODUCTION"
  },
  {
    "id": "987654321",
    "name": "Instance 2",
    "isActive": false,
    "environment": "DEVELOPMENT"
  }
]
```

### Toggle Instance Active Status

Toggles the active status of a WhatsApp instance.

- **URL**: `/instance/:id/toggle-active`
- **Method**: `PUT`
- **Auth**: Required

#### Response

```json
{
  "id": "123456789",
  "name": "My WhatsApp Instance",
  "isActive": false,
  "environment": "PRODUCTION",
  "sessionStorage": "REDIS"
}
```

## Error Responses

All endpoints may return the following error responses:

- `400 Bad Request`: When the request body is invalid or missing required fields.
- `401 Unauthorized`: When the user is not authenticated or the token is invalid.
- `403 Forbidden`: When the user doesn't have permission to perform the action.
- `404 Not Found`: When the requested instance doesn't exist.
- `500 Internal Server Error`: When an unexpected error occurs on the server.

Example error response:

```json
{
  "statusCode": 400,
  "message": "Invalid input",
  "error": "Bad Request"
}
```

## Notes

- All requests must include a valid JWT token in the Authorization header.
- The `id` parameter in URL paths should be a valid bigint value.
- The `environment` field must be either "DEVELOPMENT" or "PRODUCTION".
- The `sessionStorage` field must be one of "REDIS", "POSTGRESQL", or "MONGODB".

