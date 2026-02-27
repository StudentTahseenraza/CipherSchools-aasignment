import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/assignments');
      if (response.data.success) {
        setAssignments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const createAssignment = async (assignmentData) => {
    try {
      setLoading(true);
      const response = await api.post('/admin/assignments', assignmentData);
      if (response.data.success) {
        toast.success('Assignment created successfully');
        await fetchAssignments();
        return { success: true, id: response.data.id };
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error(error.response?.data?.error || 'Failed to create assignment');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const updateAssignment = async (id, assignmentData) => {
    try {
      setLoading(true);
      const response = await api.put(`/admin/assignments/${id}`, assignmentData);
      if (response.data.success) {
        toast.success('Assignment updated successfully');
        await fetchAssignments();
        return { success: true };
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error(error.response?.data?.error || 'Failed to update assignment');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const deleteAssignment = async (id) => {
    try {
      setLoading(true);
      const response = await api.delete(`/admin/assignments/${id}`);
      if (response.data.success) {
        toast.success('Assignment deleted successfully');
        await fetchAssignments();
        return { success: true };
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error(error.response?.data?.error || 'Failed to delete assignment');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    assignments,
    loading,
    stats,
    fetchAssignments,
    fetchStats,
    createAssignment,
    updateAssignment,
    deleteAssignment
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};