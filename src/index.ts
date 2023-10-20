import { clearSystemCache } from "@directus/api/cache";
import { defineHook } from '@directus/extensions-sdk';
import { ActionHandler, Collection, FilterHandler, Permission } from "@directus/types";
import {
	exportPermissions,
	exportRoles,
	importPermissions,
	importRoles,
	listConfiguredCollections
} from "./helpers";

export default defineHook(({ filter, action, init }, extCtx) => {
    const { services: { CollectionsService, PermissionsService, RolesService }, env, logger } = extCtx;

    const onCreate: ActionHandler = async ({ key }, { database, schema }) => {
        const permissionsService = new PermissionsService({ database, schema });

        const permission = await permissionsService.readOne(key, {
            fields: ['id', 'collection'],
        }) as Permission;

        await exportPermissions(permission.collection, permissionsService)
    }

    const onUpdate: ActionHandler = async ({ keys }, { database, schema }) => {
        const permissionsService = new PermissionsService({ database, schema });

        const permissions = await permissionsService.readMany(keys, {
            fields: ['id', 'collection'],
        }) as Array<Pick<Permission, 'id'|'collection'>>;

        const uniqueCollections = [...new Set(permissions.map(p => p.collection))]

        await Promise.all(uniqueCollections.map((collection) =>
            exportPermissions(collection, permissionsService)
        ))
    }

    //
    // Need to keep track of what collection the deleting permission is for
    // so that we can dump the permissions after it is deleted
    //
    const deletingPermissions: Record<string | number, string> = {};
    const beforeDelete: FilterHandler = async (keys, meta, { database, schema }) => {
        const permissionsService = new PermissionsService({ database, schema });

        const permissions = await permissionsService.readMany(keys, {
            fields: ['id', 'collection'],
        }) as Array<{
			id: number,
			collection: string
		}>;

        permissions.forEach(({ id, collection }) => {
            deletingPermissions[id] = collection;
        })
    }

    const onDelete: ActionHandler = async ({ keys }, { database, schema }) => {
        const permissionsService = new PermissionsService({ database, schema });

		const uniqueCollections = new Set<string>()
		keys.forEach((key: string|number) => uniqueCollections.add(deletingPermissions[key]))

        await Promise.all([...uniqueCollections].map((collection) =>
            exportPermissions(collection, permissionsService)
        ))

        keys.forEach((key: string|number) => delete deletingPermissions[key])
    }

    const onRoleChanges: ActionHandler = ({ keys, key }, { database, schema }) => {
        const rolesService = new RolesService({ database, schema });
        return exportRoles(rolesService)
    }

    async function syncToDb() {
		const { getSchema, database } = extCtx;
        const schema = await getSchema()
        const permissionsService = new PermissionsService({ database, schema });
        const rolesService = new RolesService({database, schema});

        // Sync roles into db
        logger.info('Importing roles...')
        await importRoles(rolesService)

        // Sync permissions into db
        logger.info('Importing permissions...');

        const collections = await listConfiguredCollections()

        await Promise.all(collections.map(collection =>
            importPermissions(collection, permissionsService)
        ))

		// WIP; not sure if this is best way to solve
		await clearSystemCache();

        logger.info('RBAC imported!')
    }

    if (['EXPORT', 'FULL'].includes(env.RBAC_SYNC_MODE)) {
        action('roles.create', onRoleChanges)
        action('roles.update', onRoleChanges)
        action('roles.delete', onRoleChanges)


        action('permissions.create', onCreate)
        action('permissions.update', onUpdate)
        filter('permissions.delete', beforeDelete)
        action('permissions.delete', onDelete)
    }

    if (['IMPORT', 'FULL'].includes(env.RBAC_SYNC_MODE)) {
        setTimeout(syncToDb, 10)
    }

	init('app.before', async ({ program }) => {
		if (['IMPORT', 'FULL'].includes(env.RBAC_SYNC_MODE)) {
			await syncToDb()
		}
	});

    init('cli.before', async ({ program }) => {
        const dbCommand = program.command('rbac');

        // Only allow this command when not automatically importing
        dbCommand.command('import')
            .description('Sync configured roles and permissions from files to database')
            .action(async () => {
                if (! ['IMPORT', 'FULL'].includes(env.RBAC_SYNC_MODE)) {
                    try {
                        await syncToDb()
                        process.exit(0);
                    } catch (err: any) {
                        logger.error(err);
                    }
                } else {
                    logger.warn('RBAC Sync is configured to automatically import roles and permissions. Skipping manual import.')
                }
                process.exit(1);
            })

        dbCommand.command('export')
            .description('Sync roles and permissions from DB to file')
            .option('--system', 'Include system collections')
            .action(async ({system = false}) => {
				const { getSchema, database } = extCtx;

                logger.info('Exporting RBAC...')
                try {
                    const schema = await getSchema()
                    const collectionsService = new CollectionsService({database, schema});
                    const permissionsService = new PermissionsService({database, schema});
                    const rolesService = new RolesService({database, schema});

                    const collections: Collection[] = await collectionsService.readByQuery()

                    logger.info('Exporting permissions...');
                    await Promise.all(collections.map(({collection}) => {
                        if (!system && collection.startsWith('directus_')) {
                            return
                        }

                        return exportPermissions(collection, permissionsService)
                    }))

                    logger.info('Exporting roles...');
                    await exportRoles(rolesService)

                    logger.info('RBAC exported!')
                    process.exit(0);
                } catch (err: any) {
                    logger.error(err);
                    process.exit(1);
                }
            });
    })
});
