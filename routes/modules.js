import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// GET module by ID
router.get('/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const db = mongoose.connection.db;
    const collection = db.collection('modules');
    const module = await collection.findOne({ _id: moduleId });

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    res.json(module);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update module
router.put('/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const updates = req.body;
    const db = mongoose.connection.db;
    const collection = db.collection('modules');

    const result = await collection.findOneAndUpdate(
      { _id: moduleId },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Module not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE module
router.delete('/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const db = mongoose.connection.db;
    const collection = db.collection('modules');

    const result = await collection.deleteOne({ _id: moduleId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }
    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;