<script lang="ts">
	import { onMount } from 'svelte';
	import type { AuthSession } from '@supabase/supabase-js';
	import { supabase } from '@/supabase';

	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { Reply } from 'lucide-svelte';

	import Lynt from './Lynt.svelte';
	import Navigation from './Navigation.svelte';
	import PostButton from './PostButton.svelte';
	import ProfileButton from './ProfileButton.svelte';

	let currentTab = 'foryou';
	let comment: string;

	export let session: AuthSession;

	let loading = false;
	let username: string | null = null;
	let handle: string | null = null;
	let avatarUrl: string | null = null;

	onMount(() => {
		getProfile();
	});

	const getProfile = async () => {
		try {
			loading = true;
			const { user } = session;

			const response = await fetch('/api/profile?id=' + user.id);

			if (response.status == 200) {
				const res = await response.json();

				username = res.username;
				handle = res.handle;
				avatarUrl = res.avatar_url;
			} else throw "An error occured while gathering information about your account. Emptying your cookies might help.";

		} catch (error) {
			if (error instanceof Error) {
				alert(error.message);
			}
		} finally {
			loading = false;
		}
	};
</script>

<div class="flex h-screen justify-center gap-4 overflow-hidden">
	<div class="static ml-5 mt-5 inline-flex w-auto flex-col items-start gap-2">
		<img class="mb-5 size-20 cursor-pointer" src="logo.svg" alt="Logo" />

		<Navigation />
		<PostButton />
		<ProfileButton src="https://github.com/face-hh.png" name="Face" handle="@facedevstuff" />
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
			<Lynt
				username="Face"
				handle="facedevstuff"
				postedAt={new Date(1468959781804)}
				verified={true}
			/>
			<Lynt
				username="That one LONG username. haha"
				handle="thatonelongusernamereal"
				postedAt={new Date(1468959781804)}
				verified={false}
			/>
			<Lynt username="." handle="a" postedAt={new Date(1468959781804)} verified={false} />
			<Lynt username="ABC news" handle="abc" postedAt={new Date(1468959781804)} verified={true} />
			<Lynt
				username="Face"
				handle="facedevstuff"
				postedAt={new Date(1468959781804)}
				verified={true}
			/>
			<Lynt
				username="That one LONG username."
				handle="thatonelongusername"
				postedAt={new Date(1468959781804)}
				verified={false}
			/>
			<Lynt username="." handle="a" postedAt={new Date(1468959781804)} verified={false} />
			<Lynt username="ABC news" handle="abc" postedAt={new Date(1468959781804)} verified={true} />
			<Lynt
				username="Face"
				handle="facedevstuff"
				postedAt={new Date(1468959781804)}
				verified={true}
			/>
			<Lynt
				username="That one LONG username."
				handle="thatonelongusername"
				postedAt={new Date(1468959781804)}
				verified={false}
			/>
			<Lynt username="." handle="a" postedAt={new Date(1468959781804)} verified={false} />
			<Lynt username="ABC news" handle="abc" postedAt={new Date(1468959781804)} verified={true} />
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
			/>
			<Lynt
				username="Face"
				handle="facedevstuff"
				postedAt={new Date(1468959781804)}
				verified={true}
			/>
			<Lynt
				username="Face"
				handle="facedevstuff"
				postedAt={new Date(1468959781804)}
				verified={true}
			/>
			<Lynt
				username="Face"
				handle="facedevstuff"
				postedAt={new Date(1468959781804)}
				verified={true}
			/>
			<Lynt
				username="Face"
				handle="facedevstuff"
				postedAt={new Date(1468959781804)}
				verified={true}
			/>
			<Lynt
				username="Face"
				handle="facedevstuff"
				postedAt={new Date(1468959781804)}
				verified={true}
			/>
		</div>
	</div>
</div>