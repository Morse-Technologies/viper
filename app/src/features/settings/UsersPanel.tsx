"use client";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useUsers } from "@/features/hooks";
import type { Role, User } from "@/lib/api/types";
import { fmtAgo } from "@/lib/format";
import { roleInfo } from "@/lib/labels";
import { Avatar, Button, Input, Pill, Select } from "@/ui/atoms";
import { ErrorState, Field, LoadingRows, Sheet } from "@/ui/cells";

const ROLES = Object.keys(roleInfo) as Role[];

export function UsersPanel() {
  const { data, isPending, isError, refetch } = useUsers();
  const [adding, setAdding] = useState(false);
  const [roles, setRoles] = useState<Record<string, Role>>({});

  const roleOf = (u: User) => roles[u.id] ?? u.role;

  const changeRole = (u: User, next: Role) => {
    const prev = roleOf(u);
    if (prev === next) return;
    setRoles((r) => ({ ...r, [u.id]: next }));
    toast.success(`Role updated for ${u.name}`, {
      action: {
        label: "Undo",
        onClick: () => {
          setRoles((r) => ({ ...r, [u.id]: prev }));
          toast.message("Role restored");
        },
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <RoleLegend />
        <Button variant="primary" onClick={() => setAdding(true)}><Plus />Add person</Button>
      </div>
      {isPending ? <LoadingRows rows={6} pitch="h-14" />
        : isError ? <ErrorState what="people" onRetry={() => refetch()} />
          : (
            <div className="overflow-x-auto rounded-card border border-border">
              <table className="w-full min-w-[720px] text-left text-body">
                <thead className="border-b border-rule text-small text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Person</th>
                    <th className="px-4 py-2.5 font-medium">Role</th>
                    <th className="px-4 py-2.5 font-medium">Two-step</th>
                    <th className="px-4 py-2.5 font-medium">Last seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {(data ?? []).map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} hue={u.hue} size={32} />
                          <div className="min-w-0">
                            <p className="font-medium">{u.name}</p>
                            <p className="text-small text-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          aria-label={`Role for ${u.name}`}
                          value={roleOf(u)}
                          onChange={(e) => changeRole(u, e.target.value as Role)}
                          className="h-8 max-w-[160px]"
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{roleInfo[r].label}</option>)}
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Pill tone={u.totp ? "positive" : "warning"}>{u.totp ? "On" : "Off"}</Pill>
                      </td>
                      <td className="px-4 py-3 text-muted">{fmtAgo(u.lastSeenAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      <AddPersonSheet open={adding} onOpenChange={setAdding} />
    </div>
  );
}

function RoleLegend() {
  return (
    <ul className="flex flex-col gap-1 text-small text-muted">
      {ROLES.map((r) => (
        <li key={r}><span className="font-medium text-text">{roleInfo[r].label}:</span> {roleInfo[r].help}</li>
      ))}
    </ul>
  );
}

function AddPersonSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("operator");

  const finish = () => {
    toast.success(`${name.trim()} invited (mock)`);
    onOpenChange(false);
    setName("");
    setEmail("");
    setRole("operator");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Add person" description="They set a password on first sign-in. Two-step is required for maintainers and administrators.">
      <div className="flex flex-col gap-4 px-5 py-4">
        <Field label="Full name">
          {({ id }) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />}
        </Field>
        <Field label="Work email">
          {({ id }) => <Input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />}
        </Field>
        <Field label="Role">
          {({ id }) => (
            <Select id={id} value={role} onChange={(e) => setRole(e.target.value as Role)} className="h-10">
              {ROLES.map((r) => <option key={r} value={r}>{roleInfo[r].label}</option>)}
            </Select>
          )}
        </Field>
      </div>
      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-rule bg-surface px-5 py-4">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button variant="primary" disabled={!name.trim() || !email.trim()} onClick={finish}>Add person</Button>
      </div>
    </Sheet>
  );
}
