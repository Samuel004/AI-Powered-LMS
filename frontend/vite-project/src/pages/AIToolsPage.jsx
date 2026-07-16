import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Sparkles, BookOpen, Brain, MessageCircle, Zap } from 'lucide-react';

export const AIToolsPage = ({ courseId }) => {
  const navigate = useNavigate();

  const tools = [
    {
      icon: BookOpen,
      title: 'AI Notes Generator',
      description: 'Generate AI-powered summary notes for any lesson. Get key points and revision notes.',
      features: ['Summary', 'Key Points', 'Revision Notes'],
      action: () => navigate(`/ai-tutor`),
    },
    {
      icon: Brain,
      title: 'AI Quiz Generator',
      description: 'Test your knowledge with AI-generated quizzes. Multiple choice, true/false, and short answer.',
      features: ['MCQ', 'True/False', 'Short Answer'],
      action: () => navigate(`/ai-quiz`),
    },
    {
      icon: MessageCircle,
      title: 'AI Tutor Chat',
      description: 'Ask the AI tutor any questions about the course. Get instant explanations and clarifications.',
      features: ['24/7 Available', 'Course Context', 'Instant Answers'],
      action: () => navigate(`/ai-tutor`),
    },
    {
      icon: Zap,
      title: 'AI Flashcards',
      description: 'Generate flashcards to memorize key concepts. Perfect for revision and quick learning.',
      features: ['Auto-Generated', 'Flip Cards', 'Progress Tracking'],
      action: () => navigate(`/ai-flashcards`),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold">AI Learning Tools</h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Supercharge your learning with AI-powered tools. Generate notes, quizzes, ask questions, and create flashcards instantly.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {tools.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <Card key={idx} className="hover:shadow-lg transition-shadow overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Icon className="w-6 h-6 text-purple-600" />
                    </div>
                    <Badge className="bg-purple-100 text-purple-900">AI</Badge>
                  </div>

                  <h3 className="text-xl font-bold mb-2">{tool.title}</h3>
                  <p className="text-gray-600 mb-4">{tool.description}</p>

                  <div className="space-y-3 mb-6">
                    <p className="text-sm font-semibold text-gray-700">Features:</p>
                    <div className="flex flex-wrap gap-2">
                      {tool.features.map((feature) => (
                        <Badge key={feature} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button onClick={tool.action} className="w-full">
                    Try Now
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Section */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold mb-4">How to Use AI Tools</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-600 text-white font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold">Choose a Tool</h4>
                  <p className="text-gray-600 text-sm">Select from notes, quizzes, chat, or flashcards</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-600 text-white font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold">Generate Content</h4>
                  <p className="text-gray-600 text-sm">AI creates personalized content based on your lesson</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-600 text-white font-bold">
                    3
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold">Learn & Practice</h4>
                  <p className="text-gray-600 text-sm">Use the generated content to master the topics</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
