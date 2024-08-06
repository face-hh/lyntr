import { boolean, date, pgTable, bigserial, timestamp, varchar, integer, type AnyPgColumn, primaryKey, text, uuid, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/node-postgres';

export const users = pgTable('users', {
    id: text('id').primaryKey(),
    username: varchar('username', { length: 60 }).notNull(),
    handle: varchar('handle', { length: 32 }).notNull().unique(),
    bio: varchar('bio', { length: 256 }).default('Nothing here yet...'),
    created_at: timestamp('created_at').defaultNow(),
    banned: boolean('banned').default(false),
    iq: integer('iq').notNull(),
    token: text('token').default("a"),
    email: text('email').notNull(),
    verified: boolean('verified').default(false)
});

export const lynts = pgTable('lynts', {
    id: text('id').primaryKey(),
    user_id: text('user_id').references(() => users.id),
    content: text('content').notNull(),
    views: integer('views').default(0),
    shares: integer('shares').default(0),
    has_link: boolean('has_link').default(false),
    has_image: boolean('has_image').default(false),
    created_at: timestamp('created_at').defaultNow(),
    reposted: boolean('reposted').default(false),
    parent: text('parent').references((): AnyPgColumn => lynts.id)
});

export const messages = pgTable('messages', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    sender_id: text('sender_id').references(() => users.id),
    receiver_id: text('receiver_id').references(() => users.id),
    content: text('content').notNull(),
    image: text('image'),
    referencedLyntId: text('referenced_lynt_id').references(() => lynts.id),
    read: boolean('read').default(false),
    created_at: timestamp('created_at').defaultNow()
}, (table) => {
   return {
     created_atIdx: index("created_at_idx").on(table.created_at),
   };
});

export const followers = pgTable('followers', {
    user_id: text('user_id').references(() => users.id).notNull(),
    follower_id: text('follower_id').references(() => users.id).notNull(),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.user_id, table.follower_id], name: 'followers_pkey' }),  // Replace 'followers_pkey' with the actual constraint name from your database
    }
});

export const likes = pgTable('likes', {
    lynt_id: text('lynt_id').references(() => lynts.id).notNull(),
    user_id: text('user_id').references(() => users.id).notNull(),
    liked_at: timestamp('liked_at').defaultNow(),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.lynt_id, table.user_id], name: 'likes_pkey' }),  // Replace 'likes_pkey' with the actual constraint name from your database
    }
});

export const notifications = pgTable('notifications', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    type: text('type').notNull(), // e.g., 'like', 'comment', 'follow'
    sourceUserId: text('source_user_id').references(() => users.id),
    lyntId: text('lynt_id').references(() => lynts.id),
    read: boolean('read').default(false),
    createdAt: timestamp('created_at').defaultNow()
});

export const history = pgTable('history', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: text('user_id').references(() => users.id),
    lynt_id: text('lynt_id').references(() => lynts.id),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
    return {
        uniqueUserLynt: uniqueIndex('unique_user_lynt').on(table.user_id, table.lynt_id),
    }
});
