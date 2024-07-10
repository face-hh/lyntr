<script lang="ts">
	import * as AlertDialog from '@/components/ui/alert-dialog';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import Label from '@/components/ui/label/label.svelte';
	import { supabase } from '@/supabase';

	import IQTest from './IQTest.svelte';

	let loading = false;
	let nickname = '';
    let username = '';

	const handleSubmit = async () => {
		
	};
</script>

<div class="flex h-screen">
	<div class="m-auto flex flex-col items-center gap-2">
		<div class="inline-flex items-center gap-2">
			<img src="logo.svg" alt="Lyntr" class="pointer-events-none h-40 w-40 select-none" />
			<Label class="select-none text-8xl">Lyntr.</Label>
		</div>

		<p class="text-3xl">Welcome onboard!</p>
		<p class="text-3xl">Let's get you started.</p>

		<div class="flex w-full flex-col gap-5">
			<div class="flex flex-col gap-1.5">
				<Label for="email-2" placeholder="Nickname...">Nickname</Label>
				<Input
					type="email"
					id="email-2"
					placeholder="FaceDev"
					class="border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                    bind:value={nickname}
				/>
				<p class="text-sm text-muted-foreground">Enter your desired nickname (max. 60 char.)</p>
			</div>

			<div class="flex flex-col gap-1.5">
				<Label for="email-2">Username</Label>
				<Input
					type="email"
					id="email-2"
					placeholder="@facedev"
					class="border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                    bind:value={username}
				/>
				<p class="text-sm text-muted-foreground">Enter your permanent username (max. 32 char.)</p>
			</div>

			<IQTest />
			<AlertDialog.Root>
				<AlertDialog.Trigger asChild let:builder>
					<Button builders={[builder]} on:click={handleSubmit} disabled={loading}
						>{loading ? 'Loading' : "Let's go!"}</Button
					>
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Check your email!</AlertDialog.Title>
						<AlertDialog.Description>
							A one-time-password have been sent to your email.
						</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Action>Continue</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
		</div>
	</div>
</div>
