import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Loader, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import api from '../api/client';

export const AIQuizPage = ({ lessonId, courseId }) => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  const generateQuiz = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.post('/api/ai/generate-quiz', {
        lessonId,
        courseId,
      });
      setQuiz(response.data.quiz);
      setAnswers({});
      setSubmitted(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const submitQuiz = async () => {
    try {
      const response = await api.post('/api/ai/submit-quiz', {
        lessonId,
        answers,
      });
      setScore(response.data.score);
      setSubmitted(true);
    } catch (err) {
      alert('Failed to submit quiz');
    }
  };

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="p-8 text-center">
              {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">AI Quiz Generator</h2>
              <p className="text-gray-600 mb-6">
                Test your knowledge with an AI-generated quiz based on this lesson
              </p>

              <Button
                onClick={generateQuiz}
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Generating Quiz...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Quiz
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (submitted && score !== null) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="text-center">
            <CardContent className="p-12">
              {score >= 70 ? (
                <>
                  <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold mb-2">Great Job! 🎉</h2>
                </>
              ) : (
                <>
                  <XCircle className="w-20 h-20 text-orange-600 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold mb-2">Good Effort!</h2>
                </>
              )}

              <p className="text-5xl font-bold text-blue-600 mb-4">{score}%</p>
              <p className="text-gray-600 mb-6">
                You answered {Object.keys(answers).length} out of {quiz.questions.length} questions correctly
              </p>

              <Button
                onClick={() => setQuiz(null)}
                className="mr-2"
              >
                Take Another Quiz
              </Button>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
              >
                Back to Lesson
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Quiz</h1>
            <Badge>{Object.keys(answers).length} / {quiz.questions.length} answered</Badge>
          </div>
        </div>

        <div className="space-y-6">
          {quiz.questions.map((question, idx) => (
            <Card key={question._id}>
              <CardContent className="p-6">
                <h3 className="font-bold mb-4">
                  {idx + 1}. {question.text}
                </h3>

                <div className="space-y-3">
                  {question.type === 'multiple-choice' && (
                    question.options.map((option, optIdx) => (
                      <label
                        key={optIdx}
                        className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50"
                      >
                        <input
                          type="radio"
                          name={question._id}
                          value={option}
                          checked={answers[question._id] === option}
                          onChange={() => handleAnswer(question._id, option)}
                          className="mr-3"
                        />
                        {option}
                      </label>
                    ))
                  )}

                  {question.type === 'true-false' && (
                    <>
                      <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50">
                        <input
                          type="radio"
                          name={question._id}
                          value="true"
                          checked={answers[question._id] === 'true'}
                          onChange={() => handleAnswer(question._id, 'true')}
                          className="mr-3"
                        />
                        True
                      </label>
                      <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50">
                        <input
                          type="radio"
                          name={question._id}
                          value="false"
                          checked={answers[question._id] === 'false'}
                          onChange={() => handleAnswer(question._id, 'false')}
                          className="mr-3"
                        />
                        False
                      </label>
                    </>
                  )}

                  {question.type === 'short-answer' && (
                    <textarea
                      placeholder="Type your answer here..."
                      value={answers[question._id] || ''}
                      onChange={(e) => handleAnswer(question._id, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="3"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-4 mt-8">
          <Button
            onClick={submitQuiz}
            disabled={Object.keys(answers).length === 0}
            className="flex-1"
          >
            Submit Quiz
          </Button>
          <Button
            variant="outline"
            onClick={() => setQuiz(null)}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
