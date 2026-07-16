"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Modal,
  NativeSelect,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAuth } from "@/app/components/auth/AuthProvider";

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string | null;
  created_at: string;
};

export function UserManager() {
  const { isAdmin, getToken } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);

  async function fetchUsers() {
    const token = await getToken();
    if (!token) return;
    const res = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) fetchUsers();
    else setLoading(false);
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        You do not have permission to view this page.
      </Text>
    );
  }

  if (loading) return null;

  return (
    <>
      <Group mb="md">
        <Button color="red" onClick={openAdd}>
          Add User
        </Button>
      </Group>

      {/* Mobile */}
      <Box hiddenFrom="sm">
        <Stack gap="sm">
          {users.map((u) => (
            <Card
              key={u.id}
              withBorder
              padding="sm"
              radius="md"
              style={{ cursor: "pointer" }}
              onClick={() => setEditUser(u)}
            >
              <Group justify="space-between" mb={2}>
                <Text fw={600} size="sm">{u.full_name}</Text>
                <Badge
                  color={u.role === "admin" ? "red" : "blue"}
                  variant="light"
                  size="sm"
                >
                  {u.role}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">{u.email}</Text>
              {u.phone && <Text size="xs" c="dimmed">{u.phone}</Text>}
            </Card>
          ))}
        </Stack>
      </Box>

      {/* Desktop */}
      <Box visibleFrom="sm">
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Phone</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((u) => (
              <Table.Tr key={u.id}>
                <Table.Td>{u.full_name}</Table.Td>
                <Table.Td>{u.email}</Table.Td>
                <Table.Td>{u.phone || "-"}</Table.Td>
                <Table.Td>
                  <Badge
                    color={u.role === "admin" ? "red" : "blue"}
                    variant="light"
                    size="sm"
                  >
                    {u.role}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Button
                    variant="light"
                    size="compact-xs"
                    onClick={() => setEditUser(u)}
                  >
                    Edit
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>

      <AddUserModal
        opened={addOpened}
        onClose={closeAdd}
        getToken={getToken}
        onSaved={fetchUsers}
      />

      <EditUserModal
        user={editUser}
        onClose={() => setEditUser(null)}
        getToken={getToken}
        onSaved={fetchUsers}
      />
    </>
  );
}

function AddUserModal({
  opened,
  onClose,
  getToken,
  onSaved,
}: {
  opened: boolean;
  onClose: () => void;
  getToken: () => Promise<string | null>;
  onSaved: () => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("member");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function reset() {
    setEmail("");
    setFullName("");
    setRole("member");
    setError(null);
    setSent(false);
  }

  async function handleSubmit() {
    setError(null);
    setSaving(true);
    const token = await getToken();
    if (!token) return;

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, fullName, role }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error);
    } else {
      setSent(true);
      onSaved();
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={() => { reset(); onClose(); }}
      title="Add User"
      size="sm"
    >
      {sent ? (
        <Stack gap="md" py="md">
          <Text fw={600} ta="center">Invite sent!</Text>
          <Text size="sm" c="dimmed" ta="center">
            An invite email has been sent to <strong>{email}</strong>. They can use the link in the email to set their password and log in.
          </Text>
          <Group justify="center">
            <Button onClick={() => { reset(); onClose(); }}>Done</Button>
          </Group>
        </Stack>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <Stack gap="sm">
            <TextInput
              label="Full Name"
              placeholder="John Smith"
              value={fullName}
              onChange={(e) => setFullName(e.currentTarget.value)}
              required
            />
            <TextInput
              label="Email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
              type="email"
            />
            <NativeSelect
              label="Role"
              data={[
                { value: "member", label: "Member" },
                { value: "admin", label: "Admin" },
              ]}
              value={role}
              onChange={(e) => setRole(e.currentTarget.value)}
            />
            {error && <Text size="sm" c="red">{error}</Text>}
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => { reset(); onClose(); }}>
                Cancel
              </Button>
              <Button type="submit" color="red" loading={saving}>
                Send Invite
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}

function EditUserModal({
  user,
  onClose,
  getToken,
  onSaved,
}: {
  user: UserProfile | null;
  onClose: () => void;
  getToken: () => Promise<string | null>;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("member");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync form when user changes
  const [lastId, setLastId] = useState<string | null>(null);
  if (user && user.id !== lastId) {
    setLastId(user.id);
    setFullName(user.full_name);
    setRole(user.role);
    setPhone(user.phone || "");
    setError(null);
  }
  if (!user && lastId) {
    setLastId(null);
  }

  async function handleSubmit() {
    if (!user) return;
    setError(null);
    setSaving(true);
    const token = await getToken();
    if (!token) return;

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, fullName, role, phone: phone || null }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error);
    } else {
      onSaved();
      onClose();
    }
  }

  return (
    <Modal opened={!!user} onClose={onClose} title="Edit User" size="sm">
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <Stack gap="sm">
          <TextInput label="Email" value={user?.email ?? ""} disabled />
          <TextInput
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.currentTarget.value)}
            required
          />
          <TextInput
            label="Phone"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(e.currentTarget.value)}
          />
          <NativeSelect
            label="Role"
            data={[
              { value: "member", label: "Member" },
              { value: "admin", label: "Admin" },
            ]}
            value={role}
            onChange={(e) => setRole(e.currentTarget.value)}
          />
          {error && <Text size="sm" c="red">{error}</Text>}
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" color="red" loading={saving}>Save</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
