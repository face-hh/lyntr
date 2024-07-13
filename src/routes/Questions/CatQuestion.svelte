<script lang="ts">
	import type { Writable } from 'svelte/store';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Label } from '@/components/ui/label';

	export let isButtonDisabled: Writable<boolean>;
	export let submittedValue: Writable<string>;

	$isButtonDisabled = true;
</script>

<span class="select-none">Do you promise to have a cat profile picture? :3</span>
<div class="flex justify-center">
	<img src="cat.gif" alt="Cat :3" class="h-40 w-40" />
</div>
<RadioGroup.Root bind:value={$submittedValue}>
	<div class="flex items-center space-x-2">
		<RadioGroup.Item value="true" id="r5" on:click={() => ($isButtonDisabled = false)} />
		<Label for="r1">Yes.</Label>
	</div>
	<div class="flex items-center space-x-2">
		<RadioGroup.Item value="false" id="r6" on:click={() => ($isButtonDisabled = false)} />
		<Label for="r2">No.</Label>
	</div>
	<RadioGroup.Input name="spacing" />
</RadioGroup.Root>
