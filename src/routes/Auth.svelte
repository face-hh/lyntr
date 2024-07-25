<script lang="ts">
	import * as AlertDialog from '@/components/ui/alert-dialog';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import Label from '@/components/ui/label/label.svelte';
	import { supabase } from '@/supabase';

	let loading = false;
	let email = '';

	const handleLogin = async () => {
		try {
			loading = true;
			const { error } = await supabase.auth.signInWithOtp({ email });

			if (error) throw error;
		} catch (error) {
			if (error instanceof Error) {
				alert(error.message);
			}
		} finally {
			loading = false;
		}
	};
</script>

<div class="flex h-screen">
	<div class="m-auto flex flex-col items-center gap-2">
		<div class="inline-flex items-center gap-2">
			<img src="logo.svg" alt="Lyntr" class="pointer-events-none h-40 w-40 select-none" />
			<Label class="select-none text-8xl">Lyntr.</Label>
		</div>

		<Label class="text-3xl">Please input your email below.</Label>

        <div class="flex w-full items-center space-x-2">
		<Input
			type="email"
			placeholder="johndoe@gmail.com"
			class="border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
            bind:value={email}
		/>

		<AlertDialog.Root>
			<AlertDialog.Trigger asChild let:builder>
				<Button builders={[builder]} on:click={handleLogin} disabled={loading}
					>{loading ? 'Loading' : 'Send magic link'}</Button
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
