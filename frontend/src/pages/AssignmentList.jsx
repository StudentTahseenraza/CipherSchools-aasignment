import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaCode, FaFilter, FaExclamationTriangle } from 'react-icons/fa';

import api from '../services/api';
import Loader from '../components/Loader';

const AssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching assignments...');
      
      const response = await api.get('/assignments');
      console.log('Assignments response:', response.data);
      
      // Handle different response structures
      if (response.data.success && response.data.data) {
        setAssignments(response.data.data);
      } else if (Array.isArray(response.data)) {
        setAssignments(response.data);
      } else if (response.data.assignments) {
        setAssignments(response.data.assignments);
      } else {
        console.error('Unexpected response structure:', response.data);
        setError('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load assignments';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = filter === 'all' 
    ? assignments 
    : assignments.filter(a => a.difficulty?.toLowerCase() === filter.toLowerCase());

  const getDifficultyClass = (difficulty) => {
    if (!difficulty) return '';
    switch(difficulty.toLowerCase()) {
      case 'easy': return 'assignment-card__difficulty-easy';
      case 'medium': return 'assignment-card__difficulty-medium';
      case 'hard': return 'assignment-card__difficulty-hard';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="assignment-list">
        <Loader size="large" text="Loading assignments..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="assignment-list">
        <div className="assignment-list__error">
          <FaExclamationTriangle className="error-icon" />
          <h2>Failed to Load Assignments</h2>
          <p>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={fetchAssignments}
          >
            Retry
          </button>
          <p className="error-hint">
            Make sure the backend server is running at http://localhost:5000
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="assignment-list">
      <div className="assignment-list__header">
        <h1>SQL Assignments</h1>
        <div className="assignment-list__filters">
          <FaFilter />
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'easy' ? 'active' : ''}
            onClick={() => setFilter('easy')}
          >
            Easy
          </button>
          <button 
            className={filter === 'medium' ? 'active' : ''}
            onClick={() => setFilter('medium')}
          >
            Medium
          </button>
          <button 
            className={filter === 'hard' ? 'active' : ''}
            onClick={() => setFilter('hard')}
          >
            Hard
          </button>
        </div>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="assignment-list__empty">
          <FaCode className="empty-icon" />
          <h3>No assignments found</h3>
          <p>
            {filter !== 'all' 
              ? `No ${filter} assignments available. Try a different filter.`
              : 'Check back later for new assignments!'}
          </p>
          {filter !== 'all' && (
            <button 
              className="btn btn-outline" 
              onClick={() => setFilter('all')}
            >
              Show All Assignments
            </button>
          )}
        </div>
      ) : (
        <div className="assignment-list__grid">
          {filteredAssignments.map(assignment => (
            <div 
              key={assignment._id || assignment.id}
              className="assignment-card"
              onClick={() => navigate(`/assignments/${assignment._id || assignment.id}`)}
            >
              <div className="assignment-card__header">
                <span className={`assignment-card__difficulty ${getDifficultyClass(assignment.difficulty)}`}>
                  {assignment.difficulty || 'Unknown'}
                </span>
                <span className="assignment-card__category">{assignment.category || 'General'}</span>
              </div>
              <h3 className="assignment-card__title">{assignment.title || 'Untitled'}</h3>
              <p className="assignment-card__description">{assignment.description || 'No description available'}</p>
              <div className="assignment-card__footer">
                <span className="assignment-card__attempts">
                  {assignment.userAttempts ? `${assignment.userAttempts} attempts` : 'Start Attempt'}
                </span>
                <span className="assignment-card__arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentList;