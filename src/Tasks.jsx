import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { signOut } from 'firebase/auth';

// firebase function to validate empty string
const validateEmptyString = httpsCallable(functions, 'validateEmptyString');

// loading spinner animation
// used to show loading state in submit button
const Spinner = () => (
  <div style={styles.spinnerContainer}>
    <div style={styles.spinner}></div>
  </div>
);

// tasks component
const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [sortOrder, setSortOrder] = useState('asc'); 
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: ''
  });
  const [editingTask, setEditingTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [error, setError] = useState(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // privateRoute will automatically redirect to home page
    } catch (error) {
      console.error('Error logging out:', error);
      setError('Failed to logout. Please try again.');
    }
  };

  // fetch tasks from Firestore
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('userId', '==', user.uid),
          orderBy('dueDate', 'asc')
        );
        const querySnapshot = await getDocs(tasksQuery);
        const tasksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dueDate: doc.data().dueDate.toDate().toISOString(),
          createdAt: doc.data().createdAt.toDate().toISOString()
        }));
        setTasks(tasksData);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks');
      }
    };

    if (user) {
      fetchTasks();
    }
  }, [user]);

  // validate input string when create new task
  const validateInput = async (value, fieldName) => {
    try {
      const result = await validateEmptyString({ inputString: value });
      if (!result.data.success) {
        throw new Error(`${fieldName} ${result.data.message}`);
      }
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };


  // create a new task
   const handleCreateTask = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); 
    try {

      // validate title and description
      const isTitleValid = await validateInput(newTask.title, 'Title and Description');
      const isDescriptionValid = await validateInput(newTask.description, 'Title and Description');
      
      // if validation fails, stop creating task
      if (!isTitleValid || !isDescriptionValid) {
        setIsSubmitting(false); 
        return;
      }

      // new task data
      const taskData = {
        userId: user.uid,
        title: newTask.title,
        description: newTask.description,
        dueDate: new Date(newTask.dueDate),
        createdAt: new Date()
      };

      // add new task to Firestore
      const docRef = await addDoc(collection(db, 'tasks'), taskData);
      const newTaskWithId = {
        id: docRef.id,
        ...taskData,
        dueDate: taskData.dueDate.toISOString(),
        createdAt: taskData.createdAt.toISOString()
      };

      setTasks([newTaskWithId, ...tasks]); // add new task to task list
      setNewTask({ title: '', description: '', dueDate: '' }); // reset form
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task');
    } finally {
      setIsSubmitting(false); 
    }
  };


  // update a task
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      const taskRef = doc(db, 'tasks', editingTask.id);
      const updateData = {
        title: editingTask.title,
        description: editingTask.description,
        dueDate: new Date(editingTask.dueDate)
      };

      await updateDoc(taskRef, updateData);
      
      const updatedTasks = tasks.map(task => 
        task.id === editingTask.id
          ? { 
              ...task, 
              ...updateData,
              dueDate: updateData.dueDate.toISOString()
            }
          : task
      );

      setTasks(updatedTasks);
      setEditingTask(null);
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task');
    }
  };


  // delete a task
  const handleDeleteTask = async (taskId) => {
    console.log("taskId : ",taskId)
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
    }
  };

  // start editing a task
  const startEdit = (task) => {
    setEditingTask({ ...task });
  };

  // sort tasks by due date
  const handleSort = () => {
    const sortedTasks = [...tasks].sort((a, b) => {
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    setTasks(sortedTasks);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // check if task is overdue
  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  // due date style
  // overdue tasks are red, not overdue tasks are green
  const getDueDateStyle = (dueDate) => {
    return {
      color: isOverdue(dueDate) ? '#dc2626' : '#16a34a', 
      fontWeight: '500'
    };
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleBox}>
          <h2 style={styles.title}>Task Manager</h2>
        </div>
        <div style={styles.userInfo}>
          <span style={styles.userEmail}>{user.email}</span>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      
      <div style={styles.content}>
        <div style={styles.columnsContainer}>
          {/* Left Column - Create Task */}
          <div style={{...styles.column, ...styles.columnLeft}}>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
              <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} style={styles.form}>
                <input
                  type="text"
                  placeholder="Title"
                  value={editingTask ? editingTask.title : newTask.title}
                  onChange={(e) => editingTask 
                    ? setEditingTask({ ...editingTask, title: e.target.value })
                    : setNewTask({ ...newTask, title: e.target.value })
                  }
                  style={styles.input}
                  required
                />
                <textarea
                  placeholder="Description"
                  value={editingTask ? editingTask.description : newTask.description}
                  onChange={(e) => editingTask
                    ? setEditingTask({ ...editingTask, description: e.target.value })
                    : setNewTask({ ...newTask, description: e.target.value })
                  }
                  style={styles.textarea}
                  required
                />
                <input
                  type="datetime-local"
                  value={editingTask 
                    ? editingTask.dueDate.slice(0, 16) 
                    : newTask.dueDate
                  }
                  onChange={(e) => editingTask
                    ? setEditingTask({ ...editingTask, dueDate: e.target.value })
                    : setNewTask({ ...newTask, dueDate: e.target.value })
                  }
                  style={styles.input}
                  required
                />
                <button 
                  type="submit" 
                  style={{
                    ...styles.button,
                    opacity: isSubmitting ? 0.7 : 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Spinner />}
                  {editingTask ? 'Update Task' : (isSubmitting ? 'Creating Task...' : 'Create Task')}
                </button>
                {editingTask && (
                  <button 
                    type="button" 
                    onClick={() => setEditingTask(null)}
                    style={styles.cancelButton}
                  >
                    Cancel Edit
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Right Column - Task List */}
          <div style={{...styles.column, ...styles.columnRight}}>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                Your Tasks
                <button onClick={handleSort} style={styles.sortButton}>
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </h3>
              <div style={styles.tasksContainer}>
                {tasks.length === 0 ? (
                  <p>No tasks yet. Create one in the left panel!</p>
                ) : (
                  tasks.map(task => (
                    <div key={task.id} style={styles.task}>
                      <div style={styles.taskHeader}>
                        <h4 style={styles.taskTitle}>{task.title}</h4>
                        <div style={styles.taskActions}>
                          <button onClick={() => startEdit(task)} style={styles.editButton}>
                            Edit
                          </button>
                          <button onClick={() => handleDeleteTask(task.id)} style={styles.deleteButton}>
                            Delete
                          </button>
                        </div>
                      </div>
                      <p style={styles.taskDescription}>{task.description}</p>
                      <div style={styles.taskMeta}>
                        <span style={getDueDateStyle(task.dueDate)}>
                          Due: {new Date(task.dueDate).toLocaleString()}
                        </span>
                        <span>Created: {new Date(task.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// styles for the tasks page
const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#e6f2ff',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#1e40af',
    color: 'white',
    width: '100%',
    flexShrink: 0,
  },
  titleBox: {
    padding: '0.5rem 1rem',
    backgroundColor: '#152e67',
    borderRadius: '4px',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userEmail: {
    fontSize: '1rem',
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  content: {
    flex: 1,
    padding: '2rem',
    width: '100%',
    margin: '0 auto',
    overflowY: 'hidden',
    height: 'calc(100% - 64px)',
  },
  columnsContainer: {
    display: 'flex',
    height: '100%',
    width: '100%',
  },
  column: {
    minWidth: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  columnLeft: {
    flex: '0 0 30%',
    paddingRight: '1rem',
  },
  columnRight: {
    flex: '0 0 70%',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: '#1e40af',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  tasksContainer: {
    overflowY: 'auto',
    flex: 1,
    paddingRight: '0.5rem',
  },
  input: {
    padding: '0.75rem',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid #d1d5db',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
  },
  textarea: {
    padding: '0.75rem',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid #d1d5db',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    minHeight: '100px',
    resize: 'vertical',
  },
  button: {
    padding: '0.75rem',
    fontSize: '1rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  cancelButton: {
    padding: '0.75rem',
    fontSize: '1rem',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  task: {
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    padding: '1rem',
    marginBottom: '1rem',
    backgroundColor: '#f8fafc',
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  taskTitle: {
    margin: 0,
    color: '#1e40af',
  },
  taskDescription: {
    marginBottom: '0.5rem',
    color: '#4b5563',
  },
  taskActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  editButton: {
    padding: '0.25rem 0.5rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  deleteButton: {
    padding: '0.25rem 0.5rem',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  taskMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  sortButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.25rem',
    padding: '4px 8px',
    color: '#666',
  },
  spinnerContainer: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    borderTopColor: '#fff',
    animation: 'spin 0.8s linear infinite',
  },
};

// keyframes for the loading spinner
const spinKeyframes = `
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const styleTag = document.createElement('style');
styleTag.innerHTML = spinKeyframes;
document.head.appendChild(styleTag);

export default Tasks;
