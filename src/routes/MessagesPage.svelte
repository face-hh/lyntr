<script lang="ts">
	import { onMount } from 'svelte';
	import { cdnUrl, currentPage } from './stores';
	import { toast } from 'svelte-sonner';
	import Avatar from './Avatar.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Send } from 'lucide-svelte';
	import VirtualScroll from 'svelte-virtual-scroll-list';

	export let profileHandle: string;
	export let handleLyntClick;
	export let myId: string;
	export let isSelf: boolean = false;
	export let loading: boolean = true;

	let messageValue: string = '';

	let profile: {
		username: string;
		handle: string;
		iq: number;
		created_at: string;
		id: string;
		following: number;
		followers: number;
		bio: string;
		verified: boolean;
	};

	let friendsList: {
		id: string;
		username: string;
		handle: string;
		verified: boolean;
		iq: number;
	}[] = [];
	let friendListLoaded = false;
	let friendListPage = 1;
	let friendEnd = false;
	let loadingNextFriends = true;

	async function fetchProfile() {
		try {
			const response = await fetch(`/api/profile?handle=${profileHandle}`);

			if (response.status === 200) {
				profile = await response.json();
				isSelf = profile.id === myId;
			} else {
				toast(`Failed to load profile. Error: ${response.status}`);
			}
		} catch (error) {
			if (isSelf) return;
			console.error('Error fetching profile:', error);
			toast('Failed to load profile');
		}
	}

	async function appendFriends() {
		if (friendEnd) return;

		loadingNextFriends = true;
		try {
			const response = await fetch(`/api/me/friends?page=${friendListPage}`);

			if (response.status === 200) {
				let { friends, isLast } = await response.json();
				friendEnd = isLast;
				friendsList = [...friendsList, ...friends];
			} else {
				toast('Failed to load more friends: ' + response.status);
				friendEnd = true;
			}
		} catch (error) {
			toast('Failed to load more friends: ');
			friendEnd = true;
		}
		loadingNextFriends = false;
	}

	onMount(async () => {
		await fetchProfile();
		loading = false;

		// todo: load friends
		await appendFriends();
		friendListLoaded = true;
	});

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			sendMessage();
		}
	}

	function sendMessage() {
		toast.info(messageValue);
	}
</script>

{#if loading}
	<LoadingSpinner />
{:else if isSelf}
	<span>You can't private message with your self</span>
{:else if profile}
	<div class="relative flex h-full w-full flex-row gap-1">
		<div class="hidden h-full w-full flex-col items-center gap-1 md:flex md:w-[300px]">
			<span class="my-2 text-xl">Friends</span>
			{#if !friendListLoaded}
				<LoadingSpinner />
			{:else if friendsList.length > 0}
				<VirtualScroll
					data={friendsList}
					key="id"
					let:data={friend}
					on:bottom={async () => {
						// load next page of friends
						if (loadingNextFriends) return;
						friendListPage += 1;
						await appendFriends();
					}}
				>
					<button class="flex flex-row justify-center items-center gap-2 rounded-full bg-secondary p-1.5 {profile.id === friend.id ? 'bg-secondary/50' : ''}">
						<div class="flex flex-row gap-1 items-center">
							<Avatar src={cdnUrl(friend.id, 'big')} alt={friend.username} border={true} />
							<div class="text-elipsis flex w-full flex-col gap-1 overflow-hidden truncate text-sm">
								<span class="font-bold">{friend.username}</span>
								<span class="text-muted-foreground">@{friend.handle}</span>
							</div>
						</div>
						<Badge>{friend.iq}</Badge>
					</button>
				</VirtualScroll>
			{:else}
				<span>No Friends</span>
			{/if}
		</div>
		<div class="mt-2 flex w-full flex-col gap-2 px-1">
			<!--<span class="text-2xl text-center py-2">Private Messages With {profile.username}</span>-->
			<div
				class="flex w-full flex-row items-center justify-between gap-2 rounded-md bg-secondary/50 p-2"
			>
				<div class="flex flex-row gap-2">
					<Avatar src={cdnUrl(profile.id, 'big')} alt={profile.username} border={true} />
					<div class="flex flex-col">
						<div class="flex flex-row gap-2">
							<span class="text-lg font-bold">{profile.username}</span>
							<span class="text-lg text-muted-foreground">@{profile.handle}</span>
						</div>
						<span class="w-full max-w-full overflow-hidden truncate text-ellipsis"
							>{profile.bio}</span
						>
					</div>
				</div>
				<Badge>{profile.iq}</Badge>
			</div>
			<div class="flex h-full w-full flex-col gap-1 overflow-y-auto rounded-md bg-secondary/90 p-2">
				<div class="mt-auto"></div>
				<span class="w-full whitespace-pre-wrap text-wrap break-all"
					>{JSON.stringify(profile, null, 2)}</span
				>
				{myId}
			</div>
			<div class="mb-1 flex flex-row gap-2">
				<Input
					type="text"
					placeholder="Message @{profile.handle}"
					bind:value={messageValue}
					on:keydown={handleKeyPress}
				/>
				<Button class="aspect-square p-1" on:click={sendMessage}>
					<Send />
				</Button>
			</div>
		</div>
	</div>
{:else}
	<span>Invalid Profile</span>
{/if}
