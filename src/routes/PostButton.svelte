<script lang="ts">
	import { buttonVariants } from '@/components/ui/button/index';
	import * as Dialog from '@/components/ui/dialog/index';
	import * as Form from '@/components/ui/form/index';
	import Avatar from './Avatar.svelte';
	import { toast } from 'svelte-sonner';
	import { ImageUp } from 'lucide-svelte';
	import { cdnUrl } from './stores';
	import DivInput from './DivInput.svelte';

	export let userId: string;
	let className: $$Props['class'] = undefined;
	export { className as class };

	let lynt = '';
	let opened = false;
	let postDisabled = true;

	let image: File | null = null;
	let imagePreview: string | null = null;
	let fileinput: HTMLInputElement;

	const onFileSelected = (e: Event) => {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			image = target.files[0];
			let reader = new FileReader();
			reader.readAsDataURL(image);
			reader.onload = (e) => {
				imagePreview = e.target?.result as string;
			};

			postDisabled = false;
		}
	};

	async function handlePost() {
		if (lynt.trim() == '' && image == null) {
			toast("Cannot post an empty lynt.");
			return;
		}

		const formData = new FormData();

		formData.append('content', lynt);

		if (image) {
			formData.append('image', image, image.name);
		}

	        postDisabled = true;
		const response = await fetch('/api/lynt', {
			method: 'POST',
			body: formData
		});

		if (response.status === 201) {
			opened = false;
                        lynt = '';
                        imagePreview = null;
                        fileinput.value = "";
                        image = null;
			toast('Your lynt has been published!');
		} else {
			if (response.status == 429)
				return toast('Woah, slow down! You are being ratelimited. Please try again in a bit.');
			toast(`Something happened! Error: ${response.status} | ${response.statusText}`);
		}
		postDisabled = false;
	}

	function checkPostButton() {
		if (lynt.trim() == '' && image == null) {
			postDisabled = true;
		} else {
			postDisabled = false;
		}
	}
</script>

<Dialog.Root bind:open={opened}>
	<Dialog.Trigger
		class={`${buttonVariants({ variant: 'default' })} w-full ${className}`}
		on:click={() => { opened = true; checkPostButton(); }}><slot>Post</slot></Dialog.Trigger
	>
	<Dialog.Content class="sm:max-w-[500px]">
		<div class="flex items-start space-x-3">
			<Avatar size={10} src={cdnUrl(userId, 'small')} alt="Your profile picture." />

			<div class="flex h-full flex-grow flex-col gap-2">
				<div class="max-h-[600px] overflow-y-auto">
					<DivInput bind:lynt on:input={checkPostButton}/>

					{#if imagePreview}
						<img class="max-h-[600px] w-full object-contain" src={imagePreview} alt="Preview" />
					{/if}
				</div>
				<button
					on:click={() => {
						fileinput.click();
					}}
				>
					<ImageUp class="upload" />
				</button>

				<input
					style="display:none"
					type="file"
					accept=".jpg, .jpeg, .png, .gif"
					on:change={onFileSelected}
					bind:this={fileinput}
				/>
			</div>
		</div>

		<div class="flex justify-end">
			<Form.Button on:click={handlePost} disabled={postDisabled}>
				Post
			</Form.Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
