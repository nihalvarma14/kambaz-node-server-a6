import express from 'express';
import mongoose from 'mongoose';
import { createSession, getSession, deleteSession } from '../session.js';

const router = express.Router();

// ========== AUTHENTICATION ROUTES (MUST BE FIRST) ==========

// POST signin
router.post('/signin', async (req, res) => {
  try {
    console.log('Signin request:', req.body);
    const { username, password } = req.body;
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    const user = await collection.findOne({ username, password });

    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const sessionId = createSession(user._id, {
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });

    req.session.sessionId = sessionId;
    console.log('Session created:', sessionId);
    
    res.json(user);
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST signup
router.post('/signup', async (req, res) => {
  try {
    const user = req.body;
    const db = mongoose.connection.db;
    const collection = db.collection('users');

    const existingUser = await collection.findOne({ username: user.username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    user._id = new Date().getTime().toString();
    user.role = user.role || 'USER';

    await collection.insertOne(user);

    const sessionId = createSession(user._id, {
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });

    req.session.sessionId = sessionId;
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET profile
router.get('/profile', (req, res) => {
  try {
    console.log('Profile request received');
    console.log('Session:', req.session);
    
    const sessionId = req.session?.sessionId;

    if (!sessionId) {
      console.log('No session ID found');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = getSession(sessionId);

    if (!user) {
      console.log('No user found for session');
      return res.status(401).json({ message: 'Session expired' });
    }

    console.log('User found:', user);
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST signout
router.post('/signout', (req, res) => {
  try {
    const sessionId = req.session.sessionId;

    if (sessionId) {
      deleteSession(sessionId);
    }

    req.session.destroy();
    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET current user's courses
router.get('/current/courses', async (req, res) => {
  try {
    const sessionId = req.session.sessionId;
    if (!sessionId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = getSession(sessionId);
    if (!user) {
      return res.status(401).json({ message: 'Session expired' });
    }

    const db = mongoose.connection.db;
    const enrollmentsCollection = db.collection('enrollments');
    const enrollments = await enrollmentsCollection.find({ user: user._id }).toArray();

    const courseIds = enrollments.map(e => e.course);

    const coursesCollection = db.collection('courses');
    const courses = await coursesCollection.find({ _id: { $in: courseIds } }).toArray();

    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create course for current user
router.post('/current/courses', async (req, res) => {
  try {
    const sessionId = req.session.sessionId;
    if (!sessionId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = getSession(sessionId);
    if (!user) {
      return res.status(401).json({ message: 'Session expired' });
    }

    const course = req.body;
    course._id = new Date().getTime().toString();

    const db = mongoose.connection.db;
    const coursesCollection = db.collection('courses');
    await coursesCollection.insertOne(course);

    const enrollmentsCollection = db.collection('enrollments');
    await enrollmentsCollection.insertOne({
      _id: `${user._id}-${course._id}`,
      user: user._id,
      course: course._id,
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== USER CRUD ROUTES ==========

// GET all users or filter by role/name (MUST BE BEFORE /:userId)
router.get('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('users');

    const { role, name } = req.query;
    let filter = {};

    if (role) {
      filter.role = role;
    }

    if (name) {
      const regex = new RegExp(name, 'i');
      filter.$or = [
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } }
      ];
    }

    const users = await collection.find(filter).toArray();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new user
router.post('/', async (req, res) => {
  try {
    const user = req.body;
    if (!user._id) {
      user._id = new Date().getTime().toString();
    }

    const db = mongoose.connection.db;
    const collection = db.collection('users');
    await collection.insertOne(user);

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET enrollments for user
router.get('/:userId/enrollments', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = mongoose.connection.db;
    const collection = db.collection('enrollments');
    const enrollments = await collection.find({ user: userId }).toArray();
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST enroll user in course
router.post('/:userId/courses/:courseId', async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    const db = mongoose.connection.db;
    const collection = db.collection('enrollments');

    const existing = await collection.findOne({ user: userId, course: courseId });
    if (existing) {
      return res.json({ message: 'Already enrolled' });
    }

    const enrollment = {
      _id: `${userId}-${courseId}`,
      user: userId,
      course: courseId,
    };

    await collection.insertOne(enrollment);
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE unenroll user from course
router.delete('/:userId/courses/:courseId', async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    const db = mongoose.connection.db;
    const collection = db.collection('enrollments');

    const result = await collection.deleteOne({ user: userId, course: courseId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    res.json({ message: 'Unenrolled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET user by ID (MUST BE LAST)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    const user = await collection.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update user
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const db = mongoose.connection.db;
    const collection = db.collection('users');

    const result = await collection.findOneAndUpdate(
      { _id: userId },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE user
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = mongoose.connection.db;
    const collection = db.collection('users');

    const result = await collection.deleteOne({ _id: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;