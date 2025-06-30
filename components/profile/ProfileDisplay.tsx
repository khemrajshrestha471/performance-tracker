import { useEffect, useState } from 'react';
import { User } from '../../types/auth';

export default function ProfileDisplay() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch profile');
        }

        setUser(data.user);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!user) return <div>No user data found</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Profile Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold">Full Name</h3>
          <p>{user.full_name}</p>
        </div>
        
        <div>
          <h3 className="font-semibold">Email</h3>
          <p>{user.email}</p>
        </div>
        
        {user.phone_number && (
          <div>
            <h3 className="font-semibold">Phone Number</h3>
            <p>{user.phone_number}</p>
          </div>
        )}
        
        {user.company_website && (
          <div>
            <h3 className="font-semibold">Company Website</h3>
            <a 
              href={user.company_website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {user.company_website}
            </a>
          </div>
        )}
        
        {user.pan_number && (
          <div>
            <h3 className="font-semibold">PAN Number</h3>
            <p>{user.pan_number}</p>
          </div>
        )}
      </div>
    </div>
  );
}