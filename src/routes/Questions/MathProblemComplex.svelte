<script lang="ts">
	import type { Writable } from 'svelte/store';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Label } from '@/components/ui/label';
	import { Input } from '@/components/ui/input';

	export let isButtonDisabled: Writable<boolean>;
	export let submittedValue: Writable<string>;

	$isButtonDisabled = true;

	let width = '';
	let length = '';
	let height = '';

	function updateSubmittedValue() {
		$submittedValue = `${width}-${height}-${length}`;
		$isButtonDisabled = !(width && height && length);
	}
</script>

<span class="select-none text-wrap"
	>A rectangular prism has a length that is twice its width. The height is 3 units less than the
	width. If the volume of the prism is 280 cubic units, find the dimensions of the prism.</span
>

<div class="flex w-full max-w-sm flex-col gap-1.5">
	<Label for="width">Width</Label>
	<Input
		type="number"
		id="width"
		placeholder="0..."
		bind:value={width}
		on:input={updateSubmittedValue}
	/>
</div>

<div class="flex w-full max-w-sm flex-col gap-1.5">
	<Label for="length">Length</Label>
	<Input
		type="number"
		id="length"
		placeholder="0..."
		bind:value={length}
		on:input={updateSubmittedValue}
	/>
</div>

<div class="flex w-full max-w-sm flex-col gap-1.5">
	<Label for="height">Height</Label>
	<Input
		type="number"
		id="height"
		placeholder="0..."
		bind:value={height}
		on:input={updateSubmittedValue}
	/>
</div>