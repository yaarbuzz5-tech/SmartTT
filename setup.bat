@echo off
REM Quick setup script for SmartTT (Windows)

echo.
echo 🚀 SmartTT Setup Script
echo ======================
echo.

REM Create backend .env
echo 📝 Creating backend .env file...
if not exist "backend\.env" (
  copy "backend\.env.example" "backend\.env"
  echo ✓ Created backend\.env - Please edit with your database credentials
) else (
  echo ✓ backend\.env already exists
)

REM Create frontend .env
echo.
echo 📝 Creating frontend .env file...
if not exist "frontend\.env" (
  copy "frontend\.env.example" "frontend\.env"
  echo ✓ Created frontend\.env
) else (
  echo ✓ frontend\.env already exists
)

REM Install backend dependencies
echo.
echo 📦 Installing backend dependencies...
cd backend
call npm install
cd ..

REM Install frontend dependencies
echo.
echo 📦 Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Edit backend\.env with your database credentials
echo 2. Run the database schema: database/schema.sql
echo 3. Start backend: cd backend && npm start
echo 4. Start frontend: cd frontend && npm start (in a new terminal)
echo.
echo For deployment to Render, see DEPLOYMENT_GUIDE.md
echo.
pause
