import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// GET all courses
router.get('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('courses');
    const courses = await collection.find({}).toArray();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new course
router.post('/', async (req, res) => {
  try {
    const course = req.body;
    if (!course._id) {
      course._id = new Date().getTime().toString();
    }

    const db = mongoose.connection.db;
    const collection = db.collection('courses');
    await collection.insertOne(course);

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET course by ID
router.get('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const db = mongoose.connection.db;
    const collection = db.collection('courses');
    const course = await collection.findOne({ _id: courseId });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update course
router.put('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const updates = req.body;
    const db = mongoose.connection.db;
    const collection = db.collection('courses');

    const result = await collection.findOneAndUpdate(
      { _id: courseId },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE course
router.delete('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const db = mongoose.connection.db;
    const collection = db.collection('courses');

    const result = await collection.deleteOne({ _id: courseId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET modules for a course
router.get('/:courseId/modules', async (req, res) => {
  try {
    const { courseId } = req.params;
    const db = mongoose.connection.db;
    const collection = db.collection('modules');
    const modules = await collection.find({ course: courseId }).toArray();
    res.json(modules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create module for course
router.post('/:courseId/modules', async (req, res) => {
  try {
    const { courseId } = req.params;
    const module = req.body;
    module.course = courseId;
    if (!module._id) {
      module._id = new Date().getTime().toString();
    }

    const db = mongoose.connection.db;
    const collection = db.collection('modules');
    await collection.insertOne(module);

    res.status(201).json(module);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET assignments for a course
router.get('/:courseId/assignments', async (req, res) => {
  try {
    const { courseId } = req.params;
    const db = mongoose.connection.db;
    const collection = db.collection('assignments');
    const assignments = await collection.find({ course: courseId }).toArray();
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create assignment for course
router.post('/:courseId/assignments', async (req, res) => {
  try {
    const { courseId } = req.params;
    const assignment = req.body;
    assignment.course = courseId;
    if (!assignment._id) {
      assignment._id = new Date().getTime().toString();
    }

    const db = mongoose.connection.db;
    const collection = db.collection('assignments');
    await collection.insertOne(assignment);

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET enrollments for a course
router.get('/:courseId/enrollments', async (req, res) => {
  try {
    const { courseId } = req.params;
    const db = mongoose.connection.db;
    const collection = db.collection('enrollments');
    const enrollments = await collection.find({ course: courseId }).toArray();
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;