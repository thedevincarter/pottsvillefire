"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
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
import { RANKS } from "@/lib/ranks";

// "roster" is someone on the roster with no email and so no login — they can
// be marked as responding to calls, but can't sign in until they're invited.
type UserStatus = "roster" | "invited" | "active" | "disabled";

type UserProfile = {
  id: string;
  email: string | null;
  full_name: string;
  role: string;
  phone: string | null;
  rank: string | null;
  number: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  status: UserStatus;
};

const statusColors: Record<UserStatus, string> = {
  roster: "blue",
  invited: "yellow",
  active: "green",
  disabled: "gray",
};

function formatLastLogin(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Chicago",
  });
}

const rankOptions = [
  { value: "", label: "Select rank" },
  ...RANKS.map((r) => ({ value: r, label: r })),
];

export function UserManager() {
  const { isAdmin, getToken, user: currentUser } = useAuth();
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
                <Group gap={6}>
                  <Badge color={statusColors[u.status]} variant="light" size="sm">
                    {u.status}
                  </Badge>
                  <Badge
                    color={u.role === "admin" ? "red" : "blue"}
                    variant="light"
                    size="sm"
                  >
                    {u.role}
                  </Badge>
                </Group>
              </Group>
              {(u.rank || u.number) && (
                <Text size="xs" c="dimmed">
                  {[u.rank, u.number ? `#${u.number}` : null].filter(Boolean).join(" · ")}
                </Text>
              )}
              <Text size="xs" c="dimmed">{u.email ?? "No email yet"}</Text>
              {u.phone && <Text size="xs" c="dimmed">{u.phone}</Text>}
              <Text size="xs" c="dimmed">
                Last login: {formatLastLogin(u.last_sign_in_at)}
              </Text>
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
              <Table.Th>Rank</Table.Th>
              <Table.Th>#</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Phone</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Last Login</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((u) => (
              <Table.Tr key={u.id}>
                <Table.Td>{u.full_name}</Table.Td>
                <Table.Td>{u.rank || "-"}</Table.Td>
                <Table.Td>{u.number || "-"}</Table.Td>
                <Table.Td>
                  {u.email ?? (
                    <Text size="sm" c="dimmed">
                      No email yet
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>{u.phone || "-"}</Table.Td>
                <Table.Td>
                  <Badge color={statusColors[u.status]} variant="light" size="sm">
                    {u.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c={u.last_sign_in_at ? undefined : "dimmed"}>
                    {formatLastLogin(u.last_sign_in_at)}
                  </Text>
                </Table.Td>
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
        isSelf={!!currentUser && currentUser.id === editUser?.id}
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
  const [rank, setRank] = useState("");
  const [number, setNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function reset() {
    setEmail("");
    setFullName("");
    setRole("member");
    setRank("");
    setNumber("");
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
      body: JSON.stringify({ email, fullName, role, rank: rank || null, number: number || null }),
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

  const hasEmail = email.trim().length > 0;

  return (
    <Modal
      opened={opened}
      onClose={() => { reset(); onClose(); }}
      title="Add User"
      size="sm"
    >
      {sent ? (
        <Stack gap="md" py="md">
          <Text fw={600} ta="center">
            {hasEmail ? "Invite sent!" : "Added to the roster"}
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            {hasEmail ? (
              <>
                An invite email has been sent to <strong>{email}</strong>. They can use the link in the email to set their password and log in.
              </>
            ) : (
              <>
                <strong>{fullName}</strong> is on the roster and can be marked as
                responding to calls. Add an email later to send them a login.
              </>
            )}
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
              description="Leave blank to add them to the roster without a login"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              type="email"
            />
            <NativeSelect
              label="Rank"
              data={rankOptions}
              value={rank}
              onChange={(e) => setRank(e.currentTarget.value)}
            />
            <TextInput
              label="Number"
              placeholder="001"
              value={number}
              onChange={(e) => setNumber(e.currentTarget.value)}
              maxLength={3}
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
                {hasEmail ? "Send Invite" : "Add to Roster"}
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
  isSelf,
}: {
  user: UserProfile | null;
  onClose: () => void;
  getToken: () => Promise<string | null>;
  onSaved: () => void;
  isSelf: boolean;
}) {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("member");
  const [phone, setPhone] = useState("");
  const [rank, setRank] = useState("");
  const [number, setNumber] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"resend" | "disable" | "promote" | null>(null);
  const [resent, setResent] = useState(false);

  const isRosterOnly = user?.status === "roster";

  // Sync form when user changes
  const [lastId, setLastId] = useState<string | null>(null);
  if (user && user.id !== lastId) {
    setLastId(user.id);
    setFullName(user.full_name);
    setRole(user.role);
    setPhone(user.phone || "");
    setRank(user.rank || "");
    setNumber(user.number || "");
    setNewEmail("");
    setError(null);
    setResent(false);
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
      body: JSON.stringify({ id: user.id, fullName, role, phone: phone || null, rank: rank || null, number: number || null }),
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

  async function handleResend() {
    if (!user) return;
    setError(null);
    setBusy("resend");
    const token = await getToken();
    if (!token) return;

    const res = await fetch("/api/admin/users/resend", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id }),
    });
    const data = await res.json();
    setBusy(null);

    if (!res.ok) setError(data.error);
    else setResent(true);
  }

  // Giving a roster-only member an email creates their login and invites them.
  async function handlePromote() {
    if (!user || !newEmail.trim()) return;
    setError(null);
    setBusy("promote");
    const token = await getToken();
    if (!token) return;

    const res = await fetch("/api/admin/users/promote", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, email: newEmail.trim() }),
    });
    const data = await res.json();
    setBusy(null);

    if (!res.ok) {
      setError(data.error);
    } else {
      onSaved();
      onClose();
    }
  }

  async function handleDisable(disabled: boolean) {
    if (!user) return;
    setError(null);
    setBusy("disable");
    const token = await getToken();
    if (!token) return;

    const res = await fetch("/api/admin/users/disable", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, disabled }),
    });
    const data = await res.json();
    setBusy(null);

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
          {isRosterOnly ? (
            <TextInput
              label="Email"
              description="Adding an email creates their login and sends an invite"
              placeholder="john@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.currentTarget.value)}
              type="email"
            />
          ) : (
            <TextInput label="Email" value={user?.email ?? ""} disabled />
          )}
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
            label="Rank"
            data={rankOptions}
            value={rank}
            onChange={(e) => setRank(e.currentTarget.value)}
          />
          <TextInput
            label="Number"
            placeholder="001"
            value={number}
            onChange={(e) => setNumber(e.currentTarget.value)}
            maxLength={3}
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
          {!isSelf && (
            <>
              <Divider mt="xs" />
              <Group justify="flex-end" gap="xs">
                {isRosterOnly && (
                  <Button
                    type="button"
                    variant="light"
                    size="compact-sm"
                    loading={busy === "promote"}
                    disabled={!newEmail.trim()}
                    onClick={handlePromote}
                  >
                    Create login & invite
                  </Button>
                )}
                {user?.status === "invited" && (
                  <Button
                    type="button"
                    variant="light"
                    size="compact-sm"
                    loading={busy === "resend"}
                    disabled={resent}
                    onClick={handleResend}
                  >
                    {resent ? "Invite sent" : "Resend invite"}
                  </Button>
                )}
                {/* Disabling bans the auth user, which a roster-only member
                    doesn't have — there's no login to take away yet. */}
                {!isRosterOnly && (
                  <Button
                    type="button"
                    variant="light"
                    color={user?.status === "disabled" ? "green" : "red"}
                    size="compact-sm"
                    loading={busy === "disable"}
                    onClick={() => handleDisable(user?.status !== "disabled")}
                  >
                    {user?.status === "disabled" ? "Enable" : "Disable"}
                  </Button>
                )}
              </Group>
            </>
          )}
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
