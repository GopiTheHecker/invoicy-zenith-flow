
# Invoice Generator Server

This is the backend server for the Invoice Generator application.

## Setup Instructions

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://vichusci:GOPIVAII@cluster0.epz6g.mongodb.net/invoice-app
   JWT_SECRET=your_jwt_secret_here
   ```

4. Run the server:
   ```
   npm run dev
   ```

## API Endpoints

### User Routes
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/bank-details` - Update bank details (protected)

### Invoice Routes
- `GET /api/invoices` - Get all invoices (protected)
- `GET /api/invoices/:id` - Get invoice by ID (protected)
- `POST /api/invoices` - Create new invoice (protected)
- `PUT /api/invoices/:id` - Update invoice (protected)
- `DELETE /api/invoices/:id` - Delete invoice (protected)
