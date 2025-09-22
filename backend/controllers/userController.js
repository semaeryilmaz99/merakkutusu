import User from "../models/User.js";
import Notification from "../models/Notification.js";

export const followUser = async (req, res) => {
    try {
      const userId = req.user._id;       // Takip eden
      const targetId = req.params.id;    // Takip edilecek kişi

    if (userId.toString() === targetId) {
        return res.status(400).json({ message: "Kendinizi takip edemezsiniz" });
    }

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetId);

    if (!targetUser) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

      // Zaten takip ediyorsa bırak
    if (user.following.includes(targetId)) {
        user.following.pull(targetId);
        targetUser.followers.pull(userId);
        await user.save();
        await targetUser.save();
        return res.json({ message: "Takipten çıkarıldı" });
    }

      // Takip et
    user.following.push(targetId);
    targetUser.followers.push(userId);
    await user.save();
    await targetUser.save();

    // Takip bildirimi oluştur
    await Notification.create({
    user: targetId, // Takip edilen kişi
    type: "follow",
    fromUser: userId
});

    res.json({ message: "Takip edildi" });
    } catch (err) {
    res.status(500).json({ message: err.message });
    }
};

// Kullanıcı arama
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Arama terimi gerekli" });

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { bio: { $regex: q, $options: "i" } }
      ]
    }).select("username bio");

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};