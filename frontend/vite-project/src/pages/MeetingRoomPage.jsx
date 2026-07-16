import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { Send, Mic, MicOff, Video, VideoOff, Share2, Phone, Users, Calendar, Clock } from 'lucide-react';
import { io } from 'socket.io-client';
import SimplePeer from 'simple-peer';
import api from '../api/client-fixed';

export function MeetingRoomPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socketRef = useRef(null);
  const peersRef = useRef({}); // map of peerId -> SimplePeer
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});

  const [sessionDetails, setSessionDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [micEnabled, setMicEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchSessionDetails();
    initializeSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/live/${sessionId}/details`);
      setSessionDetails(res.data);
      setMessages(res.data.messages || []);
      setParticipants(res.data.participants || []);
    } catch (error) {
      console.error('Failed to fetch session details:', error);
      alert('Failed to load session');
      navigate('/live-classes');
    } finally {
      setLoading(false);
    }
  };

  const initializeSocket = () => {
    const socket = io(import.meta.env.VITE_API_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      socket.emit('join-session', { sessionId, userId: user._id, userName: user.name });
    });

    socket.on('participant-joined', (participant) => {
      setParticipants((prev) => [...prev, participant]);

      // if someone joins after us, create a peer (we are the existing participant)
      if (participant._id && participant._id !== user._id) {
        // create initiator peer to connect to the newcomer
        createPeer(participant._id, true);
      }
    });

    socket.on('participant-left', (userId) => {
      setParticipants((prev) => prev.filter((p) => p._id !== userId));
      // destroy peer
      if (peersRef.current[userId]) {
        peersRef.current[userId].destroy();
        delete peersRef.current[userId];
        if (remoteVideosRef.current[userId]) {
          remoteVideosRef.current[userId].remove();
          delete remoteVideosRef.current[userId];
        }
      }
    });

    socket.on('message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    // WebRTC signaling
    socket.on('webrtc-signal', ({ from, signal }) => {
      // ensure peer exists
      if (!peersRef.current[from]) {
        // create a non-initiator peer to respond
        createPeer(from, false);
      }
      try {
        peersRef.current[from].signal(signal);
      } catch (e) {
        console.error('Error signaling peer', e);
      }
    });

    socketRef.current = socket;
  };

  const createPeer = (peerId, initiator) => {
    if (!socketRef.current) return;
    if (peersRef.current[peerId]) return; // already exists

    const peer = new SimplePeer({ initiator, trickle: false, stream: localStreamRef.current || undefined });

    peer.on('signal', (signal) => {
      // send signaling data to server for the target peer
      socketRef.current.emit('webrtc-signal', { to: peerId, from: user._id, signal });
    });

    peer.on('stream', (stream) => {
      // create a video element for this peer's stream
      const videoEl = document.createElement('video');
      videoEl.autoplay = true;
      videoEl.playsInline = true;
      videoEl.srcObject = stream;
      videoEl.className = 'w-full rounded-lg mb-2';
      remoteVideosRef.current[peerId] = videoEl;
      const container = document.getElementById('remote-videos');
      if (container) container.appendChild(videoEl);
    });

    peer.on('close', () => {
      if (remoteVideosRef.current[peerId]) {
        remoteVideosRef.current[peerId].remove();
        delete remoteVideosRef.current[peerId];
      }
      delete peersRef.current[peerId];
    });

    peer.on('error', (err) => console.error('Peer error', err));

    peersRef.current[peerId] = peer;
    return peer;
  };

  const ensureLocalStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = s;
      if (localVideoRef.current) localVideoRef.current.srcObject = s;
      return s;
    } catch (e) {
      console.error('getUserMedia failed', e);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const messageData = {
        sender: user._id,
        senderName: user.name,
        content: newMessage,
        timestamp: new Date(),
      };

      await api.post(`/live/${sessionId}/message`, messageData);

      if (socketRef.current) {
        socketRef.current.emit('send-message', { sessionId, ...messageData });
      }

      setMessages([...messages, messageData]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleEndSession = async () => {
    if (!confirm('Are you sure you want to end this session?')) return;

    try {
      await api.put(`/live/${sessionId}/end`);
      alert('Session ended');
      navigate('/live-classes');
    } catch (error) {
      alert('Failed to end session');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-900 flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-white">Loading meeting room...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-900 pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Meeting Header */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {sessionDetails?.title || sessionDetails?.courseId?.title}
              </h1>
              <div className="flex gap-4 text-gray-300 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {participants.length} participants
                </div>
                <Badge className="bg-red-600">LIVE</Badge>
              </div>
            </div>

            {user.role === 'instructor' && (
              <Button
                onClick={handleEndSession}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                End Session
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Video Area */}
            <div className="lg:col-span-3">
              {/* Main Video Display */}
              <div className="bg-black rounded-lg overflow-hidden aspect-video mb-6 flex flex-col border-2 border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2" id="remote-videos">
                  {/* Remote video elements will be appended here */}
                </div>
                <div className="p-2 flex items-center justify-center">
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-48 h-32 rounded-lg" />
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-4 justify-center mb-6">
                <Button
                  onClick={() => setMicEnabled(!micEnabled)}
                  variant={micEnabled ? 'default' : 'outline'}
                  className="flex items-center gap-2"
                >
                  {micEnabled ? (
                    <>
                      <Mic className="w-4 h-4" />
                      Mic On
                    </>
                  ) : (
                    <>
                      <MicOff className="w-4 h-4" />
                      Mic Off
                    </>
                  )}
                </Button>
                <Button
                  onClick={async () => {
                    const stream = await ensureLocalStream();
                    if (stream) {
                      setVideoEnabled(true);
                    }
                  }}
                  variant={videoEnabled ? 'default' : 'outline'}
                  className="flex items-center gap-2"
                >
                  {videoEnabled ? (
                    <>
                      <Video className="w-4 h-4" />
                      Camera On
                    </>
                  ) : (
                    <>
                      <VideoOff className="w-4 h-4" />
                      Camera Off
                    </>
                  )}
                </Button>
                <Button variant="outline" className="flex items-center gap-2" onClick={async () => {
                  if (!localStreamRef.current) await ensureLocalStream();
                  try {
                    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                    // Share screen to peers
                    Object.values(peersRef.current).forEach(peer => {
                      try {
                        peer.replaceTrack(localStreamRef.current.getVideoTracks()[0], stream.getVideoTracks()[0], localStreamRef.current);
                      } catch (e) {
                        // fallback: addTrack
                        peer.addTrack(stream.getVideoTracks()[0], stream);
                      }
                    });
                  } catch (e) {
                    console.error('Screen share failed', e);
                  }
                }}>
                  <Share2 className="w-4 h-4" />
                  Share Screen
                </Button>
              </div>

              {/* Chat Area */}
              <Card className="bg-gray-800 border-gray-700 p-6">
                <h3 className="text-white font-bold mb-4">Session Chat</h3>

                {/* Messages */}
                <div className="bg-gray-900 rounded-lg p-4 h-48 overflow-y-auto mb-4 space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-sm">No messages yet. Be the first to say hello!</p>
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={idx} className="text-sm">
                        <p className="text-blue-400 font-medium">{msg.senderName}</p>
                        <p className="text-gray-300">{msg.content}</p>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button onClick={handleSendMessage} size="sm">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </div>

            {/* Participants Sidebar */}
            <div>
              <Card className="bg-gray-800 border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Participants
                  </h3>
                  <button
                    onClick={() => setShowParticipants(!showParticipants)}
                    className="text-gray-400 hover:text-white"
                  >
                    {showParticipants ? '−' : '+'}
                  </button>
                </div>

                {showParticipants && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {participants.map((participant) => (
                      <div key={participant._id} className="bg-gray-700 rounded-lg p-3">
                        <p className="text-white text-sm font-medium">{participant.name}</p>
                        <p className="text-gray-400 text-xs">
                          {participant._id === user._id ? 'You' : participant.role || 'Student'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Session Info */}
              <Card className="bg-gray-800 border-gray-700 p-6 mt-6">
                <h4 className="text-white font-bold mb-3">Session Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(sessionDetails?.scheduledAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(sessionDetails?.scheduledAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function scrollToBottom() {
  const messagesEndRef = useRef(null);
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }
}
