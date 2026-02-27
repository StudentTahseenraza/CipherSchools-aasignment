import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaTimes, FaPlus, FaTrash, FaArrowLeft } from 'react-icons/fa';
import { useAdmin } from '../../context/AdminContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../components/Loader';

const AssignmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createAssignment, updateAssignment } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'Easy',
    category: 'Basic Queries',
    questionText: '',
    tableSchemas: [{
      table: '',
      columns: [{ name: '', type: 'VARCHAR(50)', isPrimaryKey: false }]
    }],
    hints: [''],
    solution: '',
    tags: [],
    estimatedTime: 15
  });

  useEffect(() => {
    if (id) {
      fetchAssignment();
    }
  }, [id]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/assignments/${id}`);
      if (response.data.success) {
        setFormData(response.data.assignment);
      }
    } catch (error) {
      toast.error('Failed to fetch assignment');
      navigate('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTableChange = (tableIndex, field, value) => {
    const updatedTables = [...formData.tableSchemas];
    updatedTables[tableIndex][field] = value;
    setFormData({ ...formData, tableSchemas: updatedTables });
  };

  const handleColumnChange = (tableIndex, columnIndex, field, value) => {
    const updatedTables = [...formData.tableSchemas];
    updatedTables[tableIndex].columns[columnIndex][field] = value;
    setFormData({ ...formData, tableSchemas: updatedTables });
  };

  const addTable = () => {
    setFormData({
      ...formData,
      tableSchemas: [
        ...formData.tableSchemas,
        { table: '', columns: [{ name: '', type: 'VARCHAR(50)', isPrimaryKey: false }] }
      ]
    });
  };

  const removeTable = (index) => {
    if (formData.tableSchemas.length > 1) {
      const updatedTables = formData.tableSchemas.filter((_, i) => i !== index);
      setFormData({ ...formData, tableSchemas: updatedTables });
    }
  };

  const addColumn = (tableIndex) => {
    const updatedTables = [...formData.tableSchemas];
    updatedTables[tableIndex].columns.push({ name: '', type: 'VARCHAR(50)', isPrimaryKey: false });
    setFormData({ ...formData, tableSchemas: updatedTables });
  };

  const removeColumn = (tableIndex, columnIndex) => {
    if (formData.tableSchemas[tableIndex].columns.length > 1) {
      const updatedTables = [...formData.tableSchemas];
      updatedTables[tableIndex].columns = updatedTables[tableIndex].columns.filter((_, i) => i !== columnIndex);
      setFormData({ ...formData, tableSchemas: updatedTables });
    }
  };

  const handleHintChange = (index, value) => {
    const updatedHints = [...formData.hints];
    updatedHints[index] = value;
    setFormData({ ...formData, hints: updatedHints });
  };

  const addHint = () => {
    setFormData({
      ...formData,
      hints: [...formData.hints, '']
    });
  };

  const removeHint = (index) => {
    if (formData.hints.length > 1) {
      const updatedHints = formData.hints.filter((_, i) => i !== index);
      setFormData({ ...formData, hints: updatedHints });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title || !formData.description || !formData.questionText) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    let result;
    
    if (id) {
      result = await updateAssignment(id, formData);
    } else {
      result = await createAssignment(formData);
    }

    if (result.success) {
      navigate('/admin/dashboard');
    }
    setLoading(false);
  };

  if (loading && id) {
    return <Loader size="large" text="Loading assignment..." />;
  }

  return (
    <div className="assignment-form-container">
      <div className="form-header">
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/admin/dashboard')}
        >
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1>{id ? 'Edit Assignment' : 'Create New Assignment'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="assignment-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter assignment title"
              required
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter assignment description"
              rows="3"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Difficulty</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="Basic Queries">Basic Queries</option>
                <option value="Joins">Joins</option>
                <option value="Aggregation">Aggregation</option>
                <option value="Subqueries">Subqueries</option>
                <option value="Window Functions">Window Functions</option>
              </select>
            </div>

            <div className="form-group">
              <label>Estimated Time (minutes)</label>
              <input
                type="number"
                name="estimatedTime"
                value={formData.estimatedTime}
                onChange={handleChange}
                min="1"
                max="180"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Question Text *</label>
            <textarea
              name="questionText"
              value={formData.questionText}
              onChange={handleChange}
              placeholder="Enter the assignment question"
              rows="5"
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Database Schema</h2>
          
          {formData.tableSchemas.map((table, tableIndex) => (
            <div key={tableIndex} className="table-schema-card">
              <div className="table-header">
                <h3>Table {tableIndex + 1}</h3>
                {formData.tableSchemas.length > 1 && (
                  <button
                    type="button"
                    className="btn-icon danger"
                    onClick={() => removeTable(tableIndex)}
                  >
                    <FaTrash />
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>Table Name</label>
                <input
                  type="text"
                  value={table.table}
                  onChange={(e) => handleTableChange(tableIndex, 'table', e.target.value)}
                  placeholder="e.g., employees"
                  required
                />
              </div>

              <div className="columns-section">
                <h4>Columns</h4>
                {table.columns.map((column, columnIndex) => (
                  <div key={columnIndex} className="column-row">
                    <input
                      type="text"
                      value={column.name}
                      onChange={(e) => handleColumnChange(tableIndex, columnIndex, 'name', e.target.value)}
                      placeholder="Column name"
                      required
                    />
                    <select
                      value={column.type}
                      onChange={(e) => handleColumnChange(tableIndex, columnIndex, 'type', e.target.value)}
                    >
                      <option value="VARCHAR(50)">VARCHAR(50)</option>
                      <option value="VARCHAR(100)">VARCHAR(100)</option>
                      <option value="INTEGER">INTEGER</option>
                      <option value="DECIMAL(10,2)">DECIMAL(10,2)</option>
                      <option value="DATE">DATE</option>
                      <option value="BOOLEAN">BOOLEAN</option>
                    </select>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={column.isPrimaryKey}
                        onChange={(e) => handleColumnChange(tableIndex, columnIndex, 'isPrimaryKey', e.target.checked)}
                      />
                      PK
                    </label>
                    {table.columns.length > 1 && (
                      <button
                        type="button"
                        className="btn-icon small danger"
                        onClick={() => removeColumn(tableIndex, columnIndex)}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => addColumn(tableIndex)}
                >
                  <FaPlus /> Add Column
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-outline"
            onClick={addTable}
          >
            <FaPlus /> Add Another Table
          </button>
        </div>

        <div className="form-section">
          <h2>Hints</h2>
          
          {formData.hints.map((hint, index) => (
            <div key={index} className="hint-row">
              <input
                type="text"
                value={hint}
                onChange={(e) => handleHintChange(index, e.target.value)}
                placeholder={`Hint ${index + 1}`}
              />
              {formData.hints.length > 1 && (
                <button
                  type="button"
                  className="btn-icon danger"
                  onClick={() => removeHint(index)}
                >
                  <FaTrash />
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={addHint}
          >
            <FaPlus /> Add Hint
          </button>
        </div>

        <div className="form-section">
          <h2>Solution</h2>
          
          <div className="form-group">
            <label>Solution Query (Optional)</label>
            <textarea
              name="solution"
              value={formData.solution}
              onChange={handleChange}
              placeholder="Enter the correct SQL query"
              rows="5"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/admin/dashboard')}
          >
            <FaTimes /> Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            <FaSave /> {loading ? 'Saving...' : (id ? 'Update Assignment' : 'Create Assignment')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssignmentForm;