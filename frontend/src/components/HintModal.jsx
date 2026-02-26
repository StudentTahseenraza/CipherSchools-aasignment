import React, { useState, useEffect } from 'react';
import { FaTimes, FaLightbulb, FaRobot, FaDatabase } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../services/api';
import Loader from './Loader';

const HintModal = ({ assignmentId, query, onClose }) => {
  const [hint, setHint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predefinedHints, setPredefinedHints] = useState([]);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    fetchHint();
  }, []);

  const fetchHint = async () => {
    try {
      setLoading(true);
      console.log('🎯 Fetching hint for assignment:', assignmentId);
      
      const response = await api.post('/hint/generate', {
        query,
        assignmentId
      });

      console.log('📦 Hint response:', response.data);

      if (response.data.success) {
        setHint(response.data.hint);
        setPredefinedHints(response.data.predefinedHints || []);
        setProvider(response.data.provider);
      } else {
        toast.error('Failed to generate hint');
        // Set fallback hints
        setHint("Here are some general SQL tips:");
        setPredefinedHints([
          "Check your WHERE clause conditions",
          "Verify you're selecting the correct columns",
          "Make sure table names are correct"
        ]);
      }
    } catch (error) {
      console.error('❌ Hint error:', error);
      toast.error('Failed to generate hint');
      
      // Set fallback hints
      setHint("Unable to generate AI hint. Here are some general tips:");
      setPredefinedHints([
        "Use WHERE clause to filter data",
        "Check your column names",
        "Remember to use proper JOIN syntax"
      ]);
      setProvider('fallback');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Closing modal');
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose(e);
    }
  };

  const getProviderIcon = () => {
    switch(provider) {
      case 'gemini': return '🔮';
      case 'openrouter': return '🛣️';
      case 'huggingface': return '🤗';
      case 'mock': return '🤖';
      case 'fallback': return '💡';
      default: return '💡';
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content hint-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <FaLightbulb /> SQL Hint
            {provider && (
              <span className="provider-badge">
                {getProviderIcon()} {provider}
              </span>
            )}
          </h2>
          <button 
            className="btn-icon" 
            onClick={handleClose}
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-body">
          {loading ? (
            <div className="modal-loading">
              <Loader size="small" text="Generating helpful hint..." />
              <small>Using AI to create guidance without giving away the solution</small>
            </div>
          ) : (
            <>
              {hint && (
                <div className="hint-generated">
                  <h3>AI-Generated Hint:</h3>
                  <div className="hint-content">
                    <FaRobot className="hint-icon" />
                    <p>{hint}</p>
                  </div>
                </div>
              )}
              
              {predefinedHints.length > 0 && (
                <div className="hint-predefined">
                  <h3>
                    <FaDatabase /> Additional Tips:
                  </h3>
                  <ul>
                    {predefinedHints.map((hint, index) => (
                      <li key={index}>
                        <span className="bullet">•</span> {hint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn btn-primary" 
            onClick={handleClose}
            disabled={loading}
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HintModal;