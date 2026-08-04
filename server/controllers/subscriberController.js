import Subscriber from "../models/Subscriber.js";

// API to subscribe an email to the newsletter
// POST /api/newsletter/subscribe
export const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.json({ success: false, message: "Please enter a valid email address" });
    }

    const existing = await Subscriber.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.json({ success: false, message: "This email is already subscribed" });
    }

    await Subscriber.create({ email: email.toLowerCase().trim() });

    res.json({ success: true, message: "Thanks for subscribing!" });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ success: false, message: "This email is already subscribed" });
    }
    res.json({ success: false, message: error.message });
  }
};