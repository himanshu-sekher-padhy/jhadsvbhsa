const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// MongoDB connection
const mongoURI = 'mongodb+srv://Admin:sZyTYyK6c5uQhVJR@cluster0.gnd8jqi.mongodb.net/studentdb';
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Schema definitions
const studentSchema = new mongoose.Schema({
    name: String,
    rollno: String,
    phone: String,
    address: String,
    img: String,
});

const parentSchema = new mongoose.Schema({
    name: String,
    Studntroll: String,
    phone: String,
    address: String
});

const markSchema = new mongoose.Schema({
    rollno: String,
    classtest: Number,
    cycletest: Number
})

const teacherSchema = new mongoose.Schema({
    name: String,
    empid: String,
    cls_assign: String,
    phone: String,
    img: String
});

const principalSchema = new mongoose.Schema({
    name: String,
    empid: String,
    phone: String,
    img: String
});

const superuserSchema = new mongoose.Schema({
    name: String,
    empid: String,
    phone: String,
    img: String
});

const attendanceSchema = new mongoose.Schema({
    rollno: String,
    date: Date,
    status: String
});

// Models
const Student = mongoose.model('Student', studentSchema);
const Teacher = mongoose.model('Teacher', teacherSchema);
const Principal = mongoose.model('Principal', principalSchema);
const Superuser = mongoose.model('Superuser', superuserSchema);
const Mark = mongoose.model('Mark', markSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const Parent = mongoose.model('Parent', parentSchema);

// Parent routes
// Signup route
app.post('/parent-signup', async (req, res) => {
    try {
        const { name, Studntroll, phone, address } = req.body;

        // Check if a parent with the same student roll number already exists
        const existingParent = await Parent.findOne({ Studntroll });
        if (existingParent) {
            return res.status(400).json({ error: 'Parent with this student roll number already exists.' });
        }

        // Create a new parent document
        const newParent = new Parent({ name, Studntroll, phone, address });
        await newParent.save();

        // Respond with the new parent's information
        res.status(201).json(newParent);
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login route
app.post('/parent-login', async (req, res) => {
    try {
        const { name, Studntroll } = req.body;

        // Find a parent matching the provided name and student roll number
        const parent = await Parent.findOne({ name, Studntroll });

        if (!parent) {
            return res.status(401).json({ error: 'Invalid name or student roll number' });
        }

        // Respond with the parent's ID (or other relevant info)
        res.status(200).json({ _id: parent._id });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/parents', async (req, res) => {
    const parents = await Parent.find();
    res.json(parents);
});

// routes/parent.js
// Fetch parent details by ID
app.get('/parent/:id', async (req, res) => {
    try {
        const parent = await Parent.findById(req.params.id);
        if (!parent) {
            return res.status(404).json({ error: 'Parent not found' });
        }
        res.json(parent);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});



// Other routes (students, teachers, principals, superusers, marks, attendance)
// ... (as provided in your original code)

// Student routes
app.get('/students', async (req, res) => {
    const students = await Student.find();
    res.json(students);
});

app.post('/students', upload.single('img'), async (req, res) => {
    const newStudent = new Student({
        name: req.body.name,
        rollno: req.body.rollno,
        phone: req.body.phone,
        address: req.body.address,
        img: req.file ? `/uploads/${req.file.filename}` : ''
    });
    await newStudent.save();
    res.json(newStudent);
});

app.put('/students/:id', upload.single('img'), async (req, res) => {
    const updatedStudentData = {
        name: req.body.name,
        rollno: req.body.rollno,
        phone: req.body.phone,
        address: req.body.address
    };
    if (req.file) {
        updatedStudentData.img = `/uploads/${req.file.filename}`;
    }
    const updatedStudent = await Student.findByIdAndUpdate(req.params.id, updatedStudentData, { new: true });
    res.json(updatedStudent);
});

app.get('/students/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (student) {
            res.json(student);
        } else {
            res.status(404).json({ error: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching student details' });
    }
});

app.post('/login', async (req, res) => {
    const { name, rollno } = req.body;
    try {
        const student = await Student.findOne({ name, rollno });
        if (student) {
            res.json(student);
        } else {
            res.status(400).json({ error: 'Invalid name or roll number' });
        }
    } catch (error) {
        res.status(500).json({ error: 'An error occurred during the login process' });
    }
});

// Route to get all student roll numbers
app.get('/student-rolls', async (req, res) => {
    try {
        const students = await Student.find({}, 'rollno'); // Fetch only the roll numbers
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching student roll numbers' });
    }
});

// Route to save student marks
app.post('/save-marks', async (req, res) => {
    const { marks } = req.body;

    try {
        for (const { rollno, mark, type } of marks) {
            const updateField = type === 'classtest' ? { classtest: mark } : { cycletest: mark };
            await Mark.findOneAndUpdate(
                { rollno },
                { $set: updateField },
                { upsert: true, new: true }
            );
        }
        res.status(200).json({ message: 'Marks saved successfully' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while saving marks' });
    }
});

// Route to get marks by roll number
app.get('/marks/:rollno', async (req, res) => {
    try {
        const { rollno } = req.params;
        const marks = await Mark.findOne({ rollno });

        if (marks) {
            res.json(marks);
        } else {
            res.status(404).json({ error: 'Marks not found for this roll number' });
        }
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching marks' });
    }
});

// Route to save attendance records
app.post('/save-attendance', async (req, res) => {
    try {
        const { date, attendanceRecords } = req.body;

        // Convert the date to a JavaScript Date object
        const attendanceDate = new Date(date);

        // Iterate over the attendance records and save each to the database
        const savedRecords = await Promise.all(attendanceRecords.map(async record => {
            const attendance = new Attendance({
                rollno: record.rollno,
                date: attendanceDate,
                status: record.status
            });
            return attendance.save();
        }));

        res.status(200).json({ message: 'Attendance saved successfully!', savedRecords });
    } catch (error) {
        console.error('Error saving attendance:', error);
        res.status(500).json({ message: 'Failed to save attendance' });
    }
});

// Route to get attendance by roll number
app.get('/attendance/:rollno', async (req, res) => {
    try {
        const { rollno } = req.params;
        const attendanceRecords = await Attendance.find({ rollno }).sort({ date: -1 });

        if (attendanceRecords.length > 0) {
            res.json(attendanceRecords);
        } else {
            res.status(404).json({ error: 'No attendance records found for this roll number' });
        }
    } catch (error) {
        console.error('Error fetching attendance records:', error);
        res.status(500).json({ error: 'An error occurred while fetching attendance records' });
    }
});

// Teacher routes
app.get('/teachers', async (req, res) => {
    const teachers = await Teacher.find();
    res.json(teachers);
});

app.post('/teachers', upload.single('img'), async (req, res) => {
    const newTeacher = new Teacher({
        name: req.body.name,
        empid: req.body.empid,
        cls_assign: req.body.cls_assign,
        phone: req.body.phone,
        img: req.file ? `/uploads/${req.file.filename}` : ''
    });
    await newTeacher.save();
    res.json(newTeacher);
});

app.put('/teachers/:id', upload.single('img'), async (req, res) => {
    const updatedTeacherData = {
        name: req.body.name,
        empid: req.body.empid,
        cls_assign: req.body.cls_assign,
        phone: req.body.phone
    };
    if (req.file) {
        updatedTeacherData.img = `/uploads/${req.file.filename}`;
    }
    const updatedTeacher = await Teacher.findByIdAndUpdate(req.params.id, updatedTeacherData, { new: true });
    res.json(updatedTeacher);
});

app.get('/teachers/:id', async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (teacher) {
            res.json(teacher);
        } else {
            res.status(404).json({ error: 'Teacher not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching teacher details' });
    }
});

app.post('/teacher-login', async (req, res) => {
    const { name, empid } = req.body;
    try {
        const teacher = await Teacher.findOne({ name, empid });
        if (teacher) {
            res.json(teacher);
        } else {
            res.status(400).json({ error: 'Invalid name or employee ID' });
        }
    } catch (error) {
        res.status(500).json({ error: 'An error occurred during the login process' });
    }
});

app.get('/principals', async (req, res) => {
    const principals = await Principal.find();
    res.json(principals);
});

app.post('/principals', upload.single('img'), async (req, res) => {
    const newPrincipal = new Principal({
        name: req.body.name,
        empid: req.body.empid,
        phone: req.body.phone,
        img: req.file ? `/uploads/${req.file.filename}` : ''
    });
    await newPrincipal.save();
    res.json(newPrincipal);
});

app.put('/principals/:id', upload.single('img'), async (req, res) => {
    const updatedPrincipalData = {
        name: req.body.name,
        empid: req.body.empid,
        phone: req.body.phone
    };
    if (req.file) {
        updatedPrincipalData.img = `/uploads/${req.file.filename}`;
    }
    const updatedPrincipal = await Principal.findByIdAndUpdate(req.params.id, updatedPrincipalData, { new: true });
    res.json(updatedPrincipal);
});

app.get('/principals/:id', async (req, res) => {
    try {
        const principal = await Principal.findById(req.params.id);
        if (principal) {
            res.json(principal);
        } else {
            res.status(404).json({ error: 'Principal not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching principal details' });
    }
});

app.post('/principal-login', async (req, res) => {
    const { name, empid } = req.body;
    try {
        const principal = await Principal.findOne({ name, empid });
        if (principal) {
            res.json(principal);
        } else {
            res.status(400).json({ error: 'Invalid name or employee ID' });
        }
    } catch (error) {
        res.status(500).json({ error: 'An error occurred during the login process' });
    }
});

app.get('/superusers', async (req, res) => {
    const superusers = await Superuser.find();
    res.json(superusers);
});

app.post('/superusers', upload.single('img'), async (req, res) => {
    const newSuperuser = new Superuser({
        name: req.body.name,
        empid: req.body.empid,
        phone: req.body.phone,
        img: req.file ? `/uploads/${req.file.filename}` : ''
    });
    await newSuperuser.save();
    res.json(newSuperuser);
});

app.put('/superusers/:id', upload.single('img'), async (req, res) => {
    const updatedSuperuserData = {
        name: req.body.name,
        empid: req.body.empid,
        phone: req.body.phone
    };
    if (req.file) {
        updatedSuperuserData.img = `/uploads/${req.file.filename}`;
    }
    const updatedSuperuser = await Superuser.findByIdAndUpdate(req.params.id, updatedSuperuserData, { new: true });
    res.json(updatedSuperuser);
});

app.get('/superusers/:id', async (req, res) => {
    try {
        const superuser = await Superuser.findById(req.params.id);
        if (superuser) {
            res.json(superuser);
        } else {
            res.status(404).json({ error: 'Superuser not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching superuser details' });
    }
});

app.post('/superuser-login', async (req, res) => {
    const { name, empid } = req.body;
    try {
        const superuser = await Superuser.findOne({ name, empid });
        if (superuser) {
            res.json(superuser);
        } else {
            res.status(400).json({ error: 'Invalid name or employee ID' });
        }
    } catch (error) {
        res.status(500).json({ error: 'An error occurred during the login process' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
