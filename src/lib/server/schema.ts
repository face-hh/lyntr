import { boolean, date, pgTable, serial, timestamp, varchar, integer, type AnyPgColumn, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/node-postgres';

export const users = pgTable('users', {
    id: text('id').primaryKey(),
    username: varchar('username', { length: 60 }).notNull(),
    handle: varchar('handle', { length: 32 }).notNull().unique(),
    created_at: timestamp('created_at').defaultNow(),
    iq: integer('iq').notNull(),
    profile_picture: text('profile_picture').default("default"),
    verified: boolean('verified').default(false)
});

export const lynts = pgTable('lynts', {
    id: text('id').primaryKey(),
    user_id: text('user_id').references(() => users.id),
    content: text('content').notNull(),
    views: integer('views').default(0),
    shares: integer('shares').default(0),
    has_link: boolean('has_link').default(false),
    created_at: timestamp('created_at').defaultNow(),
    // todo: if you want quotes, render content and parent id if reposted
    reposted: boolean('reposted').default(false),
    parent: text('parent').references((): AnyPgColumn => lynts.id)
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
    id: text('id').primaryKey(),
    user_id: text('user_id').references(() => users.id),
    lynt_id: text('lynt_id').references(() => lynts.id)
});