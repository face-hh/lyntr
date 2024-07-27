<script lang="ts">
	import type { Writable } from 'svelte/store';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Label } from '@/components/ui/label';
	import { writable } from 'svelte/store';

	export let isButtonDisabled: Writable<boolean>;
	export let submittedValue: Writable<string>;

	$isButtonDisabled = true;

	let secondQuestion = false;

	function handleFirstRadioClick() {
		$isButtonDisabled = false;
	}
</script>

<span class="select-none">Do you know these types of accounts?</span>
<div class="flex justify-center">
	<img src="gimmick.jpg" alt="Engagement bait example" class="h-44 w-full" />
</div>

<RadioGroup.Root bind:value={$submittedValue}>
	<div class="flex items-center space-x-2">
		<RadioGroup.Item value="true" id="r1" on:click={() => (secondQuestion = true)} />
		<Label for="r1">Yes.</Label>
	</div>
	<div class="flex items-center space-x-2">
		<RadioGroup.Item value="false" id="r2" on:click={() => (secondQuestion = true)} />
		<Label for="r2">No.</Label>
	</div>
	<RadioGroup.Input name="spacing" />
</RadioGroup.Root>

{#if secondQuestion}
	<div class="mt-2">
		<span class="select-none">Do you like them?</span>
		<RadioGroup.Root>
			<div class="flex items-center space-x-2">
				<RadioGroup.Item value="like" id="r3" on:click={handleFirstRadioClick} />
				<Label for="r3">Yes.</Label>
			</div>
			<div class="flex items-center space-x-2">
				<RadioGroup.Item value="dislike" id="r4" on:click={handleFirstRadioClick} />
				<Label for="r4">No.</Label>
			</div>
			<RadioGroup.Input name="liking" />
		</RadioGroup.Root>
	</div>
{/if}
