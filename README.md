# HRMS - Complete Full-Stack HR Management System

This is a comprehensive, full-stack Human Resources Management System built with a modern technology stack. It provides a complete solution for managing employees, departments, attendance, leave, and payroll, secured with mandatory Multi-Factor Authentication.

## Features

- **Role-Based Access Control** (Admin, HR, Manager, Employee)
- **Employee & Department Management** (CRUD operations)
- **Persistent & Automated Attendance Tracking** with a backend-driven live timer that runs even when logged out.
- **Leave Management** (requests, approvals, balances)
- **Payroll Processing** and payslip generation
- **Reporting Dashboard**
- **Secure Authentication** with **mandatory Multi-Factor Authentication (MFA)** for all users.

---

## Technology Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Axios
- **Backend:** Node.js, Express, TypeScript, Prisma ORM
- **Database:** SQLite (zero-setup, file-based)
- **Authentication:** JWT (JSON Web Tokens), `bcryptjs` for hashing, `speakeasy` for MFA

---

## How to Set Up and Run the Project in VS Code

Follow these simple, one-time setup steps to get the entire application running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [Visual Studio Code](https://code.visualstudio.com/) (or any other code editor)

### Step 1: Open the Project in VS Code

1.  Unzip the project files into a folder on your computer.
2.  Open VS Code.
3.  Go to `File > Open Folder...` and select the main project folder (the one containing the `client` and `server` directories).

### Step 2: Install All Dependencies (One Command)

This command will install all the necessary packages for both the frontend and the backend at the same time.

1.  Open the integrated terminal in VS Code by going to `Terminal > New Terminal`.
2.  Make sure your terminal is in the root project directory (e.g., `hrms-fullstack`).
3.  Run the following command:

    ```bash
    npm install
    ```

### Step 3: Set Up the Database (One Command)

This command will create your local SQLite database file and automatically fill it with the starting demo data.

1.  In the VS Code terminal, navigate into the `server` directory:

    ```bash
    cd server
    ```

2.  Run the Prisma push command:

    ```bash
    npx prisma db push
    ```
    *This will apply the schema and run the seed script.*

### Step 4: Run the Full Application (One Command)

This final command starts both the backend API server and the frontend development server simultaneously.

1.  In the terminal, navigate back to the main project root directory:

    ```bash
    cd ..
    ```

2.  Run the development script:

    ```bash
    npm run dev
    ```

After a few moments, your web browser should **automatically open** to `http://localhost:5173`, and the HRMS application will be fully running.

---

## How to Access Frontend and Backend

- **Frontend (Website):** `http://localhost:5173`
  - This is where you will see and interact with the application.

- **Backend (API):** `http://localhost:3001`
  - You can open this URL in your browser to see a welcome message. The frontend communicates with this API in the background.

## Demo Accounts

You can log in with the following credentials. The password for all demo accounts is `password123`.

- `admin@hrms.com`
- `hr@hrms.com`
- `manager@hrms.com`
- `employee@hrms.com`

**Note:** All users will be required to complete a one-time MFA setup upon their first login. You can use an authenticator app like Google Authenticator or Authy.
