import Assignment from "../models/Assignment.model.js";
import Submission from "../models/Submission.model.js";
import Enrollment from "../models/Enrollment.model.js";

// Create assignment (instructor only)
export const createAssignment = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { title, description, instructions, dueDate, totalPoints } = req.body;
    const instructorId = req.user.userId;

    if (!title || !dueDate) {
      return res.status(400).json({ message: "Title and dueDate are required" });
    }

    const assignment = new Assignment({
      course: courseId,
      lesson: lessonId || null,
      instructor: instructorId,
      title,
      description,
      instructions,
      dueDate: new Date(dueDate),
      totalPoints: totalPoints || 100
    });

    await assignment.save();

    return res.status(201).json({
      message: "Assignment created",
      assignment
    });
  } catch (error) {
    return res.status(500).json({ message: "Error creating assignment", error: error.message });
  }
};

// Get course assignments
export const getCourseAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const assignments = await Assignment.find({ course: courseId })
      .populate("instructor", "name")
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Assignment.countDocuments({ course: courseId });

    return res.status(200).json({
      assignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching assignments", error: error.message });
  }
};

// Get assignment details
export const getAssignmentDetails = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId)
      .populate("course", "title")
      .populate("instructor", "name email");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Get submission stats
    const submissions = await Submission.find({ assignment: assignmentId });
    const graded = submissions.filter(s => s.status === "graded").length;

    return res.status(200).json({
      assignment,
      stats: {
        totalSubmissions: submissions.length,
        gradedSubmissions: graded,
        pendingSubmissions: submissions.length - graded
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching assignment", error: error.message });
  }
};

// Update assignment (instructor only)
export const updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { title, description, instructions, dueDate, totalPoints } = req.body;
    const instructorId = req.user.userId;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Verify instructor
    if (assignment.instructor.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (instructions) assignment.instructions = instructions;
    if (dueDate) assignment.dueDate = new Date(dueDate);
    if (totalPoints) assignment.totalPoints = totalPoints;

    await assignment.save();

    return res.status(200).json({
      message: "Assignment updated",
      assignment
    });
  } catch (error) {
    return res.status(500).json({ message: "Error updating assignment", error: error.message });
  }
};

// Delete assignment (instructor only)
export const deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const instructorId = req.user.userId;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Verify instructor
    if (assignment.instructor.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Assignment.deleteOne({ _id: assignmentId });

    return res.status(200).json({ message: "Assignment deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting assignment", error: error.message });
  }
};

// Submit assignment
export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { content, attachments } = req.body;
    const studentId = req.user.userId;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Verify enrollment
    const enrolled = await Enrollment.findOne({
      student: studentId,
      course: assignment.course
    });
    if (!enrolled) {
      return res.status(403).json({ message: "Not enrolled in course" });
    }

    // Check if already submitted
    const existing = await Submission.findOne({
      assignment: assignmentId,
      student: studentId
    });

    if (existing) {
      return res.status(400).json({ message: "Already submitted. Update your submission instead." });
    }

    const submission = new Submission({
      assignment: assignmentId,
      student: studentId,
      course: assignment.course,
      content,
      attachments: attachments || [],
      status: new Date() > assignment.dueDate ? "late" : "submitted"
    });

    await submission.save();

    return res.status(201).json({
      message: "Assignment submitted",
      submission,
      isLate: submission.status === "late"
    });
  } catch (error) {
    return res.status(500).json({ message: "Error submitting assignment", error: error.message });
  }
};

// Get student submissions for assignment
export const getSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const submissions = await Submission.find({ assignment: assignmentId })
      .populate("student", "name email")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Submission.countDocuments({ assignment: assignmentId });

    return res.status(200).json({
      submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching submissions", error: error.message });
  }
};

// Grade submission
export const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;
    const instructorId = req.user.userId;

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Verify instructor
    const assignment = await Assignment.findById(submission.assignment);
    if (assignment.instructor.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    submission.grade = grade;
    submission.feedback = feedback;
    submission.status = "graded";
    submission.gradedAt = new Date();
    submission.gradedBy = instructorId;

    await submission.save();

    return res.status(200).json({
      message: "Submission graded",
      submission
    });
  } catch (error) {
    return res.status(500).json({ message: "Error grading submission", error: error.message });
  }
};

// Get student's submissions
export const getStudentSubmissions = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const submissions = await Submission.find({ student: studentId })
      .populate("assignment", "title dueDate")
      .populate("course", "title")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Submission.countDocuments({ student: studentId });

    return res.status(200).json({
      submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching submissions", error: error.message });
  }
};
