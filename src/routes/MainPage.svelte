<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { Reply } from 'lucide-svelte';
	
	import { v } from './stores';

	import Lynt from './Lynt.svelte';
	import Navigation from './Navigation.svelte';
	import PostButton from './PostButton.svelte';
	import ProfileButton from './ProfileButton.svelte';
	import { setMode } from 'mode-watcher';
	import { afterUpdate, onMount } from 'svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import { toast } from 'svelte-sonner';
	import { currentPage } from './stores';
	import Search from './Search.svelte';
	import Notifications from './Notifications.svelte';
	import ProfilePage from './ProfilePage.svelte';
	import { goto } from '$app/navigation';
	import TopTab from './TopTab.svelte';

	export let username: string;
	export let handle: string;
	// export let created_at: string;
	// export let iq: number;
	export let id: string;
	export let lyntOpened: string | null = null;
	export let profileOpened: string | null = null;

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
		bio: string;
		verified: boolean;
		has_image: boolean;

		parentId: string | null;
		parentContent: string | null;
		parentUserHandle: string | null;
		parentUserUsername: string | null;
		parentUserVerified: boolean | null;
		parentHasImage: boolean | null;
		parentUserBio: string | null;
		parentUserIq: number | null;
		parentUserId: string | null;
		parentCreatedAt: number | null;
		parentUserCreatedAt: number | null;
	}

	let feed: FeedItem[] = [];
	let comments: FeedItem[] = [];
	let selectedLynt: FeedItem | null = null;
	let referencedLynts: FeedItem[] = [];
	let loadingComments = false;

	let currentTab = 'For you';
	const tabs = ['For you', 'Following', 'Live'];

	function handleTabChange(tab: string) {
		currentTab = tab;
		fetchFeed();
	}

	if (lyntOpened !== null && lyntOpened !== '') {
		(async () => {
			selectedLynt = await getLynt(lyntOpened);

			comments = await getComments(lyntOpened);
		})();
	} else if (profileOpened !== null) {
		page = `profile${profileOpened}`;
	}

	async function getLynt(lyntOpened: string) {
		const response = await fetch('api/lynt?id=' + lyntOpened, { method: 'GET' });

		if (response.status !== 200) alert('Error loading lynt!');

		const res = await response.json();

		referencedLynts = res.referencedLynts || [];

		return res as FeedItem;
	}

	async function fetchFeed() {
		const response = await fetch(`api/feed?type=${currentTab}`, { method: 'GET' });

		if (response.status !== 200) alert('Error generating feed! Please refresh the page');

		const res = await response.json();

		feed = res.lynts.map((post: any) => ({ ...post }));

		loadingFeed = false;
	}

	function updateURL(newPath: string) {
		goto(newPath, { replaceState: true, noScroll: true });
	}

	async function handleLyntClick(id: string) {
		loadingComments = true;

		lyntOpened = id;
		referencedLynts = [];
		selectedLynt = feed.find((lynt) => lynt.id === lyntOpened) || (await getLynt(lyntOpened));

		comments = await getComments(lyntOpened);
		loadingComments = false;
		if (!page.startsWith('profile')) updateURL(`/?id=${id}`);
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
		<Navigation {handle} />
		<PostButton userId={id} />
		<ProfileButton
			src={`http://localhost:9000/lyntr/${id}_medium.webp?v=${$v}`}
			name={username}
			handle="@{handle}"
		/>
	</div>
	<Separator orientation="vertical" />

	<div class="flex w-[600px] flex-col overflow-hidden">
		{#if page === 'search'}
			<Search userId={id} {handleLyntClick} />
		{:else if page === 'notifications'}
			<Notifications />
		{:else if page.startsWith('profile')}
			<ProfilePage profileHandle={page.replace('profile', '')} {handleLyntClick} />
		{:else if page === 'home'}
			<TopTab {tabs} {currentTab} onTabChange={handleTabChange} />
			<Separator class="mt-4" />

			<!-- Feed -->
			<div class="no-scrollbar flex flex-grow flex-col gap-4 overflow-y-auto">
				{#if loadingFeed}
					<LoadingSpinner />
				{:else}
					{#each feed as lynt}
						<Lynt {...lynt} myId={id} lyntClick={handleLyntClick} />
					{/each}
				{/if}
				<div class="mt-24"></div>
			</div>
		{/if}
	</div>
	<Separator orientation="vertical" />

	<div class="relative mt-2 flex w-[600px] flex-col">
		<div class="no-scrollbar absolute inset-0 overflow-y-auto" id="lynt-container">
			{#if lyntOpened && selectedLynt}
				<!-- Referenced Lynts -->
				<div>
					{#each referencedLynts as lynt (lynt.id)}
						<Lynt {...lynt} myId={id} lyntClick={handleLyntClick} connect={true} />
					{/each}
				</div>

				<!-- Selected Lynt -->
				<div id="selected-lynt">
					<Lynt {...selectedLynt} myId={id} truncateContent={false} lyntClick={handleLyntClick} />
				</div>

				<div class="mb-2 mt-2 inline-flex w-full items-center gap-2 rounded-xl bg-border p-3">
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
					{#if loadingComments}
						<LoadingSpinner occupy_screen={false} />
					{:else if comments.length === 0}
						<Label class="flex justify-center text-lg">This lynt has no comments.</Label>
					{:else}
						{#each comments as lynt}
							<Lynt {...lynt} myId={id} lyntClick={handleLyntClick} />
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
