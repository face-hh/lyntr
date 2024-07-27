<script lang="ts">
	import Avatar from './Avatar.svelte';
	import * as Popover from '@/components/ui/popover';
	import { Button } from '@/components/ui/button';
	import { CheckCircle, FileText, LogOut, ShieldCheck, UserX } from 'lucide-svelte';
	import OutlineButton from './OutlineButton.svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	let opened = false;

	export let src = 'https://github.com/face-hh.png';
	export let name = 'Face oifneoangoaen kfpeakfpae';
	export let handle = '@facedevstuff';

	function deleteAccount() {
		if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
			fetch('/api/profile', {
				method: 'DELETE'
			})
				.then((response) => {
					if (response.ok) {
						goto('/');
						window.location.reload();
					} else {
						toast('Failed to delete account');
					}
				})
				.catch((error) => {
					toast('Error:', error);
				});
		}
	}

	function deleteAllCookies() {
		document.cookie.split(';').forEach((cookie) => {
			const eqPos = cookie.indexOf('=');
			const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
			document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
		});
	}

	async function logout() {
		const response = await fetch('api/logout', { method: 'POST' });

		if (response.status !== 200)
			return toast(
				`Server failed to log you out. Error: ${response.status} | ${response.statusText}`
			);

		deleteAllCookies();
		location.reload();
	}
</script>

<Popover.Root bind:open={opened}>
	<Popover.Trigger asChild let:builder>
		<button
			{...builder}
			on:click={() => (opened = !opened)}
			class="absolute bottom-2 flex w-[250px] max-w-md cursor-pointer items-center gap-4 rounded-full bg-border p-4"
		>
			<Avatar size={12} {src} alt="Your profile picture." />
			<div class="flex flex-col gap-2 overflow-hidden">
				<span class="truncate text-lg font-medium leading-none peer-enabled:cursor-pointer">
					{name}
				</span>
				<span class="text-sm font-medium leading-none text-muted-foreground">
					{handle}
				</span>
			</div>
		</button>
	</Popover.Trigger>
	<Popover.Content class="w-60">
		<div class="grid gap-6">
			<OutlineButton
				icon={CheckCircle}
				text="Verify my account"
				outline={false}
				on:click={() => (window.location.href = 'https://discord.gg/XEXebe7Qzf')}
			/>
			<OutlineButton
				icon={FileText}
				text="Terms of Service"
				outline={false}
				on:click={() => goto('/tos')}
			/>
			<OutlineButton
				icon={ShieldCheck}
				text="Privacy Policy"
				outline={false}
				on:click={() => goto('/privacy')}
			/>
			<OutlineButton icon={UserX} text="Delete account" outline={false} on:click={deleteAccount} />
			<OutlineButton icon={LogOut} text="Log out" outline={false} on:click={logout} />
		</div>
	</Popover.Content>
</Popover.Root>
