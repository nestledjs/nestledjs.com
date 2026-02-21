---
title: Granular RBAC Management
nextjs:
  metadata:
    title: Granular RBAC Management
    description: AI-ready feature spec for adding custom role creation, permission assignment UI, super admin dashboard, and user permission auditing to your Nestled application.
---

Add-ons are AI-ready feature specifications for capabilities not included in the base Nestled template. They are designed to be copied into an AI coding assistant (like Claude Code) for rapid implementation on your Nestled project. Each add-on builds on the existing template architecture so the generated code fits naturally into your codebase.

{% callout type="note" %}
This is one of several add-on specs available. The idea is to copy the full specification below into your AI assistant and let it implement the feature in your project. The spec contains all the context an LLM needs: database considerations, backend services, resolvers, GraphQL operations, frontend pages, and an implementation checklist.
{% /callout %}

## What this add-on provides

- **Custom role creation** -- organization owners can create roles like "Event Coordinator" or "Content Manager" with specific permissions
- **Permission assignment UI** -- select which of the 18 system permissions each role should have
- **Super admin dashboard** -- platform operators get visibility into all organizations, roles, and user permissions
- **User permission auditing** -- view any user's effective permissions across all their organizations

## Who needs this

- Multi-tenant SaaS applications with diverse customers who need different role structures
- Applications with compliance requirements for access documentation
- Platforms where different organizations have different workflows
- Apps with many feature areas requiring separate access control

## What already exists

The base Nestled template already includes a solid RBAC foundation:

- **3 default roles**: Owner (all 18 permissions), Admin (10 permissions), Member (4 read-only permissions)
- **18 permissions** across 6 subjects: organization, member, role, billing, team, audit
- **Frontend components**: `RequirePermission`, `useHasPermission`, `useHasAnyPermission`, `useHasAllPermissions`
- **Backend**: `OrganizationService` handles role creation, assignment, and listing; tenancy middleware checks permissions via `OrganizationContext`

The existing Prisma schema already supports custom roles -- no schema migration is required to get started.

## Full implementation spec

Copy the specification below and paste it into your AI coding assistant. It contains everything needed to implement this feature: database considerations, backend service, resolver, module, GraphQL operations, frontend pages, and an implementation checklist.

````markdown
# Granular RBAC Management

This specification describes how to implement full admin interfaces for managing roles and permissions in Nestled Template, building on the existing RBAC infrastructure.

---

## Table of Contents

