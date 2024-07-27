<script lang="ts">
	import type { Writable } from 'svelte/store';
	import { Magnifier } from 'svelte-magnifier';
	import { Label } from '@/components/ui/label';
	import { Slider } from '@/components/ui/slider';

	export let isButtonDisabled: Writable<boolean>;
	export let submittedValue: Writable<string>;

	$isButtonDisabled = true;

	let sliderValue = [0];

	// Reactive statement to watch for changes in sliderValue
	$: {
		$submittedValue = sliderValue[0].toString();
		$isButtonDisabled = false;
	}
</script>

<span class="select-none">How many people do you recognise in this picture?</span>
<div class="flex justify-center">
	<Magnifier alt="A bunch of people." src="content_creators.jpg" width="300px" />
</div>
<Label>{sliderValue[0]} people</Label>
<Slider bind:value={sliderValue} max={47} step={1} />
