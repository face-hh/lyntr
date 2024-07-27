<script lang="ts">
	import type { Writable } from 'svelte/store';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Label } from '@/components/ui/label';
	import { Input } from '@/components/ui/input';

	export let isButtonDisabled: Writable<boolean>;
	export let submittedValue: Writable<string>;

	$isButtonDisabled = true;

	let answer = '';

	function updateSubmittedValue() {
		$submittedValue = answer;
		$isButtonDisabled = false;
	}
</script>

<div class="flex justify-center">
	<img src="math.png" alt="Math problem" />
</div>

<div class="flex w-full max-w-sm flex-col gap-1.5">
	<Label for="width">Answer</Label>
	<Input
		type="number"
		id="width"
		placeholder="0..."
		bind:value={answer}
		on:input={updateSubmittedValue}
	/>
</div>
