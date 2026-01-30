import React, { useState, useEffect } from 'react';
import { adminAPI, timetableAPI, studentAPI } from '../services/api';

function StudentPanel() {
  const [activeTab, setActiveTab] = useState('timetable');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  const [branches, setBranches] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState('');

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (branch && semester && activeTab === 'assignments') {
      fetchAssignments();
    }
  }, [branch, semester, activeTab]);

  const loadBranches = async () => {
    try {
      const res = await adminAPI.getAllBranches();
      setBranches(res.data.data);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const handleViewTimetable = async () => {
    if (!branch || !semester) {
      setMessage('✗ Select branch and semester');
      return;
    }

    setLoading(true);
    try {
      const res = await studentAPI.getStudentTimetable(branch, semester);
      setTimetable(res.data.data || []);
      setMessage(`✓ Timetable loaded (${res.data.data?.length || 0} slots)`);
    } catch (error) {
      setMessage('✗ Error: ' + (error.response?.data?.error || error.message));
      setTimetable([]);
    }
    setLoading(false);
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getAssignments(branch, semester);
      setAssignments(res.data.data || []);
      if ((res.data.data || []).length === 0) {
        setMessage('ℹ️ No assignments available for this semester');
      } else {
        setMessage(`✓ ${res.data.data.length} assignment(s) found`);
      }
    } catch (error) {
      setMessage('✗ Error: ' + (error.response?.data?.error || error.message));
      setAssignments([]);
    }
    setLoading(false);
  };

  const handleViewContent = (assignment) => {
    if (assignment.content_type === 'TEXT') {
      alert('Assignment: ' + assignment.title + '\n\n' + assignment.content_text);
    } else if (assignment.content_type === 'LINK') {
      window.open(assignment.content_url, '_blank');
    } else if (assignment.content_type === 'PDF' || assignment.content_type === 'IMAGE') {
      if (assignment.content_text) {
        const link = document.createElement('a');
        link.href = assignment.content_text;
        link.target = '_blank';
        link.click();
      }
    }
  };

  const handleSubmitFeedback = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!branch || !semester || !feedbackText || !feedbackType || !feedbackRating) {
      setMessage('✗ Please fill all required fields');
      return;
    }

    if (feedbackText.length < 10) {
      setMessage('✗ Feedback must be at least 10 characters');
      return;
    }

    setLoading(true);
    try {
      await studentAPI.submitFeedback({
        branchId: branch,
        semester: parseInt(semester),
        feedbackType: feedbackType,
        feedbackText: feedbackText,
        rating: parseInt(feedbackRating)
      });
      setMessage('✓ Feedback submitted successfully! Admins will review your feedback.');
      setFeedbackType('');
      setFeedbackText('');
      setFeedbackRating('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('✗ Error: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>Student Panel</h1>

      <div style={{ marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('timetable')}
          className={activeTab === 'timetable' ? 'btn-primary' : 'btn-secondary'}
          style={{ marginRight: '10px', marginBottom: '10px' }}
        >
          My Timetable
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={activeTab === 'assignments' ? 'btn-primary' : 'btn-secondary'}
          style={{ marginRight: '10px', marginBottom: '10px' }}
        >
          Assignments
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={activeTab === 'feedback' ? 'btn-primary' : 'btn-secondary'}
          style={{ marginBottom: '10px' }}
        >
          Feedback
        </button>
      </div>

      {activeTab === 'timetable' && (
        <div className="card">
          <h2>📅 My Timetable</h2>
          
          {message && (
            <div className={`alert ${message.includes('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '20px' }}>
              {message}
            </div>
          )}

          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
            <div className="grid grid-2" style={{ marginBottom: '15px' }}>
              <div className="form-group">
                <label>Branch *</label>
                <select value={branch} onChange={(e) => setBranch(e.target.value)}>
                  <option value="">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b.branch_id} value={b.branch_id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Semester *</label>
                <select value={semester} onChange={(e) => setSemester(e.target.value)}>
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button className="btn-primary" onClick={handleViewTimetable} disabled={loading}>
              {loading ? '⏳ Loading...' : '🔍 View Timetable'}
            </button>
          </div>

          {timetable.length > 0 && (
            <div>
              <h3>📋 Your Timetable ({timetable.length} slots)</h3>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Subject</th>
                      <th>Professor</th>
                      <th>Semester</th>
                      <th>Lab</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timetable.map((slot, idx) => (
                      <tr key={idx}>
                        <td><strong>{slot.day_of_week}</strong></td>
                        <td>{slot.time_slot_start} - {slot.time_slot_end}</td>
                        <td>{slot.slot_type}</td>
                        <td>{slot.subject_name}</td>
                        <td>{slot.professor_name}</td>
                        <td>{slot.semester}</td>
                        <td>{slot.lab_batch}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="card">
          <h2>📚 Assignments</h2>

          {message && (
            <div className={`alert ${message.includes('✓') || message.includes('ℹ️') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '20px' }}>
              {message}
            </div>
          )}

          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
            <div className="grid grid-2" style={{ marginBottom: '15px' }}>
              <div className="form-group">
                <label>Branch *</label>
                <select 
                  value={branch} 
                  onChange={(e) => setBranch(e.target.value)}
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b.branch_id} value={b.branch_id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Semester *</label>
                <select 
                  value={semester} 
                  onChange={(e) => setSemester(e.target.value)}
                  required
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button 
              className="btn-primary" 
              onClick={fetchAssignments} 
              disabled={loading || !branch || !semester}
            >
              {loading ? '⏳ Loading...' : '🔍 View Assignments'}
            </button>
          </div>

          {assignments.length > 0 && (
            <div>
              <h3>📋 Assignments for Semester {semester} ({assignments.length})</h3>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Title</th>
                      <th>Professor</th>
                      <th>Type</th>
                      <th>Posted</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assign) => (
                      <tr key={assign.assignment_id}>
                        <td>{assign.subject_name}</td>
                        <td>{assign.title}</td>
                        <td>{assign.professor_name || '-'}</td>
                        <td>
                          {assign.content_type === 'TEXT' && '📝 Text'}
                          {assign.content_type === 'PDF' && '📄 PDF'}
                          {assign.content_type === 'LINK' && '🔗 Link'}
                          {assign.content_type === 'IMAGE' && '🖼️ Image'}
                        </td>
                        <td>{new Date(assign.created_at).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="btn-info" 
                            style={{ padding: '5px 10px', fontSize: '0.9rem' }}
                            onClick={() => handleViewContent(assign)}
                          >
                            👁️ View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {branch && semester && assignments.length === 0 && !loading && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              <p>No assignments available for this semester</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="card">
          <h2>Submit Feedback</h2>
          {message && (
            <div className={`alert ${message.includes('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '20px' }}>
              {message}
            </div>
          )}
          <form onSubmit={handleSubmitFeedback}>
            <div className="grid grid-2" style={{ marginBottom: '15px' }}>
              <div className="form-group">
                <label>Branch *</label>
                <select value={branch} onChange={(e) => setBranch(e.target.value)} required>
                  <option value="">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b.branch_id} value={b.branch_id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Semester *</label>
                <select value={semester} onChange={(e) => setSemester(e.target.value)} required>
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Feedback Type *</label>
              <select value={feedbackType} onChange={(e) => setFeedbackType(e.target.value)} required>
                <option value="">Select Type</option>
                <option value="TIMETABLE">Timetable Related</option>
                <option value="CLASS">Class Quality</option>
                <option value="RESOURCE">Resource Quality</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Your Feedback *</label>
              <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} required placeholder="Share your feedback..." style={{ minHeight: '100px' }}></textarea>
            </div>
            <div className="form-group">
              <label>Rating (1-5) *</label>
              <select value={feedbackRating} onChange={(e) => setFeedbackRating(e.target.value)} required>
                <option value="">Select Rating</option>
                <option value="1">⭐ Poor</option>
                <option value="2">⭐⭐ Fair</option>
                <option value="3">⭐⭐⭐ Good</option>
                <option value="4">⭐⭐⭐⭐ Very Good</option>
                <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
              </select>
            </div>
            <button type="submit" className="btn-success" disabled={loading}>
              {loading ? '⏳ Submitting...' : '✓ Submit Feedback'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default StudentPanel;
