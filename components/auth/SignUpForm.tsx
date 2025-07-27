import { useState } from 'react';
import { useRouter } from 'next/router';
import { apiAxios } from '@/lib/apiAxios';

export default function SignUpForm() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
    company_website: '',
    pan_number: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // const response = await fetch('/api/auth/signup', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(formData),
      // });

      // const data = await response.json();

      // if (!data.success) {
      //   throw new Error(data.message);
      // }

      await apiAxios.post('/api/auth/signup', formData);

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-500">{error}</div>}
      
      <div>
        <label className="block">Full Name*</label>
        <input
          type="text"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div>
        <label className="block">Email*</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div>
        <label className="block">Password* (min 8 characters)</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          minLength={8}
          required
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div>
        <label className="block">Phone Number</label>
        <input
          type="tel"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div>
        <label className="block">Company Website</label>
        <input
          type="url"
          name="company_website"
          value={formData.company_website}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div>
        <label className="block">PAN Number</label>
        <input
          type="text"
          name="pan_number"
          value={formData.pan_number}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
      >
        {loading ? 'Signing up...' : 'Sign Up'}
      </button>
    </form>
  );
}