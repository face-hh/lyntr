<script lang="ts">
	import { buttonVariants } from '@/components/ui/button/index';
	import * as Dialog from '@/components/ui/dialog/index';
	import * as Form from '@/components/ui/form/index';
	import Avatar from './Avatar.svelte';
	import { toast } from 'svelte-sonner';
	import { Label } from '@/components/ui/label';
	import { Input } from '@/components/ui/input';
	import { cdnUrl } from './stores';

	export let userId: string;
	export let username: string;
	export let bio: string;

	let opened = false;

	let avatarSrc: any;

	function handleAvatarChange(shit) {
		avatarSrc = shit.detail.file;
	}

	async function handleSave() {
		const response = await fetch('api/profile', {
			method: 'PATCH',
			body: JSON.stringify({
				bio,
				username
			})
		});

		if (response.status === 200) {
			opened = false;
			toast('Your profile has been successfully updated!');
		} else {
			toast(`Something happened! Error: ${response.status} | ${response.statusText}`);
		}

		if (!avatarSrc) return;

		const formData = new FormData();

		formData.append('file', avatarSrc);

		const pfpRes = await fetch('api/upload', {
			method: 'POST',
			body: formData
		});

		if (pfpRes.status === 200) {
			opened = false;
		} else {
			if (pfpRes.status == 400) {
				toast(`Uploading photo failed. ${(await pfpRes.json()).error}`);
				return;
			}
			toast(
				`Uploading photo failed. Common cause is file size being over 8MB. Error code: ${pfpRes.status} | ${pfpRes.statusText}`
			);
		}
	}
</script>

<Dialog.Root bind:open={opened}>
	<Dialog.Trigger
		class={`${buttonVariants({ variant: 'default' })} w-full`}
		on:click={() => (opened = true)}>Edit Profile</Dialog.Trigger
	>
	<Dialog.Content class="sm:max-w-[500px]">
		<div class="flex items-start space-x-3">
			<Avatar
				size={40}
				src={cdnUrl(userId, 'big')}
				alt="Your profile picture."
				border={true}
				editable={true}
				on:change={handleAvatarChange}
			/>

			<div class="flex flex-grow flex-col gap-2">
				<div class="flex w-full max-w-sm flex-col gap-1.5">
					<Label for="email">Username</Label>
					<Input type="email" id="email" placeholder="Username" bind:value={username} />
				</div>

				<div class="flex w-full max-w-sm flex-col gap-1.5">
					<Label for="email">About me</Label>
					<Input type="email" id="email" placeholder="About me..." bind:value={bio} />
				</div>
			</div>
		</div>

		<div class="flex justify-end">
			<Form.Button on:click={handleSave}>Save</Form.Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
