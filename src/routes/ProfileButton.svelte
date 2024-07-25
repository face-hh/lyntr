<script lang="ts">
	import Avatar from './Avatar.svelte';
	import * as Popover from '@/components/ui/popover';
	import { Button } from '@/components/ui/button';
	import { CheckCircle, FileText, ShieldCheck } from 'lucide-svelte';
	import OutlineButton from './OutlineButton.svelte';
	import { goto } from '$app/navigation';

	let opened = false;

	export let src = 'https://github.com/face-hh.png';
	export let name = 'Face oifneoangoaen kfpeakfpae';
	export let handle = '@facedevstuff';
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
				on:click={() => window.location.href = 'https://discord.gg/XEXebe7Qzf'}
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
		</div>
	</Popover.Content>
</Popover.Root>
