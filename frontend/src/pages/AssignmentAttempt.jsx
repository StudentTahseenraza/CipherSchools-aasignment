import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  FaPlay, 
  FaLightbulb, 
  FaArrowLeft, 
  FaDatabase, 
  FaTable,
  FaSave,
  FaHistory,
  FaTimes
} from 'react-icons/fa';

import api from '../services/api';
import SQLEditor from '../components/SQLEditor';
import ResultsTable from '../components/ResultsTable';
import Loader from '../components/Loader';
import HintModal from '../components/HintModal';

const AssignmentAttempt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [assignment, setAssignment] = useState(null);
  const [assignmentData, setAssignmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [query, setQuery] = useState('-- Write your SQL query here\nSELECT * FROM employees LIMIT 10;');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [showHintModal, setShowHintModal] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('question');
  const [savedQueries, setSavedQueries] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchAssignment();
    loadSavedQueries();
  }, [id]);

  useEffect(() => {
    if (assignmentData) {
      console.log('✅ Complete assignmentData:', assignmentData);
      console.log('📋 All keys in assignmentData:', Object.keys(assignmentData));
      console.log('📝 question_text field:', assignmentData.question_text);
      console.log('📝 questionText field:', assignmentData.questionText);
      console.log('📝 question field:', assignmentData.question);
    }
  }, [assignmentData]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/assignments/${id}`);
      console.log('📦 Full response:', response.data);
      
      setAssignment(response.data);
      
      if (response.data.assignment) {
        setAssignmentData(response.data.assignment);
        console.log('🎯 Assignment data extracted:', response.data.assignment);
      }
      
    } catch (error) {
      toast.error('Failed to load assignment');
      console.error('❌ Error fetching assignment:', error);
      navigate('/assignments');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedQueries = () => {
    const saved = localStorage.getItem(`saved_queries_${id}`);
    if (saved) {
      setSavedQueries(JSON.parse(saved));
    }
  };

  const executeQuery = async () => {
    if (!query.trim() || query === '-- Write your SQL query here\nSELECT * FROM employees LIMIT 10;') {
      toast.error('Please write a query first');
      return;
    }

    setExecuting(true);
    setError(null);
    setResults(null);
    
    try {
      let sanitizedQuery = query.trim().replace(/;+$/, '').replace(/;\s*--.*$/, '');
      
      console.log('🔍 Sanitized query:', sanitizedQuery);
      
      const actualId = assignmentData?._id || id;
      console.log('🔑 Using assignment ID:', actualId);
      
      const response = await api.get('/query/execute', {
        params: { 
          query: sanitizedQuery, 
          assignmentId: actualId 
        },
        timeout: 10000
      });

      if (response.data.success) {
        setResults(response.data);
        toast.success(`✅ Query executed in ${response.data.executionTime}ms`);
      } else {
        setError({ error: response.data.userMessage || response.data.error || 'Query execution failed' });
        toast.error(response.data.userMessage || response.data.error || 'Query execution failed');
      }
    } catch (error) {
      console.error('❌ Query execution error:', error);
      
      let errorMessage = 'Failed to execute query';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.userMessage) {
        errorMessage = error.response.data.userMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      setExecuting(false);
    }
  };

  const saveQuery = () => {
    const newSaved = [...savedQueries, {
      id: Date.now(),
      query,
      timestamp: new Date().toISOString(),
      name: `Query ${savedQueries.length + 1}`
    }];
    setSavedQueries(newSaved);
    localStorage.setItem(`saved_queries_${id}`, JSON.stringify(newSaved));
    toast.success('Query saved');
  };

  const loadQuery = (savedQuery) => {
    setQuery(savedQuery.query);
    setShowHistory(false);
    toast.info('Query loaded');
  };

  const getHint = async () => {
    setHintLoading(true);
    try {
      const response = await api.post('/hint/generate', {
        query,
        assignmentId: id
      });
      
      if (response.data.success) {
        setShowHintModal(true);
      } else {
        toast.error('Failed to generate hint');
      }
    } catch (error) {
      toast.error('Failed to generate hint');
      console.error(error);
    } finally {
      setHintLoading(false);
    }
  };

  const renderQuestionPanel = () => {
    // Get data from assignmentData
    const title = assignmentData?.title || 'Untitled';
    const difficulty = assignmentData?.difficulty || 'Unknown';
    
    // Try all possible field names for question text
    const questionText = 
      assignmentData?.question_text || 
      assignmentData?.questionText || 
      assignmentData?.question || 
      'No question text available';
    
    // Get hints - could be array of strings or objects
    const hints = assignmentData?.hints || [];
    
    console.log('📝 Rendering question with:', { 
      title, 
      difficulty, 
      questionText, 
      hintsCount: hints.length 
    });

    return (
      <div className="question-panel">
        <h2>{title}</h2>
        <div className="question-panel__difficulty">
          Difficulty: <span className={`difficulty-${difficulty?.toLowerCase()}`}>
            {difficulty}
          </span>
        </div>
        <div className="question-panel__content">
          <h3>Question:</h3>
          <p>{questionText}</p>
        </div>
        {hints.length > 0 && (
          <div className="question-panel__hints">
            <h4>Quick Tips:</h4>
            <ul>
              {hints.map((hint, index) => (
                <li key={index}>{hint.text || hint}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderSchemaPanel = () => (
    <div className="schema-panel">
      <h3>Database Schema</h3>
      {assignment?.tables?.map((table, index) => (
        <div key={index} className="schema-panel__table">
          <h4>
            <FaTable /> {table.table_name}
          </h4>
          <pre className="schema-panel__code">
            {table.create_statement}
          </pre>
        </div>
      ))}
      {(!assignment?.tables || assignment.tables.length === 0) && (
        <p>No schema information available</p>
      )}
    </div>
  );

  const renderSampleDataPanel = () => (
    <div className="sample-panel">
      <h3>Sample Data</h3>
      {Object.entries(assignment?.sampleData || {}).map(([tableName, data]) => (
        <div key={tableName} className="sample-panel__table">
          <h4>
            <FaDatabase /> {tableName} (First 5 rows)
          </h4>
          <div className="sample-panel__data">
            {data.length > 0 ? (
              <table className="sample-table">
                <thead>
                  <tr>
                    {Object.keys(data[0]).map(col => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((val, i) => (
                        <td key={i}>{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No sample data available</p>
            )}
          </div>
        </div>
      ))}
      {Object.keys(assignment?.sampleData || {}).length === 0 && (
        <p>No sample data available</p>
      )}
    </div>
  );

  if (loading) return <Loader size="large" text="Loading assignment..." />;

  return (
    <div className="assignment-attempt">
      <div className="assignment-attempt__header">
        <button 
          className="btn btn-secondary btn-icon"
          onClick={() => navigate('/assignments')}
          title="Back to assignments"
        >
          <FaArrowLeft />
        </button>
        <h1>{assignmentData?.title || `Assignment #${id}`}</h1>
        <div className="assignment-attempt__actions">
          <button 
            className="btn btn-outline"
            onClick={() => setShowHistory(!showHistory)}
            title="Query history"
          >
            <FaHistory /> <span>History</span>
          </button>
          <button 
            className="btn btn-outline"
            onClick={saveQuery}
            title="Save query"
          >
            <FaSave /> <span>Save</span>
          </button>
          <button 
            className="btn btn-primary"
            onClick={executeQuery}
            disabled={executing}
          >
            <FaPlay /> <span>{executing ? 'Executing...' : 'Execute'}</span>
          </button>
          <button 
            className="btn btn-outline"
            onClick={getHint}
            disabled={hintLoading}
          >
            <FaLightbulb /> <span>{hintLoading ? 'Thinking...' : 'Hint'}</span>
          </button>
        </div>
      </div>

      {showHistory && savedQueries.length > 0 && (
        <div className="query-history">
          <div className="query-history__header">
            <h3>Saved Queries</h3>
            <button onClick={() => setShowHistory(false)}>
              <FaTimes />
            </button>
          </div>
          <div className="query-history__list">
            {savedQueries.map((sq) => (
              <div 
                key={sq.id} 
                className="query-history__item"
                onClick={() => loadQuery(sq)}
              >
                <span className="query-history__name">{sq.name}</span>
                <span className="query-history__time">
                  {new Date(sq.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="assignment-attempt__content">
        {/* Left Panel - Question/Schema/Sample Data */}
        <div className="assignment-attempt__info-panel">
          <div className="info-panel__tabs">
            <button 
              className={activeTab === 'question' ? 'active' : ''}
              onClick={() => setActiveTab('question')}
            >
              Question
            </button>
            <button 
              className={activeTab === 'schema' ? 'active' : ''}
              onClick={() => setActiveTab('schema')}
            >
              Schema
            </button>
            <button 
              className={activeTab === 'sample' ? 'active' : ''}
              onClick={() => setActiveTab('sample')}
            >
              Sample Data
            </button>
          </div>
          <div className="info-panel__content">
            {activeTab === 'question' && renderQuestionPanel()}
            {activeTab === 'schema' && renderSchemaPanel()}
            {activeTab === 'sample' && renderSampleDataPanel()}
          </div>
        </div>

        {/* Right Panel - SQL Editor and Results */}
        <div className="assignment-attempt__work-panel">
          <div className="editor-section">
            <div className="editor-section__header">
              <h3>SQL Editor</h3>
              <span className="editor-section__hint">Press Ctrl+Space for autocomplete</span>
            </div>
            <SQLEditor 
              value={query} 
              onChange={setQuery}
            />
          </div>

          <div className="results-section">
            <div className="results-section__header">
              <h3>
                Results 
                {results && (
                  <span className="results-section__stats">
                    ({results.rowCount} rows, {results.executionTime}ms)
                  </span>
                )}
              </h3>
            </div>
            
            <div className="results-section__content">
              {error ? (
                <div className="results-section__error">
                  <h4>Error:</h4>
                  <pre>{error.error}</pre>
                  {error.hint && <p className="hint">Hint: {error.hint}</p>}
                </div>
              ) : results ? (
                <ResultsTable data={results.data} columns={results.columns} />
              ) : (
                <div className="results-section__empty">
                  <p>Execute a query to see results</p>
                </div>
              )}
              
              {results?.truncated && (
                <div className="results-section__warning">
                  Results truncated to {results.rowCount} rows
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showHintModal && (
  <HintModal
    assignmentId={id}
    query={query}
    onClose={() => {
      console.log('Closing hint modal');
      setShowHintModal(false);
    }}
  />
)}
    </div>
  );
};

export default AssignmentAttempt;