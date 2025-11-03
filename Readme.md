# miniExam

A lightweight Node.js application for conducting time-based mini exams with pre-set questions and automatic result evaluation.


## Installation

```bash
git clone https://github.com/Flexavior/miniExam.git
cd miniExam
npm install

npm start
Visit http://localhost in your browser to begin the exam.

```

## Complete Feature Set

### Exam Management

- ✅ Exam selection with search/filtering
- ✅ Random question and option shuffling
- ✅ Timer with color-coded warnings
- ✅ Fullscreen mode with input restrictions
- ✅ Previous/Next navigation with answer saving

### Results System

- ✅ Unique exam identifiers (`ExamDDMMYY_Name`)
- ✅ Comprehensive result storage with timestamps
- ✅ Paginated results display (6 per page)
- ✅ Advanced search by ID, name, or exam type
- ✅ Detailed modal views with question reviews

### User Experience

- ✅ Responsive design for all devices
- ✅ Tabbed interface (Exams | Results)
- ✅ Loading states and error handling
- ✅ Professional UI with smooth animations
- ✅ Security features (copy-paste prevention, etc.)

### Data Organization

- ✅ Exams in dedicated `/exams/` folder
- ✅ Results in `results.json`
- ✅ Images in `/images/` folder
- ✅ Proper path handling for all assets

##  How to Use

### Taking an Exam

1. Select exam from "Available Exams" tab
2. Use search to filter if needed
3. Enter name and select question count
4. Note your Exam ID during the test
5. Complete exam with timer and security features

### Viewing Results

1. Switch to "View Results" tab
2. Search by Exam ID, candidate name, or exam type
3. Browse paginated results
4. Click "View Details" for complete review
5. Use Previous/Next for navigation

### Scalability

- Handles hundreds of exams efficiently
- Paginated results prevent performance issues
- Search functionality for quick access
- Organized file structure for maintenance

## License
This project is licensed under the MIT License. 

"# Flexavior-miniExam"
