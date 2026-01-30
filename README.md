# SmartTT - Intelligent Timetable Generation System

A comprehensive web-based system for generating optimized timetables for educational institutions using advanced algorithms (Backtracking and Greedy approaches).

## Project Structure

```
SmartTT/
├── backend/                 # Node.js + Express backend
│   ├── src/
│   │   ├── config/         # Database and Express configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── algorithms/     # Timetable generation algorithms
│   │   └── middleware/     # Custom middleware
│   ├── package.json        # Backend dependencies
│   ├── .env               # Environment variables
│   └── server.js          # Entry point
│
├── frontend/               # React.js frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── styles/        # CSS stylesheets
│   │   ├── App.js         # Main App component
│   │   └── index.js       # Entry point
│   ├── public/            # Static files
│   ├── package.json       # Frontend dependencies
│   └── .env              # Environment variables
│
├── database/              # Database scripts
│   ├── schema.sql        # PostgreSQL schema
│   ├── init.bat         # Windows initialization script
│   └── init.sh          # Linux/Mac initialization script
│
└── AGENTIC_PROMPT.md     # System requirements and specifications

```

## Features

### Admin Panel
- ✅ Manage Professors (Add, Edit, Delete)
- ✅ Manage Subjects (Add, Edit, Delete)
- ✅ Map Professors to Subjects
- ✅ Assign Subjects to Branches
- ✅ View Student Feedback

### Professor Panel
- ✅ View Personal Timetable
- ✅ Create and Manage Assignments
- ✅ Upload Assignments (Text, PDF, Link, Image)
- ✅ Track Assigned Classes

### Student Panel
- ✅ View Personal Timetable by Branch/Semester/Batch
- ✅ View All Assignments
- ✅ Submit Feedback
- ✅ Rate Classes and Resources

### Timetable Generation
- ✅ Backtracking Algorithm for Theory Lectures (v2.2)
- ✅ Greedy Algorithm with Capacity Constraints for Labs
- ✅ Lab Capacity Constraint (Max 5 labs per time slot)
- ✅ Batch Allocation Support (Parallel allocation - both batches, same time)
- ✅ Break and Recess Scheduling (11:00-11:15, 13:15-14:00)
- ✅ Library Hour Allocation (Friday 4:00-5:00 PM)
- ✅ Project Hour Support (Thursday 4:00-5:00 PM, Sem 3-8 only)
- ✅ Multi-Branch Subject Handling (Different lab slots per branch)
- ✅ Conflict Detection and Resolution
- ✅ Professor Availability Checking
- ✅ Intelligent Slot Preferences (Afternoon > Morning for labs)
- ✅ **NEW (v2.1)**: Theory-Lab Conflict Prevention (no overlap)
- ✅ **NEW (v2.1)**: Parallel Lab Prevention (only 1 lab per time slot)
- ✅ **NEW (v2.1)**: Theory Afternoon Preference (16:00→15:00→14:00)
- ✅ **NEW (v2.2)**: Explicit Batch Allocation (both batches assigned to each lab)

## Technology Stack

- **Frontend**: React.js, Axios, React Router
- **Backend**: Node.js, Express.js, PostgreSQL
- **Database**: PostgreSQL (SMARTTT)
- **Algorithms**: Backtracking, Greedy Algorithm

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager
- Git

## Installation

### 1. Database Setup

**Windows:**
```bash
cd database
init.bat
```

**Linux/Mac:**
```bash
cd database
chmod +x init.sh
./init.sh
```

This will create the SMARTTT database with all necessary tables.

### 2. Backend Setup

```bash
cd backend
npm install
```

