import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit2, 
  Trash2, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  X,
  Search,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { UserAccount, UserRole } from '../../types';

export const UserManagementPage: React.FC = () => {
  const { 
    currentUser, 
    users, 
    addUser, 
    editUser, 
    deleteUser, 
    toggleStatus, 
    changePassword 
  } = useAuth();
  const { t } = useI18n();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [resettingUser, setResettingUser] = useState<UserAccount | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserAccount | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('Field Engineer');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenAddModal = () => {
    setFormName('');
    setFormUsername('');
    setFormRole('Field Engineer');
    setFormEmail('');
    setFormPassword('welcome123');
    setModalError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!formName.trim() || !formUsername.trim()) {
      setModalError('Name and Username are required.');
      return;
    }
    try {
      addUser({
        name: formName,
        username: formUsername,
        role: formRole,
        email: formEmail,
        password: formPassword || 'welcome123',
      });
      setIsAddModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'Failed to add user.');
    }
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormRole(user.role);
    setFormEmail(user.email || '');
    setModalError(null);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setModalError(null);
    if (!formName.trim()) {
      setModalError('Name cannot be empty.');
      return;
    }
    try {
      editUser(editingUser.id, {
        name: formName,
        role: formRole,
        email: formEmail,
      });
      setEditingUser(null);
    } catch (err: any) {
      setModalError(err.message || 'Failed to update user.');
    }
  };

  const handleOpenResetPassword = (user: UserAccount) => {
    setResettingUser(user);
    setNewPassword('');
    setModalError(null);
  };

  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    if (!newPassword.trim() || newPassword.length < 5) {
      setModalError('Password must be at least 5 characters.');
      return;
    }
    changePassword(resettingUser.id, newPassword);
    setResettingUser(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmUser) return;
    deleteUser(deleteConfirmUser.id);
    setDeleteConfirmUser(null);
  };

  const getTranslatedRole = (role: string) => {
    switch (role) {
      case 'Administrator':
        return t('adminRole', 'Administrator');
      case 'Field Engineer':
        return t('fieldEngRole', 'Field Engineer');
      case 'Production Engineer':
        return t('prodEngRole', 'Production Engineer');
      case 'Maintenance Engineer':
        return t('maintEngRole', 'Maintenance Engineer');
      case 'Viewer':
        return t('viewerRole', 'Viewer');
      default:
        return role;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[#1E293B] tracking-tight">
              {t('userManagementTitle', 'User Management')}
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#E6FFFA] text-[#0D9488] border border-[#99F6E4] font-semibold">
              {currentUser?.role || t('adminRole', 'Administrator')}
            </span>
          </div>
          <p className="text-xs text-[#475569]">
            {t('userManagementSub', 'Configure authorized oil-field operators, engineering roles, and access credentials')}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{t('addUser', 'Add Operator')}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={t('searchUsers', 'Search users by name, username, or role...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#0D9488] rounded text-xs text-[#1E293B] placeholder:text-[#94A3B8] outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748B]">{t('roleCol', 'Role')}:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#FFFFFF] border border-[#CBD5E1] rounded px-2.5 py-1 text-xs text-[#1E293B] font-medium outline-none cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="Administrator">{t('adminRole', 'Administrator')}</option>
            <option value="Field Engineer">{t('fieldEngRole', 'Field Engineer')}</option>
            <option value="Production Engineer">{t('prodEngRole', 'Production Engineer')}</option>
            <option value="Maintenance Engineer">{t('maintEngRole', 'Maintenance Engineer')}</option>
            <option value="Viewer">{t('viewerRole', 'Viewer')}</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg overflow-hidden shadow-xs">
        <div className="px-4 py-2.5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs text-[#64748B]">
          <span className="font-semibold text-[#1E293B] uppercase tracking-wider text-[11px] font-mono">
            {t('userManagementTitle', 'Authorized Personnel Directory')}
          </span>
          <span className="font-mono text-[10px]">{filteredUsers.length} Users Listed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[10px] uppercase font-mono text-[#64748B]">
                <th className="py-2.5 px-4 font-semibold">{t('userCol', 'User')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('usernameCol', 'Username')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('roleCol', 'Role')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('statusCol', 'Status')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('lastLoginCol', 'Last Login')}</th>
                <th className="py-2.5 px-4 font-semibold text-right">{t('actionsCol', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#64748B]">
                    No operators found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = currentUser?.id === user.id;
                  return (
                    <tr key={user.id} className="hover:bg-[#F8FAFC] transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] font-semibold text-[11px] flex items-center justify-center shrink-0">
                            {user.avatarInitials}
                          </div>
                          <div>
                            <div className="font-semibold text-[#1E293B]">
                              {user.name} {isCurrent && <span className="text-[10px] text-[#0D9488] font-mono">(You)</span>}
                            </div>
                            <div className="text-[10px] text-[#64748B]">{user.email || `${user.username}@baghewala-ops.in`}</div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3 px-4 font-mono font-medium text-[#475569]">
                        {user.username}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                          user.role === 'Administrator' ? 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]' :
                          user.role === 'Field Engineer' ? 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]' :
                          user.role === 'Production Engineer' ? 'bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]' :
                          user.role === 'Maintenance Engineer' ? 'bg-[#F3E8FF] text-[#7E22CE] border border-[#E9D5FF]' :
                          'bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]'
                        }`}>
                          {getTranslatedRole(user.role)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => !isCurrent && toggleStatus(user.id)}
                          disabled={isCurrent}
                          title={isCurrent ? "You cannot disable your own active account" : "Click to toggle active status"}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                            user.status === 'Active'
                              ? 'bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0]'
                              : 'bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]'
                          } ${isCurrent ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:opacity-80'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-[#047857]' : 'bg-[#64748B]'}`} />
                          <span>{user.status === 'Active' ? t('active', 'Active') : t('disabled', 'Disabled')}</span>
                        </button>
                      </td>

                      {/* Last Login */}
                      <td className="py-3 px-4 font-mono text-[11px] text-[#64748B]">
                        {user.lastLogin}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenResetPassword(user)}
                            title={t('resetPassword', 'Reset password')}
                            className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0D9488] transition-colors cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            title={t('edit', 'Edit operator profile')}
                            className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0D9488] transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={() => setDeleteConfirmUser(user)}
                              title={t('delete', 'Delete operator')}
                              className="p-1.5 rounded hover:bg-[#FEF2F2] text-[#64748B] hover:text-[#DC2626] transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD USER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#0D9488]" />
                <h3 className="text-sm font-semibold text-[#1E293B]">{t('addUser', 'Register New Operator')}</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#64748B] hover:text-[#1E293B] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 rounded bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC2626]">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveNewUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#475569] font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#0D9488] rounded text-[#1E293B] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#475569] font-medium mb-1">{t('usernameCol', 'Username')} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ramesh.chandra"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#0D9488] rounded text-[#1E293B] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[#475569] font-medium mb-1">{t('roleCol', 'Role Permission')} *</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#0D9488] rounded text-[#1E293B] outline-none cursor-pointer"
                >
                  <option value="Administrator">{t('adminRole', 'Administrator')}</option>
                  <option value="Field Engineer">{t('fieldEngRole', 'Field Engineer')}</option>
                  <option value="Production Engineer">{t('prodEngRole', 'Production Engineer')}</option>
                  <option value="Maintenance Engineer">{t('maintEngRole', 'Maintenance Engineer')}</option>
                  <option value="Viewer">{t('viewerRole', 'Viewer')}</option>
                </select>
              </div>

              <div>
                <label className="block text-[#475569] font-medium mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="name@baghewala-ops.in"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#0D9488] rounded text-[#1E293B] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#475569] font-medium mb-1">{t('passwordLabel', 'Initial Password')}</label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#0D9488] rounded text-[#1E293B] outline-none font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] font-medium cursor-pointer"
                >
                  {t('cancelBtn', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#0D9488] text-white hover:bg-[#0F766E] font-semibold cursor-pointer shadow-xs"
                >
                  {t('addUser', 'Create Operator')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#0D9488]" />
                <h3 className="text-sm font-semibold text-[#1E293B]">{t('edit', 'Edit Operator')}: {editingUser.username}</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-[#64748B] hover:text-[#1E293B] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 rounded bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC2626]">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#475569] font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#0D9488] rounded text-[#1E293B] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#475569] font-medium mb-1">{t('roleCol', 'Assigned Role')}</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#0D9488] rounded text-[#1E293B] outline-none cursor-pointer"
                >
                  <option value="Administrator">{t('adminRole', 'Administrator')}</option>
                  <option value="Field Engineer">{t('fieldEngRole', 'Field Engineer')}</option>
                  <option value="Production Engineer">{t('prodEngRole', 'Production Engineer')}</option>
                  <option value="Maintenance Engineer">{t('maintEngRole', 'Maintenance Engineer')}</option>
                  <option value="Viewer">{t('viewerRole', 'Viewer')}</option>
                </select>
              </div>

              <div>
                <label className="block text-[#475569] font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#0D9488] rounded text-[#1E293B] outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-1.5 rounded bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] font-medium cursor-pointer"
                >
                  {t('cancelBtn', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#0D9488] text-white hover:bg-[#0F766E] font-semibold cursor-pointer shadow-xs"
                >
                  {t('saveChanges', 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {resettingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#F97316]" />
                <h3 className="text-sm font-semibold text-[#1E293B]">{t('resetPassword', 'Reset Password')}: {resettingUser.name}</h3>
              </div>
              <button onClick={() => setResettingUser(null)} className="text-[#64748B] hover:text-[#1E293B] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 rounded bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC2626]">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#475569] font-medium mb-1">New Security Password</label>
                <input
                  type="text"
                  required
                  placeholder="Enter new password (min 5 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#0D9488] rounded text-[#1E293B] outline-none font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-3.5 py-1.5 rounded bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] font-medium cursor-pointer"
                >
                  {t('cancelBtn', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#F97316] text-white hover:bg-[#EA580C] font-semibold cursor-pointer shadow-xs"
                >
                  {t('resetPassword', 'Update Password')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-[#DC2626]">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-semibold text-[#1E293B]">{t('delete', 'Revoke Operator Access')}</h3>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-[#1E293B]">{deleteConfirmUser.name}</strong> ({deleteConfirmUser.username})? All associated local authorization credentials will be revoked immediately.
            </p>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-3.5 py-1.5 rounded bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] font-medium cursor-pointer"
              >
                {t('cancelBtn', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded bg-[#DC2626] text-white hover:bg-[#B91C1C] font-semibold cursor-pointer shadow-xs"
              >
                {t('delete', 'Confirm Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
