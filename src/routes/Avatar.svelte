<script>
	export let size = 12;
	export let src = 'https://github.com/face-hh.png';
	export let alt = 'Avatar';
	export let border = false;
</script>

<img {src} {alt} class="h-{size} w-{size} rounded-full {border ? 'border-2 border-solid border-primary' : ''}" />