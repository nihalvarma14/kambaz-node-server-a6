import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// GET all quizzes for a course
router.get('/', async (req, res) => {
  try {
    const { courseId } = req.query;
    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }
    
    const db = mongoose.connection.db;
    const collection = db.collection('quizzes');
    const quizzes = await collection.find({ course: courseId }).toArray();
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create quiz
router.post('/', async (req, res) => {
  try {
    const quiz = req.body;
    quiz._id = quiz._id || new Date().getTime().toString();
    quiz.published = quiz.published || false;
    quiz.questions = quiz.questions || [];

    const db = mongoose.connection.db;
    const collection = db.collection('quizzes');
    await collection.insertOne(quiz);

    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET quiz by ID
router.get('/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const db = mongoose.connection.db;
    const collection = db.collection('quizzes');
    const quiz = await collection.findOne({ _id: quizId });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update quiz
router.put('/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const updates = req.body;
    const db = mongoose.connection.db;
    const collection = db.collection('quizzes');

    const result = await collection.findOneAndUpdate(
      { _id: quizId },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE quiz
router.delete('/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const db = mongoose.connection.db;
    
    const quizzesCollection = db.collection('quizzes');
    const result = await quizzesCollection.deleteOne({ _id: quizId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questionsCollection = db.collection('questions');
    await questionsCollection.deleteMany({ quiz: quizId });

    const attemptsCollection = db.collection('attempts');
    await attemptsCollection.deleteMany({ quiz: quizId });

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET questions for a quiz
router.get('/:quizId/questions', async (req, res) => {
  try {
    const { quizId } = req.params;
    const db = mongoose.connection.db;
    const collection = db.collection('questions');
    const questions = await collection.find({ quiz: quizId }).toArray();
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create question for quiz
router.post('/:quizId/questions', async (req, res) => {
  try {
    const { quizId } = req.params;
    const question = req.body;
    question.quiz = quizId;
    question._id = question._id || new Date().getTime().toString();

    const db = mongoose.connection.db;
    const collection = db.collection('questions');
    await collection.insertOne(question);

    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update question
router.put('/questions/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const updates = req.body;
    const db = mongoose.connection.db;
    const collection = db.collection('questions');

    const result = await collection.findOneAndUpdate(
      { _id: questionId },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE question
router.delete('/questions/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const db = mongoose.connection.db;
    const collection = db.collection('questions');

    const result = await collection.deleteOne({ _id: questionId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST submit quiz attempt
router.post('/:quizId/attempts', async (req, res) => {
  try {
    const { quizId } = req.params;
    const attempt = req.body;
    attempt.quiz = quizId;
    attempt._id = attempt._id || new Date().getTime().toString();
    attempt.submittedAt = new Date().toISOString();

    const db = mongoose.connection.db;
    const collection = db.collection('attempts');
    await collection.insertOne(attempt);

    res.status(201).json(attempt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET attempts for a quiz by user
router.get('/:quizId/attempts/:userId', async (req, res) => {
  try {
    const { quizId, userId } = req.params;
    const db = mongoose.connection.db;
    const collection = db.collection('attempts');
    const attempts = await collection.find({ quiz: quizId, user: userId }).toArray();
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;