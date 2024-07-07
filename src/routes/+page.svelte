<script lang="ts">
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
</script>

<div class="flex h-screen overflow-hidden gap-4 justify-center">
	<div class="static ml-5 mt-5 inline-flex w-auto flex-col items-start gap-2">
		<img class="mb-5 size-20 cursor-pointer" src="logo.svg" alt="Logo" />

		<Navigation />
		<PostButton />
		<ProfileButton src="https://github.com/face-hh.png" name="Face" handle="@facedevstuff" />
	</div>
	<Separator orientation="vertical" />

	<div class="w-[600px] flex flex-col overflow-hidden">
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
		<div class="no-scrollbar flex flex-col gap-4 overflow-y-auto flex-grow">
			<Lynt username="Face" handle="facedevstuff" postedAt={new Date(1468959781804)} verified={true} />
			<Lynt username="That one LONG username. haha" handle="thatonelongusernamereal" postedAt={new Date(1468959781804)} verified={false} />
			<Lynt username="." handle="a" postedAt={new Date(1468959781804)} verified={false} />
			<Lynt username="ABC news" handle="abc" postedAt={new Date(1468959781804)} verified={true} />
			<Lynt username="Face" handle="facedevstuff" postedAt={new Date(1468959781804)} verified={true} />
			<Lynt username="That one LONG username." handle="thatonelongusername" postedAt={new Date(1468959781804)} verified={false} />
			<Lynt username="." handle="a" postedAt={new Date(1468959781804)} verified={false} />
			<Lynt username="ABC news" handle="abc" postedAt={new Date(1468959781804)} verified={true} />
			<Lynt username="Face" handle="facedevstuff" postedAt={new Date(1468959781804)} verified={true} />
			<Lynt username="That one LONG username." handle="thatonelongusername" postedAt={new Date(1468959781804)} verified={false} />
			<Lynt username="." handle="a" postedAt={new Date(1468959781804)} verified={false} />
			<Lynt username="ABC news" handle="abc" postedAt={new Date(1468959781804)} verified={true} />
			<div class="mt-24"></div>
		</div>
	</div>
	<Separator orientation="vertical" />

	<div class="w-[500px] space-y-2 mt-1 no-scrollbar overflow-y-auto" >
		<Lynt username="Face" handle="facedevstuff" postedAt={new Date(1468959781804)} verified={true} />
		
		<div class="w-full rounded-xl bg-border p-3 inline-flex gap-2 items-center">
			<Reply size={32} />
			
			<div
				contenteditable="true"
				role="textbox"
				spellcheck="true"
				tabindex="0"
				bind:textContent={comment}
				class="overflow-wrap-anywhere w-full outline-none text-lg"
				placeholder="Reply..."
			/>

			<Button>Post</Button>
		</div>
		<Separator />
		<div class="space-y-2">
			<Lynt username="Face" handle="facedevstuff" postedAt={new Date(1468959781804)} verified={true} />
			<Lynt username="Face" handle="facedevstuff" postedAt={new Date(1468959781804)} verified={true} />
			<Lynt username="Face" handle="facedevstuff" postedAt={new Date(1468959781804)} verified={true} />
			<Lynt username="Face" handle="facedevstuff" postedAt={new Date(1468959781804)} verified={true} />
			<Lynt username="Face" handle="facedevstuff" postedAt={new Date(1468959781804)} verified={true} />
			<Lynt username="Face" handle="facedevstuff" postedAt={new Date(1468959781804)} verified={true} />
		</div>
	</div>
</div>