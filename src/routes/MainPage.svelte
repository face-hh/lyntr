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
	import { toast } from 'svelte-sonner';
	import { currentPage } from './stores';
	import Search from './Search.svelte';
	import Notifications from './Notifications.svelte';
	import ProfilePage from './ProfilePage.svelte';

	export let username: string;
	export let handle: string;
	export let created_at: string;
	export let iq: number;
	export let profile_picture: string;
	export let lyntOpened: string | null = null;
	export let profileOpened: string | null = null;

	let currentTab = 'foryou';
	let comment: string;
	let loadingFeed = true;

	let page: string = 'home';
	currentPage.subscribe((value) => {
		page = value;
	});
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
	let comments: FeedItem[] = [];
	let selectedLynt: FeedItem | null = null;

	if (lyntOpened !== null && lyntOpened !== '') {
		(async () => {
			selectedLynt = await getLynt(lyntOpened);
	
			comments = await getComments(lyntOpened);
		})();
	} else if(profileOpened !== null){
		page = `profile${profileOpened}`
	}

	async function getLynt(lyntOpened: string) {
		const response = await fetch('api/lynt?id=' + lyntOpened, { method: 'GET' });

		if (response.status !== 200) alert('Error loading lynt!');

		const res = await response.json();

		return res as FeedItem;
	}

	async function fetchFeed() {
		const response = await fetch('api/feed', { method: 'GET' });

		if (response.status !== 200) alert('Error generating feed! Please refresh the page');

		const res = await response.json();

		feed = res.lynts.map((post: any) => ({ ...post }));

		loadingFeed = false;
	}
	async function handleLyntClick(event: CustomEvent<{ id: string }>) {
		lyntOpened = event.detail.id;
		selectedLynt = feed.find((lynt) => lynt.id === lyntOpened) || null;

		comments = await getComments(lyntOpened);
	}

	async function getComments(id: string) {
		const response = await fetch('api/comments?id=' + id, {
			method: 'GET'
		});

		if (response.status !== 200) {
			toast(`Failed to load comments! Error: ${response.status} | ${response.statusText}`);
		}

		const res = await response.json();
		return res.map((post: any) => ({ ...post }));
	}

	async function postComment() {
		const response = await fetch('api/comment', {
			method: 'POST',
			body: JSON.stringify({ id: selectedLynt?.id, content: comment })
		});
		comment = '';

		if (response.status !== 201) {
			toast(
				`Something went wrong while commenting on this lynt. Error: ${response.status} | ${response.statusText}`
			);
		} else {
			toast('Your reply has been posted!');
		}
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
		{#if page === 'search'}
			<Search {handleLyntClick} />
		{:else if page === 'notifications'}
			<Notifications />
		{:else if page.startsWith('profile')}
			<ProfilePage profileHandle={page.replace('profile', '')} />
		{:else if page === 'home'}
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
		{/if}
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

				<Button on:click={postComment}>Post</Button>
			</div>
			<Separator />
			<div class="space-y-2">
				{#if comments.length === 0}
					<Label class="flex justify-center text-lg">This lynt has no comments.</Label>
				{:else}
					{#each comments as lynt}
						<Lynt {...lynt} on:lyntClick={handleLyntClick} />
					{/each}
				{/if}
			</div>
		{/if}
	</div>
</div>
