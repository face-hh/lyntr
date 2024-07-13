<script lang="ts">
	import { Input } from '@/components/ui/input';
	import type { Writable } from 'svelte/store';
	import { MusicPlayer } from '@/components/ui/musicplayer';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Label } from '@/components/ui/label';

	export let isButtonDisabled: Writable<boolean>;
	export let submittedValue: Writable<string>;

	$isButtonDisabled = true;
</script>

<span class="select-none">Do you recognise this audio?</span>
<MusicPlayer audioSrc="rick.mp3" />

<RadioGroup.Root bind:value={$submittedValue}>
	<div class="flex items-center space-x-2">
		<RadioGroup.Item value="true" id="r1" on:click={() => ($isButtonDisabled = false)} />
		<Label for="r1">Yes, I do.</Label>
	</div>
	<div class="flex items-center space-x-2">
		<RadioGroup.Item value="false" id="r2" on:click={() => ($isButtonDisabled = false)} />
		<Label for="r2">No, I don't.</Label>
	</div>
	<RadioGroup.Input name="spacing" />
</RadioGroup.Root>
