'use client';

import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, Calendar, Search, Filter, UserPlus, RefreshCw } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'on-leave';
  joinDate: string;
}

const demoTeam: TeamMember[] = [
  { id: '1', name: 'Arun Mehta', email: 'arun.mehta@company.com', phone: '+91 98765 43210', role: 'Warehouse Manager', department: 'Operations', status: 'active', joinDate: '2022-03-15' },
  { id: '2', name: 'Priya Sharma', email: 'priya.sharma@company.com', phone: '+91 98765 43211', role: 'Logistics Coordinator', department: 'Logistics', status: 'active', joinDate: '2021-07-20' },
  { id: '3', name: 'Rahul Gupta', email: 'rahul.gupta@company.com', phone: '+91 98765 43212', role: 'Inventory Analyst', department: 'Operations', status: 'active', joinDate: '2023-01-10' },
  { id: '4', name: 'Sneha Patel', email: 'sneha.patel@company.com', phone: '+91 98765 43213', role: 'Supply Chain Manager', department: 'Management', status: 'active', joinDate: '2020-05-01' },
  { id: '5', name: 'Vikram Singh', email: 'vikram.singh@company.com', phone: '+91 98765 43214', role: 'Fleet Manager', department: 'Logistics', status: 'on-leave', joinDate: '2022-09-12' },
  { id: '6', name: 'Anita Desai', email: 'anita.desai@company.com', phone: '+91 98765 43215', role: 'Data Analyst', department: 'Analytics', status: 'active', joinDate: '2023-06-01' },
  { id: '7', name: 'Mohammed Rafi', email: 'mohammed.rafi@company.com', phone: '+91 98765 43216', role: 'Procurement Officer', department: 'Procurement', status: 'active', joinDate: '2021-11-15' },
  { id: '8', name: 'Kavita Nair', email: 'kavita.nair@company.com', phone: '+91 98765 43217', role: 'Quality Controller', department: 'Operations', status: 'inactive', joinDate: '2022-02-28' },
];

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/team.json');
        if (response.ok) {
          const data = await response.json();
          setTeam(data);
        } else {
          setTeam(demoTeam);
        }
      } catch {
        setTeam(demoTeam);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const departments = ['all', ...new Set(team.map(m => m.department))];

  const filteredTeam = team.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter === 'all' || member.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const stats = {
    total: team.length,
    active: team.filter(m => m.status === 'active').length,
    onLeave: team.filter(m => m.status === 'on-leave').length,
    inactive: team.filter(m => m.status === 'inactive').length,
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'on-leave': 'bg-yellow-100 text-yellow-800',
      'inactive': 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status]}`}>
        {status.replace('-', ' ')}
      </span>
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500">Manage your team members</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <UserPlus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Members</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Users className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">On Leave</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.onLeave}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Inactive</p>
              <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept === 'all' ? 'All Departments' : dept}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="on-leave">On Leave</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeam.map((member) => (
          <div key={member.id} className="bg-white rounded-xl border shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getAvatarColor(member.name)}`}>
                {getInitials(member.name)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{member.name}</h3>
                  {getStatusBadge(member.status)}
                </div>
                <p className="text-sm text-blue-600">{member.role}</p>
                <p className="text-xs text-gray-500 mt-1">{member.department}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                {member.email}
              </div>
              {member.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {member.phone}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4 text-gray-400" />
                Joined {member.joinDate}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Data Source Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">📁 Load Your Own Data</h3>
        <p className="text-sm text-blue-800">
          Place your <code className="bg-blue-100 px-1 rounded">team.json</code> file in the <code className="bg-blue-100 px-1 rounded">/public/data/</code> folder.
        </p>
      </div>
    </div>
  );
}
