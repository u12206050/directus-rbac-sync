import type { Accountability, Permission, Role } from '@directus/types';
import type { Knex } from 'knex';

export type StoredPermission = Pick<Permission, 'action'> &
	Partial<Pick<Permission, 'permissions' | 'validation'>> & {
		roles?: Array<string|null>;
		presets?: Record<string, any> | null;
		fields?: Array<string> | string | null;
	};
export type StoredRole = Partial<Role> & Pick<Role, 'id' | 'name' | 'icon'>;

//
// Defining used Directus types here in order to get type hinting without installing entire Directus
//
export type Item = Record<string, any>;
export type PrimaryKey = string | number;
export type MutationOptions = {
	emitEvents?: boolean;
};
export interface ItemsService {
	knex: Knex;
	accountability: Accountability | null;

	createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey>;
	createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]>;

	readOne(key: PrimaryKey, query?: any, opts?: MutationOptions): Promise<Item>;
	readMany(keys: PrimaryKey[], query?: any, opts?: MutationOptions): Promise<Item[]>;
	readByQuery(query: any, opts?: MutationOptions): Promise<Item[]>;

	updateOne(key: PrimaryKey, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey>;
	updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]>;

	upsertMany(payloads: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]>;

	deleteOne(key: PrimaryKey, opts?: MutationOptions): Promise<PrimaryKey>;
	deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]>;
	deleteByQuery(query: any, opts?: MutationOptions): Promise<PrimaryKey[]>;
}
