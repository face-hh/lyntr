<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import Lynt from './Lynt.svelte';
	import Avatar from './Avatar.svelte';
	import { Button } from '@/components/ui/button';
	import { Label } from '@/components/ui/label';
	import { Brain, Calendar } from 'lucide-svelte';
	import { Separator } from '@/components/ui/separator';
	import FollowListPopup from './FollowListPopup.svelte';
	import ProfileSettings from './ProfileSettings.svelte';
	import ProfileButton from './ProfileButton.svelte';
	import * as Tooltip from '@/components/ui/tooltip';
	import { mode } from 'mode-watcher';
	import { cdnUrl, currentPage } from './stores';
	import TopTab from './TopTab.svelte';
	import { goto } from '$app/navigation';

	export let profileHandle: string;
	export let handleLyntClick;
	export let myId: string;

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
	let userLynts: any[] = [];
	let loading = true;
	let isSelf = false;
	let isFollowing = false;
	let isFollowedBy = false;
	let followersCount = 0;
	let followingCount = 0;

	let showFollowersPopup = false;
	let showFollowingPopup = false;

	let currentTab = 'Lynts';
	const tabs = ['Lynts', 'Likes'];

	function handleTabChange(tab: string) {
		currentTab = tab;
		fetchUserLynts(currentTab === tabs[1]);
	}

	function toggleFollowersPopup() {
		showFollowersPopup = !showFollowersPopup;
	}

	function toggleFollowingPopup() {
		showFollowingPopup = !showFollowingPopup;
	}

	async function fetchProfile() {
		try {
			const response = await fetch(`/api/profile?handle=${profileHandle}`);

			if (response.status === 200) {
				profile = await response.json();
				isSelf = profile.id === 'currentUserId'; // Replace 'currentUserId' with actual current user's ID
			} else {
				toast(`Failed to load profile. Error: ${response.status}`);
			}
		} catch (error) {
			if (isSelf) return;
			console.error('Error fetching profile:', error);
			toast('Failed to load profile');
		}
	}

	async function fetchUserLynts(fetchLikes: boolean) {
		try {
			const response = await fetch(
				`/api/feed?handle=${profileHandle}${fetchLikes ? '&type=Liked' : ''}`
			);

			if (response.status === 200) {
				userLynts = (await response.json()).lynts;
			} else {
				toast(`Failed to load user lynts. Error: ${response.status}`);
			}
		} catch (error) {
			if (isSelf) return;
			console.error('Error fetching user lynts:', error);
			toast('Failed to load user lynts');
		}
	}

	async function toggleFollow() {
		try {
			const response = await fetch('/api/follow', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ userId: profile.id })
			});

			if (response.ok) {
				isFollowing = !isFollowing;
				followersCount += isFollowing ? 1 : -1;
			} else if (response.status === 409) {
				isSelf = true;
			} else {
				const error = await response.json();
				toast(error.error);
			}
		} catch (error) {
			if (isSelf) return;
			console.error('Error toggling follow:', error);
			toast('Failed to update follow status');
		}
	}

	async function checkFollowStatus() {
		try {
			const response = await fetch(`/api/follow?userId=${profile.id}`);
			if (response.ok) {
				const result = await response.json();
				isFollowing = result.isFollowing;
				isFollowedBy = result.isFollowedBy;
			} else if (response.status === 409) {
				isSelf = true;
			} else {
				const error = await response.json();
				toast(error.error);
			}
		} catch (error) {
			if (isSelf) return;
			console.error('Error checking follow status:', error);
			toast('Failed to check follow status');
		}
	}

	async function fetchFollowCounts() {
		try {
			const followersResponse = await fetch(
				`/api/followlist?userId=${profile.id}&type=followers&page=1`
			);
			const followingResponse = await fetch(
				`/api/followlist?userId=${profile.id}&type=following&page=1`
			);

			if (followersResponse.ok && followingResponse.ok) {
				const followersData = await followersResponse.json();
				const followingData = await followingResponse.json();
				followersCount = parseInt(followersData.totalCount);
				followingCount = parseInt(followingData.totalCount);
			} else {
				toast('Failed to fetch follow counts');
			}
		} catch (error) {
			if (isSelf) return;
			console.error('Error fetching follow counts:', error);
			toast('Failed to fetch follow counts');
		}
	}
	let avatar: string;
	onMount(async () => {
		await fetchProfile();
		await Promise.all([fetchUserLynts(false), checkFollowStatus(), fetchFollowCounts()]);
		loading = false;
		avatar = cdnUrl(profile.id, 'big');
	});
</script>

