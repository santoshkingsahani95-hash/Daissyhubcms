"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  PlusCircle,
  Shield,
  ShieldAlert,
  Edit,
  Power,
  RotateCw,
  Key,
  User,
  Phone,
  Mail,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "react-hot-toast";
import { IUser, PermissionKey, UserRole } from "@/types";
import { ALL_PERMISSIONS, PermissionDefinition } from "@/lib/permissions";

export default function StaffManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("staff");
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.users) {
          setUsers(data.users);
        }
      }
    } catch {
      toast.error("Failed to load staff list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setName("");
    setUsername("");
    setPassword("");
    setEmail("");
    setPhone("");
    setRole("staff");
    // Explicit initial permissions (never grant full access automatically by default)
    setSelectedPermissions(["dashboard:view", "parcels:create", "parcels:import"]);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (u: IUser) => {
    setEditingUser(u);
    setName(u.name);
    setUsername(u.username);
    setPassword("");
    setEmail(u.email || "");
    setPhone(u.phone || "");
    setRole(u.role);
    setSelectedPermissions(u.permissions || []);
    setIsActive(u.isActive);
    setIsModalOpen(true);
  };

  const togglePermission = (key: PermissionKey) => {
    if (selectedPermissions.includes(key)) {
      setSelectedPermissions(selectedPermissions.filter((k) => k !== key));
    } else {
      setSelectedPermissions([...selectedPermissions, key]);
    }
  };

  const selectAllPermissions = () => {
    setSelectedPermissions(ALL_PERMISSIONS.map((p) => p.key));
  };

  const clearAllPermissions = () => {
    setSelectedPermissions([]);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Full Name is required.");
      return;
    }

    if (!editingUser) {
      if (!username.trim() || username.trim().length < 3) {
        toast.error("Username must be at least 3 characters.");
        return;
      }
      if (!password || password.length < 6) {
        toast.error("Password must be at least 6 characters.");
        return;
      }
    }

    setSaving(true);
    try {
      const url = editingUser ? `/api/users/${editingUser._id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      const payload: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        permissions: selectedPermissions,
        isActive,
      };

      if (!editingUser) {
        payload.username = username.trim().toLowerCase();
        payload.password = password;
      } else if (password) {
        payload.password = password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "User account saved!");
        setIsModalOpen(false);
        fetchUsers();
      } else {
        toast.error(data.message || "Failed to save user.");
      }
    } catch {
      toast.error("Network error while saving user.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: IUser) => {
    if (u._id === currentUser?._id || u.username === currentUser?.username) {
      toast.error("You cannot deactivate your own account.");
      return;
    }

    try {
      const res = await fetch(`/api/users/${u._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User is now ${!u.isActive ? "Active" : "Deactivated"}`);
        fetchUsers();
      } else {
        toast.error(data.message || "Failed to change status");
      }
    } catch {
      toast.error("Network error");
    }
  };

  // Group permissions by category
  const permissionCategories: Record<string, PermissionDefinition[]> = {};
  ALL_PERMISSIONS.forEach((p) => {
    if (!permissionCategories[p.category]) {
      permissionCategories[p.category] = [];
    }
    permissionCategories[p.category].push(p);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Staff Accounts & Role-Based Access Control (RBAC)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Administer staff operators, enforce granular permissions, and control security access
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={openAddModal} className="h-9">
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Create Staff User</span>
        </Button>
      </div>

      {/* Users Table Card */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Granted Permissions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading user records...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr
                    key={u._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 font-bold flex items-center justify-center text-slate-700 dark:text-slate-200">
                          {u.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {u.name}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            {u.email || "No email"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {u.username}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={u.role === "admin" || (u.role as string) === "superadmin" ? "purple" : "info"}
                        size="sm"
                      >
                        {u.role === "admin" || (u.role as string) === "superadmin" ? "Admin" : "Staff Member"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {u.role === "admin" || (u.role as string) === "superadmin" ? (
                        <span className="text-purple-600 font-bold text-[11px]">
                          Full System Access
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {u.permissions?.length || 0} permissions assigned
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={u.isActive ? "success" : "default"} size="sm">
                        {u.isActive ? "Active" : "Deactivated"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(u)}
                          className="h-7 w-7 p-0"
                          title="Edit Permissions & Password"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>

                        {u._id !== currentUser?._id && u.username !== currentUser?.username && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(u)}
                            className={`h-7 w-7 p-0 ${
                              u.isActive
                                ? "text-rose-600 hover:text-rose-700"
                                : "text-emerald-600 hover:text-emerald-700"
                            }`}
                            title={u.isActive ? "Deactivate User" : "Activate User"}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No staff records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* CREATE / EDIT USER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="2xl"
        title={editingUser ? `Edit Account: ${editingUser.name}` : "Create Staff Account"}
        description="Assign granular module permissions. Staff only access features explicitly permitted."
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sujan Dangol"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Username *
              </label>
              <input
                type="text"
                required
                disabled={!!editingUser}
                placeholder="e.g. sujan"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {editingUser ? "Reset Password (leave empty to keep current)" : "Password *"}
              </label>
              <input
                type="password"
                placeholder={editingUser ? "New password" : "At least 6 characters"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="staff@apexcourier.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Granular Permissions Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider block">
                  Module Permissions Checklist
                </label>
                <span className="text-[11px] text-slate-400">
                  Select the individual capabilities granted to this staff account
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={selectAllPermissions}
                  className="text-xs text-brand-600 h-7"
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={clearAllPermissions}
                  className="text-xs text-slate-400 h-7"
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
              {Object.entries(permissionCategories).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider block">
                    {category}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {items.map((perm) => {
                      const isChecked = selectedPermissions.includes(perm.key);
                      return (
                        <div
                          key={perm.key}
                          onClick={() => togglePermission(perm.key)}
                          className={`p-2.5 rounded-lg border cursor-pointer select-none transition-all flex items-start gap-2.5 ${
                            isChecked
                              ? "bg-brand-50/70 dark:bg-brand-950/40 border-brand-300 dark:border-brand-800"
                              : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-80"
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-brand-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {perm.label}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {perm.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              {editingUser ? "Update Account" : "Create Staff Account"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
