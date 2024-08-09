<script lang="ts">
	import { Button } from '@/components/ui/button';
	import * as Dialog from '@/components/ui/dialog';
	import { Label } from '@/components/ui/label';
	import { Textarea } from '@/components/ui/textarea';
	import { Flag } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let min = 50;
	let max = 2000;

	let opened = false;
	let reportText = '';
	let characterCount = 0;
	let isValid = false;
	let isSubmitting = false;
	let submitError = '';

	export let userId: string;
	export let lyntId: string;

	function handleInput(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		reportText = target.value;
		characterCount = reportText.length;
		isValid = characterCount >= min && characterCount <= max;
	}

	async function handleSubmit() {
		if (isValid) {
			isSubmitting = true;
			submitError = '';

			try {
				const response = await fetch('/api/report', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						text: reportText,
						userId, // Use this for profile reports
						lyntId // Use this for lynt reports
					})
				});

				if (!response.ok) {
					if (response.status == 429)
						throw new Error(
							'Woah, slow down! You are being ratelimited. Please try again in a bit.'
						);

					throw new Error('Failed to submit report');
				}

				const result = await response.json();

				opened = false;
				reportText = ''; // Clear the report text
			} catch (error) {
				console.error('Error submitting report:', error);
				submitError = 'Failed to submit report. Please try again.';
			} finally {
				isSubmitting = false;
			}
		}
	}
</script>

<Dialog.Root bind:open={opened}>
	<Dialog.Trigger>
		<button
			on:click={() => (opened = true)}
			class="flex items-center gap-3 rounded-lg p-3 text-sm hover:bg-lynt-foreground"
		>
			<Flag class="h-5 w-5 text-muted-foreground" />
			<span>Report</span>
		</button>
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Report.</Dialog.Title>
			<Dialog.Description>
				By submitting this report, you confirm that the reported content does not belong on Lyntr.
				Abuse of this system will result in the suspension of your account.
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid w-full gap-2">
			<Label for="message">
				Please provide a brief explanation of why you think the reported content is wrong.
			</Label>
			<Textarea
				placeholder="Type the details here."
				id="message"
				bind:value={reportText}
				on:input={handleInput}
				class={characterCount > 0 && !isValid ? 'border-red-500' : ''}
				disabled={isSubmitting}
			/>
			<div class="text-sm text-gray-500">
				{characterCount} / {max} characters
				{#if characterCount > 0 && characterCount < min}
					<span class="text-red-500"> (Minimum {min} characters required)</span>
				{:else if characterCount > max}
					<span class="text-red-500"> (Maximum {max} characters exceeded)</span>
				{/if}
			</div>
			{#if submitError}
				<div class="text-sm text-red-500">{submitError}</div>
			{/if}
		</div>
		<Dialog.Footer>
			<Button on:click={handleSubmit} type="submit" disabled={!isValid || isSubmitting}>
				{isSubmitting ? 'Submitting...' : 'Submit'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
