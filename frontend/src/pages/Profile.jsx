import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaCalendar, FaChartBar, FaCode } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    try {
      const [statsRes, attemptsRes] = await Promise.all([
        api.get('/users/stats'),
        api.get('/users/attempts?limit=5')
      ]);

      setStats(statsRes.data.stats);
      setAttempts(attemptsRes.data.attempts);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader size="large" text="Loading profile..." />;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <FaUser />
        </div>
        <div className="profile-info">
          <h1>{user?.name || 'User'}</h1>
          <p className="profile-email">
            <FaEnvelope /> {user?.email}
          </p>
          <p className="profile-joined">
            <FaCalendar /> Joined {new Date(user?.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="profile-stats">
        <h2>
          <FaChartBar /> Your Statistics
        </h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats?.totalAttempts || 0}</div>
            <div className="stat-label">Total Attempts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats?.successfulAttempts || 0}</div>
            <div className="stat-label">Successful</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {stats?.successRate ? Math.round(stats.successRate) : 0}%
            </div>
            <div className="stat-label">Success Rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats?.avgExecutionTime || 0}ms</div>
            <div className="stat-label">Avg. Time</div>
          </div>
        </div>
      </div>

      <div className="profile-attempts">
        <h2>
          <FaCode /> Recent Attempts
        </h2>
        {attempts.length > 0 ? (
          <div className="attempts-list">
            {attempts.map((attempt) => (
              <div 
                key={attempt._id} 
                className={`attempt-item ${attempt.executionDetails?.isCorrect ? 'success' : 'error'}`}
                onClick={() => navigate(`/assignments/${attempt.assignmentId?._id}`)}
              >
                <div className="attempt-info">
                  <h4>{attempt.assignmentId?.title || 'Assignment'}</h4>
                  <p className="attempt-query">
                    {attempt.sqlQuery.substring(0, 50)}...
                  </p>
                </div>
                <div className="attempt-meta">
                  <span className={`attempt-status ${attempt.executionDetails?.isCorrect ? 'success' : 'error'}`}>
                    {attempt.executionDetails?.isCorrect ? '✓' : '✗'}
                  </span>
                  <span className="attempt-time">
                    {new Date(attempt.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-attempts">No attempts yet. Start practicing!</p>
        )}
      </div>
    </div>
  );
};

export default Profile;