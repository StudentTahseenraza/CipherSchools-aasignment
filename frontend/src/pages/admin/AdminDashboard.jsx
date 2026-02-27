import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBook, 
  FaUsers, 
  FaChartBar, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye,
  FaSearch,
  FaFilter,
  FaSort,
  FaExclamationTriangle
} from 'react-icons/fa';
import { useAdmin } from '../../context/AdminContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../components/Loader';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { assignments, loading, stats, fetchAssignments, fetchStats, deleteAssignment } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchStats();
  }, []);

  const handleDelete = async () => {
    if (selectedAssignment) {
      const result = await deleteAssignment(selectedAssignment._id);
      if (result.success) {
        setShowDeleteModal(false);
        setSelectedAssignment(null);
      }
    }
  };

  const filteredAssignments = assignments
    .filter(assignment => {
      const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty = filterDifficulty === 'all' || assignment.difficulty === filterDifficulty;
      return matchesSearch && matchesDifficulty;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  if (loading && assignments.length === 0) {
    return <Loader size="large" text="Loading dashboard..." />;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/admin/assignments/create')}
        >
          <FaPlus /> Create New Assignment
        </button>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <FaBook className="stat-icon" />
          <div className="stat-info">
            <span className="stat-value">{stats?.totalAssignments || 0}</span>
            <span className="stat-label">Total Assignments</span>
          </div>
        </div>
        <div className="stat-card">
          <FaUsers className="stat-icon" />
          <div className="stat-info">
            <span className="stat-value">{stats?.totalUsers || 0}</span>
            <span className="stat-label">Total Users</span>
          </div>
        </div>
        <div className="stat-card">
          <FaChartBar className="stat-icon" />
          <div className="stat-info">
            <span className="stat-value">{stats?.totalAttempts || 0}</span>
            <span className="stat-label">Total Attempts</span>
          </div>
        </div>
        <div className="stat-card">
          <FaEye className="stat-icon" />
          <div className="stat-info">
            <span className="stat-value">{stats?.successRate || 0}%</span>
            <span className="stat-label">Success Rate</span>
          </div>
        </div>
      </div>

      <div className="admin-filters">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <FaFilter />
          <select 
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div className="sort-group">
          <FaSort />
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">By Title</option>
          </select>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Difficulty</th>
              <th>Category</th>
              <th>Attempts</th>
              <th>Success Rate</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.map(assignment => (
              <tr key={assignment._id}>
                <td className="title-cell">
                  <strong>{assignment.title}</strong>
                  <br />
                  <small>{assignment.description.substring(0, 50)}...</small>
                </td>
                <td>
                  <span className={`difficulty-badge difficulty-${assignment.difficulty.toLowerCase()}`}>
                    {assignment.difficulty}
                  </span>
                </td>
                <td>{assignment.category}</td>
                <td>{assignment.metadata?.totalAttempts || 0}</td>
                <td>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${assignment.metadata?.successRate || 0}%` }}
                    />
                    <span>{Math.round(assignment.metadata?.successRate || 0)}%</span>
                  </div>
                </td>
                <td>{new Date(assignment.createdAt).toLocaleDateString()}</td>
                <td className="actions-cell">
                  <button 
                    className="btn-icon view"
                    onClick={() => navigate(`/admin/assignments/${assignment._id}`)}
                    title="View"
                  >
                    <FaEye />
                  </button>
                  <button 
                    className="btn-icon edit"
                    onClick={() => navigate(`/admin/assignments/edit/${assignment._id}`)}
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="btn-icon delete"
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setShowDeleteModal(true);
                    }}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <FaExclamationTriangle className="warning-icon" />
              <h2>Delete Assignment</h2>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete "{selectedAssignment?.title}"?</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;