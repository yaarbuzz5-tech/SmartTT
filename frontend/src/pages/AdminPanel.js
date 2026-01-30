import React, { useState, useEffect } from 'react';
import { adminAPI, timetableAPI } from '../services/api';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('professors');
  const [professors, setProfessors] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [newProfessor, setNewProfessor] = useState({ name: '', email: '', phone: '' });
  const [newSubject, setNewSubject] = useState({ 
    name: '', 
    type: 'THEORY', 
    semester: 1, 
    weeklyLectureCount: 0,
    branches: [],
    professorId: ''
  });
  const [generateForm, setGenerateForm] = useState({ 
    generationType: 'single', // 'single', 'odd', 'even'
    singleSemester: '', 
    branchId: '', 
    allBranches: false 
  });
  const [generatedTimetable, setGeneratedTimetable] = useState([]);
  const [filterSemester, setFilterSemester] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictResults, setConflictResults] = useState(null);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  useEffect(() => {
    loadBranches();
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadBranches = async () => {
    try {
      const res = await adminAPI.getAllBranches();
      setBranches(res.data.data);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setMessage('');
    try {
      if (activeTab === 'professors') {
        const res = await adminAPI.getAllProfessors();
        setProfessors(res.data.data);
      } else if (activeTab === 'subjects') {
        const res = await adminAPI.getAllSubjects();
        setSubjects(res.data.data);
      } else if (activeTab === 'feedback') {
        const res = await adminAPI.getAllFeedback();
        setFeedback(res.data.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage('✗ Error: ' + error.message);
    }
    setLoading(false);
  };

  const handleAddProfessor = async (e) => {
    e.preventDefault();
    if (!newProfessor.name || !newProfessor.email) {
      setMessage('✗ Name and email are required');
      return;
    }

    try {
      await adminAPI.addProfessor(newProfessor);
      setMessage('✓ Professor added successfully');
      setNewProfessor({ name: '', email: '', phone: '' });
      setTimeout(loadData, 500);
    } catch (error) {
      setMessage('✗ Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.name) {
      setMessage('✗ Subject name is required');
      return;
    }
    if (newSubject.branches.length === 0) {
      setMessage('✗ Select at least one branch');
      return;
    }

    try {
      const subjectData = { ...newSubject };
      delete subjectData.branches;
      delete subjectData.professorId;
      
      const res = await adminAPI.addSubject(subjectData);
      
      // Add subject to selected branches
      if (newSubject.branches && newSubject.branches.length > 0) {
        for (const branchId of newSubject.branches) {
          await adminAPI.assignSubjectBranch(res.data.data.subject_id, branchId);
        }
      }

      // Map professor to subject if selected
      if (newSubject.professorId) {
        try {
          await adminAPI.mapProfessorSubject(newSubject.professorId, res.data.data.subject_id);
        } catch (err) {
          console.error('Error mapping professor:', err);
        }
      }

      setMessage('✓ Subject added successfully');
      setNewSubject({ name: '', type: 'THEORY', semester: 1, weeklyLectureCount: 0, branches: [], professorId: '' });
      setTimeout(loadData, 500);
    } catch (error) {
      setMessage('✗ Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteProfessor = async (id) => {
    if (window.confirm('Delete this professor?')) {
      try {
        await adminAPI.deleteProfessor(id);
        setMessage('✓ Professor deleted');
        loadData();
      } catch (error) {
        setMessage('✗ Error: ' + error.response?.data?.error);
      }
    }
  };

  const handleDeleteSubject = async (id) => {
    if (window.confirm('Delete this subject?')) {
      try {
        await adminAPI.deleteSubject(id);
        setMessage('✓ Subject deleted');
        loadData();
      } catch (error) {
        setMessage('✗ Error: ' + error.response?.data?.error);
      }
    }
  };

  const handleGenerateTimetable = async (e) => {
    e.preventDefault();
    
    if (generateForm.generationType === 'single') {
      if (!generateForm.singleSemester && !generateForm.allBranches && !generateForm.branchId) {
        setMessage('✗ Select semester and branch');
        return;
      }
    } else if (generateForm.generationType === 'odd' || generateForm.generationType === 'even') {
      if (!generateForm.allBranches && !generateForm.branchId) {
        setMessage('✗ Select branch or all branches');
        return;
      }
    }

    setLoading(true);
    try {
      let allTimetables = [];

      if (generateForm.generationType === 'single') {
        // Generate for single semester
        const semester = parseInt(generateForm.singleSemester);
        const branchesToGenerate = generateForm.allBranches 
          ? branches.map(b => b.branch_id) 
          : [generateForm.branchId];
        
        for (const branchId of branchesToGenerate) {
          const res = await timetableAPI.generateTimetable({
            branchId: branchId,
            semester: semester,
            semesterType: semester % 2 === 0 ? 'even' : 'odd'
          });
          allTimetables = [...allTimetables, ...(res.data.data || [])];
        }
        setMessage(`✓ Timetable generated for Semester ${semester}! (${allTimetables.length} slots created)`);
      } else if (generateForm.generationType === 'odd' || generateForm.generationType === 'even') {
        // Generate master timetable for all odd or even semesters
        const semesters = generateForm.generationType === 'odd' ? [1, 3, 5, 7] : [2, 4, 6, 8];
        const branchesToGenerate = generateForm.allBranches 
          ? branches.map(b => b.branch_id) 
          : [generateForm.branchId];

        for (const branchId of branchesToGenerate) {
          for (const semester of semesters) {
            const res = await timetableAPI.generateTimetable({
              branchId: branchId,
              semester: semester,
              semesterType: generateForm.generationType
            });
            allTimetables = [...allTimetables, ...(res.data.data || [])];
          }
        }
        const semesterLabel = generateForm.generationType === 'odd' ? 'Odd Semesters (1,3,5,7)' : 'Even Semesters (2,4,6,8)';
        setMessage(`✓ Master timetable generated for ${semesterLabel}! (${allTimetables.length} total slots created)`);
      }

      setGeneratedTimetable(allTimetables);
      // Don't reset the form - keep branch and semester for conflict checking
      // setGenerateForm({ generationType: 'single', singleSemester: '', branchId: '', allBranches: false });
    } catch (error) {
      setMessage('✗ Error: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  const handleCloseConflictModal = () => {
    setShowConflictModal(false);
    setConflictResults(null);
  };

  const handleClearTimetable = async () => {
    if (!window.confirm('Are you sure you want to clear the generated timetable? This action cannot be undone.')) {
      return;
    }
    setGeneratedTimetable([]);
    setMessage('✓ Timetable cleared. Ready to generate a new one.');
  };

  const handleCheckConflicts = async () => {
    // For all branches, need to check against all generated semesters
    if (generateForm.allBranches) {
      if (!generateForm.singleSemester && generateForm.generationType === 'single') {
        setMessage('✗ Select a semester to check conflicts');
        return;
      }
      // For all branches, we'll check each branch and combine results
      await checkAllBranchesConflicts();
      return;
    }

    // For single branch
    if (!generateForm.branchId || !generateForm.singleSemester) {
      setMessage('✗ Select a branch and semester to check conflicts');
      return;
    }

    setCheckingConflicts(true);
    setMessage(''); // Clear previous messages
    try {
      console.log('Checking conflicts for:', generateForm.branchId, generateForm.singleSemester);
      const res = await timetableAPI.checkConflicts(generateForm.branchId, generateForm.singleSemester);
      console.log('Conflict check response:', res);
      console.log('Conflict check data:', res.data);
      if (res && res.data) {
        console.log('Setting conflict results:', res.data);
        setConflictResults(res.data);
        setShowConflictModal(true);
        setMessage('✓ Conflict check completed');
      } else {
        setMessage('✗ No response from server');
        console.error('No response data:', res);
      }
    } catch (error) {
      console.error('Conflict check error:', error);
      console.error('Error details:', error.response?.data || error.message);
      setMessage('✗ Error checking conflicts: ' + (error.response?.data?.error || error.response?.data?.details || error.message));
    } finally {
      setCheckingConflicts(false);
    }
  };

  const checkAllBranchesConflicts = async () => {
    setCheckingConflicts(true);
    setMessage(''); // Clear previous messages
    try {
      const semesters = generateForm.generationType === 'odd' ? [1, 3, 5, 7] : generateForm.generationType === 'even' ? [2, 4, 6, 8] : [parseInt(generateForm.singleSemester)];
      const branchesToCheck = branches.map(b => b.branch_id);

      console.log('Checking conflicts for all branches:', branchesToCheck);
      console.log('Semesters:', semesters);

      // Combine all conflict results
      let combinedResults = {
        success: true,
        message: 'Multi-branch conflict check completed',
        summary: {
          totalClasses: 0,
          totalBreaks: 0,
          uniqueSubjects: new Set()
        },
        conflictCount: 0,
        warningCount: 0,
        gapCount: 0,
        conflicts: [],
        warnings: [],
        gaps: [],
        hasIssues: false,
        branchResults: {} // New: store per-branch results
      };

      // Check each branch for each semester
      for (const branchId of branchesToCheck) {
        const branchName = branches.find(b => b.branch_id === branchId)?.name || branchId;
        combinedResults.branchResults[branchName] = {};

        for (const semester of semesters) {
          console.log(`Checking conflicts for ${branchName} Semester ${semester}`);
          try {
            const res = await timetableAPI.checkConflicts(branchId, semester);
            const data = res.data;

            combinedResults.branchResults[branchName][`Sem${semester}`] = {
              conflicts: data.conflicts?.length || 0,
              warnings: data.warnings?.length || 0,
              gaps: data.gaps?.length || 0
            };

            // Add to combined results
            if (data.conflicts && data.conflicts.length > 0) {
              combinedResults.conflicts.push(...data.conflicts.map(c => ({ ...c, branch: branchName, semester })));
              combinedResults.conflictCount += data.conflicts.length;
            }
            if (data.warnings && data.warnings.length > 0) {
              combinedResults.warnings.push(...data.warnings.map(w => ({ ...w, branch: branchName, semester })));
              combinedResults.warningCount += data.warnings.length;
            }
            if (data.gaps && data.gaps.length > 0) {
              combinedResults.gaps.push(...data.gaps.map(g => ({ ...g, branch: branchName, semester })));
              combinedResults.gapCount += data.gaps.length;
            }
            
            // Aggregate summary data
            if (data.summary) {
              combinedResults.summary.totalClasses += data.summary.totalClasses || 0;
              combinedResults.summary.totalBreaks += data.summary.totalBreaks || 0;
              if (data.summary.uniqueSubjects) {
                // Combine unique subjects
                if (typeof data.summary.uniqueSubjects === 'number') {
                  // If it's already a count, add it
                  combinedResults.summary.uniqueSubjects = (combinedResults.summary.uniqueSubjects || 0) + data.summary.uniqueSubjects;
                }
              }
            }
            
            combinedResults.hasIssues = combinedResults.conflictCount > 0;
          } catch (err) {
            console.error(`Error checking conflicts for ${branchName} Semester ${semester}:`, err);
            combinedResults.branchResults[branchName][`Sem${semester}`] = { error: err.message };
          }
        }
      }

      console.log('Combined conflict results:', combinedResults);
      setConflictResults(combinedResults);
      setShowConflictModal(true);
      setMessage(`✓ Conflict check completed (${combinedResults.conflictCount} conflicts, ${combinedResults.warningCount} warnings)`);
    } catch (error) {
      console.error('All branches conflict check error:', error);
      setMessage('✗ Error checking conflicts: ' + (error.message || 'Unknown error'));
    } finally {
      setCheckingConflicts(false);
    }
  };

  const handleBranchCheckbox = (branchId) => {
    setNewSubject(prev => ({
      ...prev,
      branches: prev.branches.includes(branchId)
        ? prev.branches.filter(b => b !== branchId)
        : [...prev.branches, branchId]
    }));
  };

  const getFilteredSubjects = () => {
    return subjects.filter(subj => {
      const matchesSemester = !filterSemester || subj.semester === parseInt(filterSemester);
      return matchesSemester;
    });
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>

      {message && (
        <div className={`alert ${message.includes('✓') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('professors')}
          className={activeTab === 'professors' ? 'btn-primary' : 'btn-warning'}
          style={{ padding: '8px 15px' }}
        >
          👨‍🏫 Professors ({professors.length})
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={activeTab === 'subjects' ? 'btn-primary' : 'btn-warning'}
          style={{ padding: '8px 15px' }}
        >
          📚 Subjects ({subjects.length})
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={activeTab === 'feedback' ? 'btn-primary' : 'btn-warning'}
          style={{ padding: '8px 15px' }}
        >
          💬 Feedback ({feedback.length})
        </button>
        <button
          onClick={() => setActiveTab('timetable')}
          className={activeTab === 'timetable' ? 'btn-primary' : 'btn-warning'}
          style={{ padding: '8px 15px' }}
        >
          📅 Generate Timetable
        </button>
      </div>

      {loading && <div className="spinner"></div>}

      {activeTab === 'professors' && (
        <div className="card">
          <h2>👨‍🏫 Manage Professors</h2>

          <form onSubmit={handleAddProfessor} style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
            <h3>Add New Professor</h3>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={newProfessor.name}
                  onChange={(e) => setNewProfessor({ ...newProfessor, name: e.target.value })}
                  placeholder="Dr. John Doe"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newProfessor.email}
                  onChange={(e) => setNewProfessor({ ...newProfessor, email: e.target.value })}
                  placeholder="john@university.edu"
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={newProfessor.phone}
                  onChange={(e) => setNewProfessor({ ...newProfessor, phone: e.target.value })}
                  placeholder="9876543210"
                />
              </div>
            </div>
            <button type="submit" className="btn-success">
              ➕ Add Professor
            </button>
          </form>

          <h3>Professors List</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {professors.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>No professors</td>
                </tr>
              ) : (
                professors.map((prof) => (
                  <tr key={prof.professor_id}>
                    <td>{prof.name}</td>
                    <td>{prof.email}</td>
                    <td>{prof.phone || '-'}</td>
                    <td>
                      <button
                        onClick={() => {
                          localStorage.setItem('professorId', prof.professor_id);
                          localStorage.setItem('professorName', prof.name);
                          setMessage(`✓ Set ${prof.name} as current professor. Reload ProfessorPanel to see changes.`);
                        }}
                        className="btn-primary"
                        style={{ padding: '5px 10px', fontSize: '0.9rem', marginRight: '5px' }}
                      >
                        👤 Login
                      </button>
                      <button
                        onClick={() => handleDeleteProfessor(prof.professor_id)}
                        className="btn-danger"
                        style={{ padding: '5px 10px', fontSize: '0.9rem' }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="card">
          <h2>📚 Manage Subjects</h2>

          <form onSubmit={handleAddSubject} style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
            <h3>Add New Subject</h3>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Subject Name *</label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  placeholder="Database Management Systems"
                  required
                />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select
                  value={newSubject.type}
                  onChange={(e) => setNewSubject({ ...newSubject, type: e.target.value })}
                  required
                >
                  <option value="THEORY">Theory</option>
                  <option value="LAB">Lab</option>
                  <option value="BOTH">Both (Theory + Lab)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Semester *</label>
                <select
                  value={newSubject.semester}
                  onChange={(e) => setNewSubject({ ...newSubject, semester: parseInt(e.target.value) })}
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Weekly Lecture Count</label>
                <input
                  type="number"
                  value={newSubject.weeklyLectureCount}
                  onChange={(e) => setNewSubject({ ...newSubject, weeklyLectureCount: parseInt(e.target.value) })}
                  min="0"
                  max="5"
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>
                Map Professor (Optional - Professor can teach multiple subjects):
              </label>
              <select
                value={newSubject.professorId}
                onChange={(e) => setNewSubject({ ...newSubject, professorId: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="">-- No Professor Assigned --</option>
                {professors.map((prof) => (
                  <option key={prof.professor_id} value={prof.professor_id}>
                    {prof.name} ({prof.email})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#eff6ff', borderRadius: '4px' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>
                ✓ Select Branches (Subject is common for these branches):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {branches.map((branch) => (
                  <label key={branch.branch_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newSubject.branches.includes(branch.branch_id)}
                      onChange={() => handleBranchCheckbox(branch.branch_id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>{branch.name} ({branch.code})</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-success">
              ➕ Add Subject
            </button>
          </form>

          <h3>Subjects List</h3>
          
          {/* Semester Filter */}
          <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f0f7ff', borderRadius: '4px', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <label style={{ fontWeight: '600', marginBottom: 0 }}>Filter by Semester:</label>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '150px' }}
            >
              <option value="">-- All Semesters --</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>
              Showing {getFilteredSubjects().length} of {subjects.length} subjects
            </span>
          </div>

          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Sem</th>
                <th>Lectures</th>
                <th>Professor</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredSubjects().length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>No subjects found</td>
                </tr>
              ) : (
                getFilteredSubjects().map((subj) => (
                  <tr key={subj.subject_id}>
                    <td><strong>{subj.code}</strong></td>
                    <td>{subj.name}</td>
                    <td>{subj.type}</td>
                    <td>{subj.semester}</td>
                    <td>{subj.weekly_lecture_count}</td>
                    <td>{subj.professor_names || '—'}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteSubject(subj.subject_id)}
                        className="btn-danger"
                        style={{ padding: '5px 10px', fontSize: '0.9rem' }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="card">
          <h2>💬 Student Feedback</h2>
          {feedback.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              📭 No student feedback received yet
            </p>
          ) : (
            <div>
              <p style={{ color: '#666', marginBottom: '15px' }}>
                Total feedback: {feedback.length}
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Branch</th>
                      <th>Semester</th>
                      <th>Type</th>
                      <th>Feedback</th>
                      <th>Rating</th>
                      <th>Submitted</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedback.map((fb) => (
                      <tr key={fb.feedback_id}>
                        <td><strong>{fb.branch_id || '-'}</strong></td>
                        <td>{fb.semester}</td>
                        <td>{fb.feedback_type || 'General'}</td>
                        <td style={{ maxWidth: '300px' }}>
                          <details>
                            <summary style={{ cursor: 'pointer', color: '#3498db' }}>
                              {fb.feedback_text.substring(0, 50)}...
                            </summary>
                            <p style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                              {fb.feedback_text}
                            </p>
                          </details>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {fb.rating ? (
                            <span title={`Rating: ${fb.rating}/5`}>
                              {'⭐'.repeat(fb.rating)}
                            </span>
                          ) : '-'}
                        </td>
                        <td>{new Date(fb.created_at).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="btn-danger"
                            style={{ padding: '5px 10px', fontSize: '0.85rem' }}
                            onClick={() => {
                              if (window.confirm('Delete this feedback?')) {
                                adminAPI.deleteFeedback(fb.feedback_id)
                                  .then(() => {
                                    setFeedback(feedback.filter(f => f.feedback_id !== fb.feedback_id));
                                    setMessage('✓ Feedback deleted');
                                  })
                                  .catch(err => setMessage('✗ Error deleting feedback'));
                              }
                            }}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'timetable' && (
        <div className="card">
          <h2>📅 Generate Timetable</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Select a semester type and branch to generate an optimized timetable.
          </p>

          <form onSubmit={handleGenerateTimetable} style={{ maxWidth: '600px' }}>
            <div className="form-group" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '4px', border: '2px solid #3498db' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '15px', display: 'block', fontSize: '1.1rem' }}>
                📅 Generation Mode:
              </label>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="single"
                    checked={generateForm.generationType === 'single'}
                    onChange={(e) => setGenerateForm({ ...generateForm, generationType: e.target.value })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: '500' }}>Single Semester</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="odd"
                    checked={generateForm.generationType === 'odd'}
                    onChange={(e) => setGenerateForm({ ...generateForm, generationType: e.target.value })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: '500' }}>📊 Master (Odd: 1,3,5,7)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="even"
                    checked={generateForm.generationType === 'even'}
                    onChange={(e) => setGenerateForm({ ...generateForm, generationType: e.target.value })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: '500' }}>📊 Master (Even: 2,4,6,8)</span>
                </label>
              </div>
            </div>

            {generateForm.generationType === 'single' && (
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>
                  Select Specific Semester *
                </label>
                <select
                  value={generateForm.singleSemester}
                  onChange={(e) => setGenerateForm({ ...generateForm, singleSemester: e.target.value })}
                  required={generateForm.generationType === 'single'}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="">-- Select Semester --</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem} {sem % 2 === 0 ? '(Even)' : '(Odd)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(generateForm.generationType === 'odd' || generateForm.generationType === 'even') && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
                <p style={{ margin: '0', fontWeight: '500', color: '#856404' }}>
                  🔔 Master Timetable Mode: Will generate timetables for all {generateForm.generationType === 'odd' ? 'Odd' : 'Even'} semesters (Semester {generateForm.generationType === 'odd' ? '1, 3, 5, 7' : '2, 4, 6, 8'})
                </p>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={generateForm.allBranches}
                  onChange={(e) => setGenerateForm({ ...generateForm, allBranches: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: '500' }}>Generate for All Branches (COMP, IOT, AIML)</span>
              </label>
            </div>

            {!generateForm.allBranches && (
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>
                  Select Branch *
                </label>
                <select
                  value={generateForm.branchId}
                  onChange={(e) => setGenerateForm({ ...generateForm, branchId: e.target.value })}
                  required={!generateForm.allBranches}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="">-- Select Branch --</option>
                  {branches && branches.length > 0 ? (
                    branches.map((branch) => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.name} ({branch.code})
                      </option>
                    ))
                  ) : (
                    <option disabled>No branches available</option>
                  )}
                </select>
              </div>
            )}

            <button type="submit" className="btn-success" disabled={loading} style={{ fontSize: '1rem', padding: '10px 20px' }}>
              {loading ? '⏳ Generating...' : '🚀 Generate Timetable'}
            </button>
            {generatedTimetable.length > 0 && (
              <button 
                type="button" 
                onClick={handleClearTimetable}
                style={{
                  fontSize: '1rem',
                  padding: '10px 20px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginLeft: '10px'
                }}
              >
                🗑️ Clear Timetable
              </button>
            )}
          </form>

          {generatedTimetable.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0 }}>📋 Generated Timetable ({generatedTimetable.length} slots)</h3>
                <button
                  onClick={handleCheckConflicts}
                  disabled={checkingConflicts || (!generateForm.allBranches && (!generateForm.branchId || !generateForm.singleSemester)) || (generateForm.allBranches && generateForm.generationType === 'single' && !generateForm.singleSemester)}
                  style={{
                    padding: '8px 15px',
                    backgroundColor: (checkingConflicts || (!generateForm.allBranches && (!generateForm.branchId || !generateForm.singleSemester))) ? '#95a5a6' : '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: (checkingConflicts || (!generateForm.allBranches && (!generateForm.branchId || !generateForm.singleSemester))) ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                  title={generateForm.allBranches ? 'Check conflicts for all branches' : !generateForm.branchId ? 'Select a branch' : !generateForm.singleSemester ? 'Select a semester' : 'Check for conflicts'}
                >
                  {checkingConflicts ? '🔄 Checking...' : '✓ Check Conflicts'}
                </button>
              </div>
              <div style={{ overflowX: 'auto', marginTop: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderRadius: '4px' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2c3e50' }}>Branch</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2c3e50' }}>Semester</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2c3e50' }}>Day</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2c3e50' }}>Time</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2c3e50' }}>Duration</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2c3e50' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2c3e50' }}>Subject</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2c3e50' }}>Professor</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2c3e50' }}>Batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedTimetable.map((slot, idx) => {
                      const prof = professors.find(p => p.professor_id === slot.professor_id);
                      const branchName = slot.branch_name || 'Unknown Branch';
                      const isBreak = slot.slot_type === 'BREAK' || slot.slot_type === 'RECESS';
                      const isAdmin = slot.slot_type === 'LIBRARY' || slot.slot_type === 'PROJECT';
                      const bgColor = isBreak ? '#fff3cd' : isAdmin ? '#d1ecf1' : idx % 2 === 0 ? '#f9f9f9' : 'white';
                      const typeEmoji = slot.slot_type === 'THEORY' ? '📚' : slot.slot_type === 'LAB' ? '🔬' : slot.slot_type === 'BREAK' ? '☕' : slot.slot_type === 'RECESS' ? '🍽️' : slot.slot_type === 'LIBRARY' ? '📖' : '💼';
                      
                      // Format time to remove seconds
                      const formatTime = (timeStr) => {
                        if (!timeStr) return '-';
                        return timeStr.substring(0, 5); // Get HH:MM
                      };
                      
                      // Calculate duration
                      const startMin = parseInt(slot.time_slot_start.split(':')[0]) * 60 + parseInt(slot.time_slot_start.split(':')[1]);
                      const endMin = parseInt(slot.time_slot_end.split(':')[0]) * 60 + parseInt(slot.time_slot_end.split(':')[1]);
                      const durationMin = endMin - startMin;
                      const durationHr = durationMin / 60;
                      const durationStr = durationHr === 1 ? '1 hr' : durationHr === 2 ? '2 hrs' : `${durationMin} min`;
                      
                      return (
                        <tr key={idx} style={{ backgroundColor: bgColor, borderBottom: '1px solid #ddd' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#2c3e50' }}>{branchName}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 'bold', textAlign: 'center', color: '#d32f2f' }}>Sem {slot.semester}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>{slot.day_of_week}</td>
                          <td style={{ padding: '10px 12px' }}>{formatTime(slot.time_slot_start)} - {formatTime(slot.time_slot_end)}</td>
                          <td style={{ padding: '10px 12px', fontSize: '13px', color: '#666' }}>{durationStr}</td>
                          <td style={{ padding: '10px 12px' }}>{typeEmoji} {slot.slot_type}</td>
                          <td style={{ padding: '10px 12px', fontWeight: slot.subject_name !== '-' ? '500' : 'normal' }}>{slot.subject_name}</td>
                          <td style={{ padding: '10px 12px' }}>{prof ? prof.name : '-'}</td>
                          <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 'bold', color: slot.slot_type === 'LAB' ? '#d32f2f' : '#666' }}>
                            {slot.batch_number ? (
                              slot.batch_number === 1 ? '🔵 Batch A' : '🟡 Batch B'
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '4px', borderLeft: '4px solid #4caf50' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>📊 Timetable Statistics & Timing</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                  <div><strong>Total Slots:</strong> {generatedTimetable.length}</div>
                  <div><strong>Theory Classes:</strong> {generatedTimetable.filter(s => s.slot_type === 'THEORY').length} (1 hr each)</div>
                  <div><strong>Lab Sessions:</strong> {generatedTimetable.filter(s => s.slot_type === 'LAB').length} (2 hrs each)</div>
                  <div><strong>Breaks:</strong> {generatedTimetable.filter(s => s.slot_type === 'BREAK').length} (15 min)</div>
                  <div><strong>Recess:</strong> {generatedTimetable.filter(s => s.slot_type === 'RECESS').length} (45 min)</div>
                  <div><strong>Status:</strong> <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>✓ Conflict Free</span></div>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '4px', borderLeft: '4px solid #3498db' }}>
            <h4>ℹ️ Timetable Generation Details</h4>
            <ul style={{ marginLeft: '20px', color: '#555', lineHeight: '1.8' }}>
              <li><strong>College Hours:</strong> 9:00 AM - 5:00 PM</li>
              <li><strong>Tea Break:</strong> 11:00 AM - 11:15 AM (15 minutes)</li>
              <li><strong>Recess:</strong> 1:15 PM - 2:00 PM (45 minutes)</li>
              <li><strong>Lab Capacity:</strong> Maximum 5 labs at any time slot</li>
              <li><strong>Batch Scheduling:</strong> Batch A & B alternate schedules for fairness</li>
              <li><strong>Library Hour:</strong> Allocated once per week for conflict resolution</li>
              <li><strong>Project Hour:</strong> Allocated once per week for 2nd Year & 3rd Year (Sem 3-8 only)</li>
              <li><strong>Multi-Branch Subjects:</strong> Labs scheduled in different time slots per branch</li>
              <li><strong>Algorithm:</strong> Backtracking with constraint satisfaction</li>
            </ul>
          </div>
        </div>
      )}

      {/* Conflict Check Modal */}
      {showConflictModal && conflictResults && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '2px solid #ecf0f1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: conflictResults.success ? '#d4edda' : '#f8d7da'
            }}>
              <h2 style={{ margin: 0, color: conflictResults.success ? '#155724' : '#721c24' }}>
                {conflictResults.success ? '✓ Timetable is Valid!' : '⚠️ Conflicts Detected'}
              </h2>
              <button
                onClick={handleCloseConflictModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              {/* Summary */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '15px',
                marginBottom: '25px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>
                    {conflictResults.summary?.totalClasses || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Total Classes</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                    {conflictResults.conflictCount || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Critical Conflicts</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12' }}>
                    {conflictResults.warningCount || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Warnings</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
                    {conflictResults.gapCount || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Unused Slots</div>
                </div>
              </div>

              {/* Branch Results Summary (for multi-branch checks) */}
              {conflictResults.branchResults && Object.keys(conflictResults.branchResults).length > 0 && (
                <div style={{
                  marginBottom: '25px',
                  padding: '15px',
                  backgroundColor: '#f0f8ff',
                  borderRadius: '4px',
                  borderLeft: '4px solid #3498db'
                }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>📊 Per-Branch Summary</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '10px'
                  }}>
                    {Object.entries(conflictResults.branchResults).map(([branch, semesters]) => (
                      <div key={branch} style={{
                        padding: '10px',
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        border: '1px solid #ddd'
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#2c3e50' }}>
                          {branch}
                        </div>
                        {Object.entries(semesters).map(([sem, stats]) => (
                          <div key={sem} style={{
                            fontSize: '12px',
                            color: '#555',
                            marginBottom: '4px',
                            paddingLeft: '10px',
                            borderLeft: '2px solid #ecf0f1'
                          }}>
                            <span style={{ fontWeight: '500' }}>{sem}:</span> {typeof stats === 'object' && !stats.error ? (
                              <span>
                                🔴 {stats.conflicts || 0} | 🟠 {stats.warnings || 0} | 🔵 {stats.gaps || 0}
                              </span>
                            ) : (
                              <span style={{ color: '#e74c3c' }}>Error</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Critical Conflicts */}
              {conflictResults.conflicts && conflictResults.conflicts.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#c0392b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🔴 Critical Conflicts ({conflictResults.conflicts.length})
                  </h3>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {conflictResults.conflicts.map((conflict, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px',
                          backgroundColor: '#fadbd8',
                          borderLeft: '4px solid #e74c3c',
                          borderRadius: '4px'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', color: '#c0392b', marginBottom: '5px' }}>
                          {conflict.type.replace(/_/g, ' ')} {conflict.branch && <span style={{ fontSize: '12px', color: '#888' }}>({conflict.branch} - Sem {conflict.semester})</span>}
                        </div>
                        <div style={{ fontSize: '13px', color: '#555', marginBottom: '5px' }}>
                          <strong>Reason:</strong> {conflict.reason}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', display: 'grid', gap: '3px' }}>
                          {conflict.class1 && <div>→ Class 1: {conflict.class1}</div>}
                          {conflict.class2 && <div>→ Class 2: {conflict.class2}</div>}
                          {conflict.professor && <div>→ Professor: {conflict.professor}</div>}
                          {conflict.batch && <div>→ {conflict.batch}</div>}
                          {conflict.room && <div>→ Room: {conflict.room}</div>}
                          {conflict.lab && <div>→ Lab: {conflict.lab}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {conflictResults.warnings && conflictResults.warnings.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#d68910', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🟠 Warnings ({conflictResults.warnings.length})
                  </h3>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {conflictResults.warnings.map((warning, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px',
                          backgroundColor: '#fef5e7',
                          borderLeft: '4px solid #f39c12',
                          borderRadius: '4px'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', color: '#d68910', marginBottom: '5px' }}>
                          {warning.type.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: '13px', color: '#555' }}>
                          {warning.reason}
                        </div>
                        {warning.subject && (
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                            → Subject: {warning.subject}
                          </div>
                        )}
                        {warning.time && (
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            → Time: {warning.time}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unused Slots */}
              {conflictResults.gaps && conflictResults.gaps.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#3498db', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ℹ️ Unused Time Slots ({conflictResults.gaps.length})
                  </h3>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#d6eaf8',
                    borderLeft: '4px solid #3498db',
                    borderRadius: '4px',
                    fontSize: '12px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {conflictResults.gaps.map((gap, idx) => (
                      <div key={idx} style={{ marginBottom: '5px', color: '#1c5aa0' }}>
                        → {gap.day} {gap.time} ({gap.duration} min)
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '12px', color: '#555', marginTop: '8px', fontStyle: 'italic' }}>
                    💡 Tip: These unused slots could be used for makeup classes or additional subjects.
                  </div>
                </div>
              )}

              {/* Success Message */}
              {conflictResults.success && (
                <div style={{
                  padding: '15px',
                  backgroundColor: '#d4edda',
                  borderLeft: '4px solid #28a745',
                  borderRadius: '4px',
                  color: '#155724',
                  fontWeight: 'bold'
                }}>
                  ✓ Timetable passes all validation checks! No critical conflicts detected.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '15px',
              borderTop: '2px solid #ecf0f1',
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCloseConflictModal}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Close
              </button>
              <button
                onClick={handleGenerateTimetable}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🔄 Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
