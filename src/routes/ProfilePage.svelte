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

	export let profileHandle: string;

	let profile: {
		username: string;
		handle: string;
		iq: number;
		created_at: string;
		id: string;
		following: number;
		followers: number;
	};
	let userLynts: any[] = [];
	let loading = true;

	async function fetchProfile() {
		try {
			const response = await fetch(`/api/profile?handle=${profileHandle}`);

			if (response.status === 200) {
				profile = await response.json();
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

	onMount(async () => {
		await Promise.all([fetchProfile(), fetchUserLynts()]);
		loading = false;
		console.log(userLynts);
	});
</script>

{#if loading}
	<LoadingSpinner />
{:else if profile}
	<div class="w-full flex-grow overflow-hidden">
		<div class="mr-[-17px] h-full overflow-y-auto overflow-x-hidden pr-[17px]">
			<div class="mt-2">
				<!-- <img src={`/cdn/${profile.id}.jpg`} alt={profile.username} class="profile-picture" /> -->

				<div class="flex items-center gap-4">
					<Avatar
						size={40}
						src="https://github.com/face-hh.png"
						alt={profile.username}
						border={true}
					/>
					<div class="flex flex-col gap-2">
						<Label class="text-2xl font-bold text-primary">{profile.username}</Label>
						<p class="text-xl text-muted-foreground">@{profile.handle}</p>
						<div class="w-24">
							<Button class="w-full">Follow</Button>
						</div>
					</div>
				</div>

				<div class="mt-4 inline-flex gap-4">
					<span
						class="flex select-none items-center rounded-xl border border-transparent bg-primary px-1.5 py-0.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
						>{profile.following} following</span
					>
					<span
						class="flex select-none items-center rounded-xl border border-transparent bg-primary px-1.5 py-0.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
						>{profile.followers} followers</span
					>
				</div>

				<blockquote
					class="my-4 flex flex-col gap-2 border-s-4 border-muted-foreground bg-border p-4"
				>
					<Label class="text-lg font-bold text-primary">About me</Label>
					<p>
						Lorem ipsum this is a fucking test i have no idea how lorem ipsums are written so yeah
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
						<Lynt {...lynt} />
					{/each}
				{/if}
			</div>
		</div>
	</div>
{:else}
	<p>Profile not found.</p>
{/if}
