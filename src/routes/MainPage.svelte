<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { Reply } from 'lucide-svelte';

	import Lynt from './Lynt.svelte';
	import Navigation from './Navigation.svelte';
	import PostButton from './PostButton.svelte';
	import ProfileButton from './ProfileButton.svelte';
	import { setMode } from 'mode-watcher';
	import { onMount } from 'svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';

	export let username: string;
	export let handle: string;
	export let created_at: string;
	export let iq: number;
	export let profile_picture: string;

	let currentTab = 'foryou';
	let comment: string;
	let loadingFeed = true;

	interface FeedItem {
		content: string;
		repostCount: number;
		viewsCount: number;
		likeCount: number;
		commentCount: number;
		username: string;
		handle: string;
		iq: number;
		created_at: number;
		verified: boolean;
		likedByUser: boolean;
		repostedByUser: boolean;
		id: string;
	}

	let feed: FeedItem[] = [];

	async function fetchFeed() {
		const response = await fetch('api/feed', { method: 'GET' });

		if (response.status !== 200) alert('Error generating feed! Please refresh the page');

		const res = await response.json();

		for (const post of res) {
			feed = [
				...feed,
				{
					content: post.content,
					repostCount: post.repostCount,
					likeCount: post.likeCount,
					viewsCount: post.views,
					commentCount: post.commentCount,
					username: post.username,
					created_at: post.createdAt,
					handle: post.handle,
					iq: post.iq,
					verified: post.verified,
					likedByUser: post.likedByUser,
					repostedByUser: post.repostedByUser,
					id: post.id
				}
			];
		}

		loadingFeed = false
	}
	onMount(async () => {
		fetchFeed();
	});
</script>

<div class="flex h-screen justify-center gap-4 overflow-hidden">
	<div class="static ml-5 mt-5 inline-flex w-auto flex-col items-start gap-2">
		<img class="mb-5 size-20 cursor-pointer" src="logo.svg" alt="Logo" />
		<button on:click={() => setMode('light')}>Set Light Mode</button>
		<button on:click={() => setMode('dark')}>Set Dark Mode</button>
		<Navigation />
		<PostButton />
		<ProfileButton src={profile_picture} name={username} handle="@{handle}" />
	</div>
	<Separator orientation="vertical" />

	<div class="flex w-[600px] flex-col overflow-hidden">
		<div class="flex justify-center gap-20">
			<div>
				<Label class="cursor-pointer select-none text-xl">For you</Label>
				{#if currentTab === 'foryou'}
					<div class="mt-1 h-2 w-auto rounded-b-lg bg-primary"></div>
				{/if}
			</div>

			<div>
				<Label class="cursor-pointer select-none text-xl">Following</Label>
				{#if currentTab === 'following'}
					<div class="mt-1 h-2 w-auto rounded-b-lg bg-primary"></div>
				{/if}
			</div>
		</div>
		<Separator class="mt-4" />

		<!-- Feed -->
		<div class="no-scrollbar flex flex-grow flex-col gap-4 overflow-y-auto">
			{#if loadingFeed}
				<LoadingSpinner />
			{:else}
				{#each feed as { id, content, username, handle, iq, verified, created_at, repostCount, commentCount, viewsCount, likeCount, likedByUser, repostedByUser }}
					<Lynt
						{id}
						{username}
						{handle}
						postedAt={new Date(created_at)}
						{verified}
						{content}
						{iq}
						{repostCount}
						{commentCount}
						{viewsCount}
						{likeCount}
						{likedByUser}
						{repostedByUser}
					/>
				{/each}
			{/if}
			<div class="mt-24"></div>
		</div>
	</div>
	<Separator orientation="vertical" />

	<div class="no-scrollbar mt-1 w-[500px] space-y-2 overflow-y-auto">
		<Lynt
			username="Face"
			handle="facedevstuff"
			postedAt={new Date(1468959781804)}
			verified={true}
			content={'placeholder'}
			iq={43}
		/>

		<div class="inline-flex w-full items-center gap-2 rounded-xl bg-border p-3">
			<Reply size={32} />

			<div
				contenteditable="true"
				role="textbox"
				spellcheck="true"
				tabindex="0"
				bind:textContent={comment}
				class="overflow-wrap-anywhere w-full text-lg outline-none"
				placeholder="Reply..."
			/>

			<Button>Post</Button>
		</div>
		<Separator />
		<div class="space-y-2">
			<Lynt
				username="Face"
				handle="facedevstuff"
				postedAt={new Date(1468959781804)}
				verified={true}
				content={'placeholder'}
				iq={4}
			/>
			<Lynt
				username="Face"
				handle="facedevstuff"
				postedAt={new Date(1468959781804)}
				verified={true}
				content={'placeholder'}
				iq={4}
			/>
			<Lynt
				username="Face"
				handle="facedevstuff"
				postedAt={new Date(1468959781804)}
				verified={true}
				content={'placeholder'}
				iq={4}
			/>
			<Lynt
				username="Face"
				handle="facedevstuff"
				postedAt={new Date(1468959781804)}
				verified={true}
				content={'placeholder'}
				iq={4}
			/>
			<Lynt
				username="Face"
				handle="facedevstuff"
				postedAt={new Date(1468959781804)}
				verified={true}
				content={'placeholder'}
				iq={4}
			/>
			<Lynt
				username="Face"
				handle="facedevstuff"
				postedAt={new Date(1468959781804)}
				verified={true}
				content={'placeholder'}
				iq={4}
			/>
		</div>
	</div>
</div>
