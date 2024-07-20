<!-- src/components/ProfilePage.svelte -->
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

	export let profileHandle: string;
	export let handleLyntClick;

	let profile: {
		username: string;
		handle: string;
		iq: number;
		created_at: string;
		id: string;
		following: number;
		followers: number;
		bio: string,
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

	function toggleFollowersPopup() {
		console.log(followersCount);
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
			console.error('Error fetching profile:', error);
			toast('Failed to load profile');
		}
	}

	async function fetchUserLynts() {
		try {
			const response = await fetch(`/api/feed?handle=${profileHandle}`);

			if (response.status === 200) {
				userLynts = await response.json();
			} else {
				toast(`Failed to load user lynts. Error: ${response.status}`);
			}
		} catch (error) {
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
				const result = await response.json();
				toast(result.message);
				isFollowing = !isFollowing;
				followersCount += isFollowing ? 1 : -1;
			} else {
				const error = await response.json();
				toast(error.error);
			}
		} catch (error) {
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
			console.error('Error fetching follow counts:', error);
			toast('Failed to fetch follow counts');
		}
	}
	let avatar: string;
	onMount(async () => {
		await fetchProfile();
		await Promise.all([fetchUserLynts(), checkFollowStatus(), fetchFollowCounts()]);
		loading = false;
		avatar = `http://localhost:9000/lyntr/${profile.id}_big.webp`;
	});
</script>

{#if loading}
	<LoadingSpinner />
{:else if profile}
	<div class="w-full flex-grow overflow-hidden">
		<div class="mr-[-17px] h-full overflow-y-auto overflow-x-hidden pr-[17px]">
			<div class="mt-2">
				<div class="flex items-center gap-4">
					<Avatar size={40} src={avatar} alt={profile.username} border={true} />
					<div class="flex flex-col gap-2">
						<Label class="text-2xl font-bold text-primary">{profile.username}</Label>
						<p class="text-xl text-muted-foreground">@{profile.handle}</p>
						<div class="w-24">
							{#if isSelf}
								<ProfileSettings userId={profile.id} username={profile.username} bio={profile.bio} />
							{:else}
								<Button class="w-full" on:click={toggleFollow}>
									{isFollowing ? 'Unfollow' : 'Follow'}
								</Button>
							{/if}
						</div>
						{#if isFollowedBy}
							<p class="text-sm text-muted-foreground">Follows you</p>
						{/if}
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

			<div class="flex flex-col gap-3">
				<Separator />
				{#if userLynts.length === 0}
					<p>No lynts yet.</p>
				{:else}
					{#each userLynts.lynts as lynt}
						<Lynt {...lynt} lyntClick={handleLyntClick} />
					{/each}
				{/if}
			</div>
		</div>
	</div>
{:else}
	<p>Profile not found.</p>
{/if}
