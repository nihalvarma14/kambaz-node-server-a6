import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// GET assignment by ID
router.get('/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const db = mongoose.connection.db;
    const collection = db.collection('assignments');
    const assignment = await collection.findOne({ _id: assignmentId });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update assignment
router.put('/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const updates = req.body;
    const db = mongoose.connection.db;
    const collection = db.collection('assignments');

    const result = await collection.findOneAndUpdate(
      { _id: assignmentId },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE assignment
router.delete('/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const db = mongoose.connection.db;
    const collection = db.collection('assignments');

    const result = await collection.deleteOne({ _id: assignmentId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;