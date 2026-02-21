const Training = require('../models/Training');

// @desc    Create a new training program
// @route   POST /api/trainings
// @access  Private (admin only)
const createTraining = async (req, res) => {
  try {
    const { title, description, category, durationHours } = req.body;

    const training = await Training.create({
      title,
      description,
      category,
      durationHours,
      createdBy: req.user._id,
    });

    res.status(201).json({ message: 'Training created successfully.', training });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// @desc    Get all training programs
// @route   GET /api/trainings
// @access  Private (admin + employee)
const getAllTrainings = async (req, res) => {
  try {
    const trainings = await Training.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ count: trainings.length, trainings });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// @desc    Get a single training by ID
// @route   GET /api/trainings/:id
// @access  Private (admin + employee)
const getTrainingById = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id).populate(
      'createdBy',
      'name email'
    );

    if (!training) {
      return res.status(404).json({ message: 'Training not found.' });
    }

    res.status(200).json({ training });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// @desc    Update a training program
// @route   PUT /api/trainings/:id
// @access  Private (admin only)
const updateTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);

    if (!training) {
      return res.status(404).json({ message: 'Training not found.' });
    }

    const { title, description, category, durationHours } = req.body;

    training.title = title ?? training.title;
    training.description = description ?? training.description;
    training.category = category ?? training.category;
    training.durationHours = durationHours ?? training.durationHours;

    const updated = await training.save();
    res.status(200).json({ message: 'Training updated successfully.', training: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// @desc    Delete a training program
// @route   DELETE /api/trainings/:id
// @access  Private (admin only)
const deleteTraining = async (req, res) => {
  try {
    const training = await Training.findByIdAndDelete(req.params.id);

    if (!training) {
      return res.status(404).json({ message: 'Training not found.' });
    }

    res.status(200).json({ message: 'Training deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

module.exports = {
  createTraining,
  getAllTrainings,
  getTrainingById,
  updateTraining,
  deleteTraining,
};
