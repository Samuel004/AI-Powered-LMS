import LiveSession from "../models/LiveSession.model.js";
import Course from "../models/Course.model.js";
import Enrollment from "../models/Enrollment.model.js";

// Schedule a live class
export const scheduleClass = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, scheduledAt, duration } = req.body;
    const instructorId = req.user.userId;

    // Verify instructor owns course
    const course = await Course.findById(courseId);
    if (!course || course.instructor.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "Not authorized to schedule classes for this course" });
    }

    // Create live session
    const liveSession = new LiveSession({
      course: courseId,
      instructor: instructorId,
      title,
      description,
      scheduledAt: new Date(scheduledAt),
      duration,
      status: "scheduled",
      participants: [],
      messages: []
    });

    await liveSession.save();

    return res.status(201).json({
      message: "Class scheduled successfully",
      sessionId: liveSession._id,
      session: liveSession
    });
  } catch (error) {
    return res.status(500).json({ message: "Error scheduling class", error: error.message });
  }
};

// Start a live class (instructor only)
export const startClass = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const instructorId = req.user.userId;

    const session = await LiveSession.findById(sessionId).populate("course");
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Verify instructor
    if (session.instructor.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update session status
    session.status = "active";
    session.startedAt = new Date();
    await session.save();

    return res.status(200).json({
      message: "Class started",
      session
    });
  } catch (error) {
    return res.status(500).json({ message: "Error starting class", error: error.message });
  }
};

// Join a live class
export const joinClass = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const session = await LiveSession.findById(sessionId).populate("course");
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if class is active
    if (session.status !== "active" && session.status !== "scheduled") {
      return res.status(400).json({ message: "Class is not available to join" });
    }

    // Verify enrollment (unless instructor)
    if (session.instructor.toString() !== userId.toString()) {
      const enrolled = await Enrollment.findOne({
        student: userId,
        course: session.course._id
      });
      if (!enrolled) {
        return res.status(403).json({ message: "You must be enrolled to join" });
      }
    }

    // Add participant if not already present
    const isParticipant = session.participants.some(p => p.userId.toString() === userId.toString());
    if (!isParticipant) {
      session.participants.push({
        userId,
        joinedAt: new Date(),
        role: session.instructor.toString() === userId.toString() ? "instructor" : "student"
      });
      await session.save();
    }

    return res.status(200).json({
      message: "Joined class successfully",
      sessionId: session._id,
      roomId: session._id.toString(),
      participants: session.participants
    });
  } catch (error) {
    return res.status(500).json({ message: "Error joining class", error: error.message });
  }
};

// Get active sessions for a course
export const getActiveSessions = async (req, res) => {
  try {
    const { courseId } = req.params;

    const sessions = await LiveSession.find({
      course: courseId,
      status: { $in: ["active", "scheduled"] }
    })
      .select("_id title description scheduledAt status startedAt participants")
      .sort({ scheduledAt: -1 });

    return res.status(200).json({
      message: "Active sessions retrieved",
      sessions,
      count: sessions.length
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching sessions", error: error.message });
  }
};

// Get session details
export const getSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await LiveSession.findById(sessionId)
      .populate("course", "title description")
      .populate("instructor", "username email");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    return res.status(200).json({
      session,
      participantCount: session.participants.length,
      messageCount: session.messages.length
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching session", error: error.message });
  }
};

// Add message to live session (for chat)
export const addMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const session = await LiveSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Verify user is participant
    const isParticipant = session.participants.some(p => p.userId.toString() === userId.toString());
    if (!isParticipant) {
      return res.status(403).json({ message: "Not a participant of this session" });
    }

    // Add message
    session.messages.push({
      userId,
      message,
      timestamp: new Date()
    });

    await session.save();

    return res.status(201).json({
      message: "Message sent",
      totalMessages: session.messages.length
    });
  } catch (error) {
    return res.status(500).json({ message: "Error sending message", error: error.message });
  }
};

// End/close a live class
export const endClass = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const instructorId = req.user.userId;

    const session = await LiveSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Verify instructor
    if (session.instructor.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update session
    session.status = "completed";
    session.endedAt = new Date();
    session.recordingUrl = req.body.recordingUrl || null; // Optional recording URL

    await session.save();

    return res.status(200).json({
      message: "Class ended successfully",
      session,
      summary: {
        duration: session.endedAt - session.startedAt,
        participants: session.participants.length,
        messages: session.messages.length
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error ending class", error: error.message });
  }
};

// Get live session history for a course
export const getSessionHistory = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const sessions = await LiveSession.find({
      course: courseId,
      status: "completed"
    })
      .select("_id title description scheduledAt startedAt endedAt participants")
      .sort({ endedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LiveSession.countDocuments({
      course: courseId,
      status: "completed"
    });

    return res.status(200).json({
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching history", error: error.message });
  }
};

// Get instructor's upcoming classes
export const getUpcomingClasses = async (req, res) => {
  try {
    const instructorId = req.user.userId;
    const now = new Date();

    const sessions = await LiveSession.find({
      instructor: instructorId,
      scheduledAt: { $gte: now },
      status: { $in: ["scheduled", "active"] }
    })
      .populate("course", "title")
      .sort({ scheduledAt: 1 });

    return res.status(200).json({
      message: "Upcoming classes",
      sessions,
      count: sessions.length
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching classes", error: error.message });
  }
};

// Export session recording (optional - for recording service integration)
export const recordSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { recordingUrl } = req.body;

    const session = await LiveSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    session.recordingUrl = recordingUrl;
    await session.save();

    return res.status(200).json({
      message: "Recording saved",
      recordingUrl
    });
  } catch (error) {
    return res.status(500).json({ message: "Error saving recording", error: error.message });
  }
};
