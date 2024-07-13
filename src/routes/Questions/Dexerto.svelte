<script lang="ts">
	import type { Writable } from 'svelte/store';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Label } from '@/components/ui/label';

	export let isButtonDisabled: Writable<boolean>;
	export let submittedValue: Writable<string>;

	$isButtonDisabled = true;
</script>

<span class="select-none">Do you know this person?</span>
<div class="flex justify-center">
	<img src="https://yt3.googleusercontent.com/2G-nSF2OhOhdJQlYYyrOvb1mH0leXohZynpDW9bQ56hsJmJU1e11-bQPnQjOKS4tBnlS9sKC6g=s160-c-k-c0x00ffffff-no-rj" alt="Cat :3" class="h-40 w-40" />
</div>
<RadioGroup.Root bind:value={$submittedValue}>
	<div class="flex items-center space-x-2">
		<RadioGroup.Item value="true" id="r1" on:click={() => ($isButtonDisabled = false)} />
		<Label for="r1">Yes.</Label>
	</div>
	<div class="flex items-center space-x-2">
		<RadioGroup.Item value="false" id="r2" on:click={() => ($isButtonDisabled = false)} />
		<Label for="r2">No.</Label>
	</div>
	<RadioGroup.Input name="spacing" />
</RadioGroup.Root>
