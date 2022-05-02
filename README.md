# Directus RBAC Sync
Hooks and CLI tool for exporting and importing Directus roles and permissions.

## Usage

### CLI

 - `directus rbac export`: Export roles and permissions to files
   - `--system`: Include system collections' permissions
 - `directus rbac import`: Import roles and permissions from files

### Automatic Syncing

Remember to set the `RBAC_SYNC_MODE`  in your `.env` file.

**POSSIBLE VALUES:**
 - `EXPORT`: Exports all changes to file upon create/update/delete-ing
 - `IMPORT`: Imports roles and permissions stored in files, upon starting Directus
 - `FULL`: Executes both EXPORT and IMPORT
 - `NONE`: Does nothing


## Installation

- Download and extract the release archive.
- Copy the `config` directory to your project root.
- Copy and rename the `dist` directory to your `extensions/hooks/rbac-sync`.
- If you want to override or automate syncing add the following to your `.env`
```
RBAC_SYNC_MODE=EXPORT
RBAC_CONFIG_PATH=./config
```

### Migration (optional)

To ensure that no duplicate roles ever exist, you can use the following migration:
- Copy the migration file from `migrations/20220501-permission-composite-index.js` to your `extensions/migrations` directory
- Exceute `directus database migrate:latest`


## Config Structure

All roles are stored in the `config/roles.yaml` file.

All permissions are stored per collection in `config/permissions/[COLLECTION].yaml` files.

Permissions are separated by `action` with roles being a group of role ids that have the same permissions.

## Why?

This is very useful for syncing roles and permissions between environments and developers.

The file based approach is also useful for tracking changes using git.

Roles are stored with their ids, however permissions are tracked by a composite index on `collection, action, role` in order to reduce code conflicts when multiple developers generate permissions and have to merge them.


# Warning

As always, be careful when making changes and importing them to your database. Make a backup and test to see if this works the way you expect.
