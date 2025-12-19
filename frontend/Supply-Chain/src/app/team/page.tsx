'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { teamApi, TeamMember } from '@/lib/api';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Mail,
  Phone,
  AlertTriangle,
  X,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Clock,
  Building,
  Calendar,
} from 'lucide-react';

type TeamStatus = 'active' | 'inactive' | 'on-leave';

const statusConfig: Record<TeamStatus, { label: string; color: string; bgColor: string; icon: React.ComponentType<any> }> = {
  active: { label: 'Active', color: 'text-green-700', bgColor: 'bg-green-100', icon: UserCheck },
  inactive: { label: 'Inactive', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: UserX },
  'on-leave': { label: 'On Leave', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Clock },
};

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const teamData = await teamApi.getAll();
      setTeam(teamData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch team members');
      console.error('Error fetching team:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get unique departments
  const departments = Array.from(new Set(team.map(m => m.department)));

  // Filter team members
  const filteredTeam = team.filter(member => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || member.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Stats
  const totalMembers = team.length;
  const activeMembers = team.filter(m => m.status === 'active').length;
  const onLeaveMembers = team.filter(m => m.status === 'on-leave').length;
  const departmentCount = departments.length;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newMember = await teamApi.create(formData);
      setTeam([...team, newMember]);
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to add team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setIsSubmitting(true);

    try {
      const updatedMember = await teamApi.update(selectedMember.id, formData);
      setTeam(team.map(m => (m.id === selectedMember.id ? updatedMember : m)));
      setShowEditModal(false);
      setSelectedMember(null);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to update team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    setIsSubmitting(true);

    try {
      await teamApi.delete(selectedMember.id);
      setTeam(team.filter(m => m.id !== selectedMember.id));
      setShowDeleteModal(false);
      setSelectedMember(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (memberId: string, newStatus: TeamStatus) => {
    try {
      const updatedMember = await teamApi.updateStatus(memberId, newStatus);
      setTeam(team.map(m => (m.id === memberId ? updatedMember : m)));
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const openEditModal = (member: TeamMember) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
      department: member.department,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      department: '',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-red-500',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600">Manage your team members and their roles</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Total Members</p>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalMembers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Active</p>
            <UserCheck className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeMembers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">On Leave</p>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{onLeaveMembers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Departments</p>
            <Building className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-600 mt-1">{departmentCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on-leave">On Leave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeam.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No team members found
          </div>
        ) : (
          filteredTeam.map(member => {
            const status = statusConfig[member.status];
            const StatusIcon = status.icon;

            return (
              <div
                key={member.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full ${getAvatarColor(member.name)} flex items-center justify-center text-white font-semibold`}>
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        getInitials(member.name)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 truncate">{member.name}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${status.bgColor} ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-blue-600">{member.role}</p>
                      <p className="text-xs text-gray-500">{member.department}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {new Date(member.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <select
                    value={member.status}
                    onChange={e => handleUpdateStatus(member.id, e.target.value as TeamStatus)}
                    className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on-leave">On Leave</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(member)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMember(member);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add Team Member</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  required
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Warehouse Manager"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Operations"
                  list="departments"
                />
                <datalist id="departments">
                  {departments.map(dept => (
                    <option key={dept} value={dept} />
                  ))}
                </datalist>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Edit Team Member</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditMember} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  required
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold">Remove Team Member</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove <strong>{selectedMember.name}</strong> from the team? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteMember}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
