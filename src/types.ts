import type { Knex } from 'knex';
import type { Accountability, Filter, PermissionsAction, Query } from '@directus/shared/src/types';

export type StoredPermission = {
	action: PermissionsAction;
	roles?: Array<string|null>;
	permissions?: Filter | null;
	validation?: Filter | null;
	presets?: Record<string, any> | null;
	fields?: Array<string> | string | null;
}

export type StoredRole = {
	id: string;
	name: string;
	icon: string;
	description?: string;
	enforce_2fa?: boolean;
	external_id?: string;
	ip_whitelist?: string[];
	app_access?: boolean;
	admin_access?: boolean;
}


// Defining some Directus types here in order to get type hinting without installing entire
export type Item = Record<string, any>;

export type PrimaryKey = string | number;

export type MutationOptions = {
	emitEvents?: boolean;
};

export interface AbstractService {
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
