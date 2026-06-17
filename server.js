require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/task3_database';

app.use(express.json());

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
      minlength: [2, 'name must be at least 2 characters long'],
      maxlength: [100, 'name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'email must be valid'],
    },
    age: {
      type: Number,
      required: [true, 'age is required'],
      min: [1, 'age must be at least 1'],
      max: [120, 'age must be 120 or below'],
    },
    course: {
      type: String,
      required: [true, 'course is required'],
      trim: true,
      minlength: [2, 'course must be at least 2 characters long'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Student = mongoose.model('Student', studentSchema);

function sendJson(res, statusCode, payload) {
  return res.status(statusCode).json(payload);
}

function validateStudentInput(body) {
  const errors = [];

  if (typeof body.name !== 'string' || body.name.trim().length < 2) {
    errors.push('name must be a string with at least 2 characters');
  }

  if (typeof body.email !== 'string' || !/^\S+@\S+\.\S+$/.test(body.email.trim())) {
    errors.push('email must be a valid email address');
  }

  if (!Number.isInteger(body.age) || body.age < 1 || body.age > 120) {
    errors.push('age must be an integer between 1 and 120');
  }

  if (typeof body.course !== 'string' || body.course.trim().length < 2) {
    errors.push('course must be a string with at least 2 characters');
  }

  return errors;
}

app.get('/health', (req, res) => {
  sendJson(res, 200, {
    success: true,
    message: 'API is running',
  });
});

app.get('/api/students', async (req, res, next) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 }).lean();

    sendJson(res, 200, {
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/students/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      sendJson(res, 400, {
        success: false,
        message: 'Invalid student id',
      });
      return;
    }

    const student = await Student.findById(req.params.id).lean();

    if (!student) {
      sendJson(res, 404, {
        success: false,
        message: 'Student not found',
      });
      return;
    }

    sendJson(res, 200, {
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/students', async (req, res, next) => {
  try {
    const validationErrors = validateStudentInput(req.body);

    if (validationErrors.length > 0) {
      sendJson(res, 400, {
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
      return;
    }

    const student = await Student.create({
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      age: req.body.age,
      course: req.body.course.trim(),
    });

    sendJson(res, 201, {
      success: true,
      message: 'Student created successfully',
      data: student,
    });
  } catch (error) {
    next(error);
  }
});

app.put('/api/students/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      sendJson(res, 400, {
        success: false,
        message: 'Invalid student id',
      });
      return;
    }

    const validationErrors = validateStudentInput(req.body);

    if (validationErrors.length > 0) {
      sendJson(res, 400, {
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
      return;
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name.trim(),
        email: req.body.email.trim().toLowerCase(),
        age: req.body.age,
        course: req.body.course.trim(),
      },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedStudent) {
      sendJson(res, 404, {
        success: false,
        message: 'Student not found',
      });
      return;
    }

    sendJson(res, 200, {
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent,
    });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/students/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      sendJson(res, 400, {
        success: false,
        message: 'Invalid student id',
      });
      return;
    }

    const deletedStudent = await Student.findByIdAndDelete(req.params.id).lean();

    if (!deletedStudent) {
      sendJson(res, 404, {
        success: false,
        message: 'Student not found',
      });
      return;
    }

    sendJson(res, 200, {
      success: true,
      message: 'Student deleted successfully',
      data: deletedStudent,
    });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  sendJson(res, 404, {
    success: false,
    message: 'Route not found',
  });
});

app.use((error, req, res, next) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((item) => item.message);
    sendJson(res, 400, {
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  if (error.code === 11000) {
    sendJson(res, 409, {
      success: false,
      message: 'Duplicate value detected',
      errors: ['email must be unique'],
    });
    return;
  }

  sendJson(res, 500, {
    success: false,
    message: 'Internal server error',
  });
});

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`Database API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

startServer();