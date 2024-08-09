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
	<math xmlns="http://www.w3.org/1998/Math/MathML">
		<mrow>
			<msup>
				<mfenced>
					<mrow>
						<munderover>
							<mo>∑</mo>
							<mrow>
								<mi>k</mi>
								<mo>=</mo>
								<mn>0</mn>
							</mrow>
							<mo>∞</mo>
						</munderover>
						<msup>
							<mfrac>
								<mn>6</mn>
								<mn>7</mn>
							</mfrac>
							<mi>k</mi>
						</msup>
					</mrow>
				</mfenced>
				<mn>3</mn>
			</msup>
			<mo>+</mo>
			<mfenced>
				<mrow>
					<mfenced>
						<mrow>
							<munderover>
								<mo>∑</mo>
								<mrow>
									<mi>k</mi>
									<mo>=</mo>
									<mn>0</mn>
								</mrow>
								<mo>∞</mo>
							</munderover>
							<msup>
								<mfrac>
									<mn>7</mn>
									<mn>8</mn>
								</mfrac>
								<mi>k</mi>
							</msup>
						</mrow>
					</mfenced>
					<mo>+</mo>
					<munderover>
						<mo>∑</mo>
						<mrow>
							<mi>k</mi>
							<mo>=</mo>
							<mn>0</mn>
						</mrow>
						<mo>∞</mo>
					</munderover>
					<msup>
						<mfrac>
							<mn>3</mn>
							<mn>4</mn>
						</mfrac>
						<mi>k</mi>
					</msup>
				</mrow>
			</mfenced>
		</mrow>
	</math>
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
