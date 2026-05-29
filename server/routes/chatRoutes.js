const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getConversations,
  openConversation,
  getMessages,
  sendMessage,
  markSeen,
} = require("../controllers/chatController");

const router = express.Router();

router.get("/conversations", protect, getConversations);
router.post("/conversations", protect, openConversation);
router.get("/conversations/:conversationId/messages", protect, getMessages);
router.post("/messages", protect, sendMessage);
router.patch("/conversations/:conversationId/seen", protect, markSeen);

module.exports = router;
