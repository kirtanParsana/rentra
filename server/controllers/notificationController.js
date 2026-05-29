const {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../services/notificationService");

exports.getNotifications = async (req, res, next) => {
  try {
    const data = await listNotifications(req.userId, { limit: req.query?.limit });
    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const notification = await markNotificationRead(req.userId, req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    return res.status(200).json({ notification });
  } catch (error) {
    return next(error);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const result = await markAllNotificationsRead(req.userId);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};
