const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams gives access to :id from parent route
const { addComment, getComments, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getComments)
  .post(addComment);

router.delete('/:commentId', deleteComment);

module.exports = router;