Create/Update `.env` file:
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=soham2255
DB_NAME=SMARTTT
JWT_SECRET=your_jwt_secret_key
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create/Update `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Running the Application

### Start Backend Server

```bash
cd backend
npm run dev  # Development mode with nodemon
# or
npm start   # Production mode
```

Backend will run on: **http://localhost:5000**

### Start Frontend Server

```bash
cd frontend
npm start
```

Frontend will run on: **http://localhost:3000**

## API Endpoints

### Admin Routes
- `POST /api/admin/professors` - Add professor
- `GET /api/admin/professors` - Get all professors
- `DELETE /api/admin/professors/:id` - Delete professor
- `POST /api/admin/subjects` - Add subject
- `GET /api/admin/subjects` - Get all subjects
- `DELETE /api/admin/subjects/:id` - Delete subject
- `POST /api/admin/professors/:id/subjects/:subjectId` - Map professor to subject
- `DELETE /api/admin/professors/:id/subjects/:subjectId` - Unmap professor
- `GET /api/admin/feedback` - Get all feedback

### Professor Routes
- `GET /api/professor/timetable/:professorId` - Get professor timetable
- `POST /api/professor/assignments` - Add assignment
- `GET /api/professor/assignments/:professorId` - Get professor assignments
- `DELETE /api/professor/assignments/:id` - Delete assignment

### Student Routes
- `GET /api/student/timetable/:branchId/:semester` - Get student timetable
- `GET /api/student/assignments/:branchId/:semester` - Get assignments
- `POST /api/student/feedback` - Submit feedback

### Timetable Routes
- `POST /api/timetable/generate` - Generate new timetable
- `GET /api/timetable/view/:branchId/:semester` - View timetable
- `GET /api/timetable/conflicts/:branchId/:semester` - Get scheduling conflicts
- `POST /api/timetable/validate` - Validate timetable
- `DELETE /api/timetable/clear/:branchId/:semester` - Clear timetable

## Database Schema

### Key Tables
- **professors** - Professor information
- **subjects** - Subject details
- **branches** - Branch/Department information
- **timetable** - Generated timetable slots
- **assignments** - Professor assignments
- **student_feedback** - Student feedback
- **professors_subjects** - Many-to-many mapping
- **subjects_branches** - Many-to-many mapping
- **batches** - Batch information (A/B divisions)

## Algorithm Details

### Timetable Generation Algorithm (v2.0)

#### 1. **Theory Lecture Scheduling (Backtracking)**
   - Recursive constraint satisfaction with depth limit (100 iterations)
   - Sort subjects by lecture count (most constrained first)
   - Check professor availability before assigning slot
   - Backtrack if slot assignment fails, try next slot
   - Optimal slot selection with efficient search

#### 2. **Lab Scheduling (Greedy with Constraints)**
   - Maximum 5 labs per time slot
   - 2 labs per week per subject (1 per batch)
   - Multi-branch support: Different lab slots for same subject in different branches
   - Preference order: Afternoon (2-5 PM) > Mid-morning (10-2 PM) > Early morning (9-12 PM)
   - Capacity enforcement to prevent oversaturation

#### 3. **Break and Special Hours**
   - **Tea Break**: 11:00 AM - 11:15 AM (15 minutes, all days)
   - **Recess**: 1:15 PM - 2:00 PM (45 minutes, all days)
   - **Library Hour**: Friday 4:00-5:00 PM (once per week)
   - **Project Hour**: Thursday 4:00-5:00 PM (once per week, Semester 3-8 only)

#### 4. **Batch Fairness**
   - Batch A & B alternate in different time slots
   - Fair distribution of lab times across week
   - Common theory slots apply to all batches

#### 5. **Conflict Resolution**
   - Automatic professor availability checking
   - Lab capacity constraint enforcement
   - Time slot conflict prevention
   - Automatic backtracking on constraint violation

### Time Slot Generation
- Automatically excludes tea break (11:00-11:15)
- Automatically excludes recess (13:15-14:00)
- Generates ~40 available 1-hour slots per week
- College hours: 9:00 AM - 5:00 PM

### Multi-Branch Subject Handling
When a subject is taught in multiple branches:
- **Theory Classes**: All branches share the same theory slot
- **Labs**: Each branch gets completely different lab time slots
- Ensures no conflicts between branches for same subject

## Usage Examples

### Generate Timetable
```javascript
POST /api/timetable/generate
{
  "branchId": "uuid",
  "semester": 3
}
```

### Add Professor
```javascript
POST /api/admin/professors
{
  "name": "Dr. John Doe",
  "email": "john@university.edu",
  "phone": "9876543210",
  "department": "CSE"
}
```

### Add Subject
```javascript
POST /api/admin/subjects
{
  "name": "Database Management Systems",
  "code": "CS301",
  "type": "BOTH",
  "semester": 3,
  "weeklyLectureCount": 3,
  "weeklyLabCount": 1,
  "credits": 4
}
```

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check credentials in `.env`
- Verify database SMARTTT exists

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Dependencies Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Future Enhancements

- [ ] User authentication and authorization
- [ ] Email notifications
- [ ] Mobile app
- [ ] Advanced reporting and analytics
- [ ] Room allocation optimization
- [ ] Classroom capacity consideration
- [ ] Holiday calendar management
- [ ] Real-time conflict resolution
- [ ] Performance optimization for large datasets

## Documentation

### Algorithm Documentation
- **TIMETABLE_ALGORITHM_V2.md** - Complete algorithm rules, examples, and constraints
- **ALGORITHM_V2_COMPLETE.md** - Implementation summary and feature list
- **IMPLEMENTATION_SUMMARY_V2.md** - Technical details with code examples

### Testing & Deployment
- **POST_IMPLEMENTATION_CHECKLIST.md** - Step-by-step verification guide
- **test_algorithm_v2.sh** - Automated and manual test suite

### Admin Guides
- **ADMIN_GUIDE.md** - System administration guide
- **AGENTIC_PROMPT.md** - System requirements and specifications
- **UPDATES.md** - Version history and changelog

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues, suggestions, or questions:
- Create an issue in the repository
- Contact the development team
- Check existing documentation

## Authors

- SmartTT Development Team

## Acknowledgments

- Built with React, Node.js, and PostgreSQL
- Advanced scheduling algorithms
- Educational institution requirements focus

---

**Last Updated**: January 2026
**Version**: 1.0.0
