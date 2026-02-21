import { useState, useEffect, type FormEvent } from 'react';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { usersService } from '../services/usersService';
import './Settings.css';

export const Settings = () => {
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avatarError, setAvatarError] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setAvatarError(false);
  }, [photoURL]);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        setDisplayName(currentUser.displayName ?? '');
        setPhotoURL(currentUser.photoURL ?? '');
        setAvatarError(false);
        const doc = await usersService.getUserDocument(currentUser.uid);
        if (!cancelled && doc?.phoneNumber) setPhoneNumber(doc.phoneNumber);
      } catch (err) {
        if (!cancelled) setError('Failed to load profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [currentUser]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError('');
    setSaving(true);
    try {
      await updateProfile(currentUser, {
        displayName: displayName.trim() || null,
        photoURL: photoURL.trim() || null,
      });
      await usersService.updateUserDocument(currentUser.uid, {
        displayName: displayName.trim() || null,
        photoURL: photoURL.trim() || null,
        phoneNumber: phoneNumber.trim() || null,
      });
      toast.success('Profile updated successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="settings-page">
        <div className="page-header">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">You must be signed in to view settings.</p>
        </div>
      </div>
    );
  }

  const email = currentUser.email ?? '';
  const emailVerified = currentUser.emailVerified;

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">View and update your profile</p>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="settings-alert">
          {error}
        </Alert>
      )}

      <Card className="settings-card profile-card">
        <h2 className="card-title">Profile</h2>
        {loading ? (
          <div className="settings-loading">Loading profile...</div>
        ) : (
          <form onSubmit={handleSubmit} className="settings-form">
            <div className="profile-avatar-row">
              <div className="profile-avatar">
                {photoURL && !avatarError ? (
                  <img
                    src={photoURL}
                    alt=""
                    className="profile-avatar-img"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span className="profile-avatar-placeholder">
                    {(displayName || email).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="profile-avatar-hint">Photo updates when you save.</div>
            </div>
            <Input
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              disabled={saving}
            />
            <Input
              label="Photo URL"
              type="url"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              disabled={saving}
              helperText="Optional. Link to a profile image."
            />
            <div className="input-wrapper">
              <label className="input-label">Email</label>
              <div className="profile-email-row">
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="input input--readonly"
                  aria-label="Email (read-only)"
                />
                {emailVerified && (
                  <span className="profile-verified" title="Verified">✓ Verified</span>
                )}
              </div>
              <span className="input-helper">Email cannot be changed here. Use your account provider to change it.</span>
            </div>
            <Input
              label="Phone (optional)"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 234 567 8900"
              disabled={saving}
              helperText="Stored in your profile only."
            />
            <Button type="submit" variant="primary" disabled={saving} fullWidth>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};
