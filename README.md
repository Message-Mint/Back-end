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

Here's a comprehensive README.md section for the File Service endpoints based on the provided controller code:

# File Service API

The File Service API provides endpoints for managing file uploads, downloads, and user file management. All endpoints are protected by JWT authentication.

## Endpoints

### Upload File

Uploads a file to the server for the authenticated user.

- **URL**: `/files/upload`
- **Method**: `POST`
- **Auth**: Required
- **Content-Type**: `multipart/form-data`

#### Request Body

- `file`: The file to be uploaded (form-data)

#### Success Response (200 OK)

```json
{
  "fileName": "unique_file_name.ext"
}
```

#### Error Response (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "No file uploaded",
  "error": "Bad Request"
}
```

### Get User Files

Retrieves all files for a specific user.

- **URL**: `/files/user/:userId`
- **Method**: `GET`
- **Auth**: Required

#### Success Response (200 OK)

```json
[
  {
    "fileName": "file1.ext",
    "originalName": "original_file1.ext",
    "userId": "user123",
    "uploadDate": "2024-09-25T12:00:00Z"
  },
  {
    "fileName": "file2.ext",
    "originalName": "original_file2.ext",
    "userId": "user123",
    "uploadDate": "2024-09-26T14:30:00Z"
  }
]
```

### Download File

Downloads a specific file for the authenticated user.

- **URL**: `/files/file/:fileName`
- **Method**: `GET`
- **Auth**: Required

#### Success Response

The file will be sent as a downloadable attachment.

#### Headers

```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="filename.ext"
```

### Delete File

Deletes a specific file for the authenticated user.

- **URL**: `/files/:fileName`
- **Method**: `DELETE`
- **Auth**: Required

#### Success Response (200 OK)

```json
{
  "message": "File deleted successfully"
}
```

### Get All User Directories

Retrieves a list of all user directories (admin function).

- **URL**: `/files/all-users`
- **Method**: `GET`
- **Auth**: Required (admin only)

#### Success Response (200 OK)

```json
[
  "user1",
  "user2",
  "user3"
]
```

## Error Handling

All endpoints may return the following error responses:

- `400 Bad Request`: Invalid request or missing file.
- `401 Unauthorized`: Invalid or missing authentication.
- `403 Forbidden`: Insufficient permissions.
- `404 Not Found`: File or user not found.
- `500 Internal Server Error`: Unexpected server error.

## Notes

- All requests must include a valid JWT token in the Authorization header.
- File uploads are limited to a maximum size (configurable on the server).
- User can only access and manage their own files.

## WhatsApp API

This API provides endpoints for managing WhatsApp instances, handling QR code authentication, and generating pairing codes. All endpoints are protected by JWT authentication.

## Endpoints

### Get QR Code Stream

Streams the QR code for WhatsApp authentication.

- **URL**: `/whatsapp/qr/:userId`
- **Method**: `GET`
- **Auth**: Required
- **Response Type**: Server-Sent Events (SSE)

#### Response

The endpoint streams QR code data as Server-Sent Events. Each event contains:

```json
{
  "data": "QR code data or 'Connected!' message"
}
```

The stream completes when the "Connected!" message is received.

#### Error Response

If an error occurs, the stream will emit an error event and complete:

```json
{
  "error": "Error message"
}
```

### Generate Pairing Code

Generates a pairing code for a WhatsApp instance.

- **URL**: `/whatsapp/:instanceId/pairing-code`
- **Method**: `POST`
- **Auth**: Required

#### Request Body

```json
{
  "whatsappNumber": "string"
}
```

#### Response (200 OK)

```json
{
  "pairingCode": "string"
}
```

#### Error Response (500 Internal Server Error)

```json
{
  "statusCode": 500,
  "message": "Error message"
}
```

### Logout Instance

Logs out a WhatsApp instance.

- **URL**: `/whatsapp/logout/:instanceId`
- **Method**: `POST`
- **Auth**: Required

#### Response (200 OK)

```json
{
  "message": "Instance logged out successfully"
}
```

### Close Instance

Closes a WhatsApp instance.

- **URL**: `/whatsapp/close/:instanceId`
- **Method**: `POST`
- **Auth**: Required

#### Response (200 OK)

```json
{
  "message": "Instance Closed successfully"
}
```

## Error Handling

All endpoints may return the following error responses:

- `401 Unauthorized`: When the JWT token is invalid or missing.
- `404 Not Found`: When the specified instance is not found.
- `500 Internal Server Error`: When an unexpected error occurs on the server.

## Notes

- All requests must include a valid JWT token in the Authorization header.
- The QR code stream endpoint uses Server-Sent Events (SSE) for real-time updates.
- The pairing code generation endpoint requires a valid WhatsApp number in the request body.