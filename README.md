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
