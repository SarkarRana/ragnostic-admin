import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { User, Tenant } from "../types";
import { getUsers, updateUser, deleteUser } from "../api/users";
import { getTenants } from "../api/tenants";
import { register } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(
    undefined
  );
  const { user: currentUser } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user" as "admin" | "user",
    tenantId: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [tenantsData] = await Promise.all([getTenants()]);
        setTenants(tenantsData);

        if (currentUser?.tenantId) {
          setSelectedTenantId(currentUser.tenantId);
          const usersData = await getUsers(currentUser.tenantId);
          setUsers(usersData);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser?.tenantId]);

  const handleTenantChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const tenantId = Number(e.target.value);
    setSelectedTenantId(tenantId);
    if (tenantId) {
      setLoading(true);
      try {
        const usersData = await getUsers(tenantId);
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    } else {
      setUsers([]);
    }
  };

  const handleCreateClick = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "user",
      tenantId: selectedTenantId || 0,
    });
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleEditClick = (user: User) => {
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "",
      confirmPassword: "",
      role: user.role,
      tenantId: user.tenantId,
    });
    setSelectedUser(user);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "tenantId" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      modalMode === "create" &&
      formData.password !== formData.confirmPassword
    ) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      if (modalMode === "create") {
        // Register new user
        await register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          tenantId: formData.tenantId,
          role: formData.role,
        });
        toast.success("User created successfully!");
      } else if (selectedUser) {
        // Update existing user
        await updateUser(selectedUser.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
        });
        toast.success("User updated successfully!");
      }

      setIsModalOpen(false);

      // Refresh the users list
      if (selectedTenantId) {
        const updatedUsers = await getUsers(selectedTenantId);
        setUsers(updatedUsers);
      }
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Failed to save user");
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser(selectedUser.id);
      toast.success("User deleted successfully!");
      setIsDeleteModalOpen(false);

      // Refresh the users list
      if (selectedTenantId) {
        const updatedUsers = await getUsers(selectedTenantId);
        setUsers(updatedUsers);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  // Only admins can manage users
  const isAdmin = currentUser?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to manage users.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          User Management
        </h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCreateClick}
          disabled={!selectedTenantId}
          className={`px-4 py-2 rounded-md transition-colors duration-200 ${
            !selectedTenantId
              ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white"
          }`}
        >
          Add User
        </motion.button>
      </div>

      {/* Tenant Selector */}
      <div className="max-w-sm">
        <label
          htmlFor="tenantSelector"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Select Tenant
        </label>
        <select
          id="tenantSelector"
          value={selectedTenantId}
          onChange={handleTenantChange}
          className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100"
        >
          <option value="">Select a tenant</option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : !selectedTenantId ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Select a tenant to manage users
          </p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No users found for this tenant
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Created
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {`${user.firstName} ${user.lastName}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${
                        user.role === "admin"
                          ? "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300"
                          : "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="mr-2 text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200"
                    >
                      Edit
                    </button>
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
            >
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                    {modalMode === "create" ? "Create New User" : "Edit User"}
                  </h3>
                  <div className="mt-4">
                    <form onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label
                            htmlFor="firstName"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            First Name
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            id="firstName"
                            value={formData.firstName}
                            onChange={handleFormChange}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="lastName"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Last Name
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            id="lastName"
                            value={formData.lastName}
                            onChange={handleFormChange}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formData.email}
                          onChange={handleFormChange}
                          required={modalMode === "create"}
                          disabled={modalMode === "edit"}
                          className={`mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            modalMode === "edit"
                              ? "bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                              : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          }`}
                        />
                        {modalMode === "edit" && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Email cannot be changed
                          </p>
                        )}
                      </div>

                      {modalMode === "create" && (
                        <>
                          <div className="mb-4">
                            <label
                              htmlFor="password"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Password
                            </label>
                            <input
                              type="password"
                              name="password"
                              id="password"
                              value={formData.password}
                              onChange={handleFormChange}
                              required
                              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100"
                            />
                          </div>

                          <div className="mb-4">
                            <label
                              htmlFor="confirmPassword"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Confirm Password
                            </label>
                            <input
                              type="password"
                              name="confirmPassword"
                              id="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleFormChange}
                              required
                              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        </>
                      )}

                      <div className="mb-4">
                        <label
                          htmlFor="role"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Role
                        </label>
                        <select
                          name="role"
                          id="role"
                          value={formData.role}
                          onChange={handleFormChange}
                          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      {modalMode === "create" && (
                        <div className="mb-4">
                          <label
                            htmlFor="tenantId"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Tenant
                          </label>
                          <select
                            name="tenantId"
                            id="tenantId"
                            value={formData.tenantId}
                            onChange={handleFormChange}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100"
                          >
                            <option value="">Select a tenant</option>
                            {tenants.map((tenant) => (
                              <option key={tenant.id} value={tenant.id}>
                                {tenant.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors"
                        >
                          {modalMode === "create" ? "Create" : "Update"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
            >
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                  <svg
                    className="h-6 w-6 text-red-600 dark:text-red-300"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                    Delete User
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Are you sure you want to delete the user{" "}
                      <span className="font-bold">{`${selectedUser.firstName} ${selectedUser.lastName}`}</span>
                      ? This action cannot be undone.
                    </p>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="ml-3 inline-flex justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-500 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="mt-3 sm:mt-0 inline-flex justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
