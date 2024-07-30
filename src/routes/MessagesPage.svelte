<script lang="ts" context="module">
	export type SimpleUser = {
		id: string;
		username: string;
		handle: string;
		iq: number;
		verified: boolean;
	};

	export type Message = {
		id: string;
		sender: SimpleUser;
		receiver: SimpleUser;
		content: string;
		created_at: string;
		read: boolean;
	};
</script>

<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { cdnUrl, currentPage } from './stores';
	import { toast } from 'svelte-sonner';
	import Avatar from './Avatar.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Send, MoveDown } from 'lucide-svelte';
	import VirtualScroll from 'svelte-virtual-scroll-list';
	import * as Tooltip from '@/components/ui/tooltip';
	import { mode } from 'mode-watcher';
	import MessageComponent from './Message.svelte';

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

	let myProfile: {
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

	let messages: Message[] = [];
	let messagesContainer: VirtualInfiniteList;
	let messagesLoading = false;

	let friendsList: {
		id: string;
		username: string;
		handle: string;
		verified: boolean;
		iq: number;
		unread: number;
	}[] = [];
	let friendListLoaded = false;
	let friendListPage = 1;
	let friendEnd = false;
	let loadingNextFriends = true;
	let unreadMessageI = -1;

	$: messages &&
		(async () => {
			const i = friendsList.findIndex((friend) => friend.id === profile.id);
			if (i >= 0 && friendsList[i]) {
				friendsList[i].unread = messages.filter(
					(msg) => msg.sender.id !== myId && !msg.read
				).length;
			}
			if (messagesContainer) {
				await tick();
				messagesContainer.scrollToBottom();
			}
		})();

	$: {
		const msgs = messages.filter((m) => m.sender.id !== myId);
		const friend = friendsList[friendsList.findIndex((friend) => friend.id === profile.id)];

		unreadMessageI = messages.findIndex((msg) => {
			if (!friend || msgs.length === 0 || msgs.length - friend.unread < 0) {
				return false;
			}
			return msg.id === msgs[msgs.length - friend.unread]?.id;
		});
	}

	async function markAsRead() {
		if (unreadMessageI < 0) return;

		for (let i = unreadMessageI; i < messages.length; i++) {
			if (messages[i] && messages[i].sender.id !== myId) {
				messages[i].read = true;
			}
		}
		unreadMessageI = -1;

		// TODO: mark messages as read in database
	}

	async function fetchProfile() {
		try {
			const response = await fetch(`/api/profile?id=${myId}`);

			if (response.status === 200) {
				myProfile = await response.json();
			} else {
				toast(
					`Failed to load profile. Error: ${response.status} ${JSON.stringify(await response.json())}`
				);
			}
		} catch (error) {
			console.error('Error fetching profile:', error);
			toast('Failed to load profile: ' + error);
		}

		if (!profileHandle) return;

		try {
			const response = await fetch(`/api/profile?handle=${profileHandle}`);

			if (response.status === 200) {
				profile = await response.json();
				isSelf = profile.id === myId;
			} else {
				toast(
					`Failed to load profile. Error: ${response.status} ${JSON.stringify(await response.json())}`
				);
			}
		} catch (error) {
			if (isSelf) return;
			console.error('Error fetching profile:', error);
			toast('Failed to load profile: ' + error);
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

		await appendFriends();
		friendListLoaded = true;

		messagesLoading = true;
		// TODO: load messages
		messages = [
			{
				id: '' + Math.floor(Math.random() * 99999),
				sender: myProfile,
				receiver: profile,
				content: 'hello',
				created_at: Date.now().toString(),
				read: false
			},
			{
				id: '' + Math.floor(Math.random() * 99999),
				receiver: myProfile,
				sender: profile,
				content: 'hi',
				created_at: Date.now().toString(),
				read: false
			}
		];
		messagesLoading = false;
	});

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			sendMessage();
		}
	}

	function sendMessage() {
		if (messageValue.trim() === '') return;

		messages = [
			...messages,
			{
				id: '' + Math.floor(Math.random() * 99999),
				sender: myProfile,
				receiver: profile,
				content: messageValue,
				created_at: Date.now().toString(),
				read: false
			}
		];

		messageValue = '';
	}

	async function preappendPreviousMessages() {
		messagesLoading = true;

		toast('test');

		messagesLoading = false;
	}

	async function handleFocus() {
		await markAsRead();
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
					<button
						class="flex flex-row items-center justify-center gap-2 rounded-full bg-secondary p-1.5 {profile.id ===
						friend.id
							? 'bg-secondary/50'
							: ''}"
						on:click={() => {
							currentPage.set('messages/@' + friend.handle);

							goto('/messages/@' + friend.handle, {
								replaceState: true,

								noScroll: true
							});
						}}
					>
						<div class="flex flex-row items-center gap-1">
							<Avatar src={cdnUrl(friend.id, 'big')} alt={friend.username} border={true} />
							<div class="text-elipsis flex w-full flex-col gap-1 overflow-hidden truncate text-sm">
								<span class="font-bold">{friend.username}</span>
								<span class="text-muted-foreground">@{friend.handle}</span>
							</div>
						</div>
						<Badge>{friend.unread || 0}</Badge>
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
							{#if profile.verified}
								<Tooltip.Root>
									<Tooltip.Trigger>
										<div class="flex h-full w-7 justify-center">
											<img
												class="h-7 w-7"
												src={$mode !== 'light' ? '/white_mode_verified.png' : '/verified.png'}
												alt="This user is verified."
											/>
										</div>
									</Tooltip.Trigger>
									<Tooltip.Content>
										<p>This user is <span class="rounded-xl bg-border p-1">verified</span>.</p>
									</Tooltip.Content>
								</Tooltip.Root>
							{/if}
							<span class="text-lg text-muted-foreground">@{profile.handle}</span>
						</div>
						<span class="w-full max-w-full overflow-hidden truncate text-ellipsis"
							>{profile.bio}</span
						>
					</div>
				</div>
				<Badge>{profile.iq}</Badge>
			</div>
			<div
				class="messagesContainer relative flex h-full w-full flex-col justify-end overflow-hidden rounded-md bg-secondary/90 px-1 py-2"
			>
				<VirtualScroll
					bind:this={messagesContainer}
					data={messages}
					key="id"
					on:top={preappendPreviousMessages}
					let:data={item}
				>
					<MessageComponent
						message={item}
						{unreadMessageI}
						index={messages.findIndex((msg) => msg.id === item.id)}
						unreadCount={friendsList[friendsList.findIndex((friend) => friend.id === profile.id)]
							?.unread || 0}
					/>
				</VirtualScroll>
				{#if messagesLoading}
					<LoadingSpinner />
				{/if}

				<!--<Button class="absolute right-2 bottom-2 rounded-md p-2 aspect-square" on:click={() => {
					messagesContainer.scrollToBottom();
					markAsRead();
				}}>
					<MoveDown/>
				</Button>-->
			</div>
			<div class="mb-1 flex flex-row gap-2">
				<Input
					type="text"
					placeholder="Message @{profile.handle}"
					bind:value={messageValue}
					on:keydown={handleKeyPress}
					on:focus={handleFocus}
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
