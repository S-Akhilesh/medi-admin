import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import './Users.css';

export const Users = () => {
  // Mock user data - in a real app, this would come from an API
  const users = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active', joined: '2024-01-15' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active', joined: '2024-02-20' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'inactive', joined: '2024-03-10' },
    { id: '4', name: 'Alice Williams', email: 'alice@example.com', role: 'Moderator', status: 'active', joined: '2024-03-25' },
  ];

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage user accounts and permissions</p>
        </div>
        <Button variant="primary">Add User</Button>
      </div>

      <Card className="users-card">
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{user.name.charAt(0)}</div>
                      <span className="user-name">{user.name}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-badge--${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-badge--${user.status}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{new Date(user.joined).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm">Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