{#if loading}
	<LoadingSpinner />
{:else if profile}
	<div class="h-full w-full flex-grow overflow-hidden pl-1">
		<div class="mr-[-17px] h-full overflow-y-auto overflow-x-hidden pr-[17px]">
			<div class="mt-2">
				<div class="flex items-center justify-between px-2">
					<div class="flex items-center gap-4">
						<Avatar size={40} src={avatar} alt={profile.username} border={true} />
						<div class="flex flex-col gap-2">
							<div class="inline-flex items-center gap-2">

								<Label class="text-2xl font-bold text-primary break-all">{profile.username}</Label>



								{#if profile.verified}
									<Tooltip.Root>
										<Tooltip.Trigger>
											<div class="flex h-full w-7 items-center">
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
							</div>

							<p class="text-xl text-muted-foreground break-all">@{profile.handle}</p>
							

							<div class="w-24 w-full">
								{#if isSelf}
									<ProfileSettings
										userId={profile.id}
										username={profile.username}
										bio={profile.bio}
									/>
								{:else}

									<div class="flex flex-row gap-2">
										<Button class="w-full" on:click={toggleFollow}>
											{isFollowing ? 'Unfollow' : 'Follow'}
										</Button>
										{#if isFollowing && isFollowedBy}
											<Button
												class="w-full"
												on:click={() => {
													currentPage.set('messages/@' + profile.handle);
													goto('/messages/@' + profile.handle, {
														replaceState: true,
														noScroll: true
													});
												}}
											>
												Message
											</Button>
										{/if}
									</div>

							
									


								{/if}
							</div>
							{#if isFollowedBy}
								<p class="text-sm text-muted-foreground">Follows you</p>
							{/if}
						</div>
					</div>
					<div class="md:hidden {!isSelf ? 'hidden' : ''}">
						<ProfileButton />
					</div>
				</div>

				<div class="mt-4 inline-flex gap-4">
					<span
						class="cursor-pointer font-bold text-primary hover:underline"
						on:click={toggleFollowingPopup}
					>
						{followingCount.toLocaleString()} following
					</span>
					<span
						class="cursor-pointer font-bold text-primary hover:underline"
						on:click={toggleFollowersPopup}
					>
						{followersCount.toLocaleString()} followers
					</span>
				</div>

				<FollowListPopup
					userId={profile.id}
					type="following"
					isOpen={showFollowingPopup}
					onClose={toggleFollowingPopup}
				/>

				<FollowListPopup
					userId={profile.id}
					type="followers"
					isOpen={showFollowersPopup}
					onClose={toggleFollowersPopup}
				/>

				<blockquote
					class="my-4 flex flex-col gap-2 border-s-4 border-muted-foreground bg-border p-4"
				>
					<Label class="text-lg font-bold text-primary">About me</Label>
					<p>
						{profile.bio}
					</p>

					<div class="flex items-center justify-between">
						<div
							class="flex select-none items-center gap-2 rounded-xl border border-transparent bg-primary px-1.5 py-0.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
						>
							<Brain />
							<span>{profile.iq}</span>
						</div>
						<div
							class="inline-flex select-none items-center gap-2 rounded-xl border border-transparent bg-primary px-1.5 py-0.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
						>
							<Calendar />
							<p>Joined: {new Date(profile.created_at).toLocaleDateString()}</p>
						</div>
					</div>
				</blockquote>
			</div>

			<div class="flex max-w-[600px] flex-col gap-3">
				<Separator class="mt-3" />
				<TopTab {tabs} {currentTab} onTabChange={handleTabChange} />
				<Separator />
				{#if userLynts.length === 0}
					<p>No lynts yet.</p>
				{:else}
					{#each userLynts as lynt}
						<Lynt {...lynt} {myId} lyntClick={handleLyntClick} on:delete={({ detail: { id }}) => {
							userLynts = userLynts.filter((item) => item.id !== id);
						}} />
					{/each}
				{/if}
			</div>
		</div>
	</div>
{:else}
	<p>Profile not found.</p>
{/if}

<svelte:head>
	{#if loading}
		<title>Loading... | Lyntr</title>
	{:else if profile}
		<title>{profile.username} (@{profile.handle}) | Lyntr</title>
		<meta property="og:title" content="{profile.username} (@{profile.handle}) | IQ: {profile.iq}" />
		<meta property="og:type" content="website" />
		<meta property="og:image" content="https://cdn.lyntr.com/lyntr/{profile.id}.webp" />
		<meta property="og:url" content="https://lyntr.com/@{profile.handle}" />
		<meta property="og:description" content="{profile.bio}" />
		<meta name="description" content="Lyntr is a micro-blogging social media with an IQ test." />
	{:else}
		<title>Profile not found | Lyntr</title>
	{/if}



</svelte:head>

