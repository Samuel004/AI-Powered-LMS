import express from "express";
import {connectDB} from "../backend/lib/db.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from 'cors';
import authRoutes  from "./routes/auth.route.js";
import courseRoutes from "./routes/course.route.js";
import lessonRoutes from "./routes/lesson.route.js";
import studentRoutes from "./routes/student.route.js";
import instructorRoutes from "./routes/instructor.route.js";
import aiRoutes from "./routes/ai.route.js";
import liveRoutes from "./routes/live.route.js";
import paymentRoutes from "./routes/payment.route.js";
import adminRoutes from "./routes/admin.route.js";
import certificateRoutes from "./routes/certificate.route.js";
import notificationRoutes from "./routes/notification.route.js";
import assignmentRoutes from "./routes/assignment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import uploadRoutes from "./routes/upload.route.js";
import http from 'http';
import { Server } from 'socket.io';
import LiveSession from './models/LiveSession.model.js';

dotenv.config()

const app = express();

app.use(express.json());
app.use(cookieParser());

// Enable CORS for the frontend dev server
app.use(cors({
  // allow requests from whichever origin in dev (reflect request origin)
  origin: (origin, cb) => cb(null, true),
  credentials: true,
}));

const PORT = process.env.PORT || 3000;

app.use("/api/auth",authRoutes);
app.use("/api/courses",courseRoutes);
app.use("/api/lessons",lessonRoutes);
app.use("/api/student",studentRoutes);
app.use("/api/instructor",instructorRoutes);
app.use("/api/ai",aiRoutes);
app.use("/api/live",liveRoutes);
app.use("/api/payments",paymentRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/certificates",certificateRoutes);
app.use("/api/notifications",notificationRoutes);
app.use("/api/assignments",assignmentRoutes);
app.use("/api/analytics",analyticsRoutes);
app.use("/api/upload",uploadRoutes);

connectDB();


// Setup Socket.IO for live classes (basic implementation)

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET','POST']
  }
});

const connectedUsers = {}; // map userId -> socketId

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join-session', async ({ sessionId, userId, userName }) => {
    socket.join(sessionId);
    socket.userId = userId;
    connectedUsers[userId] = socket.id;

    console.log(`${userName} joined session ${sessionId}`);
    // Broadcast to others
    socket.to(sessionId).emit('participant-joined', { _id: userId, name: userName });

    // Optionally add participant to DB if not present
    try {
      const session = await LiveSession.findById(sessionId);
      if (session) {
        const exists = session.participants.some(p => p.userId.toString() === userId.toString());
        if (!exists) {
          session.participants.push({ userId, joinedAt: new Date(), role: 'student' });
          await session.save();
        }
      }
    } catch (e) {
      console.error('Error updating participants in DB:', e.message);
    }
  });

  // WebRTC signaling relay
  socket.on('webrtc-signal', ({ to, from, signal }) => {
    const targetSocketId = connectedUsers[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-signal', { from, signal });
    }
  });

  socket.on('send-message', async (data) => {
    const { sessionId, sender, senderName, content, timestamp } = data;
    // Save message to DB
    try {
      const session = await LiveSession.findById(sessionId);
      if (session) {
        session.messages.push({ userId: sender, message: content, timestamp: timestamp || new Date() });
        await session.save();
      }
    } catch (e) {
      console.error('Failed to save message:', e.message);
    }

    // Emit to room
    io.to(sessionId).emit('message', { sender, senderName, content, timestamp: timestamp || new Date() });
  });

  socket.on('leave-session', ({ sessionId, userId }) => {
    socket.leave(sessionId);
    socket.to(sessionId).emit('participant-left', userId);
    if (userId && connectedUsers[userId]) delete connectedUsers[userId];
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
    // cleanup connectedUsers map
    if (socket.userId && connectedUsers[socket.userId]) delete connectedUsers[socket.userId];
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

