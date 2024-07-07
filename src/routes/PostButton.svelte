<script>
	import { buttonVariants } from '@/components/ui/button/index';
	import * as Dialog from '@/components/ui/dialog/index';
	import * as Form from '@/components/ui/form/index';
	import Avatar from './Avatar.svelte';

    let lynt = '';
</script>

<Dialog.Root>
	<Dialog.Trigger class={`${buttonVariants({ variant: 'default' })} w-full`}>Post</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[425px]">
		<div class="flex items-start space-x-3">
			<Avatar size={10} src="https://github.com/face-hh.png" alt="Your profile picture." />

			<div class="flex-grow">
				<div
					contenteditable="true"
					role="textbox"
					spellcheck="true"
					tabindex="0"
					bind:textContent={lynt}
					class="overflow-wrap-anywhere min-h-[80px] w-full outline-none"
					placeholder="What's happening?"
				/>
			</div>
		</div>

		<div class="flex justify-end">
			<Form.Button>Post</Form.Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