1. [Overview](#overview)
2. [What Already Exists](#what-already-exists)
3. [What This Add-On Provides](#what-this-add-on-provides)
4. [Database Schema Extensions](#database-schema-extensions)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Implementation Checklist](#implementation-checklist)

---

## Overview

### Problem Statement

The base Nestled Template includes three default roles (Owner, Admin, Member) with predefined permissions. This works for most simple applications, but some organizations need:

- **Custom roles**: Create roles like "Event Coordinator" or "Content Manager" with specific permissions
- **Fine-grained control**: Grant access to specific features without giving full admin access
- **Super admin tools**: Platform operators need visibility into all organizations and users
- **Self-service management**: Organization owners should manage their own roles without developer intervention

### Who Needs This?

- Multi-tenant SaaS applications with diverse customer needs
- Platforms where different organizations have different workflows
- Applications with many feature areas requiring separate access control
- Teams with compliance requirements for access documentation

---

## What Already Exists

Before implementing this add-on, understand what Nestled Template already provides:

### Database Models (Prisma)

```
Permission
├── id: String (cuid)
├── action: String (e.g., "read", "update", "manage")
├── subject: String (e.g., "organization", "member", "billing")
├── description: String?
└── roles: Role[] (many-to-many)

Role
├── id: String (cuid)
├── name: String (e.g., "Owner", "Admin", "Member")
├── description: String?
├── organizationId: String (foreign key)
├── permissions: Permission[] (many-to-many)
└── members: OrganizationMember[]

OrganizationMember
├── id: String (cuid)
├── userId: String
├── organizationId: String
├── roleId: String
└── role: Role
```

### Default Permissions (18 total)

| Subject      | Actions                      |
| ------------ | ---------------------------- |
| organization | read, update, delete         |
| member       | read, invite, update, remove |
| role         | read, create, update, delete |
| billing      | read, manage                 |
| team         | read, create, update, delete |
| audit        | read                         |

### Default Roles

| Role   | Description                              | Permissions               |
| ------ | ---------------------------------------- | ------------------------- |
| Owner  | Full access                              | All 18 permissions        |
| Admin  | Team management, no billing/org deletion | 10 permissions            |
| Member | Read-only                                | 4 permissions (read only) |

### Existing Frontend Components

- `RequirePermission` - Component wrapper for permission-gated UI
- `useHasPermission` - Hook to check single permission
- `useHasAnyPermission` - Hook to check if user has any of multiple permissions
- `useHasAllPermissions` - Hook to check if user has all specified permissions
- Members settings page with role assignment dropdown

### Existing Backend Services

- `OrganizationService.createOrganizationRoles()` - Creates default roles for new orgs
- `OrganizationService.updateOrganizationMemberRole()` - Changes member's role
- `OrganizationService.getOrganizationRoles()` - Lists roles for an org
- Permission checking in tenancy middleware via `OrganizationContext`

---

## What This Add-On Provides

### 1. Super Admin Tools (`/admin/rbac`)

Platform-wide RBAC management for super admins:

- **Permissions List**: View all system permissions with descriptions
- **Role Browser**: See all roles across all organizations
- **User Role Audit**: View any user's permissions across organizations
- **System Role Templates**: Define/update default role templates

### 2. Organization Role Management (`/settings/roles`)

Organization-scoped role management for organization owners:

- **Custom Role Creation**: Create roles specific to their organization
- **Permission Assignment**: Select which permissions each role should have
- **Role Assignment**: Assign roles to organization members
- **Role Deletion**: Remove custom roles (cannot delete default roles)

---

## Database Schema Extensions

The existing schema supports custom roles. No schema changes are required, but here's a reference for the existing structure with optional enhancements:

### Optional Enhancement: Role Templates

If you want super admins to define role templates that organizations can use:

```prisma
// Add to schema.prisma

model RoleTemplate {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  isSystem    Boolean  @default(false) // System templates cannot be deleted
  permissions String[] // Array of permission strings like "member:read"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Optional Enhancement: Role Metadata

Add metadata to track custom vs default roles:

```prisma
// Modify existing Role model

model Role {
  // ... existing fields
  isSystem    Boolean  @default(false) // True for Owner/Admin/Member
  isCustom    Boolean  @default(false) // True for org-created roles
  createdBy   String?  // User ID who created custom role
}
```

---

## Backend Implementation

### New Service: RbacAdminService

Create `libs/api/custom/src/lib/plugins/rbac/rbac-admin.service.ts`:

```typescript
import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { ApiCoreDataAccessService } from '@nestled-template/api/core/data-access'
import { defaultRoles, defaultPermissions } from '@nestled-template/api/prisma'

@Injectable()
export class RbacAdminService {
  constructor(private readonly data: ApiCoreDataAccessService) {}

  /**
   * Get all system permissions
   * Used by super admin to view available permissions
   */
  async getAllPermissions() {
    return this.data.permission.findMany({
      orderBy: [{ subject: 'asc' }, { action: 'asc' }],
    })
  }

  /**
   * Get all roles across all organizations (super admin only)
   */
  async getAllRoles(options?: { includePermissions?: boolean }) {
    return this.data.role.findMany({
      include: {
        organization: { select: { id: true, name: true } },
        permissions: options?.includePermissions ?? false,
        _count: { select: { members: true } },
      },
      orderBy: [{ organization: { name: 'asc' } }, { name: 'asc' }],
    })
  }

  /**
   * Get permissions for a specific user across all organizations
   * Useful for super admin auditing
   */
  async getUserPermissionsAudit(userId: string) {
    const memberships = await this.data.organizationMember.findMany({
      where: { userId },
      include: {
        organization: { select: { id: true, name: true } },
        role: {
          include: { permissions: true },
        },
      },
    })

    return memberships.map((m) => ({
      organizationId: m.organizationId,
      organizationName: m.organization.name,
      role: {
        id: m.role.id,
        name: m.role.name,
      },
      permissions: m.role.permissions.map((p) => `${p.subject}:${p.action}`),
    }))
  }

  /**
   * Create a custom role for an organization
   */
  async createCustomRole(
    organizationId: string,
    userId: string,
    input: { name: string; description?: string; permissionIds: string[] },
  ) {
    // Verify user has permission to create roles
    const canCreate = await this.hasPermission(
      userId,
      organizationId,
      'role',
      'create',
    )
    if (!canCreate) {
      throw new ForbiddenException('You do not have permission to create roles')
    }

    // Verify role name is unique within organization
    const existing = await this.data.role.findFirst({
      where: { organizationId, name: input.name },
    })
    if (existing) {
      throw new BadRequestException('A role with this name already exists')
    }

    // Create the role with permissions
    return this.data.role.create({
      data: {
        name: input.name,
        description: input.description,
        organizationId,
        permissions: {
          connect: input.permissionIds.map((id) => ({ id })),
        },
      },
      include: { permissions: true },
    })
  }

  /**
   * Update a custom role's permissions
   */
  async updateCustomRole(
    roleId: string,
    userId: string,
    input: { name?: string; description?: string; permissionIds?: string[] },
  ) {
    const role = await this.data.role.findUnique({
      where: { id: roleId },
      include: { organization: true },
    })

    if (!role) {
      throw new BadRequestException('Role not found')
    }

    // Cannot modify default roles
    if (['Owner', 'Admin', 'Member'].includes(role.name)) {
      throw new BadRequestException('Cannot modify default roles')
    }

    // Verify permission
    const canUpdate = await this.hasPermission(
      userId,
      role.organizationId,
      'role',
      'update',
    )
    if (!canUpdate) {
      throw new ForbiddenException('You do not have permission to update roles')
    }

    return this.data.role.update({
      where: { id: roleId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.permissionIds && {
          permissions: {
            set: input.permissionIds.map((id) => ({ id })),
          },
        }),
      },
      include: { permissions: true },
    })
  }

  /**
   * Delete a custom role
   */
  async deleteCustomRole(roleId: string, userId: string) {
    const role = await this.data.role.findUnique({
      where: { id: roleId },
      include: { _count: { select: { members: true } } },
    })

    if (!role) {
      throw new BadRequestException('Role not found')
    }

    // Cannot delete default roles
    if (['Owner', 'Admin', 'Member'].includes(role.name)) {
      throw new BadRequestException('Cannot delete default roles')
    }

    // Cannot delete role with assigned members
    if (role._count.members > 0) {
      throw new BadRequestException(
        `Cannot delete role with ${role._count.members} assigned member(s). Reassign them first.`,
      )
    }

    // Verify permission
    const canDelete = await this.hasPermission(
      userId,
      role.organizationId,
      'role',
      'delete',
    )
    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete roles')
    }

    await this.data.role.delete({ where: { id: roleId } })
    return true
  }

  /**
   * Helper to check if user has a specific permission in an organization
   */
  private async hasPermission(
    userId: string,
    organizationId: string,
    subject: string,
    action: string,
  ): Promise<boolean> {
    const member = await this.data.organizationMember.findFirst({
      where: { userId, organizationId },
      include: {
        role: { include: { permissions: true } },
      },
    })

    if (!member) return false

    // Check for super admin boost (all:manage)
    const hasAllManage = member.role.permissions.some(
      (p) => p.subject === 'all' && p.action === 'manage',
    )
    if (hasAllManage) return true

    return member.role.permissions.some(
      (p) => p.subject === subject && p.action === action,
    )
  }
}
```

### New Resolver: RbacAdminResolver

Create `libs/api/custom/src/lib/plugins/rbac/rbac-admin.resolver.ts`:

```typescript
import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql'
import { UseGuards } from '@nestjs/common'
import {
  GqlAuthGuard,
  GqlSuperAdminGuard,
  CtxUser,
} from '@nestled-template/api/utils'
import { User } from '@nestled-template/api/core/models'
import { RbacAdminService } from './rbac-admin.service'

// Input types
@InputType()
class CreateCustomRoleInput {
  @Field()
  organizationId: string

  @Field()
  name: string

  @Field({ nullable: true })
  description?: string

  @Field(() => [String])
  permissionIds: string[]
}

@InputType()
class UpdateCustomRoleInput {
  @Field()
  roleId: string

  @Field({ nullable: true })
  name?: string

  @Field({ nullable: true })
  description?: string

  @Field(() => [String], { nullable: true })
  permissionIds?: string[]
}

@Resolver()
export class RbacAdminResolver {
  constructor(private readonly rbacAdmin: RbacAdminService) {}

  // ===== Super Admin Queries =====

  @Query(() => [Permission], { name: 'adminAllPermissions' })
  @UseGuards(GqlAuthGuard, GqlSuperAdminGuard)
  async adminAllPermissions() {
    return this.rbacAdmin.getAllPermissions()
  }

  @Query(() => [Role], { name: 'adminAllRoles' })
  @UseGuards(GqlAuthGuard, GqlSuperAdminGuard)
  async adminAllRoles() {
    return this.rbacAdmin.getAllRoles({ includePermissions: true })
  }

  @Query(() => [UserPermissionAudit], { name: 'adminUserPermissionsAudit' })
  @UseGuards(GqlAuthGuard, GqlSuperAdminGuard)
  async adminUserPermissionsAudit(@Args('userId') userId: string) {
    return this.rbacAdmin.getUserPermissionsAudit(userId)
  }

  // ===== Organization-Level Mutations =====

  @Mutation(() => Role, { name: 'createCustomRole' })
  @UseGuards(GqlAuthGuard)
  async createCustomRole(
    @CtxUser() user: User,
    @Args('input') input: CreateCustomRoleInput,
  ) {
    return this.rbacAdmin.createCustomRole(input.organizationId, user.id, {
      name: input.name,
      description: input.description,
      permissionIds: input.permissionIds,
    })
  }

  @Mutation(() => Role, { name: 'updateCustomRole' })
  @UseGuards(GqlAuthGuard)
  async updateCustomRole(
    @CtxUser() user: User,
    @Args('input') input: UpdateCustomRoleInput,
  ) {
    return this.rbacAdmin.updateCustomRole(input.roleId, user.id, {
      name: input.name,
      description: input.description,
      permissionIds: input.permissionIds,
    })
  }

  @Mutation(() => Boolean, { name: 'deleteCustomRole' })
  @UseGuards(GqlAuthGuard)
  async deleteCustomRole(
    @CtxUser() user: User,
    @Args('roleId') roleId: string,
  ) {
    return this.rbacAdmin.deleteCustomRole(roleId, user.id)
  }
}
```

### Module Setup

Create `libs/api/custom/src/lib/plugins/rbac/rbac.module.ts`:

```typescript
import { Module } from '@nestjs/common'
import { RbacAdminService } from './rbac-admin.service'
import { RbacAdminResolver } from './rbac-admin.resolver'
import { ApiCrudDataAccessModule } from '@nestled-template/api/generated-crud/data-access'

@Module({
  imports: [ApiCrudDataAccessModule],
  providers: [RbacAdminService, RbacAdminResolver],
  exports: [RbacAdminService],
})
export class RbacModule {}
```

Export from `libs/api/custom/src/lib/plugins/index.ts`:

```typescript
export * from './rbac'
```

### Super Admin Guard

If not already present, create `libs/api/utils/src/lib/guards/gql-super-admin.guard.ts`:

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

@Injectable()
export class GqlSuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context)
    const { req } = ctx.getContext()
    const user = req.user

    if (!user?.isSuperAdmin) {
      throw new ForbiddenException('Super admin access required')
    }

    return true
  }
}
```

---

## Frontend Implementation

### GraphQL Operations

Create `libs/shared/sdk/src/lib/graphql/rbac.graphql`:

```graphql
# Queries

query AllPermissions {
  adminAllPermissions {
    id
    subject
    action
    description
  }
}

query OrganizationRolesWithPermissions($organizationId: String!) {
  organizationRoles(organizationId: $organizationId) {
    id
    name
    description
    permissions {
      id
      subject
      action
      description
    }
  }
}

query AdminAllRoles {
  adminAllRoles {
    id
    name
    description
    organization {
      id
      name
    }
    permissions {
      id
      subject
      action
    }
    _count {
      members
    }
  }
}

query AdminUserPermissionsAudit($userId: String!) {
  adminUserPermissionsAudit(userId: $userId) {
    organizationId
    organizationName
    role {
      id
      name
    }
    permissions
  }
}

# Mutations

mutation CreateCustomRole($input: CreateCustomRoleInput!) {
  createCustomRole(input: $input) {
    id
    name
    description
    permissions {
      id
      subject
      action
    }
  }
}

mutation UpdateCustomRole($input: UpdateCustomRoleInput!) {
  updateCustomRole(input: $input) {
    id
    name
    description
    permissions {
      id
      subject
      action
    }
  }
}

mutation DeleteCustomRole($roleId: String!) {
  deleteCustomRole(roleId: $roleId)
}
```

### Page 1: Organization Role Management

Create `apps/web/app/routes/settings/roles.tsx`:

```typescript
import React, { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { RequirePermission, useGlobalCtx } from '@nestled-template/web'
import {
  OrganizationRolesWithPermissions,
  AllPermissions,
  CreateCustomRole,
  UpdateCustomRole,
  DeleteCustomRole,
} from '@nestled-template/shared/sdk'

export default function RolesSettings() {
  const { activeOrganization } = useGlobalCtx()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRole, setEditingRole] = useState<any | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data: rolesData, refetch } = useQuery(OrganizationRolesWithPermissions, {
    variables: { organizationId: activeOrganization?.id },
    skip: !activeOrganization?.id,
  })

  const { data: permissionsData } = useQuery(AllPermissions)

  const [createRole] = useMutation(CreateCustomRole)
  const [updateRole] = useMutation(UpdateCustomRole)
  const [deleteRole] = useMutation(DeleteCustomRole)

  const roles = rolesData?.organizationRoles || []
  const allPermissions = permissionsData?.adminAllPermissions || []
  const isDefaultRole = (name: string) => ['Owner', 'Admin', 'Member'].includes(name)

  async function handleCreateRole(input: {
    name: string
    description: string
    permissionIds: string[]
  }) {
    await createRole({
      variables: {
        input: {
          organizationId: activeOrganization!.id,
          ...input,
        },
      },
    })
    refetch()
    setShowCreateModal(false)
  }

  async function handleUpdateRole(roleId: string, permissionIds: string[]) {
    await updateRole({
      variables: {
        input: { roleId, permissionIds },
      },
    })
    refetch()
    setEditingRole(null)
  }

  async function handleDeleteRole(roleId: string) {
    await deleteRole({ variables: { roleId } })
    refetch()
    setDeleteConfirm(null)
  }

  return (
    <RequirePermission permission="role:read">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Roles & Permissions</h2>
            <p className="text-sm text-zinc-400">
              Manage roles and their permissions for your organization
            </p>
          </div>
          <RequirePermission permission="role:create">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg"
            >
              <PlusIcon className="h-4 w-4" />
              Create Role
            </button>
          </RequirePermission>
        </div>

        {/* Roles List */}
        <div className="space-y-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="p-4 rounded-lg border border-zinc-200 dark:border-white/10"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-zinc-400" />
                  <div>
                    <h3 className="font-medium">{role.name}</h3>
                    {role.description && (
                      <p className="text-sm text-zinc-500">{role.description}</p>
                    )}
                  </div>
                  {isDefaultRole(role.name) && (
                    <span className="px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 rounded">
                      System
                    </span>
                  )}
                </div>

                {!isDefaultRole(role.name) && (
                  <div className="flex items-center gap-2">
                    <RequirePermission permission="role:update">
                      <button
                        onClick={() => setEditingRole(role)}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </RequirePermission>
                    <RequirePermission permission="role:delete">
                      <button
                        onClick={() => setDeleteConfirm(role.id)}
                        className="p-2 hover:bg-rose-100 dark:hover:bg-rose-500/10 rounded text-rose-500"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </RequirePermission>
                  </div>
                )}
              </div>

              {/* Permission badges */}
              <div className="flex flex-wrap gap-1">
                {role.permissions.map((perm) => (
                  <span
                    key={perm.id}
                    className="px-2 py-0.5 text-xs bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded"
                  >
                    {perm.subject}:{perm.action}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || editingRole) && (
          <RoleModal
            role={editingRole}
            permissions={allPermissions}
            onSave={(data) =>
              editingRole
                ? handleUpdateRole(editingRole.id, data.permissionIds)
                : handleCreateRole(data)
            }
            onClose={() => {
              setShowCreateModal(false)
              setEditingRole(null)
            }}
          />
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <DeleteConfirmModal
            onConfirm={() => handleDeleteRole(deleteConfirm)}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </div>
    </RequirePermission>
  )
}

// RoleModal component for creating/editing roles
function RoleModal({ role, permissions, onSave, onClose }) {
  const [name, setName] = useState(role?.name || '')
  const [description, setDescription] = useState(role?.description || '')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    role?.permissions?.map((p) => p.id) || []
  )

  // Group permissions by subject
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.subject]) acc[perm.subject] = []
    acc[perm.subject].push(perm)
    return acc
  }, {} as Record<string, typeof permissions>)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
        <h3 className="text-lg font-bold mb-4">
          {role ? 'Edit Role' : 'Create Role'}
        </h3>

        {!role && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Role Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Content Manager"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Optional description"
              />
            </div>
          </>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Permissions</label>
          <div className="space-y-4 max-h-[40vh] overflow-y-auto">
            {Object.entries(groupedPermissions).map(([subject, perms]) => (
              <div key={subject} className="border rounded-lg p-3">
                <h4 className="font-medium mb-2 capitalize">{subject}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {perms.map((perm) => (
                    <label key={perm.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, perm.id])
                          } else {
                            setSelectedPermissions(
                              selectedPermissions.filter((id) => id !== perm.id)
                            )
                          }
                        }}
                      />
                      {perm.description || perm.action}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({
                name,
                description,
                permissionIds: selectedPermissions,
              })
            }
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg"
          >
            {role ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

Register in `apps/web/app/routes.tsx`:

```typescript
// Inside the settings routes
route('roles', './routes/settings/roles.tsx'),
```

### Page 2: Super Admin RBAC Dashboard

Create `apps/web/app/routes/admin/rbac.tsx`:

```typescript
import React, { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import {
  ShieldCheckIcon,
  UsersIcon,
  KeyIcon,
} from '@heroicons/react/24/outline'
import {
  AdminAllRoles,
  AdminAllPermissions,
  AdminUserPermissionsAudit,
} from '@nestled-template/shared/sdk'

export default function AdminRbac() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'audit'>('roles')

  const { data: rolesData } = useQuery(AdminAllRoles)
  const { data: permissionsData } = useQuery(AdminAllPermissions)
  const { data: auditData } = useQuery(AdminUserPermissionsAudit, {
    variables: { userId: selectedUserId },
    skip: !selectedUserId,
  })

  const allRoles = rolesData?.adminAllRoles || []
  const allPermissions = permissionsData?.adminAllPermissions || []

  // Group roles by organization
  const rolesByOrg = allRoles.reduce((acc, role) => {
    const orgName = role.organization?.name || 'System'
    if (!acc[orgName]) acc[orgName] = []
    acc[orgName].push(role)
    return acc
  }, {} as Record<string, typeof allRoles>)

  // Group permissions by subject
  const permissionsBySubject = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.subject]) acc[perm.subject] = []
    acc[perm.subject].push(perm)
    return acc
  }, {} as Record<string, typeof allPermissions>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">RBAC Management</h1>
        <p className="text-zinc-400">System-wide role and permission management</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-2 px-1 ${
            activeTab === 'roles'
              ? 'border-b-2 border-emerald-500 text-emerald-400'
              : 'text-zinc-400'
          }`}
        >
          <ShieldCheckIcon className="h-5 w-5 inline mr-2" />
          Roles ({allRoles.length})
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`pb-2 px-1 ${
            activeTab === 'permissions'
              ? 'border-b-2 border-emerald-500 text-emerald-400'
              : 'text-zinc-400'
          }`}
        >
          <KeyIcon className="h-5 w-5 inline mr-2" />
          Permissions ({allPermissions.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-2 px-1 ${
            activeTab === 'audit'
              ? 'border-b-2 border-emerald-500 text-emerald-400'
              : 'text-zinc-400'
          }`}
        >
          <UsersIcon className="h-5 w-5 inline mr-2" />
          User Audit
        </button>
      </div>

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {Object.entries(rolesByOrg).map(([orgName, roles]) => (
            <div key={orgName}>
              <h3 className="text-lg font-medium mb-3">{orgName}</h3>
              <div className="grid gap-3">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="p-4 rounded-lg border border-white/10 bg-white/5"
                  >
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">{role.name}</h4>
                        <p className="text-sm text-zinc-400">{role.description}</p>
                      </div>
                      <div className="text-sm text-zinc-500">
                        {role._count?.members || 0} members
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {role.permissions?.slice(0, 5).map((p) => (
                        <span
                          key={p.id}
                          className="px-2 py-0.5 text-xs bg-sky-500/10 text-sky-400 rounded"
                        >
                          {p.subject}:{p.action}
                        </span>
                      ))}
                      {(role.permissions?.length || 0) > 5 && (
                        <span className="text-xs text-zinc-500">
                          +{role.permissions!.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(permissionsBySubject).map(([subject, perms]) => (
            <div
              key={subject}
              className="p-4 rounded-lg border border-white/10 bg-white/5"
            >
              <h4 className="font-medium mb-2 capitalize">{subject}</h4>
              <ul className="space-y-1">
                {perms.map((perm) => (
                  <li key={perm.id} className="text-sm">
                    <span className="text-emerald-400">{perm.action}</span>
                    {perm.description && (
                      <span className="text-zinc-500 ml-2">- {perm.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* User Audit Tab */}
      {activeTab === 'audit' && (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Enter User ID to audit
            </label>
            <input
              type="text"
              placeholder="User ID"
              className="px-3 py-2 border rounded-lg w-64"
              onChange={(e) => setSelectedUserId(e.target.value || null)}
            />
          </div>

          {auditData?.adminUserPermissionsAudit && (
            <div className="space-y-4">
              {auditData.adminUserPermissionsAudit.map((membership) => (
                <div
                  key={membership.organizationId}
                  className="p-4 rounded-lg border border-white/10 bg-white/5"
                >
                  <h4 className="font-medium">{membership.organizationName}</h4>
                  <p className="text-sm text-zinc-400">Role: {membership.role.name}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {membership.permissions.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 rounded"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

Register in routes and admin navigation.

---

## Implementation Checklist

### Backend

- [ ] Create `libs/api/custom/src/lib/plugins/rbac/` directory
- [ ] Implement `RbacAdminService` with all methods
- [ ] Implement `RbacAdminResolver` with queries and mutations
- [ ] Create `RbacModule` and export from plugins
- [ ] Add `GqlSuperAdminGuard` if not present
- [ ] Add GraphQL input types for role mutations
- [ ] Add GraphQL output types for audit queries
- [ ] Import `RbacModule` in main app module

### Frontend

- [ ] Add GraphQL operations to `libs/shared/sdk/src/lib/graphql/rbac.graphql`
- [ ] Run codegen to generate types and hooks
- [ ] Create `/settings/roles` page for organization role management
- [ ] Create `/admin/rbac` page for super admin dashboard
- [ ] Register routes in `apps/web/app/routes.tsx`
- [ ] Add "Roles" link to settings navigation
- [ ] Add "RBAC" link to admin navigation

### Testing

- [ ] Test custom role creation
- [ ] Test permission assignment to custom roles
- [ ] Test role assignment to members
- [ ] Test role deletion (verify cannot delete with assigned members)
- [ ] Test super admin access controls
- [ ] Test organization-level permission boundaries

---

## Notes for AI Implementation

When implementing this specification:

1. **Start with the backend** - Get the service and resolver working first
2. **Test with GraphQL Playground** - Verify queries/mutations before building UI
3. **Check existing types** - Some GraphQL types may already exist in generated code
4. **Follow existing patterns** - Look at `OrganizationService` for reference
5. **Don't modify default roles** - Keep Owner/Admin/Member as system roles

This spec is designed to integrate cleanly with the existing Nestled Template architecture. All new code goes in the `plugins` directory, following the established patterns.
````
