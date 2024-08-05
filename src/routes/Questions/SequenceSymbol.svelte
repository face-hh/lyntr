<script lang="ts">
	import type { Writable } from 'svelte/store';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Label } from '@/components/ui/label';

	export let isButtonDisabled: Writable<boolean>;
	export let submittedValue: Writable<string>;

	$isButtonDisabled = true;
</script>

<span class="select-none">What is the next symbol in this pattern?</span>
<span class="select-none text-4xl">▲ ■ ● ▲ ● ■ ■ ■</span>
<RadioGroup.Root bind:value={$submittedValue}>
	<div class="flex items-center space-x-2">
		<RadioGroup.Item value="wrong" id="r1" on:click={() => ($isButtonDisabled = false)} />
		<Label for="r1">▲</Label>
	</div>
	<div class="flex items-center space-x-2">
		<RadioGroup.Item value="wrong2" id="r2" on:click={() => ($isButtonDisabled = false)} />
		<Label for="r2">■</Label>
	</div>
	<div class="flex items-center space-x-2">
		<RadioGroup.Item value="wrong3" id="r3" on:click={() => ($isButtonDisabled = false)} />
		<Label for="r3">●</Label>
	</div>
	<div class="flex items-center space-x-2">
		<RadioGroup.Item value="idfk" id="r4" on:click={() => ($isButtonDisabled = false)} />
		<Label for="r4">i have no fucking idea</Label>
	</div>
	<RadioGroup.Input name="spacing" />
</RadioGroup.Root>
