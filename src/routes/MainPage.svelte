<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { Reply } from 'lucide-svelte';
	import { fade } from 'svelte/transition';

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
	let lyntOpened: string | null = null;

	interface FeedItem {
		id: string;
		content: string;
		userId: string;
		createdAt: number;
		views: number;
		reposted: boolean;
		likeCount: number;
		likedByFollowed: boolean;

		repostCount: number;
		commentCount: number;
		likedByUser: boolean;
		repostedByUser: boolean;
		handle: string;
		userCreatedAt: number;
		username: string;
		iq: number;
		verified: boolean;

		parentId: string | null;
		parentContent: string | null;
		parentUserHandle: string | null;
		parentUserUsername: string | null;
		parentUserVerified: boolean | null;
		parentUserIq: number | null;
		parentCreatedAt: number | null;
		parentUserCreatedAt: number | null;
	}

	let feed: FeedItem[] = [];
	let selectedLynt: FeedItem | null = null;

	async function fetchFeed() {
		const response = await fetch('api/feed', { method: 'GET' });

		if (response.status !== 200) alert('Error generating feed! Please refresh the page');

		const res = await response.json();

		feed = res.map((post: any) => ({ ...post }));

		loadingFeed = false;
	}
	function handleLyntClick(event: CustomEvent<{ id: string }>) {
		lyntOpened = event.detail.id;
		selectedLynt = feed.find((lynt) => lynt.id === lyntOpened) || null;
		console.log('Clicked Lynt ID:', lyntOpened);
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
				{#each feed as lynt}
					<Lynt {...lynt} on:lyntClick={handleLyntClick} />
				{/each}
			{/if}
			<div class="mt-24"></div>
		</div>
	</div>
	<Separator orientation="vertical" />

	<div class="no-scrollbar mt-1 w-[600px] space-y-2 overflow-y-auto">
		{#if lyntOpened && selectedLynt}
			<Lynt {...selectedLynt} />

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
				<!-- comments -->
			</div>
		{/if}
	</div>
</div>
