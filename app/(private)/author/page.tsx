"use client"

import { useAdminUser, useAuthStore, useManagerUser } from '@/store/authStore';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DashboardPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, loading, logout } = useAuthStore();
  const adminUser = useAdminUser();
  const managerUser = useManagerUser();

  // Check authentication status on mount
  useEffect(() => {
    checkAuth().then((authenticated) => {
      if (!authenticated) {
        router.push('/login');
      }
    });
  }, [checkAuth, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          {adminUser ? 'Admin Dashboard' : 'Manager Dashboard'}
        </h1>
      </div>

      {adminUser && (
        <div className="rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Admin Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p>Full Name:</p>
              <p className="font-medium">{adminUser.full_name}</p>
            </div>
            <div>
              <p>Email:</p>
              <p className="font-medium">{adminUser.email}</p>
            </div>
            <div>
              <p>Phone Number:</p>
              <p className="font-medium">{adminUser.phone_number || 'Not provided'}</p>
            </div>
            <div>
              <p>Company Website:</p>
              <p className="font-medium">{adminUser.company_website || 'Not provided'}</p>
            </div>
          </div>
        </div>
      )}

      {managerUser && (
        <div className="rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Manager Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p>Employee ID:</p>
              <p className="font-medium">{managerUser.employee_id}</p>
            </div>
            <div>
              <p>Manager ID:</p>
              <p className="font-medium">{managerUser.manager_id}</p>
            </div>
            <div>
              <p>Name:</p>
              <p className="font-medium">
                {managerUser.first_name} {managerUser.last_name}
              </p>
            </div>
            <div>
              <p>Email:</p>
              <p className="font-medium">{managerUser.email}</p>
            </div>
            <div>
              <p>Phone Number:</p>
              <p className="font-medium">{managerUser.phone_number || 'Not provided'}</p>
            </div>
            <div>
              <p>Date of Birth:</p>
              <p className="font-medium">{managerUser.date_of_birth || 'Not provided'}</p>
            </div>
            <div>
              <p>Emergency Contact:</p>
              <p className="font-medium">
                {managerUser.emergency_contact_name || 'Not provided'}
                {managerUser.emergency_contact_phone && ` (${managerUser.emergency_contact_phone})`}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Account Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p>Account Created:</p>
            <p className="font-medium">
              {new Date(user?.created_at || '').toLocaleDateString()}
            </p>
          </div>
          <div>
            <p>Last Updated:</p>
            <p className="font-medium">
              {new Date(user?.updated_at || '').toLocaleDateString()}
            </p>
          </div>
          <div>
            <p>User Role:</p>
            <p className="font-medium capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;